const MAX_TOKENS_APPROX = 80000; // ~300KB of text
const CHARS_PER_TOKEN = 4;
const MAX_CHARS = MAX_TOKENS_APPROX * CHARS_PER_TOKEN;

/**
 * Trims document text to fit within model context limits,
 * preserving the beginning (most important content first).
 */
export function prepareTextForModel(text: string): string {
  if (text.length <= MAX_CHARS) {
    return text;
  }
  return text.slice(0, MAX_CHARS);
}
