import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLang } from "@/lib/i18n";
import { Nav, Footer, WhatsAppFab } from "@/components/site/LandingPage";
import { GraduationCap, ExternalLink } from "lucide-react";
export const Route = createFileRoute("/concours")({
  component: ConcoursPage,
  head: () => ({ meta: [{ title: "Concours & orientation — Josh & Co" }] }),
});
type Notice = {
  id: string;
  title: string;
  institution: string;
  study_field: string;
  level_required: string;
  city: string | null;
  deadline: string | null;
  exam_date: string | null;
  official_url: string;
  summary_fr: string;
  summary_en: string;
  verified_at: string;
};
function ConcoursPage() {
  const { lang, setLang } = useLang();
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);
  const [query, setQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  const notices = useQuery({
    queryKey: ["concours-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("concours_announcements" as never)
        .select(
          "id,title,institution,study_field,level_required,city,deadline,exam_date,official_url,summary_fr,summary_en,verified_at",
        )
        .eq("is_active", true)
        .order("deadline", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data as unknown as Notice[];
    },
  });
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Douala",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((p) => p.type === type)?.value;
  const today = `${part("year")}-${part("month")}-${part("day")}`;
  const results = (notices.data ?? []).filter(
    (item) =>
      (showPast || !item.deadline || item.deadline >= today) &&
      [item.title, item.institution, item.study_field, item.city, item.level_required]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  const displayDate = (value: string | null) =>
    value
      ? new Date(value + "T12:00:00").toLocaleDateString(lang === "fr" ? "fr-FR" : "en-GB")
      : tr("À confirmer auprès de l’établissement", "Confirm with the institution");
  return (
    <div>
      <Nav lang={lang} setLang={setLang} />
      <main>
        <header className="bg-secondary text-white px-4 py-14">
          <div className="max-w-6xl mx-auto">
            <GraduationCap className="size-9 text-accent" />
            <p className="mt-5 text-accent text-xs uppercase tracking-widest font-semibold">
              {tr("Le guide des familles", "The family guide")}
            </p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-semibold">
              {tr(
                "Choisir sa voie. Préparer son avenir.",
                "Choose a path. Prepare for the future.",
              )}
            </h1>
            <p className="mt-5 max-w-2xl text-white/70">
              {tr(
                "Concours, filières et démarches : les informations utiles pour accompagner votre enfant après le collège, le lycée ou l’université.",
                "Entrance exams, study fields and applications: useful information to guide your child after secondary school or university.",
              )}
            </p>
          </div>
        </header>
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                title: tr("1. Identifier la filière", "1. Choose a study field"),
                text: tr(
                  "Discutez des intérêts de l’élève, de ses résultats et des métiers envisagés. Comparez les écoles et les formations.",
                  "Discuss interests, school results and career goals. Compare schools and courses.",
                ),
              },
              {
                title: tr("2. Vérifier les conditions", "2. Check requirements"),
                text: tr(
                  "Consultez l’avis officiel : diplôme requis, pièces du dossier, frais, centre d’examen et dates limites.",
                  "Read the official notice: required qualification, documents, fees, exam centre and deadlines.",
                ),
              },
              {
                title: tr("3. Préparer le concours", "3. Prepare for the exam"),
                text: tr(
                  "Établissez un calendrier de révision avec des annales et un accompagnement dans les matières prioritaires.",
                  "Build a revision schedule with past papers and tutoring in key subjects.",
                ),
              },
            ].map((item) => (
              <article key={item.title} className="rounded-2xl bg-card border border-border p-6">
                <h2 className="text-lg font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.text}</p>
              </article>
            ))}
          </div>
          <div className="mt-12">
            <h2 className="text-3xl font-semibold">
              {tr("Avis de concours publiés", "Published entrance-exam notices")}
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {tr(
                "Chaque avis doit comporter une source officielle et une date de vérification. Josh & Co ne remplace pas l’établissement organisateur.",
                "Every notice includes an official source and review date. Josh & Co does not replace the organising institution.",
              )}
            </p>
            <label className="block mt-6 text-sm font-semibold">
              {tr("Établissement, ville ou filière", "Institution, city or study field")}
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-3"
              />
            </label>
            <label className="flex gap-2 mt-4 text-sm">
              <input
                type="checkbox"
                checked={showPast}
                onChange={(e) => setShowPast(e.target.checked)}
              />
              {tr(
                "Inclure les avis dont la date limite est passée",
                "Include notices with past deadlines",
              )}
            </label>
            {notices.isPending ? (
              <p role="status" className="mt-8">
                {tr("Chargement…", "Loading…")}
              </p>
            ) : notices.isError ? (
              <div role="alert" className="mt-8 border border-border rounded-xl p-6">
                <p>
                  {tr(
                    "Les avis sont momentanément indisponibles. Contactez l’équipe pour être orienté.",
                    "Notices are temporarily unavailable. Contact the team for guidance.",
                  )}
                </p>
                <button
                  onClick={() => notices.refetch()}
                  className="mt-3 text-primary font-semibold"
                >
                  {tr("Réessayer", "Retry")}
                </button>
              </div>
            ) : !results.length ? (
              <p className="mt-8 rounded-2xl bg-muted p-6 text-muted-foreground">
                {tr(
                  "Aucun avis publié ne correspond à votre recherche. Aucune date d’inscription n’est annoncée ici sans source.",
                  "No published notice matches your search. Registration dates are only announced with a source.",
                )}
              </p>
            ) : (
              <div className="mt-8 grid md:grid-cols-2 gap-5">
                {results.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-border p-6 bg-card">
                    <span className="text-xs font-semibold text-primary uppercase">
                      {item.study_field}
                    </span>
                    <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold">
                      {item.institution} {item.city && "· " + item.city}
                    </p>
                    <p className="mt-4 text-sm text-muted-foreground whitespace-pre-line">
                      {lang === "fr" ? item.summary_fr : item.summary_en}
                    </p>
                    <dl className="mt-5 text-sm space-y-2">
                      <div>
                        <dt className="font-semibold">
                          {tr("Niveau requis", "Required qualification")}
                        </dt>
                        <dd>{item.level_required}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">{tr("Date limite", "Deadline")}</dt>
                        <dd>{displayDate(item.deadline)}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">{tr("Date du concours", "Exam date")}</dt>
                        <dd>{displayDate(item.exam_date)}</dd>
                      </div>
                    </dl>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {tr("Source vérifiée le", "Source reviewed on")}{" "}
                      {displayDate(item.verified_at)}
                    </p>
                    <a
                      href={item.official_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center gap-2 font-semibold text-primary"
                    >
                      {tr("Consulter l’avis officiel", "Read the official notice")}
                      <ExternalLink className="size-4" />
                    </a>
                  </article>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-4 mt-10">
            <Link
              to="/schools"
              className="rounded-xl bg-primary px-5 py-3 text-primary-foreground font-semibold"
            >
              {tr("Comparer les écoles", "Compare schools")}
            </Link>
            <Link to="/contact" className="rounded-xl border border-border px-5 py-3 font-semibold">
              {tr("Demander conseil", "Ask for advice")}
            </Link>
          </div>
        </section>
      </main>
      <Footer lang={lang} />
      <WhatsAppFab />
    </div>
  );
}
