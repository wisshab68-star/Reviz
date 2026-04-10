"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./MethodeReviz.module.css";

const cards = [
  {
    title: "Carte mentale",
    badge: "Dual coding",
    description:
      "Relie les concepts entre eux visuellement. Le cerveau retient 6× mieux les informations organisées en réseau.",
    illustration: "mindmap",
  },
  {
    title: "Méthode Feynman",
    badge: "Génération active",
    description:
      "Reformuler avec ses propres mots force la compréhension profonde. Pas de mémorisation à vide.",
    illustration: "bulb",
  },
  {
    title: "Erreurs à éviter",
    badge: "Métacognition",
    description:
      "Anticiper ses propres pièges cognitifs est le mécanisme le plus puissant contre les erreurs d'examen.",
    illustration: "warning",
  },
  {
    title: "Code couleur",
    badge: "Mémoire visuelle",
    description:
      "Le codage couleur active la mémoire visuelle et crée des ancres mentales pour retrouver les infos sous pression.",
    illustration: "venn",
  },
] as const;

function MindMapIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FFFFFF" : "#0D0D0D";

  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={styles.illustration}>
      <circle cx="28" cy="28" r="7" fill="none" stroke={stroke} strokeWidth="2.5" />
      <circle cx="10" cy="14" r="4.5" fill="white" stroke={stroke} strokeWidth="2.5" />
      <circle cx="46" cy="12" r="4.5" fill="white" stroke={stroke} strokeWidth="2.5" />
      <circle cx="45" cy="42" r="4.5" fill="white" stroke={stroke} strokeWidth="2.5" />
      <circle cx="13" cy="44" r="4.5" fill="white" stroke={stroke} strokeWidth="2.5" />
      <path d="M22 24 13 17" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 23 41 16" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M34 33 40 39" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M22 33 17 39" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function BulbIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FFFFFF" : "#0D0D0D";

  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={styles.illustration}>
      <path
        d="M28 10c-7.7 0-14 6-14 13.5 0 5.2 2.4 8 5.9 10.9 1.6 1.4 2.6 3.1 2.8 5.1h10.6c.2-2 1.2-3.7 2.8-5.1 3.5-2.9 5.9-5.7 5.9-10.9C42 16 35.7 10 28 10Z"
        fill="white"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M23 40h10" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24.5 45h7" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M28 5v4" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M15 10.5 18 13" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M41 10.5 38 13" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M10 23h4" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 23h4" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function WarningIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FFFFFF" : "#0D0D0D";

  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={styles.illustration}>
      <path
        d="M28 9 46 42H10L28 9Z"
        fill="white"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M28 20v10" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="28" cy="35.5" r="1.7" fill={stroke} />
      <rect x="36" y="34" width="12" height="12" rx="4" fill="white" stroke={stroke} strokeWidth="2.5" />
      <path d="m39.5 37.5 5 5" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="m44.5 37.5-5 5" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function VennIcon({ active }: { active: boolean }) {
  const stroke = active ? "#FFFFFF" : "#0D0D0D";

  return (
    <svg viewBox="0 0 56 56" aria-hidden="true" className={styles.illustration}>
      <circle cx="22" cy="24" r="12" fill="white" stroke={stroke} strokeWidth="2.5" />
      <circle cx="34" cy="24" r="12" fill="white" stroke={stroke} strokeWidth="2.5" />
      <circle cx="28" cy="34" r="12" fill="white" stroke={stroke} strokeWidth="2.5" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true" className={styles.brainIcon}>
      <path
        d="M24 14c-6.2 0-11 4.9-11 10.9 0 2.4.8 4.6 2.1 6.4-1.1 1.2-1.8 2.8-1.8 4.6 0 4 3 7.2 7 7.6.8 3.4 3.8 5.8 7.4 5.8V14h-3.7Z"
        fill="none"
        stroke="#0D0D0D"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M36 14c6.2 0 11 4.9 11 10.9 0 2.4-.8 4.6-2.1 6.4 1.1 1.2 1.8 2.8 1.8 4.6 0 4-3 7.2-7 7.6-.8 3.4-3.8 5.8-7.4 5.8V14H36Z"
        fill="none"
        stroke="#0D0D0D"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M24 21c2.3 0 4.2 1.9 4.2 4.2" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M23 31c2.8 0 5 2.2 5 5" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 21c-2.3 0-4.2 1.9-4.2 4.2" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M37 31c-2.8 0-5 2.2-5 5" fill="none" stroke="#0D0D0D" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function CardIllustration({
  type,
  active,
}: {
  type: (typeof cards)[number]["illustration"];
  active: boolean;
}) {
  if (type === "mindmap") {
    return <MindMapIcon active={active} />;
  }

  if (type === "bulb") {
    return <BulbIcon active={active} />;
  }

  if (type === "warning") {
    return <WarningIcon active={active} />;
  }

  return <VennIcon active={active} />;
}

export function MethodeReviz() {
  const [activeCard, setActiveCard] = useState(0);
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
      ref={sectionRef}
      className={styles.band}
      style={{
        background: "#ffffff",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition:
          "opacity 0.6s ease, transform 0.6s cubic-bezier(0.34,1.56,0.64,1)",
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} anim`}>
            Méthode Reviz
          </span>
          <h2 className={`${styles.title} anim`}>
            <span className={styles.titleLine}>Pas juste un résumé.</span>
            <span className={styles.titleLine}>
              Un cerveau qui <span className={styles.titleAccent}>retient.</span>
            </span>
          </h2>
          <p className={`${styles.subtitle} anim`}>
            Chaque fiche Reviz active 4 mécanismes validés par les neurosciences
            cognitives pour ancrer durablement tes connaissances.
          </p>
        </div>

        <div className={styles.grid}>
          {cards.map((card, index) => {
            const active = index === activeCard;

            return (
              <button
                key={card.title}
                type="button"
                className={`${styles.card} ${active ? styles.cardActive : ""} anim`}
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(24px)",
                  transition: `opacity 0.6s ease ${visible ? index * 80 : 0}ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) ${visible ? index * 80 : 0}ms, box-shadow 0.2s ease, background 0.2s ease, color 0.2s ease`,
                }}
                onClick={() => setActiveCard(index)}
                aria-pressed={active}
              >
                <div className={styles.cardTop}>
                  <CardIllustration type={card.illustration} active={active} />
                  <span className={`${styles.badge} ${active ? styles.badgeActive : ""}`}>
                    {card.badge}
                  </span>
                </div>
                <h3 className={styles.cardTitle}>{card.title}</h3>
                <p className={styles.cardDescription}>{card.description}</p>
              </button>
            );
          })}
        </div>

        <div
          className={`${styles.scienceBar} anim`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
            transition:
              "opacity 0.6s ease 320ms, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 320ms",
          }}
        >
          <BrainIcon />
          <p className={styles.scienceText}>
            Validé par la recherche — effet de génération (Slamecka &amp; Graf, 1978),
            dual coding (Paivio, 1986), métacognition (Flavell, 1979). Reviz n&apos;est
            pas un résumeur, c&apos;est un système de rétention.
          </p>
        </div>
      </div>

      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        style={{ display: "block", width: "100%", height: "80px", marginBottom: "-2px" }}
        aria-hidden="true"
      >
        <path d="M0,0 C360,80 1080,0 1440,60 L1440,80 L0,80 Z" fill="#F4F6FF" />
      </svg>
    </section>
  );
}
