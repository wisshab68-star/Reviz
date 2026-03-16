import { openai } from "@/lib/openai";
import { DETECT_PROFILE_SYSTEM, buildDetectProfilePrompt } from "@/lib/prompts/detect-profile";
import { buildInventorySystemPrompt, buildInventoryUserPrompt } from "@/lib/prompts/generate-inventory";
import { buildSheetSystemPrompt, buildSheetUserPrompt } from "@/lib/prompts/generate-sheet";
import { buildCoveragePrompt, buildCompletionPrompt } from "@/lib/prompts/verify-coverage";
import { selectPedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import { evaluatePedagogicalQuality } from "@/lib/pedagogy/quality-gates";
import {
  extractFormulaCandidates,
  formulasEquivalent,
  normalizeDocumentText,
  normalizeFormulaText,
  sanitizeAiJsonValue,
} from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { FicheGeneree } from "@/types/fiche-generated";
import type {
  ContentInventory,
  CoverageReport,
  DocumentProfile,
  InventoryDefinition,
  InventoryExample,
  InventoryFormula,
  InventoryMethod,
  InventoryPart,
  InventoryProperty,
  InventoryTheorem,
  InventoryTrap,
  PedagogicalFamily,
  RevisionObjective,
} from "@/types/generation-pipeline";
import type { PedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";

function cleanJsonResponse(raw: string): string {
  const stripped = raw.replace(/```json|```/g, "").trim();
  // Fix unescaped LaTeX backslashes: AI generates \mathbb, \sqrt, \leq etc. as a single backslash
  // which is invalid JSON. Double any \ not followed by a valid JSON single-char escape.
  // Valid JSON escapes after \: " \ / b f n r t u  — everything else needs doubling.
  return stripped
    .replace(/\\\\/g, "\x00DB\x00")
    .replace(/\\(?!["\\/bfnrtu])/g, "\\\\")
    .replace(/\x00DB\x00/g, "\\\\");
}

function normalizeKey(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = normalizeKey(getKey(item));
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }

  return result;
}

/**
 * Detects raw PDF fragment artifacts that the AI failed to reconstruct.
 * These are strings that look like mid-sentence fragments, all-caps headings,
 * or variable names without proper LaTeX subscripts.
 */
function isCorruptedEntry(text: string): boolean {
  const t = text.trim();
  if (!t) return true;
  // Starts with punctuation — mid-sentence fragment
  if (/^[),;.]/.test(t)) return true;
  // All-caps section header (e.g. "COURS TERMINALE S LES SUITES")
  if (/^[A-Z][A-Z\s\-:]{12,}$/.test(t)) return true;
  // Raw subscript-less variable pattern: "u n", "v n", "a n" without LaTeX
  if (/\b[uvwab]\s+[nk]\b/i.test(t) && !/_[{(]/.test(t)) return true;
  // Truncated mid-expression: ends with "(u n" or "u n" or "la suite (u"
  if (/\(u\s*n\s*$|\bu\s+n\s*$|\bv\s+n\s*$/i.test(t)) return true;
  return false;
}

export function sanitizeFicheOutput(sheet: FicheGeneree): FicheGeneree {
  return {
    ...sheet,
    notionsCles: (sheet.notionsCles ?? []).filter((e) => !isCorruptedEntry(e)).slice(0, 6),
    formulesCles: (sheet.formulesCles ?? []).filter((e) => !isCorruptedEntry(e)).slice(0, 8),
    proprietesCles: (sheet.proprietesCles ?? []).filter((e) => !isCorruptedEntry(e)).slice(0, 8),
    flashcards: sheet.flashcards
      .filter((fc) => !isCorruptedEntry(fc.question) && !isCorruptedEntry(fc.reponse))
      .slice(0, 6),
  };
}

function isLikelyHeading(paragraph: string) {
  const trimmed = paragraph.trim();
  if (!trimmed) return false;

  return /^(partie|chapitre|section|lecon|cours)\s+\d+/i.test(trimmed)
    || /^\d+[\)\.\-:]\s+/.test(trimmed)
    || /^[IVXLC]+\s*[\)\.\-:]\s+/.test(trimmed)
    || /^[A-Z0-9][A-Z0-9\s\-,'():]{8,}$/.test(trimmed);
}

function splitIntoSemanticChunks(sourceText: string, maxChars = 9000) {
  if (sourceText.length <= maxChars) {
    return [sourceText];
  }

  const paragraphs = sourceText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) {
    return [sourceText];
  }

  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
    const shouldBreakBefore =
      current.length > 0 && (candidate.length > maxChars || isLikelyHeading(paragraph));

    if (shouldBreakBefore) {
      chunks.push(current);
      current = paragraph;
      continue;
    }

    current = candidate;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks.filter(Boolean);
}

function mergeStringLists(primary: string[], secondary: string[]) {
  return dedupeByKey([...primary, ...secondary], (item) => item);
}

function mergeInventoryPart(primary: InventoryPart, secondary: InventoryPart): InventoryPart {
  return {
    titre: primary.titre || secondary.titre,
    definitions: dedupeByKey(
      [...primary.definitions, ...secondary.definitions],
      (item: InventoryDefinition) => `${item.terme} ${item.enonce}`,
    ),
    proprietes: dedupeByKey(
      [...primary.proprietes, ...secondary.proprietes],
      (item: InventoryProperty) => `${item.nom} ${item.enonce} ${item.conditions}`,
    ),
    formules: dedupeByKey(
      [...primary.formules, ...secondary.formules],
      (item: InventoryFormula) => `${item.nom} ${item.expression} ${item.variables}`,
    ),
    theoremes: dedupeByKey(
      [...primary.theoremes, ...secondary.theoremes],
      (item: InventoryTheorem) => `${item.nom} ${item.enonce}`,
    ),
    methodes: dedupeByKey(
      [...primary.methodes, ...secondary.methodes],
      (item: InventoryMethod) => `${item.titre} ${item.etapes.join(" ")}`,
    ),
    exemples: dedupeByKey(
      [...primary.exemples, ...secondary.exemples],
      (item: InventoryExample) => `${item.enonce} ${item.resolution}`,
    ),
    pieges: dedupeByKey(
      [...primary.pieges, ...secondary.pieges],
      (item: InventoryTrap) => `${item.description} ${item.correction}`,
    ),
    remarques: mergeStringLists(primary.remarques, secondary.remarques),
  };
}

function mergeInventories(inventories: ContentInventory[]): ContentInventory {
  const mergedParts = new Map<string, InventoryPart>();
  const titleCandidates: string[] = [];
  const vocabulaire: string[] = [];
  const formules: string[] = [];
  const points: string[] = [];

  for (const inventory of inventories) {
    if (inventory.titre) {
      titleCandidates.push(inventory.titre);
    }

    vocabulaire.push(...inventory.vocabulaire_cle);
    formules.push(...inventory.formules_importantes);
    points.push(...inventory.points_a_retenir);

    for (const part of inventory.parties) {
      const key = normalizeKey(part.titre || `part-${mergedParts.size + 1}`);
      const existing = mergedParts.get(key);
      mergedParts.set(key, existing ? mergeInventoryPart(existing, part) : part);
    }
  }

  return {
    titre: titleCandidates[0] ?? "",
    parties: Array.from(mergedParts.values()),
    vocabulaire_cle: mergeStringLists(vocabulaire, []),
    formules_importantes: mergeStringLists(formules, []),
    points_a_retenir: mergeStringLists(points, []),
  };
}

function inferPedagogicalFamilyFromProfile(raw: Partial<DocumentProfile>): PedagogicalFamily {
  const subject = `${raw.matiere ?? ""} ${raw.sous_domaine ?? ""}`.toLowerCase();
  const types = (raw.type_contenu ?? []).join(" ").toLowerCase();

  if (/(informat|algorithm|pseudo|code|automate|complexit|etat|transition)/.test(subject + types)) {
    return "algorithmique";
  }
  if (/(histoire|memoire|chronolog|periode|frise|guerre|revolution|temps|date)/.test(subject + types)) {
    return "chronologique";
  }
  if (/(svt|biolog|chimie|cycle|processus|mecanisme|enzyme|organite|photosynth)/.test(subject + types)) {
    return "processus";
  }
  if (/(cas pratique|jurisprudence|diagnostic|consultation|client|patient|application|decision)/.test(subject + types)) {
    return "cas-pratique";
  }
  if (/(classification|categorie|typologie|famille|sous-famille|taxonomie)/.test(subject + types)) {
    return "taxonomique";
  }
  if (/(math|physique|formule|theoreme|demonstration|preuve|critere|calcul)/.test(subject + types)) {
    return "formel";
  }
  if (/(langue|compar|classification|typologie|histoire comparee)/.test(subject + types)) {
    return "comparatif";
  }

  return "conceptuel";
}

function inferRevisionObjective(raw: Partial<DocumentProfile>): RevisionObjective {
  const context = `${raw.matiere ?? ""} ${raw.sous_domaine ?? ""} ${(raw.type_contenu ?? []).join(" ")}`.toLowerCase();
  const family = raw.famille_pedagogique ?? inferPedagogicalFamilyFromProfile(raw);

  if (family === "algorithmique") {
    return "programmer";
  }
  if (family === "chronologique") {
    return "rediger";
  }
  if (family === "comparatif" || family === "taxonomique") {
    return "comparer";
  }
  if (family === "cas-pratique") {
    return "raisonner";
  }
  if (family === "processus") {
    return /(schema|etapes|cycle|mecanisme|cause)/.test(context) ? "analyser" : "memoriser";
  }
  if (family === "formel") {
    return /(exercice|resolution|equation|derivee|integration|geometr|probabilit)/.test(context) ? "resoudre" : "raisonner";
  }

  return /(dissertation|commentaire|these|argument|debats|analyse)/.test(context) ? "rediger" : "memoriser";
}

function inferPrecisionLevelFromAcademicLevel(raw: Partial<DocumentProfile>): DocumentProfile["niveau_precision"] {
  const level = (raw.niveau ?? "").toLowerCase();

  if (/(6e|5e|4e|3e|college|debutant|introduction|initiation)/.test(level)) {
    return "introductif";
  }
  if (/(master 2|m2|doctorat|cpge|agreg|concours|avance|expert)/.test(level)) {
    return "expert";
  }
  if (/(terminale|l3|licence 3|master 1|m1|avance)/.test(level)) {
    return "avance";
  }

  return "standard";
}

function buildSheetClassification(
  profile: DocumentProfile,
  blueprint?: PedagogicalBlueprint,
) {
  return {
    matiere: profile.matiere,
    niveau: profile.niveau,
    type: blueprint?.id ?? profile.famille_pedagogique,
  };
}

async function detectProfile(sourceText: string): Promise<DocumentProfile> {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 500,
    messages: [
      { role: "system", content: DETECT_PROFILE_SYSTEM },
      { role: "user", content: buildDetectProfilePrompt(sourceText) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(cleanJsonResponse(raw)) as DocumentProfile;

  if (!parsed.matiere || !parsed.niveau) {
    return {
      matiere: parsed.matiere || "Cours",
      sous_domaine: parsed.sous_domaine || "",
      niveau: parsed.niveau || "General",
      famille_pedagogique: inferPedagogicalFamilyFromProfile(parsed),
      niveau_precision: inferPrecisionLevelFromAcademicLevel(parsed),
      objectif_revision: inferRevisionObjective(parsed),
      type_contenu: parsed.type_contenu ?? [],
      contient_formules: parsed.contient_formules ?? false,
      contient_demonstrations: parsed.contient_demonstrations ?? false,
      contient_schemas: parsed.contient_schemas ?? false,
      langue: parsed.langue || "francais",
      densite: parsed.densite || "moyenne",
    };
  }

  return {
    ...parsed,
    famille_pedagogique: parsed.famille_pedagogique ?? inferPedagogicalFamilyFromProfile(parsed),
    niveau_precision: parsed.niveau_precision ?? inferPrecisionLevelFromAcademicLevel(parsed),
    objectif_revision: parsed.objectif_revision ?? inferRevisionObjective(parsed),
  };
}

async function generateInventory(
  sourceText: string,
  profile: DocumentProfile,
): Promise<ContentInventory> {
  const chunks = splitIntoSemanticChunks(sourceText);

  if (chunks.length === 1) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.15,
      max_tokens: 8000,
      messages: [
        { role: "system", content: buildInventorySystemPrompt(profile) },
        { role: "user", content: buildInventoryUserPrompt(sourceText) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(cleanJsonResponse(raw)) as ContentInventory;

    return {
      titre: parsed.titre || "",
      parties: Array.isArray(parsed.parties) ? parsed.parties : [],
      vocabulaire_cle: Array.isArray(parsed.vocabulaire_cle) ? parsed.vocabulaire_cle : [],
      formules_importantes: Array.isArray(parsed.formules_importantes) ? parsed.formules_importantes : [],
      points_a_retenir: Array.isArray(parsed.points_a_retenir) ? parsed.points_a_retenir : [],
    };
  }

  const inventories: ContentInventory[] = [];

  for (const [index, chunk] of chunks.entries()) {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      max_tokens: 5000,
      messages: [
        {
          role: "system",
          content: `${buildInventorySystemPrompt(profile)}

CONTEXTE SUPPLEMENTAIRE :
Tu traites seulement un extrait du document complet (${index + 1}/${chunks.length}).
Tu dois etre exhaustif sur cet extrait, sans supposer que d'autres parties seront re-analysees plus tard.
Conserve les titres de parties et les formules exactement quand elles apparaissent.`,
        },
        { role: "user", content: buildInventoryUserPrompt(chunk) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(cleanJsonResponse(raw)) as ContentInventory;
    inventories.push({
      titre: parsed.titre || "",
      parties: Array.isArray(parsed.parties) ? parsed.parties : [],
      vocabulaire_cle: Array.isArray(parsed.vocabulaire_cle) ? parsed.vocabulaire_cle : [],
      formules_importantes: Array.isArray(parsed.formules_importantes) ? parsed.formules_importantes : [],
      points_a_retenir: Array.isArray(parsed.points_a_retenir) ? parsed.points_a_retenir : [],
    });
  }

  return mergeInventories(inventories);
}

function countInventoryElements(inventory: ContentInventory): number {
  let count = 0;
  for (const part of inventory.parties) {
    count += (part.definitions?.length ?? 0);
    count += (part.proprietes?.length ?? 0);
    count += (part.formules?.length ?? 0);
    count += (part.theoremes?.length ?? 0);
    count += (part.methodes?.length ?? 0);
    count += (part.exemples?.length ?? 0);
    count += (part.pieges?.length ?? 0);
    count += (part.remarques?.length ?? 0);
  }
  count += inventory.vocabulaire_cle.length;
  count += inventory.formules_importantes.length;
  count += inventory.points_a_retenir.length;
  return count;
}

function isStrictFormulaCourse(
  profile: DocumentProfile,
  blueprint: PedagogicalBlueprint,
  strictFormulas: string[],
) {
  return strictFormulas.length >= 2
    && (profile.contient_formules || profile.famille_pedagogique === "formel" || blueprint.id === "formulaire");
}

function isHighConfidenceStrictFormula(formula: string) {
  const normalized = normalizeFormulaText(formula);

  if (!normalized || normalized.length < 5 || normalized.length > 120) {
    return false;
  }

  if (!normalized.includes("=")) {
    return false;
  }

  if (/^(partie|chapitre|section|cours|definition|methode|propriete)\b/i.test(normalized)) {
    return false;
  }

  const tokenCount = normalized.split(/\s+/).length;
  const longWordCount = normalized.match(/[A-Za-zÀ-ÿ]{5,}/g)?.length ?? 0;
  const operatorCount = normalized.match(/[=+\-*/^<>]/g)?.length ?? 0;
  const containsMathMarker = /\b(?:u_n|v_n|w_n|f\(x\)|g\(x\)|lim|sqrt|ln|exp|e\^|q\^n|n\+1|n-1)\b/i.test(normalized);

  if (tokenCount > 14 && operatorCount < 3 && !containsMathMarker) {
    return false;
  }

  if (longWordCount >= 6 && !containsMathMarker) {
    return false;
  }

  return operatorCount >= 1;
}

function collectStrictFormulas(
  inventory: ContentInventory,
  sourceText: string,
  profile: DocumentProfile,
  blueprint: PedagogicalBlueprint,
) {
  if (!profile.contient_formules && profile.famille_pedagogique !== "formel" && blueprint.id !== "formulaire") {
    return [] as string[];
  }

  const inventoryFormulas = [
    ...inventory.formules_importantes,
    ...inventory.parties.flatMap((part) => part.formules.map((formula) => formula.expression)),
  ]
    .map((formula) => normalizeFormulaText(formula))
    .filter(isHighConfidenceStrictFormula);

  const sourceFormulas = extractFormulaCandidates(sourceText)
    .map((formula) => normalizeFormulaText(formula))
    .filter(isHighConfidenceStrictFormula);

  return dedupeByKey(
    [
      ...inventoryFormulas,
      ...sourceFormulas,
    ],
    (formula) => normalizeFormulaText(formula),
  ).slice(0, 8);
}

function getFormulaLeftSide(formula: string) {
  const normalized = normalizeFormulaText(formula);
  if (!normalized) {
    return "";
  }

  const equalIndex = normalized.indexOf(" = ");
  if (equalIndex >= 0) {
    return normalized.slice(0, equalIndex).trim();
  }

  return normalized.slice(0, 32).trim();
}

function collectSheetFormulaCandidates(sheet: FicheGeneree) {
  const sections = sheet.blueprintSections;
  const textPool = [
    ...(sheet.formulesCles ?? []),
    ...(sheet.proprietesCles ?? []),
    ...(sheet.notionsCles ?? []),
    sheet.definition,
    sheet.exemple,
    sheet.piege,
    sheet.feynman,
    sheet.imageMentale.texte,
    ...sheet.flashcards.flatMap((card) => [card.question, card.reponse]),
    ...(sections?.tableauSynthese?.flatMap((row) => [row.titre, row.contenu]) ?? []),
    ...(sections?.applications?.flatMap((row) => [row.titre, row.contenu]) ?? []),
    ...(sections?.etapesCles?.flatMap((step) => [step.titre, step.contenu]) ?? []),
    ...(sections?.casLimites ?? []),
    ...(sections?.pseudoCode?.flatMap((step) => [step.ligne, step.explication ?? ""]) ?? []),
    ...(sections?.reperes?.flatMap((repere) => [repere.titre, repere.detail]) ?? []),
    ...(sections?.classifications?.flatMap((node) => [node.categorie, ...node.elements]) ?? []),
    ...sheet.schema.elements.map((element) => element.label),
    ...sheet.schema.connexions.map((connexion) => connexion.label ?? ""),
  ].filter(Boolean);

  return dedupeByKey(
    extractFormulaCandidates(textPool.join("\n")),
    (formula) => normalizeFormulaText(formula),
  );
}

function evaluateStrictFormulaIntegrity(expected: string[], actual: string[]) {
  const expectedFormulas = dedupeByKey(expected, (formula) => normalizeFormulaText(formula));
  const actualFormulas = dedupeByKey(actual, (formula) => normalizeFormulaText(formula));
  const actualByLeftSide = new Map<string, string[]>();

  for (const formula of actualFormulas) {
    const leftSide = getFormulaLeftSide(formula);
    if (!leftSide) {
      continue;
    }
    actualByLeftSide.set(leftSide, [...(actualByLeftSide.get(leftSide) ?? []), formula]);
  }

  const preserved: string[] = [];
  const altered: string[] = [];
  const missing: string[] = [];

  for (const formula of expectedFormulas) {
    if (actualFormulas.some((candidate) => formulasEquivalent(formula, candidate))) {
      preserved.push(formula);
      continue;
    }

    const leftSide = getFormulaLeftSide(formula);
    if (leftSide && (actualByLeftSide.get(leftSide)?.length ?? 0) > 0) {
      altered.push(formula);
      continue;
    }

    missing.push(formula);
  }

  return {
    score: expectedFormulas.length === 0 ? 1 : preserved.length / expectedFormulas.length,
    preserved,
    altered,
    missing,
  };
}

async function generateSheetFromInventory(
  inventory: ContentInventory,
  sourceText: string,
  profile: DocumentProfile,
  blueprint = selectPedagogicalBlueprint(profile, inventory),
  strictFormulas: string[] = [],
): Promise<FicheGeneree> {
  const inventoryJSON = JSON.stringify(inventory, null, 2);

  const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.25,
        max_tokens: 6000,
        messages: [
          { role: "system", content: buildSheetSystemPrompt(profile, blueprint) },
          { role: "user", content: buildSheetUserPrompt(inventoryJSON, sourceText, profile, blueprint, strictFormulas) },
        ],
      });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = cleanJsonResponse(raw);
    const parsed = sanitizeAiJsonValue(JSON.parse(cleaned)) as FicheGeneree;
    return {
    ...parsed,
    classification: parsed.classification ?? buildSheetClassification(profile, blueprint),
    blueprintId: blueprint.id,
    objectifRevision: profile.objectif_revision,
    notionsCles: parsed.notionsCles ?? [],
      formulesCles: parsed.formulesCles ?? [],
      proprietesCles: parsed.proprietesCles ?? [],
    };
  }

async function verifyCoverage(
  sheet: FicheGeneree,
  inventory: ContentInventory,
): Promise<CoverageReport> {
  const inventoryJSON = JSON.stringify(inventory, null, 2);
  const sheetJSON = JSON.stringify(sheet, null, 2);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.1,
    max_tokens: 2000,
    messages: [
      {
        role: "system",
        content: "Tu es un verificateur pedagogique rigoureux. Tu reponds UNIQUEMENT en JSON valide.",
      },
      { role: "user", content: buildCoveragePrompt(inventoryJSON, sheetJSON) },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = JSON.parse(cleanJsonResponse(raw)) as CoverageReport;

  return {
    score: typeof parsed.score === "number" ? Math.max(0, Math.min(1, parsed.score)) : 0,
    missing: Array.isArray(parsed.missing) ? parsed.missing : [],
    incomplete: Array.isArray(parsed.incomplete) ? parsed.incomplete : [],
  };
}

async function completeSheet(
  missing: string[],
  incomplete: string[],
  currentSheet: FicheGeneree,
  sourceText: string,
  profile: DocumentProfile,
  inventory: ContentInventory,
  remediation: string[] = [],
  strictFormulas: string[] = [],
): Promise<FicheGeneree> {
  const currentSheetJSON = JSON.stringify(currentSheet, null, 2);
  const blueprint = selectPedagogicalBlueprint(profile, inventory);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0.25,
    max_tokens: 6000,
    messages: [
      { role: "system", content: buildSheetSystemPrompt(profile, blueprint) },
      {
        role: "user",
        content: buildCompletionPrompt(missing, incomplete, currentSheetJSON, sourceText, remediation, strictFormulas),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = sanitizeAiJsonValue(JSON.parse(cleanJsonResponse(raw))) as FicheGeneree;
  return {
    ...parsed,
    classification: parsed.classification ?? currentSheet.classification ?? buildSheetClassification(profile, blueprint),
    blueprintId: parsed.blueprintId ?? currentSheet.blueprintId,
    objectifRevision: parsed.objectifRevision ?? currentSheet.objectifRevision,
    notionsCles: parsed.notionsCles ?? currentSheet.notionsCles ?? [],
    formulesCles: parsed.formulesCles ?? currentSheet.formulesCles ?? [],
    proprietesCles: parsed.proprietesCles ?? currentSheet.proprietesCles ?? [],
  };
}

export async function generateWithPipeline(input: GenerateSheetRequest): Promise<FicheGeneree> {
  const sourceText = normalizeDocumentText(input.content);

  // Etape 1 : Detection du profil
  console.log("[Pipeline] Etape 1/4 : Detection du profil...");
  const profile = await detectProfile(sourceText);
  console.log(
    `[Pipeline] Profil detecte : ${profile.matiere} / ${profile.sous_domaine} / ${profile.niveau} / ${profile.famille_pedagogique} / precision=${profile.niveau_precision} / densite: ${profile.densite}`,
  );

  // Etape 2 : Inventaire exhaustif
  console.log("[Pipeline] Etape 2/4 : Inventaire exhaustif...");
  const inventory = await generateInventory(sourceText, profile);
  const elementCount = countInventoryElements(inventory);
  console.log(`[Pipeline] Inventaire : ${inventory.parties.length} parties, ${elementCount} elements totaux`);

  if (elementCount === 0) {
    console.warn("[Pipeline] Inventaire vide, le modele n'a pas pu extraire de contenu.");
    throw new Error("L'inventaire du document est vide. Le contenu n'a pas pu etre analyse.");
  }

  const blueprint = selectPedagogicalBlueprint(profile, inventory);
  profile.blueprint_recommande = blueprint.id;
  console.log(`[Pipeline] Blueprint retenu : ${blueprint.id} (${blueprint.titre})`);
  const strictFormulas = collectStrictFormulas(inventory, sourceText, profile, blueprint);
  const strictFormulaMode = isStrictFormulaCourse(profile, blueprint, strictFormulas);
  console.log(`[Pipeline] Formules strictes retenues : ${strictFormulas.length}`);

  // Etape 3 : Generation de la fiche
  console.log("[Pipeline] Etape 3/4 : Generation de la fiche...");
  let sheet = await generateSheetFromInventory(inventory, sourceText, profile, blueprint, strictFormulas);

  // Etape 4 : Verification de couverture + completion
  console.log("[Pipeline] Etape 4/4 : Verification de couverture et qualite pedagogique...");
  let bestSheet = sheet;
  let bestScore = 0;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const coverage = await verifyCoverage(sheet, inventory);
    const pedagogy = evaluatePedagogicalQuality(profile, inventory, sheet, blueprint);
    const formulaIntegrity = evaluateStrictFormulaIntegrity(strictFormulas, collectSheetFormulaCandidates(sheet));
    const combinedScore = strictFormulaMode
      ? (coverage.score * 0.5) + (pedagogy.score * 0.3) + (formulaIntegrity.score * 0.2)
      : (coverage.score * 0.65) + (pedagogy.score * 0.35);
    console.log(
      `[Pipeline] Tentative ${attempt}/${maxAttempts} : couverture=${coverage.score.toFixed(2)}, qualite=${pedagogy.score.toFixed(2)}, formules=${formulaIntegrity.score.toFixed(2)}, combine=${combinedScore.toFixed(2)}, manquants=${coverage.missing.length}, incomplets=${coverage.incomplete.length}, issues=${pedagogy.issues.length}, formules-manquantes=${formulaIntegrity.missing.length}, formules-alterees=${formulaIntegrity.altered.length}`,
    );

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestSheet = sheet;
    }

    if (
      coverage.score >= 0.88
      && pedagogy.score >= 0.78
      && (!strictFormulaMode || (formulaIntegrity.score >= 0.78 && formulaIntegrity.altered.length <= 1))
    ) {
      console.log("[Pipeline] Fiche acceptee : couverture et qualite pedagogique suffisantes.");
      return sanitizeFicheOutput(sheet);
    }

    if (attempt === maxAttempts) {
      if (
        strictFormulaMode
        && strictFormulas.length >= 3
        && (formulaIntegrity.score < 0.45 || formulaIntegrity.altered.length >= 3)
      ) {
        const details = [
          ...formulaIntegrity.altered.map((formula) => `Formule alteree : ${formula}`),
          ...formulaIntegrity.missing.map((formula) => `Formule manquante : ${formula}`),
        ].join(" | ");
        throw new Error(`STRICT_FORMULA_INTEGRITY_FAILED: ${details || "Les formules du document n'ont pas ete preservees."}`);
      }

      console.warn(`[Pipeline] Score final ${bestScore.toFixed(2)} apres ${maxAttempts} tentatives. Acceptation du meilleur resultat.`);
      return sanitizeFicheOutput(bestSheet);
    }

    const remediation = [
      ...pedagogy.missingExpected,
      ...pedagogy.issues,
      ...pedagogy.remediation,
      ...pedagogy.weakNotions.map((notion) => `Remplacer ou retirer la notion cle faible : ${notion}`),
      ...formulaIntegrity.missing.map((formula) => `Ajouter exactement la formule source suivante, sans la re-ecrire : ${formula}`),
      ...formulaIntegrity.altered.map((formula) => `Corriger la formule alteree en recopiant exactement la formule source : ${formula}`),
    ];

    if (coverage.score < 0.70 || pedagogy.score < 0.55 || (strictFormulaMode && formulaIntegrity.score < 0.55)) {
      console.log("[Pipeline] Fiche trop faible, regeneration complete...");
      sheet = await generateSheetFromInventory(inventory, sourceText, profile, blueprint, strictFormulas);
    } else {
      console.log("[Pipeline] Completion ciblee sur les zones faibles...");
      try {
        sheet = await completeSheet(
          coverage.missing,
          coverage.incomplete,
          sheet,
          sourceText,
          profile,
          inventory,
          remediation,
          strictFormulas,
        );
      } catch (completionError) {
        console.warn("[Pipeline] Completion ciblee echouee, tentative de regeneration.", completionError);
        sheet = await generateSheetFromInventory(inventory, sourceText, profile, blueprint, strictFormulas);
      }
    }
  }

  return sanitizeFicheOutput(bestSheet);
}
