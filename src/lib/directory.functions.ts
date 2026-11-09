import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
const list = z.array(z.string().trim().min(1).max(100)).max(30);
export const saveTutorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) =>
    z
      .object({
        id: z.string().uuid().optional(),
        full_name: z.string().trim().min(3).max(120),
        title: z.string().trim().min(2).max(200),
        bio: z.string().trim().min(20).max(1500),
        subjects: list.min(1),
        levels: list.min(1),
        languages: list.min(1),
        city: z.string().trim().max(80),
        years_experience: z.number().int().min(0).max(60),
        hourly_rate_fcfa: z.number().int().min(1000).max(50000),
        photo_url: z.string().url().startsWith("https://").nullable(),
        is_active: z.boolean(),
      })
      .parse(value),
  )
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !admin) throw new Error("Forbidden");
    const { error: writeError } = await context.supabase.from("tutors").upsert(data);
    if (writeError) throw writeError;
    return { ok: true };
  });
export const updateSchoolFields = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((value) => z.object({ id: z.string().uuid(), study_fields: list }).parse(value))
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error || !admin) throw new Error("Forbidden");
    // School records are owned by the team; use the server client only after checking admin permissions.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error: writeError } = await supabaseAdmin
      .from("schools" as never)
      .update({ study_fields: data.study_fields } as never)
      .eq("id", data.id);
    if (writeError) throw writeError;
    return { ok: true };
  });
