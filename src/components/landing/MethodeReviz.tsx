"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./MethodeReviz.module.css";

const cards = [
  {
    title: "Carte mentale",
    emoji: "🗺️",
    iconBackground: "#EEEDFE",
    badge: "Dual coding",
    badgeBackground: "#EEEDFE",
    badgeColor: "#3C3489",
    description:
      "Relie les concepts entre eux visuellement. Le cerveau retient 6× mieux les informations organisées en réseau.",
  },
  {
    title: "Méthode Feynman",
    emoji: "✍️",
    iconBackground: "#E1F5EE",
    badge: "Génération active",
    badgeBackground: "#E1F5EE",
    badgeColor: "#085041",
    description:
      "Reformuler avec ses propres mots force la compréhension profonde. Pas de mémorisation à vide.",
  },
  {
    title: "Erreurs à éviter",
    emoji: "⚠️",
    iconBackground: "#FAECE7",
    badge: "Métacognition",
    badgeBackground: "#FAECE7",
    badgeColor: "#712B13",
    description:
      "Anticiper ses propres pièges cognitifs est le mécanisme le plus puissant contre les erreurs d'examen.",
  },
  {
    title: "Code couleur",
    emoji: "🎨",
    iconBackground: "#E6F1FB",
    badge: "Mémoire visuelle",
    badgeBackground: "#E6F1FB",
    badgeColor: "#0C447C",
    description:
      "Le codage couleur active la mémoire visuelle et crée des ancres mentales pour retrouver les infos sous pression.",
  },
] as const;

export function MethodeReviz() {
  const [activeCard, setActiveCard] = useState(0);
  const sectionId = useMemo(
    () => `methode-reviz-${Math.random().toString(36).slice(2, 8)}`,
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
    <section id={sectionId} className={`section-band section-band-white ${styles.band}`}>
      <div className={`container section ${styles.section}`}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} reviz-reveal`} data-reveal="true">
            Méthode Reviz
          </span>
          <h2 className={`${styles.title} reviz-reveal`} data-reveal="true">
            Pas juste un résumé. Un cerveau qui <span>retient.</span>
          </h2>
          <p className={`${styles.subtitle} reviz-reveal`} data-reveal="true">
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
                className={`${styles.card} ${active ? styles.cardActive : ""} reviz-reveal`}
                data-reveal="true"
                style={{ transitionDelay: `${index * 80}ms` }}
                onClick={() => setActiveCard(index)}
                aria-pressed={active}
              >
                <div className={styles.cardTop}>
                  <span
                    className={styles.icon}
                    style={{ backgroundColor: card.iconBackground }}
                    aria-hidden="true"
                  >
                    {card.emoji}
                  </span>
                  <span
                    className={styles.badge}
                    style={{
                      backgroundColor: card.badgeBackground,
                      color: card.badgeColor,
                    }}
                  >
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
          className={`${styles.scienceBar} reviz-reveal`}
          data-reveal="true"
          style={{ transitionDelay: "240ms" }}
        >
          <span className={styles.brain} aria-hidden="true">
            🧠
          </span>
          <p className={styles.scienceText}>
            Validé par la recherche en neurosciences cognitives — effet de génération
            (Slamecka &amp; Graf, 1978), dual coding (Paivio, 1986), métacognition
            (Flavell, 1979). Reviz n&apos;est pas un résumeur, c&apos;est un système de
            rétention.
          </p>
        </div>
      </div>
    </section>
  );
}
