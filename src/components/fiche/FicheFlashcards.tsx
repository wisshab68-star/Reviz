import type { FicheFlashcard } from "@/types/fiche-generated";

interface FicheFlashcardsProps {
  flashcards: FicheFlashcard[];
}

export function FicheFlashcards({ flashcards }: FicheFlashcardsProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "1rem" }}>
      {flashcards.map((flashcard, index) => (
        <div
          key={`${flashcard.question}-${index}`}
          style={{
            background: "#ffffff",
            border: "0.5px solid var(--line)",
            padding: 12,
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, color: "var(--ink)", marginBottom: 6 }}>
            {flashcard.question}
          </p>
          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              borderTop: "0.5px solid var(--line)",
              paddingTop: 6,
              marginTop: 6,
              lineHeight: 1.6,
            }}
          >
            {flashcard.reponse}
          </p>
        </div>
      ))}
    </div>
  );
}
