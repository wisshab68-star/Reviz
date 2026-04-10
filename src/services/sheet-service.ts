import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche, wrapKeyPointsPayload } from "@/lib/fiche-storage";
import { sanitizeAiJsonValue, sanitizeText } from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

export async function saveGeneratedSheet(
  input: GenerateSheetRequest,
  generated: GeneratedSheet,
  fiche?: FicheGeneree,
) {
  const baseGenerated = fiche ? deriveClassicSheetFromFiche(fiche) : generated;
  const safeGenerated = sanitizeAiJsonValue(baseGenerated);
  const safeFiche = fiche ? sanitizeAiJsonValue(fiche) : null;

  return db.studySheet.create({
    data: {
      userId: input.userId,
      documentId: input.documentId,
      sourceType: input.sourceType,
      title: sanitizeText(safeGenerated.title),
      summary: sanitizeText(safeGenerated.summary),
      keyPointsJson: safeFiche
        ? (wrapKeyPointsPayload(safeGenerated.keyPoints, safeFiche as FicheGeneree) as unknown as Prisma.InputJsonValue)
        : (safeGenerated.keyPoints as unknown as Prisma.InputJsonValue),
      definitionsJson: safeGenerated.definitions,
      flashcardsJson: safeGenerated.flashcards,
      quizJson: safeGenerated.quiz,
      status: "COMPLETED",
    },
  });
}

export async function createPendingSheet(input: GenerateSheetRequest, title: string) {
  return db.studySheet.create({
    data: {
      userId: input.userId,
      documentId: input.documentId,
      sourceType: input.sourceType,
      title: sanitizeText(title) || "Fiche en generation",
      summary: "Generation en cours...",
      keyPointsJson: [] as unknown as Prisma.InputJsonValue,
      definitionsJson: [] as unknown as Prisma.InputJsonValue,
      flashcardsJson: [] as unknown as Prisma.InputJsonValue,
      quizJson: [] as unknown as Prisma.InputJsonValue,
      status: "PROCESSING",
    },
    select: {
      id: true,
      title: true,
      status: true,
    },
  });
}

export async function finalizePendingSheet(
  sheetId: string,
  generated: GeneratedSheet,
  fiche?: FicheGeneree,
) {
  const baseGenerated = fiche ? deriveClassicSheetFromFiche(fiche) : generated;
  const safeGenerated = sanitizeAiJsonValue(baseGenerated);
  const safeFiche = fiche ? sanitizeAiJsonValue(fiche) : null;

  return db.studySheet.update({
    where: { id: sheetId },
    data: {
      title: sanitizeText(safeGenerated.title),
      summary: sanitizeText(safeGenerated.summary),
      keyPointsJson: safeFiche
        ? (wrapKeyPointsPayload(safeGenerated.keyPoints, safeFiche as FicheGeneree) as unknown as Prisma.InputJsonValue)
        : (safeGenerated.keyPoints as unknown as Prisma.InputJsonValue),
      definitionsJson: safeGenerated.definitions,
      flashcardsJson: safeGenerated.flashcards,
      quizJson: safeGenerated.quiz,
      status: "COMPLETED",
    },
  });
}

export async function failPendingSheet(sheetId: string, message: string) {
  return db.studySheet.update({
    where: { id: sheetId },
    data: {
      status: "FAILED",
      summary: sanitizeText(message) || "La generation a echoue.",
    },
  });
}
