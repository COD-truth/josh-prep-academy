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
        fr: { q: "Grâce au Dr. Josh, j'ai comblé mes lacunes en physique et intégré l'école de mes rêves.", a: "Yasmine K. — Admise INPHB" },
        en: { q: "Thanks to Dr. Josh I closed my physics gaps and got into my dream school.", a: "Yasmine K. — Admitted to INPHB" },
      },
      {
        fr: { q: "La banque d'épreuves est une mine d'or. Les corrections sont d'une clarté remarquable.", a: "Moussa D. — Prépa MPSI" },
        en: { q: "The exam bank is a goldmine. The corrections are remarkably clear.", a: "Moussa D. — MPSI prep" },
      },
      {
        fr: { q: "Le système de réservation est intuitif et Google Classroom facilite vraiment le suivi.", a: "Alice T. — Concours Médecine" },
        en: { q: "Booking is intuitive and Google Classroom makes follow-up so smooth.", a: "Alice T. — Medical school exam" },
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