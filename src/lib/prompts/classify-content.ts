import { detectSubjectFamily, type SubjectFamily } from "@/lib/subject-families";
import { normalizeDocumentText } from "@/lib/text";

export interface ClassifiedContent {
  cleanedText: string;
  subject: string;
  subjectFamily: SubjectFamily;
  level: string;
  contentType: string;
  matiere: string;
  niveau: string;
  blueprintId: string;
  titre: string;
}

/**
 * Infers the subject from raw text content.
 */
export function inferSubject(content: string): string {
  const lower = content.toLowerCase();

  if (/\b(derivee?|integrale?|limite|vecteur|matrice|equation differentielle|probabilite|suite)\b/.test(lower)) {
    return "Mathematiques";
  }
  if (/\b(force|energie|tension|courant|atome|molecule|reaction chimique|cellule|photosynthese)\b/.test(lower)) {
    return "Sciences";
  }
  if (/\b(guerre|revolution|empire|siecle|traite|constitution|croissance|inflation)\b/.test(lower)) {
    return "Histoire-Geographie";
  }
  if (/\b(algorithme|boucle|fonction|variable|tableau|classe|objet|complexite)\b/.test(lower)) {
    return "Informatique";
  }
  if (/\b(philosophe|etre|conscience|liberte|verite|connaissance)\b/.test(lower)) {
    return "Philosophie";
  }
  if (/\b(anglais|espagnol|allemand|italien|grammar|vocabulary|conjugaison)\b/.test(lower)) {
    return "Langues";
  }

  return "General";
}

function inferLevel(content: string): string {
  const lower = content.toLowerCase();

  if (/\b(master|m1|m2|doctorat|these|doctorant)\b/.test(lower)) {
    return "Master";
  }
  if (/\b(licence|l1|l2|l3|universite)\b/.test(lower)) {
    return "Licence";
  }
  if (/\b(terminale|premiere|seconde|lycee|bac)\b/.test(lower)) {
    return "Lycee";
  }
  if (/\b(6e|5e|4e|3e|college|brevet)\b/.test(lower)) {
    return "College";
  }

  return "General";
}

function inferContentType(content: string, subjectFamily: SubjectFamily): string {
  const lower = content.toLowerCase();

  if (/\b(algorithme|pseudo-?code|complexite|boucle|condition|etat|transition)\b/.test(lower)) {
    return "algorithmique";
  }
  if (/\b(chronologie|date|siecle|periode|guerre|revolution|frise)\b/.test(lower)) {
    return "chronologie";
  }
  if (/\b(comparer|difference|similitude|oppose|versus|vs)\b/.test(lower)) {
    return "comparaison";
  }
  if (/\b(etape|cycle|processus|mecanisme|reaction|phase)\b/.test(lower)) {
    return "processus";
  }
  if (subjectFamily === "mathematiques" || subjectFamily === "sciences") {
    return "formulaire";
  }

  return "concepts";
}

function inferBlueprintId(contentType: string): string {
  switch (contentType) {
    case "algorithmique":
      return "algorithmique";
    case "chronologie":
      return "chronologie";
    case "comparaison":
      return "comparaison";
    case "processus":
      return "mecanisme";
    case "formulaire":
      return "formulaire";
    default:
      return "concepts";
  }
}

/**
 * Cleans and classifies content before the generation pipeline.
 * This function is synchronous because the pipeline reads it synchronously.
 */
export function cleanAndClassify(content: string): ClassifiedContent {
  const cleanedText = normalizeDocumentText(content ?? "");
  const subject = inferSubject(cleanedText);
  const subjectFamily = detectSubjectFamily(subject);
  const level = inferLevel(cleanedText);
  const contentType = inferContentType(cleanedText, subjectFamily);
  const firstLine = cleanedText
    .split(/\n+/)
    .map((line) => line.trim())
    .find(Boolean);

  return {
    cleanedText,
    subject,
    subjectFamily,
    level,
    contentType,
    matiere: subject,
    niveau: level,
    blueprintId: inferBlueprintId(contentType),
    titre: firstLine?.slice(0, 80) || "Fiche de revision",
  };
}
