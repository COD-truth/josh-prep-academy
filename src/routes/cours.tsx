import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { TutorCatalog } from "@/components/marketplace/TutorCatalog";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/cours")({
  validateSearch: (search: Record<string, unknown>): { q?: string; level?: string } => ({ q: typeof search.q === "string" ? search.q.slice(0, 100) : undefined, level: typeof search.level === "string" ? search.level.slice(0,60) : undefined }),
  head: () => ({
    meta: [
      { title: "Cours & Tuteurs — Josh & Co" },
      { name: "description", content: "Découvrez nos matières, nos tuteurs experts et réservez votre séance en ligne." },
      { property: "og:title", content: "Cours & Tuteurs — Josh & Co" },
      { property: "og:description", content: "Matières, tuteurs experts et réservation en ligne." },
    ],
  }),
  component: CoursPage,
});

function CoursPage() {
  const { lang, setLang } = useLang();
  const { q, level } = Route.useSearch();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <main>
        <header className="bg-primary-soft/40 px-4 py-12 text-center"><h1 className="text-4xl font-semibold">{lang === "fr" ? "Votre prochain progrès commence ici." : "Your next step starts here."}</h1><p className="mt-4 text-muted-foreground">{lang === "fr" ? "Des cours particuliers, un tuteur à votre rythme." : "Personal lessons, a tutor at your pace."}</p></header>
        <TutorCatalog key={`${q ?? ""}:${level ?? ""}`} lang={lang} initialQuery={q} initialLevel={level} />
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}