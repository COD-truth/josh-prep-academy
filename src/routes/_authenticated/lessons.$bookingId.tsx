import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getLesson, addLessonEvent } from "@/lib/learning.functions";
import type { LessonEvent } from "@/lib/learning-model";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Nav, Footer } from "@/components/site/LandingPage";
import { Whiteboard } from "@/components/learning/Whiteboard";
import {
  ReportForm,
  MeetingForm,
  ReviewForm,
  QuizComposer,
  QuizRunner,
} from "@/components/learning/LessonActivities";
export const Route = createFileRoute("/_authenticated/lessons/$bookingId")({
  component: LessonPage,
  head: () => ({ meta: [{ title: "Séance privée — Josh & Co" }] }),
});
function LessonPage() {
  const { bookingId } = Route.useParams();
  return <LessonWorkspace key={bookingId} bookingId={bookingId} />;
}
function LessonWorkspace({ bookingId }: { bookingId: string }) {
  const valid = z.string().uuid().safeParse(bookingId).success;
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const load = useServerFn(getLesson);
  const send = useServerFn(addLessonEvent);
  const query = useQuery({
    queryKey: ["lesson", bookingId],
    queryFn: () => load({ data: { bookingId } }),
    enabled: valid,
    retry: false,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const [live, setLive] = useState(false);
  const [pending, setPending] = useState<LessonEvent[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const refresh = useRef(query.refetch);
  refresh.current = query.refetch;
  useEffect(() => {
    if (!valid) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = true;
    const channel = supabase
      .channel(`lesson-events:${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "lesson_events",
          filter: `booking_id=eq.${bookingId}`,
        },
        () => {
          if (!timer)
            timer = setTimeout(() => {
              timer = undefined;
              if (active) refresh.current();
            }, 350);
        },
      )
      .subscribe((status) => {
        if (active) {
          setLive(status === "SUBSCRIBED");
          if (status === "SUBSCRIBED") refresh.current();
        }
      });
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [bookingId, valid]);
  const lesson = query.data;
  const canWrite = !!lesson && ["confirmed", "completed"].includes(lesson.booking.status);
  const inFlight = useRef(0);
  const publish = async (event: {
    kind: "stroke" | "message" | "clear";
    payload: LessonEvent["payload"];
  }) => {
    if (!lesson || !canWrite) return false;
    if (inFlight.current >= 8) {
      setError(
        tr(
          "Le réseau est occupé. Attendez la synchronisation.",
          "The network is busy. Wait for synchronisation.",
        ),
      );
      return false;
    }
    inFlight.current += 1;
    const id = crypto.randomUUID();
    const optimistic: LessonEvent = {
      id,
      actor_id: lesson.userId,
      ...event,
      created_at: new Date().toISOString(),
    };
    setPending((rows) => [...rows, optimistic]);
    setError("");
    try {
      await send({
        data: { bookingId, clientId: id, ...event } as {
          bookingId: string;
          clientId: string;
        } & import("@/lib/learning-model").LessonInput,
      });
      await query.refetch();
      setPending((rows) => rows.filter((row) => row.id !== id));
      return true;
    } catch {
      setPending((rows) => rows.filter((row) => row.id !== id));
      setError(
        tr(
          "Cet élément n’a pas été enregistré. Vérifiez votre connexion et réessayez.",
          "This item was not saved. Check your connection and try again.",
        ),
      );
      return false;
    } finally {
      inFlight.current -= 1;
    }
  };
  const persisted = lesson?.events ?? [];
  const events = [
    ...persisted,
    ...pending.filter((item) => !persisted.some((row) => row.id === item.id)),
  ].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id));
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <Link to="/learning" className="text-sm font-semibold text-primary">
          ← {tr("Mes séances", "My lessons")}
        </Link>
        {!valid ? (
          <h1 className="mt-8 text-2xl">{tr("Séance introuvable", "Lesson not found")}</h1>
        ) : query.isPending ? (
          <p role="status" className="mt-8">
            {tr("Chargement de la séance…", "Loading lesson…")}
          </p>
        ) : query.isError || !lesson ? (
          <div role="alert" className="mt-8 border border-border rounded-2xl p-6">
            <h1 className="text-2xl font-semibold">
              {tr("La séance n’est pas disponible", "This lesson is not available")}
            </h1>
            <p className="mt-3 text-muted-foreground">
              {tr(
                "Connectez-vous avec le compte ayant réservé la séance ou le compte du répétiteur. Si le problème persiste, contactez Josh & Co.",
                "Use the account that booked the lesson or the assigned tutor account. If this continues, contact Josh & Co.",
              )}
            </p>
            <button onClick={() => query.refetch()} className="mt-4 text-primary font-semibold">
              {tr("Réessayer", "Retry")}
            </button>
          </div>
        ) : (
          <>
            <header className="mt-6 rounded-3xl bg-secondary text-white p-6 sm:p-8">
              <p className="text-xs uppercase text-accent tracking-widest">
                {tr("Séance privée", "Private lesson")} · {lesson.booking.status}
              </p>
              <h1 className="mt-3 text-3xl font-semibold">
                {lesson.booking.subject} · {lesson.booking.level}
              </h1>
              <p className="mt-3 text-white/70 text-sm">
                {new Date(lesson.booking.starts_at).toLocaleString(
                  lang === "fr" ? "fr-FR" : "en-GB",
                  { timeZone: "Africa/Douala" },
                )}{" "}
                · {tr("heure du Cameroun", "Cameroon time")}
              </p>
              <p role="status" className="mt-3 text-xs text-white/60">
                {live
                  ? tr("Synchronisation en direct connectée", "Live synchronisation connected")
                  : tr(
                      "Actualisation de secours toutes les 30 secondes",
                      "Fallback refresh every 30 seconds",
                    )}
                {pending.length ? ` · ${pending.length} ${tr("en cours d’envoi", "sending")}` : ""}
              </p>
              {lesson.meetingUrl && (
                <a
                  href={lesson.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-block rounded-xl bg-accent text-accent-foreground px-5 py-3 text-sm font-semibold"
                >
                  {tr("Rejoindre la visioconférence", "Join the video meeting")}
                </a>
              )}
              {!lesson.meetingUrl && (
                <p className="mt-4 text-xs text-white/65">
                  {tr(
                    "Aucun lien vidéo n’a encore été partagé par le répétiteur.",
                    "The tutor has not shared a video meeting link yet.",
                  )}
                </p>
              )}
            </header>
            {!canWrite && (
              <p className="mt-6 rounded-xl bg-muted p-4 text-sm">
                {tr(
                  "Le tableau et la discussion seront activés après confirmation de la réservation.",
                  "The board and discussion activate after booking confirmation.",
                )}
              </p>
            )}
            {error && (
              <p role="alert" className="mt-5 text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="mt-6 grid xl:grid-cols-[1fr_340px] gap-5">
              <Whiteboard
                lang={lang}
                events={events}
                canClear={lesson.canTeach}
                disabled={!canWrite}
                onStroke={(stroke) => void publish({ kind: "stroke", payload: stroke })}
                onClear={() => void publish({ kind: "clear", payload: {} })}
              />
              <section className="rounded-2xl border border-border p-5 bg-card">
                <h2 className="text-lg font-semibold">
                  {tr("Discussion de la séance", "Lesson discussion")}
                </h2>
                <div className="my-4 space-y-3 max-h-80 overflow-y-auto" aria-live="polite">
                  {events
                    .filter((event) => event.kind === "message")
                    .map((event) => (
                      <div
                        key={event.id}
                        className={`rounded-xl p-3 text-sm ${event.actor_id === lesson.userId ? "bg-primary-soft" : "bg-muted"}`}
                      >
                        <p className="text-xs font-semibold text-primary">
                          {event.actor_id === lesson.userId
                            ? tr("Vous", "You")
                            : tr("Participant de la séance", "Lesson participant")}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words">
                          {String(event.payload.text ?? "")}
                        </p>
                      </div>
                    ))}
                </div>
                <form
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (await publish({ kind: "message", payload: { text: message } }))
                      setMessage("");
                  }}
                >
                  <label className="text-xs font-semibold">
                    {tr("Message", "Message")}
                    <textarea
                      required
                      maxLength={1000}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      disabled={!canWrite}
                      className="mt-2 w-full rounded-xl border p-3 text-sm"
                    />
                  </label>
                  <button
                    disabled={!canWrite || !message.trim()}
                    className="mt-3 rounded-xl bg-primary px-4 py-2 text-primary-foreground text-sm font-semibold disabled:opacity-50"
                  >
                    {tr("Envoyer", "Send")}
                  </button>
                </form>
              </section>
            </div>
            <div className="mt-8 grid lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                {lesson.report && (
                  <section className="rounded-2xl border border-border p-6">
                    <h2 className="text-2xl font-semibold">
                      {tr("Bilan de la séance", "Lesson report")}
                    </h2>
                    <h3 className="mt-4 font-semibold">{lesson.report.objective}</h3>
                    <p className="mt-3 whitespace-pre-line text-sm text-muted-foreground">
                      {lesson.report.summary}
                    </p>
                    <label className="block text-sm font-semibold mt-5">
                      {tr("Maîtrise estimée par le répétiteur", "Tutor-assessed mastery")} ·{" "}
                      {lesson.report.progress}%
                      <progress
                        value={lesson.report.progress}
                        max={100}
                        className="mt-2 w-full accent-orange-500"
                      />
                    </label>
                    <h3 className="mt-5 text-sm font-semibold">
                      {tr("Travail à faire", "Homework")}
                    </h3>
                    <p className="mt-2 text-sm whitespace-pre-line">
                      {lesson.report.homework || tr("Aucun devoir ajouté.", "No homework added.")}
                    </p>
                  </section>
                )}
                {lesson.canTeach && canWrite && new Date(lesson.booking.ends_at) <= new Date() && (
                  <ReportForm
                    bookingId={bookingId}
                    lang={lang}
                    report={lesson.report}
                    onSaved={() => query.refetch()}
                  />
                )}
                {lesson.canTeach && canWrite && (
                  <MeetingForm
                    bookingId={bookingId}
                    lang={lang}
                    initialUrl={lesson.meetingUrl}
                    onSaved={() => query.refetch()}
                  />
                )}
                {!lesson.canTeach &&
                  lesson.booking.status === "completed" &&
                  lesson.report &&
                  (lesson.hasReview ? (
                    <p className="rounded-xl bg-primary-soft p-5 text-sm">
                      {tr(
                        "Un avis a été enregistré pour cette réservation.",
                        "A review has been saved for this booking.",
                      )}
                    </p>
                  ) : (
                    <ReviewForm bookingId={bookingId} lang={lang} onSaved={() => query.refetch()} />
                  ))}
              </div>
              <div className="space-y-6">
                {lesson.quiz ? (
                  <QuizRunner
                    key={lesson.quiz.id}
                    quiz={lesson.quiz}
                    attempt={lesson.attempts[0]}
                    lang={lang}
                    canTeach={lesson.canTeach}
                    onSaved={() => query.refetch()}
                  />
                ) : lesson.canTeach && canWrite ? (
                  <QuizComposer bookingId={bookingId} lang={lang} onSaved={() => query.refetch()} />
                ) : (
                  <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
                    {tr(
                      "Le répétiteur n’a pas encore publié de quiz pour cette séance.",
                      "The tutor has not published a quiz for this lesson yet.",
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
      <Footer lang={lang} />
    </div>
  );
}
