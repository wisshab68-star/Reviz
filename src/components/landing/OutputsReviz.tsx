"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./OutputsReviz.module.css";

const quizOptions = [
  { id: "A", label: "P(A) + P(B) − P(A ∩ B)", correct: true },
  { id: "B", label: "P(A) × P(B)", correct: false },
  { id: "C", label: "1 − P(A)", correct: false },
] as const;

export function OutputsReviz() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const sectionId = useMemo(
    () => `outputs-reviz-${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  useEffect(() => {
    const root = document.getElementById(sectionId);

    if (!root) {
      return;
    }

    const elements = Array.from(root.querySelectorAll("[data-reveal='true']"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" },
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [sectionId]);

  return (
    <section id="exemples" className={`section-band section-band-soft ${styles.band}`}>
      <div id={sectionId} className={`container section ${styles.section}`}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} reviz-reveal`} data-reveal="true">
            Ce que tu obtiens
          </span>
          <h2 className={`${styles.title} reviz-reveal`} data-reveal="true">
            Une sortie utile. <s>Pas un pavé.</s>
          </h2>
          <p className={`${styles.subtitle} reviz-reveal`} data-reveal="true">
            Trois formats complémentaires, pensés pour chaque moment de ta révision.
          </p>
        </div>

        <div className={styles.grid}>
          <article
            className={`${styles.card} reviz-reveal`}
            data-reveal="true"
            style={{ transitionDelay: "0ms" }}
          >
            <div className={styles.preview}>
              <span className={styles.sheetBadge}>Probabilités — Terminale</span>
              <p className={styles.previewLabel}>Notions clés</p>
              <ul className={styles.sheetList}>
                <li>
                  <span className={styles.violetDot} aria-hidden="true" />
                  <span>Probabilité conditionnelle — P(A|B) = P(A∩B)/P(B)</span>
                </li>
                <li>
                  <span className={styles.violetDot} aria-hidden="true" />
                  <span>Indépendance — A et B indép. si P(A∩B) = P(A)·P(B)</span>
                </li>
                <li className={styles.successRow}>
                  <span className={styles.greenDot} aria-hidden="true" />
                  <span>Piège classique : confondre P(A|B) et P(B|A)</span>
                </li>
              </ul>
            </div>
            <div className={styles.cardFooter}>
              <h3>Fiche</h3>
              <p>
                Notions, définitions, pièges et schéma mémoire. Tout l&apos;essentiel,
                zéro surcharge.
              </p>
            </div>
          </article>

          <article
            className={`${styles.card} reviz-reveal`}
            data-reveal="true"
            style={{ transitionDelay: "80ms" }}
          >
            <div className={styles.preview}>
              <button
                type="button"
                className={styles.flipCardButton}
                onClick={() => setIsFlipped((value) => !value)}
                aria-pressed={isFlipped}
              >
                <div className={`${styles.flipCard} ${isFlipped ? styles.flipped : ""}`}>
                  <div className={`${styles.flipFace} ${styles.flipFront}`}>
                    <span className={styles.flipLabel}>Recto — Question</span>
                    <p>Qu&apos;est-ce qu&apos;une expérience aléatoire ?</p>
                    <span className={styles.flipHint}>Touche pour retourner →</span>
                  </div>
                  <div className={`${styles.flipFace} ${styles.flipBack}`}>
                    <span className={styles.flipLabel}>Verso — Réponse</span>
                    <p>
                      Expérience dont l&apos;issue est imprévisible. L&apos;ensemble des
                      issues = univers Ω.
                    </p>
                  </div>
                </div>
              </button>
              <p className={styles.helper}>Touche la carte pour retourner</p>
            </div>
            <div className={styles.cardFooter}>
              <h3>Cartes</h3>
              <p>
                Des flashcards simples pour te tester vite et repasser sur les notions
                centrales.
              </p>
            </div>
          </article>

          <article
            className={`${styles.card} reviz-reveal`}
            data-reveal="true"
            style={{ transitionDelay: "160ms" }}
          >
            <div className={styles.preview}>
              <p className={styles.quizQuestion}>P(A ∪ B) est égal à :</p>
              <div className={styles.quizList}>
                {quizOptions.map((option) => {
                  const answered = selectedAnswer !== null;
                  const isSelected = selectedAnswer === option.id;
                  const showCorrect = answered && option.correct;
                  const incorrect = isSelected && answered && !option.correct;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={[
                        styles.quizOption,
                        showCorrect ? styles.quizOptionCorrect : "",
                        incorrect ? styles.quizOptionIncorrect : "",
                      ].join(" ")}
                      onClick={() => setSelectedAnswer(option.id)}
                    >
                      <span className={styles.quizOptionLetter}>{option.id}</span>
                      <span>{option.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className={styles.cardFooter}>
              <h3>Quiz</h3>
              <p>
                Révision active pour vérifier si tu as vraiment compris, pas juste
                relu.
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
