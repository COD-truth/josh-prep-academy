import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/** Returns the signed-in user's roles + active subscription state. */
export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: roles }, { data: subs }, { data: profile }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId),
      supabase
        .from("subscriptions")
        .select("id, status, expires_at, plan:subscription_plans(code, name_fr, name_en)")
        .eq("user_id", userId)
        .eq("status", "active")
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: false })
        .limit(1),
      supabase.from("profiles").select("full_name, phone").eq("id", userId).maybeSingle(),
    ]);
    return {
      userId,
      roles: (roles ?? []).map((r) => r.role as string),
      activeSubscription: subs?.[0] ?? null,
      profile: profile ?? null,
    };
  });

/** Lists exam papers. RLS restricts to subscribers/admins. */
export const listExamPapers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("exam_papers")
      .select("id, title, description, subject, year, file_url, meta")
      .order("year", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

/** Submit a Mobile Money payment for verification. */
export const submitPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        planId: z.string().uuid(),
        provider: z.enum(["orange", "mtn"]),
        phone: z.string().min(7).max(20),
        transactionRef: z.string().min(4).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: plan, error: planErr } = await supabase
      .from("subscription_plans")
      .select("id, price_xaf")
      .eq("id", data.planId)
      .maybeSingle();
    if (planErr || !plan) throw new Error("Plan not found");

    // Idempotent: the same transaction reference must never create two payments.
    const { data: existing } = await supabase
      .from("payments")
      .select("id")
      .eq("transaction_ref", data.transactionRef)
      .maybeSingle();
    if (existing) return { paymentId: existing.id, duplicate: true as const };

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        provider: data.provider,
        phone: data.phone,
        transaction_ref: data.transactionRef,
        amount_xaf: plan.price_xaf,
        status: "pending",
      })
      .select("id")
      .single();
    if (error) {
      if (/duplicate|unique/i.test(error.message)) {
        throw new Error("Cet identifiant de transaction a déjà été soumis. / This transaction ID was already submitted.");
      }
      throw error;
    }
    return { paymentId: payment.id, duplicate: false as const };
  });

export const listMyPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("payments")
      .select("id, provider, phone, amount_xaf, transaction_ref, status, created_at, plan:subscription_plans(name_fr, name_en)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const listPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscription_plans")
      .select("id, code, name_fr, name_en, price_xaf, duration_days")
      .eq("active", true)
      .order("price_xaf");
    if (error) throw error;
    return data ?? [];
  });

/** Admin: list all payments for review. */
export const adminListPayments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data, error } = await supabase
      .from("payments")
      .select("id, user_id, provider, phone, amount_xaf, transaction_ref, status, created_at, plan:subscription_plans(name_fr, duration_days)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data ?? [];
  });

/** Admin: approve a payment and create the matching subscription. */
export const reviewPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        paymentId: z.string().uuid(),
        action: z.enum(["approve", "reject"]),
        notes: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { data: pay, error: payErr } = await supabase
      .from("payments")
      .select("id, user_id, plan_id, status, plan:subscription_plans(duration_days)")
      .eq("id", data.paymentId)
      .maybeSingle();
    if (payErr || !pay) throw new Error("Payment not found");
    if (pay.status !== "pending") throw new Error("Already processed");
    if (!pay.plan_id) throw new Error("Payment has no plan attached");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.action === "reject") {
      await supabaseAdmin
        .from("payments")
        .update({ status: "rejected", notes: data.notes, verified_at: new Date().toISOString(), verified_by: userId })
        .eq("id", pay.id);
      return { ok: true };
    }

    const days = (pay.plan as { duration_days: number } | null)?.duration_days ?? 30;
    const now = new Date();

    const { error: subErr } = await supabaseAdmin.rpc("grant_subscription", {
      _user_id: pay.user_id,
      _plan_id: pay.plan_id,
      _days: days,
    });
    if (subErr) throw subErr;

    await supabaseAdmin
      .from("payments")
      .update({ status: "verified", notes: data.notes, verified_at: now.toISOString(), verified_by: userId })
      .eq("id", pay.id);
    return { ok: true };
  });

/** Self-service: promote current user to admin if no admin exists yet. Bootstrap helper. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Un administrateur existe déjà");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true };
  });
/** Admin: save exam paper metadata after file upload */
export const adminSaveExamPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({
      title: z.string().min(3),
      title_en: z.string().optional(),
      subject: z.string().min(1),
      level: z.string().min(1),
      year: z.number().int().min(2000).max(2030),
      language: z.enum(["fr", "en", "both"]),
      has_solution: z.boolean(),
      file_url: z.string().url(),
      page_count: z.number().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await supabase.from("exam_papers").insert({
      title: data.title,
      title_en: data.title_en ?? null,
      subject: data.subject,
      level: data.level,
      year: data.year,
      language: data.language,
      has_solution: data.has_solution,
      file_url: data.file_url,
      page_count: data.page_count ?? null,
      is_active: true,
    } as never);
    if (error) throw error;
    return { ok: true };
  });
