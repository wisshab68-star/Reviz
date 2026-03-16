"use client";

import Link from "next/link";
import { useState } from "react";

import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
import { normalizeAcademicText } from "@/lib/text";
import type { Flashcard, QuizQuestion } from "@/types/sheet";

type ReviewViewProps = {
  sheetId: string;
  title: string;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
};

function normalizeReviewText(value: string) {
  return normalizeAcademicText(value).replace(/\s+/g, " ").trim();
}

export function ReviewView({ sheetId, title, flashcards, quiz }: ReviewViewProps) {
  const [cardIndex, setCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  const normalizedFlashcards = flashcards.map((card) => ({
    ...card,
    question: normalizeReviewText(card.question),
    answer: normalizeReviewText(card.answer),
  }));
  const normalizedQuiz = quiz.map((item) => ({
    ...item,
    question: normalizeReviewText(item.question),
    correctAnswer: normalizeReviewText(item.correctAnswer),
    explanation: normalizeReviewText(item.explanation),
    options: item.options?.map((option) => normalizeReviewText(option)),
  }));

  const currentCard = normalizedFlashcards[cardIndex];
  const progress =
    normalizedFlashcards.length > 0 ? ((cardIndex + 1) / normalizedFlashcards.length) * 100 : 0;

  return (
    <section className="reviz-review-shell">
      <header className="reviz-review-header">
        <div className="reviz-review-header-copy">
          <p className="eyebrow">Revision Reviz</p>
          <h1 className="reviz-review-title">{normalizeReviewText(title)}</h1>
          <div className="reviz-review-stats">
            <span>{normalizedFlashcards.length} flashcards</span>
            <span>{normalizedQuiz.length} questions</span>
          </div>
        </div>

        <div className="reviz-review-header-art" aria-hidden="true">
          <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
          <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
          <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
        </div>

        <Link href={`/sheet/${sheetId}`} className="btn btn-soft">
          Retour fiche
        </Link>
      </header>

      <div className="reviz-review-progress">
        <div className="reviz-review-progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <section className="reviz-review-block">
        <div className="reviz-review-block-head">
          <p className="eyebrow">Flashcards</p>
          <span className="reviz-review-counter">
            {normalizedFlashcards.length > 0 ? `${cardIndex + 1}/${normalizedFlashcards.length}` : "0/0"}
          </span>
        </div>

        {currentCard ? (
          <>
            <article className="reviz-review-card">
              <div className="reviz-review-card-art" aria-hidden="true">
                <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
              </div>
              <p className="reviz-review-card-tag">Question</p>
              <h2 className="reviz-review-card-question">{currentCard.question}</h2>
              <div className={`reviz-review-answer${showAnswer ? " visible" : ""}`}>
                <p className="reviz-review-card-tag">Reponse</p>
                <p className="reviz-review-card-answer">
                  {showAnswer ? currentCard.answer : "Clique pour afficher la reponse."}
                </p>
              </div>
            </article>

            <div className="cta-row reviz-review-actions">
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
                {showAnswer ? "Masquer" : "Afficher"}
              </button>
              <button
                type="button"
                className="btn btn-soft"
                onClick={() => {
                  setCardIndex((value) => Math.min(normalizedFlashcards.length - 1, value + 1));
                  setShowAnswer(false);
                }}
                disabled={cardIndex === normalizedFlashcards.length - 1}
              >
                Suivante
              </button>
            </div>
          </>
        ) : (
          <div className="status-box">Aucune flashcard disponible.</div>
        )}
      </section>

      <section className="reviz-review-block">
        <div className="reviz-review-block-head">
          <p className="eyebrow">Quiz</p>
          <span className="reviz-review-counter">Comprendre et verifier</span>
        </div>

        <div className="reviz-review-quiz-grid">
          {normalizedQuiz.map((item, quizIndex) => (
            <article key={item.question} className="reviz-review-quiz-card">
              <h3>{item.question}</h3>
              {item.options?.length ? (
                <ul className="reviz-review-options">
                  {item.options.map((option) => {
                    const isSelected = selectedAnswers[quizIndex] === option;
                    const isCorrect = isSelected && option === item.correctAnswer;
                    const isIncorrect = isSelected && option !== item.correctAnswer;

                    return (
                      <li key={option}>
                        <button
                          type="button"
                          className={`reviz-review-option${isCorrect ? " correct" : ""}${isIncorrect ? " incorrect" : ""}${isSelected ? " selected" : ""}`}
                          onClick={() =>
                            setSelectedAnswers((current) => ({
                              ...current,
                              [quizIndex]: option,
                            }))
                          }
                        >
                          {option}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="reviz-review-expected">
                  <p className="reviz-review-card-tag">Reponse attendue</p>
                  <p>{item.correctAnswer}</p>
                </div>
              )}
              <p className="reviz-review-correct">
                <strong>Bonne reponse :</strong> {item.correctAnswer}
              </p>
              <p className="reviz-review-explanation">{item.explanation}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
