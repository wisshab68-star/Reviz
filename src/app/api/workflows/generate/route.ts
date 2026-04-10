import { NextRequest } from "next/server";

import { deriveClassicSheetFromFiche } from "@/lib/fiche-storage";
import { detectSubjectFamily, getFlashcardCap, getSubjectFamilyCaps } from "@/lib/subject-families";
import { generateRichFiche } from "@/services/fiche-generator-service";
import { finalizePendingSheet, failPendingSheet } from "@/services/sheet-service";
import { trackUsage } from "@/services/usage-service";

export const runtime = "nodejs";
export const maxDuration = 300;

function resolveSubjectFamily(data: any) {
  const families = [
    "exact_sciences", "life_sciences", "humanities_history",
    "humanities_text", "languages", "economics", "general",
  ] as const;

  for (const source of [data?.metadata?.subjectFamily, data?.subjectFamily]) {
    if (families.includes(source)) return source;
  }

  return detectSubjectFamily(
    data?.matiere || data?.classification?.matiere || data?.subject || "",
  );
}

function enforceSheetLimits(data: any): any {
  const family = resolveSubjectFamily(data);
  const { formules: formulesCap } = getSubjectFamilyCaps(family);
  const flashcardCap = getFlashcardCap(family);

  if (data.coreBlocks?.length > 4) {
    const priorityOrder: Record<string, number> = {
      concept: 1, formula: 2, rule: 2, example: 3, trap: 4, methode: 2,
    };
    data.coreBlocks = [...data.coreBlocks]
      .sort((a: any, b: any) => (priorityOrder[a?.type] ?? 5) - (priorityOrder[b?.type] ?? 5))
      .slice(0, 4);
  }

  if (data.formulesCles?.length > formulesCap) {
    data.formulesCles = data.formulesCles.slice(0, formulesCap);
  }
  if (data.flashcards?.length > flashcardCap) {
    data.flashcards = data.flashcards.slice(0, flashcardCap);
  }
  if (data.actionQuiz?.length > flashcardCap) {
    data.actionQuiz = data.actionQuiz.slice(0, flashcardCap);
  }
  if (data.proprietesCles?.length > 0) {
    data.notionsCles = [...(data.notionsCles || []), ...data.proprietesCles].slice(0, 4);
    data.proprietesCles = [];
  }
  if (data.notionsCles?.length > 4) {
    data.notionsCles = data.notionsCles.slice(0, 4);
  }
  if (data.etapes?.length > 0) data.etapes = [];
  if (data.applications?.length > 0) data.applications = [];

  if (data.blueprintSections) {
    if (data.blueprintSections.tableauSynthese?.length > 0) data.blueprintSections.tableauSynthese = [];
    if (data.blueprintSections.etapesCles?.length > 0) data.blueprintSections.etapesCles = [];
    if (data.blueprintSections.applications?.length > 0) data.blueprintSections.applications = [];
  }

  return data;
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

function looksLikeFilenameTitle(title: string, originalFilename?: string): boolean {
  const normalizeForComparison = (value: string) =>
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      .replace(/\s+/g, " ").trim().toLowerCase();

  const normalizedTitle = normalizeForComparison(title);
  const normalizedOriginal = normalizeForComparison(originalFilename ?? "");
  const normalizedCleaned = normalizeForComparison(cleanFilename(originalFilename ?? ""));

  return normalizedTitle.length > 0 && (
    (normalizedOriginal.length > 0 && normalizedTitle === normalizedOriginal)
    || (normalizedCleaned.length > 0 && normalizedTitle === normalizedCleaned)
    || /^[a-z0-9]+-\d+-?/i.test(title.trim())
    || /^[a-z0-9]+(?:[-_][a-z0-9]+){2,}$/i.test(title.trim())
    || /^\d+[\s\-_.]+/.test(title.trim())
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function countNonEmptySections(data: any): number {
  return [
    hasText(data.imageMentale?.titre) || hasText(data.imageMentale?.texte),
    hasText(data.definition),
    (data.formulesCles?.length ?? 0) > 0,
    (data.notionsCles?.length ?? 0) > 0,
    hasText(data.exemple),
    hasText(data.piege),
    (data.schema?.elements?.length ?? 0) > 0 || !!data.schema?.description,
    hasText(data.feynman),
    (data.flashcards?.length ?? 0) > 0,
  ].filter(Boolean).length;
}

function buildHeaderMetrics(data: any) {
  return [
    { valeur: String(countNonEmptySections(data)), label: "parties du cours" },
    { valeur: String(data.formulesCles?.length ?? 0), label: "formules et relations" },
    { valeur: String(data.notionsCles?.length ?? 0), label: "proprietes et criteres" },
  ];
}

export async function POST(req: NextRequest) {
  const { sheetId, input } = await req.json();

  try {
    const fiche = enforceSheetLimits(await generateRichFiche(input));
    fiche.subjectFamily = fiche.subjectFamily ?? resolveSubjectFamily(fiche);

    const generatedModelTitle = typeof fiche.titre === "string" ? fiche.titre.trim() : "";
    const cleanedFallbackTitle = input.titleHint ? cleanFilename(input.titleHint) : "";
    const finalTitle = (
      generatedModelTitle && !looksLikeFilenameTitle(generatedModelTitle, input.titleHint)
        ? generatedModelTitle
        : cleanedFallbackTitle
    ) || generatedModelTitle || "Fiche de revision";

    fiche.titre = finalTitle;
    fiche.metriques = buildHeaderMetrics(fiche);
    const generated = deriveClassicSheetFromFiche(fiche);

    await finalizePendingSheet(sheetId, generated, fiche);
    await trackUsage(input.userId, "sheet_generated");

    return Response.json({ success: true });
  } catch (error) {
    console.error("[WORKFLOW ERROR]", error);

    try {
      await failPendingSheet(
        sheetId,
        error instanceof Error ? error.message : "La generation a echoue.",
      );
    } catch (statusError) {
      console.error("[WORKFLOW] Failed to mark sheet as FAILED:", statusError);
    }

    return Response.json({ success: false }, { status: 500 });
  }
}
