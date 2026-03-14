import { z } from "zod";

export const generateSheetRequestSchema = z.object({
  userId: z.string().cuid().optional(),
  documentId: z.string().cuid().optional(),
  sourceType: z.enum(["TEXT", "PDF", "IMAGE", "DOCX", "AUDIO"]).default("TEXT"),
  titleHint: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(80, "Le contenu doit contenir au moins 80 caracteres."),
});

export const generatedSheetSchema = z.object({
  title: z.string().min(3).max(180),
  summary: z.string().min(40).max(3000),
  keyPoints: z.array(z.string().min(3).max(240)).min(3).max(10),
  definitions: z
    .array(
      z.object({
        term: z.string().min(2).max(120),
        definition: z.string().min(5).max(500),
      }),
    )
    .min(1)
    .max(10),
  flashcards: z
    .array(
      z.object({
        question: z.string().min(5).max(240),
        answer: z.string().min(2).max(500),
      }),
    )
    .min(3)
    .max(12),
  quiz: z
    .array(
      z.object({
        question: z.string().min(5).max(240),
        type: z.enum(["mcq", "open"]),
        options: z.array(z.string().min(1).max(140)).max(6).optional(),
        correctAnswer: z.string().min(1).max(240),
        explanation: z.string().min(5).max(500),
      }),
    )
    .min(3)
    .max(8),
});

export type GenerateSheetRequest = z.infer<typeof generateSheetRequestSchema>;
export type GeneratedSheetPayload = z.infer<typeof generatedSheetSchema>;
