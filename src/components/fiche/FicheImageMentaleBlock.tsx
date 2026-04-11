import { MathRenderer } from "@/components/math-renderer";
import type { FicheImageMentale } from "@/types/fiche-generated";

interface FicheImageMentaleBlockProps {
  imageMentale?: FicheImageMentale | null;
}

export function FicheImageMentaleBlock({ imageMentale }: FicheImageMentaleBlockProps) {
  const safeImageMentale = imageMentale ?? {
    titre: "Image mentale",
    texte: "Aucune image mentale n'est disponible pour cette fiche.",
  };

  return (
    <div className="reviz-fiche-mental" style={{ background: "#FFFFFF", color: "#000000" }}>
      <p className="reviz-fiche-mental-kicker">{safeImageMentale.titre}</p>
      <MathRenderer text={safeImageMentale.texte} className="reviz-fiche-mental-text" />
    </div>
  );
}
