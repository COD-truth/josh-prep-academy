import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  quizSchema,
  reportSchema,
  reviewSchema,
  eventSchema,
  safeMeetingUrl,
} from "./learning-model";
import type { LessonReport, LessonEvent, PublicQuiz, QuizAttempt } from "./learning-model";
import { withTimeout } from "./request-timeout";
const bookingInput = z.object({ bookingId: z.string().uuid() });
export const listLessons = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // RLS returns only account-owned bookings, assigned tutor bookings or admin-visible bookings.
    const { data, error } = await withTimeout(
      context.supabase
        .from("bookings")
        .select(
          "id,student_id,tutor_id,subject,level,format,status,starts_at,ends_at,price_fcfa,tutor:tutors(full_name,user_id)",
        )
        .order("starts_at", { ascending: false })
        .limit(100),
    );
    if (error) throw error;
    return data ?? [];
  });
export const getLesson = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => bookingInput.parse(value))
  .handler(async ({ data, context }) => {
    const { data: booking, error } = await context.supabase
      .from("bookings")
      .select(
        "id,student_id,tutor_id,subject,level,format,status,starts_at,ends_at,price_fcfa,tutor:tutors(full_name,user_id)",
      )
      .eq("id", data.bookingId)
      .maybeSingle();
    if (error || !booking) throw new Error("Lesson unavailable or access denied.");
    const { data: teacher, error: roleError } = await context.supabase.rpc(
      "can_teach_lesson" as never,
      { _booking: data.bookingId } as never,
    );
    if (roleError) throw roleError;
    const [report, meeting, events, quiz, attempts, hasReview] = await Promise.all([
      context.supabase
        .from("lesson_reports" as never)
        .select("id,booking_id,objective,summary,homework,progress,updated_at")
        .eq("booking_id", data.bookingId)
        .maybeSingle(),
      context.supabase
        .from("lesson_settings" as never)
        .select("meeting_url")
        .eq("booking_id", data.bookingId)
        .maybeSingle(),
      context.supabase
        .from("lesson_events" as never)
        .select("id,actor_id,kind,payload,created_at")
        .eq("booking_id", data.bookingId)
        .order("created_at", { ascending: false })
        .limit(300),
      context.supabase.rpc("get_lesson_quiz" as never, { _booking: data.bookingId } as never),
      context.supabase
        .from("quiz_attempts" as never)
        .select("id,score,total,created_at,feedback")
        .eq("booking_id", data.bookingId)
        .order("created_at", { ascending: false }),
      context.supabase.rpc("lesson_has_review" as never, { _booking: data.bookingId } as never),
    ]);
    for (const result of [report, meeting, events, quiz, attempts, hasReview])
      if (result.error) throw result.error;
    const meetingValue = meeting.data as unknown as { meeting_url: string } | null;
    let meetingUrl: string | null = null;
    try {
      if (meetingValue) meetingUrl = safeMeetingUrl(meetingValue.meeting_url);
    } catch {
      /* A malformed direct database link must never become a clickable URL. */
    }
    return {
      booking,
      hasReview: !!hasReview.data,
      canTeach: !!teacher,
      report: report.data as unknown as LessonReport | null,
      meetingUrl,
      events: ((events.data ?? []) as unknown as LessonEvent[]).reverse(),
      quiz: quiz.data as unknown as PublicQuiz | null,
      attempts: (attempts.data ?? []) as unknown as QuizAttempt[],
      userId: context.userId,
    };
  });
export const saveReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => reportSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.rpc(
      "save_lesson_report" as never,
      {
        _booking: data.bookingId,
        _objective: data.objective,
        _summary: data.summary,
        _homework: data.homework,
        _progress: data.progress,
      } as never,
    );
    if (error) throw error;
    return { ok: true };
  });
export const addReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => reviewSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { data: booking, error: bookingError } = await context.supabase
      .from("bookings")
      .select("tutor_id")
      .eq("id", data.bookingId)
      .eq("student_id", context.userId)
      .maybeSingle();
    if (bookingError || !booking) throw new Error("Forbidden");
    const { error } = await context.supabase
      .from("tutor_reviews" as never)
      .insert({
        booking_id: data.bookingId,
        tutor_id: booking.tutor_id,
        rating: data.rating,
        comment: data.comment,
        display_name: data.displayName,
      } as never);
    if (error) {
      if (error.code === "23505")
        throw new Error("A review has already been submitted for this booking.");
      throw error;
    }
    return { ok: true };
  });
export const addLessonEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    bookingInput.extend({ clientId: z.string().uuid() }).and(eventSchema).parse(value),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lesson_events" as never)
      .insert({
        id: data.clientId,
        booking_id: data.bookingId,
        actor_id: context.userId,
        kind: data.kind,
        payload: data.payload,
      } as never);
    if (error) throw error;
    return { ok: true };
  });
export const saveMeeting = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    bookingInput.extend({ url: z.string().max(2000).transform(safeMeetingUrl) }).parse(value),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lesson_settings" as never)
      .upsert({
        booking_id: data.bookingId,
        meeting_url: data.url,
        updated_at: new Date().toISOString(),
      } as never);
    if (error) throw error;
    return { ok: true };
  });
export const createLessonQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => quizSchema.parse(value))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lesson_quizzes" as never)
      .insert({
        booking_id: data.bookingId,
        author_id: context.userId,
        title: data.title,
        questions: data.questions,
      } as never);
    if (error) throw error;
    return { ok: true };
  });
export const submitLessonQuiz = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    z
      .object({
        quizId: z.string().uuid(),
        answers: z.array(z.number().int().min(0).max(4)).min(1).max(10),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc(
      "submit_lesson_quiz" as never,
      { _quiz: data.quizId, _answers: data.answers } as never,
    );
    if (error) {
      if (error.code === "23505") throw new Error("This quiz has already been submitted.");
      throw error;
    }
    return result as unknown as QuizAttempt;
  });
