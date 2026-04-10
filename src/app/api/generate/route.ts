import { after, NextResponse } from "next/server";
import { DocumentType, Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { getPersistenceFallbackMessage, isDatabaseConnectionError } from "@/lib/database-fallback";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche } from "@/lib/fiche-storage";
import { generateSheetRequestSchema } from "@/lib/validations";
import { generateRichFiche } from "@/services/fiche-generator-service";
import { saveGeneratedSheet } from "@/services/sheet-service";
import { assertSheetQuota, trackUsage } from "@/services/usage-service";

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
  const requestUrl = new URL(request.url);
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
    let warning: string | undefined;

    if (session?.user?.id) {
      try {
        logStage("quota:start");
        quota = await withStageTimeout(
          "quota",
          assertSheetQuota(session.user.id, session.user.plan ?? "FREE"),
          8000,
        );
        logStage("quota:done");
      } catch (error) {
        if (!isDatabaseConnectionError(error)) {
          if (error instanceof GenerateStageTimeoutError) {
            throw error;
          }
          throw error;
        }

        console.error("Quota lookup failed, continuing without persistence.", error);
        warning = getPersistenceFallbackMessage();
      }
    }

    const runImmediateGeneration = async (extraWarning?: string) => {
      const fiche = await generateRichFiche(input);
      const generated = deriveClassicSheetFromFiche(fiche);
      let sheetId: string | null = null;
      let localWarning = extraWarning ?? warning;

      try {
        const sheet = await saveGeneratedSheet(input, generated, fiche);
        sheetId = sheet.id;
        await trackUsage(input.userId, "sheet_generated");
      } catch (dbError) {
        console.error("[GENERATE] DB save failed (non-blocking):", dbError);
        localWarning = [localWarning, getPersistenceFallbackMessage()].filter(Boolean).join(" ");
      }

      return NextResponse.json({
        success: true,
        sheetId,
        quota,
        data: generated,
        fiche,
        warning: localWarning,
        mode: process.env.ANTHROPIC_API_KEY ? "ai_or_fallback" : "demo",
      });
    };

    if (!process.env.ANTHROPIC_API_KEY) {
      return runImmediateGeneration();
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

        console.error("[GENERATE] Document creation failed, falling back to immediate flow:", documentError);
        return runImmediateGeneration(getPersistenceFallbackMessage());
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

      console.error("[GENERATE] Pending sheet creation failed, falling back to immediate flow:", pendingError);
      return runImmediateGeneration(getPersistenceFallbackMessage());
    }

    try {
      logStage("inventory:start");
      const inventoryResponse = await withStageTimeout(
        "inventory:start",
        fetch(new URL("/api/generate/inventory", requestUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sheetId: pendingSheet.id,
            content: input.content,
            subject: input.subject,
            titleHint: input.titleHint,
            userId: input.userId,
          }),
          cache: "no-store",
        }),
        58_000,
      );
      const inventoryData = await inventoryResponse.json() as { success: boolean; error?: string };
      if (!inventoryResponse.ok || !inventoryData.success) {
        throw new Error(inventoryData.error ?? "La generation de l'inventaire a echoue.");
      }
      logStage("inventory:done");

      after(async () => {
        try {
          const sheetResponse = await fetch(new URL("/api/generate/sheet", requestUrl), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ sheetId: pendingSheet.id }),
            cache: "no-store",
          });

          if (!sheetResponse.ok) {
            const sheetData = await sheetResponse.json().catch(() => null) as { error?: string } | null;
            console.error("[GENERATE] Sheet route returned an error:", sheetData?.error ?? sheetResponse.statusText);
          }
        } catch (sheetTriggerError) {
          console.error("[GENERATE] Failed to trigger sheet generation route:", sheetTriggerError);

          try {
            await db.studySheet.update({
              where: { id: pendingSheet.id },
              data: {
                status: "FAILED",
                summary: "Le demarrage de la generation de fiche a echoue.",
                updatedAt: new Date(),
              },
            });
          } catch (updateError) {
            console.error("[GENERATE] Failed to mark pending sheet as FAILED after sheet trigger error:", updateError);
          }
        }
      });
      logStage("sheet:scheduled");
    } catch (pipelineError) {
      console.error("[GENERATE] Pipeline start failed:", pipelineError);

      try {
        await db.studySheet.update({
          where: { id: pendingSheet.id },
          data: {
            status: "FAILED",
            summary: "Le demarrage de la generation a echoue.",
            updatedAt: new Date(),
          },
        });
      } catch (updateError) {
        console.error("[GENERATE] Failed to mark pending sheet as FAILED after pipeline start error:", updateError);
      }

      return NextResponse.json(
        {
          success: false,
          error: pipelineError instanceof GenerateStageTimeoutError
            ? `Diagnostic: blocage sur ${pipelineError.stage} apres ${pipelineError.timeoutMs / 1000}s.`
            : "Le demarrage de la generation a echoue. Reessaie dans quelques instants.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      sheetId: pendingSheet.id,
      quota,
      warning,
      queued: true,
      status: pendingSheet.status,
      mode: "ai_or_fallback",
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
