import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/lib/db";
import { sanitizeAiJsonValue } from "@/lib/text";
import { generateInventory } from "@/services/generation-pipeline";
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
  titleHint: z.string().trim().min(1).max(160).optional(),
  userId: z.string().cuid().optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = inventoryRequestSchema.parse(await request.json());
    const inventoryRecord = buildStoredInventoryPayload(parsed);
    const inventory = await generateInventory(inventoryRecord.sourceText, inventoryRecord.profile);
    assertInventoryNotEmpty(inventory);

    await db.studySheet.update({
      where: { id: parsed.sheetId },
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

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "La generation de l'inventaire a echoue.",
      },
      { status: 500 },
    );
  }
}
