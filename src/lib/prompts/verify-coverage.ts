import { normalizeDocumentText } from "@/lib/text";

function buildDocumentContextExcerpt(sourceText: string, maxChars: number) {
  const cleanedSourceText = normalizeDocumentText(sourceText);

  if (cleanedSourceText.length <= maxChars) {
    return cleanedSourceText;
  }

  const third = Math.max(1400, Math.floor(maxChars / 3));
  const head = cleanedSourceText.slice(0, third);
  const middleStart = Math.max(0, Math.floor(cleanedSourceText.length / 2) - Math.floor(third / 2));
  const middle = cleanedSourceText.slice(middleStart, middleStart + third);
  const tail = cleanedSourceText.slice(-third);

  return `${head}\n\n[... extrait milieu du document ...]\n\n${middle}\n\n[... extrait fin du document ...]\n\n${tail}`;
}

export function buildCoveragePrompt(inventoryJSON: string, sheetJSON: string): string {
  return `Tu es un verificateur pedagogique. Ta mission est de comparer un inventaire exhaustif du contenu d'un cours avec une fiche de revision generee, et d'evaluer la couverture.

INVENTAIRE DU DOCUMENT SOURCE :
${inventoryJSON}

FICHE GENEREE :
${sheetJSON}

Analyse la fiche et determine :
1. Quels elements de l'inventaire sont presents dans la fiche (couverts)
2. Quels elements de l'inventaire sont absents de la fiche (manquants)
3. Quels elements sont presents mais insuffisamment traites (incomplets)

Retourne UNIQUEMENT un objet JSON avec cette structure :

{
  "score": number,
  "missing": [string],
  "incomplete": [string]
}

Champs :
- "score" : ratio de couverture entre 0 et 1 (1 = tout est couvert). Calcule comme : (elements couverts) / (total elements dans l'inventaire)
- "missing" : liste des elements de l'inventaire totalement absents de la fiche. Chaque element est une description courte (ex: "Definition de vecteur", "Formule du produit scalaire", "Theoreme de Thales")
- "incomplete" : liste des elements presents mais insuffisamment traites (ex: "Propriete de colinearite mentionnee sans conditions d'application")

Regles :
- Sois rigoureux : une mention vague ne compte pas comme couverture
- Une formule approximee ou incomplete compte comme "incomplete"
- Un theoreme sans ses conditions d'application compte comme "incomplete"
- Un piege mentionne sans sa correction compte comme "incomplete"`;
}

export function buildCompletionPrompt(
  missing: string[],
  incomplete: string[],
  currentSheetJSON: string,
  sourceText: string,
  remediation: string[] = [],
  strictFormulas: string[] = [],
): string {
  const sourceExcerpt = buildDocumentContextExcerpt(sourceText, 10000);
  const missingList = missing.map((item, i) => `${i + 1}. ${item}`).join("\n");
  const incompleteList = incomplete.map((item, i) => `${i + 1}. ${item}`).join("\n");
  const remediationList = remediation.map((item, i) => `${i + 1}. ${item}`).join("\n");
  const strictFormulaBlock = strictFormulas.length > 0
    ? `
FORMULES STRICTES A CONSERVER :
${strictFormulas.map((formula, index) => `${index + 1}. ${formula}`).join("\n")}
`
    : "";

  return `La fiche suivante est incomplete. Les elements ci-dessous sont presents dans le document source mais absents ou insuffisants dans la fiche.

ELEMENTS MANQUANTS :
${missingList || "(aucun)"}

ELEMENTS INCOMPLETS :
${incompleteList || "(aucun)"}

CORRECTIONS PEDAGOGIQUES A APPORTER :
${remediationList || "(aucune)"}

FICHE ACTUELLE :
${currentSheetJSON}

DOCUMENT SOURCE (pour contexte) :
---
${sourceExcerpt}
---

${strictFormulaBlock}

Ta mission : complete la fiche en ajoutant ou enrichissant UNIQUEMENT les elements manquants ou incomplets. Corrige aussi les faiblesses pedagogiques listees ci-dessus. Ne modifie pas les elements deja corrects.
Si des formules strictes sont listees ci-dessus, elles doivent etre conservees mot pour mot et toute formule alteree doit etre corrigee.

Retourne la fiche COMPLETE mise a jour en JSON, avec le meme format que la fiche actuelle. Tous les champs existants doivent etre preserves, et les elements manquants/incomplets doivent etre integres.`;
}
