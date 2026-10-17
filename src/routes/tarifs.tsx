import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { publicTutors } from "@/lib/public-tutors";
import { withTimeout } from "@/lib/request-timeout";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
export const Route = createFileRoute("/tarifs")({
  component: Pricing,
  head: () => ({ meta: [{ title: "Tarifs transparents — Josh & Co" }] }),
});
function Pricing() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const tutors = useQuery({
    queryKey: ["tutors-active"],
    queryFn: () => publicTutors(),
    retry: false,
  });
  const plans = useQuery({
    queryKey: ["public-subscription-plans"],
    queryFn: async () => {
      const { data, error } = await withTimeout(
        supabase
          .from("subscription_plans")
          .select("id,name_fr,name_en,price_xaf,duration_days")
          .eq("active", true)
          .order("price_xaf"),
      );
      if (error) throw error;
      return data ?? [];
    },
    retry: false,
  });
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-6xl mx-auto px-4 py-14">
        <p className="text-xs text-primary uppercase tracking-widest font-semibold">
          {tr("Tarifs en FCFA", "Prices in FCFA")}
        </p>
        <h1 className="mt-3 text-4xl font-semibold">
          {tr("Le prix avant de réserver.", "Know the price before booking.")}
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          {tr(
            "Les cours sont facturés selon le tarif horaire du répétiteur et la durée choisie. La banque d’épreuves dispose d’abonnements séparés.",
            "Lessons are priced using the tutor’s hourly rate and your chosen duration. The exam bank has separate subscriptions.",
          )}
        </p>
        <section className="mt-10 rounded-3xl border border-border p-7">
          <h2 className="text-2xl font-semibold">{tr("Cours particuliers", "Private lessons")}</h2>
          {tutors.isPending ? (
            <p role="status" className="mt-4">
              {tr("Chargement des tarifs…", "Loading prices…")}
            </p>
          ) : tutors.isError ? (
            <p role="alert" className="mt-4">
              {tr(
                "Tarifs momentanément indisponibles. Contactez l’équipe.",
                "Prices are temporarily unavailable. Contact the team.",
              )}
            </p>
          ) : tutors.data?.length ? (
            <>
              <p className="mt-4 text-3xl font-semibold text-primary">
                {tr("À partir de", "From")}{" "}
                {Math.min(...tutors.data.map((t) => t.hourly_rate_fcfa)).toLocaleString()} FCFA / h
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {tr(
                  "Le tarif exact figure sur chaque profil. Total = tarif horaire × durée en minutes ÷ 60, arrondi au FCFA.",
                  "Each profile shows its exact rate. Total = hourly price × minutes ÷ 60, rounded to the nearest FCFA.",
                )}
              </p>
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">
              {tr(
                "Les tarifs seront affichés dès la publication des profils.",
                "Rates will appear when profiles are published.",
              )}
            </p>
          )}
          <Link
            to="/cours"
            className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
          >
            {tr("Comparer les répétiteurs", "Compare tutors")}
          </Link>
        </section>
        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            {tr("Abonnements à la banque d’épreuves", "Exam-bank subscriptions")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {tr(
              "Ces abonnements donnent accès aux ressources ; ils n’incluent pas de cours particuliers sauf indication explicite de l’équipe.",
              "These subscriptions cover resources; tutoring is not included unless the team explicitly confirms otherwise.",
            )}
          </p>
          {plans.isPending ? (
            <p role="status" className="mt-5">
              {tr("Chargement…", "Loading…")}
            </p>
          ) : plans.isError ? (
            <p role="alert" className="mt-5">
              {tr(
                "Les formules ne sont pas disponibles pour le moment.",
                "Plans are temporarily unavailable.",
              )}
            </p>
          ) : !plans.data?.length ? (
            <p className="mt-5 text-muted-foreground">
              {tr("Aucune formule active publiée.", "No active plans published.")}
            </p>
          ) : (
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {plans.data.map((plan) => (
                <article key={plan.id} className="border border-border rounded-2xl p-6">
                  <h3 className="text-xl font-semibold">
                    {lang === "fr" ? plan.name_fr : plan.name_en}
                  </h3>
                  <p className="mt-4 text-3xl font-semibold">
                    {plan.price_xaf.toLocaleString()} <span className="text-sm">FCFA</span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {plan.duration_days} {tr("jours d’accès", "days of access")}
                  </p>
                  <Link to="/subscribe" className="inline-block mt-5 text-primary font-semibold">
                    {tr("Voir les conditions et souscrire", "See terms and subscribe")} →
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
        <section className="mt-12 rounded-2xl bg-primary-soft p-7">
          <h2 className="text-xl font-semibold">
            {tr("Paiement et confirmation", "Payment and confirmation")}
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            {tr(
              "Orange Money et MTN MoMo. La référence de transaction est soumise à vérification par Josh & Co ; une saisie de référence ne vaut pas confirmation de paiement. Pour une annulation, un report ou un remboursement, contactez l’équipe avant de payer si vous avez une question.",
              "Orange Money and MTN MoMo. Josh & Co verifies the transaction reference; submitting a reference does not confirm payment. Ask the team about cancellation, rescheduling or refunds before paying if you have questions.",
            )}
          </p>
          <Link to="/contact" className="mt-4 inline-block font-semibold text-primary">
            Contact →
          </Link>
        </section>
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
