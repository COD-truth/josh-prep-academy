import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Compass, ArrowRight } from "lucide-react";
import type { Lang } from "@/lib/i18n";
export function FamilyAssistant({ lang }: { lang: Lang }) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [service, setService] = useState<"tutor" | "revision" | "school" | "concours" | null>(null);
  const [level, setLevel] = useState("");
  const [subject, setSubject] = useState("");
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-9">
      <div className="flex gap-4 items-start">
        <div className="rounded-2xl bg-primary-soft p-3">
          <Compass className="size-7 text-primary" />
        </div>
        <div>
          <p className="text-xs uppercase font-semibold tracking-widest text-primary">
            {tr("Assistant famille Josh & Co", "Josh & Co family guide")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold">
            {tr("Que souhaitez-vous faire aujourd’hui ?", "What would you like to do today?")}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr(
              "Choisissez un besoin. Nous vous montrons le chemin le plus court.",
              "Choose a need. We’ll show you the shortest path.",
            )}
          </p>
        </div>
      </div>
      <fieldset className="mt-6">
        <legend className="sr-only">{tr("Votre besoin", "Your need")}</legend>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { value: "tutor" as const, title: tr("Trouver un répétiteur", "Find a tutor") },
            { value: "revision" as const, title: tr("Réviser un examen", "Revise for an exam") },
            {
              value: "school" as const,
              title: tr("Choisir une école près de chez moi", "Find a school nearby"),
            },
            {
              value: "concours" as const,
              title: tr(
                "Préparer une orientation ou un concours",
                "Explore courses and entrance exams",
              ),
            },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={service === item.value}
              onClick={() => setService(item.value)}
              className={`rounded-xl border p-4 text-left text-sm font-semibold ${service === item.value ? "border-primary bg-primary-soft" : "border-border hover:border-primary"}`}
            >
              {item.title}
            </button>
          ))}
        </div>
      </fieldset>
      {service && (
        <div className="mt-6 border-t border-border pt-6" aria-live="polite">
          {service === "tutor" && (
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="text-sm font-semibold">
                {tr("Matière", "Subject")}
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={tr("Mathématiques, anglais…", "Mathematics, English…")}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3"
                />
              </label>
              <label className="text-sm font-semibold">
                {tr("Niveau scolaire", "School level")}
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-border px-4 py-3"
                >
                  <option value="">{tr("Choisir un niveau", "Choose a level")}</option>
                  {[
                    "Primaire",
                    "Collège",
                    "Lycée",
                    "Terminale",
                    "GCE O Level",
                    "GCE A Level",
                    "Université",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </label>
            </div>
          )}
          <p className="mt-4 text-sm text-muted-foreground">
            {service === "tutor"
              ? tr(
                  "Comparez les profils et les tarifs. Votre compte vous permettra ensuite de réserver un créneau.",
                  "Compare profiles and prices. Your account will then let you book a time.",
                )
              : service === "revision"
                ? tr(
                    "Filtrez les épreuves par examen, matière et année. Les conditions d’accès sont indiquées sur le site.",
                    "Filter papers by exam, subject and year. Access conditions are shown on the site.",
                  )
                : service === "school"
                  ? tr(
                      "Utilisez la ville, le quartier et la filière, puis consultez la carte ou la liste. La localisation est facultative.",
                      "Choose city, district and study field, then use the map or list. Location access is optional.",
                    )
                  : tr(
                      "Consultez les avis publiés et leurs sources officielles. Vérifiez les conditions et dates auprès de l’établissement.",
                      "Read published notices and their official sources. Confirm requirements and dates with the institution.",
                    )}
          </p>
          {service === "tutor" ? (
            <Link
              to="/cours"
              search={{ q: subject.trim(), level: level || undefined }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              {tr("Voir les tuteurs adaptés", "Find matching tutors")}
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to={
                service === "revision"
                  ? "/banque-epreuves"
                  : service === "school"
                    ? "/schools"
                    : "/concours"
              }
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              {tr("Continuer", "Continue")}
              <ArrowRight className="size-4" />
            </Link>
          )}
          <button
            onClick={() => {
              setService(null);
              setLevel("");
              setSubject("");
            }}
            className="ml-4 mt-4 text-sm underline text-primary"
          >
            {tr("Recommencer", "Start again")}
          </button>
        </div>
      )}
      <p className="mt-6 text-xs text-muted-foreground">
        {tr("Besoin de parler à quelqu’un ?", "Need to speak to someone?")}{" "}
        <Link to="/contact" className="underline text-primary">
          {tr("Contacter Josh & Co", "Contact Josh & Co")}
        </Link>
      </p>
    </section>
  );
}
