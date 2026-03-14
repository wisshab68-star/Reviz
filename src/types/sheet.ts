export type Definition = {
  term: string;
  definition: string;
};

export type ContentBlockType = "definition" | "exemple" | "piege";

export interface ContentBlock {
  type: ContentBlockType;
  label: string;
  content: string;
}

export interface KeyMetric {
  value: string;
  label: string;
}

export type Flashcard = {
  question: string;
  answer: string;
};

export type QuizQuestion = {
  question: string;
  type: "mcq" | "open";
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

export type GeneratedSheet = {
  title: string;
  summary: string;
  keyPoints: string[];
  definitions: Definition[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  feynmanExplanation?: string;
  keyMetrics?: KeyMetric[];
  contentBlocks?: ContentBlock[];
  masteryScore?: number;
};
