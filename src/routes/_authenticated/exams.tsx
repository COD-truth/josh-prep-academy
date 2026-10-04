import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccess, listExamPapers } from "@/lib/access.functions";
import { useLang } from "@/lib/i18n";
import { ArrowLeft, BookLock, Download, FileText, Lock, Home, Loader2, BookOpen, Search, X } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Josh & Co — Banque d'épreuves" }] }),
  component: ExamsPage,
});

const SUBJECTS = ["Mathématiques","Physique","Chimie","Biologie","Français","English Language","Histoire-Géo","Philosophie","Informatique","Sciences Naturelles","Literature","Economics"];
const LEVELS = ["CE1","CE2","CM1","CM2","6ème","5ème","4ème","3ème","2nde","1ère","Terminale","GCE O Level","GCE A Level","BEPC","Probatoire","Baccalauréat","CEP / FSLC"];

function ExamsPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchPapers = useServerFn(listExamPapers);
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const access = useQuery({ queryKey: ["access"], queryFn: () => fetchAccess({}) });
  const hasAccess = !!access.data?.activeSubscription || (access.data?.roles ?? []).includes("admin");

  const papers = useQuery({
    queryKey: ["exam-papers"],
    queryFn: () => fetchPapers({}),
    enabled: !access.isLoading,
  });

  const filtered = useMemo(() => {
    if (!papers.data) return [];
    return papers.data.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !search || p.title.toLowerCase().includes(q) || p.subject.toLowerCase().includes(q);
      const matchSubject = !filterSubject || p.subject === filterSubject;
      const matchLevel = !filterLevel || p.level === filterLevel;
      return matchSearch && matchSubject && matchLevel;
    });
  }, [papers.data, search, filterSubject, filterLevel]);

  const hasFilters = search || filterSubject || filterLevel;

  const sel = "rounded-xl ring-1 ring-border bg-background px-3 py-2.5 text-sm focus:ring-primary focus:outline-none";

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold">
              <ArrowLeft className="size-4" /> {tr("Tableau de bord", "Dashboard")}
            </Link>
            <span className="text-muted-foreground/40">|</span>
            <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="size-4" /> {tr("Accueil", "Home")}
            </Link>
          </div>
          <span className="font-display text-lg font-semibold">Josh &amp; Co</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="grid size-12 place-items-center rounded-2xl bg-primary/10">
            <BookOpen className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold">{tr("Banque d'épreuves", "Exam Bank")}</h1>
            <p className="mt-1 text-muted-foreground">
              {tr("Annales et corrigés — primaire & secondaire.", "Past papers and answer keys — primary & secondary.")}
              {papers.data && <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{papers.data.length} {tr("épreuves", "papers")}</span>}
            </p>
          </div>
        </div>

        {/* Loading */}
        {(access.isLoading || papers.isLoading) && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* No subscription */}
        {!access.isLoading && !hasAccess && (
          <div className="mt-6 rounded-3xl bg-card ring-1 ring-border p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary-soft text-primary">
              <BookLock className="size-8" />
            </div>
            <h2 className="mt-5 text-xl font-semibold">{tr("Accès réservé aux abonnés", "Subscribers only")}</h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {tr("Abonnez-vous via Mobile Money pour débloquer toutes les épreuves.", "Subscribe via Mobile Money to unlock all papers.")}
            </p>
            <button onClick={() => navigate({ to: "/subscribe" })}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95">
              {tr("Voir les abonnements", "See plans")}
            </button>
          </div>
        )}

        {/* Has access */}
        {hasAccess && !papers.isLoading && (
          <>
            {/* Search + Filter bar */}
            {(papers.data?.length ?? 0) > 0 && (
              <div className="mb-6 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={tr("Rechercher une épreuve...", "Search papers...")}
                    className="w-full rounded-xl ring-1 ring-border bg-background pl-9 pr-4 py-2.5 text-sm focus:ring-primary focus:outline-none"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} className={sel}>
                  <option value="">{tr("Toutes matières", "All subjects")}</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={sel}>
                  <option value="">{tr("Tous niveaux", "All levels")}</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {hasFilters && (
                  <button onClick={() => { setSearch(""); setFilterSubject(""); setFilterLevel(""); }}
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground rounded-xl ring-1 ring-border px-3 py-2">
                    <X className="size-4" /> {tr("Effacer", "Clear")}
                  </button>
                )}
              </div>
            )}

            {/* Empty — no papers at all */}
            {(papers.data?.length ?? 0) === 0 && (
              <div className="rounded-3xl bg-card ring-1 ring-border p-10 text-center">
                <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted">
                  <FileText className="size-8 text-muted-foreground" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-muted-foreground">
                  {tr("Aucune épreuve disponible pour le moment", "No papers available yet")}
                </h2>
                <p className="mt-2 text-muted-foreground max-w-md mx-auto text-sm">
                  {tr("Les épreuves seront ajoutées très prochainement. Revenez dans quelques heures.", "Papers will be added very soon. Check back in a few hours.")}
                </p>
              </div>
            )}

            {/* Empty after filter */}
            {(papers.data?.length ?? 0) > 0 && filtered.length === 0 && (
              <div className="rounded-3xl bg-card ring-1 ring-border p-10 text-center">
                <Search className="size-10 mx-auto text-muted-foreground mb-3" />
                <h2 className="text-lg font-semibold text-muted-foreground">
                  {tr("Aucun résultat pour cette recherche", "No results for this search")}
                </h2>
                <button onClick={() => { setSearch(""); setFilterSubject(""); setFilterLevel(""); }}
                  className="mt-4 text-sm text-primary hover:underline">
                  {tr("Effacer les filtres", "Clear filters")}
                </button>
              </div>
            )}

            {/* Papers list */}
            {filtered.length > 0 && (
              <div className="grid gap-4">
                {filtered.map((p) => (
                  <article key={p.id} className="flex items-center justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/30 transition-all">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <FileText className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate">{p.title}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.subject}</span>
                          <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.level}</span>
                          {p.year && <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.year}</span>}
                          {p.has_solution && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-semibold">
                              {tr("✓ Corrigé", "✓ Answer key")}
                            </span>
                          )}
                          <span className="text-xs bg-muted rounded-full px-2 py-0.5 uppercase">
                            {p.language === "both" ? "FR/EN" : p.language}
                          </span>
                        </div>
                      </div>
                    </div>
                    {p.file_url ? (
                      <a href={p.file_url} target="_blank" rel="noopener noreferrer"
                        className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95">
                        <Download className="size-4" /> {tr("Télécharger", "Download")}
                      </a>
                    ) : (
                      <span className="shrink-0 inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <Lock className="size-3.5" /> {tr("Fichier à venir", "Coming soon")}
                      </span>
                    )}
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
