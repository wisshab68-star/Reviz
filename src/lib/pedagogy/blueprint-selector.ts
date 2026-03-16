import type {
  ContentInventory,
  DocumentProfile,
  InventoryPart,
  SheetBlueprintId,
} from "@/types/generation-pipeline";

export interface PedagogicalBlueprint {
  id: SheetBlueprintId;
  titre: string;
  objectif: string;
  blocsPrioritaires: string[];
  promptDirectives: string[];
  signauxAttendus: string[];
}

function countPartsBy<T>(parts: InventoryPart[], selector: (part: InventoryPart) => T[]): number {
  return parts.reduce((total, part) => total + selector(part).length, 0);
}

function inferByInventory(profile: DocumentProfile, inventory: ContentInventory): SheetBlueprintId {
  const formulaCount = countPartsBy(inventory.parties, (part) => part.formules);
  const methodCount = countPartsBy(inventory.parties, (part) => part.methodes);
  const theoremCount = countPartsBy(inventory.parties, (part) => part.theoremes);
  const exampleCount = countPartsBy(inventory.parties, (part) => part.exemples);
  const propertyCount = countPartsBy(inventory.parties, (part) => part.proprietes);
  const titleContext = `${profile.matiere} ${profile.sous_domaine} ${profile.type_contenu.join(" ")}`.toLowerCase();

  if (profile.famille_pedagogique === "chronologique" || /(chronolog|periode|guerre|revolution|memoire|regime)/.test(titleContext)) {
    return "chronologie";
  }

  if (profile.famille_pedagogique === "algorithmique") {
    return "algorithmique";
  }

  if (profile.famille_pedagogique === "cas-pratique" || /(cas pratique|jurisprudence|diagnostic|consultation|etude de cas)/.test(titleContext)) {
    return "cas-pratique";
  }

  if (profile.famille_pedagogique === "taxonomique" || /(classification|typologie|famille|categorie|tableau comparatif)/.test(titleContext)) {
    return "taxonomie";
  }

  if (profile.famille_pedagogique === "comparatif") {
    return "comparaison";
  }

  if (profile.famille_pedagogique === "processus") {
    return "mecanisme";
  }

  if (profile.famille_pedagogique === "formel") {
    if (formulaCount >= 3 || theoremCount >= 2 || methodCount >= 2) {
      return "formulaire";
    }
    return "concepts";
  }

  if (formulaCount >= 3 || propertyCount >= 4) {
    return "formulaire";
  }

  if (methodCount >= 2 && exampleCount >= 2) {
    return "cas-pratique";
  }

  return "concepts";
}

const BLUEPRINTS: Record<SheetBlueprintId, PedagogicalBlueprint> = {
  formulaire: {
    id: "formulaire",
    titre: "Fiche de maitrise formelle",
    objectif: "Aider a resoudre, appliquer et verifier des relations formelles sans confusion.",
    blocsPrioritaires: ["idee centrale", "tableau de formules", "conditions", "methode", "pieges", "flashcards d'application"],
    promptDirectives: [
      "Construis la fiche autour des relations exactes, pas autour d'un resume general.",
      "Les formules et leurs conditions d'application sont plus importantes que la paraphrase.",
      "Fais ressortir une methode de resolution ou de verification en etapes courtes.",
    ],
    signauxAttendus: ["formules exactes", "conditions", "criteres", "methode", "pieges"],
  },
  mecanisme: {
    id: "mecanisme",
    titre: "Fiche de mecanisme",
    objectif: "Faire retenir un enchainement, une causalite ou un fonctionnement etape par etape.",
    blocsPrioritaires: ["idee centrale", "acteurs", "etapes", "cause/effet", "schema de flux", "flashcards sequentielles"],
    promptDirectives: [
      "Mets en avant la chronologie interne du mecanisme.",
      "Le schema doit montrer des flux, des transformations ou des relations de cause a effet.",
      "Les flashcards doivent tester l'ordre, les roles et les consequences.",
    ],
    signauxAttendus: ["etapes", "acteurs", "causalites", "schema de flux"],
  },
  chronologie: {
    id: "chronologie",
    titre: "Fiche de reperes historiques",
    objectif: "Fixer les repères temporels, les acteurs et les bascules d'un chapitre historique.",
    blocsPrioritaires: ["contexte", "chronologie", "acteurs", "enjeux", "debats", "flashcards de reperes"],
    promptDirectives: [
      "Structure les informations selon les temps forts et les changements de periode.",
      "Le schema doit privilegier la succession, les tensions et les acteurs.",
      "Distingue faits, interpretations et memoires si le cours l'exige.",
    ],
    signauxAttendus: ["repères", "dates", "acteurs", "debats"],
  },
  comparaison: {
    id: "comparaison",
    titre: "Fiche comparative",
    objectif: "Faire comprendre les differents types, categories ou oppositions sans les melanger.",
    blocsPrioritaires: ["idee directrice", "criteres de comparaison", "distinctions", "exemples", "pieges de confusion", "flashcards de contraste"],
    promptDirectives: [
      "Insiste sur ce qui distingue les categories, pas seulement sur leurs definitions isolees.",
      "Le schema doit montrer des oppositions, regroupements ou correspondances.",
      "Les notions cles doivent etre des categories ou des criteres, pas des mots decoratifs.",
    ],
    signauxAttendus: ["distinctions", "criteres", "contre-exemples"],
  },
  algorithmique: {
    id: "algorithmique",
    titre: "Fiche de logique algorithmique",
    objectif: "Faire comprendre la logique, les etats, les structures et les cas limites.",
    blocsPrioritaires: ["probleme", "entrees/sorties", "structure", "etapes", "cas limites", "flashcards d'interpretation"],
    promptDirectives: [
      "Quand possible, explicite les entrees, sorties, structures de donnees et invariants.",
      "Le schema doit montrer des dependances, etats ou transitions.",
      "Les flashcards doivent tester la logique et les cas limites, pas juste les definitions.",
    ],
    signauxAttendus: ["pseudo-code", "etats", "cas limites", "transitions"],
  },
  "cas-pratique": {
    id: "cas-pratique",
    titre: "Fiche d'application",
    objectif: "Aider a reemployer un raisonnement sur un cas concret ou un probleme type.",
    blocsPrioritaires: ["regle", "cas d'application", "methode", "exceptions", "erreurs typiques", "flashcards de situation"],
    promptDirectives: [
      "La fiche doit faire ressortir quand appliquer la regle et comment raisonner.",
      "Ajoute un exemple concret proche d'un cas d'examen ou de TD.",
      "Le schema doit montrer la prise de decision ou l'arbre de choix si le contenu le permet.",
    ],
    signauxAttendus: ["conditions", "cas", "exceptions", "decision"],
  },
  concepts: {
    id: "concepts",
    titre: "Fiche de notions",
    objectif: "Clarifier les notions pivots, leurs liens et leurs distinctions.",
    blocsPrioritaires: ["idee centrale", "definitions", "distinctions", "exemple", "pieges", "flashcards de comprehension"],
    promptDirectives: [
      "La fiche doit faire comprendre les idees pivots et leur articulation.",
      "Le schema doit montrer des relations entre concepts, pas juste une decoration.",
      "Les notions cles doivent etre celles sans lesquelles on ne peut pas reconstituer le cours.",
    ],
    signauxAttendus: ["definitions", "distinctions", "articulations"],
  },
  taxonomie: {
    id: "taxonomie",
    titre: "Fiche de classification",
    objectif: "Faire memoriser une organisation en familles, types ou niveaux.",
    blocsPrioritaires: ["idee directrice", "categories", "sous-categories", "criteres", "exemples typiques", "flashcards de classement"],
    promptDirectives: [
      "Fais apparaitre la structure en familles et sous-familles.",
      "Le schema doit ressembler a une arborescence ou a un classement organise.",
      "Les erreurs de confusion entre categories doivent etre explicites.",
    ],
    signauxAttendus: ["categories", "sous-categories", "criteres"],
  },
};

export function selectPedagogicalBlueprint(
  profile: DocumentProfile,
  inventory: ContentInventory,
): PedagogicalBlueprint {
  const id = profile.blueprint_recommande ?? inferByInventory(profile, inventory);
  return BLUEPRINTS[id];
}
