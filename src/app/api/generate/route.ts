import { NextResponse } from "next/server";
import { DocumentType, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { db } from "@/lib/db";
import { generateSheetRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";
export const maxDuration = 60;

class GenerateStageTimeoutError extends Error {
  constructor(public readonly stage: string, public readonly timeoutMs: number) {
    super(`Stage '${stage}' timed out after ${timeoutMs}ms`);
    this.name = "GenerateStageTimeoutError";
  }
}

async function withStageTimeout<T>(stage: string, promise: Promise<T>, timeoutMs: number): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new GenerateStageTimeoutError(stage, timeoutMs)), timeoutMs);
    }),
  ]);
}

function cleanFilename(filename: string): string {
  return filename
    .replace(/\.[^/.]+$/, "")
    .replace(/^\d+[\s\-_.]+/, "")
    .replace(/^[a-z0-9]+-\d+-?/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const logStage = (stage: string) => {
    console.log(`[GENERATE][${stage}] +${Date.now() - startedAt}ms`);
  };

  try {
    let session = null;

    try {
      logStage("auth:start");
      session = await withStageTimeout("auth", auth(), 8000);
      logStage("auth:done");
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        if (error instanceof GenerateStageTimeoutError) {
          throw error;
        }
        throw error;
      }

      console.error("Auth lookup failed, continuing as guest.", error);
    }

    const json = await request.json();
    const parsed = generateSheetRequestSchema.parse(json);
    const input = {
      ...parsed,
      userId: session?.user?.id ?? parsed.userId,
    };
    const contentLength = input.content.trim().length;
    console.log(
      `[GENERATE][payload] sourceType=${input.sourceType} contentLength=${contentLength} titleHint="${input.titleHint ?? ""}" subject="${input.subject ?? ""}"`,
    );

    let quota = null;

    if (session?.user?.id) {
      try {
        logStage("quota:start");
        const userSnapshot = await withStageTimeout(
          "quota:user",
          db.user.findUnique({
            where: { id: session.user.id },
            select: {
              subscriptionStatus: true,
            },
          }),
          8000,
        );
        const sheetCount = await withStageTimeout(
          "quota:count",
          db.studySheet.count({
            where: {
              userId: session.user.id,
              status: {
                not: "FAILED",
              },
            },
          }),
          8000,
        );
        const premium = userSnapshot?.subscriptionStatus === "active";

        if (!premium && sheetCount >= 1) {
          return NextResponse.json(
            {
              error: "LIMIT_REACHED",
              message: "Tu as utilisé ta fiche gratuite",
            },
            { status: 403 },
          );
        }

        quota = premium
          ? {
              allowed: true,
              remaining: null,
              limit: null,
            }
          : {
              allowed: true,
              remaining: Math.max(1 - sheetCount, 0),
              limit: 1,
            };
        logStage("quota:done");
      } catch (error) {
        if (!isDatabaseConnectionError(error)) {
          if (error instanceof GenerateStageTimeoutError) {
            throw error;
          }
          throw error;
        }

        console.error("Quota lookup failed, continuing without persistence.", error);
      }
    }

    let resolvedDocumentId = input.documentId;

    if (!resolvedDocumentId) {
      try {
        logStage("document:create:start");
        const generatedDocument = await withStageTimeout(
          "document:create",
          db.document.create({
            data: {
              userId: session?.user?.id ?? input.userId,
              type: (input.sourceType || "TEXT") as DocumentType,
              filename: input.titleHint ?? "Texte saisi",
              rawText: input.content,
              extractedText: input.content,
              processingStatus: "COMPLETED",
            },
            select: {
              id: true,
            },
          }),
          8000,
        );
        resolvedDocumentId = generatedDocument.id;
        logStage("document:create:done");
      } catch (documentError) {
        if (!isDatabaseConnectionError(documentError)) {
          if (documentError instanceof GenerateStageTimeoutError) {
            throw documentError;
          }
          throw documentError;
        }

        console.error("[GENERATE] Document creation failed:", documentError);
        throw new Error("Impossible de preparer le document pour la generation.");
      }
    }

    const pendingTitle = input.titleHint ? cleanFilename(input.titleHint) : "Generation en cours...";
    let pendingSheet: { id: string; status: string } | null = null;

    try {
      logStage("pending-sheet:create:start");
      pendingSheet = await withStageTimeout(
        "pending-sheet:create",
        db.studySheet.create({
          data: {
            userId: session?.user?.id ?? input.userId,
            documentId: resolvedDocumentId,
            sourceType: input.sourceType,
            title: pendingTitle,
            summary: "Generation en cours...",
            keyPointsJson: [],
            definitionsJson: [],
            flashcardsJson: [],
            quizJson: [],
            inventoryJson: Prisma.JsonNull,
            status: "PROCESSING",
          },
          select: {
            id: true,
            status: true,
          },
        }),
        8000,
      );
      logStage("pending-sheet:create:done");
    } catch (pendingError) {
      if (!isDatabaseConnectionError(pendingError)) {
        if (pendingError instanceof GenerateStageTimeoutError) {
          throw pendingError;
        }
        throw pendingError;
      }

      console.error("[GENERATE] Pending sheet creation failed:", pendingError);
      throw new Error("Impossible de creer la fiche en attente de generation.");
    }

    return NextResponse.json({
      success: true,
      sheetId: pendingSheet.id,
      quota,
      queued: true,
      status: pendingSheet.status,
    });
  } catch (error) {
    console.error("[GENERATE] Unhandled error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof GenerateStageTimeoutError
          ? `Diagnostic: blocage sur ${error.stage} apres ${error.timeoutMs / 1000}s.`
          : "Erreur lors de la generation. Reessaie.",
      },
      { status: 500 },
    );
  }
}
