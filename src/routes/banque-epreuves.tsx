import { createFileRoute } from "@tanstack/react-router";
import { Nav, ExamBank, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/banque-epreuves")({
  head: () => ({
    meta: [
      { title: "Banque d'épreuves — Josh & Co" },
      { name: "description", content: "Plus de 500 annales corrigées : ENSPY, FMSB, Polytechnique et concours d'entrée aux grandes universités." },
      { property: "og:title", content: "Banque d'épreuves — Josh & Co" },
      { property: "og:description", content: "500+ annales corrigées et fiches de révision, réservées aux abonnés." },
    ],
  }),
  component: BanquePage,
});

function BanquePage() {
  const { lang, setLang } = useLang();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <ExamBank lang={lang} />
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}