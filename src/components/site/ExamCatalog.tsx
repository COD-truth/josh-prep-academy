import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Lock, Search } from "lucide-react";
import { type Lang } from "@/lib/i18n";
import { examPapers, examTypeLabels, type ExamPaper } from "@/lib/site-content";

const ALL = "ALL";

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

export function ExamCatalog({ lang }: { lang: Lang }) {
  const [type, setType] = useState<string>(ALL);
  const [subject, setSubject] = useState<string>(ALL);
  const [year, setYear] = useState<string>(ALL);
  const [q, setQ] = useState("");

  const subjects = useMemo(() => Array.from(new Set(examPapers.map((p) => p.subject))).sort(), []);
  const years = useMemo(
    () => Array.from(new Set(examPapers.map((p) => p.year))).sort((a, b) => b - a),
    [],
  );

  const results = useMemo(
    () =>
      examPapers.filter((p: ExamPaper) => {
        if (type !== ALL && p.examType !== type) return false;
        if (subject !== ALL && p.subject !== subject) return false;
        if (year !== ALL && String(p.year) !== year) return false;
        if (q.trim() && !p.title.toLowerCase().includes(q.trim().toLowerCase())) return false;
        return true;
      }),
    [type, subject, year, q],
  );

  return (
    <section className="py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
            {lang === "fr" ? "ANNALES" : "PAST PAPERS"}
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">
            {lang === "fr" ? "200+ annales passées" : "200+ past exam papers"}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {lang === "fr"
              ? "Filtrez par examen, matière et année. Les corrigés complets sont réservés aux abonnés."
              : "Filter by exam, subject and year. Full solutions are reserved for subscribers."}
          </p>
        </div>

        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={lang === "fr" ? "Rechercher une épreuve…" : "Search a paper…"}
            className="w-full rounded-xl bg-card pl-10 pr-4 py-2.5 text-sm ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Chip active={type === ALL} onClick={() => setType(ALL)}>{lang === "fr" ? "Tous les examens" : "All exams"}</Chip>
            {(Object.keys(examTypeLabels) as ExamPaper["examType"][]).map((k) => (
              <Chip key={k} active={type === k} onClick={() => setType(k)}>{examTypeLabels[k]}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={subject === ALL} onClick={() => setSubject(ALL)}>{lang === "fr" ? "Toutes matières" : "All subjects"}</Chip>
            {subjects.map((s) => (
              <Chip key={s} active={subject === s} onClick={() => setSubject(s)}>{s}</Chip>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip active={year === ALL} onClick={() => setYear(ALL)}>{lang === "fr" ? "Toutes années" : "All years"}</Chip>
            {years.map((y) => (
              <Chip key={y} active={year === String(y)} onClick={() => setYear(String(y))}>{y}</Chip>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          {results.length} {lang === "fr" ? "épreuve(s)" : "paper(s)"}
        </p>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((p) => (
            <article key={p.id} className="rounded-2xl bg-card p-6 ring-1 ring-border hover:ring-primary/40 transition-all">
              <div className="flex items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <FileText className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold leading-snug">{p.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {examTypeLabels[p.examType]} · {p.year} · {p.pages} {lang === "fr" ? "pages" : "pages"}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{lang === "fr" ? p.descFr : p.descEn}</p>
              <Link
                to="/exams"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Lock className="size-3.5" />
                {lang === "fr" ? "Télécharger" : "Download"}
              </Link>
            </article>
          ))}
        </div>

        {results.length === 0 && (
          <p className="mt-10 text-center text-muted-foreground">
            {lang === "fr" ? "Aucune épreuve ne correspond à ces filtres." : "No paper matches these filters."}
          </p>
        )}

        <div className="mt-12 rounded-3xl bg-primary-soft ring-1 ring-primary/15 p-8 text-center">
          <p className="text-lg font-semibold">
            {lang === "fr" ? "500+ épreuves disponibles avec l'abonnement" : "500+ papers available with a subscription"}
          </p>
          <Link
            to="/subscribe"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95 transition-opacity"
          >
            {lang === "fr" ? "S'abonner maintenant" : "Subscribe now"}
          </Link>
        </div>
      </div>
    </section>
  );
}
