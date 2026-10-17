import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listMyBookings } from "@/lib/booking.functions";
import { useLang } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { FamilyAssistant } from "@/components/marketplace/FamilyAssistant";
export const Route = createFileRoute("/_authenticated/parent")({
  component: ParentPage,
  head: () => ({ meta: [{ title: "Espace parent — Josh & Co" }] }),
});
function ParentPage() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const load = useServerFn(listMyBookings);
  const query = useQuery({ queryKey: ["my-bookings"], queryFn: () => load({}) });
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-6xl mx-auto px-4 py-12">
        <p className="text-xs uppercase tracking-widest text-primary font-semibold">
          {tr("Espace parent", "Parent space")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {tr("Accompagner sa réussite, simplement.", "Support their success, simply.")}
        </h1>
        <p className="mt-4 text-muted-foreground">
          {tr(
            "Retrouvez vos réservations et choisissez le service adapté à votre famille.",
            "Find your bookings and the right services for your family.",
          )}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {[
            { to: "/cours" as const, title: tr("Trouver un répétiteur", "Find a tutor") },
            { to: "/schools" as const, title: tr("Choisir une école", "Choose a school") },
            {
              to: "/concours" as const,
              title: tr("Comprendre les concours", "Explore entrance exams"),
            },
            {
              to: "/banque-epreuves" as const,
              title: tr("Préparer les examens", "Prepare for exams"),
            },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-2xl bg-primary-soft border border-border p-6 font-semibold hover:border-primary"
            >
              {item.title} →
            </Link>
          ))}
        </div>
        <Link to="/learning" className="mt-8 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground">{tr("Voir les séances, bilans et quiz", "See lessons, reports and quizzes")}</Link>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            {tr("Mes réservations familiales", "My family bookings")}
          </h2>
          {query.isPending ? (
            <p role="status" className="mt-5">
              {tr("Chargement…", "Loading…")}
            </p>
          ) : query.isError ? (
            <p role="alert" className="mt-5">
              {tr(
                "Réservations indisponibles pour le moment.",
                "Bookings are temporarily unavailable.",
              )}
            </p>
          ) : !query.data?.length ? (
            <p className="mt-5 text-muted-foreground">
              {tr(
                "Aucune réservation pour le moment. Choisissez un tuteur pour commencer.",
                "No bookings yet. Choose a tutor to get started.",
              )}
            </p>
          ) : (
            <div className="mt-5 grid gap-3">
              {query.data.map((booking) => (
                <article
                  key={booking.id}
                  className="rounded-2xl border border-border p-5 flex flex-wrap justify-between gap-3"
                >
                  <div>
                    <h3 className="font-semibold">
                      {booking.subject} · {booking.level}
                    </h3>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {new Date(booking.starts_at).toLocaleString(
                        lang === "fr" ? "fr-FR" : "en-GB",
                        { timeZone: "Africa/Douala" },
                      )}{" "}
                      · {tr("heure du Cameroun", "Cameroon time")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">
                      {booking.price_fcfa.toLocaleString()} FCFA
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{booking.status}</p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className="mt-12">
          <FamilyAssistant lang={lang} />
        </div>
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
