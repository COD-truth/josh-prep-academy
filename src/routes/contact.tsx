import { createFileRoute } from "@tanstack/react-router";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { useLang } from "@/lib/i18n";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — Josh & Co" },
      { name: "description", content: "Contactez l'équipe Josh & Co par email, téléphone ou WhatsApp. Yaoundé, Abidjan, Dakar." },
      { property: "og:title", content: "Contact — Josh & Co" },
      { property: "og:description", content: "Écrivez-nous ou appelez-nous. Réponse sous 24h." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { lang, setLang } = useLang();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav lang={lang} setLang={setLang} />
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.18em] text-primary uppercase">Contact</span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold">
              {lang === "fr" ? "Parlons de votre projet" : "Let's talk about your goals"}
            </h1>
            <p className="mt-4 text-muted-foreground">
              {lang === "fr" ? "L'équipe Josh & Co vous répond sous 24h." : "The Josh & Co team replies within 24h."}
            </p>
          </div>
          <div className="mt-14 grid md:grid-cols-2 gap-5">
            {[
              { icon: Mail, label: "Email", value: "contact@joshandco.academy", href: "mailto:contact@joshandco.academy" },
              { icon: Phone, label: lang === "fr" ? "Téléphone" : "Phone", value: "+237 6XX XX XX XX", href: "tel:+237600000000" },
              { icon: MessageCircle, label: "WhatsApp", value: "+237 6XX XX XX XX", href: "https://wa.me/237600000000" },
              { icon: MapPin, label: lang === "fr" ? "Bureaux" : "Offices", value: "Yaoundé · Abidjan · Dakar" },
            ].map((c) => {
              const Icon = c.icon;
              const inner = (
                <>
                  <div className="grid size-11 place-items-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.label}</p>
                    <p className="mt-1 font-semibold">{c.value}</p>
                  </div>
                </>
              );
              const cls = "flex items-center gap-4 rounded-2xl bg-card p-6 ring-1 ring-border hover:ring-primary/40 transition-colors";
              return c.href ? (
                <a key={c.label} href={c.href} className={cls} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener">{inner}</a>
              ) : (
                <div key={c.label} className={cls}>{inner}</div>
              );
            })}
          </div>
          <form className="mt-10 rounded-3xl bg-card p-8 ring-1 ring-border grid gap-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">{lang === "fr" ? "Nom" : "Name"}</span>
                <input required className="rounded-xl bg-background ring-1 ring-border px-4 py-2.5" />
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="font-medium">Email</span>
                <input type="email" required className="rounded-xl bg-background ring-1 ring-border px-4 py-2.5" />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium">Message</span>
              <textarea rows={5} required className="rounded-xl bg-background ring-1 ring-border px-4 py-2.5" />
            </label>
            <button type="submit" className="mt-2 rounded-xl bg-primary py-3.5 font-semibold text-primary-foreground hover:opacity-95 transition-opacity">
              {lang === "fr" ? "Envoyer" : "Send"}
            </button>
          </form>
        </div>
      </section>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}