import katex from "katex";
import { normalizeFormulaText, sanitizeAiText } from "@/lib/text";

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

type RenderSegment =
  | { type: "text"; content: string }
  | { type: "formula"; content: string; displayMode: boolean };

function stripLatexDelimiters(value: string) {
  return value
    .replace(/^\$\$([\s\S]+)\$\$$/, "$1")
    .replace(/^\\\(([\s\S]+)\\\)$/, "$1")
    .replace(/^\$([\s\S]+)\$$/, "$1")
    .trim();
}

function toLatex(formula: string) {
  return normalizeFormulaText(stripLatexDelimiters(formula))
    .replace(/\[H3O\+\]/g, "[H_{3}O^{+}]")
    .replace(/\[HO-\]/g, "[HO^{-}]")
    .replace(/\[OH-\]/g, "[OH^{-}]")
    .replace(/\b([A-Z][a-z]?)(\d+)([A-Z][a-z]?)(?![a-zA-Z0-9])/g, "$1_{$2}$3")
    .replace(/\bHO-\b/g, "HO^{-}")
    .replace(/\bOH-\b/g, "OH^{-}")
    .replace(/\bH3O\+\b/g, "H_{3}O^{+}")
    .replace(/\bA-\b/g, "A^{-}")
    .replace(/\b10\^\((-?[^)]+)\)/g, "10^{$1}")
    .replace(/\b10\^(-?[A-Za-z0-9]+)/g, "10^{$1}")
    .replace(/sqrt\(([^()]+)\)/g, "\\sqrt{$1}")
    .replace(/\bexp\(([^()]+)\)/g, "e^{$1}")
    .replace(/<=/g, "\\le ")
    .replace(/>=/g, "\\ge ")
    .replace(/!=/g, "\\ne ")
    .replace(/~=/g, "\\approx ")
    .replace(/->/g, "\\to ")
    .replace(/\binf\b/g, "\\infty ")
    .replace(/\*/g, "\\cdot ");
}

function renderFormulaMarkup(formula: string, displayMode: boolean) {
  try {
    return katex.renderToString(toLatex(formula), {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
    });
  } catch {
    return null;
  }
}

function parseDelimitedSegments(content: string): RenderSegment[] {
  const segments: RenderSegment[] = [];
  const pattern = /\$\$([\s\S]+?)\$\$|\\\(([\s\S]+?)\\\)|\$([^$\n]+?)\$/g;
  let lastIndex = 0;

  for (const match of content.matchAll(pattern)) {
    const [fullMatch, blockFormula, inlineParenFormula, inlineDollarFormula] = match;
    const start = match.index ?? 0;

    if (start > lastIndex) {
      const textChunk = content.slice(lastIndex, start);
      if (textChunk.trim().length > 0) {
        segments.push({ type: "text", content: textChunk });
      }
    }

    const formula = blockFormula ?? inlineParenFormula ?? inlineDollarFormula ?? "";
    segments.push({
      type: "formula",
      content: formula,
      displayMode: Boolean(blockFormula),
    });

    lastIndex = start + fullMatch.length;
  }

  if (lastIndex < content.length) {
    const trailingText = content.slice(lastIndex);
    if (trailingText.trim().length > 0) {
      segments.push({ type: "text", content: trailingText });
    }
  }

  return segments;
}

function isWholeFormula(content: string) {
  const trimmed = content.trim();
  return /^\$\$[\s\S]+\$\$$/.test(trimmed)
    || /^\\\([\s\S]+\\\)$/.test(trimmed)
    || /^\$[\s\S]+\$$/.test(trimmed)
    || /^[A-Za-z0-9[\](){}+\-*/=^.,;: ]+$/.test(trimmed) && /[=^]/.test(normalizeFormulaText(trimmed));
}

export function MathRenderer({ content, className, inline = false }: MathRendererProps) {
  const normalizedText = sanitizeAiText(content).trim();
  if (!normalizedText) {
    return null;
  }

  const segments = parseDelimitedSegments(normalizedText);

  if (segments.length === 0 && !isWholeFormula(normalizedText)) {
    return inline ? <span className={className}>{normalizedText}</span> : <div className={className}>{normalizedText}</div>;
  }

  if (segments.length === 0) {
    const rendered = renderFormulaMarkup(normalizedText, !inline);
    if (!rendered) {
      return inline ? <span className={className}>{normalizedText}</span> : <div className={className}>{normalizedText}</div>;
    }

    const Component = inline ? "span" : "div";
    return <Component className={className} dangerouslySetInnerHTML={{ __html: rendered }} />;
  }

  const Wrapper = inline ? "span" : "div";

  return (
    <Wrapper className={className}>
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={`text-${index}`}>{segment.content}</span>;
        }

        const rendered = renderFormulaMarkup(segment.content, segment.displayMode && !inline);
        if (!rendered) {
          return <span key={`formula-fallback-${index}`}>{segment.content}</span>;
        }

        return (
          <span
            key={`formula-${index}`}
            dangerouslySetInnerHTML={{ __html: rendered }}
          />
        );
      })}
    </Wrapper>
  );
}
