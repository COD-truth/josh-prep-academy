import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth-context";
import { useLang, t, translations as T } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Josh & Co — Connexion / Sign in" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(tr("Compte créé !", "Account created!"));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(tr("Bienvenue !", "Welcome!"));
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      toast.error(result.error.message);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground" style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="font-display text-2xl font-semibold">Josh &amp; Co</Link>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            {tr("L'excellence académique commence ici.", "Academic excellence starts here.")}
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            {tr("Réservez vos cours, accédez à la banque d'épreuves, suivez vos progrès.", "Book classes, access the exam bank, track your progress.")}
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© 2026 Josh &amp; Co</p>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">← {tr("Accueil", "Home")}</Link>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs font-semibold">
              {(["signin", "signup"] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} className={`px-3 py-1 rounded-full transition-colors ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                  {m === "signin" ? tr("Connexion", "Sign in") : tr("Inscription", "Sign up")}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-semibold">
            {mode === "signin" ? tr("Bon retour 👋", "Welcome back 👋") : tr("Créez votre compte", "Create your account")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin" ? tr("Connectez-vous pour accéder à votre espace.", "Sign in to access your account.") : tr("Rejoignez Josh & Co en 30 secondes.", "Join Josh & Co in 30 seconds.")}
          </p>

          <button onClick={handleGoogle} disabled={loading} className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl ring-1 ring-border bg-card py-3 font-semibold hover:bg-muted transition-colors disabled:opacity-50">
            <svg className="size-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            {tr("Continuer avec Google", "Continue with Google")}
          </button>

          <div className="my-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {tr("ou", "or")} <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder={tr("Nom complet", "Full name")} className="w-full rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none" />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required placeholder="email@example.com" className="w-full rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none" />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6} placeholder={tr("Mot de passe (min. 6)", "Password (min. 6)")} className="w-full rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none" />
            <button disabled={loading} type="submit" className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-95 transition-opacity disabled:opacity-50">
              {mode === "signin" ? tr("Se connecter", "Sign in") : tr("Créer mon compte", "Create account")} <ArrowRight className="size-4" />
            </button>
          </form>
          {/* lang reference to suppress unused warning */}
          <span className="sr-only">{t(T.nav.book, lang)}</span>
        </div>
      </div>
    </div>
  );
}