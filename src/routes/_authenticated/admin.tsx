import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListPayments, reviewPayment, adminSaveExamPaper, adminListApplications, reviewApplication, getMyAvailability, saveMyAvailability } from "@/lib/access.functions";
import { useLang } from "@/lib/i18n";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Upload, FileText, Loader2, GraduationCap, Calendar } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Josh & Co — Administration" }] }),
  component: AdminPage,
});

const SUBJECTS_FR = ["Mathématiques","Physique","Chimie","Biologie","Français","Histoire-Géo","Anglais","Philosophie","Informatique","Sciences Naturelles","English Language","Literature","Economics"];
const LEVELS = ["CE1","CE2","CM1","CM2","6ème","5ème","4ème","3ème","2nde","1ère","Terminale","GCE O Level","GCE A Level","Probatoire","BEPC","Baccalauréat","CEP / FSLC"];

function AdminPage() {
  const { lang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const fetchPayments = useServerFn(adminListPayments);
  const review = useServerFn(reviewPayment);
  const saveExam = useServerFn(adminSaveExamPaper);

  const q = useQuery({ queryKey: ["admin-payments"], queryFn: () => fetchPayments({}) });
  const fetchApplications = useServerFn(adminListApplications);
  const reviewApp = useServerFn(reviewApplication);
  const appsQ = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchApplications({}) });
  const appMut = useMutation({
    mutationFn: (v: { applicationId: string; action: "approved" | "rejected" }) => reviewApp({ data: v }),
    onSuccess: () => { toast.success(tr("Mis à jour", "Updated")); appsQ.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mut = useMutation({
    mutationFn: (v: { paymentId: string; action: "approve" | "reject" }) => review({ data: v }),
    onSuccess: () => { toast.success(tr("Mis à jour", "Updated")); q.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Upload state
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "", title_en: "", subject: "", level: "",
    year: new Date().getFullYear(), language: "fr", has_solution: false,
  });

  const handleUpload = async () => {
    if (!file) return toast.error(tr("Sélectionnez un fichier PDF", "Select a PDF file"));
    if (!form.title || !form.subject || !form.level) {
      return toast.error(tr("Remplissez tous les champs obligatoires", "Fill all required fields"));
    }
    setUploading(true);
    try {
      // 1. Upload PDF to Supabase Storage
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${form.subject.replace(/\s+/g, "-")}-${form.level.replace(/\s+/g, "-")}.${ext}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from("exam-papers")
        .upload(fileName, file, { contentType: "application/pdf", upsert: false });
      if (uploadErr) throw uploadErr;

      // 2. Get public URL
      const { data: urlData } = supabase.storage.from("exam-papers").getPublicUrl(uploadData.path);
      const fileUrl = urlData.publicUrl;

      // 3. Save metadata to database
      await saveExam({
        data: { ...form, file_url: fileUrl, page_count: null },
      });

      toast.success(tr("Épreuve uploadée avec succès ✅", "Exam paper uploaded successfully ✅"));
      setFile(null);
      setForm({ title: "", title_en: "", subject: "", level: "", year: new Date().getFullYear(), language: "fr", has_solution: false });
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const inp = "rounded-xl ring-1 ring-border bg-background px-4 py-2.5 text-sm focus:ring-primary focus:outline-none w-full";
  const lbl = "text-xs font-semibold text-muted-foreground mb-1 block";

  if (q.isError) return (
    <div className="min-h-screen grid place-items-center p-6 text-center">
      <p className="text-muted-foreground">{tr("Accès refusé. Réservé aux administrateurs.", "Access denied. Admins only.")}</p>
    </div>
  );

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

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-12">

        {/* ── UPLOAD ÉPREUVE ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <Upload className="size-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tr("Ajouter une épreuve", "Add exam paper")}</h2>
              <p className="text-sm text-muted-foreground">{tr("Uploadez un PDF depuis votre appareil", "Upload a PDF from your device")}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border p-6 sm:p-8">
            {/* File drop zone */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors mb-6
                ${file ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/40"}`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="size-8 text-primary" />
                  <div className="text-left">
                    <p className="font-semibold text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
                    className="ml-4 text-rose-500 hover:text-rose-700">
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="font-semibold text-sm">{tr("Cliquez pour choisir un PDF", "Click to choose a PDF")}</p>
                  <p className="text-xs text-muted-foreground mt-1">{tr("Taille max : 50 MB", "Max size: 50 MB")}</p>
                </>
              )}
            </div>

            {/* Form fields */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>{tr("Titre (Français) *", "Title (French) *")}</label>
                <input className={inp} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="BEPC 2024 — Mathématiques" />
              </div>
              <div>
                <label className={lbl}>{tr("Titre (Anglais)", "Title (English)")}</label>
                <input className={inp} value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))}
                  placeholder="GCE 2024 — Mathematics" />
              </div>
              <div>
                <label className={lbl}>{tr("Matière *", "Subject *")}</label>
                <select className={inp} value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}>
                  <option value="">{tr("Choisir...", "Choose...")}</option>
                  {SUBJECTS_FR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{tr("Niveau / Classe *", "Level / Class *")}</label>
                <select className={inp} value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value }))}>
                  <option value="">{tr("Choisir...", "Choose...")}</option>
                  {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>{tr("Année", "Year")}</label>
                <input className={inp} type="number" min={2000} max={2030} value={form.year}
                  onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))} />
              </div>
              <div>
                <label className={lbl}>{tr("Langue", "Language")}</label>
                <select className={inp} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="both">Bilingue / Bilingual</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <input type="checkbox" id="has_sol" checked={form.has_solution}
                  onChange={e => setForm(f => ({ ...f, has_solution: e.target.checked }))}
                  className="size-4 rounded accent-primary cursor-pointer" />
                <label htmlFor="has_sol" className="text-sm cursor-pointer">
                  {tr("Ce fichier inclut le corrigé", "This file includes the answer key")}
                </label>
              </div>
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="mt-6 w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {uploading ? (
                <><Loader2 className="size-4 animate-spin" /> {tr("Upload en cours…", "Uploading…")}</>
              ) : (
                <><Upload className="size-4" /> {tr("Publier l'épreuve", "Publish exam paper")}</>
              )}
            </button>
          </div>
        </section>

        {/* ── PAYMENTS ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="grid size-10 place-items-center rounded-xl bg-emerald-100">
              <Check className="size-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">{tr("Paiements à valider", "Payments to review")}</h2>
              <p className="text-sm text-muted-foreground">{tr("Validez les paiements Mobile Money pour activer les abonnements.", "Approve Mobile Money payments to activate subscriptions.")}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
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
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${p.provider === "orange" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"}`}>
                        {p.provider === "orange" ? "Orange" : "MTN"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{p.phone}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.transaction_ref}</td>
                    <td className="px-4 py-3 font-semibold">{p.amount_xaf.toLocaleString("fr-FR")} XAF</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider
                        ${p.status === "verified" ? "bg-emerald-100 text-emerald-700" :
                          p.status === "rejected" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.status === "pending" && (
                        <div className="inline-flex gap-1.5">
                          <button onClick={() => mut.mutate({ paymentId: p.id, action: "approve" })}
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-emerald-700">
                            <Check className="size-3.5" /> {tr("Valider", "Approve")}
                          </button>
                          <button onClick={() => mut.mutate({ paymentId: p.id, action: "reject" })}
                            className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2.5 py-1 text-xs font-semibold hover:bg-rose-700">
                            <X className="size-3.5" /> {tr("Rejeter", "Reject")}
                          </button>
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
        </section>
        {/* ── AVAILABILITY ── */}
        <AvailabilitySection lang={lang} />

        {/* ── TUTOR APPLICATIONS ── */}
        <TutorApplications lang={lang} />

      </main>
    </div>
  );
}

// ── Tutor Applications Component ────────────────────────────
function TutorApplications({ lang }: { lang: "fr" | "en" }) {
  const tr = (fr: string, en: string) => lang === "fr" ? fr : en;
  const fetchApps = useServerFn(adminListApplications);
  const review = useServerFn(reviewApplication);

  const q = useQuery({ queryKey: ["admin-applications"], queryFn: () => fetchApps({}) });
  const mut = useMutation({
    mutationFn: (v: { applicationId: string; action: "approve" | "reject" }) => review({ data: v }),
    onSuccess: () => { toast.success(tr("Mis à jour", "Updated")); q.refetch(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusColor = (s: string) =>
    s === "approved" ? "bg-emerald-100 text-emerald-700" :
    s === "rejected" ? "bg-rose-100 text-rose-700" :
    "bg-amber-100 text-amber-700";

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-10 place-items-center rounded-xl bg-blue-100">
          <GraduationCap className="size-5 text-blue-700" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{tr("Candidatures tuteurs", "Tutor applications")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Approuvez ou rejetez les candidatures.", "Approve or reject applications.")}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {q.isLoading && <p className="text-sm text-muted-foreground">{tr("Chargement...", "Loading...")}</p>}
        {(q.data?.length ?? 0) === 0 && !q.isLoading && (
          <div className="rounded-2xl bg-card ring-1 ring-border p-8 text-center text-muted-foreground text-sm">
            {tr("Aucune candidature pour le moment.", "No applications yet.")}
          </div>
        )}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        {(q.data as any[])?.map((app) => (
          <div key={app.id} className="rounded-2xl bg-card ring-1 ring-border p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-lg">{app.full_name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusColor(app.status)}`}>
                    {app.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{app.phone} · {app.diploma}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {app.experience_years} {tr("ans d'expérience", "years exp.")} · {app.hourly_rate_fcfa?.toLocaleString()} XAF/h
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(app.subjects as string[] ?? []).map((s: string) => (
                    <span key={s} className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">{s}</span>
                  ))}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {(app.levels as string[] ?? []).map((l: string) => (
                    <span key={l} className="rounded-full bg-muted px-2 py-0.5 text-xs">{l}</span>
                  ))}
                </div>
                {app.bio && (
                  <p className="mt-3 text-sm text-muted-foreground italic line-clamp-3">"{app.bio}"</p>
                )}
              </div>
              {app.status === "pending" && (
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => mut.mutate({ applicationId: app.id, action: "approve" })}
                    disabled={mut.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
                    <Check className="size-4" /> {tr("Approuver", "Approve")}
                  </button>
                  <button
                    onClick={() => mut.mutate({ applicationId: app.id, action: "reject" })}
                    disabled={mut.isPending}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 text-white px-4 py-2 text-sm font-semibold hover:bg-rose-700 disabled:opacity-50">
                    <X className="size-4" /> {tr("Rejeter", "Reject")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Availability Component ───────────────────────────────────
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 15 }, (_, i) => `${String(i + 7).padStart(2, "0")}:00`);

function AvailabilitySection({ lang }: { lang: "fr" | "en" }) {
  const tr = (fr: string, en: string) => lang === "fr" ? fr : en;
  const fetchAvail = useServerFn(getMyAvailability);
  const saveAvail = useServerFn(saveMyAvailability);

  const [slots, setSlots] = useState<{ weekday: number; start_time: string; end_time: string }[]>([]);
  const [saved, setSaved] = useState(false);

  useQuery({
    queryKey: ["my-availability"],
    queryFn: async () => {
      const data = await fetchAvail({});
      setSlots(data.map((d: { weekday: number; start_time: string; end_time: string }) => ({
        weekday: d.weekday,
        start_time: (d.start_time as string).slice(0, 5),
        end_time: (d.end_time as string).slice(0, 5),
      })));
      return data;
    },
  });

  const saveMut = useMutation({
    mutationFn: () => saveAvail({ data: { slots } }),
    onSuccess: () => { toast.success(tr("Disponibilités sauvegardées ✅", "Availability saved ✅")); setSaved(true); setTimeout(() => setSaved(false), 3000); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addSlot = (day: number) => {
    setSlots(s => [...s, { weekday: day, start_time: "08:00", end_time: "12:00" }]);
  };

  const removeSlot = (idx: number) => setSlots(s => s.filter((_, i) => i !== idx));

  const updateSlot = (idx: number, key: "start_time" | "end_time", val: string) => {
    setSlots(s => s.map((sl, i) => i === idx ? { ...sl, [key]: val } : sl));
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
          <Calendar className="size-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">{tr("Mes disponibilités", "My availability")}</h2>
          <p className="text-sm text-muted-foreground">
            {tr("Définissez vos créneaux hebdomadaires. Les élèves verront ces horaires pour réserver.", "Set your weekly slots. Students will see these when booking.")}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-card ring-1 ring-border p-6 space-y-4">
        <div className="grid grid-cols-7 gap-2 mb-4">
          {DAYS.map((day, i) => (
            <button key={i} onClick={() => addSlot(i)}
              className="rounded-xl border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-all text-center">
              + {lang === "fr" ? day : DAYS_EN[i]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{tr("Cliquez sur un jour pour ajouter un créneau", "Click a day to add a slot")}</p>

        {slots.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {tr("Aucune disponibilité définie. Cliquez sur un jour pour commencer.", "No availability set. Click a day to start.")}
          </p>
        )}

        <div className="space-y-3">
          {slots.map((slot, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
              <span className="w-8 text-xs font-bold text-center text-primary">
                {lang === "fr" ? DAYS[slot.weekday] : DAYS_EN[slot.weekday]}
              </span>
              <select value={slot.start_time} onChange={e => updateSlot(idx, "start_time", e.target.value)}
                className="rounded-lg ring-1 ring-border bg-background px-2 py-1.5 text-sm">
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <span className="text-muted-foreground text-sm">→</span>
              <select value={slot.end_time} onChange={e => updateSlot(idx, "end_time", e.target.value)}
                className="rounded-lg ring-1 ring-border bg-background px-2 py-1.5 text-sm">
                {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
              <button onClick={() => removeSlot(idx)} className="ml-auto text-rose-500 hover:text-rose-700">
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}
          className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
          {saveMut.isPending
            ? <><Loader2 className="size-4 animate-spin" /> {tr("Sauvegarde...", "Saving...")}</>
            : saved
              ? <><Check className="size-4" /> {tr("Sauvegardé !", "Saved!")}</>
              : tr("Sauvegarder mes disponibilités", "Save my availability")
          }
        </button>
      </div>
    </section>
  );
}
