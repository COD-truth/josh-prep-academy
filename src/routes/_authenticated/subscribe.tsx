import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPlans, submitPayment } from "@/lib/access.functions";
import { useLang } from "@/lib/i18n";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Check, Phone } from "lucide-react";

const ORANGE_MERCHANT = "+237 6 90 00 00 00";
const MTN_MERCHANT = "+237 6 70 00 00 00";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => ({ meta: [{ title: "Josh & Co — Abonnement" }] }),
  component: SubscribePage,
});

function SubscribePage() {
  const { lang } = useLang();
  const navigate = useNavigate();
  const fetchPlans = useServerFn(listPlans);
  const pay = useServerFn(submitPayment);
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const plans = useQuery({ queryKey: ["plans"], queryFn: () => fetchPlans({}) });
  const [planId, setPlanId] = useState<string>("");
  const [provider, setProvider] = useState<"orange" | "mtn">("orange");
  const [phone, setPhone] = useState("");
  const [transactionRef, setTransactionRef] = useState("");

  const submit = useMutation({
    mutationFn: (vars: { planId: string; provider: "orange" | "mtn"; phone: string; transactionRef: string }) =>
      pay({ data: vars }),
    onSuccess: () => {
      toast.success(tr("Paiement soumis. Validation sous 24h.", "Payment submitted. Approval within 24h."));
      navigate({ to: "/dashboard" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const selectedPlan = plans.data?.find((p) => p.id === planId);
  const merchantNumber = provider === "orange" ? ORANGE_MERCHANT : MTN_MERCHANT;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold">
            <ArrowLeft className="size-4" /> {tr("Tableau de bord", "Dashboard")}
          </Link>
          <span className="font-display text-lg font-semibold">Josh &amp; Co</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        <h1 className="text-3xl font-semibold">{tr("Choisissez votre abonnement", "Choose your plan")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("Accès illimité à la banque d'épreuves.", "Unlimited access to the exam bank.")}</p>

        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {plans.data?.map((p) => {
            const selected = p.id === planId;
            return (
              <button
                key={p.id}
                onClick={() => setPlanId(p.id)}
                className={`text-left rounded-2xl p-6 ring-1 transition-all ${selected ? "ring-2 ring-primary bg-primary-soft" : "ring-border bg-card hover:ring-primary/40"}`}
              >
                <p className="text-xs font-bold uppercase tracking-wider text-primary">{lang === "fr" ? p.name_fr : p.name_en}</p>
                <p className="mt-3 text-3xl font-semibold">{p.price_xaf.toLocaleString("fr-FR")} <span className="text-base text-muted-foreground">XAF</span></p>
                <p className="mt-1 text-sm text-muted-foreground">{p.duration_days} {tr("jours d'accès", "days of access")}</p>
                {selected && <p className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary"><Check className="size-3.5" /> {tr("Sélectionné", "Selected")}</p>}
              </button>
            );
          })}
        </div>

        {planId && (
          <section className="mt-10 rounded-3xl bg-card ring-1 ring-border p-6 sm:p-8">
            <h2 className="text-xl font-semibold">{tr("Payez via Mobile Money", "Pay via Mobile Money")}</h2>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground list-decimal pl-5">
              <li>{tr("Composez le code USSD de votre opérateur (ex. #144#).", "Dial your operator USSD code (e.g. #144#).")}</li>
              <li>{tr(`Envoyez ${selectedPlan?.price_xaf.toLocaleString("fr-FR")} XAF au numéro marchand ci-dessous.`, `Send ${selectedPlan?.price_xaf.toLocaleString("en-US")} XAF to the merchant number below.`)}</li>
              <li>{tr("Notez l'identifiant de transaction reçu par SMS.", "Note the transaction ID received by SMS.")}</li>
              <li>{tr("Remplissez le formulaire — votre accès s'active après validation.", "Fill the form — access activates after approval.")}</li>
            </ol>

            <div className="mt-6 grid sm:grid-cols-2 gap-3">
              {(["orange", "mtn"] as const).map((op) => (
                <button
                  key={op}
                  onClick={() => setProvider(op)}
                  className={`rounded-2xl p-5 ring-1 transition-all ${provider === op ? "ring-2 ring-primary" : "ring-border hover:ring-primary/40"}`}
                >
                  <div className={`mx-auto h-10 w-20 rounded-md grid place-items-center font-black italic text-sm ${op === "orange" ? "bg-[#FF7900] text-white" : "bg-[#FFCC00] text-[#0a3d62]"}`}>
                    {op === "orange" ? "orange" : "MTN"}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-center">{op === "orange" ? "Orange Money" : "MTN MoMo"}</p>
                </button>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-3 rounded-xl bg-muted/60 p-4 text-sm">
              <Phone className="size-4 text-primary" />
              <span>{tr("Numéro marchand :", "Merchant number:")} <strong className="font-semibold">{merchantNumber}</strong></span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit.mutate({ planId, provider, phone, transactionRef });
              }}
              className="mt-6 grid sm:grid-cols-2 gap-3"
            >
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder={tr("Votre numéro Mobile Money", "Your Mobile Money number")} className="rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none" />
              <input value={transactionRef} onChange={(e) => setTransactionRef(e.target.value)} required placeholder={tr("Identifiant de transaction", "Transaction ID")} className="rounded-xl ring-1 ring-border bg-card px-4 py-3 text-sm focus:ring-primary focus:outline-none" />
              <button disabled={submit.isPending} type="submit" className="sm:col-span-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-95 disabled:opacity-50">
                {submit.isPending ? tr("Envoi…", "Submitting…") : tr("Soumettre le paiement", "Submit payment")}
              </button>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}