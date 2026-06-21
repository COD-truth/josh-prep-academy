import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccess, listMyPayments, claimFirstAdmin } from "@/lib/access.functions";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { BookLock, BookOpen, Calendar, LogOut, ShieldCheck, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Josh & Co — Tableau de bord" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { lang } = useLang();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fetchAccess = useServerFn(getMyAccess);
  const fetchPayments = useServerFn(listMyPayments);
  const claim = useServerFn(claimFirstAdmin);
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const access = useQuery({ queryKey: ["access"], queryFn: () => fetchAccess({}) });
  const payments = useQuery({ queryKey: ["my-payments"], queryFn: () => fetchPayments({}) });
  const claimMut = useMutation({
    mutationFn: () => claim({}),
    onSuccess: () => { toast.success(tr("Vous êtes administrateur.", "You are now admin.")); access.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const sub = access.data?.activeSubscription;
  const roles = access.data?.roles ?? [];
  const isAdmin = roles.includes("admin");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-lg font-semibold">Josh &amp; Co</Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <button onClick={signOut} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ring-border hover:bg-muted">
              <LogOut className="size-4" /> {tr("Déconnexion", "Sign out")}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-3xl font-semibold">
            {tr("Bonjour", "Hello")}, {access.data?.profile?.full_name ?? user?.email?.split("@")[0]} 👋
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((r) => (
              <span key={r} className="rounded-full bg-primary-soft text-primary px-3 py-1 text-xs font-bold uppercase tracking-wider">{r}</span>
            ))}
          </div>
        </div>

        <section className="rounded-2xl bg-card ring-1 ring-border p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex gap-4 items-start">
              <div className={`grid size-12 place-items-center rounded-xl ${sub ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-muted text-muted-foreground"}`}>
                {sub ? <BookOpen className="size-6" /> : <BookLock className="size-6" />}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr("Banque d'épreuves", "Exam Bank")}</p>
                <p className="mt-1 text-lg font-semibold">
                  {sub
                    ? tr(`Accès actif jusqu'au ${new Date(sub.expires_at).toLocaleDateString("fr-FR")}`, `Active access until ${new Date(sub.expires_at).toLocaleDateString("en-US")}`)
                    : tr("Aucun abonnement actif", "No active subscription")}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {sub ? (
                <button onClick={() => navigate({ to: "/exams" })} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
                  {tr("Ouvrir la banque", "Open the bank")}
                </button>
              ) : (
                <button onClick={() => navigate({ to: "/subscribe" })} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95">
                  {tr("S'abonner", "Subscribe")}
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="grid sm:grid-cols-2 gap-4">
          <Link to="/" className="rounded-2xl bg-card ring-1 ring-border p-6 hover:ring-primary/40 transition-all group">
            <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><Calendar className="size-5" /></div>
            <p className="mt-4 font-semibold">{tr("Réserver un cours", "Book a class")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{tr("Choisissez un tuteur et un créneau.", "Pick a tutor and a slot.")}</p>
          </Link>
          {isAdmin && (
            <Link to="/admin" className="rounded-2xl bg-card ring-1 ring-border p-6 hover:ring-primary/40 transition-all">
              <div className="grid size-10 place-items-center rounded-lg bg-primary-soft text-primary"><ShieldCheck className="size-5" /></div>
              <p className="mt-4 font-semibold">{tr("Espace administrateur", "Admin area")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{tr("Valider les paiements Mobile Money.", "Approve Mobile Money payments.")}</p>
            </Link>
          )}
        </section>

        <section className="rounded-2xl bg-card ring-1 ring-border p-6">
          <h2 className="text-lg font-semibold">{tr("Historique des paiements", "Payment history")}</h2>
          <div className="mt-4 divide-y divide-border">
            {payments.isLoading ? (
              <p className="text-sm text-muted-foreground py-4">{tr("Chargement…", "Loading…")}</p>
            ) : (payments.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground py-4">{tr("Aucun paiement pour le moment.", "No payments yet.")}</p>
            ) : (
              payments.data!.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                  <div>
                    <p className="font-semibold">{(p.plan as { name_fr: string } | null)?.name_fr ?? "—"} · {p.provider.toUpperCase()}</p>
                    <p className="text-xs text-muted-foreground">Réf. {p.transaction_ref} · {new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{p.amount_xaf.toLocaleString("fr-FR")} XAF</p>
                    <PaymentBadge status={p.status} lang={lang} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {!isAdmin && (
          <section className="rounded-2xl border-2 border-dashed border-border p-6 text-center">
            <p className="text-sm text-muted-foreground">{tr("Premier utilisateur ? Réclamez l'accès administrateur (le docteur).", "First user? Claim admin access (the doctor).")}</p>
            <button onClick={() => claimMut.mutate()} disabled={claimMut.isPending} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline disabled:opacity-50">
              <Sparkles className="size-4" /> {tr("Devenir administrateur", "Claim admin")}
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

function PaymentBadge({ status, lang }: { status: string; lang: "fr" | "en" }) {
  const map: Record<string, { fr: string; en: string; cls: string }> = {
    pending: { fr: "En attente", en: "Pending", cls: "bg-amber-100 text-amber-700" },
    verified: { fr: "Validé", en: "Verified", cls: "bg-emerald-100 text-emerald-700" },
    rejected: { fr: "Rejeté", en: "Rejected", cls: "bg-rose-100 text-rose-700" },
  };
  const m = map[status] ?? map.pending;
  return <span className={`inline-block mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${m.cls}`}>{m[lang]}</span>;
}