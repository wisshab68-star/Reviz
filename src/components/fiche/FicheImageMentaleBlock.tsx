import type { FicheImageMentale } from "@/types/fiche-generated";

interface FicheImageMentaleBlockProps {
  imageMentale: FicheImageMentale;
}

export function FicheImageMentaleBlock({ imageMentale }: FicheImageMentaleBlockProps) {
  return (
    <div className="reviz-fiche-mental">
      <p className="reviz-fiche-mental-kicker">{imageMentale.titre}</p>
      <p className="reviz-fiche-mental-text">{imageMentale.texte}</p>
    </div>
  );
}
