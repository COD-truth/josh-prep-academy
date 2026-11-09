import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { FamilyAssistant } from "@/components/marketplace/FamilyAssistant";
import { useLang } from "@/lib/i18n";
export const Route = createFileRoute("/guide")({
  component: GuidePage,
  head: () => ({ meta: [{ title: "Assistant famille — Josh & Co" }] }),
});
function GuidePage() {
  const { lang, setLang } = useLang();
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <FamilyAssistant lang={lang} />
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
