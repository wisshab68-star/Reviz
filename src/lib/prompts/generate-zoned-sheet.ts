import type { PedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import type { ClassifiedContent } from "@/lib/prompts/classify-content";
import type { DocumentProfile } from "@/types/generation-pipeline";

/**
 * Compatibility prompt for the zoned generation step.
 * The current pipeline still calls this helper with profile, blueprint and
 * classified metadata, so we keep that signature stable.
 */
export function buildZonedSheetSystemPrompt(
  profile?: DocumentProfile,
  blueprint?: PedagogicalBlueprint,
  classified?: ClassifiedContent,
): string {
  return `Tu es un expert en pedagogie et en creation de fiches de revision.
Ton role est de structurer une fiche courte et utile avant la generation finale.
Contexte :
- matiere: ${profile?.matiere ?? classified?.matiere ?? "Cours"}
- niveau: ${profile?.niveau ?? classified?.niveau ?? "General"}
- blueprint: ${blueprint?.id ?? classified?.blueprintId ?? "concepts"}
Reponds uniquement en JSON valide.`;
}

export function buildZonedSheetUserPrompt(
  inventoryJSON: string,
  sourceText?: string,
  profile?: DocumentProfile,
  blueprint?: PedagogicalBlueprint,
  strictFormulas: string[] = [],
  classified?: ClassifiedContent,
): string {
  const formulasBlock = strictFormulas.length > 0
    ? `\nFormules strictes a conserver :\n${strictFormulas.join("\n")}`
    : "";

  return `Analyse ce cours et propose une fiche zonee exploitable.

Matiere: ${profile?.matiere ?? classified?.matiere ?? "Cours"}
Niveau: ${profile?.niveau ?? classified?.niveau ?? "General"}
Blueprint: ${blueprint?.id ?? classified?.blueprintId ?? "concepts"}

Inventaire :
${inventoryJSON}

Extrait source :
${sourceText ?? ""}
${formulasBlock}

Reponds en JSON.`;
}
