import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { deriveClassicSheetFromFiche } from "@/lib/fiche-storage";
import { generateSheetRequestSchema } from "@/lib/validations";
import { generateRichFiche } from "@/services/fiche-generator-service";
import { saveGeneratedSheet } from "@/services/sheet-service";
import { assertSheetQuota, trackUsage } from "@/services/usage-service";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const json = await request.json();
    const parsed = generateSheetRequestSchema.parse(json);
    const input = {
      ...parsed,
      userId: session?.user?.id ?? parsed.userId,
    };

    const quota = session?.user?.id
      ? await assertSheetQuota(session.user.id, session.user.plan ?? "FREE")
      : null;

    const fiche = await generateRichFiche(input);
    const generated = deriveClassicSheetFromFiche(fiche);
    const sheet = await saveGeneratedSheet(input, generated, fiche);
    await trackUsage(input.userId, "sheet_generated");

    return NextResponse.json({
      success: true,
      sheetId: sheet.id,
      quota,
      data: generated,
      fiche,
      mode: process.env.OPENAI_API_KEY ? "ai_or_fallback" : "demo",
    });
  } catch (error) {
    console.error("POST /api/generate failed", error);

    const message = error instanceof Error
      ? error.message
      : "Unexpected server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 },
    );
  }
}
