import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getPersistenceFallbackMessage, isDatabaseConnectionError } from "@/lib/database-fallback";
import { deriveClassicSheetFromFiche } from "@/lib/fiche-storage";
import { detectSubjectFamily, getFlashcardCap, getSubjectFamilyCaps } from "@/lib/subject-families";
import { generateSheetRequestSchema } from "@/lib/validations";
import { generateRichFiche } from "@/services/fiche-generator-service";
import { saveGeneratedSheet } from "@/services/sheet-service";
import { assertSheetQuota, trackUsage } from "@/services/usage-service";

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
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const rawTitle = title.trim();
  const normalizedTitle = normalizeForComparison(rawTitle);
  const normalizedOriginal = normalizeForComparison(originalFilename ?? "");
  const normalizedCleanedOriginal = normalizeForComparison(cleanFilename(originalFilename ?? ""));
  const titleWordCount = normalizedTitle ? normalizedTitle.split(/\s+/).length : 0;
  const originalLooksLikeFilename = Boolean(originalFilename) && (
    /[_-]/.test(originalFilename ?? "")
    || /^\d/.test((originalFilename ?? "").trim())
    || /\.[a-z0-9]{2,4}$/i.test(originalFilename ?? "")
  );

  return normalizedTitle.length > 0 && (
    (normalizedOriginal.length > 0 && normalizedTitle === normalizedOriginal)
    || (normalizedCleanedOriginal.length > 0 && normalizedTitle === normalizedCleanedOriginal)
    || /^[a-z0-9]+-\d+-?/i.test(title.trim())
    || /^[a-z0-9]+(?:[-_][a-z0-9]+){2,}$/i.test(title.trim())
    || /^\d+[\s\-_.]+/.test(rawTitle)
    || (
      originalLooksLikeFilename
      && titleWordCount > 0
      && titleWordCount < 5
      && normalizedCleanedOriginal.length > 0
      && (
        normalizedTitle === normalizedCleanedOriginal
        || normalizedCleanedOriginal.includes(normalizedTitle)
        || normalizedTitle.includes(normalizedCleanedOriginal)
      )
    )
  );
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function countNonEmptySections(data: any): number {
  const sections = [
    hasText(data.imageMentale?.titre) || hasText(data.imageMentale?.texte),
    hasText(data.definition),
    (data.formulesCles?.length ?? 0) > 0,
    (data.notionsCles?.length ?? 0) > 0,
    hasText(data.exemple),
    hasText(data.piege),
    (data.schema?.elements?.length ?? 0) > 0 || (data.schema?.description ? true : false),
    hasText(data.feynman),
    (data.flashcards?.length ?? 0) > 0,
  ];

  return sections.filter(Boolean).length;
}

function buildHeaderMetrics(data: any) {
  return [
    { valeur: String(countNonEmptySections(data)), label: "parties du cours" },
    { valeur: String(data.formulesCles?.length ?? 0), label: "formules et relations" },
    { valeur: String(data.notionsCles?.length ?? 0), label: "proprietes et criteres" },
  ];
}

function resolveSubjectFamily(data: any) {
  if (
    data?.metadata?.subjectFamily === "exact_sciences"
    || data?.metadata?.subjectFamily === "life_sciences"
    || data?.metadata?.subjectFamily === "humanities_history"
    || data?.metadata?.subjectFamily === "humanities_text"
    || data?.metadata?.subjectFamily === "languages"
    || data?.metadata?.subjectFamily === "economics"
    || data?.metadata?.subjectFamily === "general"
  ) {
    return data.metadata.subjectFamily;
  }

  if (
    data?.subjectFamily === "exact_sciences"
    || data?.subjectFamily === "life_sciences"
    || data?.subjectFamily === "humanities_history"
    || data?.subjectFamily === "humanities_text"
    || data?.subjectFamily === "languages"
    || data?.subjectFamily === "economics"
    || data?.subjectFamily === "general"
  ) {
    return data.subjectFamily;
  }

  return detectSubjectFamily(
    data?.matiere
    || data?.classification?.matiere
    || data?.subject
    || "",
  );
}

function isTruncatedNode(label: string) {
  return label.trim().length < 4
    || ["probl", "ainsi", "terre", "suite", "cause", "donc", "etat", "premi", "deuxi", "troisi"].includes(
      label.trim().toLowerCase(),
    );
}

function startsWithLowercaseFragment(text: string) {
  return /^[a-zàâéèêëîïôùûüç]/.test(text.trim());
}

function startsWithConjugatedVerb(text: string) {
  return /^(sont|est|ont|a|était|sera|peut|doit|fait|va|permet)\b/i.test(text.trim());
}

function hasIdentifiableConcept(text: string) {
  const firstWords = text.trim().split(/\s+/).slice(0, 3);
  return firstWords.some((word) => /^[A-ZÀÂÉÈÊËÎÏÔÙÛÜÇ]/.test(word));
}

function enforceSheetLimits(data: any): any {
  const family = resolveSubjectFamily(data);
  const { formules: formulesCap } = getSubjectFamilyCaps(family);
  const flashcardCap = getFlashcardCap(family);

  if (data.coreBlocks?.length > 4) {
    const priorityOrder: Record<string, number> = {
      concept: 1,
      formula: 2,
      rule: 2,
      example: 3,
      trap: 4,
      methode: 2,
    };
    const sortedCoreBlocks = [...data.coreBlocks].sort((a: any, b: any) => {
      return (priorityOrder[a?.type] ?? 5) - (priorityOrder[b?.type] ?? 5);
    });
    console.warn("[VALIDATION] coreBlocks tronque:", data.coreBlocks.length, "→ 4");
    data.coreBlocks = sortedCoreBlocks.slice(0, 4);
  }

  if (data.formulesCles?.length > formulesCap) {
    console.warn("[VALIDATION] formulesCles tronque:", data.formulesCles.length, "->", formulesCap);
    data.formulesCles = data.formulesCles.slice(0, formulesCap);
  }
  if (data.flashcards?.length > flashcardCap) {
    console.warn("[VALIDATION] flashcards tronqué:",
      data.flashcards.length, "→", flashcardCap,
      "(famille:", family, ")");
    data.flashcards = data.flashcards.slice(0, flashcardCap);
  }
  if (data.actionQuiz?.length > flashcardCap) {
    console.warn("[VALIDATION] actionQuiz tronque:", data.actionQuiz.length, "->", flashcardCap);
    data.actionQuiz = data.actionQuiz.slice(0, flashcardCap);
  }

  if (data.proprietesCles?.length > 0) {
    const merged = [...(data.notionsCles || []), ...data.proprietesCles];
    data.notionsCles = merged.slice(0, 4);
    data.proprietesCles = [];
    console.warn("[VALIDATION] proprietesCles fusionne dans notionsCles");
  }
  if (data.notionsCles?.length > 4) {
    data.notionsCles = data.notionsCles.slice(0, 4);
  }

  if (data.etapes?.length > 0) {
    console.warn("[VALIDATION] etapes supprime:", data.etapes.length, "items");
    data.etapes = [];
  }
  if (data.applications?.length > 0) {
    console.warn("[VALIDATION] applications supprime:", data.applications.length, "items");
    data.applications = [];
  }

  if (data.notionsCles?.length > 0) {
    const introPatterns = [
      /^dans (ce|le|un|notre) chapitre/i,
      /^nous (allons|verrons|etudions|abordons)/i,
      /^ce cours (porte|traite|presente|aborde)/i,
      /^cette (partie|section|lecon|sequence)/i,
      /^l'objectif (de|du|est|sera)/i,
      /^introduction\s/i,
      /^rappel\s*:/i,
      /^prerequis\s*:/i,
      /^[A-Z]\.\s+[A-Z]/,
      /^(definition|d[ée]finition|th[ée]or[èe]me|theoreme|lemme|corollaire|proposition|remarque|exemple|exercice|preuve|d[ée]monstration)\s+[\d.]+/i,
      /^\d+\.\d+(\.\d+)*\s+(definition|d[ée]finition|th[ée]or[èe]me|theoreme|lemme|exemple|remarque)/i,
      /^\(\d+\)\s+l[''´`]?experience/i,
      /^\(\d+\)\s+(on |l[''´`]?|soit |notons |posons )/i,
      /[□■▪▫]{2,}/,
      /\\[a-z]+\{[^}]*\}/,
      /[uq]\}|t\d+,\.\.\./,
      /\\\w+\s*[\(\[]/,
      /on souhaite .*?(etudiant|cursus|reussite|parcours)/i,
      /bonne (chance|reussite|continuation|annee)/i,
      /nous (esperons|souhaitons) que/i,
      /l'equipe (pedagogique|enseignante)/i,
      /cordialement/i,
      /a (tous|toutes) (nos|les) (etudiants|eleves)/i,
      /universit[eé].*(bordeaux|paris|lyon|marseille|toulouse|strasbourg|lille|nantes|montpellier|nice|rennes|grenoble)/i,
      /master|licence\s+\d|l\d\s+math/i,
      /https?:\/\/|www\.|\.pdf\b|\.html?\b/i,
    ];
    const before = data.notionsCles.length;
    data.notionsCles = data.notionsCles.filter((notion: any) => {
      const text = (typeof notion === "string"
        ? notion
        : (notion.contenu || notion.texte || notion.content || ""))
        .trim();
      if (!text) {
        return false;
      }

      if (introPatterns.some((pattern) => pattern.test(text))) {
        return false;
      }

      if (startsWithLowercaseFragment(text)) {
        return false;
      }

      if (startsWithConjugatedVerb(text)) {
        return false;
      }

      if (!hasIdentifiableConcept(text)) {
        return false;
      }

      if (family !== "exact_sciences" && /\b(vecteur|force)\b/i.test(text)) {
        return false;
      }

      return true;
    });
    if (data.notionsCles.length < before) {
      console.warn(
        "[VALIDATION] notionsCles: supprime",
        before - data.notionsCles.length,
        "phrases d'intro",
      );
    }
  }

  if (data.exemple || data.exempleConsolide || data.exemplesConcrets) {
    const exempleField = data.exemple || data.exempleConsolide;
    if (exempleField && typeof exempleField === "string") {
      const trimmedExample = exempleField.trim();
      const isChapterRef = (
        /^\d[\d\s.]*\d/.test(trimmedExample)
        || /^(Definition|D[ée]finition|Chapitre|Section|Partie|Exercice|Activite|Activité)\s/i.test(trimmedExample)
        || (trimmedExample.split(/\s+/).length < 20 && /\d+\.\d+/.test(trimmedExample))
      );
      if (isChapterRef) {
        console.warn("[VALIDATION] exemple parasite detecte et vide:", trimmedExample.substring(0, 60));
        if (data.exemple) data.exemple = "";
        if (data.exempleConsolide) data.exempleConsolide = "";
      }
    }
  }

  if (data.blueprintSections) {
    if (data.blueprintSections.tableauSynthese?.length > 0) {
      console.warn("[VALIDATION] tableauSynthese supprime:", data.blueprintSections.tableauSynthese.length, "items");
      data.blueprintSections.tableauSynthese = [];
    }
    if (data.blueprintSections.etapesCles?.length > 0) {
      console.warn("[VALIDATION] etapes supprime:", data.blueprintSections.etapesCles.length, "items");
      data.blueprintSections.etapesCles = [];
    }
    if (data.blueprintSections.applications?.length > 0) {
      console.warn("[VALIDATION] applications supprime:", data.blueprintSections.applications.length, "items");
      data.blueprintSections.applications = [];
    }

    const blueprintFieldsToEmpty = [
      "pseudoCode",
      "casLimites",
      "cas_limites",
      "casLimitesARetenir",
      "distinctions",
      "reperes",
      "repèresAMémoriser",
      "reperesAMemoriser",
      "reperes_a_memoriser",
      "REPERES",
      "classifications",
    ];

    const blueprintSections = data.blueprintSections as Record<string, unknown>;

    for (const field of blueprintFieldsToEmpty) {
      if (blueprintSections[field] !== undefined) {
        console.warn(
          "[VALIDATION] section blueprint videe:",
          field,
          Array.isArray(blueprintSections[field])
            ? `${blueprintSections[field].length} items`
            : typeof blueprintSections[field],
        );
        blueprintSections[field] = Array.isArray(blueprintSections[field]) ? [] : null;
      }
    }
  }

  const nonConceptualNodes = [
    "terminale", "premiere", "première", "seconde", "lycee", "lycée", "bac", "examen",
    "revision", "révision", "introduction", "conclusion", "exercice", "activite", "activité",
    "chapitre", "section", "partie", "cours", "lecon", "leçon", "manuel",
  ];
  const mindMapConfigs = [
    { nodes: data.schema?.elements, edges: data.schema?.connexions, source: "schema" },
    { nodes: data.carteFormule?.nodes, edges: data.carteFormule?.edges, source: "carteFormule" },
    { nodes: data.mindMap?.nodes, edges: data.mindMap?.edges, source: "mindMap" },
    { nodes: data.carte?.nodes, edges: data.carte?.edges, source: "carte" },
  ];

  for (const config of mindMapConfigs) {
    if (!Array.isArray(config.nodes) || config.nodes.length === 0) {
      continue;
    }

    const before = config.nodes.length;
    const removedIds = new Set<string>();
    const filteredNodes = config.nodes.filter((node: any) => {
      const rawLabel = (node?.label || node?.id || node?.name || "").trim();
      if (!rawLabel) {
        return false;
      }

      const normalizedLabel = rawLabel.toLowerCase();
      const isAllCaps = rawLabel === rawLabel.toUpperCase() && rawLabel.length > 2 && /[A-ZÀ-Ý]/.test(rawLabel);
      const isNonConceptual = nonConceptualNodes.includes(normalizedLabel);
      const keep = !isAllCaps && !isNonConceptual;

      if (!keep && typeof node?.id === "string") {
        removedIds.add(node.id);
      }
      return keep;
    });
    const normalizedNodes = filteredNodes.map((node: any) => {
      const rawLabel = String(node?.label || node?.id || node?.name || "");

      if (isTruncatedNode(rawLabel)) {
        return {
          ...node,
          label: "[concept manquant]",
        };
      }

      return node;
    });

    if (config.source === "schema") {
      data.schema.elements = normalizedNodes;
      if (removedIds.size > 0 && Array.isArray(data.schema.connexions)) {
        data.schema.connexions = data.schema.connexions.filter(
          (connexion: any) => !removedIds.has(connexion?.de) && !removedIds.has(connexion?.vers),
        );
      }
    } else if (config.source === "carteFormule") {
      data.carteFormule.nodes = normalizedNodes;
    } else if (config.source === "mindMap") {
      data.mindMap.nodes = normalizedNodes;
    } else if (config.source === "carte") {
      data.carte.nodes = normalizedNodes;
    }

    if (normalizedNodes.length < before) {
      console.warn("[VALIDATION] carte mentale: supprime", before - normalizedNodes.length, "noeuds non-conceptuels");
    }
  }

  const sim = typeof data.feynman === "object" && data.feynman?.angle
    ? data.feynman.angle.toLowerCase()
    : typeof data.feynman === "string"
      ? data.feynman.toLowerCase()
      : "";
  const ref = typeof data.imageMentale === "object" && data.imageMentale?.metaphore
    ? data.imageMentale.metaphore.toLowerCase()
    : typeof data.imageMentale === "object" && data.imageMentale?.texte
      ? data.imageMentale.texte.toLowerCase()
      : "";

  if (sim && ref) {
    const overlap = sim.split(" ").filter((w: string) => w.length > 4 && ref.includes(w)).length;
    const ratio = overlap / sim.split(" ").length;
    if (ratio > 0.6) {
      if (typeof data.feynman === "object" && data.feynman) {
        data.feynman.angle = "";
      } else {
        data.feynman = "";
      }
      console.warn("[VALIDATION] feynman trop similaire a imageMentale - vide");
    }
  }

  return data;
}

export async function POST(request: Request) {
  try {
    let session = null;

    try {
      session = await auth();
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
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

    let quota = null;
    let warning: string | undefined;

    if (session?.user?.id) {
      try {
        quota = await assertSheetQuota(session.user.id, session.user.plan ?? "FREE");
      } catch (error) {
        if (!isDatabaseConnectionError(error)) {
          throw error;
        }

        console.error("Quota lookup failed, continuing without persistence.", error);
        warning = getPersistenceFallbackMessage();
      }
    }

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

    let sheetId: string | null = null;

    try {
      const sheet = await saveGeneratedSheet(input, generated, fiche);
      sheetId = sheet.id;
      await trackUsage(input.userId, "sheet_generated");
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      console.error("Sheet persistence failed, returning preview payload.", error);
      warning = getPersistenceFallbackMessage();
    }

    return NextResponse.json({
      success: true,
      sheetId,
      quota,
      data: generated,
      fiche,
      warning,
      mode: process.env.ANTHROPIC_API_KEY ? "ai_or_fallback" : "demo",
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
