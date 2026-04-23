import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { deriveClassicSheetFromFiche } from "@/lib/fiche-storage";
import { sanitizeAiJsonValue } from "@/lib/text";
import { selectPedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import {
  collectStrictFormulas,
  createSheetBudget,
  generateSheet,
} from "@/services/generation-pipeline";
import {
  finalizeFicheForSave,
  markSheetFailed,
  parseStoredInventoryPayload,
  saveCompletedSheet,
} from "@/services/generate-sheet-stages";
import { trackUsage } from "@/services/usage-service";
import { sendGA4Event, extractGa4ClientId } from "@/lib/ga4-server";
import type { ClassifiedContent } from "@/lib/prompts/classify-content";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

export const runtime = "nodejs";
export const maxDuration = 60;

const sheetRequestSchema = z.object({
  sheetId: z.string().cuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gaCookie = request.headers.get("cookie")
    ?.split(";")
    .find((c) => c.trim().startsWith("_ga="))
    ?.split("=")[1];
  const ga4ClientId = extractGa4ClientId(gaCookie) ?? undefined;

  let parsedBody: { sheetId: string } | null = null;

  try {
    parsedBody = sheetRequestSchema.parse(await request.json());
    const { sheetId } = parsedBody;
    const sheet = await db.studySheet.findUnique({
      where: { id: sheetId },
      select: {
        id: true,
        userId: true,
        title: true,
        inventoryJson: true,
        document: {
          select: {
            extractedText: true,
            rawText: true,
          },
        },
      },
    });

    if (!sheet) {
      throw new Error("Fiche introuvable.");
    }

    if (sheet.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const stored = parseStoredInventoryPayload(sheet.inventoryJson);
    if (!stored) {
      throw new Error("L'inventaire intermediaire est introuvable ou invalide.");
    }

    const sourceText = sheet.document?.extractedText?.trim()
      || sheet.document?.rawText?.trim()
      || stored.sourceText.trim();

    if (!sourceText) {
      throw new Error("Le contenu source est introuvable pour generer la fiche.");
    }

    const blueprint = selectPedagogicalBlueprint(stored.profile, stored.inventory);
    const strictFormulas = collectStrictFormulas(stored.inventory, sourceText, stored.profile, blueprint);
    const classified: ClassifiedContent = {
      ...stored.classifiedInput,
      cleanedText: sourceText,
      matiere: stored.request.subject?.trim() || stored.classifiedInput.subject,
      niveau: stored.classifiedInput.level,
      blueprintId: blueprint.id,
      titre: stored.inventory.titre || stored.request.subject?.trim() || stored.classifiedInput.subject || "Fiche de revision",
    };

    const rawSheet = await generateSheet(
      stored.inventory,
      sourceText,
      stored.profile,
      classified,
      blueprint,
      strictFormulas,
      createSheetBudget(),
    );

    const fiche = finalizeFicheForSave(
      { titleHint: stored.request.titleHint ?? sheet.title },
      sanitizeAiJsonValue(rawSheet) as FicheGeneree,
    );
    const generated = sanitizeAiJsonValue(deriveClassicSheetFromFiche(fiche)) as GeneratedSheet;

    await saveCompletedSheet(sheetId, generated, fiche, sheet.userId ?? undefined);
    await trackUsage(sheet.userId ?? undefined, "sheet_generated");
    if (sheet.userId) {
      void sendGA4Event(sheet.userId, "sheet_generated", {
        sheetId,
        subject: classified.matiere,
        timestamp: new Date().toISOString(),
      }, ga4ClientId);
    }

    return NextResponse.json({
      success: true,
      sheetId,
      status: "COMPLETED",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "La generation de la fiche a echoue.";
    if (parsedBody?.sheetId) {
      try {
        await markSheetFailed(parsedBody.sheetId, message);
      } catch (markError) {
        console.error("[GENERATE][SHEET] failed to mark sheet as FAILED:", markError);
      }
    }

    console.error("[GENERATE][SHEET] failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 },
    );
  }
}
