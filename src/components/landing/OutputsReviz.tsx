"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./OutputsReviz.module.css";

const quizOptions = [
  { id: "A", label: "P(A) + P(B) − P(A ∩ B)", correct: true },
  { id: "B", label: "P(A) × P(B)", correct: false },
  { id: "C", label: "1 − P(A)", correct: false },
] as const;

export function OutputsReviz() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="exemples"
      ref={sectionRef}
      className={styles.band}
      style={{
        background: "#F4F6FF",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} anim`}>Ce que tu obtiens</span>
          <h2 className={`${styles.title} anim`}>
            <span className={styles.titleLine}>Une sortie utile.</span>
            <span className={styles.titleLine}><s>Pas un pave.</s></span>
          </h2>
          <p className={`${styles.subtitle} anim`}>
            Trois formats complementaires, penses comme des vraies sorties premium.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={`${styles.outputCard} anim`} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease 0ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0ms, box-shadow 0.2s ease" }}>
            <div className={`${styles.preview} ${styles.previewSheetCard}`}>
              <span className={styles.sheetBadge}>Probabilites — Terminale</span>
              <p className={styles.previewLabel}>Notions cles</p>
              <ul className={styles.sheetList}>
                <li><span className={styles.violetDot} aria-hidden="true" /><span>Experience aleatoire : resultat imprevisible</span></li>
                <li><span className={styles.violetDot} aria-hidden="true" /><span>Univers Ω : ensemble de toutes les issues</span></li>
                <li><span className={styles.violetDot} aria-hidden="true" /><span>P(E) = nombre d&apos;issues favorables / total</span></li>
                <li className={styles.successRow}><span className={styles.greenDot} aria-hidden="true" /><span>Piege classique : confondre P(A|B) et P(B|A)</span></li>
              </ul>
            </div>
          </article>

          <article className={`${styles.outputCard} anim`} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease 80ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 80ms, box-shadow 0.2s ease" }}>
            <div className={styles.preview}>
              <button type="button" className={styles.flipCardButton} onClick={() => setIsFlipped((value) => !value)} aria-pressed={isFlipped}>
                <div className={`${styles.flipCard} ${isFlipped ? styles.flipped : ""}`}>
                  <div className={`${styles.flipFace} ${styles.flipFront}`}>
                    <span className={styles.flipLabel}>Question</span>
                    <p>Qu&apos;est-ce qu&apos;une experience aleatoire ?</p>
                    <span className={styles.flipHint}>Touche pour retourner →</span>
                  </div>
                  <div className={`${styles.flipFace} ${styles.flipBack}`}>
                    <span className={styles.flipLabel}>Reponse</span>
                    <p>Un processus dont on ne peut pas prevoir le resultat a l&apos;avance. Ex : lancer un de, tirer une carte.</p>
                  </div>
                </div>
              </button>
            </div>
          </article>

          <article className={`${styles.outputCard} anim`} style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)", transition: "opacity 0.6s ease 160ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 160ms, box-shadow 0.2s ease" }}>
            <div className={`${styles.preview} ${styles.previewQuizCard}`}>
              <p className={styles.quizQuestion}>P(A ∪ B) est egal a :</p>
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
                      className={[styles.quizOption, showCorrect ? styles.quizOptionCorrect : "", incorrect ? styles.quizOptionIncorrect : ""].join(" ")}
                      onClick={() => setSelectedAnswer(option.id)}
                    >
                      <span className={styles.quizOptionLetter}>{option.id}</span>
                      <span>{option.label}{option.correct ? " ✓" : ""}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </article>
        </div>
      </div>

      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ display: "block", width: "100%", height: "80px", marginBottom: "-2px" }} aria-hidden="true">
        <path d="M0,60 C360,0 1080,80 1440,20 L1440,80 L0,80 Z" fill="#FFFFFF" />
      </svg>
    </section>
  );
}
