import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Generic Mobile Money webhook: providers (CinetPay, Campay, NotchPay, custom)
 * POST a payload with { external_id, transaction_ref, status, amount } and an
 * HMAC-SHA256 signature over the raw body in the `x-webhook-signature` header.
 *
 * On `success`, we look up the matching payment by `transaction_ref`, mark it
 * verified, and — if it is tied to a booking — flip that booking to `confirmed`;
 * if it is tied to a subscription plan, we grant the subscription.
 */
export const Route = createFileRoute("/api/public/webhooks/mobile-money")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.MOBILE_MONEY_WEBHOOK_SECRET;
        if (!secret) return new Response("Webhook not configured", { status: 503 });

        const raw = await request.text();
        const sig = request.headers.get("x-webhook-signature") ?? "";
        const expected = createHmac("sha256", secret).update(raw).digest("hex");
        const a = Buffer.from(sig);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let body: {
          external_id?: string;
          transaction_ref?: string;
          status?: string;
          amount?: number;
          provider?: string;
        };
        try { body = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
        if (!body.external_id || !body.transaction_ref || !body.status) {
          return new Response("Missing fields", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency
        const { error: dupErr } = await supabaseAdmin
          .from("webhook_events")
          .insert({
            provider: body.provider ?? "mobile-money",
            external_id: body.external_id,
            payload: body,
          });
        if (dupErr && !String(dupErr.message).match(/duplicate/i)) {
          return new Response("DB error", { status: 500 });
        }
        if (dupErr) return new Response("Already processed", { status: 200 });

        if (body.status !== "success" && body.status !== "successful") {
          return new Response("ok", { status: 200 });
        }

        const { data: payment } = await supabaseAdmin
          .from("payments")
          .select("id, user_id, booking_id, plan_id, status, plan:subscription_plans(duration_days)")
          .eq("transaction_ref", body.transaction_ref)
          .maybeSingle();
        if (!payment) return new Response("Payment not found", { status: 404 });
        if (payment.status === "verified") return new Response("Already verified", { status: 200 });

        const now = new Date();
        await supabaseAdmin
          .from("payments")
          .update({ status: "verified", verified_at: now.toISOString() })
          .eq("id", payment.id);

        if (payment.booking_id) {
          await supabaseAdmin
            .from("bookings")
            .update({ status: "confirmed", payment_id: payment.id })
            .eq("id", payment.booking_id);
        } else if (payment.plan_id) {
          const days = (payment.plan as { duration_days: number } | null)?.duration_days ?? 30;
          const expires = new Date(now.getTime() + days * 86400000);
          await supabaseAdmin.from("subscriptions").insert({
            user_id: payment.user_id,
            plan_id: payment.plan_id,
            status: "active",
            starts_at: now.toISOString(),
            expires_at: expires.toISOString(),
          });
        }

        await supabaseAdmin
          .from("webhook_events")
          .update({ processed_at: now.toISOString() })
          .eq("provider", body.provider ?? "mobile-money")
          .eq("external_id", body.external_id);

        return new Response("ok", { status: 200 });
      },
    },
  },
});