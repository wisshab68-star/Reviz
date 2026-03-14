"use client";

import Link from "next/link";
import { useState } from "react";

import type { Flashcard, QuizQuestion } from "@/types/sheet";

type ReviewViewProps = {
  sheetId: string;
  title: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

export function ReviewView({ sheetId, title, flashcards, quiz }: ReviewViewProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const currentCard = flashcards[cardIndex];
  const progress = flashcards.length > 0 ? ((cardIndex + 1) / flashcards.length) * 100 : 0;

  return (
    <section>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
        <div>
          <p className="eyebrow">Mode revision</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 3vw, 2.4rem)", lineHeight: 1.1 }}>{title}</h1>
          <p style={{ marginTop: "0.5rem", color: "var(--muted)", fontSize: "0.95rem" }}>
            {flashcards.length} flashcards · {quiz.length} questions
          </p>
        </div>
        <Link href={`/sheet/${sheetId}`} className="btn btn-soft">
          Retour a la fiche
        </Link>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: "var(--line)", marginBottom: "2rem" }}>
        <div style={{ height: "100%", background: "var(--ink)", width: `${progress}%`, transition: "width 200ms ease" }} />
      </div>

      {/* Flashcard */}
      <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "2rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
          <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", margin: 0 }}>Flashcards</p>
          <span style={{ color: "var(--muted)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {flashcards.length > 0 ? `${cardIndex + 1}/${flashcards.length}` : "0/0"}
          </span>
        </div>
        {currentCard ? (
          <>
            <div style={{ minHeight: 200, display: "flex", flexDirection: "column", justifyContent: "center", padding: "2rem 0" }}>
              <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600, lineHeight: 1.3 }}>{currentCard.question}</h2>
              <p style={{ marginTop: "1rem", color: showAnswer ? "var(--ink)" : "var(--muted)", lineHeight: 1.7, fontSize: "1.02rem", fontStyle: showAnswer ? "normal" : "italic" }}>
                {showAnswer
                  ? currentCard.answer
                  : "Clique sur afficher la reponse pour verifier."}
              </p>
            </div>
            <div className="cta-row">
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => setCardIndex((value) => Math.max(0, value - 1))}
                disabled={cardIndex === 0}
              >
                Precedente
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowAnswer((value) => !value)}
              >
                {showAnswer ? "Masquer" : "Afficher la reponse"}
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => {
                  setCardIndex((value) => Math.min(flashcards.length - 1, value + 1));
                  setShowAnswer(false);
                }}
                disabled={cardIndex === flashcards.length - 1}
              >
                Suivante
              </button>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--muted)" }}>Aucune flashcard disponible.</p>
        )}
      </div>

      {/* Quiz */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 8 }}>Quiz</p>
        <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.25rem" }}>Questions</h2>
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {quiz.map((item, quizIndex) => (
            <div key={item.question} style={{ borderLeft: "2px solid var(--ink)", padding: "10px 14px" }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 600 }}>{item.question}</h3>
              {item.options?.length ? (
                <ul style={{ listStyle: "none", paddingLeft: 0, marginTop: "0.75rem", display: "grid", gap: "0.45rem" }}>
                  {item.options.map((option) => {
                    const isSelected = selectedAnswers[quizIndex] === option;
                    const isCorrect = isSelected && option === item.correctAnswer;
                    const isIncorrect = isSelected && option !== item.correctAnswer;

                    return (
                      <li key={option}>
                        <button
                          type="button"
                          style={{
                            width: "100%",
                            textAlign: "left",
                            border: `1px solid ${isCorrect ? "#5dba8f" : isIncorrect ? "#d88" : "var(--line)"}`,
                            padding: "10px 12px",
                            background: "#ffffff",
                            color: "var(--ink)",
                            borderRadius: 0,
                            cursor: "pointer",
                            fontSize: "0.92rem",
                          }}
                          onClick={() =>
                            setSelectedAnswers((current) => ({
                              ...current,
                              [quizIndex]: option,
                            }))
                          }
                        >
                          {isCorrect ? "\u2713 " : isIncorrect ? "\u2717 " : ""}{option}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
              {!item.options?.length ? (
                <div style={{ marginTop: "0.75rem", borderLeft: "2px solid var(--line)", padding: "8px 12px" }}>
                  <p style={{ margin: 0, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--muted)", marginBottom: 4 }}>Reponse attendue</p>
                  <p style={{ margin: 0, lineHeight: 1.65 }}>{item.correctAnswer}</p>
                </div>
              ) : null}
              <p style={{ margin: "0.5rem 0 0", color: "var(--ink)", lineHeight: 1.65 }}>
                <strong>Bonne reponse :</strong> {item.correctAnswer}
              </p>
              <p style={{ margin: "0.25rem 0 0", color: "var(--muted)", lineHeight: 1.65 }}>{item.explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
