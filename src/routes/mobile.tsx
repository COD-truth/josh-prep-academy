import { createFileRoute, Link } from "@tanstack/react-router";
import { Nav, Footer } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
export const Route = createFileRoute("/mobile")({
  component: MobilePage,
  head: () => ({ meta: [{ title: "Josh & Co sur mobile" }] }),
});
function MobilePage() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-3xl mx-auto px-4 py-14">
        <img src="/icon.svg" alt="Josh & Co" className="size-20 rounded-2xl" />
        <h1 className="mt-6 text-4xl font-semibold">
          {tr("Votre espace sur mobile.", "Your learning space on mobile.")}
        </h1>
        <p className="mt-5 text-muted-foreground">
          {tr(
            "Ajoutez ce site à l’écran d’accueil pour ouvrir Josh & Co comme une application. Aucune installation depuis une boutique n’est nécessaire.",
            "Add this site to your home screen to open Josh & Co like an app. No app-store download is needed.",
          )}
        </p>
        <div className="mt-8 space-y-5">
          <section className="rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold">Android / Chrome</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                "Utilisez le bouton « Installer » s’il apparaît. Sinon : menu ⋮ du navigateur → Ajouter à l’écran d’accueil ou Installer l’application.",
                "Use the Install button if shown. Otherwise: browser ⋮ menu → Add to home screen or Install app.",
              )}
            </p>
          </section>
          <section className="rounded-2xl border border-border p-6">
            <h2 className="text-xl font-semibold">iPhone / iPad / Safari</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                "Ouvrez ce site dans Safari → Partager → Sur l’écran d’accueil → Ajouter. Les intitulés peuvent varier selon votre version.",
                "Open this site in Safari → Share → Add to Home Screen → Add. Labels may vary by version.",
              )}
            </p>
          </section>
        </div>
        <p className="mt-7 text-sm text-muted-foreground">
          {tr(
            "Internet reste nécessaire pour les comptes, réservations, paiements et séances partagées. Hors connexion, une page d’aide est disponible ; vos données privées ne sont pas mises en cache.",
            "Accounts, bookings, payments and shared lessons still need internet. An offline help page is provided; private records are not cached.",
          )}
        </p>
        <Link
          to="/learning"
          className="inline-block mt-6 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground"
        >
          {tr("Mes séances et progrès", "My lessons and progress")}
        </Link>
      </main>
      <Footer lang={lang} />
    </div>
  );
}
