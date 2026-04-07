/**
 * Builds prompts for the zoned sheet generation step.
 * A "zoned sheet" splits content into semantic zones before full fiche generation.
 */
export function buildZonedSheetSystemPrompt(): string {
  return `Tu es un expert en pédagogie et en création de fiches de révision.
Ton rôle est d'analyser un contenu de cours et de le structurer en zones thématiques claires.
Réponds uniquement en JSON valide.`;
}

export function buildZonedSheetUserPrompt(content: string, matiere: string, niveau: string): string {
  return `Analyse ce cours de ${matiere} (niveau ${niveau}) et identifie les zones thématiques principales.

Contenu :
${content}

Réponds en JSON avec cette structure :
{
  "zones": [
    {
      "titre": "Titre de la zone",
      "contenu": "Contenu résumé de la zone",
      "type": "definition|exemple|formule|concept|application"
    }
  ]
}`;
}
