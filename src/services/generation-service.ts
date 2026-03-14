import { openai } from "@/lib/openai";
import { CLASSIC_SYSTEM_PROMPT, buildClassicUserPrompt } from "@/lib/prompts/fiche-generator";
import { generatedSheetSchema, type GenerateSheetRequest } from "@/lib/validations";
import type { GeneratedSheet } from "@/types/sheet";
import { generateDemoStudySheet } from "@/services/demo-sheet-service";

export async function generateStudySheet(input: GenerateSheetRequest): Promise<GeneratedSheet> {
  if (!process.env.OPENAI_API_KEY) {
    return generateDemoStudySheet(input);
  }

  const prompt = buildClassicUserPrompt(input.content, input.titleHint);

  try {
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: CLASSIC_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "study_sheet",
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              keyPoints: {
                type: "array",
                items: { type: "string" },
              },
              definitions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    term: { type: "string" },
                    definition: { type: "string" },
                  },
                  required: ["term", "definition"],
                },
              },
              flashcards: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    question: { type: "string" },
                    answer: { type: "string" },
                  },
                  required: ["question", "answer"],
                },
              },
              quiz: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    question: { type: "string" },
                    type: { type: "string", enum: ["mcq", "open"] },
                    options: {
                      type: "array",
                      items: { type: "string" },
                    },
                    correctAnswer: { type: "string" },
                    explanation: { type: "string" },
                  },
                  required: ["question", "type", "options", "correctAnswer", "explanation"],
                },
              },
            },
            required: ["title", "summary", "keyPoints", "definitions", "flashcards", "quiz"],
          },
        },
      },
    });

    const payload = JSON.parse(response.output_text);
    return generatedSheetSchema.parse(payload);
  } catch (error) {
    console.warn("OpenAI generation failed, using demo fallback.", error);
    return generateDemoStudySheet(input);
  }
}
