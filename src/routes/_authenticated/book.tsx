import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { listActiveTutors, getTutorSchedule, createBooking } from "@/lib/booking.functions";
import { useLang } from "@/lib/i18n";
import { Calendar, Clock, MapPin, Video, Home } from "lucide-react";

export const Route = createFileRoute("/_authenticated/book")({
  head: () => ({ meta: [{ title: "Réserver un cours — Josh & Co" }] }),
  component: BookPage,
});

type Format = "home" | "online" | "office";

function BookPage() {
  const { lang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const fetchTutors = useServerFn(listActiveTutors);
  const fetchSchedule = useServerFn(getTutorSchedule);
  const book = useServerFn(createBooking);

  const tutorsQ = useQuery({ queryKey: ["tutors-active"], queryFn: () => fetchTutors() });
  const [tutorId, setTutorId] = useState<string | null>(null);
  const [dayISO, setDayISO] = useState<string | null>(null);
  const [timeHM, setTimeHM] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [format, setFormat] = useState<Format>("online");
  const [subject, setSubject] = useState("");
  const [level, setLevel] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");

  const tutor = tutorsQ.data?.find((t) => t.id === tutorId) ?? null;

  // 14-day horizon
  const days = useMemo(() => {
    const out: { iso: string; label: string; weekday: number }[] = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      d.setHours(0, 0, 0, 0);
      out.push({
        iso: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB", { weekday: "short", day: "2-digit", month: "short" }),
        weekday: d.getUTCDay(),
      });
    }
    return out;
  }, [lang]);

  const scheduleQ = useQuery({
    enabled: !!tutorId,
    queryKey: ["tutor-schedule", tutorId],
    queryFn: () =>
      fetchSchedule({
        data: {
          tutorId: tutorId!,
          fromISO: new Date(days[0].iso + "T00:00:00.000Z").toISOString(),
          toISO: new Date(days[days.length - 1].iso + "T23:59:59.999Z").toISOString(),
        },
      }),
  });

  // Generate hourly slots from availability windows for a day, minus busy ones and past times
  const slotsForDay = useMemo(() => {
    if (!dayISO || !scheduleQ.data) return [] as { hm: string; disabled: boolean }[];
    const d = new Date(dayISO + "T00:00:00.000Z");
    const weekday = d.getUTCDay();
    const windows = scheduleQ.data.availability.filter((w) => w.weekday === weekday);
    const busy = new Set(
      scheduleQ.data.busy
        .filter((b) => b.starts_at.slice(0, 10) === dayISO)
        .map((b) => b.starts_at.slice(11, 16)),
    );
    const nowPlus1h = Date.now() + 60 * 60 * 1000;
    const out: { hm: string; disabled: boolean }[] = [];
    for (const w of windows) {
      const start = parseInt((w.start_time as string).slice(0, 2), 10);
      const end = parseInt((w.end_time as string).slice(0, 2), 10);
      for (let h = start; h + duration / 60 <= end; h++) {
        const hm = `${String(h).padStart(2, "0")}:00`;
        const t = new Date(`${dayISO}T${hm}:00.000Z`).getTime();
        const past = t < nowPlus1h;
        out.push({ hm, disabled: busy.has(hm) || past });
      }
    }
    return out;
  }, [dayISO, scheduleQ.data, duration]);

  const mutate = useMutation({
    mutationFn: async () => {
      if (!tutorId || !dayISO || !timeHM) throw new Error(tr("Sélectionnez un créneau", "Pick a slot"));
      if (!subject || !level) throw new Error(tr("Matière et niveau requis", "Subject and level required"));
      const startsAt = new Date(`${dayISO}T${timeHM}:00.000Z`).toISOString();
      return book({
        data: {
          tutorId,
          startsAt,
          durationMinutes: duration,
          subject,
          level,
          format,
          address: format === "home" ? address : undefined,
          notes: notes || undefined,
        },
      });
    },
    onSuccess: () => {
      toast.success(tr("Réservation créée. Complétez le paiement.", "Booking created. Complete payment."));
      setTimeHM(null);
      scheduleQ.refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="text-sm font-semibold text-primary">← {tr("Tableau de bord", "Dashboard")}</Link>
          <h1 className="text-lg font-semibold">{tr("Réserver un cours", "Book a lesson")}</h1>
          <span />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 grid lg:grid-cols-[320px_1fr] gap-8">
        <aside className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr("1. Choisir un tuteur", "1. Pick a tutor")}</p>
          <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
            {tutorsQ.isLoading && <p className="text-sm text-muted-foreground">{tr("Chargement...", "Loading...")}</p>}
            {tutorsQ.data?.map((t) => (
              <button
                key={t.id}
                onClick={() => { setTutorId(t.id); setDayISO(null); setTimeHM(null); }}
                className={`w-full text-left rounded-2xl border p-4 transition ${tutorId === t.id ? "border-primary bg-primary-soft" : "border-border hover:border-primary/50"}`}
              >
                <p className="font-semibold">{t.full_name}</p>
                {t.title && <p className="text-xs text-muted-foreground">{t.title}</p>}
                <p className="mt-1 text-xs">{(t.subjects ?? []).slice(0, 3).join(" · ")}</p>
                <p className="mt-1 text-sm font-semibold text-primary">{t.hourly_rate_fcfa.toLocaleString()} FCFA/h</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="space-y-6">
          {!tutor && <p className="text-muted-foreground">{tr("Sélectionnez un tuteur pour voir ses créneaux.", "Pick a tutor to see slots.")}</p>}
          {tutor && (
            <>
              <div className="rounded-3xl border border-border p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Calendar className="size-4" /> {tr("2. Date", "2. Date")}</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {days.map((d) => (
                    <button
                      key={d.iso}
                      onClick={() => { setDayISO(d.iso); setTimeHM(null); }}
                      className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium ring-1 transition ${dayISO === d.iso ? "bg-primary text-primary-foreground ring-primary" : "ring-border hover:ring-primary"}`}
                    >{d.label}</button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Clock className="size-4" /> {tr("3. Heure", "3. Time")}</p>
                <div className="mb-3 flex gap-2">
                  {[60, 90, 120].map((m) => (
                    <button key={m} onClick={() => { setDuration(m); setTimeHM(null); }} className={`rounded-lg px-3 py-1.5 text-sm ring-1 ${duration === m ? "bg-primary-soft text-primary ring-primary" : "ring-border"}`}>{m} min</button>
                  ))}
                </div>
                {!dayISO && <p className="text-sm text-muted-foreground">{tr("Choisissez une date.", "Pick a date.")}</p>}
                {dayISO && slotsForDay.length === 0 && <p className="text-sm text-muted-foreground">{tr("Aucun créneau ce jour.", "No slots this day.")}</p>}
                <div className="flex flex-wrap gap-2">
                  {slotsForDay.map((s) => (
                    <button
                      key={s.hm}
                      disabled={s.disabled}
                      onClick={() => setTimeHM(s.hm)}
                      className={`rounded-lg px-3.5 py-2 text-sm font-semibold ring-1 transition ${
                        s.disabled ? "opacity-40 cursor-not-allowed ring-border" :
                        timeHM === s.hm ? "bg-primary-soft text-primary ring-primary" : "ring-border hover:ring-primary"
                      }`}
                    >{s.hm}</button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-border p-5 space-y-4">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{tr("4. Détails", "4. Details")}</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={tr("Matière (Maths, Physique...)", "Subject (Math, Physics...)")} className="rounded-lg border border-border px-3 py-2 text-sm" />
                  <input value={level} onChange={(e) => setLevel(e.target.value)} placeholder={tr("Niveau (Terminale, Bac...)", "Level (Grade 12, A-Level...)")} className="rounded-lg border border-border px-3 py-2 text-sm" />
                </div>
                <div className="flex gap-2">
                  {(["online", "home", "office"] as Format[]).map((f) => {
                    const Icon = f === "online" ? Video : f === "home" ? Home : MapPin;
                    const label = f === "online" ? tr("En ligne", "Online") : f === "home" ? tr("À domicile", "At home") : tr("Au bureau", "Office");
                    return (
                      <button key={f} onClick={() => setFormat(f)} className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ${format === f ? "bg-primary-soft text-primary ring-primary" : "ring-border"}`}>
                        <Icon className="size-4" /> {label}
                      </button>
                    );
                  })}
                </div>
                {format === "home" && (
                  <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={tr("Adresse", "Address")} className="w-full rounded-lg border border-border px-3 py-2 text-sm" />
                )}
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={tr("Notes (optionnel)", "Notes (optional)")} className="w-full rounded-lg border border-border px-3 py-2 text-sm" rows={2} />
              </div>

              <div className="flex items-center justify-between rounded-3xl bg-secondary text-secondary-foreground p-5">
                <div>
                  <p className="text-xs opacity-70 uppercase tracking-wider">{tr("Total estimé", "Estimated total")}</p>
                  <p className="text-2xl font-semibold">{Math.round((tutor.hourly_rate_fcfa * duration) / 60).toLocaleString()} FCFA</p>
                </div>
                <button
                  onClick={() => mutate.mutate()}
                  disabled={mutate.isPending || !timeHM}
                  className="rounded-xl bg-accent px-6 py-3 font-semibold text-accent-foreground disabled:opacity-50"
                >
                  {mutate.isPending ? tr("Envoi...", "Sending...") : tr("Confirmer la réservation", "Confirm booking")}
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}