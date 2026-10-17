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
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
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
    .select(
      "id, full_name, title, subjects, levels, languages, hourly_rate_fcfa, photo_url, rating, years_experience, bio, city",
    )
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
      sb
        .from("tutor_availability")
        .select("weekday, start_time, end_time")
        .eq("tutor_id", data.tutorId),
      sb.rpc(
        "get_tutor_busy_slots" as never,
        { _tutor: data.tutorId, _from: data.fromISO, _to: data.toISO } as never,
      ),
    ]);
    if (avail.error) throw avail.error;
    if (busy.error) throw busy.error;
    return {
      availability: avail.data ?? [],
      busy: (busy.data ?? []) as unknown as {
        starts_at: string;
        ends_at: string;
        status: string;
      }[],
    };
  });

/** Atomic reservation + manual payment receipt. The database computes the price. */
export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    z
      .object({
        tutorId: z.string().uuid(),
        subject: z.string().trim().min(1).max(80),
        level: z.string().trim().min(1).max(40),
        format: z.enum(["home", "online", "office"]),
        startsAt: z.string().datetime(),
        durationMinutes: z.number().int().min(30).max(240),
        address: z.string().max(200).optional(),
        notes: z.string().max(500).optional(),
        payment: z.object({
          provider: z.enum(["orange", "mtn"]),
          phone: z.string().min(7).max(20),
          transactionRef: z.string().min(4).max(60),
        }),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase.rpc(
      "request_lesson_booking" as never,
      {
        _tutor: data.tutorId,
        _subject: data.subject,
        _level: data.level,
        _format: data.format,
        _starts: data.startsAt,
        _duration: data.durationMinutes,
        _address: data.address ?? null,
        _notes: data.notes ?? null,
        _provider: data.payment.provider,
        _phone: data.payment.phone,
        _reference: data.payment.transactionRef,
      } as never,
    );
    if (error) throw error;
    return booking as unknown as {
      id: string;
      starts_at: string;
      ends_at: string;
      price_fcfa: number;
      status: string;
    };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select(
        "id, starts_at, ends_at, subject, level, format, status, price_fcfa, tutor:tutors(full_name, photo_url)",
      )
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
        plan_id: null,
      })
      .select("id")
      .single();
    if (error) throw error;
    return { paymentId: payment.id };
  });
