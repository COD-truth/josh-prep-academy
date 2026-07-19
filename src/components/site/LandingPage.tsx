import { useLang, translations as T, t, type Lang } from "@/lib/i18n";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import drJosh from "@/assets/dr-josh.jpg";
import {
  Sigma, Atom, BookOpen, Languages, Stethoscope, Brain,
  Calendar, Lock, Check, MessageCircle, Star, GraduationCap,
  ArrowRight, ShieldCheck, Sparkles,
} from "lucide-react";

export function LandingPage() {
  const { lang, setLang } = useLang();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <Hero lang={lang} />
      <Subjects lang={lang} />
      <Booking lang={lang} />
      <Tutors lang={lang} />
      <ExamBank lang={lang} />
      <Payment lang={lang} />
      <Testimonials lang={lang} />
      <Classroom lang={lang} />
      <FinalCTA lang={lang} />
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}

function Logo() {
  return (
    <a href="#" className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-[var(--gradient-hero)] text-primary-foreground font-bold text-sm shadow-[var(--shadow-soft)]">
        J&amp;C
      </span>
      <span className="font-display text-lg font-semibold tracking-tight">Josh &amp; Co</span>
    </a>
  );
}

function LangSwitch({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="flex items-center gap-1 rounded-full bg-muted p-1 text-xs font-semibold">
      {(["fr", "en"] as Lang[]).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${
            lang === l ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

export function Nav({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  const { user } = useAuth();
  return (
    <nav className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Logo />
        <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-muted-foreground">
          <Link to="/cours" className="hover:text-foreground transition-colors">{lang === "fr" ? "Cours" : "Courses"}</Link>
          <Link to="/matieres" className="hover:text-foreground transition-colors">{lang === "fr" ? "Matières" : "Subjects"}</Link>
          <Link to="/tarifs" className="hover:text-foreground transition-colors">{lang === "fr" ? "Tarifs" : "Pricing"}</Link>
          <Link to="/banque-epreuves" className="hover:text-foreground transition-colors">{t(T.nav.exams, lang)}</Link>
          <Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-3">
          <LangSwitch lang={lang} setLang={setLang} />
          {user ? (
            <Link to="/dashboard" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity">
              {lang === "fr" ? "Mon espace" : "Dashboard"} <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link to="/auth" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity">
              {lang === "fr" ? "Se connecter" : "Sign in"} <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function Hero({ lang }: { lang: Lang }) {
  return (
    <header className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "linear-gradient(135deg, #0C4A6E 0%, #164E63 100%)" }} />
      <div aria-hidden className="absolute -top-32 -right-32 size-[480px] rounded-full bg-white/10 blur-3xl -z-10" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-16 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 ring-1 ring-white/20 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-300" />
            </span>
            {t(T.hero.badge, lang)}
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-semibold leading-[1.05] text-balance text-white">
            {t(T.hero.title1, lang)}{" "}
            <span className="italic font-display text-amber-300">{t(T.hero.title2, lang)}</span>.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80 leading-relaxed text-pretty">
            {t(T.hero.subtitle, lang)}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/cours" className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 font-semibold text-slate-900 shadow-[var(--shadow-elegant)] hover:bg-amber-300 transition-colors">
              {t(T.hero.cta1, lang)} <ArrowRight className="size-4" />
            </Link>
            <Link to="/banque-epreuves" className="inline-flex items-center gap-2 rounded-xl bg-white/10 ring-1 ring-white/25 text-white px-6 py-3.5 font-semibold hover:bg-white/20 transition-colors backdrop-blur">
              {t(T.hero.cta2, lang)}
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-6 items-center text-sm text-white/70">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-emerald-400" /> Mobile Money · Orange · MTN</div>
            <div className="flex items-center gap-2"><GraduationCap className="size-4 text-amber-300" /> Google Classroom</div>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-3xl ring-1 ring-white/20 shadow-[var(--shadow-elegant)] bg-card">
            <img src={drJosh} alt="Dr. Josh" width={896} height={1120} className="size-full object-cover" />
          </div>
          <div className="absolute -bottom-6 -left-6 max-w-[260px] rounded-2xl bg-card p-5 ring-1 ring-border shadow-[var(--shadow-soft)]">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)]">
                <Check className="size-5" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t(T.hero.stat1, lang)}</p>
                <p className="text-base font-semibold">{t(T.hero.stat1v, lang)}</p>
              </div>
            </div>
          </div>
          <div className="absolute -top-4 -right-4 rounded-2xl bg-card p-4 ring-1 ring-border shadow-[var(--shadow-soft)] hidden sm:block">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span className="text-sm font-semibold">Dr. Josh</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">PhD · Fondateur</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">{children}</span>;
}

export function Subjects({ lang }: { lang: Lang }) {
  const icons = [Sigma, Atom, BookOpen, Languages, Stethoscope, Brain];
  return (
    <section id="subjects" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionEyebrow>{t(T.subjects.eyebrow, lang)}</SectionEyebrow>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">{t(T.subjects.title, lang)}</h2>
          <p className="mt-3 text-muted-foreground">{t(T.subjects.sub, lang)}</p>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {T.subjects.items.map((it, i) => {
            const Icon = icons[i];
            const [name, desc] = it[lang];
            return (
              <article key={i} className="group rounded-2xl bg-card p-7 ring-1 ring-border hover:ring-primary/40 hover:shadow-[var(--shadow-soft)] transition-all">
                <div className="grid size-12 place-items-center rounded-xl bg-primary-soft text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{name}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function Booking({ lang }: { lang: Lang }) {
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const dates = Array.from({ length: 35 }, (_, i) => i - 2);
  const slots = ["09:00", "11:30", "14:00", "16:30"];
  return (
    <section id="booking" className="py-20 lg:py-28 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <span className="text-xs font-bold tracking-[0.18em] uppercase text-accent">{t(T.booking.eyebrow, lang)}</span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-balance">{t(T.booking.title, lang)}</h2>
          <ul className="mt-10 space-y-5">
            {[T.booking.step1, T.booking.step2, T.booking.step3, T.booking.step4].map((s, i) => (
              <li key={i} className="flex items-center gap-4">
                <span className="grid size-10 place-items-center rounded-full ring-1 ring-white/20 text-sm font-semibold">{i + 1}</span>
                <span className="font-medium">{t(s, lang)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl bg-card text-foreground p-6 sm:p-8 shadow-[var(--shadow-elegant)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <Calendar className="size-5 text-primary" /> {t(T.booking.cal, lang)}
            </div>
            <div className="flex gap-1.5">
              <button className="size-8 rounded-full ring-1 ring-border hover:bg-muted">‹</button>
              <button className="size-8 rounded-full ring-1 ring-border hover:bg-muted">›</button>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {days.map((d, i) => <span key={i}>{d}</span>)}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {dates.map((d) => {
              const inMonth = d > 0 && d <= 28;
              const active = d === 12;
              const has = [5, 8, 14, 19, 22].includes(d);
              return (
                <button
                  key={d}
                  disabled={!inMonth}
                  className={`aspect-square rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                      : inMonth
                      ? "hover:bg-primary-soft text-foreground"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {inMonth ? d : ""}
                  {has && !active && <span className="block mx-auto mt-0.5 size-1 rounded-full bg-primary" />}
                </button>
              );
            })}
          </div>
          <div className="mt-6 border-t border-border pt-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">{t(T.booking.slots, lang)}</p>
            <div className="flex flex-wrap gap-2">
              {slots.map((s, i) => (
                <button key={s} className={`rounded-lg px-3.5 py-2 text-sm font-semibold ring-1 transition-colors ${
                  i === 2 ? "bg-primary-soft text-primary ring-primary" : "ring-border hover:border-primary hover:ring-primary"
                }`}>{s}</button>
              ))}
            </div>
          </div>
          <button className="mt-6 w-full rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-95 transition-opacity">
            {t(T.booking.confirm, lang)}
          </button>
        </div>
      </div>
    </section>
  );
}

export function Tutors({ lang }: { lang: Lang }) {
  const tutors = [
    { name: "Sarah Bakari", role: { fr: "ENS Lyon · Mathématiques", en: "ENS Lyon · Mathematics" }, init: "SB" },
    { name: "Marc-Antoine N.", role: { fr: "Polytechnique · Physique-Chimie", en: "Polytechnique · Physics-Chem" }, init: "MA" },
    { name: "Dr. Ibrahim K.", role: { fr: "Sorbonne · Lettres modernes", en: "Sorbonne · Modern Letters" }, init: "IK" },
    { name: "Alice Mensah", role: { fr: "Cambridge · English & IELTS", en: "Cambridge · English & IELTS" }, init: "AM" },
  ];
  return (
    <section id="tutors" className="py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <SectionEyebrow>{t(T.tutors.eyebrow, lang)}</SectionEyebrow>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">{t(T.tutors.title, lang)}</h2>
            <p className="mt-3 text-muted-foreground">{t(T.tutors.sub, lang)}</p>
          </div>
        </div>
        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {tutors.map((tu) => (
            <article key={tu.name} className="rounded-2xl bg-card p-6 ring-1 ring-border hover:shadow-[var(--shadow-soft)] transition-shadow">
              <div className="grid size-14 place-items-center rounded-2xl bg-[var(--gradient-hero)] text-primary-foreground font-display font-semibold text-lg">
                {tu.init}
              </div>
              <h3 className="mt-5 font-semibold text-lg">{tu.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t(tu.role, lang)}</p>
              <div className="mt-4 flex gap-0.5 text-[var(--color-success)]">
                {[0, 1, 2, 3, 4].map((i) => <Star key={i} className="size-3.5 fill-current" />)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function ExamBank({ lang }: { lang: Lang }) {
  const items = [
    { title: "Concours ENSPY 2024 — Mathématiques", meta: "PDF · 15 pages · Corrigé Dr. Josh" },
    { title: "FMSB CUSS 2023 — Biologie & Chimie", meta: "QCM · 80 questions · Explications" },
    { title: "Polytechnique 2022 — Physique I", meta: "PDF · 22 pages · Corrigé détaillé" },
  ];
  return (
    <section id="exams" className="py-20 lg:py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionEyebrow>{t(T.exams.eyebrow, lang)}</SectionEyebrow>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">{t(T.exams.title, lang)}</h2>
          <p className="mt-3 text-muted-foreground">{t(T.exams.sub, lang)}</p>
        </div>
        <div className="mt-12 grid gap-4">
          {items.map((it) => (
            <div key={it.title} className="flex items-center justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-border">
              <div className="flex items-center gap-4 min-w-0">
                <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary font-bold text-xs">PDF</div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{it.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.meta}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="hidden md:inline text-[10px] font-bold tracking-wider text-muted-foreground">{t(T.exams.locked, lang)}</span>
                <div className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground"><Lock className="size-4" /></div>
              </div>
            </div>
          ))}
          <Link to="/auth" className="flex items-center justify-between gap-4 rounded-2xl border-2 border-dashed border-primary/30 bg-card p-6 hover:bg-primary-soft/40 transition-colors">
            <p className="font-medium text-muted-foreground">{t(T.exams.sub, lang)}</p>
            <span className="inline-flex items-center gap-2 font-semibold text-primary whitespace-nowrap">
              {t(T.exams.unlock, lang)} <ArrowRight className="size-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export function Payment({ lang }: { lang: Lang }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
        <SectionEyebrow>{t(T.payment.eyebrow, lang)}</SectionEyebrow>
        <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">{t(T.payment.title, lang)}</h2>
        <p className="mt-3 text-muted-foreground">{t(T.payment.sub, lang)}</p>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          <div className="group rounded-2xl bg-card p-8 ring-1 ring-border hover:ring-[#FF7900] hover:shadow-[var(--shadow-soft)] transition-all cursor-pointer">
            <div className="mx-auto h-14 w-24 rounded-lg bg-[#FF7900] grid place-items-center font-black italic text-white">orange</div>
            <p className="mt-5 font-semibold">Orange Money</p>
            <p className="mt-1 text-xs text-muted-foreground">CI · CM · SN · ML · BF</p>
          </div>
          <div className="group rounded-2xl bg-card p-8 ring-1 ring-border hover:ring-[#FFCC00] hover:shadow-[var(--shadow-soft)] transition-all cursor-pointer">
            <div className="mx-auto h-14 w-24 rounded-lg bg-[#FFCC00] grid place-items-center font-black italic text-[#0a3d62]">MTN</div>
            <p className="mt-5 font-semibold">MTN MoMo</p>
            <p className="mt-1 text-xs text-muted-foreground">CM · GH · CI · UG · RW</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials({ lang }: { lang: Lang }) {
  return (
    <section id="testimonials" className="py-20 lg:py-28 bg-muted/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <SectionEyebrow>{t(T.testimonials.eyebrow, lang)}</SectionEyebrow>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">{t(T.testimonials.title, lang)}</h2>
        </div>
        <div className="mt-12 grid md:grid-cols-3 gap-5">
          {T.testimonials.items.map((it, i) => (
            <figure key={i} className="rounded-2xl bg-card p-7 ring-1 ring-border">
              <div className="flex gap-0.5 text-[var(--color-success)]">
                {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="size-4 fill-current" />)}
              </div>
              <blockquote className="mt-5 font-display italic text-lg leading-relaxed">"{it[lang].q}"</blockquote>
              <figcaption className="mt-5 text-xs font-bold tracking-wider uppercase text-primary">{it[lang].a}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Classroom({ lang }: { lang: Lang }) {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl bg-primary-soft p-8 lg:p-10 flex flex-col md:flex-row items-center gap-6 ring-1 ring-primary/15">
          <div className="grid size-16 place-items-center rounded-2xl bg-card shadow-[var(--shadow-soft)]">
            <GraduationCap className="size-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left min-w-0">
            <h3 className="text-xl font-semibold">{t(T.classroom.title, lang)}</h3>
            <p className="mt-1 text-muted-foreground text-sm">{t(T.classroom.sub, lang)}</p>
          </div>
          <a href="#" className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95 transition-opacity">
            {t(T.classroom.cta, lang)} <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCTA({ lang }: { lang: Lang }) {
  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl p-10 sm:p-16 text-center text-primary-foreground shadow-[var(--shadow-elegant)]"
          style={{ background: "var(--gradient-hero)" }}
        >
          <h2 className="text-3xl sm:text-5xl font-semibold text-balance">{t(T.cta.title, lang)}</h2>
          <p className="mt-4 text-primary-foreground/80 max-w-xl mx-auto">{t(T.cta.sub, lang)}</p>
          <a href="#booking" className="mt-8 inline-flex items-center gap-2 rounded-full bg-card px-7 py-3.5 font-semibold text-primary hover:bg-card/95 transition-colors">
            {t(T.cta.btn, lang)} <ArrowRight className="size-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="bg-secondary text-secondary-foreground py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/10">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm text-white/60">{t(T.footer.tagline, lang)}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{t(T.footer.services, lang)}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li><Link to="/cours" className="hover:text-white">{lang === "fr" ? "Cours" : "Courses"}</Link></li>
              <li><Link to="/matieres" className="hover:text-white">{lang === "fr" ? "Matières" : "Subjects"}</Link></li>
              <li><Link to="/tarifs" className="hover:text-white">{lang === "fr" ? "Tarifs" : "Pricing"}</Link></li>
              <li><Link to="/banque-epreuves" className="hover:text-white">{t(T.nav.exams, lang)}</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider">{t(T.footer.contact, lang)}</h4>
            <ul className="space-y-3 text-sm text-white/60">
              <li>contact@joshandco.academy</li>
              <li>+237 6XX XX XX XX</li>
              <li>Yaoundé · Abidjan · Dakar</li>
            </ul>
          </div>
        </div>
        <div className="pt-8 flex flex-col md:flex-row justify-between gap-3 text-xs text-white/40">
          <p>© 2026 Josh &amp; Co. {t(T.footer.rights, lang)}</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white">Privacy</a>
            <a href="#" className="hover:text-white">Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href="https://wa.me/237600000000"
      target="_blank"
      rel="noopener"
      aria-label="WhatsApp"
      className="fixed bottom-6 right-6 z-50 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-[var(--shadow-elegant)] hover:scale-110 active:scale-95 transition-transform"
    >
      <MessageCircle className="size-6" />
      <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-destructive text-[10px] font-bold ring-2 ring-background">1</span>
    </a>
  );
}