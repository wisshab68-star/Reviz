export type SubjectFamily =
  | "mathematiques"
  | "sciences"
  | "lettres"
  | "histoire-geo"
  | "langues"
  | "philosophie"
  | "informatique"
  | "exact_sciences"
  | "life_sciences"
  | "humanities_history"
  | "humanities_text"
  | "languages"
  | "economics"
  | "general";

const SUBJECT_KEYWORDS: Record<SubjectFamily, string[]> = {
  mathematiques: ["math", "algebre", "geometrie", "calcul", "analyse", "statistique", "proba", "trigono"],
  sciences: ["physique", "chimie", "biologie", "svt", "science", "mecanique", "thermodynamique", "optique", "electro"],
  lettres: ["francais", "litterature", "grammaire", "orthographe", "poesie", "roman", "narratif", "stylistique"],
  "histoire-geo": ["histoire", "geographie", "geo", "geopolitique", "economie", "ses", "social"],
  langues: ["anglais", "espagnol", "allemand", "italien", "langue", "vocabulaire", "conjugaison"],
  philosophie: ["philosophie", "philo", "ethique", "logique", "metaphysique", "epistemologie"],
  informatique: ["informatique", "algorithme", "programmation", "code", "python", "javascript", "reseau", "base de donnees"],
  exact_sciences: [],
  life_sciences: [],
  humanities_history: [],
  humanities_text: [],
  languages: [],
  economics: [],
  general: [],
};

export function detectSubjectFamily(subject?: string | null): SubjectFamily {
  if (!subject) {
    return "general";
  }

  const lower = subject.toLowerCase();
  for (const [family, keywords] of Object.entries(SUBJECT_KEYWORDS) as [SubjectFamily, string[]][]) {
    if (
      family === "general"
      || family === "exact_sciences"
      || family === "life_sciences"
      || family === "humanities_history"
      || family === "humanities_text"
      || family === "languages"
      || family === "economics"
    ) {
      continue;
    }

    if (keywords.some((keyword) => lower.includes(keyword))) {
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
  exact_sciences: { formules: 8, flashcards: 10, notions: 6 },
  life_sciences: { formules: 6, flashcards: 10, notions: 6 },
  humanities_history: { formules: 0, flashcards: 10, notions: 8 },
  humanities_text: { formules: 0, flashcards: 8, notions: 8 },
  languages: { formules: 0, flashcards: 12, notions: 8 },
  economics: { formules: 0, flashcards: 10, notions: 8 },
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
    case "exact_sciences":
    case "life_sciences":
      return "Formules a memoriser";
    case "informatique":
      return "Algorithmes cles";
    case "humanities_history":
      return "Reperes a memoriser";
    case "langues":
    case "languages":
      return "Regles essentielles";
    default:
      return "Points essentiels";
  }
}

export function getSubjectSpecificInstructions(family: SubjectFamily): string {
  switch (family) {
    case "mathematiques":
    case "exact_sciences":
      return `ADAPTATION MATIERE - MATHEMATIQUES :
- Priorise definitions operatoires, criteres, proprietes et formules exactes.
- Fais ressortir les conditions d'application et les erreurs de signe, d'indice ou de raisonnement.
- Les exemples doivent montrer une vraie application du cours, pas une simple paraphrase.`;
    case "sciences":
    case "life_sciences":
      return `ADAPTATION MATIERE - SCIENCES :
- Mets en avant les relations de cause a effet, les grandeurs, unites et lois a utiliser.
- Conserve les formules exactes et les hypotheses d'utilisation.
- Fais apparaitre les pieges experimentaux ou les confusions frequentes.`;
    case "histoire-geo":
    case "humanities_history":
    case "economics":
      return `ADAPTATION MATIERE - HISTOIRE-GEOGRAPHIE :
- Fais remonter les reperes, acteurs, dates, bascules et enjeux majeurs.
- Les points cles doivent expliquer les causalites et les consequences.
- Les flashcards doivent aider a retenir dates, acteurs, notions et logiques d'ensemble.`;
    case "langues":
    case "languages":
      return `ADAPTATION MATIERE - LANGUES :
- Priorise regles grammaticales, structures syntaxiques, vocabulaire pivot et faux amis.
- Les exemples doivent etre courts, corrects et reutilisables.
- Les flashcards doivent entrainer la reformulation et l'application de la regle.`;
    case "philosophie":
    case "humanities_text":
      return `ADAPTATION MATIERE - PHILOSOPHIE / LETTRES :
- Fais ressortir les theses, distinctions conceptuelles et oppositions entre notions proches.
- La definition doit etre precise et argumentativement utile.
- Les flashcards doivent tester la comprehension des notions et de leurs implications.`;
    case "informatique":
      return `ADAPTATION MATIERE - INFORMATIQUE :
- Priorise logique, etapes, conditions, cas limites et structure des algorithmes.
- Les exemples doivent montrer une execution ou un comportement concret.
- Les pieges doivent pointer les erreurs de raisonnement, d'ordre ou de condition.`;
    case "lettres":
      return `ADAPTATION MATIERE - LETTRES :
- Fais remonter les notions d'analyse, procedes, theses, mouvements et enjeux du texte.
- Les points cles doivent aider a commenter, comparer ou rediger.
- Les flashcards doivent couvrir notions, procedes, auteurs et distinctions utiles.`;
    default:
      return `ADAPTATION MATIERE :
- Priorise les notions vraiment utiles a l'examen.
- Garde un niveau de precision eleve tout en restant tres synthetique.
- Les exemples, pieges et flashcards doivent etre directement reutilisables en revision.`;
  }
}
