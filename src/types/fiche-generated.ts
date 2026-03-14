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
  elements: FicheSchemaElement[];
  connexions: FicheSchemaConnexion[];
}

export interface FicheFlashcard {
  question: string;
  reponse: string;
}

export interface FicheGeneree {
  titre: string;
  matiere: string;
  niveau: string;
  metriques: FicheMetrique[];
  imageMentale: FicheImageMentale;
  definition: string;
  exemple: string;
  piege: string;
  schema: FicheSchema;
  feynman: string;
  flashcards: FicheFlashcard[];
}
