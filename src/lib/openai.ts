import Anthropic from "@anthropic-ai/sdk";

// TODO: add ANTHROPIC_API_KEY to .env.local for local AI generation.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
