import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { getMyAccess } from "@/lib/access.functions";
import { saveTutorProfile, updateSchoolFields } from "@/lib/directory.functions";
import { saveConcours } from "@/lib/concours.functions";
import { PhotoUpload } from "@/components/marketplace/PhotoUpload";
export const Route = createFileRoute("/_authenticated/directory")({
  component: DirectoryAdmin,
  head: () => ({ meta: [{ title: "Profils & orientation — Administration Josh & Co" }] }),
});
const emptyTutor = {
  id: undefined as string | undefined,
  full_name: "",
  title: "",
  bio: "",
  subjects: "",
  levels: "",
  languages: "FR, EN",
  city: "",
  years_experience: 0,
  hourly_rate_fcfa: 3000,
  photo_url: "",
  is_active: true,
};
const emptyNotice = {
  title: "",
  institution: "",
  study_field: "",
  level_required: "",
  city: "",
  deadline: "",
  exam_date: "",
  official_url: "",
  summary_fr: "",
  summary_en: "",
  verified_at: "",
};
const split = (value: string) =>
  value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
function DirectoryAdmin() {
  const { lang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [tab, setTab] = useState<"tutors" | "schools" | "concours">("tutors");
  const [tutor, setTutor] = useState(emptyTutor);
  const [notice, setNotice] = useState(emptyNotice);
  const [school, setSchool] = useState("");
  const [fields, setFields] = useState("");
  const accessFn = useServerFn(getMyAccess);
  const access = useQuery({ queryKey: ["access"], queryFn: () => accessFn({}) });
  const isAdmin = access.data?.roles.includes("admin");
  const tutors = useQuery({
    queryKey: ["admin-tutor-profiles"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("tutors").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });
  const schools = useQuery({
    queryKey: ["admin-school-fields"],
    enabled: !!isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schools" as never)
        .select("id,name,study_fields")
        .order("name");
      if (error) throw error;
      return data as unknown as { id: string; name: string; study_fields: string[] }[];
    },
  });
  const saveTutor = useServerFn(saveTutorProfile);
  const publishNotice = useServerFn(saveConcours);
  const saveFields = useServerFn(updateSchoolFields);
  const mutation = useMutation({
    mutationFn: () =>
      tab === "tutors"
        ? saveTutor({
            data: {
              ...tutor,
              subjects: split(tutor.subjects),
              levels: split(tutor.levels),
              languages: split(tutor.languages),
              photo_url: tutor.photo_url || null,
            },
          })
        : tab === "schools"
          ? saveFields({ data: { id: school, study_fields: split(fields) } })
          : publishNotice({
              data: {
                ...notice,
                deadline: notice.deadline || undefined,
                exam_date: notice.exam_date || undefined,
              },
            }),
    onSuccess: () => {
      tutors.refetch();
      schools.refetch();
    },
  });
  const inp = "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm";
  if (access.isPending)
    return (
      <p role="status" className="p-10">
        {tr("Chargement…", "Loading…")}
      </p>
    );
  if (!isAdmin)
    return (
      <main className="p-10">
        <h1 className="text-2xl font-semibold">
          {tr("Accès réservé à l’équipe", "Team access only")}
        </h1>
        <Link to="/dashboard" className="text-primary">
          {tr("Mon espace", "My account")}
        </Link>
      </main>
    );
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <Link to="/admin" className="text-sm text-primary">
        ← Administration
      </Link>
      <h1 className="text-3xl font-semibold mt-6">
        {tr("Profils, écoles & concours", "Profiles, schools & entrance exams")}
      </h1>
      <div className="mt-6 flex flex-wrap gap-2">
        {(["tutors", "schools", "concours"] as const).map((value) => (
          <button
            key={value}
            onClick={() => {
              setTab(value);
              mutation.reset();
            }}
            className={`rounded-xl px-4 py-3 text-sm font-semibold ${tab === value ? "bg-primary text-primary-foreground" : "bg-muted"}`}
          >
            {value === "tutors"
              ? tr("Répétiteurs", "Tutors")
              : value === "schools"
                ? tr("Filières des écoles", "School study fields")
                : tr("Avis de concours", "Entrance exam notices")}
          </button>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="mt-6 rounded-3xl border border-border bg-card p-5 sm:p-8 space-y-5"
      >
        {tab === "tutors" ? (
          <>
            <label className="block text-sm font-semibold">
              {tr("Modifier un profil ou créer un nouveau", "Edit a profile or create a new one")}
              <select
                className={inp}
                value={tutor.id ?? ""}
                onChange={(e) => {
                  const existing = tutors.data?.find((t) => t.id === e.target.value);
                  setTutor(
                    existing
                      ? {
                          ...existing,
                          title: existing.title ?? "",
                          bio: existing.bio ?? "",
                          city: existing.city ?? "",
                          subjects: existing.subjects.join(", "),
                          levels: existing.levels.join(", "),
                          languages: existing.languages.join(", "),
                          years_experience: existing.years_experience ?? 0,
                          photo_url: existing.photo_url ?? "",
                        }
                      : emptyTutor,
                  );
                  mutation.reset();
                }}
              >
                <option value="">{tr("Nouveau profil", "New profile")}</option>
                {tutors.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name} {!t.is_active && tr("(masqué)", "(hidden)")}
                  </option>
                ))}
              </select>
            </label>
            {tutors.isError && (
              <p role="alert">{tr("Profils indisponibles.", "Profiles unavailable.")}</p>
            )}
            {(
              [
                { key: "full_name", label: tr("Nom complet", "Full name") },
                { key: "title", label: tr("Statut / qualification", "Status / qualification") },
                { key: "subjects", label: tr("Matières (virgules)", "Subjects (comma separated)") },
                { key: "levels", label: tr("Niveaux (virgules)", "Levels (comma separated)") },
                {
                  key: "languages",
                  label: tr("Langues (virgules)", "Languages (comma separated)"),
                },
                { key: "city", label: tr("Ville publique", "Public city") },
              ] as const
            ).map((item) => (
              <label key={item.key} className="block text-sm font-semibold">
                {item.label}
                <input
                  required
                  value={tutor[item.key]}
                  onChange={(e) => setTutor({ ...tutor, [item.key]: e.target.value })}
                  className={inp}
                />
              </label>
            ))}
            <label className="block text-sm font-semibold">
              {tr("Présentation / méthode", "Bio / teaching approach")}
              <textarea
                required
                minLength={20}
                maxLength={1500}
                rows={4}
                value={tutor.bio}
                onChange={(e) => setTutor({ ...tutor, bio: e.target.value })}
                className={inp}
              />
            </label>
            <label className="block text-sm font-semibold">
              {tr("Années d’expérience", "Years of experience")}
              <input
                type="number"
                min={0}
                max={60}
                required
                value={tutor.years_experience}
                onChange={(e) => setTutor({ ...tutor, years_experience: Number(e.target.value) })}
                className={inp}
              />
            </label>
            <label className="block text-sm font-semibold">
              {tr("Tarif horaire FCFA", "Hourly price FCFA")}
              <input
                type="number"
                min={1000}
                max={50000}
                required
                value={tutor.hourly_rate_fcfa}
                onChange={(e) => setTutor({ ...tutor, hourly_rate_fcfa: Number(e.target.value) })}
                className={inp}
              />
            </label>
            <PhotoUpload
              lang={lang}
              value={tutor.photo_url}
              onChange={(photo_url) => setTutor({ ...tutor, photo_url })}
            />
            <label className="flex gap-3 text-sm">
              <input
                type="checkbox"
                checked={tutor.is_active}
                onChange={(e) => setTutor({ ...tutor, is_active: e.target.checked })}
              />
              {tr("Publier ce profil dans l’annuaire", "Publish this profile in the directory")}
            </label>
          </>
        ) : tab === "schools" ? (
          <>
            <label className="block text-sm font-semibold">
              {tr("Établissement", "School")}
              <select
                required
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value);
                  setFields(
                    schools.data?.find((s) => s.id === e.target.value)?.study_fields?.join(", ") ??
                      "",
                  );
                }}
                className={inp}
              >
                <option value="">{tr("Choisir", "Choose")}</option>
                {schools.data?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {schools.isError && (
              <p role="alert">
                {tr(
                  "Annuaire indisponible. Vérifiez la configuration de la base.",
                  "Directory unavailable. Check database configuration.",
                )}
              </p>
            )}
            <label className="block text-sm font-semibold">
              {tr("Filières proposées (virgules)", "Study fields (comma separated)")}
              <input
                value={fields}
                onChange={(e) => setFields(e.target.value)}
                placeholder="Médecine, Génie civil, Informatique"
                className={inp}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              {tr(
                "Renseignez seulement les filières confirmées par l’établissement.",
                "Only enter study fields confirmed by the institution.",
              )}
            </p>
          </>
        ) : (
          <>
            {(
              [
                { key: "title", label: tr("Titre de l’avis", "Notice title") },
                {
                  key: "institution",
                  label: tr("Établissement organisateur", "Organising institution"),
                },
                { key: "study_field", label: tr("Filière", "Study field") },
                {
                  key: "level_required",
                  label: tr("Diplôme / niveau requis", "Required qualification"),
                },
                { key: "city", label: tr("Ville", "City") },
                {
                  key: "official_url",
                  label: tr("Lien vers l’avis officiel HTTPS", "Official notice link HTTPS"),
                },
              ] as const
            ).map((item) => (
              <label key={item.key} className="block text-sm font-semibold">
                {item.label}
                <input
                  type={item.key === "official_url" ? "url" : "text"}
                  required={item.key !== "city"}
                  value={notice[item.key]}
                  onChange={(e) => setNotice({ ...notice, [item.key]: e.target.value })}
                  className={inp}
                />
              </label>
            ))}
            {(
              [
                { key: "deadline", label: tr("Date limite (facultative)", "Deadline (optional)") },
                {
                  key: "exam_date",
                  label: tr("Date du concours (facultative)", "Exam date (optional)"),
                },
                {
                  key: "verified_at",
                  label: tr("Date de vérification de la source", "Source review date"),
                },
              ] as const
            ).map((item) => (
              <label key={item.key} className="block text-sm font-semibold">
                {item.label}
                <input
                  type="date"
                  required={item.key === "verified_at"}
                  value={notice[item.key]}
                  onChange={(e) => setNotice({ ...notice, [item.key]: e.target.value })}
                  className={inp}
                />
              </label>
            ))}
            {(["summary_fr", "summary_en"] as const).map((key) => (
              <label key={key} className="block text-sm font-semibold">
                {key === "summary_fr" ? "Résumé français" : "English summary"}
                <textarea
                  required
                  minLength={20}
                  maxLength={2000}
                  value={notice[key]}
                  onChange={(e) => setNotice({ ...notice, [key]: e.target.value })}
                  className={inp}
                />
              </label>
            ))}
          </>
        )}
        {mutation.isError && (
          <p role="alert" className="text-sm text-destructive">
            {mutation.error.message}
          </p>
        )}
        {mutation.isSuccess && (
          <p role="status" className="text-sm text-primary">
            {tr("Enregistrement confirmé.", "Saved successfully.")}
          </p>
        )}
        <button
          disabled={
            mutation.isPending ||
            (tab === "schools" && !school) ||
            (tab === "concours" && mutation.isSuccess)
          }
          className="w-full rounded-xl bg-primary py-3 text-primary-foreground font-semibold disabled:opacity-50"
        >
          {tr("Enregistrer", "Save")}
        </button>
        {tab === "concours" && mutation.isSuccess && (
          <button
            type="button"
            onClick={() => {
              setNotice(emptyNotice);
              mutation.reset();
            }}
            className="text-sm text-primary underline"
          >
            {tr("Ajouter un autre avis", "Add another notice")}
          </button>
        )}
      </form>
    </main>
  );
}
