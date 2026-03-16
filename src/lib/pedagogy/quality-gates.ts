import type { FicheGeneree } from "@/types/fiche-generated";
import type {
  ContentInventory,
  DocumentProfile,
  PedagogicalQualityReport,
} from "@/types/generation-pipeline";
import type { PedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";

const META_NOTIONS = new Set([
  "chapitre",
  "cours",
  "methode",
  "notion",
  "definition",
  "exemple",
  "partie",
  "resume",
  "introduction",
  "conclusion",
]);

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildRelevantConceptSet(inventory: ContentInventory) {
  const concepts = new Set<string>();

  for (const concept of inventory.vocabulaire_cle) {
    concepts.add(normalize(concept));
  }

  for (const part of inventory.parties) {
    if (part.titre) {
      concepts.add(normalize(part.titre));
    }
    for (const definition of part.definitions) {
      concepts.add(normalize(definition.terme));
    }
    for (const property of part.proprietes) {
      concepts.add(normalize(property.nom));
    }
    for (const theorem of part.theoremes) {
      concepts.add(normalize(theorem.nom));
    }
    for (const method of part.methodes) {
      concepts.add(normalize(method.titre));
    }
  }

  return concepts;
}

function countInventoryItems(inventory: ContentInventory) {
  return inventory.parties.reduce((total, part) => {
    return total
      + part.definitions.length
      + part.proprietes.length
      + part.formules.length
      + part.theoremes.length
      + part.methodes.length
      + part.exemples.length
      + part.pieges.length;
  }, 0);
}

export function evaluatePedagogicalQuality(
  profile: DocumentProfile,
  inventory: ContentInventory,
  sheet: FicheGeneree,
  blueprint: PedagogicalBlueprint,
): PedagogicalQualityReport {
  const issues: string[] = [];
  const missingExpected: string[] = [];
  const weakNotions: string[] = [];
  const remediation: string[] = [];
  let score = 1;

  const relevantConcepts = buildRelevantConceptSet(inventory);
  const notions = sheet.notionsCles ?? [];
  const sections = sheet.blueprintSections ?? {};

  for (const notion of notions) {
    const normalized = normalize(notion);
    if (!normalized || META_NOTIONS.has(normalized) || !relevantConcepts.has(normalized)) {
      weakNotions.push(notion);
    }
  }

  if (weakNotions.length > 0) {
    issues.push("Certaines notions cles semblent hors-sujet, meta ou trop faibles.");
    remediation.push("Remplacer les notions cles faibles par des notions pivots presentes dans le document.");
    score -= Math.min(0.18, weakNotions.length * 0.04);
  }

  if (notions.length < 4) {
    missingExpected.push("Au moins 4 notions pivots pour reconstruire le chapitre.");
    remediation.push("Ajouter plus de notions centrales et retirer les termes trop faibles.");
    score -= 0.08;
  }

  if (notions.length > 8) {
    issues.push("Les notions cles sont trop nombreuses et perdent leur role de repere central.");
    remediation.push("Limiter les notions cles aux 4-8 notions indispensables.");
    score -= 0.05;
  }

  const inventoryItems = countInventoryItems(inventory);
  const denseCourse = inventoryItems >= 12 || profile.densite === "elevee";
  const expectedFlashcards = denseCourse ? 6 : 4;
  if (sheet.flashcards.length < expectedFlashcards) {
    missingExpected.push(`Au moins ${expectedFlashcards} flashcards utiles pour une revision de ce chapitre.`);
    remediation.push("Ajouter plus de flashcards variees : distinction, application, piege, methode.");
    score -= 0.08;
  }

  if (sheet.imageMentale.texte.trim().length < 90) {
    issues.push("L'image mentale est trop faible ou trop courte pour servir de levier de memorisation.");
    remediation.push("Construire une image mentale plus concrete, plus frappante et plus specifique au cours.");
    score -= 0.08;
  }

  if (sheet.schema.elements.length < 5 && inventoryItems >= 8) {
    missingExpected.push("Un schema plus riche et plus structure pour couvrir le coeur du cours.");
    remediation.push("Ajouter un schema avec davantage d'elements et de relations utiles.");
    score -= 0.1;
  }

  if (blueprint.id === "formulaire") {
    if ((sheet.formulesCles?.length ?? 0) < 3) {
      missingExpected.push("Un veritable noyau de formules et relations du chapitre.");
      remediation.push("Faire remonter les formules, conditions et relations centrales du document.");
      score -= 0.12;
    }
    if ((sheet.proprietesCles?.length ?? 0) < 3) {
      missingExpected.push("Les proprietes, criteres ou consequences indispensables du chapitre.");
      remediation.push("Renforcer les proprietes a connaitre et les conditions d'application.");
      score -= 0.08;
    }
    if ((sections.tableauSynthese?.length ?? 0) < 3) {
      missingExpected.push("Un tableau de synthese ou de regles vraiment exploitable.");
      remediation.push("Ajouter un tableau de regles, conditions ou consequences utile pour l'application.");
      score -= 0.08;
    }
    if ((sections.etapesCles?.length ?? 0) < 2) {
      issues.push("La fiche formelle ne propose pas encore de methode claire en etapes.");
      remediation.push("Ajouter une methode concise : identifier, choisir la regle, appliquer, verifier.");
      score -= 0.06;
    }
  }

  if (blueprint.id === "mecanisme" || blueprint.id === "chronologie") {
    if (!sheet.schema.description || sheet.schema.description.length < 40) {
      issues.push("Le schema ne met pas assez en valeur l'enchainement des etapes ou des temporalites.");
      remediation.push("Expliciter la logique d'enchainement dans le schema et dans sa description.");
      score -= 0.08;
    }
  }

  if (blueprint.id === "mecanisme" && (sections.etapesCles?.length ?? 0) < 3) {
    missingExpected.push("Les etapes du mecanisme ne sont pas assez visibles.");
    remediation.push("Faire apparaitre les phases, les acteurs et leurs effets dans un ordre clair.");
    score -= 0.1;
  }

  if (blueprint.id === "chronologie" && (sections.reperes?.length ?? 0) < 3) {
    missingExpected.push("Des reperes chronologiques ou contextuels manquent dans la fiche.");
    remediation.push("Faire remonter les dates, acteurs, bascules et enjeux structurants.");
    score -= 0.1;
  }

  if (blueprint.id === "algorithmique") {
    const flashcardsText = sheet.flashcards
      .map((item) => `${item.question} ${item.reponse}`)
      .join(" ")
      .toLowerCase();
    if (!/(cas limite|complexit|entree|sortie|etat|transition)/.test(flashcardsText)) {
      issues.push("La fiche algorithmique ne teste pas assez les cas limites ou la logique d'execution.");
      remediation.push("Ajouter des cartes sur les entrees, sorties, cas limites, transitions ou complexite.");
      score -= 0.1;
    }
    if ((sections.pseudoCode?.length ?? 0) < 3) {
      missingExpected.push("Une logique de resolution ou un pseudo-code minimal manque a la fiche.");
      remediation.push("Ajouter des etapes de logique, d'execution ou de pseudo-code exploitable.");
      score -= 0.1;
    }
    if ((sections.casLimites?.length ?? 0) < 2) {
      issues.push("La fiche algorithmique ne signale pas assez les cas limites ou les exceptions.");
      remediation.push("Ajouter les cas limites, les erreurs de bord et les hypotheses d'entree.");
      score -= 0.06;
    }
  }

  if (blueprint.id === "comparaison" && (sections.distinctions?.length ?? 0) < 2) {
    missingExpected.push("La fiche devrait faire ressortir plus clairement les distinctions ou les criteres de comparaison.");
    remediation.push("Ajouter des distinctions utiles entre les categories ou notions proches.");
    score -= 0.08;
  }

  if (blueprint.id === "taxonomie" && (sections.classifications?.length ?? 0) < 2) {
    missingExpected.push("L'organisation en categories ou sous-categories n'est pas assez explicite.");
    remediation.push("Ajouter un bloc de classification qui ordonne les familles et leurs sous-ensembles.");
    score -= 0.08;
  }

  if (blueprint.id === "cas-pratique" && (sections.applications?.length ?? 0) < 2) {
    missingExpected.push("La fiche devrait proposer plus d'applications ou de cas concrets.");
    remediation.push("Ajouter des cas types, conditions et decisions a retenir.");
    score -= 0.08;
  }

  if (profile.objectif_revision === "resoudre" && (sheet.exemple.length < 80 || !sheet.exemple.includes(":"))) {
    issues.push("Le bloc exemple reste trop descriptif pour un cours ou il faut surtout savoir appliquer.");
    remediation.push("Transformer l'exemple en mini cas d'application ou methode-type.");
    score -= 0.08;
  }

  if (profile.objectif_revision === "rediger" && (sheet.definition.length < 120 || (sheet.notionsCles?.length ?? 0) < 4)) {
    issues.push("La fiche n'offre pas encore assez de repères pour une restitution redigee.");
    remediation.push("Ajouter plus de notions pivots, de distinctions et de repères argumentatifs.");
    score -= 0.08;
  }

  if (sheet.definition.trim().length < 100) {
    issues.push("La definition centrale reste trop courte pour servir de base au chapitre.");
    remediation.push("Renforcer la definition avec le role de la notion et sa distinction d'une notion proche.");
    score -= 0.06;
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    issues,
    missingExpected,
    weakNotions,
    remediation,
  };
}
