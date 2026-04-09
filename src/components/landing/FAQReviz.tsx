"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./FAQReviz.module.css";

type Category = "all" | "produit" | "methode" | "compte";

const filters: Array<{ label: string; value: Category }> = [
  { label: "Toutes", value: "all" },
  { label: "Le produit", value: "produit" },
  { label: "La méthode", value: "methode" },
  { label: "Compte & prix", value: "compte" },
];

const faqItems = [
  {
    category: "methode",
    question: "Pourquoi Reviz et pas juste relire mon cours ?",
    answer:
      "Relire est la technique de révision la moins efficace selon les neurosciences. Elle crée une illusion de maîtrise sans ancrer l'information. Reviz t'oblige à interagir avec le contenu : reformuler (Feynman), tester (quiz actif), visualiser (carte mentale). Ces trois actions activent la mémoire à long terme, pas la mémoire de travail.",
  },
  {
    category: "methode",
    question: "C'est quoi l'effet de génération et pourquoi c'est dans Reviz ?",
    answer:
      "L'effet de génération (Slamecka & Graf, 1978) montre que les informations qu'on produit soi-même sont retenues 2 à 3 fois mieux que celles qu'on lit passivement. C'est pour ça que Reviz génère des flashcards : te forcer à retrouver la réponse avant de la voir active ce mécanisme automatiquement à chaque session.",
  },
  {
    category: "methode",
    question: "À quoi sert la carte mentale dans ma fiche ?",
    answer:
      "La théorie du dual coding (Paivio, 1986) montre que combiner une représentation verbale et une représentation visuelle du même concept double les chances de le retrouver en mémoire. La carte mentale de Reviz crée ce double encodage : tu stockes l'info sous deux formes, deux chemins d'accès au moment de l'examen.",
  },
  {
    category: "methode",
    question: "Pourquoi Reviz identifie les erreurs à éviter ?",
    answer:
      "La métacognition — la capacité à surveiller et corriger sa propre pensée — est l'un des prédicteurs les plus forts de la réussite scolaire (Flavell, 1979). Les étudiants qui anticipent leurs propres pièges cognitifs font moins d'erreurs sous pression. La section 'erreurs à éviter' de chaque fiche Reviz entraîne exactement ce mécanisme.",
  },
  {
    category: "produit",
    question: "Reviz résume mon cours ou il me crée vraiment une fiche ?",
    answer:
      "Ni l'un ni l'autre — Reviz restructure et synthétise. Il ne copie pas ton cours, il en extrait les notions clés, les formules, les erreurs à éviter, et les organise dans une fiche pédagogique avec carte mentale et flashcards. Le résultat ressemble à ce qu'un bon élève aurait passé 2h à rédiger, pas à un copier-coller.",
  },
  {
    category: "compte",
    question: "C'est gratuit ?",
    answer:
      "Tu peux générer tes premières fiches gratuitement sans créer de compte. Pour accéder à l'historique, l'impression A4 et les flashcards illimitées, il y a un abonnement étudiant accessible.",
  },
  {
    category: "compte",
    question: "Mes cours sont-ils stockés quelque part ?",
    answer:
      "Tes documents ne sont pas conservés après la génération. Seule la fiche produite est sauvegardée dans ton espace si tu es connecté. Tes polys de cours ne transitent pas sur nos serveurs au-delà du temps de traitement.",
  },
] as const;

const stats = [
  { value: "3×", label: "mieux retenu qu'en relisant" },
  { value: "2 encodages", label: "visuel + verbal par fiche" },
  { value: "3 études", label: "Slamecka · Paivio · Flavell" },
] as const;

export function FAQReviz() {
  const [activeFilter, setActiveFilter] = useState<Category>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionId = useMemo(() => `faq-reviz-${Math.random().toString(36).slice(2, 8)}`, []);

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

  const filteredItems =
    activeFilter === "all"
      ? faqItems
      : faqItems.filter((item) => item.category === activeFilter);

  useEffect(() => {
    if (filteredItems.length === 0) {
      setOpenIndex(null);
      return;
    }

    setOpenIndex(0);
  }, [activeFilter]);

  return (
    <section id={sectionId} className={`section-band section-band-white ${styles.band}`}>
      <div className={`container section ${styles.section}`}>
        <div className={styles.head}>
          <span className={`${styles.eyebrow} reviz-reveal`} data-reveal="true">
            Neurosciences &amp; rétention
          </span>
          <h2 className={`${styles.title} reviz-reveal`} data-reveal="true">
            Pourquoi Reviz fait <span>rentrer</span> les cours ?
          </h2>
          <p className={`${styles.subtitle} reviz-reveal`} data-reveal="true">
            Pas par hasard. Chaque choix de Reviz — carte mentale, flashcards,
            erreurs à éviter — est appuyé par des études en neurosciences cognitives
            sur la mémoire à long terme.
          </p>
        </div>

        <div className={`${styles.statBar} reviz-reveal`} data-reveal="true">
          {stats.map((stat, index) => (
            <div key={stat.value} className={styles.statItem}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
              {index < stats.length - 1 ? <i className={styles.divider} aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <div className={`${styles.filters} reviz-reveal`} data-reveal="true">
          {filters.map((filter) => (
            <button
              key={filter.value}
              type="button"
              className={`${styles.filterPill} ${
                activeFilter === filter.value ? styles.filterPillActive : ""
              }`}
              onClick={() => setActiveFilter(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.accordionList}>
          {filteredItems.map((item, index) => {
            const isOpen = openIndex === index;
            const panelId = `${sectionId}-panel-${index}`;
            const buttonId = `${sectionId}-button-${index}`;

            return (
              <article
                key={item.question}
                className={`${styles.item} reviz-reveal`}
                data-reveal="true"
                style={{ transitionDelay: `${index * 60}ms` }}
                data-cat={item.category}
              >
                <button
                  id={buttonId}
                  type="button"
                  className={styles.trigger}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span className={styles.question}>{item.question}</span>
                  <span className={`${styles.iconWrap} ${isOpen ? styles.iconWrapOpen : ""}`}>
                    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
                      <path d="M12 6v12" />
                      <path d="M6 12h12" />
                    </svg>
                  </span>
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
                >
                  <div className={styles.panelInner}>
                    <p>{item.answer}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className={`${styles.cta} reviz-reveal`} data-reveal="true">
          <div>
            <p className={styles.ctaTitle}>Tu as une autre question ?</p>
            <p className={styles.ctaSubtitle}>Notre équipe répond en moins de 24h.</p>
          </div>
          <Link href="mailto:contact@reviz.app" className={styles.ctaButton}>
            Nous contacter →
          </Link>
        </div>
      </div>
    </section>
  );
}
