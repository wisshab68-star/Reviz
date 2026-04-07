export interface ClassifiedContent {
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
  if (/\b(dérivée?|intégrale?|limite|vecteur|matrice|équation différentielle)\b/.test(lower)) return "Mathématiques";
  if (/\b(force|énergie|tension|courant|atome|molécule|réaction chimique)\b/.test(lower)) return "Sciences";
  if (/\b(guerre|révolution|empire|siècle|traité|constitution)\b/.test(lower)) return "Histoire-Géographie";
  if (/\b(algorithme|boucle|fonction|variable|tableau|classe|objet)\b/.test(lower)) return "Informatique";
  if (/\b(philosophe|être|conscience|liberté|vérité|connaissance)\b/.test(lower)) return "Philosophie";
  return "Général";
}

/**
 * Cleans and classifies content — returns basic metadata.
 * Full AI classification happens in the generation pipeline.
 */
export async function cleanAndClassify(content: string): Promise<ClassifiedContent> {
  return {
    matiere: inferSubject(content),
    niveau: "Lycée",
    blueprintId: "concepts",
    titre: content.split(/[\n.!?]/)[0]?.slice(0, 80).trim() || "Fiche de révision",
  };
}
