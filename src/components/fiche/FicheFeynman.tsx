interface FicheFeynmanProps {
  texte: string;
}

export function FicheFeynman({ texte }: FicheFeynmanProps) {
  return (
    <div
      style={{
        borderLeft: "2px solid var(--ink)",
        padding: "14px",
        fontSize: 13,
        color: "var(--ink)",
        lineHeight: 1.7,
        fontStyle: "italic",
        marginBottom: 10,
      }}
    >
      &ldquo;{texte}&rdquo;
    </div>
  );
}
