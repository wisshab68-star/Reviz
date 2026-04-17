import Anthropic from "@anthropic-ai/sdk";

// Lazy singleton — reads the API key at call time, not at module load time.
let _client: Anthropic | null = null;

export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    if (!_client) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set in environment variables.");
      _client = new Anthropic({ apiKey });
    }
    return (_client as unknown as Record<string | symbol, unknown>)[prop];
  },
});
