import { type Lang } from "@/lib/i18n";
import { successStats, overallRate } from "@/lib/site-content";

export function SuccessStats({ lang }: { lang: Lang }) {
  return (
    <section id="results" className="py-20 lg:py-24 bg-secondary text-secondary-foreground">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.18em] uppercase text-amber-300">
              {lang === "fr" ? "RÉSULTATS" : "RESULTS"}
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-semibold text-balance">
              {lang === "fr" ? "Nos taux de réussite" : "Our success rates"}
            </h2>
            <p className="mt-3 text-white/70">
              {lang === "fr"
                ? "Résultats consolidés de nos élèves accompagnés sur l'ensemble des sessions."
                : "Consolidated results across all our supported students and exam sessions."}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/15 px-8 py-6 text-center">
            <p className="text-4xl font-bold text-amber-300">{overallRate}%</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/60">
              {lang === "fr" ? "Moyenne globale" : "Overall average"}
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {successStats.map((g) => (
            <div key={g.group.en}>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">{g.group[lang]}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {g.items.map((it) => (
                  <div key={it.label} className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
                    <p className="text-3xl font-bold text-amber-300">{it.value}%</p>
                    <p className="mt-1 text-sm text-white/70">{it.label}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
