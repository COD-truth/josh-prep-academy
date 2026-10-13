export type TutorSummary = {
  full_name: string;
  title: string | null;
  subjects: string[];
  levels: string[];
  languages: string[];
  hourly_rate_fcfa: number;
  years_experience: number | null;
};
export const normalizeTutorText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
const aliases = [
  ["mathematiques", "mathematics", "maths", "math"],
  ["physique", "physics"],
  ["anglais", "english"],
  ["francais", "french"],
  ["biologie", "biology", "svt"],
  ["chimie", "chemistry"],
];
export function searchTutors<T extends TutorSummary>(
  records: T[],
  filters: { query: string; level: string; language: string; budget: string; sort: string },
): T[] {
  const terms = normalizeTutorText(filters.query).split(/\s+/).filter(Boolean);
  return records
    .filter((tutor) => {
      const searchable = normalizeTutorText(
        [tutor.full_name, tutor.title, ...tutor.subjects, ...tutor.levels].join(" "),
      );
      return (
        terms.every((term) =>
          (aliases.find((group) => group.includes(term)) ?? [term]).some((word) =>
            searchable.includes(word),
          ),
        ) &&
        (!filters.level || tutor.levels.includes(filters.level)) &&
        (!filters.language || tutor.languages.includes(filters.language)) &&
        (!filters.budget || tutor.hourly_rate_fcfa <= Number(filters.budget))
      );
    })
    .sort((a, b) =>
      filters.sort === "price"
        ? a.hourly_rate_fcfa - b.hourly_rate_fcfa
        : filters.sort === "experience"
          ? (b.years_experience ?? 0) - (a.years_experience ?? 0)
          : a.full_name.localeCompare(b.full_name),
    );
}
