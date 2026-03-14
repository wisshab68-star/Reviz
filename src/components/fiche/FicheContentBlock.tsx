type BlockType = "definition" | "exemple" | "piege";

const LABELS: Record<BlockType, string> = {
  definition: "Definition",
  exemple: "Exemple concret",
  piege: "Piege classique",
};

interface FicheContentBlockProps {
  type: BlockType;
  content: string;
}

export function FicheContentBlock({ type, content }: FicheContentBlockProps) {
  return (
    <div
      style={{
        background: "#ffffff",
        borderLeft: "2px solid var(--ink)",
        padding: "10px 14px",
        color: "var(--ink)",
        fontSize: 14,
        lineHeight: 1.65,
        marginBottom: 10,
      }}
    >
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {LABELS[type]}
      </p>
      {content}
    </div>
  );
}
