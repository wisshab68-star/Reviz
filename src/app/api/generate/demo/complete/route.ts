import { NextRequest, NextResponse } from "next/server";

import { hashDemoStagePayload, verifyDemoStageToken } from "@/lib/demo-stage-token";
import { generateSheet, sanitizeFicheOutput } from "@/services/generation-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/generate/demo/complete
 * Step 2 — sheet generation: takes inventory from step 1, returns final fiche.
 */
export async function POST(req: NextRequest) {
  try {
    const forwarded = req.headers.get("x-forwarded-for");
    const clientIp = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const cookieToken = req.cookies.get("reviz_demo_stage")?.value;
    const body = await req.json() as {
      sourceText?: string;
      inventory?: unknown;
      profile?: unknown;
      classified?: unknown;
      blueprint?: unknown;
      strictFormulas?: string[];
      token?: string;
    };

    if (
      !body.inventory
      || !body.profile
      || !body.classified
      || !body.blueprint
      || !body.sourceText
      || !body.token
    ) {
      return NextResponse.json({ error: "Donnees de pipeline manquantes." }, { status: 400 });
    }

    if (!cookieToken || cookieToken !== body.token) {
      return NextResponse.json({ error: "Session demo invalide ou expiree." }, { status: 403 });
    }

    const stagePayload = {
      step: "inventory",
      sourceText: body.sourceText,
      inventory: body.inventory,
      profile: body.profile,
      classified: body.classified,
      blueprint: body.blueprint,
      strictFormulas: body.strictFormulas ?? [],
    } as const;

    const isValidToken = verifyDemoStageToken(body.token, {
      payloadHash: hashDemoStagePayload(stagePayload),
      clientIp,
    });

    if (!isValidToken) {
      return NextResponse.json({ error: "Jeton demo invalide ou expire." }, { status: 403 });
    }

    const sheet = await generateSheet(
      stagePayload.inventory as Parameters<typeof generateSheet>[0],
      stagePayload.sourceText,
      stagePayload.profile as Parameters<typeof generateSheet>[2],
      stagePayload.classified as Parameters<typeof generateSheet>[3],
      stagePayload.blueprint as Parameters<typeof generateSheet>[4],
      stagePayload.strictFormulas,
    );

    const fiche = sanitizeFicheOutput(sheet);
    const response = NextResponse.json({ fiche });
    response.cookies.set("reviz_demo_stage", "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
      path: "/api/generate/demo/complete",
    });
    return response;
  } catch (err) {
    console.error("[demo/complete] error", err);
    return NextResponse.json(
      { error: "Erreur lors de la generation de la fiche. Reessaie." },
      { status: 500 },
    );
  }
}
