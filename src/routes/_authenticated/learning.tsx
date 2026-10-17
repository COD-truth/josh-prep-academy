import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLessons } from "@/lib/learning.functions";
import { useLang } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
export const Route = createFileRoute("/_authenticated/learning")({
  component: LearningPage,
  head: () => ({ meta: [{ title: "Mes séances & progrès — Josh & Co" }] }),
});
function LearningPage() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const load = useServerFn(listLessons);
  const query = useQuery({ queryKey: ["learning-lessons"], queryFn: () => load({}), retry: false });
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">
          {tr("Espace apprentissage", "Learning space")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {tr("Vos séances. Vos prochains progrès.", "Your lessons. Your next steps.")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {tr(
            "Retrouvez les séances de votre compte, les bilans du répétiteur, les devoirs et les quiz. Les données d’un enfant sont partagées uniquement via le compte ayant réservé la séance.",
            "Find your account’s lessons, tutor reports, homework and quizzes. A child’s records are shared only through the account that booked the lesson.",
          )}
        </p>
        {query.isPending ? (
          <p role="status" className="mt-8">
            {tr("Chargement des séances…", "Loading lessons…")}
          </p>
        ) : query.isError ? (
          <div role="alert" className="mt-8 border p-6 rounded-xl">
            <p>
              {tr(
                "Les séances sont momentanément indisponibles.",
                "Lessons are temporarily unavailable.",
              )}
            </p>
            <button onClick={() => query.refetch()} className="mt-3 font-semibold text-primary">
              {tr("Réessayer", "Retry")}
            </button>
          </div>
        ) : !query.data?.length ? (
          <div className="mt-8 rounded-2xl bg-primary-soft p-6">
            <p>
              {tr(
                "Aucune séance dans votre compte pour le moment.",
                "No lessons in your account yet.",
              )}
            </p>
            <Link to="/cours" className="mt-4 inline-block text-primary font-semibold">
              {tr("Trouver un répétiteur", "Find a tutor")} →
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {query.data.map((booking) => (
              <article
                key={booking.id}
                className="rounded-2xl border border-border p-6 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <h2 className="text-lg font-semibold">
                    {booking.subject} · {booking.level}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {new Date(booking.starts_at).toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
                      timeZone: "Africa/Douala",
                    })}{" "}
                    · {tr("heure du Cameroun", "Cameroon time")}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {booking.status} · {booking.price_fcfa.toLocaleString()} FCFA
                  </p>
                </div>
                <Link
                  to="/lessons/$bookingId"
                  params={{ bookingId: booking.id }}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
                >
                  {tr("Ouvrir la séance", "Open lesson")}
                </Link>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
