import { FicheRenderer } from "@/components/fiche/FicheRenderer";
import { ContentBlock } from "@/components/ui/content-block";
import { FeynmanBlock } from "@/components/ui/feynman-block";
import { KeyMetrics } from "@/components/ui/key-metrics";
import type { FicheGeneree } from "@/types/fiche-generated";
import type {
  ContentBlock as SheetContentBlock,
  Definition,
  Flashcard,
  KeyMetric,
  QuizQuestion,
} from "@/types/sheet";

type SheetViewProps = {
  summary: string;
  keyPoints: string[];
  definitions: Definition[];
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  feynmanExplanation?: string;
  keyMetrics?: KeyMetric[];
  contentBlocks?: SheetContentBlock[];
  ficheGeneree?: FicheGeneree | null;
};

function deriveMemoryImage(summary: string, keyPoints: string[], definitions: Definition[]) {
  const anchor = definitions[0]?.term ?? "notion";
  const support = keyPoints[0] ?? summary;

  return `Imagine une scene simple ou ${anchor.toLowerCase()} devient l'element central. Associe-le visuellement a cette idee : ${support}`;
}

function deriveSchemaSteps(keyPoints: string[], definitions: Definition[]) {
  const first = keyPoints[0] ?? definitions[0]?.term ?? "Notion de depart";
  const second = keyPoints[1] ?? definitions[0]?.definition ?? "Transformation importante";
  const third = keyPoints[2] ?? definitions[1]?.term ?? "Resultat a retenir";

  return [first, second, third].filter((item) => item && item.trim().length > 0).slice(0, 3);
}

function deriveContentBlocks(
  summary: string,
  definitions: Definition[],
  keyPoints: string[],
): SheetContentBlock[] {
  const blocks: SheetContentBlock[] = [];

  if (definitions[0]) {
    blocks.push({
      type: "definition",
      label: definitions[0].term,
      content: definitions[0].definition,
    });
  }

  if (keyPoints[0]) {
    blocks.push({
      type: "exemple",
      label: "Point concret",
      content: keyPoints[0],
    });
  }

  if (keyPoints[1] || summary) {
    blocks.push({
      type: "piege",
      label: "Attention",
      content: keyPoints[1] ?? summary,
    });
  }

  return blocks.slice(0, 3);
}

function deriveFeynmanExplanation(summary: string) {
  if (!summary.trim()) {
    return undefined;
  }

  return `En tres simple, il faut retenir que ${summary.charAt(0).toLowerCase()}${summary.slice(1)}`;
}

function deriveKeyMetrics(
  keyPoints: string[],
  definitions: Definition[],
  flashcards: Flashcard[],
): KeyMetric[] {
  return [
    { value: String(keyPoints.length), label: "points cles" },
    { value: String(definitions.length), label: "definitions" },
    { value: String(flashcards.length), label: "flashcards" },
  ];
}

export function SheetView({
  summary,
  keyPoints,
  definitions,
  flashcards,
  quiz,
  feynmanExplanation,
  keyMetrics,
  contentBlocks,
  ficheGeneree,
}: SheetViewProps) {
  if (ficheGeneree?.titre && ficheGeneree.flashcards?.length) {
    return <FicheRenderer fiche={ficheGeneree} />;
  }

  const visibleBlocks =
    contentBlocks && contentBlocks.length > 0
      ? contentBlocks
      : deriveContentBlocks(summary, definitions, keyPoints);
  const visibleFeynman = feynmanExplanation ?? deriveFeynmanExplanation(summary);
  const visibleMetrics =
    keyMetrics && keyMetrics.length > 0
      ? keyMetrics
      : deriveKeyMetrics(keyPoints, definitions, flashcards);
  const schemaSteps = deriveSchemaSteps(keyPoints, definitions);
  const memoryImage = deriveMemoryImage(summary, keyPoints, definitions);

  return (
    <section style={{ display: "grid", gap: 0 }}>
      {/* Resume */}
      <div style={{ paddingBottom: "2rem", borderBottom: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>Synthese</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>Resume</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          <div style={{ borderLeft: "2px solid var(--ink)", padding: "10px 14px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>Vue d&apos;ensemble</p>
            <p style={{ margin: 0, lineHeight: 1.75, color: "var(--ink)" }}>{summary}</p>
          </div>
          <div style={{ borderLeft: "2px solid var(--ink)", padding: "10px 14px" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 4 }}>Image mentale</p>
            <p style={{ margin: 0, lineHeight: 1.75, color: "var(--ink)" }}>{memoryImage}</p>
          </div>
        </div>
        {visibleBlocks.length > 0 ? (
          <div style={{ marginTop: "1.5rem" }}>
            {visibleBlocks.map((block, index) => (
              <ContentBlock
                key={`${block.type}-${index}`}
                type={block.type}
                label={block.label}
                content={block.content}
              />
            ))}
          </div>
        ) : (
          <p>{summary}</p>
        )}
        {visibleFeynman ? <FeynmanBlock explanation={visibleFeynman} /> : null}
        {visibleMetrics.length > 0 ? <KeyMetrics metrics={visibleMetrics} /> : null}
        {schemaSteps.length > 0 ? (
          <div style={{ marginTop: "1.5rem", paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 10 }}>Schema express</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "0.9rem" }}>
              {schemaSteps.map((step, index) => (
                <div key={`${step}-${index}`} style={{ borderLeft: "2px solid var(--ink)", padding: "0.75rem 1rem" }}>
                  <span style={{ display: "inline-block", marginBottom: "0.4rem", fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>0{index + 1}</span>
                  <p style={{ margin: 0, lineHeight: 1.65 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Points cles */}
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>A retenir</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>Points cles</h2>
        <div style={{ display: "grid", gap: "0.6rem", marginTop: "1rem" }}>
          {keyPoints.map((point, index) => (
            <div key={point} style={{ display: "grid", gridTemplateColumns: "40px minmax(0, 1fr)", gap: "0.75rem", alignItems: "start" }}>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: "var(--ink)", color: "#ffffff", fontSize: "0.78rem", letterSpacing: "0.08em" }}>0{index + 1}</span>
              <p style={{ margin: 0, lineHeight: 1.7, paddingTop: 8 }}>{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Definitions */}
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>Definitions</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>Notions importantes</h2>
        <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
          {definitions.map((item) => (
            <div key={item.term} style={{ borderLeft: "2px solid var(--ink)", padding: "10px 14px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{item.term}</h3>
              <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", lineHeight: 1.65 }}>{item.definition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Flashcards */}
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem", borderBottom: "1px solid var(--line)" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>Revision active</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>Flashcards</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {flashcards.map((card) => (
            <div key={card.question} style={{ border: "0.5px solid var(--line)", padding: "1rem" }}>
              <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 600 }}>{card.question}</h3>
              <p style={{ margin: "0.5rem 0 0", color: "var(--muted)", lineHeight: 1.65, fontSize: "0.92rem" }}>{card.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Quiz */}
      <div style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>Auto-evaluation</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600 }}>Quiz</h2>
        <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
          {quiz.map((item) => (
            <div key={item.question} style={{ borderLeft: "2px solid var(--ink)", padding: "10px 14px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{item.question}</h3>
              {"options" in item && item.options?.length ? (
                <ul style={{ margin: "0.7rem 0 0", paddingLeft: "1.1rem", color: "var(--muted)", lineHeight: 1.65 }}>
                  {item.options.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              ) : null}
              <p style={{ margin: "0.5rem 0 0", color: "var(--ink)", lineHeight: 1.65 }}>
                <strong>Bonne reponse :</strong> {item.correctAnswer}
              </p>
              <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", lineHeight: 1.65 }}>{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
