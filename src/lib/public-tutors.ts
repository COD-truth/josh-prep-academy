import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "./request-timeout";
import type { Database } from "@/integrations/supabase/types";
export type PublicTutor = Pick<
  Database["public"]["Tables"]["tutors"]["Row"],
  | "id"
  | "full_name"
  | "title"
  | "bio"
  | "subjects"
  | "levels"
  | "languages"
  | "hourly_rate_fcfa"
  | "photo_url"
  | "years_experience"
  | "city"
>;
export async function publicTutors(id?: string): Promise<PublicTutor[]> {
  const base =
    "id,full_name,title,bio,subjects,levels,languages,hourly_rate_fcfa,photo_url,years_experience";
  const read = (city: boolean) => {
    let query = supabase
      .from("tutors")
      .select(base + (city ? ",city" : ""))
      .eq("is_active", true)
      .order("full_name");
    if (id) query = query.eq("id", id);
    return withTimeout(query);
  };
  let result = await read(true);
  // Existing public profiles remain usable while the additive city migration is pending.
  if (
    result.error?.code === "42703" ||
    (result.error?.code === "PGRST204" && result.error.message.includes("city"))
  )
    result = await read(false);
  if (result.error) throw result.error;
  return ((result.data ?? []) as unknown as PublicTutor[]).map((tutor) => ({
    ...tutor,
    city: tutor.city ?? null,
  }));
}
