import type { Definition, Flashcard, GeneratedSheet, QuizQuestion } from "@/types/sheet";

function stripNoise(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function splitParagraphs(text: string) {
  return stripNoise(text)
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function splitSentences(text: string) {
  return stripNoise(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 20);
}

function extractCandidateTerms(text: string) {
  const matches = text.match(/\b[A-Z][A-Za-zÀ-ÿ\-]{3,}\b/g) ?? [];
  return [...new Set(matches)].slice(0, 6);
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trim()}â€¦`;
}

function buildSummary(sentences: string[]) {
  const summary = sentences.slice(0, 3).join(" ");
  return truncate(summary || "Resume indisponible pour ce document.", 700);
}

function buildKeyPoints(sentences: string[]) {
  return sentences.slice(0, 6).map((sentence) => truncate(sentence, 220));
}

function buildDefinitions(text: string, sentences: string[]): Definition[] {
  const terms = extractCandidateTerms(text);

  if (terms.length > 0) {
    return terms.map((term, index) => ({
      term,
      definition: truncate(
        sentences[index] ?? `Notion importante reperee dans le contenu source autour de ${term}.`,
        280,
      ),
    }));
  }

  return sentences.slice(0, 3).map((sentence, index) => ({
    term: `Notion ${index + 1}`,
    definition: truncate(sentence, 280),
  }));
}

function buildFlashcards(sentences: string[]): Flashcard[] {
  return sentences.slice(0, 5).map((sentence, index) => ({
    question: `Quel est le point essentiel ${index + 1} a retenir ?`,
    answer: truncate(sentence, 240),
  }));
}

function buildQuiz(sentences: string[]): QuizQuestion[] {
  return sentences.slice(0, 4).map((sentence, index) => ({
    question: `Que faut-il retenir du point ${index + 1} ?`,
    type: "open",
    options: [],
    correctAnswer: truncate(sentence, 220),
    explanation: truncate(sentence, 260),
  }));
}

function inferTitle(titleHint: string | undefined, text: string, paragraphs: string[]) {
  if (titleHint?.trim()) {
    return truncate(titleHint.trim(), 140);
  }

  const firstParagraph = paragraphs[0] ?? "";
  const firstLine = firstParagraph.split("\n")[0]?.trim();

  if (firstLine && firstLine.length >= 4) {
    return truncate(firstLine, 140);
  }

  return truncate(text.slice(0, 80), 140) || "Fiche de revision";
}

export function generateFallbackStudySheet(input: { content: string; titleHint?: string }): GeneratedSheet {
  const cleaned = stripNoise(input.content);
  const paragraphs = splitParagraphs(cleaned);
  const sentences = splitSentences(cleaned);

  const usableSentences =
    sentences.length > 0
      ? sentences
      : paragraphs.flatMap((paragraph) =>
          paragraph
            .split(/\n+/)
            .map((line) => line.trim())
            .filter((line) => line.length > 15),
        );

  return {
    title: inferTitle(input.titleHint, cleaned, paragraphs),
    summary: buildSummary(usableSentences),
    keyPoints: buildKeyPoints(usableSentences),
    definitions: buildDefinitions(cleaned, usableSentences),
    flashcards: buildFlashcards(usableSentences),
    quiz: buildQuiz(usableSentences),
  };
}
