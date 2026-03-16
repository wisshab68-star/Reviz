function buildDocumentContextExcerpt(sourceText: string, maxChars: number) {
  if (sourceText.length <= maxChars) {
    return sourceText;
  }

  const third = Math.max(1200, Math.floor(maxChars / 3));
  const head = sourceText.slice(0, third);
  const middleStart = Math.max(0, Math.floor(sourceText.length / 2) - Math.floor(third / 2));
  const middle = sourceText.slice(middleStart, middleStart + third);
  const tail = sourceText.slice(-third);

  return `${head}\n\n[... extrait milieu du document ...]\n\n${middle}\n\n[... extrait fin du document ...]\n\n${tail}`;
}

export const DETECT_PROFILE_SYSTEM = `Tu es un expert pedagogique capable d'identifier avec precision la matiere, le niveau, la structure pedagogique dominante et la densite conceptuelle de n'importe quel document academique.
Tu analyses la structure, les formulations, les concepts, la progression didactique et le niveau reel d'exigence.
Tu reponds UNIQUEMENT en JSON valide, sans commentaire ni markdown.`;

export function buildDetectProfilePrompt(sourceText: string): string {
  const excerpt = buildDocumentContextExcerpt(sourceText, 9000);

  return `Analyse ce document source et retourne UNIQUEMENT un objet JSON avec cette structure exacte :

{
  "matiere": string,
  "sous_domaine": string,
  "niveau": string,
  "famille_pedagogique": "formel" | "processus" | "conceptuel" | "algorithmique" | "comparatif" | "chronologique" | "cas-pratique" | "taxonomique",
  "niveau_precision": "introductif" | "standard" | "avance" | "expert",
  "objectif_revision": "memoriser" | "resoudre" | "raisonner" | "rediger" | "programmer" | "comparer" | "analyser",
  "type_contenu": string[],
  "contient_formules": boolean,
  "contient_demonstrations": boolean,
  "contient_schemas": boolean,
  "langue": string,
  "densite": "faible" | "moyenne" | "elevee"
}

Champs :
- "matiere" : la discipline principale (ex: "Mathematiques", "Physique-Chimie", "Philosophie", "Histoire", "SVT", "Informatique", "Economie", "Droit", "Francais", "Anglais")
- "sous_domaine" : le sous-domaine precis (ex: "Geometrie vectorielle", "Fonction derivee", "Photosynthese", "Automates finis", "Revolution francaise")
- "niveau" : le niveau scolaire ou universitaire (ex: "3eme", "Seconde", "Premiere", "Terminale", "Licence 2", "Master 1", "CPGE MP", "BTS")
- "famille_pedagogique" :
  - "formel" pour les cours centres sur formules, preuves, demonstrations, criteres, calculs ou theoremes
  - "processus" pour les cours centres sur etapes, cycles, mecanismes, transformations ou chaines causales
  - "conceptuel" pour les cours centres sur notions, theses, distinctions, definitions et arguments abstraits
  - "algorithmique" pour les cours centres sur procedures, pseudocode, structures de donnees, etats, complexite
  - "comparatif" pour les cours centres sur typologies, classifications, oppositions ou tableaux comparatifs
  - "chronologique" pour les cours centres sur periodes, successions d'evenements, acteurs historiques et bascules
  - "cas-pratique" pour les cours centres sur application d'une regle, raisonnement sur un cas ou decision
  - "taxonomique" pour les cours centres sur familles, niveaux, classes, categories et sous-categories
- "niveau_precision" :
  - "introductif" pour college / decouverte
  - "standard" pour lycee / licence debutante
  - "avance" pour terminale specialisee / L3 / M1
  - "expert" pour M2 / prepas exigeantes / cours techniques denses
- "objectif_revision" :
  - "memoriser" si l'enjeu principal est retenir des notions, reperes ou vocabulaire
  - "resoudre" si l'enjeu principal est appliquer des formules, methodes ou procedures de resolution
  - "raisonner" si l'enjeu principal est articuler des concepts, arguments ou causalites
  - "rediger" si l'enjeu principal est restituer un raisonnement structure ou une reponse developpee
  - "programmer" si l'enjeu principal est comprendre une logique algorithmique ou une implementation
  - "comparer" si l'enjeu principal est distinguer des categories, modeles ou periodes
  - "analyser" si l'enjeu principal est interpreter, commenter ou etudier un document / mecanisme complexe
- "type_contenu" : liste des elements pedagogiques presents (ex: ["definitions", "theoremes", "demonstrations", "formules", "methodes", "exemples", "exercices", "dates", "schemas", "pseudocode", "processus", "comparaisons"])
- "contient_formules" : true si le document contient des formules mathematiques, physiques ou symboliques
- "contient_demonstrations" : true si le document contient des demonstrations, preuves ou raisonnements formels
- "contient_schemas" : true si le document mentionne ou decrit des schemas, graphiques ou diagrammes
- "langue" : langue principale du document (ex: "francais", "anglais")
- "densite" : "faible" si le document est aeré avec peu de notions, "moyenne" si standard, "elevee" si dense et concentre

Contraintes d'analyse :
- N'identifie PAS les notions par simple frequence des mots
- Analyse la structure pedagogique reelle du document
- Si le document melange theorie et methode, choisis la famille dominante pour la generation d'une fiche utile
- Si c'est un cours de maths, distingue bien un chapitre conceptuel d'un chapitre a formules ou d'un chapitre de methode
- Si c'est un cours de SVT, privilegie "processus" quand le coeur du document est une sequence biologique ou physiologique
- Si c'est un cours d'informatique, privilegie "algorithmique" quand le coeur du document porte sur des procedures, des etats ou du pseudocode
- Si c'est un cours d'histoire ou de geopolitique, privilegie "chronologique" quand les periodes, acteurs et transitions sont structurants
- Si c'est un cours de droit, de medecine ou de gestion centre sur application de regles ou de raisonnements sur situation, privilegie "cas-pratique"
- Si le document repose sur familles, categories, classements ou hierarchies, privilegie "taxonomique"

Document source :
---
${excerpt}
---`;
}
