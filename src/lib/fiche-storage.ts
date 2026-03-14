import type { FicheGeneree } from "@/types/fiche-generated";
import type { Definition, QuizQuestion } from "@/types/sheet";

export type StoredKeyPointsPayload =
  | string[]
  | {
      items: string[];
      fiche?: FicheGeneree;
    };

export function wrapKeyPointsPayload(items: string[], fiche: FicheGeneree): StoredKeyPointsPayload {
  return {
    items,
    fiche,
  };
}

export function readKeyPointsPayload(payload: unknown): { items: string[]; fiche: FicheGeneree | null } {
  if (Array.isArray(payload)) {
    return {
      items: payload.filter((item): item is string => typeof item === "string"),
      fiche: null,
    };
  }

  if (payload && typeof payload === "object") {
    const candidate = payload as { items?: unknown; fiche?: unknown };
    const items = Array.isArray(candidate.items)
      ? candidate.items.filter((item): item is string => typeof item === "string")
      : [];

    if (candidate.fiche && typeof candidate.fiche === "object") {
      return {
        items,
        fiche: candidate.fiche as FicheGeneree,
      };
    }

    return {
      items,
      fiche: null,
    };
  }

  return {
    items: [],
    fiche: null,
  };
}

export function deriveClassicSheetFromFiche(fiche: FicheGeneree) {
  const keyPoints = [
    fiche.definition,
    fiche.exemple,
    fiche.piege,
    fiche.feynman,
  ].filter((item) => item.trim().length > 0).slice(0, 6);

  const definitions: Definition[] = [
    {
      term: fiche.imageMentale.titre,
      definition: fiche.definition,
    },
  ];

  const quiz: QuizQuestion[] = fiche.flashcards.map((flashcard) => ({
    question: flashcard.question,
    type: "open",
    options: [],
    correctAnswer: flashcard.reponse,
    explanation: flashcard.reponse,
  }));

  return {
    title: fiche.titre,
    summary: fiche.imageMentale.texte,
    keyPoints,
    definitions,
    flashcards: fiche.flashcards.map((flashcard) => ({
      question: flashcard.question,
      answer: flashcard.reponse,
    })),
    quiz,
  };
}
