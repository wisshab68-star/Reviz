import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sanitizeAiJsonValue } from "@/lib/text";
import { optionalNonEmptyTrimmedString } from "@/lib/validations";
import { assessSourceQuality } from "@/services/extract-service";
import { generateInventory, createInventoryBudget } from "@/services/generation-pipeline";
import {
  assertInventoryNotEmpty,
  buildStoredInventoryPayload,
} from "@/services/generate-sheet-stages";

export const runtime = "nodejs";
export const maxDuration = 60;

const inventoryRequestSchema = z.object({
  sheetId: z.string().cuid(),
  content: z.string().trim().min(80),
  subject: z.string().trim().min(2).max(80).optional(),
  titleHint: optionalNonEmptyTrimmedString,
  userId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  const budget = createInventoryBudget(); // start budget before auth to include all overhead

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = inventoryRequestSchema.parse(await request.json());
    const quality = assessSourceQuality(parsed.content);

    if (!quality.isUsable) {
      return Response.json(
        {
          error: "UNPROCESSABLE_FILE",
          reason: quality.reason,
          tokens_used: 0,
        },
        { status: 422 },
      );
    }

    const inventoryRecord = buildStoredInventoryPayload(parsed);
    const inventory = await generateInventory(inventoryRecord.sourceText, inventoryRecord.profile, budget);
    assertInventoryNotEmpty(inventory);

    const sheet = await db.studySheet.findFirst({
      where: {
        id: parsed.sheetId,
        userId: session.user.id,
      },
      select: { id: true },
    });

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "Sheet not found" },
        { status: 404 },
      );
    }

    await db.studySheet.update({
      where: { id: sheet.id },
      data: {
        inventoryJson: sanitizeAiJsonValue({
          ...inventoryRecord,
          inventory,
        }) as unknown as Prisma.InputJsonValue,
        status: "PROCESSING",
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      sheetId: parsed.sheetId,
      inventoryId: parsed.sheetId,
    });
  } catch (error) {
    console.error("[GENERATE][INVENTORY] failed:", error);

    const message = error instanceof Error ? error.message : "La generation de l'inventaire a echoue.";
    const isTimeout = /PIPELINE_BUDGET_EXCEEDED/i.test(message);

    return NextResponse.json(
      {
        success: false,
        error: isTimeout ? "FUNCTION_INVOCATION_TIMEOUT" : message,
      },
      { status: 500 },
    );
  }
}

