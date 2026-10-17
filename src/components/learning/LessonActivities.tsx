import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  saveReport,
  addReview,
  saveMeeting,
  createLessonQuiz,
  submitLessonQuiz,
} from "@/lib/learning.functions";
import type { LessonReport, PublicQuiz, QuizAttempt } from "@/lib/learning-model";
import type { Lang } from "@/lib/i18n";
const control = "mt-2 w-full rounded-xl border border-border bg-card px-4 py-3 text-sm";
const button =
  "rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50";
const card = "rounded-2xl border border-border bg-card p-5 sm:p-6";
function Feedback({ error, success, lang }: { error: boolean; success: boolean; lang: Lang }) {
  return (
    <>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {lang === "fr"
            ? "Enregistrement impossible. Vérifiez les conditions de la séance, puis réessayez. Si le problème persiste, contactez Josh & Co."
            : "Unable to save. Check lesson conditions and try again. If this continues, contact Josh & Co."}
        </p>
      )}
      {success && (
        <p role="status" className="mt-4 text-sm text-primary">
          {lang === "fr" ? "Enregistrement confirmé." : "Saved successfully."}
        </p>
      )}
    </>
  );
}
export function ReportForm({
  bookingId,
  lang,
  report,
  onSaved,
}: {
  bookingId: string;
  lang: Lang;
  report: LessonReport | null;
  onSaved: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const save = useServerFn(saveReport);
  const mutation = useMutation({
    mutationFn: (data: {
      objective: string;
      summary: string;
      homework: string;
      progress: number;
    }) => save({ data: { bookingId, ...data } }),
    onSuccess: onSaved,
  });
  return (
    <form
      className={card}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        mutation.mutate({
          objective: String(data.get("objective")),
          summary: String(data.get("summary")),
          homework: String(data.get("homework")),
          progress: Number(data.get("progress")),
        });
      }}
    >
      <h2 className="text-xl font-semibold">
        {tr("Bilan et devoirs pour la famille", "Lesson report and family homework")}
      </h2>
      <p className="mt-2 text-xs text-muted-foreground">
        {tr(
          "L’envoi du bilan confirme la fin de cette séance. L’indicateur de progression est votre appréciation pédagogique.",
          "Saving the report confirms lesson completion. The progress indicator is your teaching assessment.",
        )}
      </p>
      <label className="block mt-5 text-sm font-semibold">
        {tr("Objectif travaillé", "Learning objective")}
        <input
          name="objective"
          required
          minLength={3}
          maxLength={500}
          defaultValue={report?.objective ?? ""}
          className={control}
        />
      </label>
      <label className="block mt-4 text-sm font-semibold">
        {tr("Acquis, difficultés et prochaines étapes", "Learning, difficulties and next steps")}
        <textarea
          name="summary"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          defaultValue={report?.summary ?? ""}
          className={control}
        />
      </label>
      <label className="block mt-4 text-sm font-semibold">
        {tr("Travail à faire", "Homework")}
        <textarea
          name="homework"
          maxLength={1500}
          rows={3}
          defaultValue={report?.homework ?? ""}
          className={control}
        />
      </label>
      <label className="block mt-4 text-sm font-semibold">
        {tr(
          "Maîtrise estimée de cet objectif (0–100 %)",
          "Estimated mastery of this objective (0–100%)",
        )}
        <input
          name="progress"
          type="number"
          required
          min={0}
          max={100}
          step={1}
          defaultValue={report?.progress ?? 0}
          className={control}
        />
      </label>
      <button disabled={mutation.isPending} className={`${button} mt-5`}>
        {tr("Enregistrer le bilan", "Save report")}
      </button>
      <Feedback error={mutation.isError} success={mutation.isSuccess} lang={lang} />
    </form>
  );
}
export function MeetingForm({
  bookingId,
  lang,
  initialUrl,
  onSaved,
}: {
  bookingId: string;
  lang: Lang;
  initialUrl: string | null;
  onSaved: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const save = useServerFn(saveMeeting);
  const mutation = useMutation({
    mutationFn: (url: string) => save({ data: { bookingId, url } }),
    onSuccess: onSaved,
  });
  return (
    <form
      className={card}
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate(String(new FormData(event.currentTarget).get("url")));
      }}
    >
      <h2 className="text-lg font-semibold">
        {tr("Lien privé de visioconférence", "Private video meeting link")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {tr(
          "Créez votre réunion chez Google Meet, Zoom, Teams ou Jitsi, puis partagez son lien ici. Le lien n’apparaît qu’aux participants autorisés.",
          "Create a meeting in Google Meet, Zoom, Teams or Jitsi, then share its link here. Only authorised participants can see it.",
        )}
      </p>
      <label className="block mt-4 text-sm">
        {tr("Adresse HTTPS de la réunion", "Meeting HTTPS address")}
        <input
          name="url"
          required
          type="url"
          maxLength={2000}
          defaultValue={initialUrl ?? ""}
          className={control}
        />
      </label>
      <button disabled={mutation.isPending} className={`${button} mt-4`}>
        {tr("Partager le lien", "Share link")}
      </button>
      <Feedback error={mutation.isError} success={mutation.isSuccess} lang={lang} />
    </form>
  );
}
export function ReviewForm({
  bookingId,
  lang,
  onSaved,
}: {
  bookingId: string;
  lang: Lang;
  onSaved: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const submit = useServerFn(addReview);
  const mutation = useMutation({
    mutationFn: (data: { displayName: string; rating: number; comment: string }) =>
      submit({ data: { bookingId, ...data } }),
    onSuccess: onSaved,
  });
  return (
    <form
      className={card}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        mutation.mutate({
          displayName: String(data.get("name")),
          rating: Number(data.get("rating")),
          comment: String(data.get("comment")),
        });
      }}
    >
      <h2 className="text-xl font-semibold">
        {tr("Votre avis après cette séance", "Your review after this lesson")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {tr(
          "Un seul avis public par réservation terminée. Utilisez votre prénom ou des initiales ; ne mentionnez pas d’informations privées sur un enfant.",
          "One public review per completed booking. Use your first name or initials; do not include private information about a child.",
        )}
      </p>
      <label className="block mt-4 text-sm">
        {tr("Nom public / initiales", "Public name / initials")}
        <input name="name" required maxLength={40} className={control} />
      </label>
      <label className="block mt-4 text-sm">
        {tr("Note", "Rating")}
        <select name="rating" className={control}>
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </label>
      <label className="block mt-4 text-sm">
        {tr("Votre expérience", "Your experience")}
        <textarea
          name="comment"
          required
          minLength={10}
          maxLength={1200}
          rows={3}
          className={control}
        />
      </label>
      <button disabled={mutation.isPending} className={`${button} mt-5`}>
        {tr("Publier mon avis", "Publish my review")}
      </button>
      <Feedback error={mutation.isError} success={mutation.isSuccess} lang={lang} />
    </form>
  );
}
export function QuizComposer({
  bookingId,
  lang,
  onSaved,
}: {
  bookingId: string;
  lang: Lang;
  onSaved: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([
    { prompt: "", choices: ["", ""], correct: 0, explanation: "" },
  ]);
  const create = useServerFn(createLessonQuiz);
  const mutation = useMutation({
    mutationFn: () => create({ data: { bookingId, title, questions } }),
    onSuccess: onSaved,
  });
  return (
    <form
      className={card}
      onSubmit={(event) => {
        event.preventDefault();
        mutation.mutate();
      }}
    >
      <h2 className="text-xl font-semibold">
        {tr("Créer le quiz de la séance", "Create the lesson quiz")}
      </h2>
      <p className="mt-2 text-xs text-muted-foreground">
        {tr(
          "1 à 10 questions, une bonne réponse par question. La publication fige ce quiz pour que le résultat reste comparable.",
          "1–10 questions with one correct choice each. Publishing locks the quiz to keep results comparable.",
        )}
      </p>
      <label className="block mt-4 text-sm font-semibold">
        {tr("Titre", "Title")}
        <input
          required
          minLength={3}
          maxLength={120}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={control}
        />
      </label>
      {questions.map((question, index) => (
        <fieldset key={index} className="mt-5 border border-border rounded-xl p-4">
          <legend className="text-sm font-semibold px-2">
            {tr("Question", "Question")} {index + 1}
          </legend>
          <label className="text-sm">
            {tr("Énoncé", "Prompt")}
            <input
              required
              minLength={3}
              maxLength={500}
              value={question.prompt}
              onChange={(event) =>
                setQuestions((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, prompt: event.target.value } : row,
                  ),
                )
              }
              className={control}
            />
          </label>
          {question.choices.map((choice, choiceIndex) => (
            <label key={choiceIndex} className="block mt-3 text-xs">
              {tr("Proposition", "Choice")} {choiceIndex + 1}
              <input
                required
                maxLength={300}
                value={choice}
                onChange={(event) =>
                  setQuestions((rows) =>
                    rows.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            choices: row.choices.map((old, j) =>
                              j === choiceIndex ? event.target.value : old,
                            ),
                          }
                        : row,
                    ),
                  )
                }
                className={control}
              />
            </label>
          ))}
          {question.choices.length < 5 && (
            <button
              type="button"
              onClick={() =>
                setQuestions((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, choices: [...row.choices, ""] } : row,
                  ),
                )
              }
              className="mt-3 text-xs text-primary underline"
            >
              {tr("Ajouter une proposition", "Add a choice")}
            </button>
          )}
          <label className="block mt-4 text-sm">
            {tr("Bonne réponse", "Correct answer")}
            <select
              value={question.correct}
              onChange={(event) =>
                setQuestions((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, correct: Number(event.target.value) } : row,
                  ),
                )
              }
              className={control}
            >
              {question.choices.map((_, i) => (
                <option key={i} value={i}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>
          <label className="block mt-4 text-sm">
            {tr("Explication après correction", "Explanation after grading")}
            <textarea
              maxLength={800}
              value={question.explanation}
              onChange={(event) =>
                setQuestions((rows) =>
                  rows.map((row, i) =>
                    i === index ? { ...row, explanation: event.target.value } : row,
                  ),
                )
              }
              className={control}
            />
          </label>
          {questions.length > 1 && (
            <button
              type="button"
              onClick={() => setQuestions((rows) => rows.filter((_, i) => i !== index))}
              className="mt-3 text-xs underline text-primary"
            >
              {tr("Retirer cette question", "Remove this question")}
            </button>
          )}
        </fieldset>
      ))}
      {questions.length < 10 && (
        <button
          type="button"
          onClick={() =>
            setQuestions((rows) => [
              ...rows,
              { prompt: "", choices: ["", ""], correct: 0, explanation: "" },
            ])
          }
          className="block mt-4 text-sm text-primary underline"
        >
          {tr("Ajouter une question", "Add a question")}
        </button>
      )}
      <button disabled={mutation.isPending} className={`${button} mt-5`}>
        {tr("Publier le quiz", "Publish quiz")}
      </button>
      <Feedback error={mutation.isError} success={mutation.isSuccess} lang={lang} />
    </form>
  );
}
export function QuizRunner({
  quiz,
  attempt,
  lang,
  canTeach,
  onSaved,
}: {
  quiz: PublicQuiz;
  attempt: QuizAttempt | undefined;
  lang: Lang;
  canTeach: boolean;
  onSaved: () => void;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [answers, setAnswers] = useState<number[]>(Array(quiz.questions.length).fill(-1));
  const submit = useServerFn(submitLessonQuiz);
  const mutation = useMutation({
    mutationFn: () => submit({ data: { quizId: quiz.id, answers } }),
    onSuccess: onSaved,
  });
  return (
    <section className={card}>
      <h2 className="text-xl font-semibold">{quiz.title}</h2>
      {attempt ? (
        <>
          <p className="mt-4 text-3xl font-semibold text-primary">
            {attempt.score} / {attempt.total}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {tr(
              "Résultat enregistré, une tentative par quiz.",
              "Saved result, one attempt per quiz.",
            )}
          </p>
          {attempt.feedback.map((item, index) => (
            <div key={index} className="mt-4 border-t pt-4">
              <h3 className="font-semibold text-sm">{item.prompt}</h3>
              <p className="text-sm mt-2">
                {tr("Votre réponse", "Your answer")}:{" "}
                {quiz.questions[index]?.choices[item.selected]}
              </p>
              <p className="text-sm mt-1">
                {tr("Réponse attendue", "Correct answer")}:{" "}
                {quiz.questions[index]?.choices[item.correct]}
              </p>
              <p className="text-sm text-muted-foreground mt-2">{item.explanation}</p>
            </div>
          ))}
        </>
      ) : canTeach ? (
        <p className="mt-4 text-sm text-muted-foreground">
          {tr(
            "Le quiz est publié. Le résultat apparaîtra après la réponse du compte élève ou parent.",
            "The quiz is published. The result will appear after submission from the student or parent account.",
          )}
        </p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            mutation.mutate();
          }}
        >
          {quiz.questions.map((question, index) => (
            <fieldset key={index} className="mt-6">
              <legend className="font-semibold text-sm">
                {index + 1}. {question.prompt}
              </legend>
              {question.choices.map((choice, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 mt-3 text-sm rounded-xl border p-3"
                >
                  <input
                    type="radio"
                    required
                    name={`question-${index}`}
                    checked={answers[index] === i}
                    onChange={() =>
                      setAnswers((values) => values.map((value, j) => (j === index ? i : value)))
                    }
                  />
                  {choice}
                </label>
              ))}
            </fieldset>
          ))}
          <button
            disabled={mutation.isPending || answers.some((value) => value < 0)}
            className={`${button} mt-6`}
          >
            {tr("Valider mes réponses", "Submit answers")}
          </button>
          <Feedback error={mutation.isError} success={mutation.isSuccess} lang={lang} />
        </form>
      )}
    </section>
  );
}
