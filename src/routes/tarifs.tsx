import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Payment, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/tarifs")({
  head: () => ({
    meta: [
      { title: "Tarifs & Abonnements — Josh & Co" },
      { name: "description", content: "Tarifs des cours particuliers et abonnements à la banque d'épreuves. Paiement Mobile Money." },
      { property: "og:title", content: "Tarifs & Abonnements — Josh & Co" },
      { property: "og:description", content: "Cours particuliers et accès banque d'épreuves. Paiement Mobile Money." },
    ],
  }),
  component: TarifsPage,
});

function TarifsPage() {
  const { lang, setLang } = useLang();
  const plans = [
    {
      name: lang === "fr" ? "Découverte" : "Discovery",
      price: "5 000",
      period: lang === "fr" ? "/ séance" : "/ session",
      features: lang === "fr"
        ? ["1 cours particulier 60 min", "Tuteur assigné", "Support WhatsApp"]
        : ["1 private class 60 min", "Assigned tutor", "WhatsApp support"],
    },
    {
      name: lang === "fr" ? "Mensuel" : "Monthly",
      price: "25 000",
      period: lang === "fr" ? "/ mois" : "/ month",
      features: lang === "fr"
        ? ["Banque d'épreuves complète", "8 cours particuliers / mois", "Google Classroom"]
        : ["Full exam bank", "8 private classes / month", "Google Classroom"],
      featured: true,
    },
    {
      name: lang === "fr" ? "Concours" : "Exam prep",
      price: "120 000",
      period: lang === "fr" ? "/ 6 mois" : "/ 6 months",
      features: lang === "fr"
        ? ["Préparation intensive", "Cours illimités", "Coaching individuel Dr. Josh"]
        : ["Intensive prep", "Unlimited classes", "1-on-1 coaching with Dr. Josh"],
    },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">{lang === "fr" ? "TARIFS" : "PRICING"}</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold">
              {lang === "fr" ? "Des formules adaptées à chaque objectif" : "Plans built around your goals"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {lang === "fr" ? "Prix en FCFA. Paiement par Mobile Money (Orange, MTN)." : "Prices in FCFA. Mobile Money payment (Orange, MTN)."}
            </p>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-5">
            {plans.map((p) => (
              <div key={p.name} className={`rounded-2xl p-8 ring-1 transition-all ${p.featured ? "bg-card ring-primary shadow-[var(--shadow-elegant)] scale-[1.02]" : "bg-card ring-border hover:shadow-[var(--shadow-soft)]"}`}>
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold">{p.price}</span>
                  <span className="text-sm text-muted-foreground">FCFA {p.period}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2"><Check className="size-4 text-[var(--color-success)] shrink-0 mt-0.5" /><span>{f}</span></li>
                  ))}
                </ul>
                <Link to="/auth" className={`mt-8 flex items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-opacity ${p.featured ? "bg-primary text-primary-foreground hover:opacity-95" : "bg-muted hover:bg-muted/80"}`}>
                  {lang === "fr" ? "Choisir" : "Choose"} <ArrowRight className="size-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Payment lang={lang} />
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}