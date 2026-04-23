import { NextResponse } from "next/server";
import { DocumentType, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { generateSheetRequestSchema } from "@/lib/validations";
import { canGenerateSheet } from "@/lib/stripe/subscription-service";

export const runtime = "nodejs";
export const maxDuration = 300;

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
    logStage("auth:start");
    const session = await withStageTimeout("auth", auth(), 8000);
    logStage("auth:done");

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const json = await request.json();
    const parsed = generateSheetRequestSchema.parse(json);
    const input = {
      ...parsed,
      userId: session.user.id,
    };
    const contentLength = input.content.trim().length;
    console.log(
      `[GENERATE][payload] sourceType=${input.sourceType} contentLength=${contentLength} titleHint="${input.titleHint ?? ""}" subject="${input.subject ?? ""}"`,
    );

    let quota = null;

    logStage("quota:start");
    const quotaCheck = await withStageTimeout(
      "quota:check",
      canGenerateSheet(session.user.id),
      8000,
    );

    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          error: "LIMIT_REACHED",
          message: quotaCheck.reason ?? "Limite mensuelle atteinte.",
        },
        { status: 403 },
      );
    }

    quota = {
      allowed: true,
      remaining: quotaCheck.remaining,
      limit: quotaCheck.limit,
    };
    logStage("quota:done");

    let resolvedDocumentId = input.documentId;

    if (!resolvedDocumentId) {
      try {
        logStage("document:create:start");
        const generatedDocument = await withStageTimeout(
          "document:create",
          db.document.create({
            data: {
              userId: input.userId,
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
          if (documentError instanceof GenerateStageTimeoutError) {
            throw documentError;
          }
          throw documentError;
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
            userId: input.userId,
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
      if (pendingError instanceof GenerateStageTimeoutError) {
        throw pendingError;
      }
      throw pendingError;
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
