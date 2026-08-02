import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "fr" | "en";

export const translations = {
  nav: {
    subjects: { fr: "Matières", en: "Subjects" },
    tutors: { fr: "Tuteurs", en: "Tutors" },
    exams: { fr: "Banque d'épreuves", en: "Exam Bank" },
    testimonials: { fr: "Témoignages", en: "Testimonials" },
    book: { fr: "Réserver un cours", en: "Book a class" },
  },
  hero: {
    badge: { fr: "Inscriptions ouvertes", en: "Registrations open" },
    title1: { fr: "Faites confiance à Josh & Co pour un suivi de", en: "Trust Josh & Co for quality" },
    title2: { fr: "qualité", en: "support" },
    subtitle: {
      fr: "Encadrement à domicile et en ligne pour élèves du primaire, collège, lycée et université — sections anglophone et francophone. Préparation GCE, Probatoire, Baccalauréat et concours.",
      en: "Home and online tutoring for primary, middle, high school and university students — anglophone and francophone. GCE, Probatoire, Baccalauréat and entrance exam prep.",
    },
    cta1: { fr: "Réserver un cours à domicile", en: "Book a home lesson" },
    cta2: { fr: "Accéder à la banque d'épreuves", en: "Access the exam bank" },
    stat1: { fr: "Taux de réussite", en: "Success rate" },
    stat1v: { fr: "95% de réussite aux examens", en: "95% exam success rate" },
  },
  subjects: {
    eyebrow: { fr: "PROGRAMMES", en: "PROGRAMS" },
    title: { fr: "Matières enseignées", en: "Subjects we teach" },
    sub: {
      fr: "Des programmes rigoureux, alignés sur les exigences des concours.",
      en: "Rigorous programs aligned with the standards of competitive exams.",
    },
    items: [
      { fr: ["Mathématiques", "Analyse, algèbre et probabilités."], en: ["Mathematics", "Analysis, algebra and probability."] },
      { fr: ["Physique-Chimie", "Mécanique, thermodynamique, optique."], en: ["Physics-Chemistry", "Mechanics, thermodynamics, optics."] },
      { fr: ["Français & Philo", "Dissertation et culture générale."], en: ["French & Philosophy", "Essay writing and general culture."] },
      { fr: ["Anglais", "Préparation TOEFL, IELTS et oraux."], en: ["English", "TOEFL, IELTS and oral exam prep."] },
      { fr: ["SVT & Médecine", "Préparation intensive aux facs de médecine."], en: ["Biology & Medicine", "Intensive prep for medical school."] },
      { fr: ["Logique & Raisonnement", "Tests d'aptitude et concours d'écoles.", ], en: ["Logic & Reasoning", "Aptitude tests and school admissions."] },
    ],
  },
  booking: {
    eyebrow: { fr: "RÉSERVATION", en: "BOOKING" },
    title: { fr: "Réservez votre séance en 2 minutes", en: "Book your session in 2 minutes" },
    step1: { fr: "Choisissez votre matière et votre tuteur", en: "Choose your subject and tutor" },
    step2: { fr: "Sélectionnez un créneau au calendrier", en: "Pick a slot on the calendar" },
    step3: { fr: "Payez par Mobile Money — Orange ou MTN", en: "Pay via Mobile Money — Orange or MTN" },
    step4: { fr: "Rejoignez votre Google Classroom", en: "Join your Google Classroom" },
    cal: { fr: "Février 2026", en: "February 2026" },
    slots: { fr: "Créneaux disponibles", en: "Available slots" },
    confirm: { fr: "Confirmer la réservation", en: "Confirm booking" },
  },
  tutors: {
    eyebrow: { fr: "ÉQUIPE", en: "TEAM" },
    title: { fr: "Nos tuteurs experts", en: "Our expert tutors" },
    sub: {
      fr: "Diplômés des plus grandes écoles, passionnés par la transmission.",
      en: "Graduates of top universities, passionate about teaching.",
    },
  },
  exams: {
    eyebrow: { fr: "BANQUE D'ÉPREUVES", en: "EXAM BANK" },
    title: { fr: "Plus de 500 épreuves corrigées", en: "500+ corrected exam papers" },
    sub: {
      fr: "Accédez à 10 ans d'annales, exercices et fiches de révision stratégiques. Réservé aux abonnés.",
      en: "Access 10 years of past papers, exercises and strategic study sheets. Subscribers only.",
    },
    locked: { fr: "ABONNÉ UNIQUEMENT", en: "SUBSCRIBERS ONLY" },
    unlock: { fr: "Débloquer la banque complète", en: "Unlock the full bank" },
  },
  payment: {
    eyebrow: { fr: "PAIEMENT", en: "PAYMENT" },
    title: { fr: "Paiement Mobile Money", en: "Mobile Money payment" },
    sub: { fr: "Simple, rapide, sécurisé.", en: "Simple, fast, secure." },
  },
  testimonials: {
    eyebrow: { fr: "TÉMOIGNAGES", en: "TESTIMONIALS" },
    title: { fr: "Ils ont réussi avec Josh & Co", en: "They succeeded with Josh & Co" },
    items: [
      {
        level: "CEP",
        fr: { q: "Je fais partie de ceux pour qui tout était flou au départ : je ne comprenais presque rien en classe et je n'osais plus poser de questions. Avec Josh & Co, on a repris les bases une par une, calmement, jusqu'à ce que tout devienne clair. J'ai obtenu mon CEP.", a: "Jonathan — CEP" },
        en: { q: "I was one of those students for whom everything was blurry at first: I understood almost nothing in class and no longer dared to ask questions. With Josh & Co we rebuilt the basics one by one, calmly, until everything became clear. I passed my CEP.", a: "Jonathan — CEP" },
      },
      {
        level: "BEPC",
        fr: { q: "Comme Jonathan, j'avais un passif scolaire très compliqué et je pensais sincèrement que je n'y arriverais jamais. Le suivi régulier et les annales corrigées ont tout changé : j'ai décroché mon BEPC avec des notes que je n'imaginais pas.", a: "Yang — BEPC" },
        en: { q: "Like Jonathan, I had a very difficult school record and honestly believed I would never make it. Regular follow-up and the corrected past papers changed everything: I passed my BEPC with grades I never imagined.", a: "Yang — BEPC" },
      },
      {
        level: "Terminale D",
        fr: { q: "J'avais déjà un très bon niveau scolaire, mais il me manquait la méthode pour viser l'excellence. Les séances ciblées en maths et en physique-chimie m'ont permis de gagner en rigueur et de finir major de ma classe.", a: "Evelyn — Terminale D" },
        en: { q: "I already had a very good level, but I lacked the method to aim for excellence. Targeted maths and physics-chemistry sessions sharpened my rigour and I finished top of my class.", a: "Evelyn — Terminale D" },
      },
      {
        level: "Grade 5",
        fr: { q: "Pour moi, la situation était extrême : je redoublais et je perdais confiance. Les cours à domicile, patients et structurés, m'ont remis sur les rails. Aujourd'hui je participe en classe et mes résultats suivent.", a: "Prince — Grade 5" },
        en: { q: "For me the situation was extreme: I was repeating the year and losing confidence. Patient, structured home lessons put me back on track. Today I take part in class and my results follow.", a: "Prince — Grade 5" },
      },
      {
        level: "Upper Sixth",
        fr: { q: "Je devais consolider des acquis fragiles avant le GCE A Level, avec très peu de temps. Le plan de révision et la banque d'épreuves m'ont donné exactement ce qu'il fallait travailler. Résultat : mes A Levels en poche.", a: "Kévin — Upper Sixth" },
        en: { q: "I had to consolidate fragile foundations before the GCE A Level, with very little time. The revision plan and the exam bank showed me exactly what to work on. Result: I got my A Levels.", a: "Kévin — Upper Sixth" },
      },
    ],
  },
  classroom: {
    title: { fr: "Intégration Google Classroom", en: "Google Classroom integration" },
    sub: { fr: "Rejoignez vos classes virtuelles juste après votre réservation.", en: "Join your virtual classroom right after booking." },
    cta: { fr: "Accéder à ma classe", en: "Open my classroom" },
  },
  cta: {
    title: { fr: "Prêt à construire votre futur ?", en: "Ready to build your future?" },
    sub: { fr: "Réservez un premier cours de découverte avec le Dr. Josh.", en: "Book your first discovery class with Dr. Josh." },
    btn: { fr: "Réserver maintenant", en: "Book now" },
  },
  footer: {
    tagline: { fr: "L'excellence au service de votre réussite future.", en: "Excellence in service of your future success." },
    services: { fr: "Services", en: "Services" },
    contact: { fr: "Contact", en: "Contact" },
    rights: { fr: "Tous droits réservés.", en: "All rights reserved." },
  },
} as const;

type Ctx = { lang: Lang; setLang: (l: Lang) => void };
const LangContext = createContext<Ctx>({ lang: "fr", setLang: () => {} });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem("lang") as Lang | null) : null;
    if (saved === "fr" || saved === "en") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

export function t(node: { fr: string; en: string }, lang: Lang) {
  return node[lang];
}