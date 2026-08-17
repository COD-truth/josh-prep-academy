import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLang, t, translations as T } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, BookOpen } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Josh & Co — Connexion / Sign in" }] }),
  component: AuthPage,
});

type UserType = "student" | "teacher" | null;

function AuthPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [userType, setUserType] = useState<UserType>(null);
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
    if (mode === "signup" && !userType) {
      toast.error(tr("Choisissez votre profil (élève ou enseignant)", "Choose your profile (student or teacher)"));
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin + "/dashboard",
            data: { full_name: fullName, user_type: userType },
          },
        });
        if (error) throw error;
        toast.success(tr("Compte créé ! Vérifiez votre email.", "Account created! Check your email."));
        if (userType === "teacher") {
          navigate({ to: "/become-tutor" });
        }
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


  const inp = "w-full rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none";

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 text-primary-foreground"
        style={{ background: "var(--gradient-hero)" }}>
        <Link to="/" className="font-display text-2xl font-semibold">Josh &amp; Co</Link>
        <div>
          <h2 className="text-4xl font-semibold leading-tight">
            {tr("L'excellence académique commence ici.", "Academic excellence starts here.")}
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            {tr(
              "Réservez vos cours, accédez à la banque d'épreuves, suivez vos progrès.",
              "Book classes, access the exam bank, track your progress."
            )}
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">© 2026 Josh &amp; Co</p>
      </div>

      {/* Right panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
              ← {tr("Accueil", "Home")}
            </Link>
            <div className="flex gap-1 rounded-full bg-muted p-1 text-xs font-semibold">
              {(["signin", "signup"] as const).map((m) => (
                <button key={m} onClick={() => { setMode(m); setUserType(null); }}
                  className={`px-3 py-1 rounded-full transition-colors ${mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}>
                  {m === "signin" ? tr("Connexion", "Sign in") : tr("Inscription", "Sign up")}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-3xl font-semibold">
            {mode === "signin" ? tr("Bon retour 👋", "Welcome back 👋") : tr("Créez votre compte", "Create your account")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? tr("Connectez-vous pour accéder à votre espace.", "Sign in to access your account.")
              : tr("Rejoignez Josh & Co en 30 secondes.", "Join Josh & Co in 30 seconds.")}
          </p>

          {/* Student / Teacher choice — signup only */}
          {mode === "signup" && (
            <div className="mt-6 space-y-2">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {tr("Je suis...", "I am...")}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setUserType("student")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    userType === "student"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`grid size-12 place-items-center rounded-xl ${userType === "student" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <BookOpen className="size-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{tr("Élève", "Student")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tr("Je cherche des cours", "I'm looking for classes")}
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setUserType("teacher")}
                  className={`flex flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-all ${
                    userType === "teacher"
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`grid size-12 place-items-center rounded-xl ${userType === "teacher" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <GraduationCap className="size-6" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-sm">{tr("Enseignant", "Teacher")}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tr("Je veux donner des cours", "I want to teach")}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Google sign-in removed — only works on Lovable hosting */}

          <form onSubmit={handleEmail} className="space-y-3">
            {mode === "signup" && (
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
                placeholder={tr("Nom complet", "Full name")} className={inp} />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
              placeholder="email@example.com" className={inp} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={6}
              placeholder={tr("Mot de passe (min. 6)", "Password (min. 6)")} className={inp} />
            <button disabled={loading} type="submit"
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-95 transition-opacity disabled:opacity-50">
              {mode === "signin" ? tr("Se connecter", "Sign in") : tr("Créer mon compte", "Create account")}
              <ArrowRight className="size-4" />
            </button>
          </form>

          {/* Teacher hint */}
          {mode === "signup" && userType === "teacher" && (
            <p className="mt-4 text-xs text-center text-muted-foreground">
              {tr(
                "Après inscription, vous serez redirigé vers le formulaire de candidature tuteur.",
                "After signup, you'll be redirected to the tutor application form."
              )}
            </p>
          )}

          <span className="sr-only">{t(T.nav.book, lang)}</span>
        </div>
      </div>
    </div>
  );
}
