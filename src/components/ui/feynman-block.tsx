interface FeynmanBlockProps {
  explanation: string;
}

export function FeynmanBlock({ explanation }: FeynmanBlockProps) {
  return (
    <div style={{ marginTop: 16 }}>
      <p
        style={{
          fontSize: 11,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 8,
          fontWeight: 600,
        }}
      >
        Methode Feynman
      </p>
      <div
        style={{
          borderLeft: "2px solid var(--ink)",
          padding: "12px 16px",
          fontSize: 13,
          color: "var(--ink)",
          lineHeight: 1.7,
          fontStyle: "italic",
        }}
      >
        &ldquo;{explanation}&rdquo;
      </div>
    </div>
  );
}
