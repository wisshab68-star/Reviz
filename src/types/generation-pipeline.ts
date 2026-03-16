export type PedagogicalFamily =
  | "formel"
  | "processus"
  | "conceptuel"
  | "algorithmique"
  | "comparatif"
  | "chronologique"
  | "cas-pratique"
  | "taxonomique";

export type RevisionObjective =
  | "memoriser"
  | "resoudre"
  | "raisonner"
  | "rediger"
  | "programmer"
  | "comparer"
  | "analyser";

export type SheetBlueprintId =
  | "formulaire"
  | "mecanisme"
  | "chronologie"
  | "comparaison"
  | "algorithmique"
  | "cas-pratique"
  | "concepts"
  | "taxonomie";

export interface DocumentProfile {
  matiere: string;
  sous_domaine: string;
  niveau: string;
  famille_pedagogique: PedagogicalFamily;
  niveau_precision: "introductif" | "standard" | "avance" | "expert";
  objectif_revision: RevisionObjective;
  blueprint_recommande?: SheetBlueprintId;
  type_contenu: string[];
  contient_formules: boolean;
  contient_demonstrations: boolean;
  contient_schemas: boolean;
  langue: string;
  densite: "faible" | "moyenne" | "elevee";
}

export interface InventoryDefinition {
  terme: string;
  enonce: string;
}

export interface InventoryProperty {
  nom: string;
  enonce: string;
  conditions: string;
}

export interface InventoryFormula {
  nom: string;
  expression: string;
  variables: string;
}

export interface InventoryTheorem {
  nom: string;
  enonce: string;
  demonstration_presente: boolean;
}

export interface InventoryMethod {
  titre: string;
  etapes: string[];
}

export interface InventoryExample {
  enonce: string;
  resolution: string;
}

export interface InventoryTrap {
  description: string;
  correction: string;
}

export interface InventoryPart {
  titre: string;
  definitions: InventoryDefinition[];
  proprietes: InventoryProperty[];
  formules: InventoryFormula[];
  theoremes: InventoryTheorem[];
  methodes: InventoryMethod[];
  exemples: InventoryExample[];
  pieges: InventoryTrap[];
  remarques: string[];
}

export interface ContentInventory {
  titre: string;
  parties: InventoryPart[];
  vocabulaire_cle: string[];
  formules_importantes: string[];
  points_a_retenir: string[];
}

export interface CoverageReport {
  score: number;
  missing: string[];
  incomplete: string[];
}

export interface PedagogicalQualityReport {
  score: number;
  issues: string[];
  missingExpected: string[];
  weakNotions: string[];
  remediation: string[];
}

export interface SourceQuality {
  wordCount: number;
  noiseLevel: "faible" | "moyen" | "eleve";
  isUsable: boolean;
  warnings: string[];
}
