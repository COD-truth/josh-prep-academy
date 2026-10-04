export type Lang = "fr" | "en";

export const successStats = [
  { group: { fr: "Système francophone", en: "Francophone system" }, items: [
    { label: "CEP", value: 99 },
    { label: "BEPC", value: 98 },
    { label: "Probatoire", value: 80 },
    { label: "Baccalauréat", value: 99 },
  ]},
  { group: { fr: "Système anglophone", en: "Anglophone system" }, items: [
    { label: "FLSC", value: 95 },
    { label: "GCE O Level", value: 85 },
    { label: "GCE A Level", value: 89 },
  ]},
  { group: { fr: "Université", en: "University" }, items: [
    { label: "Licence 1-3", value: 100 },
  ]},
];

export const overallRate = 94.5;

export type ExamPaper = {
  id: string;
  examType: "BEPC" | "PROBATOIRE" | "BAC" | "GCE_O" | "GCE_A";
  subject: string;
  year: number;
  title: string;
  pages: number;
  descFr: string;
  descEn: string;
};

const p = (
  id: string, examType: ExamPaper["examType"], subject: string, year: number,
  title: string, pages: number, descFr: string, descEn: string,
): ExamPaper => ({ id, examType, subject, year, title, pages, descFr, descEn });

export const examPapers: ExamPaper[] = [
  p("bepc-2023-math", "BEPC", "Mathématiques", 2023, "BEPC 2023 — Mathématiques", 12, "Corrigé détaillé", "Detailed solutions"),
  p("bepc-2023-fr", "BEPC", "Français", 2023, "BEPC 2023 — Français", 10, "Corrigé et méthodologie", "Solutions and methodology"),
  p("bepc-2022-sci", "BEPC", "Sciences", 2022, "BEPC 2022 — Sciences", 14, "Corrigé commenté", "Annotated solutions"),
  p("prob-2023-math", "PROBATOIRE", "Mathématiques", 2023, "Probatoire 2023 — Mathématiques", 15, "Corrigé détaillé", "Detailed solutions"),
  p("prob-2023-pc", "PROBATOIRE", "Physique-Chimie", 2023, "Probatoire 2023 — Physique-Chimie", 18, "Corrigé + rappels de cours", "Solutions + key concepts"),
  p("prob-2022-svt", "PROBATOIRE", "Biologie/SVT", 2022, "Probatoire 2022 — Biologie/SVT", 16, "Corrigé commenté", "Annotated solutions"),
  p("bac-2023-math", "BAC", "Mathématiques", 2023, "Baccalauréat Science 2023 — Mathématiques", 20, "Corrigé détaillé", "Detailed solutions"),
  p("bac-2023-pc", "BAC", "Physique-Chimie", 2023, "Baccalauréat Science 2023 — Physique-Chimie", 22, "Corrigé + exercices types", "Solutions + typical exercises"),
  p("bac-2023-fr", "BAC", "Français", 2023, "Baccalauréat Littéraire 2023 — Français", 18, "Dissertations corrigées", "Corrected essays"),
  p("gceo-2023-math", "GCE_O", "Mathematics", 2023, "GCE O Level Mathematics 2023", 15, "Corrigé détaillé", "Full worked solutions"),
  p("gceo-2023-eng", "GCE_O", "English", 2023, "GCE O Level English 2023", 12, "Corrigé et modèles", "Solutions and model answers"),
  p("gceo-2023-fr", "GCE_O", "French", 2023, "GCE O Level French 2023", 11, "Corrigé détaillé", "Full worked solutions"),
  p("gceo-2023-bio", "GCE_O", "Biology", 2023, "GCE O Level Biology 2023", 14, "Corrigé commenté", "Annotated solutions"),
  p("gceo-2023-phy", "GCE_O", "Physics", 2023, "GCE O Level Physics 2023", 16, "Corrigé + rappels", "Solutions + key concepts"),
  p("gceo-2023-chem", "GCE_O", "Chemistry", 2023, "GCE O Level Chemistry 2023", 13, "Corrigé détaillé", "Full worked solutions"),
  p("gcea-2023-math", "GCE_A", "Mathematics", 2023, "GCE A Level Mathematics 2023", 18, "Corrigé détaillé", "Full worked solutions"),
  p("gcea-2023-phy", "GCE_A", "Physics", 2023, "GCE A Level Physics 2023", 22, "Corrigé + exercices types", "Solutions + typical exercises"),
  p("gcea-2023-chem", "GCE_A", "Chemistry", 2023, "GCE A Level Chemistry 2023", 20, "Corrigé commenté", "Annotated solutions"),
  p("gcea-2023-bio", "GCE_A", "Biology", 2023, "GCE A Level Biology 2023", 19, "Corrigé détaillé", "Full worked solutions"),
  p("gcea-2023-lit", "GCE_A", "English Literature", 2023, "GCE A Level English Literature 2023", 16, "Modèles de dissertations", "Model essays"),
];

export const examTypeLabels: Record<ExamPaper["examType"], string> = {
  BEPC: "BEPC",
  PROBATOIRE: "Probatoire",
  BAC: "Baccalauréat",
  GCE_O: "GCE O Level",
  GCE_A: "GCE A Level",
};
