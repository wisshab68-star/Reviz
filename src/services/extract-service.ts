import pdfParse from "pdf-parse";

import { openai } from "@/lib/openai";
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

function normalizeExtractedText(text: string) {
  let cleaned = normalizeDocumentText(text);
  cleaned = removePageNumbers(cleaned);
  cleaned = removeRepetitiveHeaders(cleaned);
  cleaned = removeOcrArtifacts(cleaned);
  cleaned = normalizeDocumentText(cleaned).replace(/\n{3,}/g, "\n\n").trim();
  return cleaned;
}

async function extractFromPdf(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const parsed = await pdfParse(buffer);
  return normalizeExtractedText(parsed.text);
}

async function extractFromPlainText(file: File) {
  const text = await file.text();
  return normalizeExtractedText(text);
}

async function extractFromImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const mimeType = file.type || "image/png";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content:
          "Tu fais de l'OCR. Extrais uniquement le texte lisible de l'image. Retourne le texte brut, sans commentaire ni markdown.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: "Extrais le texte pedagogique de cette image de cours. Garde l'ordre de lecture.",
          },
          {
            type: "input_image",
            image_url: dataUrl,
            detail: "auto",
          },
        ],
      },
    ],
  });

  return normalizeExtractedText(response.output_text);
}

export function assessSourceQuality(sourceText: string): SourceQuality {
  const wordCount = sourceText.trim().split(/\s+/).length;
  const totalChars = sourceText.length;
  const noiseChars = (sourceText.match(/[^\w\sÀ-ÿ.,;:!?()\-"'/+=%°€$£@&#\n\r\t]/g) ?? []).length;
  const noiseRatio = totalChars > 0 ? noiseChars / totalChars : 0;
  const noiseLevel = noiseRatio > 0.15 ? "eleve" as const : noiseRatio > 0.05 ? "moyen" as const : "faible" as const;
  const warnings: string[] = [];

  if (wordCount < 100) {
    warnings.push(`Texte tres court (${wordCount} mots). La fiche generee risque d'etre incomplete.`);
  }
  if (noiseLevel === "eleve") {
    warnings.push(`Bruit OCR eleve (${(noiseRatio * 100).toFixed(1)}% de caracteres parasites). Qualite de l'extraction degradee.`);
  }
  if (noiseLevel === "moyen") {
    warnings.push(`Bruit OCR modere detecte. Certains caracteres peuvent etre mal interpretes.`);
  }

  return {
    wordCount,
    noiseLevel,
    isUsable: wordCount >= 100 && noiseLevel !== "eleve",
    warnings,
  };
}

export async function extractTextFromFile(file: File): Promise<ExtractedPayload> {
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
