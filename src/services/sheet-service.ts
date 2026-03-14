import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche, wrapKeyPointsPayload } from "@/lib/fiche-storage";
import { sanitizeJsonValue, sanitizeText } from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

export async function saveGeneratedSheet(
  input: GenerateSheetRequest,
  generated: GeneratedSheet,
  fiche?: FicheGeneree,
) {
  const baseGenerated = fiche ? deriveClassicSheetFromFiche(fiche) : generated;
  const safeGenerated = sanitizeJsonValue(baseGenerated);
  const safeFiche = fiche ? sanitizeJsonValue(fiche) : null;

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
