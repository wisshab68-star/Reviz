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
          border: "3px solid #050505",
          borderRadius: 28,
          padding: "14px 18px",
          fontSize: 14,
          color: "#050505",
          lineHeight: 1.7,
          fontStyle: "italic",
          background: "var(--accent-soft)",
          boxShadow: "8px 8px 0 #050505",
        }}
      >
        &ldquo;{explanation}&rdquo;
      </div>
    </div>
  );
}
