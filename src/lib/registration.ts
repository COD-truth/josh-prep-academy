import { z } from "zod";
export const registrationSchema = z
  .object({
    full_name: z.string().trim().min(3).max(120),
    user_type: z.enum(["student", "parent", "teacher"]),
    phone: z.string().trim().min(8).max(20),
    subjects: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
    levels: z.array(z.string().trim().min(1).max(60)).max(20).default([]),
    experience_years: z.number().int().min(0).max(60).default(0),
    residence: z.string().trim().max(200).default(""),
  })
  .superRefine((value, ctx) => {
    if (value.user_type !== "teacher") return;
    for (const field of ["subjects", "levels"] as const)
      if (!value[field].length)
        ctx.addIssue({ code: "custom", path: [field], message: "Champ requis / Required field" });
    if (value.residence.length < 3)
      ctx.addIssue({
        code: "custom",
        path: ["residence"],
        message: "Lieu de résidence requis / Residence required",
      });
  });
export function getAccountDestination(type: unknown) {
  return type === "teacher" ? "/become-tutor" : type === "parent" ? "/parent" : "/dashboard";
}
