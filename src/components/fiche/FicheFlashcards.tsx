import { MathRenderer } from "@/components/math-renderer";
import type { FicheFlashcard } from "@/types/fiche-generated";

interface FicheFlashcardsProps {
  flashcards: FicheFlashcard[];
  blueprintId?: string;
}

function classifyFlashcard(question: string, blueprintId?: string) {
  const lower = question.toLowerCase();

  if (blueprintId === "formulaire") {
    if (/[=()]|derive|formule|calcul|quotient|produit/.test(lower)) return { chip: "Carte formule", tone: "jaune" };
    if (/piege|erreur|confondre/.test(lower)) return { chip: "Carte piege", tone: "rose" };
    return { chip: "Carte methode", tone: "bleu" };
  }

  if (blueprintId === "algorithmique") {
    if (/pseudo|etat|transition|complexit|boucle|condition/.test(lower)) return { chip: "Carte logique", tone: "bleu" };
    if (/cas|limite|erreur|exception/.test(lower)) return { chip: "Carte limite", tone: "rose" };
    return { chip: "Carte systeme", tone: "menthe" };
  }

  if (blueprintId === "chronologie") {
    if (/\d{4}|date|quand|periode|avant|apres/.test(lower)) return { chip: "Carte repere", tone: "jaune" };
    if (/acteur|memoire|debat|enjeu/.test(lower)) return { chip: "Carte contexte", tone: "violet" };
    return { chip: "Carte histoire", tone: "bleu" };
  }

  if (blueprintId === "mecanisme" || blueprintId === "processus") {
    if (/cause|effet|etape|phase|comment/.test(lower)) return { chip: "Carte processus", tone: "menthe" };
    return { chip: "Carte mecanisme", tone: "bleu" };
  }

  if (blueprintId === "comparaison" || blueprintId === "taxonomie") {
    if (/difference|comparer|oppose|categorie|type/.test(lower)) return { chip: "Carte distinction", tone: "violet" };
    return { chip: "Carte notion", tone: "bleu" };
  }

  return { chip: "Carte memoire", tone: "bleu" };
}

export function FicheFlashcards({ flashcards, blueprintId }: FicheFlashcardsProps) {
  return (
    <div className="reviz-fiche-flashcards">
      {flashcards.map((flashcard, index) => (
        <article
          key={`${flashcard.question}-${index}`}
          className={`reviz-fiche-flashcard reviz-fiche-flashcard-${classifyFlashcard(flashcard.question, blueprintId).tone}`}
        >
          <div className="reviz-fiche-flashcard-head">
            <span className="reviz-fiche-flashcard-index">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="reviz-fiche-flashcard-chip">{classifyFlashcard(flashcard.question, blueprintId).chip}</span>
          </div>
          <MathRenderer content={flashcard.question} className="reviz-fiche-flashcard-question" />
          <MathRenderer content={flashcard.reponse} className="reviz-fiche-flashcard-answer" />
        </article>
      ))}
    </div>
  );
}
