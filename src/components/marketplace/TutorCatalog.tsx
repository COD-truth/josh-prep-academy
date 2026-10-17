import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Link } from "@tanstack/react-router";
import { ArrowRight, Search, SlidersHorizontal, GraduationCap, Languages } from "lucide-react";
import { publicTutors } from "@/lib/public-tutors";
import { searchTutors } from "@/lib/tutor-search";
import type { Lang } from "@/lib/i18n";

export function TutorCatalog({
  lang,
  initialQuery = "",
  initialLevel = "",
  compact = false,
}: {
  lang: Lang;
  initialQuery?: string;
  initialLevel?: string;
  compact?: boolean;
}) {
  const tr = (fr: string, en: string) => (lang === "fr" ? fr : en);

  const tutors = useQuery({
    queryKey: ["tutors-active"],
    queryFn: () => publicTutors(),
    retry: false,
    staleTime: 60_000,
  });
  const [query, setQuery] = useState(initialQuery);
  const [level, setLevel] = useState(initialLevel);
  const [language, setLanguage] = useState("");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState("name");
  const records = tutors.data ?? [];
  const levels = [
    ...new Set([
      ...records.flatMap((tutor) => tutor.levels ?? []),
      ...(initialLevel ? [initialLevel] : []),
    ]),
  ].sort();
  const languages = [...new Set(records.flatMap((tutor) => tutor.languages ?? []))].sort();
  const results = searchTutors(records, { query, level, language, budget, sort });
  const control =
    "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const reset = () => {
    setQuery("");
    setLevel("");
    setLanguage("");
    setBudget("");
  };

  return (
    <section id="tutors" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-primary">
            {tr("Le bon prof, pour vous", "Your kind of teacher")}
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-semibold">
            {tr("Avec qui allez-vous progresser ?", "Who will help you grow?")}
          </h2>
          <p className="mt-3 text-muted-foreground">
            {tr(
              "Comparez les matières, les niveaux et les tarifs. Choisissez votre tuteur.",
              "Compare subjects, levels and prices. Find your tutor.",
            )}
          </p>
        </div>
        {compact && (
          <Link
            to="/cours"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
          >
            {tr("Tous les tuteurs", "All tutors")} <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      <div className="rounded-2xl border border-border bg-muted/40 p-4 sm:p-5">
        <label className="block text-xs font-semibold mb-2" htmlFor="tutor-query">
          {tr("Matière ou nom du tuteur", "Subject or tutor name")}
        </label>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <input
            id="tutor-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tr("Mathématiques, anglais, physique…", "Mathematics, English, physics…")}
            className={`${control} pl-11`}
          />
        </div>
        {!compact && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-xs font-semibold">
              {tr("Niveau", "Level")}
              <select
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                className={`${control} mt-2`}
              >
                <option value="">{tr("Tous les niveaux", "All levels")}</option>
                {levels.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              {tr("Langue", "Language")}
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className={`${control} mt-2`}
              >
                <option value="">{tr("Toutes les langues", "All languages")}</option>
                {languages.map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="text-xs font-semibold">
              {tr("Budget maximum / heure", "Maximum hourly budget")}
              <input
                type="number"
                min="0"
                step="500"
                value={budget}
                onChange={(event) => setBudget(event.target.value)}
                placeholder="FCFA"
                className={`${control} mt-2`}
              />
            </label>
            <label className="text-xs font-semibold">
              {tr("Trier par", "Sort by")}
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className={`${control} mt-2`}
              >
                <option value="name">{tr("Nom", "Name")}</option>
                <option value="price">{tr("Prix croissant", "Lowest price")}</option>
                <option value="experience">{tr("Expérience", "Experience")}</option>
              </select>
            </label>
          </div>
        )}
      </div>
      {tutors.isPending ? (
        <div role="status" className="py-12 text-center text-muted-foreground">
          {tr("Chargement des tuteurs…", "Loading tutors…")}
        </div>
      ) : tutors.isError ? (
        <div role="alert" className="mt-6 rounded-2xl border border-border p-8 text-center">
          <h3 className="font-semibold">
            {tr(
              "Le catalogue est momentanément indisponible",
              "The directory is temporarily unavailable",
            )}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {tr(
              "Notre équipe peut vous aider à trouver un tuteur.",
              "Our team can help you find a tutor.",
            )}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-4">
            <button onClick={() => tutors.refetch()} className="font-semibold text-primary">
              {tr("Réessayer", "Try again")}
            </button>
            <Link to="/contact" className="font-semibold text-primary">
              {tr("Nous contacter", "Contact us")}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p role="status" aria-live="polite" className="mt-6 mb-4 text-sm text-muted-foreground">
            {results.length}{" "}
            {tr("tuteur(s) correspondent à votre recherche", "tutor(s) match your search")}
          </p>
          {results.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <SlidersHorizontal className="mx-auto size-7 text-primary" />
              <h3 className="mt-4 text-xl font-semibold">
                {tr("Trouvons une autre piste", "Let's find another option")}
              </h3>
              <p className="mt-2 text-muted-foreground">
                {records.length
                  ? tr(
                      "Essayez une autre matière ou élargissez vos filtres.",
                      "Try another subject or broaden your filters.",
                    )
                  : tr(
                      "Aucun profil n'est disponible pour le moment. Décrivez votre besoin à notre équipe.",
                      "No profiles are available yet. Tell our team what you need.",
                    )}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-4">
                {records.length > 0 && (
                  <button onClick={reset} className="font-semibold text-primary">
                    {tr("Effacer les filtres", "Clear filters")}
                  </button>
                )}
                <Link to="/contact" className="font-semibold text-primary">
                  {tr("Être accompagné", "Get help")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {(compact ? results.slice(0, 3) : results).map((tutor) => (
                <article
                  key={tutor.id}
                  className="flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-shadow hover:shadow-lg"
                >
                  <div className="flex items-center gap-4 bg-primary-soft/50 p-6">
                    <TutorPhoto name={tutor.full_name} url={tutor.photo_url} />
                    <div className="min-w-0">
                      <h3 className="text-xl font-semibold break-words">{tutor.full_name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tutor.title || tr("Tuteur Josh & Co", "Josh & Co tutor")}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap gap-2">
                      {(tutor.subjects ?? []).map((subject) => (
                        <span
                          key={subject}
                          className="rounded-full bg-muted px-3 py-1 text-xs font-semibold"
                        >
                          {subject}
                        </span>
                      ))}
                    </div>
                    <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="size-4 shrink-0 mt-0.5" />
                      {tutor.levels?.join(" · ") || tr("Niveaux à préciser", "Ask about levels")}
                    </p>
                    <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                      <Languages className="size-4 shrink-0 mt-0.5" />
                      {tutor.languages?.join(" · ") ||
                        tr("Langues à préciser", "Ask about languages")}
                    </p>
                    {tutor.city && (
                      <p className="mt-3 text-sm text-muted-foreground">{tutor.city}</p>
                    )}
                    {tutor.bio && (
                      <details className="mt-4 text-sm">
                        <summary className="cursor-pointer font-semibold text-primary">
                          {tr("Découvrir son approche", "Explore their teaching approach")}
                        </summary>
                        <p className="mt-3 text-muted-foreground whitespace-pre-line">
                          {tutor.bio}
                        </p>
                      </details>
                    )}
                    {!!tutor.years_experience && (
                      <p className="mt-3 text-sm text-muted-foreground">
                        {tutor.years_experience} {tr("ans d'expérience", "years of experience")}
                      </p>
                    )}
                    <div className="mt-auto pt-6">
                      <Link
                        to="/tutors/$tutorId"
                        params={{ tutorId: tutor.id }}
                        className="mb-4 inline-block font-semibold text-primary underline underline-offset-4"
                      >
                        {tr("Profil détaillé et avis", "Full profile and reviews")}
                      </Link>
                      <p className="text-2xl font-semibold">
                        {tutor.hourly_rate_fcfa.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB")}{" "}
                        <span className="text-xs font-normal text-muted-foreground">FCFA / h</span>
                      </p>
                      <Link
                        to="/book"
                        search={{ tutor: tutor.id }}
                        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      >
                        {tr("Voir les créneaux", "See available times")}
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}

function TutorPhoto({ name, url }: { name: string; url: string | null }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img
      src={url}
      alt={name}
      onError={() => setFailed(true)}
      loading="lazy"
      className="size-20 shrink-0 rounded-2xl object-cover"
    />
  ) : (
    <div
      aria-hidden="true"
      className="grid size-20 shrink-0 place-items-center rounded-2xl bg-primary text-2xl font-semibold text-primary-foreground"
    >
      {name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")}
    </div>
  );
}
