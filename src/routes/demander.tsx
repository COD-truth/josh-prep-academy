import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, CalendarCheck, MessageCircle, ShieldCheck } from "lucide-react";
import { Footer, Nav } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/demander")({
  validateSearch: (search: Record<string, unknown>): { tutor?: string } => ({
    tutor: typeof search.tutor === "string" ? search.tutor.trim().slice(0, 100) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Demander un cours — Josh & Co" },
      {
        name: "description",
        content:
          "Expliquez votre besoin et contactez Josh & Co pour organiser un cours à domicile ou en ligne.",
      },
    ],
  }),
  component: LessonRequest,
});

function LessonRequest() {
  const { lang, setLang } = useLang();
  const { tutor } = Route.useSearch();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [format, setFormat] = useState("either");
  const formatLabel =
    format === "online"
      ? tr("En ligne", "Online")
      : format === "home"
        ? tr("À domicile", "At home")
        : tr("À convenir", "To be agreed");
  const message = [
    tr(
      "Bonjour Josh & Co, je souhaite organiser un cours.",
      "Hello Josh & Co, I would like to arrange a lesson.",
    ),
    ...(tutor ? [tr("Répétiteur souhaité : ", "Preferred tutor: ") + tutor] : []),
    tr("Matière : ", "Subject: ") + subject.trim(),
    tr("Niveau : ", "Level: ") + level.trim(),
    tr("Format : ", "Format: ") + formatLabel,
    tr(
      "Pouvez-vous me confirmer le tarif et les disponibilités ?",
      "Could you confirm the price and available times?",
    ),
  ].join("\n");
  const input =
    "mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-start">
          <section className="rounded-3xl bg-secondary p-6 text-white sm:p-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent">Josh & Co</p>
            <h1 className="mt-4 text-4xl font-semibold">
              {tr("Demander un cours", "Request a lesson")}
            </h1>
            <p className="mt-4 text-white/80">
              {tr(
                "Dites-nous ce que vous recherchez. Notre équipe vous aide à choisir un répétiteur et un créneau.",
                "Tell us what you need. Our team will help you choose a tutor and a time.",
              )}
            </p>
            <ol className="mt-8 space-y-5 text-sm">
              <li className="flex gap-3">
                <MessageCircle className="size-5 shrink-0 text-accent" />
                {tr(
                  "Envoyez votre demande sur WhatsApp. Aucun compte n’est nécessaire.",
                  "Send your request on WhatsApp. No account is needed.",
                )}
              </li>
              <li className="flex gap-3">
                <CalendarCheck className="size-5 shrink-0 text-accent" />
                {tr(
                  "L’équipe confirme le prix et le créneau. Pour un cours en ligne, elle vous communique le lien Meet ou Classroom en privé.",
                  "The team confirms the price and time. For online lessons, they share the Meet or Classroom link privately.",
                )}
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="size-5 shrink-0 text-accent" />
                {tr(
                  "Attendez les instructions officielles avant tout paiement Orange Money ou MTN MoMo. L’équipe vérifie le règlement manuellement.",
                  "Wait for official instructions before paying by Orange Money or MTN MoMo. The team verifies payment manually.",
                )}
              </li>
            </ol>
            <Link
              to="/cours"
              className="mt-8 inline-block font-semibold text-accent underline underline-offset-4"
            >
              {tr("Consulter les profils", "Browse tutor profiles")}
            </Link>
          </section>
          <form
            className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
            onSubmit={(event) => {
              event.preventDefault();
              if (subject.trim() && level.trim()) {
                window.location.assign(
                  "https://wa.me/237691916747?text=" + encodeURIComponent(message),
                );
              }
            }}
          >
            <h2 className="text-xl font-semibold">{tr("Votre demande", "Your request")}</h2>
            {tutor && (
              <p className="mt-2 text-sm text-muted-foreground">
                {tr("Répétiteur souhaité : ", "Preferred tutor: ")}
                {tutor}
              </p>
            )}
            <label className="mt-5 block text-sm font-medium">
              {tr("Matière", "Subject")}
              <input
                className={input}
                required
                maxLength={80}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={tr("Ex. Mathématiques", "E.g. Mathematics")}
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              {tr("Niveau scolaire", "School level")}
              <input
                className={input}
                required
                maxLength={60}
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                placeholder={tr("Ex. Terminale", "E.g. GCE A Level")}
              />
            </label>
            <label className="mt-4 block text-sm font-medium">
              {tr("Format", "Format")}
              <select
                className={input}
                value={format}
                onChange={(event) => setFormat(event.target.value)}
              >
                <option value="either">{tr("À convenir", "To be agreed")}</option>
                <option value="home">{tr("À domicile", "At home")}</option>
                <option value="online">{tr("En ligne", "Online")}</option>
              </select>
            </label>
            <p className="mt-5 text-sm text-muted-foreground">
              {tr(
                "Vous pourrez relire le message avant de l’envoyer. Cette demande ne réserve pas de créneau.",
                "You can review the message before sending it. This request does not reserve a slot.",
              )}
            </p>
            <button
              type="submit"
              disabled={!subject.trim() || !level.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60"
            >
              {tr("Continuer sur WhatsApp", "Continue on WhatsApp")}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
