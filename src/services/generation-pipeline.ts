import type Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "@/lib/models";
import { anthropic } from "@/lib/openai";
import { cleanAndClassify, type ClassifiedContent } from "@/lib/prompts/classify-content";
import { DETECT_PROFILE_SYSTEM, buildDetectProfilePrompt } from "@/lib/prompts/detect-profile";
import { buildInventorySystemPrompt, buildInventoryUserPrompt } from "@/lib/prompts/generate-inventory";
import { buildSheetSystemPrompt, buildSheetUserPrompt } from "@/lib/prompts/generate-sheet";
import { buildZonedSheetSystemPrompt, buildZonedSheetUserPrompt } from "@/lib/prompts/generate-zoned-sheet";
import { buildCoveragePrompt, buildCompletionPrompt } from "@/lib/prompts/verify-coverage";
import { selectPedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import { evaluatePedagogicalQuality } from "@/lib/pedagogy/quality-gates";
import { detectSubjectFamily, getSubjectFamilyCaps } from "@/lib/subject-families";
import {
  extractFormulaCandidates,
  formulasEquivalent,
  normalizeFormulaText,
  sanitizeAiJsonValue,
} from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { FicheGeneree, ZonedBlock, ZonedFiche } from "@/types/fiche-generated";
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

type PipelineSheet = FicheGeneree | ZonedFiche;

type PipelineBudget = {
  deadlineAt: number;
  reserveMs: number;
};

const PIPELINE_TOTAL_BUDGET_MS = 50_000;
const PIPELINE_RESERVE_MS = 0;
const MIN_STAGE_TIMEOUT_MS = 5_000;
const ANTHROPIC_RETRYABLE_STATUS_CODES = new Set([429, 503, 529]);
const HAIKU_GENERATION_MODEL = "claude-haiku-4-5-20251001";

function createPipelineBudget(totalMs = PIPELINE_TOTAL_BUDGET_MS, reserveMs = PIPELINE_RESERVE_MS): PipelineBudget {
  return {
    deadlineAt: Date.now() + totalMs,
    reserveMs,
  };
}

function getRemainingBudgetMs(budget?: PipelineBudget): number {
  return budget ? budget.deadlineAt - Date.now() : Number.POSITIVE_INFINITY;
}

function getStageTimeoutMs(
  stage: string,
  preferredMs: number,
  budget?: PipelineBudget,
): number {
  if (!budget) {
    return preferredMs;
  }

  const availableMs = getRemainingBudgetMs(budget) - budget.reserveMs;
  if (availableMs < MIN_STAGE_TIMEOUT_MS) {
    throw new Error(`PIPELINE_BUDGET_EXCEEDED: budget insuffisant avant ${stage}.`);
  }

  return Math.max(MIN_STAGE_TIMEOUT_MS, Math.min(preferredMs, availableMs));
}

async function createAnthropicMessage(
  stage: string,
  params: Parameters<typeof anthropic.messages.create>[0] & { stream?: false },
  preferredTimeoutMs: number,
  budget?: PipelineBudget,
): Promise<Anthropic.Message> {
  const timeout = getStageTimeoutMs(stage, preferredTimeoutMs, budget);

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await anthropic.messages.create(params, {
        timeout,
      }) as unknown as Anthropic.Message;
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error
        ? Number((error as { status?: number }).status)
        : Number.NaN;
      const message = error instanceof Error ? error.message : String(error);
      const isRetryable = ANTHROPIC_RETRYABLE_STATUS_CODES.has(status)
        || /(429|503|529|overloaded|rate limit|temporarily unavailable)/i.test(message);

      if (!isRetryable || attempt === 3) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw new Error(`Anthropic request failed for ${stage}.`);
}

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

function isValidBlockLevel(value: unknown): value is ZonedBlock["level"] {
  return value === "understand" || value === "apply" || value === "trap";
}

function isValidBlockType(value: unknown): value is ZonedBlock["type"] {
  return value === "concept" || value === "formula" || value === "rule" || value === "example" || value === "trap";
}

function validateZonedFicheStructure(data: unknown): data is ZonedFiche {
  if (!data || typeof data !== "object") {
    return false;
  }

  const candidate = data as Record<string, unknown>;
  if (typeof candidate.titre !== "string" || !candidate.titre.trim()) {
    return false;
  }
  if (!Array.isArray(candidate.coreBlocks) || candidate.coreBlocks.length < 1 || candidate.coreBlocks.length > 4) {
    return false;
  }

  for (const block of candidate.coreBlocks) {
    if (!block || typeof block !== "object") {
      return false;
    }

    const typedBlock = block as Record<string, unknown>;
    if (typedBlock.zone !== "core") {
      return false;
    }
    if (!isValidBlockLevel(typedBlock.level) || !isValidBlockType(typedBlock.type)) {
      return false;
    }
    if (typeof typedBlock.title !== "string" || !typedBlock.title.trim()) {
      return false;
    }
    if (typeof typedBlock.content !== "string" || !typedBlock.content.trim()) {
      return false;
    }
  }

  return typeof candidate.anchorDefinition === "string"
    && typeof candidate.actionExample === "string"
    && typeof candidate.actionTrap === "string";
}

function containsMetadataParasite(text: string): boolean {
  // Detection stricte : ISBN, copyright, editeur sont toujours des parasites
  if (/\bISBN\b|©|Copyright/i.test(text)) {
    return true;
  }
  // Detection contextuelle : nom propre + mot-cle scolaire dans le meme texte
  if (
    /[A-Z][a-zà-ÿ]+\s+[A-Z][a-zà-ÿ]+/.test(text)
    && /\b(Sp[eé]cialit[eé]|Terminale|Premi[eè]re|Seconde|Lyc[eé]e|Coll[eè]ge|Professeur|Prof\b|Manuel|[EÉ]ditions?|Acad[eé]mie)\b/i.test(text)
  ) {
    return true;
  }
  return false;
}

function textSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter((word) => word.length > 3));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter((word) => word.length > 3));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++;
  }

  return overlap / Math.max(wordsA.size, wordsB.size);
}

function sanitizeGeneratedSheet(sheet: ZonedFiche): ZonedFiche {
  const subjectFamily = sheet.subjectFamily ?? detectSubjectFamily(sheet.matiere);
  const { formules: formulesCap, flashcards: flashcardsCap } = getSubjectFamilyCaps(subjectFamily);
  const notionsCles = [...(sheet.notionsCles ?? [])];
  const formulesCles = [...(sheet.formulesCles ?? [])];
  const proprietesCles = [...(sheet.proprietesCles ?? [])];
  const result: ZonedFiche = {
    ...sheet,
    coreBlocks: [...sheet.coreBlocks],
    metriques: [...sheet.metriques],
    flashcards: [...sheet.flashcards],
    actionQuiz: sheet.actionQuiz ? [...sheet.actionQuiz] : undefined,
    notionsCles,
    formulesCles,
    proprietesCles,
  };

  if (result.coreBlocks.length > 4) {
    console.warn(`[VALIDATION] coreBlocks tronque de ${result.coreBlocks.length} a 4`);
    result.coreBlocks = result.coreBlocks.slice(0, 4);
  }

  result.coreBlocks = result.coreBlocks.filter((block) => {
    if (containsMetadataParasite(block.content) || containsMetadataParasite(block.title)) {
      console.warn(`[VALIDATION] Bloc parasite supprime : ${block.title}`);
      return false;
    }
    return true;
  });

  result.metriques = result.metriques
    .filter((metric) => !containsMetadataParasite(`${metric.valeur} ${metric.label}`))
    .slice(0, 3);
  result.notionsCles = notionsCles
    .filter((notion) => !containsMetadataParasite(notion))
    .slice(0, 4);
  result.formulesCles = formulesCles
    .filter((formule) => !containsMetadataParasite(formule))
    .slice(0, formulesCap);
  result.proprietesCles = proprietesCles
    .filter((propriete) => !containsMetadataParasite(propriete))
    .slice(0, 4);
  result.flashcards = result.flashcards
    .filter((card) => !containsMetadataParasite(`${card.question} ${card.reponse}`))
    .slice(0, flashcardsCap);
  result.actionQuiz = result.actionQuiz
    ?.filter((card) => !containsMetadataParasite(`${card.question} ${card.reponse}`))
    .slice(0, flashcardsCap);

  const mentalText = `${result.anchorImageMentale?.titre ?? ""} ${result.anchorImageMentale?.texte ?? ""}`;
  const feynmanText = result.feynman ?? "";
  if (textSimilarity(mentalText, feynmanText) > 0.7) {
    console.warn("[VALIDATION] Image mentale et Feynman trop similaires - Feynman remplace.");
    result.feynman = "Imagine que tu expliques ce chapitre a un ami qui n'a jamais suivi ce cours. Par ou commencerais-tu ? Qu'est-ce qui est le plus important a retenir pour l'examen ?";
  }

  return result;
}

function convertZonedToLegacy(zoned: ZonedFiche): ZonedFiche {
  return {
    ...zoned,
    imageMentale: zoned.anchorImageMentale,
    definition: zoned.anchorDefinition,
    exemple: zoned.actionExample,
    piege: zoned.actionTrap,
    flashcards: zoned.flashcards ?? zoned.actionQuiz ?? [],
  };
}

export function sanitizeFicheOutput<T extends PipelineSheet>(sheet: T): T {
  const isParasiteOrCorrupt = (text: string) => isCorruptedEntry(text) || containsMetadataParasite(text);
  const subjectFamily = sheet.subjectFamily ?? detectSubjectFamily(sheet.matiere);
  const { formules: formulesCap, flashcards: flashcardsCap } = getSubjectFamilyCaps(subjectFamily);

  return {
    ...sheet,
    subjectFamily,
    notionsCles: (sheet.notionsCles ?? []).filter((e) => !isParasiteOrCorrupt(e)).slice(0, 4),
    formulesCles: (sheet.formulesCles ?? []).filter((e) => !isParasiteOrCorrupt(e)).slice(0, formulesCap),
    proprietesCles: (sheet.proprietesCles ?? []).filter((e) => !isParasiteOrCorrupt(e)).slice(0, 4),
    flashcards: sheet.flashcards
      .filter((fc) => !isParasiteOrCorrupt(fc.question) && !isParasiteOrCorrupt(fc.reponse))
      .slice(0, flashcardsCap),
  } as T;
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

function cleanFilename(filename: string) {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/^\d+[\s\-_.]+/, "")
    .replace(/^[a-z0-9]+-\d+-?/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function inferSubjectFromSourceText(sourceText: string): string {
  const lower = sourceText.toLowerCase();

  if (
    /\b(fonction|fonctions|derivee|derivees|primitive|primitives|integrale|integrales|limite|limites|suite|suites|vecteur|vecteurs|matrice|matrices|equation|equations|polynome|polynomes|trinome|trigonometr|probabilite|probabilites|statistique|statistiques|tableau de variation|ensemble de definition)\b/.test(lower)
  ) {
    return "Mathematiques";
  }
  if (
    /\b(force|energie|tension|courant|atome|molecule|reaction chimique|chimie|physique|cellule|photosynthese)\b/.test(lower)
  ) {
    return "Sciences";
  }
  if (/\b(guerre|revolution|empire|siecle|traite|constitution|croissance|inflation)\b/.test(lower)) {
    return "Histoire-Geographie";
  }
  if (/\b(algorithme|boucle|fonction informatique|variable|tableau|classe|objet|complexite)\b/.test(lower)) {
    return "Informatique";
  }
  if (/\b(philosophe|etre|conscience|liberte|verite|connaissance)\b/.test(lower)) {
    return "Philosophie";
  }
  if (/\b(anglais|espagnol|allemand|italien|grammar|vocabulary|conjugaison)\b/.test(lower)) {
    return "Langues";
  }

  return "General";
}

function inferSubjectFromFileHint(fileHint: string): string {
  const lower = fileHint.toLowerCase();

  if (/\b(fonction|derivee|integrale|suite|vecteur|matrice|probabilite|statistique)\b/.test(lower)) {
    return "Mathematiques";
  }
  if (/\b(photosynthese|cellule|atome|molecule|energie|reaction|chimie|physique)\b/.test(lower)) {
    return "Sciences";
  }
  if (/\b(guerre|revolution|constitution|empire|croissance|inflation)\b/.test(lower)) {
    return "Histoire-Geographie";
  }
  if (/\b(algorithme|variable|classe|objet|complexite|automate)\b/.test(lower)) {
    return "Informatique";
  }

  return "General";
}

export function inferDocumentProfile(
  input: Pick<GenerateSheetRequest, "content" | "titleHint" | "subject">,
  classified: Pick<ClassifiedContent, "cleanedText" | "subject" | "level" | "contentType">,
): DocumentProfile {
  const sourceText = classified.cleanedText.trim() || input.content.trim();
  const selectedSubject = input.subject?.trim() ?? "";
  const fileHint = input.titleHint ? cleanFilename(input.titleHint) : "";
  const sourceSubject = inferSubjectFromSourceText(sourceText);
  const hintSubject = inferSubjectFromFileHint(fileHint);
  const inferredSubject =
    selectedSubject
      ? selectedSubject
      : sourceSubject !== "General"
      ? sourceSubject
      : classified.subject && classified.subject !== "General"
        ? classified.subject
        : hintSubject !== "General"
          ? hintSubject
          : fileHint || "Cours";
  const density = sourceText.length > 12000 ? "elevee" : sourceText.length > 5000 ? "moyenne" : "faible";

  return {
    matiere: inferredSubject,
    sous_domaine: fileHint && fileHint !== inferredSubject ? fileHint : "",
    niveau: classified.level || "General",
    famille_pedagogique: inferPedagogicalFamilyFromProfile({
      matiere: inferredSubject,
      sous_domaine: fileHint,
      niveau: classified.level,
      type_contenu: [classified.contentType],
    }),
    niveau_precision: inferPrecisionLevelFromAcademicLevel({ niveau: classified.level }),
    objectif_revision: inferRevisionObjective({
      matiere: inferredSubject,
      sous_domaine: fileHint,
      niveau: classified.level,
      type_contenu: [classified.contentType],
    }),
    type_contenu: [classified.contentType],
    contient_formules: extractFormulaCandidates(sourceText).length > 0,
    contient_demonstrations: /(demonstration|preuve|montrer que|demontrer)/i.test(sourceText),
    contient_schemas: /(schema|diagramme|graphe|figure|tableau)/i.test(sourceText),
    langue: /[a-z]/i.test(sourceText) ? "francais" : "francais",
    densite: density,
  };
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

async function detectProfile(sourceText: string, budget?: PipelineBudget): Promise<DocumentProfile> {
  const message = await createAnthropicMessage("detect-profile", {
    model: MODELS.FAST,
    max_tokens: 500,
    system: [
      {
        type: "text" as const,
        text: DETECT_PROFILE_SYSTEM,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: buildDetectProfilePrompt(sourceText) }],
  }, 20_000, budget);

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
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

export async function generateInventory(
  sourceText: string,
  profile: DocumentProfile,
  budget?: PipelineBudget,
): Promise<ContentInventory> {
  const chunks = splitIntoSemanticChunks(sourceText);

  if (chunks.length === 1) {
    const systemPrompt = buildInventorySystemPrompt(profile);
    const userPrompt = buildInventoryUserPrompt(sourceText);
    const message = await createAnthropicMessage("inventory", {
      model: HAIKU_GENERATION_MODEL,
      max_tokens: 8000,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }, 50_000, budget);

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
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
    const systemPrompt = `${buildInventorySystemPrompt(profile)}

CONTEXTE SUPPLEMENTAIRE :
Tu traites seulement un extrait du document complet (${index + 1}/${chunks.length}).
Tu dois etre exhaustif sur cet extrait, sans supposer que d'autres parties seront re-analysees plus tard.
Conserve les titres de parties et les formules exactement quand elles apparaissent.`;
    const userPrompt = buildInventoryUserPrompt(chunk);
    const message = await createAnthropicMessage(`inventory-chunk-${index + 1}`, {
      model: HAIKU_GENERATION_MODEL,
      max_tokens: 5000,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }, 50_000, budget);

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
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

export function countInventoryElements(inventory: ContentInventory): number {
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

export function isStrictFormulaCourse(
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

export function collectStrictFormulas(
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

export function collectSheetFormulaCandidates(sheet: PipelineSheet) {
  const sections = "blueprintSections" in sheet ? sheet.blueprintSections : undefined;
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

export function evaluateStrictFormulaIntegrity(expected: string[], actual: string[]) {
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

function applySheetMetadata<T extends PipelineSheet>(
  sheet: T,
  profile: DocumentProfile,
  blueprint: PedagogicalBlueprint,
): T {
  const subjectFamily = sheet.subjectFamily ?? detectSubjectFamily(sheet.matiere || profile.matiere);

  return {
    ...sheet,
    subjectFamily,
    classification: sheet.classification ?? buildSheetClassification(profile, blueprint),
    blueprintId: blueprint.id,
    objectifRevision: profile.objectif_revision,
    notionsCles: sheet.notionsCles ?? [],
    formulesCles: sheet.formulesCles ?? [],
    proprietesCles: sheet.proprietesCles ?? [],
  };
}

async function generateLegacySheetFromInventory(
  inventory: ContentInventory,
  sourceText: string,
  profile: DocumentProfile,
  blueprint: PedagogicalBlueprint,
  strictFormulas: string[] = [],
  budget?: PipelineBudget,
): Promise<FicheGeneree> {
  const inventoryJSON = JSON.stringify(inventory, null, 2);

  const systemPrompt = buildSheetSystemPrompt(profile, blueprint);
  const userPrompt = buildSheetUserPrompt(inventoryJSON, sourceText, profile, blueprint, strictFormulas);
  const message = await createAnthropicMessage("generate-legacy-sheet", {
    model: HAIKU_GENERATION_MODEL,
    max_tokens: 6000,
    system: [
      {
        type: "text" as const,
        text: systemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  }, 50_000, budget);

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
  const cleaned = cleanJsonResponse(raw);
  const parsed = sanitizeAiJsonValue(JSON.parse(cleaned)) as FicheGeneree;
  return applySheetMetadata(parsed, profile, blueprint);
}

export async function generateSheet(
  inventory: ContentInventory,
  sourceText: string,
  profile: DocumentProfile,
  classified: ClassifiedContent,
  blueprint = selectPedagogicalBlueprint(profile, inventory),
  strictFormulas: string[] = [],
  budget?: PipelineBudget,
): Promise<PipelineSheet> {
  const inventoryJSON = JSON.stringify(inventory, null, 2);

  try {
    const systemPrompt = buildZonedSheetSystemPrompt(profile, blueprint, classified);
    const userPrompt = buildZonedSheetUserPrompt(
      inventoryJSON,
      sourceText,
      profile,
      blueprint,
      strictFormulas,
      classified,
    );
    const message = await createAnthropicMessage("generate-zoned-sheet", {
      model: HAIKU_GENERATION_MODEL,
      max_tokens: 6000,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }, 50_000, budget);

    const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
    const cleaned = cleanJsonResponse(raw);
    const parsed = sanitizeAiJsonValue(JSON.parse(cleaned));

    if (!validateZonedFicheStructure(parsed)) {
      console.warn("[Pipeline] ZonedFiche invalide, fallback vers le prompt legacy.");
      return generateLegacySheetFromInventory(inventory, sourceText, profile, blueprint, strictFormulas, budget);
    }

    return applySheetMetadata(convertZonedToLegacy(sanitizeGeneratedSheet(parsed)), profile, blueprint);
  } catch (error) {
    console.warn("[Pipeline] Generation ZonedFiche echouee, fallback vers le prompt legacy.", error);
    return generateLegacySheetFromInventory(inventory, sourceText, profile, blueprint, strictFormulas, budget);
  }
}

async function verifyCoverage(
  sheet: PipelineSheet,
  inventory: ContentInventory,
  budget?: PipelineBudget,
): Promise<CoverageReport> {
  const inventoryJSON = JSON.stringify(inventory, null, 2);
  const sheetJSON = JSON.stringify(sheet, null, 2);

  const verifierPrompt = "Tu es un verificateur pedagogique rigoureux. Tu reponds UNIQUEMENT en JSON valide.";
  const userPrompt = buildCoveragePrompt(inventoryJSON, sheetJSON);
  const message = await createAnthropicMessage("verify-coverage", {
    model: MODELS.FAST,
    max_tokens: 2000,
    system: [
      {
        type: "text" as const,
        text: verifierPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: userPrompt }],
  }, 10_000, budget);

  const raw = message.content[0]?.type === "text" ? message.content[0].text : "";
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
  currentSheet: PipelineSheet,
  sourceText: string,
  profile: DocumentProfile,
  inventory: ContentInventory,
  classified: ClassifiedContent,
  remediation: string[] = [],
  strictFormulas: string[] = [],
  budget?: PipelineBudget,
): Promise<PipelineSheet> {
  const currentSheetJSON = JSON.stringify(currentSheet, null, 2);
  const blueprint = selectPedagogicalBlueprint(profile, inventory);

  try {
    const systemPrompt = buildZonedSheetSystemPrompt(profile, blueprint, classified);
    const userPrompt = buildCompletionPrompt(
      missing,
      incomplete,
      currentSheetJSON,
      sourceText,
      remediation,
      strictFormulas,
    );
    const zonedMessage = await createAnthropicMessage("complete-zoned-sheet", {
      model: MODELS.MAIN,
      max_tokens: 6000,
      system: [
        {
          type: "text" as const,
          text: systemPrompt,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: userPrompt }],
    }, 35_000, budget);

    const zonedRaw = zonedMessage.content[0]?.type === "text" ? zonedMessage.content[0].text : "";
    const zonedParsed = sanitizeAiJsonValue(JSON.parse(cleanJsonResponse(zonedRaw)));

    if (validateZonedFicheStructure(zonedParsed)) {
      return applySheetMetadata(convertZonedToLegacy(sanitizeGeneratedSheet(zonedParsed)), profile, blueprint);
    }

    console.warn("[Pipeline] Completion ZonedFiche invalide, fallback vers le prompt legacy.");
  } catch (error) {
    console.warn("[Pipeline] Completion ZonedFiche echouee, fallback vers le prompt legacy.", error);
  }

  const legacySystemPrompt = buildSheetSystemPrompt(profile, blueprint);
  const legacyUserPrompt = buildCompletionPrompt(
    missing,
    incomplete,
    currentSheetJSON,
    sourceText,
    remediation,
    strictFormulas,
  );
  const legacyMessage = await createAnthropicMessage("complete-legacy-sheet", {
    model: MODELS.MAIN,
    max_tokens: 6000,
    system: [
      {
        type: "text" as const,
        text: legacySystemPrompt,
        cache_control: { type: "ephemeral" as const },
      },
    ],
    messages: [{ role: "user", content: legacyUserPrompt }],
  }, 35_000, budget);

  const legacyRaw = legacyMessage.content[0]?.type === "text" ? legacyMessage.content[0].text : "";
  const legacyParsed = sanitizeAiJsonValue(JSON.parse(cleanJsonResponse(legacyRaw))) as FicheGeneree;
  return {
    ...applySheetMetadata(legacyParsed, profile, blueprint),
    classification: legacyParsed.classification ?? currentSheet.classification ?? buildSheetClassification(profile, blueprint),
    blueprintId: legacyParsed.blueprintId ?? currentSheet.blueprintId ?? blueprint.id,
    objectifRevision: legacyParsed.objectifRevision ?? currentSheet.objectifRevision ?? profile.objectif_revision,
    notionsCles: legacyParsed.notionsCles ?? currentSheet.notionsCles ?? [],
    formulesCles: legacyParsed.formulesCles ?? currentSheet.formulesCles ?? [],
    proprietesCles: legacyParsed.proprietesCles ?? currentSheet.proprietesCles ?? [],
  };
}

export async function generateWithPipeline(input: GenerateSheetRequest): Promise<FicheGeneree> {
  const budget = createPipelineBudget();
  const classified = cleanAndClassify(input.content);
  const sourceText = classified.cleanedText.trim() || input.content.trim();
  const profile = inferDocumentProfile(input, classified);

  console.log(
    `[Pipeline] Profil infere localement : ${profile.matiere} / ${profile.sous_domaine} / ${profile.niveau} / ${profile.famille_pedagogique} / precision=${profile.niveau_precision} / densite: ${profile.densite}`,
  );

  console.log("[Pipeline] Etape 1/2 : Inventaire exhaustif...");
  const inventory = await generateInventory(sourceText, profile, budget);
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
  console.log(`[Pipeline] Formules strictes retenues : ${strictFormulas.length}`);
  const stageClassified: ClassifiedContent = {
    ...classified,
    subject: input.subject?.trim() || classified.subject,
    cleanedText: sourceText,
    matiere: input.subject?.trim() || classified.subject,
    niveau: classified.level,
    blueprintId: blueprint.id,
    titre: inventory.titre || input.subject?.trim() || classified.subject || "Fiche de revision",
  };

  console.log("[Pipeline] Etape 2/2 : Generation de la fiche...");
  const sheet = await generateSheet(
    inventory,
    sourceText,
    profile,
    stageClassified,
    blueprint,
    strictFormulas,
    budget,
  );

  return sanitizeFicheOutput(sheet);
}
