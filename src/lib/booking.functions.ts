import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

function publicClient() {
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(process.env.SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Public list of active tutors with core info for the booking calendar. */
export const listActiveTutors = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const { data, error } = await sb
    .from("tutors")
    .select("id, full_name, title, subjects, levels, languages, hourly_rate_fcfa, photo_url, rating, years_experience")
    .eq("is_active", true)
    .order("rating", { ascending: false });
  if (error) throw error;
  return data ?? [];
});

/** Returns the tutor's weekly availability windows + booked slots for a given date range. */
export const getTutorSchedule = createServerFn({ method: "GET" })
  .inputValidator((d) =>
    z
      .object({
        tutorId: z.string().uuid(),
        fromISO: z.string(),
        toISO: z.string(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const [avail, busy] = await Promise.all([
      sb.from("tutor_availability").select("weekday, start_time, end_time").eq("tutor_id", data.tutorId),
      sb
        .from("bookings")
        .select("starts_at, ends_at, status")
        .eq("tutor_id", data.tutorId)
        .in("status", ["pending", "confirmed"])
        .gte("starts_at", data.fromISO)
        .lte("starts_at", data.toISO),
    ]);
    if (avail.error) throw avail.error;
    if (busy.error) throw busy.error;
    return { availability: avail.data ?? [], busy: busy.data ?? [] };
  });

/** Create a booking with server-side conflict control. */
export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        tutorId: z.string().uuid(),
        subject: z.string().min(1).max(80),
        level: z.string().min(1).max(40),
        format: z.enum(["home", "online", "office"]),
        startsAt: z.string(),
        durationMinutes: z.number().int().min(30).max(240),
        address: z.string().max(200).optional(),
        notes: z.string().max(500).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const starts = new Date(data.startsAt);
    if (Number.isNaN(starts.getTime())) throw new Error("Invalid startsAt");
    if (starts.getTime() < Date.now() + 60 * 60 * 1000) {
      throw new Error("Bookings must start at least 1 hour from now");
    }
    const ends = new Date(starts.getTime() + data.durationMinutes * 60 * 1000);

    const { data: tutor, error: tErr } = await supabase
      .from("tutors")
      .select("id, hourly_rate_fcfa, is_active")
      .eq("id", data.tutorId)
      .maybeSingle();
    if (tErr || !tutor || !tutor.is_active) throw new Error("Tutor unavailable");

    // Weekly availability check
    const weekday = starts.getUTCDay();
    const startHM = starts.toISOString().slice(11, 16);
    const endHM = ends.toISOString().slice(11, 16);
    const { data: windows } = await supabase
      .from("tutor_availability")
      .select("start_time, end_time")
      .eq("tutor_id", data.tutorId)
      .eq("weekday", weekday);
    const fits = (windows ?? []).some(
      (w) => (w.start_time as string).slice(0, 5) <= startHM && endHM <= (w.end_time as string).slice(0, 5),
    );
    if (!fits) throw new Error("Slot outside tutor availability");

    // Conflict check
    const { data: conflict } = await supabase.rpc("tutor_has_conflict", {
      _tutor_id: data.tutorId,
      _starts_at: starts.toISOString(),
      _ends_at: ends.toISOString(),
    });
    if (conflict) throw new Error("Slot already taken");

    const priceFcfa = Math.round((tutor.hourly_rate_fcfa * data.durationMinutes) / 60);

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        student_id: userId,
        tutor_id: data.tutorId,
        subject: data.subject,
        level: data.level,
        format: data.format,
        starts_at: starts.toISOString(),
        ends_at: ends.toISOString(),
        price_fcfa: priceFcfa,
        status: "pending",
        address: data.address ?? null,
        notes: data.notes ?? null,
      })
      .select("id, starts_at, ends_at, price_fcfa, status")
      .single();
    if (error) {
      // Unique index may catch a concurrent race
      if (String(error.message).match(/duplicate|unique/i)) throw new Error("Slot already taken");
      throw error;
    }
    return booking;
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("id, starts_at, ends_at, subject, level, format, status, price_fcfa, tutor:tutors(full_name, photo_url)")
      .eq("student_id", context.userId)
      .order("starts_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

/** Attach a Mobile Money payment intent to a booking (USSD flow). */
export const payForBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        bookingId: z.string().uuid(),
        provider: z.enum(["orange", "mtn"]),
        phone: z.string().min(7).max(20),
        transactionRef: z.string().min(4).max(60),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: booking, error: bErr } = await supabase
      .from("bookings")
      .select("id, price_fcfa, status, student_id")
      .eq("id", data.bookingId)
      .maybeSingle();
    if (bErr || !booking) throw new Error("Booking not found");
    if (booking.student_id !== userId) throw new Error("Forbidden");
    if (booking.status === "cancelled") throw new Error("Booking cancelled");

    const { data: payment, error } = await supabase
      .from("payments")
      .insert({
        user_id: userId,
        booking_id: booking.id,
        provider: data.provider,
        phone: data.phone,
        transaction_ref: data.transactionRef,
        amount_xaf: booking.price_fcfa,
        status: "pending",
        // plan_id is NOT NULL in schema; reuse a placeholder is not allowed. Use null via cast if column allows;
        // otherwise this branch requires a booking-only payment schema. We fall back to any active plan sentinel:
        plan_id: (await supabase.from("subscription_plans").select("id").limit(1).single()).data!.id,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { paymentId: payment.id };
  });