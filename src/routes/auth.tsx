import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { registrationSchema, getAccountDestination } from "@/lib/registration";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, BookOpen, Users } from "lucide-react";

export const Route = createFileRoute("/auth")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { next?: string; mode?: "signup"; role?: "parent" | "teacher" | "student" } => ({
    next:
      typeof search.next === "string" && /^\/book(?:\?|$)/.test(search.next)
        ? search.next
        : undefined,
    mode: search.mode === "signup" ? "signup" : undefined,
    role: ["parent", "teacher", "student"].includes(String(search.role))
      ? (search.role as "parent" | "teacher" | "student")
      : undefined,
  }),
  head: () => ({ meta: [{ title: "Josh & Co — Connexion / Inscription" }] }),
  component: AuthPage,
});
function AuthPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { next, mode: initialMode, role } = Route.useSearch();
  const navigate = useNavigate();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [mode, setMode] = useState<"signin" | "signup">(initialMode ?? "signin");
  const [userType, setUserType] = useState<"student" | "parent" | "teacher">(role ?? "parent");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [subjects, setSubjects] = useState("");
  const [levels, setLevels] = useState("");
  const [experience, setExperience] = useState("0");
  const [residence, setResidence] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!user) return;
    if (next) window.location.replace(next);
    else navigate({ to: getAccountDestination(user.user_metadata.user_type), replace: true });
  }, [user, next, navigate]);
  async function handleEmail(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const metadata = registrationSchema.parse({
          full_name: fullName,
          user_type: userType,
          phone,
          subjects: subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          levels: levels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          experience_years: Number(experience),
          residence,
        });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
            emailRedirectTo: window.location.origin + (next ?? getAccountDestination(userType)),
          },
        });
        if (error) throw error;
        if (!data.session)
          toast.success(
            tr(
              "Vérifiez votre email pour activer votre compte. Votre formulaire est enregistré.",
              "Check your email to activate your account. Your form has been saved.",
            ),
          );
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : tr("Inscription impossible. Réessayez.", "Unable to register. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }
  const inp =
    "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex flex-col justify-between p-12 bg-secondary text-white">
        <Link to="/" className="text-2xl font-semibold">
          Josh & Co<span className="text-accent">.</span>
        </Link>
        <div>
          <p className="text-accent text-sm uppercase tracking-widest">
            {tr("Grandir ensemble", "Grow together")}
          </p>
          <h2 className="mt-5 text-5xl leading-tight">
            {tr(
              "Un parent rassuré. Un élève accompagné.",
              "Confident parents. Supported students.",
            )}
          </h2>
          <p className="mt-6 text-white/70 text-lg">
            {tr(
              "Tuteurs, ressources et orientation : retrouvez les services Josh & Co dans un seul espace.",
              "Tutors, resources and guidance: access Josh & Co services in one place.",
            )}
          </p>
        </div>
        <p className="text-xs text-white/50">© 2026 Josh & Co</p>
      </aside>
      <main className="p-5 sm:p-12 flex justify-center items-center">
        <div className="w-full max-w-lg">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
            <Link to="/" className="text-sm text-primary">
              ← {tr("Accueil", "Home")}
            </Link>
            <div className="flex rounded-full bg-muted p-1">
              {(["signin", "signup"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold ${mode === value ? "bg-card text-primary shadow-sm" : "text-muted-foreground"}`}
                >
                  {value === "signin" ? tr("Connexion", "Sign in") : tr("Inscription", "Sign up")}
                </button>
              ))}
            </div>
          </div>
          <h1 className="text-3xl font-semibold">
            {mode === "signin"
              ? tr("Heureux de vous retrouver.", "Welcome back.")
              : tr("Bienvenue chez Josh & Co.", "Welcome to Josh & Co.")}
          </h1>
          {mode === "signup" && (
            <fieldset className="mt-6">
              <legend className="text-sm font-semibold mb-3">
                {tr("Je m'inscris en tant que", "I'm joining as a")}
              </legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "parent" as const, label: tr("Parent", "Parent"), Icon: Users },
                  { value: "student" as const, label: tr("Élève", "Student"), Icon: BookOpen },
                  {
                    value: "teacher" as const,
                    label: tr("Enseignant", "Teacher"),
                    Icon: GraduationCap,
                  },
                ].map(({ value, label, Icon }) => (
                  <label
                    key={value}
                    className={`focus-within:ring-2 focus-within:ring-accent cursor-pointer flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-xs sm:text-sm font-semibold ${userType === value ? "border-primary bg-primary-soft" : "border-border"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={userType === value}
                      onChange={() => setUserType(value)}
                      className="sr-only"
                    />
                    <Icon className="size-6" />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
          <form onSubmit={handleEmail} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <label className="block text-sm font-semibold">
                  {tr("Nom complet", "Full name")}
                  <input
                    autoComplete="name"
                    required
                    minLength={3}
                    maxLength={120}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={inp}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  {tr("Téléphone", "Phone")}
                  <input
                    type="tel"
                    autoComplete="tel"
                    required
                    minLength={8}
                    maxLength={20}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inp}
                  />
                </label>
                {userType === "teacher" && (
                  <fieldset className="rounded-2xl border border-border p-4 space-y-4">
                    <legend className="px-2 text-sm font-semibold">
                      {tr("Votre profil enseignant", "Your teaching profile")}
                    </legend>
                    <label className="block text-sm">
                      {tr(
                        "Matières enseignées (séparées par une virgule)",
                        "Subjects taught (comma separated)",
                      )}
                      <input
                        required
                        value={subjects}
                        maxLength={500}
                        onChange={(e) => setSubjects(e.target.value)}
                        placeholder="Mathématiques, Physique"
                        className={inp}
                      />
                    </label>
                    <label className="block text-sm">
                      {tr("Niveaux scolaires enseignés", "Levels you teach")}
                      <input
                        required
                        value={levels}
                        maxLength={500}
                        onChange={(e) => setLevels(e.target.value)}
                        placeholder="3ème, Terminale, GCE A Level"
                        className={inp}
                      />
                    </label>
                    <label className="block text-sm">
                      {tr("Années d'expérience", "Years of experience")}
                      <input
                        type="number"
                        min={0}
                        max={60}
                        step={1}
                        required
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className={inp}
                      />
                    </label>
                    <label className="block text-sm">
                      {tr("Lieu de résidence (ville / quartier)", "Residence (city / district)")}
                      <input
                        required
                        minLength={3}
                        maxLength={200}
                        value={residence}
                        onChange={(e) => setResidence(e.target.value)}
                        className={inp}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {tr(
                        "Après activation du compte, complétez votre candidature. La publication du profil nécessite la validation de Josh & Co.",
                        "After activating your account, complete your application. Josh & Co approval is required before your profile is published.",
                      )}
                    </p>
                  </fieldset>
                )}
              </>
            )}
            <label className="block text-sm font-semibold">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inp}
              />
            </label>
            <label className="block text-sm font-semibold">
              {tr("Mot de passe", "Password")}
              <input
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inp}
              />
            </label>
            <button
              disabled={loading}
              className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-primary-foreground font-semibold disabled:opacity-50"
            >
              {loading
                ? tr("Patientez…", "Please wait…")
                : mode === "signup"
                  ? tr("Créer mon compte", "Create account")
                  : tr("Se connecter", "Sign in")}
              <ArrowRight className="size-4" />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
