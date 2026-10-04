import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
import { Search, Home, BookOpen } from "lucide-react";

export const Route = createFileRoute("/matieres")({
  head: () => ({
    meta: [
      { title: "Matières & Niveaux — Josh & Co" },
      { name: "description", content: "Toutes les matières du primaire au Bac/GCE A Level : anglophone et francophone. Cours à domicile et annales dans la banque d'épreuves." },
      { property: "og:title", content: "Matières & Niveaux — Josh & Co" },
      { property: "og:description", content: "Primaire, Collège, Lycée, Terminale, GCE O/A, Probatoire, Baccalauréat." },
    ],
  }),
  component: MatieresPage,
});

type Subject = { fr: string; en: string; home?: boolean; bank?: boolean };
type Level = { id: string; fr: string; en: string; sub?: { fr: string; en: string }; subjects: Subject[] };

const LEVELS: Level[] = [
  {
    id: "primaire",
    fr: "Primaire", en: "Primary",
    sub: { fr: "Classes 1 à 6", en: "Classes 1–6" },
    subjects: [
      { fr: "Mathématiques", en: "Mathematics", home: true, bank: true },
      { fr: "Anglais", en: "English", home: true, bank: true },
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Sciences (SVT)", en: "Science", home: true, bank: true },
      { fr: "Études sociales", en: "Social Studies", home: true, bank: true },
      { fr: "Éducation civique", en: "Civics", home: true },
    ],
  },
  {
    id: "college",
    fr: "Collège", en: "Middle School",
    sub: { fr: "6ème → 3ème / Forms 1–4", en: "Forms 1–4" },
    subjects: [
      { fr: "Mathématiques", en: "Mathematics", home: true, bank: true },
      { fr: "Anglais", en: "English", home: true, bank: true },
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Physique-Chimie", en: "Physics & Chemistry", home: true, bank: true },
      { fr: "SVT / Biologie", en: "Biology (SVT)", home: true, bank: true },
      { fr: "Histoire-Géographie", en: "History-Geography", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true },
      { fr: "Éducation civique", en: "Civics", home: true },
    ],
  },
  {
    id: "lycee",
    fr: "Lycée", en: "High School",
    sub: { fr: "Seconde, Première / Lower & Upper 6th", en: "Lower & Upper 6th" },
    subjects: [
      { fr: "Mathématiques", en: "Mathematics", home: true, bank: true },
      { fr: "Physique", en: "Physics", home: true, bank: true },
      { fr: "Chimie", en: "Chemistry", home: true, bank: true },
      { fr: "Biologie", en: "Biology", home: true, bank: true },
      { fr: "Anglais", en: "English", home: true, bank: true },
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Histoire", en: "History", home: true, bank: true },
      { fr: "Géographie", en: "Geography", home: true, bank: true },
      { fr: "Littérature", en: "Literature", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true, bank: true },
      { fr: "Éducation civique", en: "Civics", home: true },
    ],
  },
  {
    id: "terminale",
    fr: "Terminale / Upper 6th", en: "Terminale / Upper 6th",
    sub: { fr: "Préparation Bac / GCE A", en: "Bac / GCE A prep" },
    subjects: [
      { fr: "Mathématiques avancées", en: "Advanced Mathematics", home: true, bank: true },
      { fr: "Physique avancée", en: "Advanced Physics", home: true, bank: true },
      { fr: "Chimie avancée", en: "Advanced Chemistry", home: true, bank: true },
      { fr: "Biologie avancée", en: "Advanced Biology", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true, bank: true },
      { fr: "Littérature", en: "Literature", home: true, bank: true },
      { fr: "Économie", en: "Economics", home: true, bank: true },
    ],
  },
  {
    id: "gce-o",
    fr: "GCE O Level", en: "GCE O Level",
    sub: { fr: "Anglophone — Ordinary Level", en: "Anglophone — Ordinary Level" },
    subjects: [
      { fr: "Mathematics", en: "Mathematics", home: true, bank: true },
      { fr: "English Language", en: "English Language", home: true, bank: true },
      { fr: "Literature in English", en: "Literature in English", home: true, bank: true },
      { fr: "French", en: "French", home: true, bank: true },
      { fr: "Physics", en: "Physics", home: true, bank: true },
      { fr: "Chemistry", en: "Chemistry", home: true, bank: true },
      { fr: "Biology", en: "Biology", home: true, bank: true },
      { fr: "History", en: "History", home: true, bank: true },
      { fr: "Geography", en: "Geography", home: true, bank: true },
      { fr: "Economics", en: "Economics", home: true, bank: true },
      { fr: "ICT", en: "ICT", home: true, bank: true },
      { fr: "Additional Mathematics", en: "Additional Mathematics", home: true, bank: true },
      { fr: "Integrated Science", en: "Integrated Science", home: true, bank: true },
    ],
  },
  {
    id: "gce-a",
    fr: "GCE A Level", en: "GCE A Level",
    sub: { fr: "Anglophone — Advanced Level", en: "Anglophone — Advanced Level" },
    subjects: [
      { fr: "Pure Mathematics", en: "Pure Mathematics", home: true, bank: true },
      { fr: "Applied Mathematics", en: "Applied Mathematics", home: true, bank: true },
      { fr: "Physics", en: "Physics", home: true, bank: true },
      { fr: "Chemistry", en: "Chemistry", home: true, bank: true },
      { fr: "Biology", en: "Biology", home: true, bank: true },
      { fr: "English Literature", en: "English Literature", home: true, bank: true },
      { fr: "French", en: "French", home: true, bank: true },
      { fr: "History", en: "History", home: true, bank: true },
      { fr: "Geography", en: "Geography", home: true, bank: true },
      { fr: "Economics", en: "Economics", home: true, bank: true },
      { fr: "Business Studies", en: "Business Studies", home: true, bank: true },
      { fr: "Computing / ICT", en: "Computing / ICT", home: true, bank: true },
    ],
  },
  {
    id: "probatoire",
    fr: "Probatoire", en: "Probatoire",
    sub: { fr: "Francophone — Fin de Première", en: "Francophone — Grade 11 exit" },
    subjects: [
      { fr: "Mathématiques", en: "Mathematics", home: true, bank: true },
      { fr: "Physique-Chimie", en: "Physics-Chemistry", home: true, bank: true },
      { fr: "SVT", en: "Biology", home: true, bank: true },
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Anglais", en: "English", home: true, bank: true },
      { fr: "Histoire-Géographie", en: "History-Geography", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true, bank: true },
    ],
  },
  {
    id: "bac-s",
    fr: "Baccalauréat Scientifique", en: "Baccalauréat — Science",
    sub: { fr: "Séries C, D, E, TI", en: "Science streams" },
    subjects: [
      { fr: "Mathématiques", en: "Mathematics", home: true, bank: true },
      { fr: "Physique-Chimie", en: "Physics-Chemistry", home: true, bank: true },
      { fr: "SVT / Biologie", en: "Biology", home: true, bank: true },
      { fr: "Chimie-Biologie", en: "Chemistry-Biology", home: true, bank: true },
      { fr: "Sciences de l'Ingénieur", en: "Engineering Science", home: true, bank: true },
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true, bank: true },
      { fr: "Histoire-Géographie", en: "History-Geography", home: true, bank: true },
    ],
  },
  {
    id: "bac-a",
    fr: "Baccalauréat Littéraire", en: "Baccalauréat — Arts",
    sub: { fr: "Séries A, ABI", en: "Arts streams" },
    subjects: [
      { fr: "Français", en: "French", home: true, bank: true },
      { fr: "Philosophie", en: "Philosophy", home: true, bank: true },
      { fr: "Littérature", en: "Literature", home: true, bank: true },
      { fr: "Histoire-Géographie", en: "History-Geography", home: true, bank: true },
      { fr: "Langues vivantes", en: "Modern Languages", home: true, bank: true },
      { fr: "Sciences sociales", en: "Social Sciences", home: true, bank: true },
      { fr: "Économie", en: "Economics", home: true, bank: true },
    ],
  },
];

function MatieresPage() {
  const { lang, setLang } = useLang();
  const [active, setActive] = useState<string>("primaire");
  const [q, setQ] = useState("");
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return LEVELS;
    return LEVELS.map((l) => ({
      ...l,
      subjects: l.subjects.filter((s) =>
        s.fr.toLowerCase().includes(term) || s.en.toLowerCase().includes(term) || l.fr.toLowerCase().includes(term) || l.en.toLowerCase().includes(term)
      ),
    })).filter((l) => l.subjects.length > 0);
  }, [q]);

  const shown = q.trim() ? filtered : LEVELS.filter((l) => l.id === active);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">{tr("Programmes", "Programs")}</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold">
              {tr("Toutes les matières, tous les niveaux", "All subjects, all levels")}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {tr(
                "Du primaire au Baccalauréat / GCE A Level — sections anglophone et francophone. Chaque matière est disponible en cours à domicile et/ou dans la banque d'épreuves.",
                "From primary to Baccalauréat / GCE A Level — anglophone and francophone. Each subject is available for home tutoring and/or in the exam bank."
              )}
            </p>
          </div>

          <div className="mt-10 relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tr("Rechercher une matière ou un niveau…", "Search a subject or level…")}
              className="w-full rounded-xl bg-card ring-1 ring-border pl-11 pr-4 py-3 text-sm"
            />
          </div>

          {!q.trim() && (
            <div className="mt-8 flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setActive(l.id)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    active === l.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-card ring-1 ring-border hover:ring-primary/40"
                  }`}
                >
                  {tr(l.fr, l.en)}
                </button>
              ))}
            </div>
          )}

          <div className="mt-12 space-y-14">
            {shown.map((l) => (
              <div key={l.id}>
                <div className="flex items-baseline justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <h2 className="text-2xl font-semibold">{tr(l.fr, l.en)}</h2>
                    {l.sub && <p className="mt-1 text-sm text-muted-foreground">{tr(l.sub.fr, l.sub.en)}</p>}
                  </div>
                  <span className="text-xs text-muted-foreground">{l.subjects.length} {tr("matières", "subjects")}</span>
                </div>
                <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {l.subjects.map((s) => (
                    <article key={s.fr} className="rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/40 hover:shadow-[var(--shadow-soft)] transition-all">
                      <h3 className="font-semibold">{tr(s.fr, s.en)}</h3>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {s.home && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 text-[11px] font-semibold">
                            <Home className="size-3" /> {tr("Cours à domicile", "Home tutoring")}
                          </span>
                        )}
                        {s.bank && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-1 text-[11px] font-semibold">
                            <BookOpen className="size-3" /> {tr("Banque d'épreuves", "Exam bank")}
                          </span>
                        )}
                      </div>
                      <div className="mt-5 flex gap-2 text-xs">
                        <Link to="/cours" className="rounded-lg bg-primary px-3 py-1.5 font-semibold text-primary-foreground hover:opacity-95">
                          {tr("Réserver", "Book")}
                        </Link>
                        <Link to="/banque-epreuves" className="rounded-lg bg-muted px-3 py-1.5 font-semibold hover:bg-muted/70">
                          {tr("Épreuves", "Papers")}
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            ))}
            {shown.length === 0 && (
              <p className="text-sm text-muted-foreground">{tr("Aucun résultat.", "No results.")}</p>
            )}
          </div>
        </div>
      </section>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}