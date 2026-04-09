import { MathRenderer } from "@/components/math-renderer";

interface FicheFeynmanProps {
  texte: string;
}

export function FicheFeynman({ texte }: FicheFeynmanProps) {
  return (
    <div className="reviz-fiche-feynman" data-print="feynman">
      <p className="reviz-fiche-feynman-kicker">Comme si tu l'expliquais a un ami</p>
      <div className="reviz-fiche-feynman-text">
        &ldquo;<MathRenderer text={texte} />&rdquo;
      </div>
    </div>
  );
}
