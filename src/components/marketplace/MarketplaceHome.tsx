import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Search,
  GraduationCap,
  CalendarDays,
  MessageCircle,
  Check,
  Sigma,
  Atom,
  Languages,
  Leaf,
} from "lucide-react";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { TutorCatalog } from "./TutorCatalog";
import { useLang } from "@/lib/i18n";
import drJosh from "@/assets/dr-josh.jpg";

export function MarketplaceHome() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const subjects = [
    { fr: "Mathématiques", en: "Mathematics", Icon: Sigma },
    { fr: "Physique", en: "Physics", Icon: Atom },
    { fr: "Français", en: "French", Icon: BookOpen },
    { fr: "Anglais", en: "English", Icon: Languages },
    { fr: "Biologie", en: "Biology", Icon: Leaf },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <main>
        <section className="relative overflow-hidden bg-primary-soft/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20 grid lg:grid-cols-[1.15fr_.85fr] gap-12 items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 text-xs font-semibold text-primary">
                <GraduationCap className="size-4" />
                {tr("À domicile & en ligne · Cameroun", "At home & online · Cameroon")}
              </p>
              <h1 className="mt-6 max-w-2xl text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.08] tracking-tight">
                {tr("Le bon prof.", "The right teacher.")}
                <br />
                <span className="font-display italic text-primary">
                  {tr("Le déclic pour réussir.", "Your moment to thrive.")}
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                {tr(
                  "Un tuteur qui vous comprend, des cours à votre rythme et des ressources pour réviser. Du primaire à l'université, en français comme en anglais.",
                  "A tutor who understands you, lessons at your pace and resources to revise. From primary school to university, in French and English.",
                )}
              </p>
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  navigate({ to: "/cours", search: { q: query.trim() } });
                }}
                className="mt-8 rounded-2xl border border-border bg-card p-2 shadow-lg flex flex-col sm:flex-row gap-2"
              >
                <label className="flex-1 flex items-center gap-3 px-3 py-3">
                  <Search className="size-5 shrink-0 text-primary" />
                  <span className="sr-only">
                    {tr(
                      "Quelle matière souhaitez-vous travailler ?",
                      "What would you like to study?",
                    )}
                  </span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={tr(
                      "Quelle matière cherchez-vous ?",
                      "What would you like to learn?",
                    )}
                    className="min-w-0 w-full bg-transparent text-sm outline-none"
                  />
                </label>
                <button className="flex justify-center items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
                  {tr("Trouver mon prof", "Find my tutor")}
                  <ArrowRight className="size-4" />
                </button>
              </form>
              <p className="mt-4 text-sm text-muted-foreground">
                {tr("Vous préférez être conseillé ?", "Prefer some guidance?")}{" "}
                <Link
                  to="/contact"
                  className="font-semibold text-primary underline underline-offset-4"
                >
                  {tr("Parlons de votre besoin", "Tell us what you need")}
                </Link>
              </p>
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold">
                {[
                  tr("Tarifs en FCFA", "Prices in FCFA"),
                  tr("Parcours francophone & anglophone", "French & English curricula"),
                  tr("Orange Money & MTN", "Orange Money & MTN"),
                ].map((text) => (
                  <span key={text} className="flex gap-1.5 items-center">
                    <Check className="size-4 text-primary" />
                    {text}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md lg:pl-6">
              <div className="overflow-hidden rounded-[2.5rem] bg-primary border-8 border-card shadow-xl">
                <img
                  src={drJosh}
                  alt="Dr. Josh"
                  width="896"
                  height="1120"
                  className="w-full aspect-[4/4.5] object-cover"
                />
              </div>
              <div className="absolute bottom-5 left-2 sm:-left-4 rounded-2xl bg-card border border-border p-4 shadow-lg max-w-[270px]">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {tr("Un accompagnement humain", "A human approach")}
                </p>
                <p className="mt-1 font-semibold">Dr. Josh · Josh & Co</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {tr("Comprendre. S'entraîner. Progresser.", "Understand. Practise. Progress.")}
                </p>
              </div>
              <div className="absolute -top-3 right-0 rounded-2xl bg-card border border-border px-4 py-3 shadow-sm flex gap-3 items-center">
                <BookOpen className="size-5 text-primary" />
                <span className="text-xs font-semibold">BEPC · BAC · GCE</span>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-10 border-b border-border">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold mr-3">
              {tr("On commence par…", "Let's start with…")}
            </p>
            {subjects.map(({ fr, en, Icon }) => (
              <Link
                key={fr}
                to="/cours"
                search={{ q: lang === "fr" ? fr : en }}
                className="inline-flex gap-2 items-center rounded-full border border-border bg-card px-5 py-3 text-sm font-semibold hover:bg-primary-soft hover:border-primary"
              >
                <Icon className="size-4 text-primary" />
                {tr(fr, en)}
              </Link>
            ))}
          </div>
        </section>
        <TutorCatalog lang={lang} compact />
        <section className="bg-secondary text-secondary-foreground py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[.18em] text-accent font-semibold">
                {tr("Un parcours simple", "A simple journey")}
              </p>
              <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">
                {tr("Moins de démarches. Plus de progrès.", "Less organising. More learning.")}
              </h2>
            </div>
            <div className="mt-10 grid gap-8 md:grid-cols-3">
              {[
                {
                  Icon: Search,
                  title: tr("Trouvez votre tuteur", "Find your tutor"),
                  text: tr(
                    "Matière, niveau, langue et budget : comparez les profils selon votre besoin.",
                    "Subject, level, language and budget: compare profiles for your needs.",
                  ),
                },
                {
                  Icon: CalendarDays,
                  title: tr("Choisissez votre créneau", "Choose your time"),
                  text: tr(
                    "Consultez les disponibilités, précisez votre objectif et demandez votre séance.",
                    "Check availability, share your goal and request a lesson.",
                  ),
                },
                {
                  Icon: BookOpen,
                  title: tr("Travaillez entre les séances", "Learn between lessons"),
                  text: tr(
                    "Retrouvez la banque d'épreuves pour préparer vos examens et cibler vos révisions.",
                    "Explore the exam bank to prepare for exams and focus your revision.",
                  ),
                },
              ].map(({ Icon, title, text }, i) => (
                <article key={title}>
                  <div className="flex justify-between items-center border-b border-white/20 pb-4">
                    <Icon className="size-6 text-accent" />
                    <span className="text-sm text-white/50">0{i + 1}</span>
                  </div>
                  <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/70">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-14 lg:py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-border bg-primary-soft/50 p-7 sm:p-10">
              <BookOpen className="size-8 text-primary" />
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-primary">
                {tr("L'espace révision", "Your revision space")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                {tr("Un examen en vue ?", "An exam coming up?")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {tr(
                  "BEPC, Probatoire, Baccalauréat, GCE : explorez les annales par matière et par année, puis accédez aux ressources depuis votre espace.",
                  "BEPC, Probatoire, Baccalaureate, GCE: browse past papers by subject and year, then access resources from your account.",
                )}
              </p>
              <Link
                to="/banque-epreuves"
                className="mt-6 inline-flex gap-2 items-center font-semibold text-primary"
              >
                {tr("Explorer les épreuves", "Explore past papers")}
                <ArrowRight className="size-4" />
              </Link>
            </article>
            <article className="rounded-3xl border border-border bg-card p-7 sm:p-10">
              <MessageCircle className="size-8 text-primary" />
              <p className="mt-6 text-xs font-bold uppercase tracking-wider text-primary">
                {tr("Pour les familles", "For families")}
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                {tr("Ne cherchez pas seul.", "You don't have to search alone.")}
              </h2>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {tr(
                  "Expliquez-nous la classe, les difficultés et vos disponibilités. Notre équipe vous aide à choisir un accompagnement adapté, à domicile ou en ligne.",
                  "Tell us the level, challenges and your availability. Our team helps you choose suitable support, at home or online.",
                )}
              </p>
              <Link
                to="/contact"
                className="mt-6 inline-flex gap-2 items-center font-semibold text-primary"
              >
                {tr("Demander un accompagnement", "Ask for guidance")}
                <ArrowRight className="size-4" />
              </Link>
            </article>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-16">
          <div className="rounded-3xl border border-border p-7 sm:p-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                {tr("Vous aimez transmettre ?", "Love teaching?")}
              </h2>
              <p className="mt-2 text-muted-foreground">
                {tr(
                  "Présentez vos matières et vos disponibilités à l'équipe Josh & Co.",
                  "Share your subjects and availability with the Josh & Co team.",
                )}
              </p>
            </div>
            <Link
              to="/contact"
              className="shrink-0 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground"
            >
              {tr("Proposer mes cours", "Offer my lessons")}
            </Link>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
