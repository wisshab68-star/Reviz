import { buildUserPrompt, FICHE_SYSTEM_PROMPT } from "@/lib/prompts/fiche-generator";
import { openai } from "@/lib/openai";
import {
  cleanGeneratedContent,
  extractFormulaCandidates,
  looksLikeFormula,
  normalizeAcademicText,
  normalizeDocumentText,
  normalizeFormulaText,
  sanitizeAiJsonValue,
  sanitizeAiText,
  sanitizeJsonValue,
} from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import { generateWithPipeline, sanitizeFicheOutput } from "@/services/generation-pipeline";
import type {
  FicheFlashcard,
  FicheClassification,
  FicheGeneree,
  FicheMetrique,
  FicheBlueprintSections,
  FicheClassificationNode,
  FicheComparisonPoint,
  FichePseudoCodeStep,
  FicheRepere,
  FicheSchema,
  FicheSchemaConnexion,
  FicheSchemaElement,
  FicheStep,
  FicheTableRow,
} from "@/types/fiche-generated";

function truncate(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function fitEducationalContent(text: string, maxLength: number) {
  const cleaned = normalizeText(text);
  if (!cleaned) {
    return "";
  }

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  const sentences = cleaned.match(/[^.!?]+[.!?]+/g)?.map((sentence) => normalizeText(sentence)) ?? [];
  if (sentences.length > 0) {
    let result = "";
    for (const sentence of sentences) {
      const candidate = result ? `${result} ${sentence}` : sentence;
      if (candidate.length > maxLength) {
        break;
      }
      result = candidate;
    }

    if (result) {
      return result;
    }
  }

  const splitIndex = cleaned.lastIndexOf(" ", maxLength);
  return splitIndex > Math.floor(maxLength * 0.6) ? cleaned.slice(0, splitIndex).trim() : cleaned;
}

function normalizeText(value: string) {
  // Use light sanitizer to preserve LaTeX backslashes from AI-generated content.
  // normalizeAcademicText would strip them via \s*\\\s* → " ".
  return sanitizeAiText(value).replace(/\s+/g, " ").trim();
}

function canonicalizeFormalFormula(value: string) {
  const cleaned = normalizeFormulaText(value)
    .replace(/vec\{([A-Za-z])\}/g, "$1")
    .replace(/\|\|\s*([A-Za-z])\s*\|\|/g, "||$1||")
    .replace(/\b(?:mathbb|mathrm|text)\{([^}]+)\}/g, "$1")
    .replace(/\bexp\(([^)]+)\)/gi, "e^($1)")
    .replace(/\b([uvwa-z])n\+1\b/gi, "$1_n+1")
    .replace(/\b([uvwa-z])n\b/gi, "$1_n")
    .replace(/\bfx\b/gi, "f(x)")
    .replace(/\bfn\b/gi, "f_n")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (/\bAB\b.*\bBC\b.*\bAC\b/.test(cleaned)) {
    return "AB + BC = AC";
  }

  if (/det/i.test(cleaned) && /=\s*0\b/.test(cleaned)) {
    return "det(u,v) = 0";
  }

  if (/det/i.test(cleaned) && /x/i.test(cleaned) && /y/i.test(cleaned)) {
    return "det(u,v) = x*y' - y*x'";
  }

  if (/\bAB\b.*sqrt/i.test(cleaned) && /(xA|xB|yA|yB)/.test(cleaned)) {
    return "AB = sqrt((xB-xA)^2 + (yB-yA)^2)";
  }

  if (/\bM\s*\(/i.test(cleaned) && /(xA|xB|yA|yB)/.test(cleaned) && /\/2/.test(cleaned)) {
    return "M((xA+xB)/2 ; (yA+yB)/2)";
  }

  if (/\bu\b.*=/.test(cleaned) && /\bk\b/.test(cleaned) && /\bv\b/.test(cleaned)) {
    return "u = k*v";
  }

  if (/\bAA\b.*=\s*0\b/.test(cleaned)) {
    return "AA = 0";
  }

  if (/\bBA\b.*-\s*\bAB\b/.test(cleaned)) {
    return "BA = -AB";
  }

  return cleaned;
}

function isChemistryCourse(content: string, subject = "") {
  const lower = `${subject} ${content}`.toLowerCase();
  return /(chimie|physique-chimie|acide|base|bronsted|brønsted|ph\b|pka|poh|h3o|ho-|oh-|reaction acido|equation acido|couple acide-base)/.test(lower);
}

function canonicalizeChemistryFormula(value: string) {
  return normalizeFormulaText(value)
    .replace(/\bH30\+/gi, "H3O+")
    .replace(/\bOH\-/gi, "HO-")
    .replace(/\[\s*H3O\+\s*\]/gi, "[H3O+]")
    .replace(/\[\s*HO-\s*\]/gi, "[HO-]")
    .replace(/\[\s*OH-\s*\]/gi, "[HO-]")
    .replace(/\b10\s*\^\s*-\s*pH\b/gi, "10^(-pH)")
    .replace(/\b10\s*\^\s*-\s*pOH\b/gi, "10^(-pOH)")
    .replace(/\bpH\s*=\s*-\s*log\s*\(?\s*\[\s*H3O\+\s*\]\s*\)?/gi, "pH = -log([H3O+])")
    .replace(/\bpOH\s*=\s*-\s*log\s*\(?\s*\[\s*HO-\s*\]\s*\)?/gi, "pOH = -log([HO-])")
    .replace(/\[\s*H3O\+\s*\]\s*=\s*10\^\(-pH\)/gi, "[H3O+] = 10^(-pH)")
    .replace(/\[\s*HO-\s*\]\s*=\s*10\^\(-pOH\)/gi, "[HO-] = 10^(-pOH)")
    .replace(/\bpH\s*\+\s*pOH\s*=\s*14\b/gi, "pH + pOH = 14")
    .replace(/\bK[eé]\s*=\s*\[\s*H3O\+\s*\]\s*\[\s*HO-\s*\]\s*=\s*10\^\(-14\)/gi, "Ke = [H3O+][HO-] = 10^(-14)")
    .replace(/\bHA\b/g, "HA")
    .replace(/\bA-\b/g, "A-")
    .trim();
}

function hasCompleteEqualityMembers(value: string) {
  const cleaned = value.trim();
  if (!cleaned.includes("=")) {
    return true;
  }

  const [left, ...rest] = cleaned.split("=");
  const right = rest.join("=").trim();
  const lhs = left.trim();

  if (!lhs || !right) {
    return false;
  }

  if (/[+\-*/^(]$/.test(lhs) || /^[+\-*/^)]/.test(right)) {
    return false;
  }

  if (/\b(?:log|ln|exp)\s*$/i.test(right)) {
    return false;
  }

  return true;
}

function isIncompleteFormula(value: string, chemistryCourse = false) {
  const cleaned = chemistryCourse ? canonicalizeChemistryFormula(value) : canonicalizeFormalFormula(value);

  if (!hasCompleteEqualityMembers(cleaned)) {
    return true;
  }

  return /^[=]/.test(cleaned)
    || /[=+\-*/^(]$/.test(cleaned)
    || /\b(?:pH|pOH)\s*=\s*-\s*log\s*$/i.test(cleaned)
    || /^\[\s*\]\s*=/.test(cleaned)
    || /^\s*=\s*\S+/.test(cleaned)
    || (chemistryCourse && /^(AH\s*=|]\s*=|=\s*1 ?mol\.?L-?1?$)/i.test(cleaned));
}

function extractChemistryFormulaLines(content: string) {
  const candidates: string[] = [];
  const lines = normalizeAcademicText(content).split(/\n+/);

  const pushCandidate = (value: string) => {
    const cleaned = canonicalizeChemistryFormula(value.replace(/^[•\-–]\s*/, "").trim());
    if (!cleaned || cleaned.length < 6 || cleaned.length > 160) {
      return;
    }
    if (!/(pH|pOH|pKa|H3O\+|HO-|HA|A-|Ke|Ka|Kb|\[[^\]]+\]|->|<->|=)/i.test(cleaned)) {
      return;
    }
    if (isIncompleteFormula(cleaned, true)) {
      return;
    }
    candidates.push(cleaned);
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    pushCandidate(line);

    if (line.includes(":")) {
      pushCandidate(line.split(":").slice(1).join(":"));
    }

    for (const chunk of line.split(/[;|]/)) {
      pushCandidate(chunk);
    }
  }

  return dedupeStrings(candidates);
}

function isHighQualityFormula(value: string, vectorCourse = false) {
  const cleaned = canonicalizeFormalFormula(value);

  const generalFormalFormula = (
    (/[=^]/.test(cleaned) || looksLikeFormula(cleaned))
    && cleaned.length >= 5
    && cleaned.length <= 140
    && !/^(definition|exemple|propriete|methode|cours)\b/i.test(cleaned)
  );

  if (!vectorCourse) {
    return generalFormalFormula;
  }

  return /\bAB \+ BC = AC\b/.test(cleaned)
    || /\bBA = -AB\b/.test(cleaned)
    || /\bAA = 0\b/.test(cleaned)
    || /\bM\(\(xA\+xB\)\/2 ; \(yA\+yB\)\/2\)\b/.test(cleaned)
    || /\bAB = sqrt\(\(xB-xA\)\^2 \+ \(yB-yA\)\^2\)\b/.test(cleaned)
    || /\bu = k\*v\b/.test(cleaned)
    || /\bdet\(u,v\) = 0\b/.test(cleaned)
    || /\bdet\(u,v\) = x\*y' - y\*x'\b/.test(cleaned)
    || /\bxy' - yx' = 0\b/.test(cleaned)
    || /\bx1y2 = x2y1\b/.test(cleaned)
    || /\bu - v = u \+ \( - v\)\b/.test(cleaned)
    || generalFormalFormula;
}

function isSuspiciousFormula(value: string) {
  const cleaned = canonicalizeFormalFormula(value);

  return !cleaned
    || !hasCompleteEqualityMembers(cleaned)
    || /[#$&]/.test(cleaned)
    || /det\(\s*\)/i.test(cleaned)
    || /xx'\s*yy'|=\s*=/.test(cleaned)
    || /^(les|partie|chapitre|section)\b/i.test(cleaned)
    || /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+){2,}$/.test(cleaned)
    || (!looksLikeFormula(cleaned) && !/[=()]/.test(cleaned))
    || (/^[A-Z]{2}\s*=\s*[A-Z]{2}$/.test(cleaned) && !/\bAA\s*=\s*0\b/.test(cleaned))
    || cleaned.split(/\s+/).length > 18
    || /^[^A-Za-z0-9]+$/.test(cleaned);
}

function isSuspiciousProperty(value: string) {
  const cleaned = normalizeText(value);

  return !cleaned
    || /^(les|partie|chapitre|section)\b/i.test(cleaned)
    || /^\d+[\).:-]/.test(cleaned)
    || cleaned.length < 25
    || /^[A-Z][A-Z\s:]+$/.test(cleaned);
}

function hasAny(content: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(content));
}

function splitSentences(content: string) {
  return content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => sentence.length > 20);
}

function extractKeywords(content: string) {
  const matches = content.match(/\b[A-Z][A-Za-z-]{3,}\b/g) ?? [];
  return [...new Set(matches.map((match) => normalizeText(match)))].slice(0, 8);
}

function extractNumbers(content: string) {
  return [...new Set(content.match(/\b\d+(?:[.,]\d+)?\b/g) ?? [])].slice(0, 8);
}

function extractMathFormulaLines(content: string) {
  return extractFormulaCandidates(content).slice(0, 12);
}

function extractMathPropertyLines(content: string) {
  return content
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter((line) =>
      line.length >= 12
      && line.length <= 220
      && /(si|alors|equivaut|equivalent|colineair|milieu|parallelogramme|opposes|nul|direction|sens|translation|chasles|derive|croiss|decroiss|quotient|produit|somme|convex|limite|suite|exponentielle|logarithme)/i.test(line),
    )
    .slice(0, 12);
}

function dedupeStrings(items: string[]) {
  return [...new Set(items.map((item) => normalizeText(item)).filter(Boolean))];
}

function isVectorCourse(content: string) {
  const lower = content.toLowerCase();
  return /(vecteur|colinear|chasles|parallelogramme|determinant|repere orthonorme|milieu|distance)/.test(
    lower,
  );
}

function buildVectorCanonicalNotions(content: string) {
  const matches: string[] = [];

  if (hasAny(content, [/vecteur nul/i, /\bAA\s*=\s*0\b/i, /overrightarrow\{AA\}/i])) {
    matches.push("Vecteur nul : AA = 0");
  }
  if (hasAny(content, [/vecteurs?\s+opposes/i, /\bBA\s*=\s*-\s*AB\b/i, /sens\s+contraire/i])) {
    matches.push("Vecteurs opposes : BA = -AB, meme direction et longueur, sens contraire");
  }
  if (hasAny(content, [/relation de chasles/i, /\bAB\s*\+\s*BC\s*=\s*AC\b/i])) {
    matches.push("Relation de Chasles : AB + BC = AC");
  }
  if (hasAny(content, [/produit d.?un vecteur par un reel/i, /k\s*\.\s*u/i, /\b5u\b/i, /-3u/i])) {
    matches.push("Produit d'un vecteur par un reel : k*u modifie longueur et sens");
  }
  if (hasAny(content, [/colinear/i, /determinant/i])) {
    matches.push("Colinearite : determinant nul");
  }
  if (hasAny(content, [/milieu/i, /\(xA\+xB\)\/2/i])) {
    matches.push("Coordonnees du milieu");
  }
  if (hasAny(content, [/distance/i, /repere orthonorme/i, /sqrt|√|\^2/i])) {
    matches.push("Distance dans un repere orthonorme");
  }
  if (hasAny(content, [/parallelogramme/i])) {
    matches.push("Propriete du parallelogramme en vecteurs");
  }
  if (hasAny(content, [/propriete du milieu/i])) {
    matches.push("Propriete du milieu via les vecteurs");
  }

  return matches;
}

function buildVectorCanonicalFormulas(content: string) {
  const formulas: string[] = [];

  if (hasAny(content, [/relation de chasles/i, /\bAB\s*\+\s*BC\s*=\s*AC\b/i])) {
    formulas.push("AB + BC = AC");
  }
  if (hasAny(content, [/vecteur nul/i, /\bAA\s*=\s*0\b/i])) {
    formulas.push("AA = 0");
  }
  if (hasAny(content, [/vecteurs?\s+opposes/i, /\bBA\s*=\s*-\s*AB\b/i])) {
    formulas.push("BA = -AB");
  }
  if (hasAny(content, [/produit d.?un vecteur par un reel/i, /\bk\b/i, /\b5u\b/i, /-3u/i])) {
    formulas.push("u = k*v");
  }
  if (hasAny(content, [/milieu/i, /\(xA\+xB\)\/2/i, /\(yA\+yB\)\/2/i])) {
    formulas.push("M((xA+xB)/2 ; (yA+yB)/2)");
  }
  if (
    hasAny(content, [
      /distance/i,
      /repere orthonorme/i,
      /\(xB-xA\)\^?2/i,
      /\(yB-yA\)\^?2/i,
      /sqrt|√/i,
    ])
  ) {
    formulas.push("AB = sqrt((xB-xA)^2 + (yB-yA)^2)");
  }
  if (hasAny(content, [/colinear/i, /determinant/i])) {
    formulas.push("det(u,v) = 0");
    formulas.push("det(u,v) = x*y' - y*x'");
  }

  return formulas;
}

function buildVectorCanonicalProperties(content: string) {
  const properties: string[] = [];

  if (hasAny(content, [/direction/i, /sens/i])) {
    properties.push("Un vecteur est caracterise par direction, sens et longueur");
  }
  if (hasAny(content, [/vecteurs?\s+egaux/i, /meme direction/i, /meme sens/i, /meme longueur/i])) {
    properties.push("Deux vecteurs sont egaux s'ils ont meme direction, meme sens et meme longueur");
  }
  if (hasAny(content, [/vecteur nul/i, /\bAA\s*=\s*0\b/i])) {
    properties.push("Le vecteur nul a une norme nulle et ne privilegie aucun sens");
  }
  if (hasAny(content, [/relation de chasles/i, /\bAB\s*\+\s*BC\s*=\s*AC\b/i])) {
    properties.push("La relation de Chasles permet de decomposer ou recomposer un vecteur via un point intermediaire");
  }
  if (hasAny(content, [/produit d.?un vecteur par un reel/i, /\bk\b/i])) {
    properties.push("Si k>0 le sens est conserve, si k<0 le sens est inverse");
  }
  if (hasAny(content, [/parallelogramme/i])) {
    properties.push("Dans un parallelogramme, les vecteurs de cotes opposes sont egaux");
  }
  if (hasAny(content, [/propriete du milieu/i, /milieu/i])) {
    properties.push("Le milieu d'un segment s'exprime avec la moyenne des coordonnees des extremites");
  }
  if (hasAny(content, [/colinear/i, /determinant/i])) {
    properties.push("Le critere determinant nul caracterise la colinearite dans le plan");
  }
  if (hasAny(content, [/distance/i, /repere orthonorme/i])) {
    properties.push("Dans un repere orthonorme, la distance se calcule avec le theoreme de Pythagore");
  }

  return properties;
}

function flashcardConceptKey(question: string) {
  const cleaned = normalizeText(question).toLowerCase();

  if (/vecteur nul/.test(cleaned)) return "vecteur-nul";
  if (/chasles/.test(cleaned)) return "chasles";
  if (/colineair/.test(cleaned)) return "colinearite";
  if (/milieu/.test(cleaned)) return "milieu";
  if (/distance/.test(cleaned)) return "distance";
  if (/reel k|produit d'un vecteur/.test(cleaned)) return "produit-reel";
  if (/oppose/.test(cleaned)) return "vecteurs-opposes";
  if (/sens et direction|difference entre sens et direction|sens.*direction|direction.*sens/.test(cleaned)) {
    return "sens-direction";
  }

  return cleaned;
}

function buildVectorCanonicalFlashcards(content: string): FicheFlashcard[] {
  const cards: FicheFlashcard[] = [];

  if (hasAny(content, [/vecteur nul/i, /\bAA\s*=\s*0\b/i])) {
    cards.push({
      question: "Comment definir le vecteur nul ?",
      reponse: "Le vecteur nul est le vecteur associe a un point sur lui-meme : AA = 0. Il a une norme nulle et n'impose aucun sens privilegie.",
    });
  }

  if (hasAny(content, [/vecteurs?\s+opposes/i, /\bBA\s*=\s*-\s*AB\b/i])) {
    cards.push({
      question: "Quand deux vecteurs sont-ils opposes ?",
      reponse: "Deux vecteurs opposes ont la meme direction et la meme longueur, mais des sens contraires. On ecrit par exemple BA = -AB.",
    });
  }

  if (hasAny(content, [/relation de chasles/i, /\bAB\s*\+\s*BC\s*=\s*AC\b/i])) {
    cards.push({
      question: "Quelle est la relation de Chasles ?",
      reponse: "Pour tous points A, B et C, on a AB + BC = AC. Elle permet de decomposer ou recomposer un vecteur via un point intermediaire.",
    });
  }

  if (hasAny(content, [/colinear/i, /determinant/i])) {
    cards.push({
      question: "Quel critere permet de montrer que deux vecteurs sont colineaires ?",
      reponse: "Dans le plan, deux vecteurs sont colineaires si et seulement si leur determinant est nul.",
    });
  }

  if (hasAny(content, [/milieu/i, /\(xA\+xB\)\/2/i])) {
    cards.push({
      question: "Quelle est la formule des coordonnees du milieu d'un segment ?",
      reponse: "Si M est le milieu de [AB], alors M((xA+xB)/2 ; (yA+yB)/2). On fait la moyenne des abscisses et la moyenne des ordonnees.",
    });
  }

  if (
    hasAny(content, [
      /distance/i,
      /repere orthonorme/i,
      /\(xB-xA\)\^?2/i,
      /\(yB-yA\)\^?2/i,
      /sqrt|√/i,
    ])
  ) {
    cards.push({
      question: "Quelle est la formule de la distance AB dans un repere orthonorme ?",
      reponse: "AB = sqrt((xB-xA)^2 + (yB-yA)^2). Elle vient du theoreme de Pythagore applique aux differences de coordonnees.",
    });
  }

  if (hasAny(content, [/produit d.?un vecteur par un reel/i, /\bk\b/i])) {
    cards.push({
      question: "Que fait le produit d'un vecteur par un reel k ?",
      reponse: "Il multiplie la longueur du vecteur par |k|. Si k est positif, le sens est conserve ; si k est negatif, le sens est inverse.",
    });
  }

  return cards;
}

function ensureSentence(value: string, fallback: string, minLength: number, maxLength: number) {
  const cleaned = normalizeText(value);
  const safeValue = cleaned.length >= minLength ? cleaned : normalizeText(fallback);
  return fitEducationalContent(safeValue, maxLength);
}

const GENERIC_CONCEPT_STOPWORDS = new Set([
  "chapitre",
  "cours",
  "partie",
  "section",
  "methode",
  "exercice",
  "exemple",
  "resume",
  "notion",
  "definition",
  "question",
  "reponse",
  "document",
  "introduction",
  "conclusion",
  "generalites",
]);

const GENERIC_WEAK_NOTION_PATTERNS = [
  /^(partie|chapitre|section)\s+\d+/i,
  /^(introduction|conclusion|annexe|bibliographie)$/i,
  /^(resume|cours|document|notion|concept)$/i,
];

const BLUEPRINT_NOTION_PATTERNS: Record<string, RegExp[]> = {
  formulaire: [
    /(formule|relation|theoreme|propriete|fonction|derivee|equation|vecteur|repere|integrale|suite|matrice|limite)/i,
  ],
  mecanisme: [
    /(processus|phase|etape|cycle|transformation|reaction|regulation|organe|cellule|energie|mouvement|eruption|seisme)/i,
  ],
  chronologie: [
    /(periode|date|memoire|acteur|guerre|revolution|regime|conflit|tournant|enjeu|contexte)/i,
  ],
  comparaison: [
    /(difference|opposition|comparaison|critere|modele|approche|avantage|limite|distinction)/i,
  ],
  algorithmique: [
    /(algorithme|etat|transition|structure|donnee|modele|simulation|procedure|fonction|complexite|automate|entree|sortie)/i,
  ],
  "cas-pratique": [
    /(cas|diagnostic|application|decision|condition|strategie|resolution|probleme)/i,
  ],
  taxonomie: [
    /(categorie|famille|classification|type|classe|niveau|ordre|groupe|espece)/i,
  ],
  concepts: [
    /(concept|principe|theorie|modele|structure|fonction|acteur|memoire|mecanisme)/i,
  ],
};

const FORMAL_TOPIC_LIBRARY: Array<{ label: string; patterns: RegExp[] }> = [
  { label: "Derivation", patterns: [/\bderive/i, /\bf'/i, /\btangente\b/i] },
  { label: "Suites", patterns: [/\bsuites?\b/i, /\ba_n\b/i, /\bu_n\b/i, /\bv_n\b/i] },
  { label: "Exponentielle", patterns: [/\bexponent/i, /\be\^x\b/i, /\bexp\b/i] },
  { label: "Logarithme", patterns: [/\blog/i, /\bln\b/i] },
  { label: "Limites", patterns: [/\blimite/i, /\btend vers\b/i, /\binfini\b/i] },
  { label: "Variations", patterns: [/\bcroiss/i, /\bdecroiss/i, /\bvariation/i, /\bmonotone/i] },
  { label: "Convexite", patterns: [/\bconvex/i, /\bconcav/i, /\bf''/i] },
  { label: "Equations", patterns: [/\bequation/i, /\binequation/i, /\bsolution\b/i, /\bracine\b/i] },
  { label: "Fonctions", patterns: [/\bfonction/i, /\bcourbe\b/i, /\brepresentation\b/i] },
  { label: "Vecteurs", patterns: [/\bvecteur/i, /\bdet\(/i, /\bAB\b/i, /\brepere\b/i] },
  { label: "Matrices", patterns: [/\bmatrice/i, /\binverse\b/i, /\bdeterminant\b/i, /\bvaleur propre\b/i] },
  { label: "Probabilites", patterns: [/\bprobabil/i, /\besperance\b/i, /\bvariance\b/i, /\bloi\b/i] },
  { label: "Grandeurs", patterns: [/\bunite\b/i, /\bgrandeur\b/i, /\bconstante\b/i, /\benergie\b/i, /\bvitesse\b/i] },
  { label: "Conditions", patterns: [/\bcondition/i, /\bhypothese/i, /\bdomaine\b/i, /\bsi\b/i] },
];

function toDisplayHeading(value: string) {
  const cleaned = normalizeText(value);
  return cleaned ? `${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}` : "";
}

function extractFormalTopics(
  content: string,
  keywords: string[],
  formules: string[],
  proprietes: string[],
) {
  const source = [content, keywords.join(" "), formules.join(" "), proprietes.join(" ")].join("\n");
  const scored = FORMAL_TOPIC_LIBRARY
    .map((entry) => ({
      label: entry.label,
      score: entry.patterns.reduce((total, pattern) => total + (pattern.test(source) ? 1 : 0), 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score);

  const keywordFallback = dedupeStrings(
    keywords
      .map((keyword) => normalizeText(keyword))
      .filter((keyword) => keyword.length >= 4 && !GENERIC_CONCEPT_STOPWORDS.has(keyword.toLowerCase())),
  ).map((keyword) => toDisplayHeading(keyword));

  return dedupeStrings([
    ...scored.map((entry) => entry.label),
    ...keywordFallback,
  ]).slice(0, 6);
}

function findFormalTopicLabel(value: string) {
  const normalized = normalizeText(value);
  const match = FORMAL_TOPIC_LIBRARY.find((entry) =>
    entry.patterns.some((pattern) => pattern.test(normalized)),
  );

  if (match) {
    return match.label;
  }

  if (/\bcondition|hypothese|domaine|si\b/i.test(normalized)) {
    return "Conditions";
  }

  if (/\bcalcul|appliquer|substituer|remplacer|simplifier\b/i.test(normalized)) {
    return "Calcul";
  }

  if (/\bconclusion|deduire|equivaut|implique|donc\b/i.test(normalized)) {
    return "Conclusion";
  }

  return "";
}

function buildFormalTableTitle(item: string, topics: string[], index: number) {
  return (
    findFormalTopicLabel(item)
    || topics[index]
    || topics[topics.length - 1]
    || `Regle cle ${index + 1}`
  );
}

function buildFormalMethodTitle(item: string, index: number) {
  const normalized = normalizeText(item);

  if (/\bidentifier|reconnaitre|repere|forme|famille|type\b/i.test(normalized)) {
    return "Identifier le bon cadre";
  }
  if (/\bcondition|hypothese|domaine|si\b/i.test(normalized)) {
    return "Verifier les conditions";
  }
  if (/\bcalcul|derive|appliquer|utiliser|remplacer|substituer\b/i.test(normalized)) {
    return "Choisir puis appliquer la relation";
  }
  if (/\bsigne|variation|croiss|decroiss|extrem|convex\b/i.test(normalized)) {
    return "Lire le comportement";
  }
  if (/\bsimplif|ordonner|factor/i.test(normalized)) {
    return "Simplifier proprement";
  }
  if (/\bdonc|conclu|equivaut|implique|deduire/i.test(normalized)) {
    return "Conclure";
  }

  return [
    "Identifier le bon cadre",
    "Choisir la relation utile",
    "Verifier les conditions",
    "Appliquer sans erreur",
    "Conclure",
  ][index] ?? `Etape ${index + 1}`;
}

function buildFormalApplicationTitle(question: string, index: number) {
  const normalized = normalizeText(question);

  if (/\bpiege|erreur|confond/i.test(normalized)) {
    return "Piege d'exercice";
  }
  if (/\bcondition|quand|si\b/i.test(normalized)) {
    return "Condition a verifier";
  }
  if (/\bsigne|variation|croiss|decroiss|extrem\b/i.test(normalized)) {
    return "Lecture graphique";
  }
  if (/\bcomment|calcul|appliquer|utiliser|mobiliser\b/i.test(normalized)) {
    return "Reflexe d'application";
  }
  if (/\bquelle relation|quelle formule|quel resultat\b/i.test(normalized)) {
    return "Reflexe formule";
  }

  return index === 0 ? "Reflexe cle" : `Reflexe ${index + 1}`;
}

function buildFormalMentalImage(
  keywords: string[],
  formules: string[],
  proprietes: string[],
  sentences: string[],
) {
  const topics = extractFormalTopics("", keywords, formules, proprietes);
  const topicList = topics.slice(0, 4).join(", ").toLowerCase() || "regles, conditions et resultats";
  const opening = topics[0] ? `Boite a outils de ${topics[0].toLowerCase()}` : "Boite a outils du chapitre";
  const contextualSentence = fitEducationalContent(sentences[0] ?? sentences[1] ?? "", 120);

  return {
    titre: opening,
    texte: `Imagine une trousse ouverte avec un compartiment par reflexe utile : ${topicList}. A chaque exercice, tu ouvres d'abord le bon compartiment, puis tu choisis la relation, tu verifies la condition, et tu conclus sans te tromper.${contextualSentence ? ` ${contextualSentence}` : ""}`,
  };
}

function resolveBlueprintId(subject: string, content: string, blueprintId?: string) {
  if (blueprintId) {
    return blueprintId;
  }

  switch (inferPedagogicalFamily(subject, content)) {
    case "formel":
      return "formulaire";
    case "processus":
      return "mecanisme";
    case "chronologique":
      return "chronologie";
    case "algorithmique":
      return "algorithmique";
    case "comparatif":
      return "comparaison";
    case "cas-pratique":
      return "cas-pratique";
    case "taxonomique":
      return "taxonomie";
    case "conceptuel":
    default:
      return "concepts";
  }
}

function countSourceMentions(term: string, content: string) {
  const normalizedTerm = normalizeText(term).toLowerCase();
  const normalizedSource = normalizeText(content).toLowerCase();

  if (!normalizedTerm || !normalizedSource) {
    return 0;
  }

  return normalizedSource.split(normalizedTerm).length - 1;
}

function buildHeadingCandidates(content: string) {
  return content
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter(
      (line) =>
        line.length >= 4
        && line.length <= 56
        && line.split(/\s+/).length <= 5
        && !/[=]/.test(line)
        && !/^\d+[\).:-]/.test(line),
    );
}

function buildSectionLeadCandidates(content: string) {
  return content
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .flatMap((line) => {
      const [head] = line.split(/[:;]/);
      return head ? [head] : [];
    })
    .filter((item) => item.length >= 4 && item.length <= 42);
}

function scoreNotionCandidate(item: string, subject: string, content: string, blueprintId?: string) {
  const normalized = normalizeText(item);
  const lower = normalized.toLowerCase();
  const words = lower
    .split(/\s+/)
    .filter((word) => word.length > 2 && !GENERIC_CONCEPT_STOPWORDS.has(word));
  const resolvedBlueprint = resolveBlueprintId(subject, content, blueprintId);
  const patterns = BLUEPRINT_NOTION_PATTERNS[resolvedBlueprint] ?? [];
  const mentions = countSourceMentions(normalized, content);

  if (!normalized || normalized.length < 4 || words.length === 0) {
    return -100;
  }

  if (GENERIC_WEAK_NOTION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return -100;
  }

  if (GENERIC_CONCEPT_STOPWORDS.has(lower) || /^[0-9]+$/.test(lower)) {
    return -100;
  }

  let score = 0;

  if (appearsInSource(normalized, content)) {
    score += 3;
  }

  if (mentions >= 2) {
    score += 2;
  }

  if (words.length >= 2 && words.length <= 4) {
    score += 2;
  }

  if (patterns.some((pattern) => pattern.test(normalized))) {
    score += 4;
  }

  if (/mathematiques/i.test(subject) && /(fonction|derivee|limite|suite|equation|theoreme|vecteur|matrice|probabilit)/i.test(normalized)) {
    score += 2;
  }

  if (/svt|biologie|physique|chimie/i.test(subject) && /(organe|cellule|molecule|energie|mecanisme|cycle|reaction|eruption|seisme|tectonique)/i.test(normalized)) {
    score += 2;
  }

  if (/informatique/i.test(subject) && /(algorithme|automate|graphe|pile|file|structure|etat|transition|simulation|modele|complexite)/i.test(normalized)) {
    score += 2;
  }

  if (/histoire|geopolitique|ses|droit/i.test(subject) && /(acteur|memoire|regime|conflit|date|periode|principe|exception|institution)/i.test(normalized)) {
    score += 2;
  }

  return score;
}

function selectBestNotions(candidates: string[], subject: string, content: string, blueprintId?: string) {
  return dedupeStrings(candidates)
    .map((candidate) => ({
      notion: candidate,
      score: scoreNotionCandidate(candidate, subject, content, blueprintId),
      mentions: countSourceMentions(candidate, content),
    }))
    .filter((item) => item.score >= 4)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }
      if (right.mentions !== left.mentions) {
        return right.mentions - left.mentions;
      }
      return left.notion.length - right.notion.length;
    })
    .map((item) => item.notion)
    .slice(0, 8);
}

function appearsInSource(term: string, content: string) {
  const normalizedTerm = normalizeText(term).toLowerCase();
  const normalizedSource = normalizeText(content).toLowerCase();

  if (!normalizedTerm) {
    return false;
  }

  if (normalizedSource.includes(normalizedTerm)) {
    return true;
  }

  const meaningfulWords = normalizedTerm
    .split(/\s+/)
    .filter((word) => word.length > 3 && !GENERIC_CONCEPT_STOPWORDS.has(word));

  return meaningfulWords.length > 0 && meaningfulWords.every((word) => normalizedSource.includes(word));
}

function inferPedagogicalFamily(subject: string, content: string) {
  const lower = `${subject} ${content}`.toLowerCase();

  if (/(informatiqu|algorithm|pseudo-?code|automate|etat|transition|complexit|recurs)/.test(lower)) {
    return "algorithmique";
  }
  if (/(histoire|memoire|guerre|chronolog|periode|regime|revolution|acteur|conflit)/.test(lower)) {
    return "chronologique";
  }
  if (/(svt|biolog|photosynth|respiration|mitose|meiose|cycle|enzyme|organite|regulation)/.test(lower)) {
    return "processus";
  }
  if (/(math|physique|derivee|vecteur|theoreme|repere|equation|calcul|determinant)/.test(lower)) {
    return "formel";
  }
  if (/(cas pratique|diagnostic|decision|strategie|application directe|consultation)/.test(lower)) {
    return "cas-pratique";
  }
  if (/(classification|typologie|famille|categorie|classement|espece|sous-categorie)/.test(lower)) {
    return "taxonomique";
  }
  if (/(langue|compar|classification|registre|temps verbaux|typologie)/.test(lower)) {
    return "comparatif";
  }

  return "conceptuel";
}

function isRelevantKeyNotion(item: string, subject: string, content: string, blueprintId?: string) {
  return scoreNotionCandidate(item, subject, content, blueprintId) >= 4;
}

function inferSubject(content: string) {
  const lower = content.toLowerCase();

  if (/(vecteur|equation|fonction|derivee|geometr|algeb|theoreme|triangle|repere|integrale|suite|matrice|probabilit)/.test(lower)) {
    return "Mathematiques";
  }
  if (/(photosynthese|cellule|adn|ecosysteme|svt|chromosome|organe|respiration|chloroplaste|mitochondrie|mitose|meiose|enzyme)/.test(lower)) {
    return "SVT";
  }
  if (/(algorithme|automate|complexite|graphe|reseau|base de donnees|pseudocode|machine de turing|pile|file)/.test(lower)) {
    return "Informatique";
  }
  if (/(revolution|empire|guerre|roi|histoire|republique|1789|1914|1945)/.test(lower)) {
    return "Histoire";
  }
  if (/(chimie|acide|base|bronsted|brønsted|ph\b|pka|poh|h3o\+|ho-|oh-|acido-basique)/.test(lower)) {
    return "Physique-Chimie";
  }
  if (/(physique|force|energie|vitesse|mouvement|electricite|atome|molecule)/.test(lower)) {
    return "Physique-Chimie";
  }
  if (/(phrase|poesie|roman|figure de style|grammaire|conjugaison|texte)/.test(lower)) {
    return "Francais";
  }
  if (/(offre|demande|marche|croissance|inflation|economie|entreprise)/.test(lower)) {
    return "SES";
  }

  return "Cours";
}

function inferLevel(content: string) {
  const lower = content.toLowerCase();
  if (/(6eme|6e|5eme|5e|4eme|4e|3eme|3e|college)/.test(lower)) return "College";
  if (/(seconde|2nde)/.test(lower)) return "Seconde";
  if (/(premiere|1ere|1re)/.test(lower)) return "Premiere";
  if (/(terminale|bac)/.test(lower)) return "Terminale";
  if (/(master 2|m2)/.test(lower)) return "Master 2";
  if (/(master 1|m1)/.test(lower)) return "Master 1";
  if (/(licence 3|l3)/.test(lower)) return "Licence 3";
  if (/(licence 2|l2)/.test(lower)) return "Licence 2";
  if (/(licence 1|l1|universite)/.test(lower)) return "Licence 1";
  if (/(bts|dut|but)/.test(lower)) return "Post-bac";
  return "General";
}

function buildStrongMetrics(
  content: string,
  keywords: string[],
  sentences: string[],
  subject: string,
): FicheMetrique[] {
  const numbers = extractNumbers(content);
  const metrics: FicheMetrique[] = [];
  const family = inferPedagogicalFamily(subject, content);

  if (/mathematiques/i.test(subject)) {
    const formulas = extractMathFormulaLines(content);
    const properties = extractMathPropertyLines(content);
    const sections = content.match(/(?:^|\n)\s*(?:partie|chapitre|section)\s+\d+/gi) ?? [];

    return [
      { valeur: String(Math.max(sections.length, 1)), label: "parties du cours" },
      { valeur: String(Math.max(formulas.length, 1)), label: "formules et relations" },
      { valeur: String(Math.max(properties.length, 1)), label: "proprietes et criteres" },
    ];
  }

  if (family === "processus") {
    const steps = content.match(/(?:^|\n)\s*(?:etape|phase|stade)\s+\d+/gim) ?? [];
    const structures = dedupeStrings(extractKeywords(content)).filter((item) => appearsInSource(item, content));

    return [
      { valeur: String(Math.max(steps.length, 1)), label: "etapes du processus" },
      { valeur: String(Math.max(structures.length, 3)), label: "structures ou acteurs" },
      { valeur: String(Math.max(sentences.length, 3)), label: "idees a retenir" },
    ];
  }

  if (family === "algorithmique") {
    const pseudoLines = content.match(/(?:if|while|for|return|fonction|procedure|etat|transition)/gi) ?? [];

    return [
      { valeur: String(Math.max(keywords.length, 3)), label: "concepts du chapitre" },
      { valeur: String(Math.max(pseudoLines.length, 2)), label: "etapes ou operations" },
      { valeur: String(Math.max(sentences.length, 3)), label: "cas et remarques" },
    ];
  }

  if (numbers[0]) {
    metrics.push({ valeur: numbers[0], label: "donnee cle" });
  }

  if (numbers[1]) {
    metrics.push({ valeur: numbers[1], label: "repere utile" });
  }

  if (keywords.length > 0) {
    metrics.push({ valeur: String(keywords.length), label: "notions majeures" });
  }

  while (metrics.length < 3) {
    const index = metrics.length;
    metrics.push({
      valeur: String(index === 0 ? sentences.length || 3 : index === 1 ? keywords.length || 4 : 4),
      label: index === 0 ? "etapes" : index === 1 ? "idees cles" : "flashcards",
    });
  }

  return metrics.slice(0, 3);
}

function buildNotionsCles(content: string, keywords: string[], blueprintId?: string) {
  const subject = inferSubject(content);
  const lines = content
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 4 && line.length <= 70);
  const notionMatches = content.match(/\b(?:vecteur(?:s)?|translation|relation de chasles|colinearite|colineaires|coordonnees|distance|milieu|determinant|parallelogramme|vecteur nul|vecteurs opposes)\b/gi) ?? [];
  const candidates = [
    ...notionMatches,
    ...keywords,
    ...extractKeywords(content),
    ...buildHeadingCandidates(content),
    ...buildSectionLeadCandidates(content),
    ...lines.filter((line) => line.split(/\s+/).length <= 4),
  ];

  return selectBestNotions(candidates, subject, content, blueprintId);
}

function buildFormulesCles(content: string, blueprintId?: string, subject?: string) {
  const vectorCourse = isVectorCourse(content);
  const chemistryCourse = isChemistryCourse(content, subject);
  const sourceFormulas = chemistryCourse
    ? extractChemistryFormulaLines(content)
    : extractMathFormulaLines(content);
  const normalizedFormulas = sourceFormulas
    .map((line) => chemistryCourse ? canonicalizeChemistryFormula(line) : canonicalizeFormalFormula(line))
    .filter((line) => !isIncompleteFormula(line, chemistryCourse));

  return dedupeStrings(
    normalizedFormulas
      .filter((line) => !isSuspiciousFormula(line) && isHighQualityFormula(line, vectorCourse)),
  ).slice(0, blueprintId === "formulaire" ? 12 : 8);
}

function buildProprietesCles(content: string, sentences: string[], blueprintId?: string) {
  return dedupeStrings([
    ...extractMathPropertyLines(content),
    ...sentences.filter((sentence) =>
      blueprintId === "formulaire"
        ? /(si|alors|equivaut|equivalent|colineair|milieu|parallelogramme|opposes|nul|distance|chasles|derive|croiss|decroiss|quotient|produit|somme|convex|limite|suite|exponentielle|logarithme)/i.test(sentence)
        : /(si|alors|equivaut|equivalent|colineair|milieu|parallelogramme|opposes|nul|distance|chasles)/i.test(sentence),
    ),
  ])
    .filter((item) => !isSuspiciousProperty(item))
    .slice(0, blueprintId === "formulaire" ? 10 : 8);
}

function buildSchemaElements(keywords: string[], sentences: string[], blueprintId = "concepts"): FicheSchemaElement[] {
  const blueprintDefaults: Record<string, string[]> = {
    formulaire: ["Notion", "Condition", "Regle", "Application", "Verification", "Resultat"],
    mecanisme: ["Declencheur", "Phase 1", "Phase 2", "Transformation", "Effet", "Resultat"],
    chronologie: ["Contexte", "Repere 1", "Bascule", "Acteur", "Consequence", "Memoire"],
    comparaison: ["Reference A", "Critere", "Reference B", "Difference", "Point commun", "Synthese"],
    algorithmique: ["Entree", "Etat initial", "Condition", "Transition", "Sortie", "Cas limite"],
    "cas-pratique": ["Situation", "Condition", "Decision", "Application", "Exception", "Resultat"],
    taxonomie: ["Categorie", "Sous-categorie", "Type", "Critere", "Exemple", "Organisation"],
    concepts: ["Concept central", "Definition", "Lien", "Mecanisme", "Application", "Resultat"],
  };
  const defaults = blueprintDefaults[blueprintId] ?? blueprintDefaults.concepts;
  const candidates = [
    keywords[0] ?? defaults[0],
    keywords[1] ?? defaults[1],
    keywords[2] ?? defaults[2],
    keywords[3] ?? defaults[3],
    keywords[4] ?? defaults[4],
    keywords[5] ?? defaults[5],
    sentences[0]?.slice(0, 28) ?? "",
    sentences[1]?.slice(0, 28) ?? "",
  ]
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);

  const uniqueLabels = [...new Set(candidates)].slice(0, 6);
  const colors: FicheSchemaElement["couleur"][] = ["bleu", "teal", "violet", "coral", "gris", "teal"];

  return uniqueLabels.map((label, index) => ({
    id: `node_${index + 1}`,
    label: truncate(label, 34),
    couleur: colors[index] ?? "gris",
  }));
}

function buildSchemaConnexions(elements: FicheSchemaElement[], blueprintId = "concepts"): FicheSchemaConnexion[] {
  const connexions: FicheSchemaConnexion[] = [];
  const connectorByBlueprint: Record<string, string[]> = {
    formulaire: ["s'applique a", "implique", "permet"],
    mecanisme: ["declenche", "transforme", "entraine"],
    chronologie: ["precede", "puis", "mene a"],
    comparaison: ["se compare a", "s'oppose a", "se distingue de"],
    algorithmique: ["entree", "condition", "transition"],
    "cas-pratique": ["si", "alors", "conduit a"],
    taxonomie: ["classe dans", "organise", "regroupe"],
    concepts: ["definit", "structure", "mene a"],
  };
  const labels = connectorByBlueprint[blueprintId] ?? connectorByBlueprint.concepts;

  for (let index = 0; index < elements.length - 1; index += 1) {
    connexions.push({
      de: elements[index].id,
      vers: elements[index + 1].id,
      label: labels[Math.min(index, labels.length - 1)],
    });
  }

  if (elements.length >= 4) {
    connexions.push({
      de: elements[0].id,
      vers: elements[Math.min(3, elements.length - 1)].id,
      label: blueprintId === "comparaison" ? "compare" : "structure",
    });
  }

  return connexions.slice(0, 8);
}

function buildFallbackSchema(content: string, keywords: string[], sentences: string[], blueprintId?: string): FicheSchema {
  const subject = inferSubject(content);
  const resolvedBlueprint = resolveBlueprintId(subject, content, blueprintId);
  const elements = buildSchemaElements(keywords, sentences, resolvedBlueprint);
  const descriptions: Record<string, string> = {
    formulaire:
      "Ce schema montre les notions centrales, les conditions d'application, les regles et le resultat utile pour resoudre rapidement.",
    mecanisme:
      "Ce schema montre l'ordre des etapes, les acteurs et les relations de cause a effet pour memoriser le fonctionnement complet.",
    chronologie:
      "Ce schema met en avant les reperes, les bascules et les enchainements temporels qui structurent le chapitre.",
    comparaison:
      "Ce schema met cote a cote les notions a comparer, leurs criteres et leurs differences importantes.",
    algorithmique:
      "Ce schema montre la logique du systeme, les etats, les transitions et les conditions utiles pour raisonner correctement.",
    "cas-pratique":
      "Ce schema aide a suivre la decision a prendre, les conditions, les exceptions et le resultat attendu.",
    taxonomie:
      "Ce schema organise le cours en categories, sous-categories et criteres de classement pour retenir la structure.",
    concepts:
      "Ce schema montre le concept central, ses liens essentiels et le parcours logique a retenir pour reconstruire le cours.",
  };

  return {
    type:
      resolvedBlueprint === "comparaison"
        ? "comparaison"
        : resolvedBlueprint === "formulaire"
          ? "formule"
          : resolvedBlueprint === "algorithmique" || resolvedBlueprint === "concepts"
            ? "relations"
            : "processus",
    description: descriptions[resolvedBlueprint] ?? descriptions.concepts,
    elements,
    connexions: buildSchemaConnexions(elements, resolvedBlueprint),
  };
}

function buildFallbackFlashcards(
  sentences: string[],
  keywords: string[],
  blueprintId = "concepts",
  formules: string[] = [],
  proprietes: string[] = [],
): FicheFlashcard[] {
  const firstKeyword = keywords[0] ?? "la notion centrale";
  const secondKeyword = keywords[1] ?? "le chapitre";
  const firstFormula = formules[0];
  const firstProperty = proprietes[0];

  switch (blueprintId) {
    case "formulaire":
      return [
        {
          question: `Quelle relation faut-il memoriser en priorite${firstFormula ? " ?" : ` pour ${firstKeyword} ?`}`,
          reponse: fitEducationalContent(firstFormula ?? firstProperty ?? sentences[0] ?? "Il faut memoriser la relation centrale et ses conditions d'application.", 180),
        },
        {
          question: `Dans quel cas applique-t-on ${firstKeyword} ?`,
          reponse: fitEducationalContent(firstProperty ?? sentences[1] ?? "On l'applique seulement quand les conditions de validite du cours sont verifiees.", 180),
        },
        {
          question: "Quelle erreur de methode faut-il eviter ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il faut eviter de choisir la bonne formule sans verifier les hypotheses ni le sens du calcul.", 180),
        },
        {
          question: "Comment reconnaitre la bonne regle dans un exercice ?",
          reponse: fitEducationalContent(sentences[3] ?? "On regarde la structure de l'expression, les conditions et l'objectif du raisonnement.", 180),
        },
      ];
    case "mecanisme":
      return [
        {
          question: `Quelle est la premiere etape du mecanisme de ${firstKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut d'abord identifier le declencheur et le premier acteur du mecanisme.", 180),
        },
        {
          question: `Quel acteur ou quelle structure joue un role central dans ${secondKeyword} ?`,
          reponse: fitEducationalContent(sentences[1] ?? "Il faut repérer l'acteur principal puis son effet sur l'etape suivante.", 180),
        },
        {
          question: "Quelle consequence faut-il absolument relier a la cause initiale ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il faut relier la cause, les transformations intermediaires et l'effet final sans sauter d'etape.", 180),
        },
        {
          question: "Quelle confusion classique fait rater l'ordre du mecanisme ?",
          reponse: fitEducationalContent(sentences[3] ?? "On confond souvent deux etapes voisines ou on inverse la cause et l'effet.", 180),
        },
      ];
    case "chronologie":
      return [
        {
          question: `Quel repere ouvre le chapitre sur ${firstKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut commencer par le contexte initial et le premier repere chronologique important.", 180),
        },
        {
          question: "Quel acteur ou quel tournant change vraiment la suite ?",
          reponse: fitEducationalContent(sentences[1] ?? "Il faut identifier l'acteur, l'evenement ou la decision qui fait basculer la periode.", 180),
        },
        {
          question: "Quel enjeu ou quel debat faut-il retenir ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il faut retenir ce que cette periode change et pourquoi elle reste discutee.", 180),
        },
        {
          question: "Quel amalgame chronologique faut-il eviter ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il ne faut pas melanger les temps, les acteurs ni confondre evenement et interpretation.", 180),
        },
      ];
    case "algorithmique":
      return [
        {
          question: `Quelle est la logique d'entree ou de depart du systeme ${firstKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut identifier l'etat initial, les donnees d'entree et la premiere transition.", 180),
        },
        {
          question: "Quel etat, quelle transition ou quelle condition change vraiment le comportement ?",
          reponse: fitEducationalContent(sentences[1] ?? "Une condition peut faire basculer le systeme vers une autre transition ou un autre resultat.", 180),
        },
        {
          question: "Quel cas limite faut-il tester pour verifier le modele ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il faut verifier les entrees extremes, les exceptions et les cas de blocage du systeme.", 180),
        },
        {
          question: "Quelle erreur logique faut-il eviter dans l'execution ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il faut eviter de confondre etat, transition, condition et resultat final.", 180),
        },
      ];
    case "comparaison":
      return [
        {
          question: `Quelle distinction principale faut-il faire entre ${firstKeyword} et ${secondKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut comparer les criteres centraux au lieu de juxtaposer des definitions separees.", 180),
        },
        {
          question: "Quel critere permet de ne pas confondre les deux notions ?",
          reponse: fitEducationalContent(sentences[1] ?? "Le bon critere est celui qui change la nature ou le role des deux notions comparees.", 180),
        },
        {
          question: "Quel point commun peut tromper si on le prend pour une equivalence ?",
          reponse: fitEducationalContent(sentences[2] ?? "Deux notions peuvent se ressembler tout en ayant des fonctions ou des conditions tres differentes.", 180),
        },
        {
          question: "Quel contre-exemple ou quelle confusion faut-il garder en tete ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il faut memoriser le cas ou la distinction devient visible immédiatement.", 180),
        },
      ];
    case "cas-pratique":
      return [
        {
          question: "Quel est le premier reflexe pour traiter un cas concret ?",
          reponse: fitEducationalContent(sentences[0] ?? "Il faut identifier la situation, la regle applicable et les conditions a verifier.", 180),
        },
        {
          question: "Quel element fait changer la decision ou la solution ?",
          reponse: fitEducationalContent(sentences[1] ?? "Une condition ou une exception peut modifier completement l'application de la regle.", 180),
        },
        {
          question: "Quel cas limite ou quelle exception faut-il absolument connaitre ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il faut memoriser l'exception qui renverse le raisonnement attendu.", 180),
        },
        {
          question: "Quelle erreur de diagnostic faut-il eviter ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il ne faut pas appliquer la regle sans qualifier correctement les faits du cas.", 180),
        },
      ];
    case "taxonomie":
      return [
        {
          question: `Quelle categorie contient en premier ${firstKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut d'abord replacer chaque element dans sa bonne famille ou sous-famille.", 180),
        },
        {
          question: "Quel critere permet de distinguer deux categories proches ?",
          reponse: fitEducationalContent(sentences[1] ?? "Le bon critere est celui qui sert a classer les elements sans ambiguite.", 180),
        },
        {
          question: "Quel exemple typique faut-il associer a cette categorie ?",
          reponse: fitEducationalContent(sentences[2] ?? "Un bon exemple ancre la categorie et evite les erreurs de classement.", 180),
        },
        {
          question: "Quelle confusion de classement faut-il eviter ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il ne faut pas confondre une categorie generale avec une sous-categorie particuliere.", 180),
        },
      ];
    case "concepts":
    default:
      return [
        {
          question: `Quelle notion faut-il definir en premier : ${firstKeyword} ?`,
          reponse: fitEducationalContent(sentences[0] ?? "Il faut commencer par la notion centrale du cours.", 180),
        },
        {
          question: `Comment relier ${firstKeyword} a ${secondKeyword} ?`,
          reponse: fitEducationalContent(sentences[1] ?? sentences[0] ?? "Il faut comprendre la logique interne du concept.", 180),
        },
        {
          question: "Quelle confusion classique faut-il eviter ?",
          reponse: fitEducationalContent(sentences[2] ?? "Il ne faut pas confondre deux notions proches ni inverser leur role.", 180),
        },
        {
          question: "Comment reconnaitre cette idee dans un exercice ou une question ?",
          reponse: fitEducationalContent(sentences[3] ?? "Il faut identifier les indices, les relations et le vocabulaire cle du cours.", 180),
        },
      ];
  }
}

function accentByIndex(index: number): FicheTableRow["accent"] {
  return ["bleu", "jaune", "rose", "violet", "menthe"][index % 5] as FicheTableRow["accent"];
}

function buildTableRows(items: string[], prefix: string): FicheTableRow[] {
  return items
    .filter(Boolean)
    .slice(0, 6)
    .map((item, index) => ({
      titre: `${prefix} ${index + 1}`,
      contenu: fitEducationalContent(item, 140),
      accent: accentByIndex(index),
    }));
}

function buildStepRows(items: string[], prefix = "Etape"): FicheStep[] {
  return items
    .filter(Boolean)
    .slice(0, 5)
    .map((item, index) => ({
      titre: `${prefix} ${index + 1}`,
      contenu: fitEducationalContent(item, 160),
    }));
}

function buildComparisonRows(items: string[]): FicheComparisonPoint[] {
  const rows: FicheComparisonPoint[] = [];
  for (let index = 0; index < items.length - 1 && rows.length < 4; index += 2) {
    rows.push({
      axe: `Difference ${rows.length + 1}`,
      gauche: fitEducationalContent(items[index], 90),
      droite: fitEducationalContent(items[index + 1], 90),
    });
  }
  return rows;
}

function buildPseudoCodeRows(items: string[]): FichePseudoCodeStep[] {
  return items
    .filter(Boolean)
    .slice(0, 6)
    .map((item, index) => ({
      ligne: `${index + 1}. ${fitEducationalContent(item, 120)}`,
      explication: index < 4 ? "Comprendre le role logique de cette etape avant de passer a la suivante." : undefined,
    }));
}

function buildRepereRows(items: string[]): FicheRepere[] {
  return items
    .filter(Boolean)
    .slice(0, 5)
    .map((item, index) => ({
      titre: `Repere ${index + 1}`,
      detail: fitEducationalContent(item, 130),
    }));
}

function buildClassificationRows(items: string[]): FicheClassificationNode[] {
  return items
    .filter(Boolean)
    .slice(0, 4)
    .map((item, index) => ({
      categorie: `Categorie ${index + 1}`,
      elements: item
        .split(/,|;|:/)
        .map((part) => normalizeText(part))
        .filter((part) => part.length > 2)
        .slice(0, 4),
    }))
    .filter((item) => item.elements.length > 0);
}

function buildBlueprintSections(
  fiche: FicheGeneree,
  content: string,
  sentences: string[],
  keywords: string[],
): FicheBlueprintSections {
  const blueprint = fiche.blueprintId ?? "concepts";
  const chemistryCourse = isChemistryCourse(content, fiche.matiere);
  const lines = content
    .split(/\n+/)
    .map((line) => normalizeText(line))
    .filter((line) => line.length >= 12 && line.length <= 180);
  const formulaPool = dedupeStrings([
    ...(fiche.formulesCles ?? []),
    ...(chemistryCourse ? extractChemistryFormulaLines(content) : extractMathFormulaLines(content)),
  ]).filter((line) => !isIncompleteFormula(line, chemistryCourse));
  const propertyPool = dedupeStrings([...(fiche.proprietesCles ?? []), ...extractMathPropertyLines(content), ...sentences]);
  const notionPool = dedupeStrings([...(fiche.notionsCles ?? []), ...keywords, ...extractKeywords(content)]);
  const chronologyPool = dedupeStrings([
    ...(content.match(/\b(?:\d{4}|XIXe|XXe|XXIe|avant|apres|pendant)\b[^\n.]*/gi) ?? []),
    ...sentences.filter((sentence) => /\b(?:date|memoire|guerre|periode|debat|acteur)\b/i.test(sentence)),
  ]);
  const pseudoPool = dedupeStrings(lines.filter((line) => /\b(?:if|else|while|for|return|transition|etat|entree|sortie|fonction|procedure)\b/i.test(line)));
  const processPool = dedupeStrings(
    sentences.filter((sentence) => /\b(?:etape|phase|stade|cause|effet|declenche|provoque|entraine|resultat)\b/i.test(sentence)),
  );
  const classificationPool = dedupeStrings(
    sentences.filter((sentence) => /\b(?:type|categorie|famille|classe|niveau|groupe|classification)\b/i.test(sentence)),
  );
  const contrastPool = dedupeStrings(
    sentences.filter((sentence) => /\b(?:tandis que|alors que|contraire|difference|compar|oppose|versus)\b/i.test(sentence)),
  );

  switch (blueprint) {
    case "formulaire":
      return {
        tableauSynthese: buildTableRows(formulaPool.length ? formulaPool : propertyPool, "Regle"),
        etapesCles: buildStepRows(
          propertyPool.filter((item) => /\b(?:si|alors|appliquer|calcul|deriver|resoudre|verifier)\b/i.test(item)).slice(0, 5),
          "Methode",
        ),
        applications: buildTableRows(
          (fiche.flashcards ?? []).map((item) => `${item.question} : ${item.reponse}`),
          "Application",
        ),
      };
    case "mecanisme":
      return {
        etapesCles: buildStepRows(processPool.length ? processPool : sentences, "Phase"),
        applications: buildTableRows(propertyPool.slice(0, 4), "Effet"),
      };
    case "chronologie":
      return {
        reperes: buildRepereRows(chronologyPool.length ? chronologyPool : sentences),
        applications: buildTableRows(propertyPool.slice(0, 4), "Enjeu"),
      };
    case "comparaison":
      return {
        distinctions: buildComparisonRows(contrastPool.length ? contrastPool : notionPool),
        tableauSynthese: buildTableRows(propertyPool.slice(0, 4), "Critere"),
      };
    case "algorithmique":
      return {
        pseudoCode: buildPseudoCodeRows(pseudoPool.length ? pseudoPool : sentences),
        casLimites: dedupeStrings(
          sentences.filter((sentence) => /\b(?:si|cas|limite|erreur|exception|sinon|bord)\b/i.test(sentence)),
        ).slice(0, 5),
        applications: buildTableRows(propertyPool.slice(0, 4), "Comportement"),
      };
    case "cas-pratique":
      return {
        applications: buildTableRows(
          dedupeStrings(
            sentences.filter((sentence) => /\b(?:cas|situation|condition|decision|application|diagnostic)\b/i.test(sentence)),
          ).slice(0, 6),
          "Cas",
        ),
        casLimites: propertyPool.filter((item) => /\b(?:exception|limite|sauf|condition)\b/i.test(item)).slice(0, 5),
      };
    case "taxonomie":
      return {
        classifications: buildClassificationRows(classificationPool.length ? classificationPool : notionPool),
        tableauSynthese: buildTableRows(notionPool.slice(0, 5), "Famille"),
      };
    case "concepts":
    default:
      return {
        tableauSynthese: buildTableRows(propertyPool.slice(0, 4), "Point"),
        distinctions: buildComparisonRows(contrastPool),
      };
  }
}

function mergeFlashcards(
  primary: FicheFlashcard[],
  secondary: FicheFlashcard[],
  tertiary: FicheFlashcard[],
) {
  const merged = [...primary, ...secondary, ...tertiary];
  const seenQuestions = new Set<string>();
  const result: FicheFlashcard[] = [];

  for (const card of merged) {
    const questionKey = flashcardConceptKey(card.question);
    if (!questionKey || seenQuestions.has(questionKey)) {
      continue;
    }
    seenQuestions.add(questionKey);
    result.push(card);
  }

  return result;
}

function normalizeMetrics(metrics: FicheMetrique[], fallback: FicheMetrique[], forceFallback: boolean) {
  if (forceFallback) {
    return fallback.slice(0, 3);
  }

  const normalized = metrics
    .filter((metric) => normalizeText(metric.valeur).length > 0 && normalizeText(metric.label).length > 0)
    .slice(0, 3)
    .map((metric) => ({
      valeur: truncate(normalizeText(metric.valeur), 24),
      label: truncate(normalizeText(metric.label), 32),
    }));

  while (normalized.length < 3) {
    normalized.push(fallback[normalized.length]);
  }

  return normalized;
}

function normalizeSchema(schema: FicheSchema, fallback: FicheSchema) {
  const elements = (schema.elements ?? [])
    .filter((element) => normalizeText(element.id).length > 0 && normalizeText(element.label).length > 0)
    .slice(0, 6)
    .map((element, index) => ({
      id: normalizeText(element.id) || `node_${index + 1}`,
      label: truncate(normalizeText(element.label), 34),
      couleur: element.couleur,
    }));

  fallback.elements.forEach((element) => {
    if (elements.length < 6 && !elements.some((item) => item.label === element.label)) {
      elements.push(element);
    }
  });

  const connexions = (schema.connexions ?? [])
    .filter((connexion) => normalizeText(connexion.de).length > 0 && normalizeText(connexion.vers).length > 0)
    .slice(0, 8)
    .map((connexion) => ({
      de: normalizeText(connexion.de),
      vers: normalizeText(connexion.vers),
      label: connexion.label ? truncate(normalizeText(connexion.label), 18) : undefined,
    }));

  while (connexions.length < 4 && elements.length > connexions.length + 1) {
    connexions.push({
      de: elements[connexions.length].id,
      vers: elements[connexions.length + 1].id,
      label: connexions.length === 0 ? "definit" : "mene a",
    });
  }

  return {
    ...fallback,
    ...schema,
    description: ensureSentence(schema.description ?? "", fallback.description, 50, 260),
    elements,
    connexions,
  };
}

function normalizeFlashcards(flashcards: FicheFlashcard[], fallback: FicheFlashcard[]) {
  const normalized = flashcards
    .filter(
      (flashcard) =>
        normalizeText(flashcard.question).length > 0 && normalizeText(flashcard.reponse).length > 0,
    )
    .slice(0, 8)
    .map((flashcard) => ({
      question: truncate(normalizeText(flashcard.question), 110),
      reponse: truncate(normalizeText(flashcard.reponse), 180),
    }));

  while (normalized.length < 4) {
    normalized.push(fallback[normalized.length]);
  }

  return normalized.slice(0, 8);
}

function buildFicheClassification(
  subject: string,
  level: string,
  blueprintId?: string,
): FicheClassification {
  return {
    matiere: normalizeText(subject) || "Cours",
    niveau: normalizeText(level) || "General",
    type: normalizeText(blueprintId ?? "concepts") || "concepts",
  };
}

function cleanGeneratedFicheContent(fiche: FicheGeneree): FicheGeneree {
  return {
    ...fiche,
    definition: cleanGeneratedContent(fiche.definition),
    piege: cleanGeneratedContent(fiche.piege),
    feynman: cleanGeneratedContent(fiche.feynman),
    notionsCles: (fiche.notionsCles ?? []).map((item) => cleanGeneratedContent(item)).filter(Boolean),
    proprietesCles: (fiche.proprietesCles ?? []).map((item) => cleanGeneratedContent(item)).filter(Boolean),
    flashcards: (fiche.flashcards ?? []).map((flashcard) => ({
      question: cleanGeneratedContent(flashcard.question),
      reponse: cleanGeneratedContent(flashcard.reponse),
    })).filter((flashcard) => flashcard.question && flashcard.reponse),
  };
}

function enrichFiche(input: GenerateSheetRequest, fiche: FicheGeneree): FicheGeneree {
  const sentences = splitSentences(input.content);
  const keywords = extractKeywords(input.content);
  const subject = inferSubject(input.content);
  const vectorCourse = isVectorCourse(input.content);
  const resolvedBlueprint = resolveBlueprintId(subject, input.content, fiche.blueprintId);
  const level = inferLevel(input.content);
  const safeImageMentale = fiche.imageMentale ?? { titre: "", texte: "" };
  const safeSchema = fiche.schema ?? { type: "processus", description: "", elements: [], connexions: [] };
  const safeMetrics = Array.isArray(fiche.metriques) ? fiche.metriques : [];
  const safeFlashcards = Array.isArray(fiche.flashcards) ? fiche.flashcards : [];
  const fallbackSchema = buildFallbackSchema(input.content, keywords, sentences, resolvedBlueprint);
  const fallbackMetrics = buildStrongMetrics(input.content, keywords, sentences, subject);
  const fallbackNotions = buildNotionsCles(input.content, keywords, resolvedBlueprint);
  const vectorFlashcards = buildVectorCanonicalFlashcards(input.content);
  const fallbackFormules = buildFormulesCles(input.content, resolvedBlueprint, subject);
  const fallbackProprietes = buildProprietesCles(input.content, sentences, resolvedBlueprint);
  const fallbackFlashcards = buildFallbackFlashcards(
    sentences,
    fallbackNotions,
    resolvedBlueprint,
    fallbackFormules,
    fallbackProprietes,
  );
  const vectorNotions = buildVectorCanonicalNotions(input.content);
  const vectorFormules = buildVectorCanonicalFormulas(input.content);
  const vectorProprietes = buildVectorCanonicalProperties(input.content);
  const fallbackDefinition = `Le concept central du cours est ${normalizeText(
    keywords[0] ?? "la notion principale",
  )}. ${truncate(sentences[0] ?? input.content, 220)}`;
  const fallbackExample = `Exemple concret : ${sentences[1] ?? sentences[0] ?? input.content}`;
  const fallbackTrap = `Piege classique : confondre ${normalizeText(
    keywords[0] ?? "la notion centrale",
  )} avec une idee voisine, ou oublier l'ordre logique du raisonnement.`;
  const fallbackImage = `Imagine ${keywords[0] ?? "le concept"} comme un repere visuel simple : ${truncate(
    sentences[1] ?? sentences[0] ?? input.content,
    160,
  )}`;
  const fallbackFeynman = `Explique-le comme a un enfant : ${keywords[0] ?? "ce concept"} fonctionne comme un systeme simple ou chaque etape prepare la suivante jusqu'au resultat final.`;

  const enriched: FicheGeneree = {
    ...fiche,
    blueprintId: resolvedBlueprint,
    titre: truncate(normalizeText(fiche.titre || input.titleHint || "Fiche de revision"), 60),
    matiere: normalizeText(fiche.matiere) || subject,
    niveau: normalizeText(fiche.niveau) || level,
    classification: buildFicheClassification(
      fiche.classification?.matiere || fiche.matiere || subject,
      fiche.classification?.niveau || fiche.niveau || level,
      fiche.classification?.type || resolvedBlueprint,
    ),
    metriques: normalizeMetrics(
      safeMetrics,
      fallbackMetrics,
      /mathematiques/i.test(subject) || vectorCourse,
    ),
    notionsCles: selectBestNotions(
      (fiche.notionsCles ?? []).concat(fallbackNotions, vectorCourse ? vectorNotions : []),
      subject,
      input.content,
      resolvedBlueprint,
    ),
    formulesCles: dedupeStrings(
      (vectorCourse ? vectorFormules : [])
        .concat(fiche.formulesCles ?? [], fallbackFormules)
        .map((item) => canonicalizeFormalFormula(item))
        .filter((item) => !isSuspiciousFormula(item) && isHighQualityFormula(item, vectorCourse)),
    ).slice(0, 10),
    proprietesCles: dedupeStrings(
      (fiche.proprietesCles ?? []).concat(fallbackProprietes, vectorCourse ? vectorProprietes : []),
    )
      .filter((item) => !isSuspiciousProperty(item) && (!vectorCourse || /[.]/.test(item) || /^Deux vecteurs|^Un vecteur|^Le vecteur|^La relation|^Le milieu|^Dans un repere|^Si k>0/i.test(item)))
      .slice(0, 10),
    imageMentale: {
      titre: truncate(normalizeText(safeImageMentale.titre || `Image mentale : ${keywords[0] ?? "idee centrale"}`), 60),
      texte: ensureSentence(safeImageMentale.texte, fallbackImage, 60, 240),
    },
    definition: ensureSentence(fiche.definition, fallbackDefinition, 90, 340),
    exemple: ensureSentence(fiche.exemple, fallbackExample, 70, 240),
    piege: ensureSentence(fiche.piege, fallbackTrap, 70, 240),
    schema: normalizeSchema(safeSchema, fallbackSchema),
    feynman: ensureSentence(fiche.feynman, fallbackFeynman, 90, 360),
    flashcards: normalizeFlashcards(
      mergeFlashcards(vectorCourse ? vectorFlashcards : [], safeFlashcards, fallbackFlashcards),
      fallbackFlashcards,
    ),
  };

  return {
    ...enriched,
    blueprintSections: buildBlueprintSections(enriched, input.content, sentences, keywords),
  };
}

function buildDemoFiche(input: GenerateSheetRequest): FicheGeneree {
  const sentences = splitSentences(input.content);
  const keywords = extractKeywords(input.content);
  const excerpt = normalizeText(input.content.slice(0, 180));
  const subject = inferSubject(input.content);
  const vectorCourse = isVectorCourse(input.content);
  const resolvedBlueprint = resolveBlueprintId(subject, input.content);
  const fallbackNotions = buildNotionsCles(input.content, keywords, resolvedBlueprint);
  const fallbackFormules = buildFormulesCles(input.content, resolvedBlueprint, subject);
  const fallbackProprietes = buildProprietesCles(input.content, sentences, resolvedBlueprint);
  const fallbackSchema = buildFallbackSchema(input.content, keywords, sentences, resolvedBlueprint);
  const fallbackFlashcards = buildFallbackFlashcards(
    sentences,
    fallbackNotions,
    resolvedBlueprint,
    fallbackFormules,
    fallbackProprietes,
  );
  const vectorNotions = buildVectorCanonicalNotions(input.content);
  const vectorFormules = buildVectorCanonicalFormulas(input.content);
  const vectorProprietes = buildVectorCanonicalProperties(input.content);
  const vectorFlashcards = buildVectorCanonicalFlashcards(input.content);

  const demo: FicheGeneree = {
    titre: input.titleHint?.trim() || "Fiche de revision",
    matiere: subject,
    niveau: inferLevel(input.content),
    classification: buildFicheClassification(subject, inferLevel(input.content), resolvedBlueprint),
    blueprintId: resolvedBlueprint,
    metriques: buildStrongMetrics(input.content, keywords, sentences, subject),
    notionsCles: selectBestNotions(
      fallbackNotions.concat(vectorCourse ? vectorNotions : []),
      subject,
      input.content,
      resolvedBlueprint,
    ),
    formulesCles: dedupeStrings(
      (vectorCourse ? vectorFormules : [])
        .concat(fallbackFormules)
        .map((item) => canonicalizeFormalFormula(item))
        .filter((item) => !isSuspiciousFormula(item) && isHighQualityFormula(item, vectorCourse)),
    ).slice(0, 10),
    proprietesCles: dedupeStrings(
      fallbackProprietes.concat(vectorCourse ? vectorProprietes : []),
    )
      .filter((item) => !isSuspiciousProperty(item) && (!vectorCourse || /[.]/.test(item) || /^Deux vecteurs|^Un vecteur|^Le vecteur|^La relation|^Le milieu|^Dans un repere|^Si k>0/i.test(item)))
      .slice(0, 10),
    imageMentale: {
      titre: `Image mentale : ${keywords[0] ?? "idee centrale"}`,
      texte: `Imagine une scene tres simple : ${keywords[0] ?? "le concept"} agit comme un repere visuel qui organise tout le reste du cours. ${truncate(sentences[0] ?? excerpt, 150)}`,
    },
    definition: ensureSentence("", `Definition precise : ${sentences[0] ?? excerpt}`, 90, 320),
    exemple: ensureSentence("", `Exemple concret : ${sentences[1] ?? sentences[0] ?? excerpt}`, 70, 220),
    piege:
      "Piege classique : inverser les etapes, confondre deux notions proches ou apprendre la lecon sans comprendre la logique du cours.",
    schema: fallbackSchema,
    feynman:
      "Explique-le comme un enfant : on part d'une idee centrale, puis on suit quelques etapes simples qui montrent comment elle fonctionne et ce qu'elle produit.",
    flashcards: mergeFlashcards(
      vectorCourse ? vectorFlashcards : [],
      fallbackFlashcards,
      [],
    ).slice(0, 8),
  };

  return {
    ...demo,
    blueprintSections: buildBlueprintSections(demo, input.content, sentences, keywords),
  };
}

function validateFicheQuality(fiche: FicheGeneree): string[] {
  const issues: string[] = [];
  const sections = fiche.blueprintSections ?? {};

  if (!fiche.definition || fiche.definition.length < 50) {
    issues.push(`definition trop courte (${fiche.definition?.length ?? 0} chars, min 50)`);
  }
  if (!fiche.exemple || fiche.exemple.length < 40) {
    issues.push(`exemple trop court (${fiche.exemple?.length ?? 0} chars, min 40)`);
  }
  if (!fiche.piege || fiche.piege.length < 40) {
    issues.push(`piege trop court (${fiche.piege?.length ?? 0} chars, min 40)`);
  }
  if (!fiche.feynman || fiche.feynman.length < 50) {
    issues.push(`feynman trop court (${fiche.feynman?.length ?? 0} chars, min 50)`);
  }
  if ((fiche.notionsCles?.length ?? 0) < 3) {
    issues.push(`notionsCles insuffisantes (${fiche.notionsCles?.length ?? 0}, min 3)`);
  }
  if ((fiche.notionsCles?.length ?? 0) > 8) {
    issues.push(`notionsCles trop nombreuses (${fiche.notionsCles?.length ?? 0}, max 8)`);
  }

  const validFlashcards = (fiche.flashcards ?? []).filter(
    (f) => f.question?.length >= 10 && f.reponse?.length >= 15,
  );
  if (validFlashcards.length < 3) {
    issues.push(`seulement ${validFlashcards.length} flashcards valides (min 3)`);
  }

  const elements = fiche.schema?.elements ?? [];
  const connexions = fiche.schema?.connexions ?? [];
  if (elements.length < 3) {
    issues.push(`schema: seulement ${elements.length} elements (min 3)`);
  }
  if (connexions.length < 2) {
    issues.push(`schema: seulement ${connexions.length} connexions (min 2)`);
  }

  if (fiche.blueprintId === "formulaire") {
    if ((fiche.formulesCles?.length ?? 0) < 3) {
      issues.push("formulaire: noyau de formules insuffisant");
    }
    if ((sections.tableauSynthese?.length ?? 0) < 3) {
      issues.push("formulaire: tableau de synthese insuffisant");
    }
  }

  if (fiche.blueprintId === "mecanisme" && (sections.etapesCles?.length ?? 0) < 3) {
    issues.push("mecanisme: etapes cles insuffisantes");
  }

  if (fiche.blueprintId === "chronologie" && (sections.reperes?.length ?? 0) < 3) {
    issues.push("chronologie: reperes insuffisants");
  }

  if (fiche.blueprintId === "algorithmique") {
    if ((sections.pseudoCode?.length ?? 0) < 3) {
      issues.push("algorithmique: logique ou pseudo-code insuffisant");
    }
    if ((sections.casLimites?.length ?? 0) < 2) {
      issues.push("algorithmique: cas limites insuffisants");
    }
  }

  return issues;
}

export async function generateRichFiche(input: GenerateSheetRequest): Promise<FicheGeneree> {
  const normalizedInput = {
    ...input,
    content: normalizeDocumentText(input.content),
  };

  if (!process.env.OPENAI_API_KEY) {
    return buildDemoFiche(normalizedInput);
  }

  const wordCount = normalizedInput.content.trim().split(/\s+/).length;
  if (wordCount < 30) {
    console.warn(`Source text too short (${wordCount} words), using demo fiche.`);
    return buildDemoFiche(normalizedInput);
  }

  try {
    const parsed = cleanGeneratedFicheContent(await generateWithPipeline(normalizedInput));

    const issues = validateFicheQuality(parsed);
    if (issues.length > 0) {
      console.warn("Fiche quality issues detected:", issues);
    }

    return sanitizeFicheOutput(enrichFiche(normalizedInput, parsed));
  } catch (pipelineError) {
    console.warn("Pipeline generation failed, falling back to single-call.", pipelineError);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.25,
        max_tokens: 3200,
        messages: [
          { role: "system", content: FICHE_SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(normalizedInput.content) },
        ],
      });

      const raw = completion.choices[0]?.message?.content ?? "";
      const stripped = raw.replace(/```json|```/g, "").trim();
      const cleaned = stripped
        .replace(/\\\\/g, "\x00DB\x00")
        .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
        .replace(/\x00DB\x00/g, "\\\\");
      const fallbackParsed = cleanGeneratedFicheContent(
        sanitizeAiJsonValue(JSON.parse(cleaned)) as FicheGeneree,
      );

      return sanitizeFicheOutput(enrichFiche(normalizedInput, fallbackParsed));
    } catch (fallbackError) {
      const pe = pipelineError instanceof Error ? pipelineError.message : String(pipelineError);
      const fe = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      throw new Error(`Pipeline: ${pe} | Fallback: ${fe}`);
    }
  }
}
