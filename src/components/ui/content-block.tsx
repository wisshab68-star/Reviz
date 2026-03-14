interface ContentBlockProps {
  type: "definition" | "exemple" | "piege";
  label?: string;
  content: string;
  className?: string;
}

const LABELS = {
  definition: "Definition",
  exemple: "Exemple concret",
  piege: "Piege classique",
} as const;

export function ContentBlock({ type, label, content, className }: ContentBlockProps) {
  return (
    <div className={className} style={{ marginBottom: "0.85rem" }}>
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 6,
          fontWeight: 600,
        }}
      >
        {label ?? LABELS[type]}
      </p>
      <div
        style={{
          background: "#ffffff",
          borderLeft: "2px solid var(--ink)",
          padding: "10px 14px",
          color: "var(--ink)",
          fontSize: 14,
          lineHeight: 1.65,
        }}
      >
        {content}
      </div>
    </div>
  );
}
