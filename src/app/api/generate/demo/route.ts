import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createDemoStageToken, hashDemoStagePayload } from "@/lib/demo-stage-token";
import { cleanAndClassify } from "@/lib/prompts/classify-content";
import { selectPedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import {
  inferDocumentProfile,
  generateInventory,
  countInventoryElements,
  collectStrictFormulas,
} from "@/services/generation-pipeline";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEMO_RATE_LIMIT = 2;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

async function checkRateLimit(ip: string): Promise<boolean> {
  const now = new Date();
  const record = await db.demoRateLimit.findUnique({ where: { ip } });

  if (!record || now > record.resetAt) {
    await db.demoRateLimit.upsert({
      where: { ip },
      create: { ip, count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
      update: { count: 1, resetAt: new Date(now.getTime() + WINDOW_MS) },
    });
    return true;
  }

  if (record.count >= DEMO_RATE_LIMIT) {
    return false;
  }

  await db.demoRateLimit.update({
    where: { ip },
    data: { count: { increment: 1 } },
  });

  return true;
}

/**
 * POST /api/generate/demo
 * Step 1 — inventory: classify + build inventory + select blueprint
 * Returns serialized intermediate state for step 2.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const allowed = await checkRateLimit(ip);

    if (!allowed) {
      return NextResponse.json(
        { error: "Limite atteinte. Cree un compte pour generer des fiches illimitees." },
        { status: 429 },
      );
    }

    const body = await req.json() as { subject?: string; content?: string; text?: string };

    const subject = typeof body.subject === "string" && body.subject.trim().length > 0
      ? body.subject.trim()
      : undefined;

    const content = (typeof body.content === "string" ? body.content : typeof body.text === "string" ? body.text : "").trim();

    if (content.length < 80) {
      return NextResponse.json({ error: "Le contenu est trop court." }, { status: 400 });
    }

    const input = { sourceType: "TEXT" as const, subject, content, userId: undefined };
    const classified = cleanAndClassify(content);
    const sourceText = classified.cleanedText.trim() || content;
    const profile = inferDocumentProfile(input, classified);

    const inventory = await generateInventory(sourceText, profile);
    const elementCount = countInventoryElements(inventory);

    if (elementCount === 0) {
      return NextResponse.json(
        { error: "Le contenu est trop court ou illisible pour generer une fiche." },
        { status: 422 },
      );
    }

    const blueprint = selectPedagogicalBlueprint(profile, inventory);
    profile.blueprint_recommande = blueprint.id;
    const strictFormulas = collectStrictFormulas(inventory, sourceText, profile, blueprint);

    const stageClassified = {
      ...classified,
      subject: subject ?? classified.subject,
      cleanedText: sourceText,
      matiere: subject ?? classified.subject,
      niveau: classified.level,
      blueprintId: blueprint.id,
      titre: inventory.titre || subject || classified.subject || "Fiche de revision",
    };

    const stagePayload = {
      step: "inventory",
      sourceText,
      inventory,
      profile,
      classified: stageClassified,
      blueprint,
      strictFormulas,
    } as const;

    const token = createDemoStageToken({
      payloadHash: hashDemoStagePayload(stagePayload),
      clientIp: ip,
      issuedAt: Date.now(),
    });

    const response = NextResponse.json({
      ...stagePayload,
      token,
    });

    response.cookies.set("reviz_demo_stage", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
      path: "/api/generate/demo/complete",
    });

    return response;
  } catch (err) {
    console.error("[demo/step1] error", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse du contenu. Reessaie." },
      { status: 500 },
    );
  }
}
