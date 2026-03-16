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
          background: type === "piege" ? "#050505" : type === "exemple" ? "var(--accent-soft)" : "#ffffff",
          border: "3px solid #050505",
          borderRadius: 28,
          padding: "12px 16px",
          color: type === "piege" ? "#ffffff" : "#050505",
          fontSize: 14,
          lineHeight: 1.65,
          boxShadow: "8px 8px 0 #050505",
        }}
      >
        {content}
      </div>
    </div>
  );
}
