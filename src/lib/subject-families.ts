export type SubjectFamily =
  | "mathematiques"
  | "sciences"
  | "lettres"
  | "histoire-geo"
  | "langues"
  | "philosophie"
  | "informatique"
  | "general";

const SUBJECT_KEYWORDS: Record<SubjectFamily, string[]> = {
  mathematiques: ["math", "algèbre", "géométrie", "calcul", "analyse", "statistique", "proba", "trigono"],
  sciences: ["physique", "chimie", "biologie", "svt", "science", "mécanique", "thermodynamique", "optique", "électro"],
  lettres: ["français", "littérature", "grammaire", "orthographe", "poésie", "roman", "narratif", "stylistique"],
  "histoire-geo": ["histoire", "géographie", "géo", "géopolitique", "économie", "ses", "social"],
  langues: ["anglais", "espagnol", "allemand", "italien", "langue", "vocabulaire", "conjugaison"],
  philosophie: ["philosophie", "philo", "éthique", "logique", "métaphysique", "épistémologie"],
  informatique: ["informatique", "algorithme", "programmation", "code", "python", "javascript", "réseau", "base de données"],
  general: [],
};

export function detectSubjectFamily(subject?: string | null): SubjectFamily {
  if (!subject) return "general";
  const lower = subject.toLowerCase();
  for (const [family, keywords] of Object.entries(SUBJECT_KEYWORDS) as [SubjectFamily, string[]][]) {
    if (family === "general") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return family;
    }
  }
  return "general";
}

export interface SubjectFamilyCaps {
  formules: number;
  flashcards: number;
  notions: number;
}

const CAPS: Record<SubjectFamily, SubjectFamilyCaps> = {
  mathematiques: { formules: 8, flashcards: 10, notions: 6 },
  sciences: { formules: 6, flashcards: 10, notions: 6 },
  lettres: { formules: 0, flashcards: 8, notions: 8 },
  "histoire-geo": { formules: 0, flashcards: 10, notions: 8 },
  langues: { formules: 0, flashcards: 12, notions: 8 },
  philosophie: { formules: 0, flashcards: 8, notions: 6 },
  informatique: { formules: 4, flashcards: 10, notions: 6 },
  general: { formules: 4, flashcards: 8, notions: 6 },
};

export function getSubjectFamilyCaps(family: SubjectFamily): SubjectFamilyCaps {
  return CAPS[family] ?? CAPS.general;
}

export function getFlashcardCap(family: SubjectFamily): number {
  return CAPS[family]?.flashcards ?? 8;
}

export function getFormulesSectionLabel(family: SubjectFamily): string {
  switch (family) {
    case "mathematiques":
    case "sciences":
      return "Formules à mémoriser";
    case "informatique":
      return "Algorithmes clés";
    default:
      return "Points essentiels";
  }
}
