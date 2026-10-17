import type { Lang } from "@/lib/i18n";
import { overallRate } from "@/lib/site-content";
export function SuccessStats({ lang }: { lang: Lang }) {
  return (
    <section id="results" className="bg-secondary text-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
        <div>
          <p className="text-accent text-xs uppercase tracking-widest font-semibold">
            {lang === "fr" ? "Réussite aux examens" : "Exam success"}
          </p>
          <h2 className="mt-3 text-2xl font-semibold">
            {lang === "fr" ? "Chaque progression compte." : "Every step forward matters."}
          </h2>
          <p className="mt-2 text-sm text-white/65">
            {lang === "fr"
              ? "Taux global communiqué par Josh & Co."
              : "Overall rate reported by Josh & Co."}
          </p>
        </div>
        <div className="rounded-2xl border border-white/15 bg-white/5 px-8 py-5">
          <p className="text-5xl font-semibold text-accent">
            {overallRate.toLocaleString(lang === "fr" ? "fr-FR" : "en-GB", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            %
          </p>
          <p className="mt-2 text-xs text-white/65 uppercase tracking-wider">
            {lang === "fr" ? "Taux de réussite général" : "Overall success rate"}
          </p>
        </div>
      </div>
    </section>
  );
}
