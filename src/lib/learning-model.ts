import { z } from "zod";
export const quizQuestionSchema = z
  .object({
    prompt: z.string().trim().min(3).max(500),
    choices: z.array(z.string().trim().min(1).max(300)).min(2).max(5),
    correct: z.number().int().min(0),
    explanation: z.string().trim().max(800),
  })
  .refine((q) => q.correct < q.choices.length, { message: "Invalid correct choice" });
export const quizSchema = z.object({
  bookingId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  questions: z.array(quizQuestionSchema).min(1).max(10),
});
export const reportSchema = z.object({
  bookingId: z.string().uuid(),
  objective: z.string().trim().min(3).max(500),
  summary: z.string().trim().min(20).max(2000),
  homework: z.string().trim().max(1500),
  progress: z.number().int().min(0).max(100),
});
export const reviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(10).max(1200),
  displayName: z.string().trim().min(1).max(40),
});
const point = z.tuple([z.number().min(0).max(1), z.number().min(0).max(1)]);
export const strokeSchema = z.object({
  color: z.enum(["#14213d", "#f97316", "#ffffff"]),
  width: z.number().int().min(1).max(20),
  points: z.array(point).min(1).max(200),
});
export const eventSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("stroke"), payload: strokeSchema }),
  z.object({
    kind: z.literal("message"),
    payload: z.object({ text: z.string().trim().min(1).max(1000) }),
  }),
  z.object({ kind: z.literal("clear"), payload: z.object({}) }),
]);
export function normalizedPoint(
  x: number,
  y: number,
  width: number,
  height: number,
): [number, number] {
  return [
    Math.max(0, Math.min(1, x / Math.max(width, 1))),
    Math.max(0, Math.min(1, y / Math.max(height, 1))),
  ];
}
export function safeMeetingUrl(value: string): string {
  const url = new URL(value);
  const allowed = ["meet.google.com", "meet.jit.si", "teams.microsoft.com", "teams.live.com"];
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    !(
      allowed.includes(url.hostname) ||
      url.hostname === "zoom.us" ||
      url.hostname.endsWith(".zoom.us")
    )
  )
    throw new Error("Use a Google Meet, Zoom, Teams or Jitsi HTTPS link.");
  return url.href;
}
export type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  display_name: string;
  created_at: string;
};
export type LessonReport = {
  id: string;
  booking_id: string;
  objective: string;
  summary: string;
  homework: string;
  progress: number;
  updated_at: string;
};
export type LessonEvent = {
  id: string;
  actor_id: string;
  kind: "stroke" | "message" | "clear";
  payload: Record<string, string | number | [number, number][]>;
  created_at: string;
};
export type PublicQuiz = {
  id: string;
  title: string;
  questions: { prompt: string; choices: string[] }[];
};
export type QuizAttempt = {
  id: string;
  score: number;
  total: number;
  created_at: string;
  feedback: { prompt: string; selected: number; correct: number; explanation: string }[];
};

export type LessonInput = z.infer<typeof eventSchema>;
