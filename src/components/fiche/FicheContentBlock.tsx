import { MathRenderer } from "@/components/math-renderer";

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
    <div className={`reviz-fiche-block reviz-fiche-block-${type}`}>
      <p className="reviz-fiche-block-label">{LABELS[type]}</p>
      <MathRenderer content={content} className="reviz-fiche-block-content" />
    </div>
  );
}
