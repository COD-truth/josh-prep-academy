import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { applyAsTutor, getMyApplication } from "@/lib/access.functions";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { PhotoUpload } from "@/components/marketplace/PhotoUpload";
export const Route = createFileRoute("/_authenticated/become-tutor")({
  component: ApplicationPage,
  head: () => ({ meta: [{ title: "Candidature enseignant — Josh & Co" }] }),
});
function ApplicationPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const metadata = user?.user_metadata ?? {};
  const [form, setForm] = useState({
    full_name: String(metadata.full_name ?? ""),
    phone: String(metadata.phone ?? ""),
    subjects: Array.isArray(metadata.subjects) ? metadata.subjects.join(", ") : "",
    levels: Array.isArray(metadata.levels) ? metadata.levels.join(", ") : "",
    experience_years: Number(metadata.experience_years ?? 0),
    residence: String(metadata.residence ?? ""),
    city: "",
    languages: "FR, EN",
    diploma: "",
    bio: "",
    hourly_rate_fcfa: 3000,
    photo_url: "",
  });
  const load = useServerFn(getMyApplication);
  const apply = useServerFn(applyAsTutor);
  const query = useQuery({ queryKey: ["my-application"], queryFn: () => load({}) });
  const mutation = useMutation({
    mutationFn: () =>
      apply({
        data: {
          ...form,
          subjects: form.subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          levels: form.levels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          languages: form.languages
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          photo_url: form.photo_url || undefined,
        },
      }),
    onSuccess: () => query.refetch(),
  });
  const input =
    "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:outline-none";
  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <Link to="/dashboard" className="text-primary text-sm">
          ← {tr("Mon espace", "My account")}
        </Link>
        <h1 className="mt-6 text-3xl font-semibold">
          {tr("Rejoindre le collectif Josh & Co", "Join the Josh & Co teaching team")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {tr(
            "Complétez votre candidature. Notre équipe la vérifiera avant de publier votre profil.",
            "Complete your application. Our team will review it before publishing your profile.",
          )}
        </p>
        {query.isPending ? (
          <p role="status" className="mt-6">
            {tr("Chargement…", "Loading…")}
          </p>
        ) : query.isError ? (
          <div role="alert" className="mt-6 rounded-xl border p-5">
            <p>
              {tr(
                "Le service de candidature est indisponible. Aucun dossier n'a été envoyé.",
                "The application service is unavailable. No application has been sent.",
              )}
            </p>
            <button onClick={() => query.refetch()} className="mt-3 text-primary">
              {tr("Réessayer", "Retry")}
            </button>
          </div>
        ) : query.data ? (
          <div className="mt-8 rounded-2xl bg-primary-soft p-6">
            <h2 className="font-semibold">
              {tr("Votre candidature", "Your application")}: {query.data.status}
            </h2>
            <p className="mt-3 text-sm">
              {query.data.status === "approved"
                ? tr(
                    "Votre profil est publié. Ajoutez vos disponibilités dans votre espace tuteur.",
                    "Your profile is published. Add availability in your tutor workspace.",
                  )
                : tr(
                    "Votre dossier est enregistré. Contactez Josh & Co pour toute modification.",
                    "Your application is saved. Contact Josh & Co to request changes.",
                  )}
            </p>
            <Link to="/learning" className="mr-4 mt-4 inline-block text-primary font-semibold">{tr("Mes séances", "My lessons")}</Link>
          <Link to="/contact" className="mt-4 inline-block text-primary font-semibold">
              Contact
            </Link>
          </div>
        ) : (
          <form
            className="mt-8 rounded-3xl border border-border bg-card p-5 sm:p-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            {(
              [
                { key: "full_name", label: tr("Nom complet", "Full name") },
                { key: "phone", label: tr("Téléphone", "Phone") },
                {
                  key: "subjects",
                  label: tr("Matières enseignées (virgules)", "Subjects taught (comma separated)"),
                },
                {
                  key: "levels",
                  label: tr("Niveaux scolaires (virgules)", "School levels (comma separated)"),
                },
                { key: "languages", label: tr("Langues (FR, EN)", "Languages (FR, EN)") },
                {
                  key: "residence",
                  label: tr(
                    "Résidence : ville / quartier (privé)",
                    "Residence: city / district (private)",
                  ),
                },
                { key: "city", label: tr("Ville affichée sur le profil", "Public profile city") },
                {
                  key: "diploma",
                  label: tr(
                    "Qualification / formation actuelle",
                    "Qualification / current training",
                  ),
                },
              ] as const
            ).map((field) => (
              <label key={field.key} className="block text-sm font-semibold">
                {field.label}
                <input
                  required
                  minLength={field.key === "phone" ? 8 : 2}
                  maxLength={field.key === "residence" ? 200 : 500}
                  value={form[field.key]}
                  onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  className={input}
                />
              </label>
            ))}
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="text-sm font-semibold">
                {tr("Années d'expérience", "Years of experience")}
                <input
                  required
                  type="number"
                  min={0}
                  max={60}
                  step={1}
                  value={form.experience_years}
                  onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })}
                  className={input}
                />
              </label>
              <label className="text-sm font-semibold">
                {tr("Tarif horaire (FCFA)", "Hourly price (FCFA)")}
                <input
                  required
                  type="number"
                  min={1000}
                  max={50000}
                  step={100}
                  value={form.hourly_rate_fcfa}
                  onChange={(e) => setForm({ ...form, hourly_rate_fcfa: Number(e.target.value) })}
                  className={input}
                />
              </label>
            </div>
            <label className="block text-sm font-semibold">
              {tr("Présentez votre méthode d'enseignement", "Describe your teaching approach")}
              <textarea
                required
                minLength={20}
                maxLength={800}
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className={input}
              />
            </label>
            <PhotoUpload
              lang={lang}
              value={form.photo_url}
              onChange={(photo_url) => setForm({ ...form, photo_url })}
            />
            {mutation.isError && (
              <p role="alert" className="text-sm text-destructive">
                {mutation.error.message}
              </p>
            )}
            <button
              disabled={mutation.isPending}
              className="w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold disabled:opacity-50"
            >
              {mutation.isPending
                ? tr("Envoi…", "Submitting…")
                : tr("Soumettre ma candidature", "Submit my application")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
