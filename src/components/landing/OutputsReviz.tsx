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
        transition:
          "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} anim`}>
            Ce que tu obtiens
          </span>
          <h2 className={`${styles.title} anim`}>
            <span className={styles.titleLine}>Une sortie utile.</span>
            <span className={styles.titleLine}>
              <s>Pas un pavé.</s>
            </span>
          </h2>
          <p className={`${styles.subtitle} anim`}>
            Trois formats complémentaires, pensés pour chaque moment de ta révision.
          </p>
        </div>

        <div className={styles.grid}>
          <article
            className={`${styles.outputCard} anim`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition:
                "opacity 0.6s ease 0ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0ms, box-shadow 0.2s ease",
            }}
          >
            <div className={`${styles.illustrationZone} ${styles.illustrationFiche}`}>
              <span className={styles.illustrationNumber}>01</span>
              <svg viewBox="0 0 160 140" aria-hidden="true" className={styles.heroIllustration}>
                <g transform="translate(10 12) rotate(-3 70 55)">
                  <rect x="10" y="10" width="140" height="110" rx="12" fill="#FFFFFF" stroke="#3C3489" strokeWidth="2.5" />
                  <path d="M10 28h140v18H10z" fill="#6C63FF" />
                  <text x="80" y="21" textAnchor="middle" dominantBaseline="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                    FICHE
                  </text>
                  <circle cx="28" cy="52" r="4" fill="#6C63FF" />
                  <circle cx="28" cy="72" r="4" fill="#6C63FF" />
                  <circle cx="28" cy="92" r="4" fill="#6C63FF" />
                  <path d="M40 52h78" fill="none" stroke="#3C3489" strokeWidth="2" strokeLinecap="round" />
                  <path d="M40 72h64" fill="none" stroke="#3C3489" strokeWidth="2" strokeLinecap="round" />
                  <path d="M40 92h52" fill="none" stroke="#3C3489" strokeWidth="2" strokeLinecap="round" />
                </g>
              </svg>
            </div>
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
          </article>

          <article
            className={`${styles.outputCard} anim`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition:
                "opacity 0.6s ease 80ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 80ms, box-shadow 0.2s ease",
            }}
          >
            <div className={`${styles.illustrationZone} ${styles.illustrationCartes}`}>
              <span className={`${styles.illustrationNumber} ${styles.illustrationNumberLight}`}>02</span>
              <svg viewBox="0 0 160 140" aria-hidden="true" className={styles.heroIllustration}>
                <g transform="translate(18 18)">
                  <g transform="translate(18 12) rotate(6 65 42.5)" opacity="0.32">
                    <rect x="0" y="0" width="130" height="85" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                  </g>
                  <g>
                    <rect x="0" y="0" width="130" height="85" rx="10" fill="none" stroke="#FFFFFF" strokeWidth="2.5" />
                    <path d="M0 0h130v24H0z" fill="#FFFFFF" />
                    <text x="65" y="12" textAnchor="middle" dominantBaseline="middle" fill="#0D0D0D" fontSize="8" fontWeight="800">
                      RECTO
                    </text>
                    <path d="M18 43h76" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M18 58h62" fill="none" stroke="#CCCCCC" strokeWidth="1.5" strokeLinecap="round" />
                  </g>
                  <path
                    d="M130 48c16-2 21 16 9 24"
                    fill="none"
                    stroke="#2F5BFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path d="m132 73 7-1-3-6" fill="none" stroke="#2F5BFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              </svg>
            </div>
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
          </article>

          <article
            className={`${styles.outputCard} anim`}
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateY(0)" : "translateY(24px)",
              transition:
                "opacity 0.6s ease 160ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 160ms, box-shadow 0.2s ease",
            }}
          >
            <div className={`${styles.illustrationZone} ${styles.illustrationQuiz}`}>
              <span className={`${styles.illustrationNumber} ${styles.illustrationNumberSoft}`}>03</span>
              <svg viewBox="0 0 160 140" aria-hidden="true" className={styles.heroIllustration}>
                <text x="80" y="26" textAnchor="middle" fill="#FFFFFF" fontSize="28" fontWeight="800">
                  QCM
                </text>
                <g transform="translate(15 44)">
                  <g>
                    <rect x="18" y="0" width="130" height="22" rx="6" fill="rgba(255,255,255,0.9)" />
                    <circle cx="9" cy="11" r="9" fill="rgba(255,255,255,0.3)" />
                    <text x="9" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">A</text>
                    <path d="m136 11 5 5 9-11" fill="none" stroke="#2F5BFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                  <g transform="translate(0 28)">
                    <rect x="18" y="0" width="130" height="22" rx="6" fill="rgba(255,255,255,0.15)" />
                    <circle cx="9" cy="11" r="9" fill="rgba(255,255,255,0.3)" />
                    <text x="9" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">B</text>
                  </g>
                  <g transform="translate(0 56)">
                    <rect x="18" y="0" width="130" height="22" rx="6" fill="rgba(255,255,255,0.15)" />
                    <circle cx="9" cy="11" r="9" fill="rgba(255,255,255,0.3)" />
                    <text x="9" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="800">C</text>
                  </g>
                </g>
              </svg>
            </div>
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
          </article>
        </div>
      </div>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "80px", marginBottom: "-2px" }}
        aria-hidden="true"
      >
        <path d="M0,60 C360,0 1080,80 1440,20 L1440,80 L0,80 Z" fill="#FFFFFF" />
      </svg>
    </section>
  );
}
