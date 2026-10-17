import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { publicTutors } from "@/lib/public-tutors";
import { withTimeout } from "@/lib/request-timeout";
import type { PublicReview } from "@/lib/learning-model";
import { Star, GraduationCap, MapPin } from "lucide-react";
export const Route = createFileRoute("/tutors/$tutorId")({
  component: TutorProfile,
  head: () => ({ meta: [{ title: "Profil du répétiteur — Josh & Co" }] }),
});
function TutorProfile() {
  const { tutorId } = Route.useParams();
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const profile = useQuery({
    queryKey: ["tutor-profile", tutorId],
    queryFn: async () => (await publicTutors(tutorId))[0] ?? null,
    retry: false,
  });
  const reviews = useQuery({
    queryKey: ["tutor-reviews", tutorId],
    enabled: !!profile.data,
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from("tutor_reviews" as never)
          .select("id,rating,comment,display_name,created_at")
          .eq("tutor_id", tutorId)
          .order("created_at", { ascending: false })
          .limit(100),
      );
      if (error) throw error;
      return data as unknown as PublicReview[];
    },
    retry: 1,
  });
  const tutor = profile.data;
  const rows = reviews.data ?? [];
  const average = rows.length
    ? rows.reduce((total, row) => total + row.rating, 0) / rows.length
    : null;
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <Link to="/cours" className="text-sm text-primary">
          ← {tr("Tous les répétiteurs", "All tutors")}
        </Link>
        {profile.isPending ? (
          <p role="status" className="mt-10">
            {tr("Chargement du profil…", "Loading profile…")}
          </p>
        ) : profile.isError ? (
          <div role="alert" className="mt-10 rounded-xl border p-6">
            <p>
              {tr(
                "Le profil est momentanément indisponible.",
                "The profile is temporarily unavailable.",
              )}
            </p>
            <button onClick={() => profile.refetch()} className="text-primary mt-3 font-semibold">
              {tr("Réessayer", "Retry")}
            </button>
          </div>
        ) : !tutor ? (
          <h1 className="mt-10 text-2xl">
            {tr("Ce profil n’est pas disponible.", "This profile is not available.")}
          </h1>
        ) : (
          <>
            <section className="mt-8 grid md:grid-cols-[1fr_300px] gap-6">
              <article className="rounded-3xl border border-border p-6 sm:p-9">
                <div className="flex flex-wrap gap-5 items-center">
                  {tutor.photo_url ? (
                    <img
                      src={tutor.photo_url}
                      alt={tutor.full_name}
                      className="size-28 object-cover rounded-2xl"
                    />
                  ) : (
                    <div className="size-28 rounded-2xl bg-primary-soft grid place-items-center">
                      <GraduationCap className="size-12 text-primary" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-semibold">{tutor.full_name}</h1>
                    <p className="mt-2 text-muted-foreground">{tutor.title}</p>
                    {tutor.city && (
                      <p className="mt-2 flex gap-2 items-center text-sm">
                        <MapPin className="size-4" />
                        {tutor.city}
                      </p>
                    )}
                  </div>
                </div>
                <h2 className="text-xl font-semibold mt-8">
                  {tr("Sa méthode et son parcours", "Teaching approach and background")}
                </h2>
                <p className="mt-4 text-muted-foreground whitespace-pre-line">
                  {tutor.bio ||
                    tr(
                      "La présentation détaillée sera ajoutée par le répétiteur.",
                      "The tutor will add a detailed introduction.",
                    )}
                </p>
                <dl className="mt-7 space-y-4 text-sm">
                  {[
                    { label: tr("Matières", "Subjects"), value: tutor.subjects.join(" · ") },
                    { label: tr("Niveaux", "Levels"), value: tutor.levels.join(" · ") },
                    { label: tr("Langues", "Languages"), value: tutor.languages.join(" · ") },
                    {
                      label: tr("Expérience déclarée", "Reported experience"),
                      value: `${tutor.years_experience ?? 0} ${tr("ans", "years")}`,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="font-semibold">{item.label}</dt>
                      <dd className="mt-1 text-muted-foreground">{item.value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 text-xs text-muted-foreground">
                  {tr(
                    "Les qualifications et l’expérience sont présentées par le répétiteur. Une candidature approuvée ne constitue pas une certification de diplôme.",
                    "Qualifications and experience are provided by the tutor. Application approval is not a qualification certification.",
                  )}
                </p>
              </article>
              <aside className="rounded-3xl bg-primary-soft border border-border p-6 h-fit">
                <p className="text-3xl font-semibold">
                  {tutor.hourly_rate_fcfa.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB")}{" "}
                  <span className="text-sm font-normal">FCFA / h</span>
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  {tr(
                    "Le montant total est calculé selon la durée choisie avant confirmation. Paiement Mobile Money vérifié par l’équipe.",
                    "The total is calculated from your chosen duration before confirmation. Mobile Money payment is checked by the team.",
                  )}
                </p>
                <Link
                  to="/book"
                  search={{ tutor: tutor.id }}
                  className="mt-6 block text-center rounded-xl bg-primary py-3 font-semibold text-primary-foreground"
                >
                  {tr("Voir les disponibilités", "See availability")}
                </Link>
                <Link
                  to="/contact"
                  className="mt-4 block text-center text-sm font-semibold text-primary"
                >
                  {tr("Poser une question à l’équipe", "Ask the team")}
                </Link>
              </aside>
            </section>
            <section className="mt-12">
              <h2 className="text-2xl font-semibold">
                {tr("Avis après réservation terminée", "Reviews after completed bookings")}
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(
                  "Un avis par réservation, après la séance terminée et le bilan du répétiteur. Les anciens témoignages marketing ne sont pas inclus dans ces notes.",
                  "One review per booking, after a completed lesson and tutor report. Earlier marketing testimonials are not included in these ratings.",
                )}
              </p>
              {reviews.isPending ? (
                <p role="status" className="mt-5">
                  {tr("Chargement des avis…", "Loading reviews…")}
                </p>
              ) : reviews.isError ? (
                <p role="alert" className="mt-5">
                  {tr(
                    "Le service d’avis n’est pas encore disponible.",
                    "The review service is not available yet.",
                  )}
                </p>
              ) : (
                <>
                  {average !== null && (
                    <p className="mt-5 flex gap-2 items-center font-semibold">
                      <Star className="size-5 text-accent" />
                      {average.toFixed(1)} / 5 · {rows.length}
                      {rows.length === 100 ? "+" : ""} {tr("avis récents", "recent reviews")}
                    </p>
                  )}
                  {!rows.length ? (
                    <p className="mt-5 text-muted-foreground">
                      {tr(
                        "Pas encore d’avis issu d’une réservation terminée.",
                        "No completed-booking reviews yet.",
                      )}
                    </p>
                  ) : (
                    <div className="mt-6 grid sm:grid-cols-2 gap-4">
                      {rows.map((review) => (
                        <article key={review.id} className="rounded-2xl border border-border p-6">
                          <p className="font-semibold">
                            {review.display_name} · {review.rating}/5
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString(
                              lang === "fr" ? "fr-FR" : "en-GB",
                            )}{" "}
                            · {tr("Réservation terminée", "Completed booking")}
                          </p>
                          <p className="mt-4 text-sm whitespace-pre-line">{review.comment}</p>
                        </article>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        )}
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
