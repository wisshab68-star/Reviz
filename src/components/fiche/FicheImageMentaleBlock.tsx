import type { FicheImageMentale } from "@/types/fiche-generated";

interface FicheImageMentaleBlockProps {
  imageMentale: FicheImageMentale;
}

export function FicheImageMentaleBlock({ imageMentale }: FicheImageMentaleBlockProps) {
  return (
    <div style={{ borderLeft: "2px solid var(--ink)", padding: "12px 14px", marginBottom: 10 }}>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 5,
        }}
      >
        {imageMentale.titre}
      </p>
      <p style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.65 }}>{imageMentale.texte}</p>
    </div>
  );
}
