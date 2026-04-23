import pdfParse from "pdf-parse";

import { MODELS } from "@/lib/models";
import { anthropic } from "@/lib/openai";
import { normalizeDocumentText, sanitizeText } from "@/lib/text";
import type { SourceQuality } from "@/types/generation-pipeline";

type ExtractedPayload = {
  extractedText: string;
  sourceType: "TEXT" | "PDF" | "IMAGE";
  mimeType: string;
};

function removePageNumbers(text: string) {
  return text.replace(/^\s*\d{1,4}\s*$/gm, "");
}

function removeRepetitiveHeaders(text: string) {
  const lines = text.split("\n");
  if (lines.length < 10) return text;

  const lineFrequency = new Map<string, number>();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 5 && trimmed.length < 100) {
      lineFrequency.set(trimmed, (lineFrequency.get(trimmed) ?? 0) + 1);
    }
  }

  const repetitive = new Set<string>();
  for (const [line, count] of lineFrequency) {
    if (count >= 3) repetitive.add(line);
  }

  if (repetitive.size === 0) return text;
  return lines.filter((line) => !repetitive.has(line.trim())).join("\n");
}

function removeOcrArtifacts(text: string) {
  return text
    .replace(/[^\S\n]{3,}/g, " ")
    .replace(/[|]{2,}/g, "")
    .replace(/[_]{3,}/g, "")
    .replace(/[=]{3,}/g, "")
    .replace(/[~]{3,}/g, "");
}

/**
 * Supprime les lignes de metadonnees du document source :
 * noms de profs, titres de manuels, copyright, ISBN, references de pages.
 * Doit etre applique au plus tot dans le pipeline (extraction) pour que
 * le texte stocke en base et envoye au client soit deja propre.
 */
function removeMetadataLines(text: string): string {
  const lines = text.split("\n");

  return lines.filter((line) => {
    const trimmed = line.trim();
    if (!trimmed) return true;

    const wordCount = trimmed.split(/\s+/).length;

    // Lignes courtes contenant un nom propre + mot-cle scolaire = metadata
    if (
      wordCount <= 10
      && /[A-Z][a-zà-ÿ]+\s+[A-Z][a-zà-ÿ]+/.test(trimmed)
      && /\b(Sp[eé]cialit[eé]|Terminale|Premi[eè]re|Seconde|Lyc[eé]e|Coll[eè]ge|Professeur|Prof\b|Manuel|[EÉ]dition|Acad[eé]mie)\b/i.test(trimmed)
    ) {
      return false;
    }

    // Copyright, ISBN, editeurs
    if (/^\s*(©|Copyright)\b/i.test(trimmed) || /^\s*ISBN\b/i.test(trimmed) || /\b[EÉ]ditions?\s+[A-Z]/i.test(trimmed)) {
      return false;
    }

    // References de pages isolees
    if (/^\s*(p\.?\s*\d|pp\.?\s*\d|fig\.?\s*\d)/i.test(trimmed) && wordCount <= 4) {
      return false;
    }

    // Lignes type "Chapitre 3" ou "Cours de Terminale" isolees
    if (
      /^(Chapitre|Cours|Le[cç]on|Activit[eé]|Exercice|Fiche|Document)\s+\d\b/i.test(trimmed)
      && wordCount <= 12
    ) {
      return false;
    }

    // Dates isolees
    if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(trimmed)) {
      return false;
    }

    return true;
  }).join("\n");
}

export function cleanExtractedText(text: string) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[CLEAN_INPUT_LENGTH] ${text.length}`);
  }

  let cleaned = normalizeDocumentText(text);
  cleaned = removePageNumbers(cleaned);
  cleaned = removeRepetitiveHeaders(cleaned);
  cleaned = removeMetadataLines(cleaned);
  cleaned = removeOcrArtifacts(cleaned);
  cleaned = cleaned
    .replace(/\\[a-zA-Z]+\{[^}]{0,50}\}/g, "")
    .replace(/[tuq]\{[^}]{0,20}\}/g, "")
    .replace(/[\u25A0-\u25FF□■]{2,}/g, "")
    .replace(/^\s*\d+\.\d+(\.\d+)*\s*$/gm, "")
    .replace(/[«»„"‟]/g, "\"")
    .replace(/\u201C|\u201D|\u201E|\u201F/g, "\"");
  cleaned = normalizeDocumentText(cleaned).replace(/\n{3,}/g, "\n\n").trim();

  const lines = cleaned.split("\n");
  const firstNonEmptyLine = lines.find((line) => line.trim().length > 0)?.trim() ?? "";
  cleaned = lines
    .filter((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return true;
      }

      const hasUrl =
        /http:\/\//i.test(trimmed)
        || /www\./i.test(trimmed)
        || /\.jimdofree/i.test(trimmed)
        || /\.com\//i.test(trimmed)
        || /\.fr\//i.test(trimmed);
      if (hasUrl) {
        return false;
      }

      const isProfInstruction =
        /\(H[0-9]+\)/i.test(trimmed)
        || /À FAIRE POUR/i.test(trimmed)
        || /LIRE MANUEL/i.test(trimmed)
        || /pages? [0-9]+ à [0-9]+/i.test(trimmed)
        || /sur [0-9]+ pages?/i.test(trimmed)
        || /[0-9]+\/[0-9]+\s*$/i.test(trimmed);
      if (isProfInstruction) {
        return false;
      }

      const isProfConsigne =
        /p\d{2,3}\s*n[°o]?\s*\d/i.test(trimmed)
        || /act(ivitÃ©)?\s*conseillÃ©e/i.test(trimmed)
        || /exercices?\s*conseillÃ©s?/i.test(trimmed)
        || /en\s*devoir/i.test(trimmed)
        || /Ã©dition\s*\d{4}/i.test(trimmed)
        || /odyssÃ©e\s*\d/i.test(trimmed)
        || /hatier|bordas|nathan|hachette|magnard/i.test(trimmed)
        || /youtu\.be|youtube\.com/i.test(trimmed)
        || /TP\s*(tice|algo|conseillÃ©)/i.test(trimmed)
        || /\bact\d\b/i.test(trimmed)
        || (/p\d{3}/.test(trimmed) && trimmed.length < 80);
      if (isProfConsigne) {
        return false;
      }

      const startsWithConjugatedVerb =
        /^(sont|est|ont|a|était|étaient|sera|seront|peut|peuvent|doit|doivent|fait|font|va|vont|permet|permettent)\b/i
          .test(trimmed);
      if (startsWithConjugatedVerb) {
        return false;
      }

      const isOrphanFragment =
        /^(- [a-zàâéèêëîïôùûüç])/.test(trimmed)
        && trimmed.length < 40;
      if (isOrphanFragment) {
        return false;
      }

      if (index > 0 && firstNonEmptyLine && trimmed === firstNonEmptyLine) {
        return false;
      }

      if (trimmed.length < 15) {
        return false;
      }

      return true;
    })
    .join("\n");

  if (process.env.NODE_ENV === "development") {
    console.log(`[CLEAN_OUTPUT_LENGTH] ${cleaned.length}`);
  }

  return cleaned;
}

async function extractFromPdf(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  const rawText = parsed.text;
  const cleanedText = cleanExtractedText(rawText);

  if (process.env.NODE_ENV === "development") {
    console.log("[EXTRACT] longueur texte brut:", rawText.length, "chars");
    console.log("[EXTRACT] longueur apres nettoyage:", cleanedText.length, "chars");
  }

  return cleanedText;
}

async function extractFromPlainText(file: File) {
  const rawText = await file.text();
  const cleanedText = cleanExtractedText(rawText);

  if (process.env.NODE_ENV === "development") {
    console.log("[EXTRACT] longueur texte brut:", rawText.length, "chars");
    console.log("[EXTRACT] longueur apres nettoyage:", cleanedText.length, "chars");
  }

  return cleanedText;
}

async function extractFromImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");
  const mimeType = file.type || "image/png";
  const ocrMessage = await anthropic.messages.create({
    model: MODELS.OCR,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
              data: base64Data,
            },
          },
          {
            type: "text",
            text: "Extrais tout le texte visible dans cette image de cours. Retourne uniquement le texte brut, sans mise en forme.",
          },
        ],
      },
    ],
  });
  const rawText = ocrMessage.content[0]?.type === "text" ? ocrMessage.content[0].text : "";
  const cleanedText = cleanExtractedText(rawText);

  if (process.env.NODE_ENV === "development") {
    console.log("[EXTRACT] longueur texte brut:", rawText.length, "chars");
    console.log("[EXTRACT] longueur apres nettoyage:", cleanedText.length, "chars");
  }

  return cleanedText;
}

export function assessSourceQuality(sourceText: string): SourceQuality {
  const trimmedText = sourceText.trim();
  const words = trimmedText.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;
  const totalChars = sourceText.length;
  const alphanumChars = (sourceText.match(/[a-zA-Z0-9àâäéèêëîïôùûüœæçñÀÂÄÉÈÊËÎÏÔÙÛÜŒÆÇÑ]/g) ?? []).length;
  const alphanumDensity = totalChars > 0 ? alphanumChars / totalChars : 0;
  const noiseChars = (
    sourceText.match(/[^\w\sÀ-ÿ.,;:!?()\-"'\/+=%°€£@&#\n\r\t√∫×÷≤≥π→⇌₂μÅ↔]/g) ?? []
  ).length;
  const noiseRatio = totalChars > 0 ? noiseChars / totalChars : 0;
  const noiseLevel = noiseRatio > 0.15 ? "eleve" as const : noiseRatio > 0.05 ? "moyen" as const : "faible" as const;
  const warnings: string[] = [];
  const failureReasons: string[] = [];

  if (wordCount < 100) {
    const reason = `Texte trop court (${wordCount} mots, minimum 100)`;
    warnings.push(reason);
    failureReasons.push(reason);
  }
  if (alphanumDensity < 0.2) {
    const reason = `Densité alphanumérique insuffisante (${alphanumDensity.toFixed(2)}, minimum 0.20)`;
    warnings.push(reason);
    failureReasons.push(reason);
  }
  if (noiseLevel === "eleve") {
    warnings.push(`Bruit OCR élevé (${(noiseRatio * 100).toFixed(0)}% de caractères parasites). Qualité de l'extraction dégradée.`);
  }
  if (noiseLevel === "moyen") {
    warnings.push(`Bruit OCR modéré détecté. Certains caractères peuvent être mal interprétés.`);
  }

  return {
    wordCount,
    noiseLevel,
    isUsable: failureReasons.length === 0,
    reason: failureReasons[0],
    warnings,
  };
}

export async function extractTextFromFile(file: File): Promise<ExtractedPayload> {
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Fichier trop volumineux (max 10 Mo)");
  }

  let result: ExtractedPayload;

  if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
    result = {
      extractedText: await extractFromPdf(file),
      sourceType: "PDF",
      mimeType: file.type || "application/pdf",
    };
  } else if (file.type.startsWith("text/") || file.name.toLowerCase().endsWith(".txt")) {
    result = {
      extractedText: await extractFromPlainText(file),
      sourceType: "TEXT",
      mimeType: file.type || "text/plain",
    };
  } else if (file.type.startsWith("image/")) {
    result = {
      extractedText: await extractFromImage(file),
      sourceType: "IMAGE",
      mimeType: file.type,
    };
  } else {
    throw new Error("Format de fichier non pris en charge pour l'extraction.");
  }

  const wordCount = result.extractedText.trim().split(/\s+/).length;
  if (wordCount < 20) {
    throw new Error(
      `Le texte extrait est trop court (${wordCount} mots). Verifiez que le fichier contient suffisamment de contenu lisible.`,
    );
  }

  return result;
}
