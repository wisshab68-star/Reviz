interface FicheFeynmanProps {
  texte: string;
}

export function FicheFeynman({ texte }: FicheFeynmanProps) {
  return (
    <div className="reviz-fiche-feynman">
      <p className="reviz-fiche-feynman-kicker">Comme si tu l'expliquais a un ami</p>
      <p className="reviz-fiche-feynman-text">&ldquo;{texte}&rdquo;</p>
    </div>
  );
}
