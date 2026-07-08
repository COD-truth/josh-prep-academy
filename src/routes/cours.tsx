import { createFileRoute } from "@tanstack/react-router";
import { Nav, Subjects, Tutors, Booking, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/cours")({
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
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <Subjects lang={lang} />
      <Tutors lang={lang} />
      <Booking lang={lang} />
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}