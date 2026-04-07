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
    <div className="reviz-fiche-mental">
      <p className="reviz-fiche-mental-kicker">{safeImageMentale.titre}</p>
      <p className="reviz-fiche-mental-text">{safeImageMentale.texte}</p>
    </div>
  );
}
