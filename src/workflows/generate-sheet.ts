import { Prisma } from "@prisma/client";

import { cleanAndClassify, type ClassifiedContent } from "@/lib/prompts/classify-content";
import { selectPedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche, wrapKeyPointsPayload } from "@/lib/fiche-storage";
import { detectSubjectFamily, getFlashcardCap, getSubjectFamilyCaps } from "@/lib/subject-families";
import { sanitizeAiJsonValue, sanitizeText } from "@/lib/text";
import {
  collectStrictFormulas,
  countInventoryElements,
  generateInventory,
  generateSheet,
  inferDocumentProfile,
} from "@/services/generation-pipeline";
import { trackUsage } from "@/services/usage-service";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { ContentInventory, DocumentProfile } from "@/types/generation-pipeline";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

export const maxDuration = 60;

type WorkflowClassifiedInput = Pick<
  ClassifiedContent,
  "cleanedText" | "subject" | "subjectFamily" | "level" | "contentType"
>;

function resolveWorkflowSourceText(input: GenerateSheetRequest, classifiedInput: WorkflowClassifiedInput) {
  const cleanedText = classifiedInput.cleanedText.trim();
  const rawText = input.content.trim();

  return cleanedText || rawText;
}

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

function countNonEmptySections(data: any): number {
  return [
    hasText(data.imageMentale?.titre) || hasText(data.imageMentale?.texte),
    hasText(data.definition),
    (data.formulesCles?.length ?? 0) > 0,
    (data.notionsCles?.length ?? 0) > 0,
    hasText(data.exemple),
    hasText(data.piege),
    (data.schema?.elements?.length ?? 0) > 0 || !!data.schema?.description,
    hasText(data.feynman),
    (data.flashcards?.length ?? 0) > 0,
  ].filter(Boolean).length;
}

function buildHeaderMetrics(data: any) {
  return [
    { valeur: String(countNonEmptySections(data)), label: "parties du cours" },
    { valeur: String(data.formulesCles?.length ?? 0), label: "formules et relations" },
    { valeur: String(data.notionsCles?.length ?? 0), label: "proprietes et criteres" },
  ];
}

function buildWorkflowClassifiedInput(input: GenerateSheetRequest): WorkflowClassifiedInput {
  const classified = cleanAndClassify(input.content);
  return {
    cleanedText: classified.cleanedText,
    subject: classified.subject,
    subjectFamily: classified.subjectFamily,
    level: classified.level,
    contentType: classified.contentType,
  };
}

function buildStageClassification(
  classifiedInput: WorkflowClassifiedInput,
  inventory: ContentInventory,
  blueprintId: string,
): ClassifiedContent {
  return {
    ...classifiedInput,
    matiere: classifiedInput.subject,
    niveau: classifiedInput.level,
    blueprintId,
    titre: inventory.titre || classifiedInput.subject || "Fiche de revision",
  };
}

function finalizeFicheForSave(input: GenerateSheetRequest, rawFiche: FicheGeneree): FicheGeneree {
  const fiche = enforceSheetLimits(sanitizeAiJsonValue(rawFiche) as FicheGeneree);
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

async function step1_inventory(input: {
  sourceText: string;
  profile: DocumentProfile;
}) {
  "use step";

  try {
    const inventory = await generateInventory(input.sourceText, input.profile);
    const elementCount = countInventoryElements(inventory);

    if (elementCount === 0) {
      throw new Error("L'inventaire du document est vide. Le contenu n'a pas pu etre analyse.");
    }

    return inventory;
  } catch (error) {
    console.error("[WORKFLOW][STEP 1/2] inventory failed:", error);
    throw error;
  }
}

async function step2_generate(input: {
  sheetId: string;
  request: GenerateSheetRequest;
  sourceText: string;
  profile: DocumentProfile;
  inventory: ContentInventory;
  classifiedInput: WorkflowClassifiedInput;
}) {
  "use step";

  try {
    const blueprint = selectPedagogicalBlueprint(input.profile, input.inventory);
    const strictFormulas = collectStrictFormulas(
      input.inventory,
      input.sourceText,
      input.profile,
      blueprint,
    );
    const classified = buildStageClassification(input.classifiedInput, input.inventory, blueprint.id);
    const rawSheet = await generateSheet(
      input.inventory,
      input.sourceText,
      input.profile,
      classified,
      blueprint,
      strictFormulas,
    );

    const fiche = finalizeFicheForSave(input.request, sanitizeAiJsonValue(rawSheet) as FicheGeneree);
    const generated = sanitizeAiJsonValue(deriveClassicSheetFromFiche(fiche)) as GeneratedSheet;
    await saveCompletedSheet(input.sheetId, generated, fiche, input.request.userId);

    return { sheetId: input.sheetId, status: "COMPLETED" as const };
  } catch (error) {
    console.error("[WORKFLOW][STEP 2/2] generate failed:", error);
    throw error;
  }
}

async function saveCompletedSheet(
  sheetId: string,
  generated: GeneratedSheet,
  fiche: FicheGeneree,
  userId?: string,
) {
  "use step";

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

  await trackUsage(userId, "sheet_generated");
}

async function markSheetFailed(sheetId: string, message: string) {
  "use step";

  await db.studySheet.update({
    where: { id: sheetId },
    data: {
      status: "FAILED",
      summary: sanitizeText(message) || "La generation a echoue.",
      updatedAt: new Date(),
    },
  });
}

export async function generateSheetWorkflow(sheetId: string, input: GenerateSheetRequest) {
  "use workflow";

  const classifiedInput = buildWorkflowClassifiedInput(input);
  const sourceText = resolveWorkflowSourceText(input, classifiedInput);
  const profile = inferDocumentProfile(input, classifiedInput);

  try {
    if (!sourceText) {
      throw new Error("Le contenu du document est vide apres extraction.");
    }

    console.log(
      `[WORKFLOW] sheetId=${sheetId} sourceLength=${sourceText.length} titleHint="${input.titleHint ?? ""}" subject="${profile.matiere}"`,
    );

    const inventory = await step1_inventory({
      sourceText,
      profile,
    });

    return await step2_generate({
      sheetId,
      request: input,
      sourceText,
      profile,
      inventory,
      classifiedInput,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La generation a echoue.";
    await markSheetFailed(sheetId, message);
    throw error;
  }
}
