import type { SubjectFamily } from "@/lib/subject-families";

export interface FicheMetrique {
  valeur: string;
  label: string;
}

export interface FicheImageMentale {
  titre: string;
  texte: string;
}

export interface FicheSchemaElement {
  id: string;
  label: string;
  couleur: "bleu" | "teal" | "coral" | "violet" | "gris";
}

export interface FicheSchemaConnexion {
  de: string;
  vers: string;
  label?: string;
}

export interface FicheSchema {
  type: "comparaison" | "formule" | "processus" | "relations";
  description: string;
  ascii?: string;
  elements: FicheSchemaElement[];
  connexions: FicheSchemaConnexion[];
}

export interface FicheFlashcard {
  question: string;
  reponse: string;
}

export interface FicheTableRow {
  titre: string;
  contenu: string;
  accent?: "bleu" | "jaune" | "rose" | "violet" | "menthe";
}

export interface FicheStep {
  titre: string;
  contenu: string;
}

export interface FicheComparisonPoint {
  axe: string;
  gauche: string;
  droite: string;
}

export interface FichePseudoCodeStep {
  ligne: string;
  explication?: string;
}

export interface FicheRepere {
  titre: string;
  detail: string;
}

export interface FicheClassificationNode {
  categorie: string;
  elements: string[];
}

export interface FicheClassification {
  matiere: string;
  niveau: string;
  type: string;
}

export type SheetZone = "anchor" | "core" | "action";

export type BlockType = "concept" | "formula" | "rule" | "example" | "trap";

export type BlockLevel = "understand" | "apply" | "trap";

export interface ZonedBlock {
  id: string;
  zone: SheetZone;
  type: BlockType;
  level: BlockLevel;
  title: string;
  content: string;
}

export interface FicheBlueprintSections {
  tableauSynthese?: FicheTableRow[];
  etapesCles?: FicheStep[];
  distinctions?: FicheComparisonPoint[];
  pseudoCode?: FichePseudoCodeStep[];
  casLimites?: string[];
  reperes?: FicheRepere[];
  classifications?: FicheClassificationNode[];
  applications?: FicheTableRow[];
}

export interface ZonedFiche {
  titre: string;
  matiere: string;
  subjectFamily?: SubjectFamily;
  niveau: string;
  classification?: FicheClassification;
  blueprintId?: string;
  objectifRevision?: string;
  blueprintSections?: FicheBlueprintSections;
  metriques: FicheMetrique[];

  // Zone Ancre
  anchorImageMentale: FicheImageMentale;
  anchorDefinition: string;

  // Zone Coeur - max 5 blocs
  coreBlocks: ZonedBlock[];

  // Zone Action
  actionExample: string;
  actionTrap: string;
  actionQuiz?: FicheFlashcard[];

  // Preserved for backward compat
  schema: FicheSchema;
  feynman: string;
  flashcards: FicheFlashcard[];

  // Legacy fields - kept for Prisma compat
  notionsCles?: string[];
  formulesCles?: string[];
  proprietesCles?: string[];
  imageMentale: FicheImageMentale;
  definition: string;
  exemple: string;
  piege: string;
}

export interface FicheGeneree {
  titre: string;
  matiere: string;
  subjectFamily?: SubjectFamily;
  niveau: string;
  classification?: FicheClassification;
  blueprintId?: string;
  objectifRevision?: string;
  blueprintSections?: FicheBlueprintSections;
  metriques: FicheMetrique[];
  notionsCles?: string[];
  formulesCles?: string[];
  proprietesCles?: string[];
  imageMentale: FicheImageMentale;
  definition: string;
  exemple: string;
  piege: string;
  schema: FicheSchema;
  feynman: string;
  flashcards: FicheFlashcard[];
}
