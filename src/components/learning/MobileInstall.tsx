import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function MobileInstall() {
  const { lang } = useLang();
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  useEffect(() => {
    if (import.meta.env.PROD && "serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    const receive = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallPrompt);
    };
    const installed = () => setPrompt(null);
    window.addEventListener("beforeinstallprompt", receive);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", receive);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);
  return (
    <div className="bg-primary-soft border-t border-border px-4 py-3 text-center text-xs">
      {prompt ? (
        <button
          onClick={async () => {
            await prompt.prompt();
            await prompt.userChoice;
            setPrompt(null);
          }}
          className="font-semibold text-primary underline"
        >
          {lang === "fr"
            ? "Installer Josh & Co sur mon appareil"
            : "Install Josh & Co on my device"}
        </button>
      ) : (
        <Link to="/mobile" className="font-semibold text-primary">
          {lang === "fr"
            ? "Josh & Co sur votre écran d’accueil →"
            : "Josh & Co on your home screen →"}
        </Link>
      )}
    </div>
  );
}
