import { Prisma } from "@prisma/client";

import { cleanAndClassify, type ClassifiedContent } from "@/lib/prompts/classify-content";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche, wrapKeyPointsPayload } from "@/lib/fiche-storage";
import { detectSubjectFamily, getFlashcardCap, getSubjectFamilyCaps } from "@/lib/subject-families";
import { sanitizeAiJsonValue, sanitizeText } from "@/lib/text";
import { countInventoryElements, inferDocumentProfile } from "@/services/generation-pipeline";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { ContentInventory, DocumentProfile } from "@/types/generation-pipeline";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

export type StoredInventoryPayload = {
  inventory: ContentInventory;
  sourceText: string;
  profile: DocumentProfile;
  classifiedInput: Pick<ClassifiedContent, "cleanedText" | "subject" | "subjectFamily" | "level" | "contentType">;
  request: Pick<GenerateSheetRequest, "subject" | "titleHint" | "userId">;
};

function resolveSubjectFamily(data: any) {
  const families = [
    "exact_sciences",
    "life_sciences",
    "humanities_history",
    "humanities_text",
    "languages",
    "economics",
    "general",
  ] as const;

  for (const source of [data?.metadata?.subjectFamily, data?.subjectFamily]) {
    if (families.includes(source)) {
      return source;
    }
  }

  return detectSubjectFamily(
    data?.matiere || data?.classification?.matiere || data?.subject || "",
  );
}

function enforceSheetLimits(data: any): any {
  const family = resolveSubjectFamily(data);
  const { formules: formulesCap } = getSubjectFamilyCaps(family);
  const flashcardCap = getFlashcardCap(family);

  if (data.coreBlocks?.length > 4) {
    const priorityOrder: Record<string, number> = {
      concept: 1,
      formula: 2,
      rule: 2,
      example: 3,
      trap: 4,
      methode: 2,
    };

    data.coreBlocks = [...data.coreBlocks]
      .sort((a: any, b: any) => (priorityOrder[a?.type] ?? 5) - (priorityOrder[b?.type] ?? 5))
      .slice(0, 4);
  }

  if (data.formulesCles?.length > formulesCap) data.formulesCles = data.formulesCles.slice(0, formulesCap);
  if (data.flashcards?.length > flashcardCap) data.flashcards = data.flashcards.slice(0, flashcardCap);
  if (data.actionQuiz?.length > flashcardCap) data.actionQuiz = data.actionQuiz.slice(0, flashcardCap);
  if (data.proprietesCles?.length > 0) {
    data.notionsCles = [...(data.notionsCles || []), ...data.proprietesCles].slice(0, 4);
    data.proprietesCles = [];
  }
  if (data.notionsCles?.length > 4) data.notionsCles = data.notionsCles.slice(0, 4);
  if (data.etapes?.length > 0) data.etapes = [];
  if (data.applications?.length > 0) data.applications = [];

  if (data.blueprintSections) {
    if (data.blueprintSections.tableauSynthese?.length > 0) data.blueprintSections.tableauSynthese = [];
    if (data.blueprintSections.etapesCles?.length > 0) data.blueprintSections.etapesCles = [];
    if (data.blueprintSections.applications?.length > 0) data.blueprintSections.applications = [];
  }

  return data;
}

function calculateSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (wordsA.size === 0 || wordsB.size === 0) return 0;
  const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return intersection / union;
}

function validateBeforeSave(fiche: any): any {
  // Deduplicate notionsCles by similarity (Jaccard >= 0.6)
  if (Array.isArray(fiche.notionsCles) && fiche.notionsCles.length > 1) {
    const deduped: string[] = [];
    for (const notion of fiche.notionsCles) {
      const isDuplicate = deduped.some(existing => calculateSimilarity(existing, notion) >= 0.6);
      if (!isDuplicate) deduped.push(notion);
    }
    if (deduped.length < fiche.notionsCles.length) {
      console.warn(`[validateBeforeSave] notionsCles: ${fiche.notionsCles.length} → ${deduped.length} après déduplication`);
      fiche.notionsCles = deduped;
    }
  }

  // Deduplicate flashcards by question similarity
  if (Array.isArray(fiche.flashcards) && fiche.flashcards.length > 1) {
    const deduped: any[] = [];
    for (const card of fiche.flashcards) {
      const isDuplicate = deduped.some(existing => calculateSimilarity(existing.question ?? "", card.question ?? "") >= 0.7);
      if (!isDuplicate) deduped.push(card);
    }
    if (deduped.length < fiche.flashcards.length) {
      console.warn(`[validateBeforeSave] flashcards: ${fiche.flashcards.length} → ${deduped.length} après déduplication`);
      fiche.flashcards = deduped;
    }
  }

  return fiche;
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

function looksLikeFilenameTitle(title: string, originalFilename?: string) {
  const normalizeForComparison = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      .replace(/\s+/g, " ").trim().toLowerCase();

  const normalizedTitle = normalizeForComparison(title);
  const normalizedOriginal = normalizeForComparison(originalFilename ?? "");
  const normalizedCleaned = normalizeForComparison(cleanFilename(originalFilename ?? ""));

  return normalizedTitle.length > 0 && (
    (normalizedOriginal.length > 0 && normalizedTitle === normalizedOriginal)
    || (normalizedCleaned.length > 0 && normalizedTitle === normalizedCleaned)
    || /^[a-z0-9]+-\d+-?/i.test(title.trim())
    || /^[a-z0-9]+(?:[-_][a-z0-9]+){2,}$/i.test(title.trim())
    || /^\d+[\s\-_.]+/.test(title.trim())
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function buildHeaderMetrics(data: any) {
  return [
    {
      valeur: String([
        hasText(data.imageMentale?.titre) || hasText(data.imageMentale?.texte),
        hasText(data.definition),
        (data.formulesCles?.length ?? 0) > 0,
        (data.notionsCles?.length ?? 0) > 0,
        hasText(data.exemple),
        hasText(data.piege),
        (data.schema?.elements?.length ?? 0) > 0 || !!data.schema?.description,
        hasText(data.feynman),
        (data.flashcards?.length ?? 0) > 0,
      ].filter(Boolean).length),
      label: "parties du cours",
    },
    { valeur: String(data.formulesCles?.length ?? 0), label: "formules et relations" },
    { valeur: String(data.notionsCles?.length ?? 0), label: "proprietes et criteres" },
  ];
}

export function buildStoredInventoryPayload(input: Pick<GenerateSheetRequest, "content" | "subject" | "titleHint" | "userId">) {
  const classified = cleanAndClassify(input.content);
  const sourceText = classified.cleanedText.trim() || input.content.trim();
  const resolvedSubject = input.subject?.trim() || classified.subject;
  const classifiedInput = {
    cleanedText: sourceText,
    subject: resolvedSubject,
    subjectFamily: classified.subjectFamily,
    level: classified.level,
    contentType: classified.contentType,
  } as const;
  const profile = inferDocumentProfile(
    {
      content: sourceText,
      subject: input.subject,
      titleHint: input.titleHint,
    },
    classifiedInput,
  );

  return {
    sourceText,
    profile,
    classifiedInput,
    request: {
      subject: input.subject,
      titleHint: input.titleHint,
      userId: input.userId,
    },
  };
}

export function buildInventoryRecord(
  input: Pick<GenerateSheetRequest, "content" | "subject" | "titleHint" | "userId">,
  inventory: ContentInventory,
): StoredInventoryPayload {
  return {
    ...buildStoredInventoryPayload(input),
    inventory,
  };
}

export function parseStoredInventoryPayload(value: unknown): StoredInventoryPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<StoredInventoryPayload>;
  if (!candidate.inventory || !candidate.profile || !candidate.classifiedInput || !candidate.sourceText) {
    return null;
  }

  return candidate as StoredInventoryPayload;
}

export function assertInventoryNotEmpty(inventory: ContentInventory) {
  const elementCount = countInventoryElements(inventory);
  if (elementCount === 0) {
    throw new Error("L'inventaire du document est vide. Le contenu n'a pas pu etre analyse.");
  }
}

export function finalizeFicheForSave(
  input: Pick<GenerateSheetRequest, "titleHint">,
  rawFiche: FicheGeneree,
): FicheGeneree {
  const fiche = validateBeforeSave(enforceSheetLimits(sanitizeAiJsonValue(rawFiche) as FicheGeneree));
  fiche.subjectFamily = fiche.subjectFamily ?? resolveSubjectFamily(fiche);

  const generatedModelTitle = typeof fiche.titre === "string" ? fiche.titre.trim() : "";
  const cleanedFallbackTitle = input.titleHint ? cleanFilename(input.titleHint) : "";
  const finalTitle = (
    generatedModelTitle && !looksLikeFilenameTitle(generatedModelTitle, input.titleHint)
      ? generatedModelTitle
      : cleanedFallbackTitle
  ) || generatedModelTitle || "Fiche de revision";

  fiche.titre = finalTitle;
  fiche.metriques = buildHeaderMetrics(fiche);

  return fiche;
}

export async function saveCompletedSheet(
  sheetId: string,
  generated: GeneratedSheet,
  fiche: FicheGeneree,
  userId?: string,
) {
  await db.studySheet.update({
    where: { id: sheetId },
    data: {
      title: sanitizeText(generated.title),
      summary: sanitizeText(generated.summary),
      keyPointsJson: wrapKeyPointsPayload(generated.keyPoints, fiche) as unknown as Prisma.InputJsonValue,
      definitionsJson: generated.definitions,
      flashcardsJson: generated.flashcards,
      quizJson: generated.quiz,
      status: "COMPLETED",
      updatedAt: new Date(),
    },
  });
}

export async function markSheetFailed(sheetId: string, message: string) {
  await db.studySheet.update({
    where: { id: sheetId },
    data: {
      status: "FAILED",
      summary: sanitizeText(message) || "La generation a echoue.",
      updatedAt: new Date(),
    },
  });
}
