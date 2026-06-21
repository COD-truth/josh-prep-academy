import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPayments, reviewPayment } from "@/lib/access.functions";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft, Check, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Josh & Co — Administration" }] }),
  component: AdminPage,
});

function AdminPage() {
  const { lang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const fetchPayments = useServerFn(adminListPayments);
  const review = useServerFn(reviewPayment);
  const q = useQuery({ queryKey: ["admin-payments"], queryFn: () => fetchPayments({}) });
  const mut = useMutation({
    mutationFn: (v: { paymentId: string; action: "approve" | "reject" }) => review({ data: v }),
    onSuccess: () => { toast.success(tr("Mis à jour", "Updated")); q.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (q.isError) {
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <p className="text-muted-foreground">{tr("Accès refusé. Réservé aux administrateurs.", "Access denied. Admins only.")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="size-4" /> {tr("Tableau de bord", "Dashboard")}
          </Link>
          <span className="font-display text-lg font-semibold">Administration</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold">{tr("Paiements à valider", "Payments to review")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("Validez les paiements Mobile Money pour activer les abonnements.", "Approve Mobile Money payments to activate subscriptions.")}</p>

        <div className="mt-8 rounded-2xl bg-card ring-1 ring-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60 text-left text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">{tr("Date", "Date")}</th>
                <th className="px-4 py-3">{tr("Plan", "Plan")}</th>
                <th className="px-4 py-3">{tr("Opérateur", "Provider")}</th>
                <th className="px-4 py-3">{tr("Téléphone", "Phone")}</th>
                <th className="px-4 py-3">Réf.</th>
                <th className="px-4 py-3">{tr("Montant", "Amount")}</th>
                <th className="px-4 py-3">{tr("Statut", "Status")}</th>
                <th className="px-4 py-3 text-right">{tr("Actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {q.data?.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">{new Date(p.created_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3 font-medium">{(p.plan as { name_fr: string } | null)?.name_fr ?? "—"}</td>
                  <td className="px-4 py-3 uppercase text-xs font-bold">{p.provider}</td>
                  <td className="px-4 py-3">{p.phone}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.transaction_ref}</td>
                  <td className="px-4 py-3 font-semibold">{p.amount_xaf.toLocaleString("fr-FR")} XAF</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${p.status === "verified" ? "bg-emerald-100 text-emerald-700" : p.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === "pending" && (
                      <div className="inline-flex gap-1.5">
                        <button onClick={() => mut.mutate({ paymentId: p.id, action: "approve" })} className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700"><Check className="size-3.5" /> {tr("Valider", "Approve")}</button>
                        <button onClick={() => mut.mutate({ paymentId: p.id, action: "reject" })} className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-rose-700"><X className="size-3.5" /> {tr("Rejeter", "Reject")}</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {(q.data?.length ?? 0) === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">{tr("Aucun paiement.", "No payments yet.")}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}