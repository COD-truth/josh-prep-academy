import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (value) =>
      !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value,
  );
export const saveConcours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    z
      .object({
        title: z.string().trim().min(3).max(200),
        institution: z.string().trim().min(2).max(200),
        study_field: z.string().trim().min(2).max(100),
        level_required: z.string().trim().min(2).max(100),
        city: z.string().max(100).optional(),
        deadline: date.optional(),
        exam_date: date.optional(),
        official_url: z.string().url().startsWith("https://"),
        summary_fr: z.string().trim().min(20).max(2000),
        summary_en: z.string().trim().min(20).max(2000),
        verified_at: date,
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !admin) throw new Error("Forbidden");
    // Schema introduced by the accompanying migration; generated database types are updated after deployment.
    const { error: insertError } = await context.supabase
      .from("concours_announcements" as never)
      .insert({
        ...data,
        deadline: data.deadline ?? null,
        exam_date: data.exam_date ?? null,
        is_active: true,
      } as never);
    if (insertError) throw insertError;
    return { ok: true };
  });
