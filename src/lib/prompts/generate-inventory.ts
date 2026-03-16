import type { DocumentProfile } from "@/types/generation-pipeline";
import { getSubjectRules } from "@/lib/prompts/subject-rules";
import { normalizeDocumentText } from "@/lib/text";

export function buildInventorySystemPrompt(profile: DocumentProfile): string {
  const subjectRules = getSubjectRules(profile.matiere);

  return `Tu es un professeur agrege specialise en ${profile.matiere} (${profile.sous_domaine}), expert du niveau ${profile.niveau}.
Ta mission est d'extraire de facon EXHAUSTIVE TOUS les elements pedagogiques d'un document. Tu ne sautes aucune notion, meme secondaire. Tu ne resumes pas. Tu listes tout.

PROFIL DETECTE :
- famille pedagogique : ${profile.famille_pedagogique}
- objectif de revision : ${profile.objectif_revision}

REGLE ABSOLUE : chaque element present dans le document doit figurer dans ton inventaire. Ne synthetise pas. Ne regroupe pas artificiellement. Si le document a 8 parties, l'inventaire a 8 parties. Si une partie contient 5 definitions, l'inventaire liste 5 definitions.

PRECISION : chaque enonce doit etre complet et fidele au document source. Ne reformule pas de facon vague. Reproduis les conditions et les exemples tels qu'ils apparaissent.

ATTENTION - CORRUPTION PDF :
Le texte source provient d'un extracteur PDF qui detruit la notation mathematique.
Les indices deviennent des espaces, les exposants disparaissent, les commandes LaTeX sont cassees.
Dans les champs expression, enonce, conditions et variables, reconstruis systematiquement les formules en notation mathematique valide.
Ne reproduis jamais un fragment casse comme "u n+1" — ecris u_{n+1}.
Utilise le contexte mathematique du chapitre pour desambiguiser.

${subjectRules}

Tu reponds UNIQUEMENT en JSON valide, sans commentaire ni markdown.`;
}

export function buildInventoryUserPrompt(sourceText: string): string {
  const cleanedSourceText = normalizeDocumentText(sourceText);

  return `Lis integralement ce document et produis un inventaire exhaustif de son contenu pedagogique.

Retourne UNIQUEMENT un objet JSON avec cette structure :

{
  "titre": string,
  "parties": [
    {
      "titre": string,
      "definitions": [
        { "terme": string, "enonce": string }
      ],
      "proprietes": [
        { "nom": string, "enonce": string, "conditions": string }
      ],
      "formules": [
        { "nom": string, "expression": string, "variables": string }
      ],
      "theoremes": [
        { "nom": string, "enonce": string, "demonstration_presente": boolean }
      ],
      "methodes": [
        { "titre": string, "etapes": [string] }
      ],
      "exemples": [
        { "enonce": string, "resolution": string }
      ],
      "pieges": [
        { "description": string, "correction": string }
      ],
      "remarques": [string]
    }
  ],
  "vocabulaire_cle": [string],
  "formules_importantes": [string],
  "points_a_retenir": [string]
}

Regles :
- Chaque element present dans le document doit figurer dans cet inventaire
- Ne synthetise pas. Ne regroupe pas artificiellement
- Si le document a 8 parties, l'inventaire a 8 parties
- Si une partie contient 5 definitions, l'inventaire liste 5 definitions
- Les formules du document peuvent etre corrompues par l'extraction PDF (indices, exposants, fractions casses). Reconstruis-les en notation mathematique valide plutot que de recopier les fragments casses
- Les conditions d'application sont toujours precisees
- Les tableaux de valeur present dans l'inventaire seront sous forme de parties separees
- Si une section du document ne contient pas un type d'element (ex: pas de theoreme), le tableau correspondant est vide []
- Pour un cours chronologique, preserve l'ordre des periodes, des dates et des tournants
- Pour un cours taxonomique, preserve les categories, sous-categories et criteres
- Pour un cours algorithmique, preserve les entrees, sorties, etats, transitions, cas limites et complexite s'ils existent
- Pour un cours de cas pratique, preserve les conditions, exceptions, cas d'application et etapes de raisonnement
- Pour un cours formel, preserve absolument les formules, criteres, proprietes et theoremes
- Les notions meta du document (chapitre, resume, introduction, conclusion) ne vont pas dans vocabulaire_cle sauf si elles designent un vrai concept disciplinaire

Document source :
---
${cleanedSourceText}
---`;
}
