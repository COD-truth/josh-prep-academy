import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccess, listExamPapers } from "@/lib/access.functions";
import { useLang } from "@/lib/i18n";
import { ArrowLeft, BookLock, Download, FileText, Lock, Home, Loader2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/exams")({
  head: () => ({ meta: [{ title: "Josh & Co — Banque d'épreuves" }] }),
  component: ExamsPage,
});

function ExamsPage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchPapers = useServerFn(listExamPapers);
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const access = useQuery({ queryKey: ["access"], queryFn: () => fetchAccess({}) });
  const hasAccess = !!access.data?.activeSubscription || (access.data?.roles ?? []).includes("admin");

  const papers = useQuery({
    queryKey: ["exam-papers"],
    queryFn: () => fetchPapers({}),
    enabled: !access.isLoading,
  });

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
              {tr("Annales, exercices et corrigés — primaire & secondaire.", "Past papers, exercises and answer keys — primary & secondary.")}
            </p>
          </div>
        </div>

        {/* Loading state */}
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
            <h2 className="mt-5 text-xl font-semibold">
              {tr("Accès réservé aux abonnés", "Subscribers only")}
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto">
              {tr(
                "Abonnez-vous via Mobile Money pour débloquer toutes les épreuves.",
                "Subscribe via Mobile Money to unlock all papers."
              )}
            </p>
            <button
              onClick={() => navigate({ to: "/subscribe" })}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-95"
            >
              {tr("Voir les abonnements", "See plans")}
            </button>
          </div>
        )}

        {/* Has access but empty */}
        {hasAccess && !papers.isLoading && (papers.data?.length ?? 0) === 0 && (
          <div className="mt-6 rounded-3xl bg-card ring-1 ring-border p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted">
              <FileText className="size-8 text-muted-foreground" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-muted-foreground">
              {tr("Aucune épreuve disponible pour le moment", "No papers available yet")}
            </h2>
            <p className="mt-2 text-muted-foreground max-w-md mx-auto text-sm">
              {tr(
                "Les épreuves seront ajoutées très prochainement. Revenez dans quelques heures.",
                "Papers will be added very soon. Check back in a few hours."
              )}
            </p>
          </div>
        )}

        {/* Papers list */}
        {hasAccess && !papers.isLoading && (papers.data?.length ?? 0) > 0 && (
          <div className="grid gap-4">
            {papers.data?.map((p) => (
              <article key={p.id} className="flex items-center justify-between gap-4 rounded-2xl bg-card p-5 ring-1 ring-border hover:ring-primary/30 transition-all">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <FileText className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{p.title}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.subject}</span>
                      <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.level}</span>
                      {p.year && <span className="text-xs bg-muted rounded-full px-2 py-0.5">{p.year}</span>}
                      {p.has_solution && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 rounded-full px-2 py-0.5 font-semibold">
                          {tr("✓ Corrigé inclus", "✓ Answer key included")}
                        </span>
                      )}
                      <span className="text-xs bg-muted rounded-full px-2 py-0.5 uppercase">
                        {p.language === "both" ? "FR/EN" : p.language}
                      </span>
                    </div>
                  </div>
                </div>
                {p.file_url ? (
                  <a
                    href={p.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-95"
                  >
                    <Download className="size-4" /> {tr("Télécharger", "Download")}
                  </a>
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="size-3.5" /> {tr("Fichier à venir", "File coming")}
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
