import { MODELS } from "@/lib/models";
import { anthropic } from "@/lib/openai";
import { CLASSIC_SYSTEM_PROMPT, buildClassicUserPrompt } from "@/lib/prompts/fiche-generator";
import { generatedSheetSchema, type GenerateSheetRequest } from "@/lib/validations";
import type { GeneratedSheet } from "@/types/sheet";
import { generateDemoStudySheet } from "@/services/demo-sheet-service";

export async function generateStudySheet(input: GenerateSheetRequest): Promise<GeneratedSheet> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return generateDemoStudySheet(input);
  }

  const prompt = buildClassicUserPrompt(input.content, input.titleHint);

  try {
    const response = await anthropic.messages.create({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: [
        {
          type: "text" as const,
          text: CLASSIC_SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "";
    const payload = JSON.parse(raw.replace(/```json|```/g, "").trim());
    return generatedSheetSchema.parse(payload);
  } catch (error) {
    console.warn("OpenAI generation failed, using demo fallback.", error);
    return generateDemoStudySheet(input);
  }
}
