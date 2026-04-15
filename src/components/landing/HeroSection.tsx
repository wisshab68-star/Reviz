'use client';

import Link from 'next/link';
import styles from './HeroSection.module.css';

/* ── Premium SVG icons inline (no emoji, no external deps) ── */
const IC = '#1a1a1a';

function IconMath() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="20" y="27" textAnchor="middle" fontSize="22" fontFamily="Georgia,serif" fill={IC} fontWeight="700">∑</text>
    </svg>
  );
}
function IconPhysics() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="20" cy="20" rx="11" ry="5" stroke={IC} strokeWidth="1.4"/>
      <ellipse cx="20" cy="20" rx="11" ry="5" stroke={IC} strokeWidth="1.4" transform="rotate(60 20 20)"/>
      <ellipse cx="20" cy="20" rx="11" ry="5" stroke={IC} strokeWidth="1.4" transform="rotate(120 20 20)"/>
      <circle cx="20" cy="20" r="2.5" fill={IC}/>
    </svg>
  );
}
function IconChemistry() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 10 L16 21 L10 31 L30 31 L24 21 L24 10 Z" stroke={IC} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <line x1="16" y1="10" x2="24" y2="10" stroke={IC} strokeWidth="1.4"/>
      <circle cx="17" cy="27" r="1.5" fill={IC}/>
      <circle cx="23" cy="25" r="1.5" fill={IC}/>
    </svg>
  );
}
function IconBio() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 8 C14 12, 14 18, 20 20 C26 22, 26 28, 20 32" stroke={IC} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      <path d="M20 8 C26 12, 26 18, 20 20 C14 22, 14 28, 20 32" stroke={IC} strokeWidth="1.7" fill="none" strokeLinecap="round"/>
      <line x1="15.5" y1="13" x2="24.5" y2="15" stroke={IC} strokeWidth="1.1" opacity="0.4"/>
      <line x1="15.5" y1="20" x2="24.5" y2="20" stroke={IC} strokeWidth="1.1" opacity="0.4"/>
      <line x1="15.5" y1="27" x2="24.5" y2="25" stroke={IC} strokeWidth="1.1" opacity="0.4"/>
    </svg>
  );
}
function IconHistory() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="28" width="20" height="2.5" rx="1" fill={IC}/>
      <rect x="12" y="13" width="2.5" height="15" rx="1" fill={IC}/>
      <rect x="18.75" y="13" width="2.5" height="15" rx="1" fill={IC}/>
      <rect x="25.5" y="13" width="2.5" height="15" rx="1" fill={IC}/>
      <path d="M9 14 L20 9 L31 14" stroke={IC} strokeWidth="1.7" fill="none" strokeLinejoin="round"/>
    </svg>
  );
}
function IconGeo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="10" stroke={IC} strokeWidth="1.4"/>
      <ellipse cx="20" cy="20" rx="5" ry="10" stroke={IC} strokeWidth="1.2"/>
      <line x1="10" y1="20" x2="30" y2="20" stroke={IC} strokeWidth="1.2"/>
      <line x1="11.7" y1="15" x2="28.3" y2="15" stroke={IC} strokeWidth="0.9" opacity="0.4"/>
      <line x1="11.7" y1="25" x2="28.3" y2="25" stroke={IC} strokeWidth="0.9" opacity="0.4"/>
    </svg>
  );
}
function IconPhilo() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 30 L12 16 Q12 10 20 10 Q28 10 28 16 Q28 22 20 22 L12 22" stroke={IC} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <line x1="15" y1="26" x2="24" y2="26" stroke={IC} strokeWidth="1.2"/>
      <line x1="15" y1="30" x2="22" y2="30" stroke={IC} strokeWidth="1.2"/>
    </svg>
  );
}
function IconLang() {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 14 L10 28 L16 23 L30 23 L30 14 Z" stroke={IC} strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      <line x1="14" y1="18" x2="26" y2="18" stroke={IC} strokeWidth="1.2"/>
      <line x1="14" y1="21" x2="22" y2="21" stroke={IC} strokeWidth="1.2"/>
    </svg>
  );
}

const floaters = [
  { cls: 'f1', Icon: IconMath,      label: 'Mathématiques', sub: 'Terminale' },
  { cls: 'f2', Icon: IconChemistry, label: 'Chimie',         sub: 'Lycée' },
  { cls: 'f3', Icon: IconBio,       label: 'SVT',             sub: 'Terminale' },
  { cls: 'f4', Icon: IconHistory,   label: 'Histoire',        sub: '3ème · Lycée' },
  { cls: 'f5', Icon: IconPhysics,   label: 'Physique',        sub: 'Première' },
  { cls: 'f6', Icon: IconGeo,       label: 'Géographie',      sub: 'Seconde' },
  { cls: 'f7', Icon: IconPhilo,     label: 'Philosophie',     sub: 'Terminale' },
  { cls: 'f8', Icon: IconLang,      label: 'Anglais',         sub: 'Niveau B2' },
] as const;

export default function HeroSection() {
  return (
    <section className={styles.hero}>

      {/* ── Orbit rings ── */}
      <svg
        className={styles.orbitsBg}
        viewBox="0 0 1400 900"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        {/* Inner ring */}
        <circle cx="700" cy="450" r="220" stroke="#d8d8d8" strokeWidth="1.2" fill="none"/>
        {/* Middle ring */}
        <circle cx="700" cy="450" r="360" stroke="#e2e2e2" strokeWidth="1" fill="none"/>
        {/* Outer ring */}
        <circle cx="700" cy="450" r="500" stroke="#e8e8e8" strokeWidth="0.8" fill="none"/>
        {/* Far outer ring */}
        <circle cx="700" cy="450" r="650" stroke="#f0f0f0" strokeWidth="0.7" fill="none" strokeDasharray="8 6"/>

        {/* Node dots exactement sur les cercles aux positions des floaters */}
        {/* f1 r=360 -150° */ }
        <circle cx="388" cy="270" r="3.5" fill="#cccccc"/>
        {/* f2 r=220 -60° */}
        <circle cx="810" cy="260" r="3.5" fill="#cccccc"/>
        {/* f3 r=500 -30° */}
        <circle cx="1133" cy="200" r="3.5" fill="#cccccc"/>
        {/* f4 r=360 180° */}
        <circle cx="340" cy="450" r="3.5" fill="#cccccc"/>
        {/* f5 r=360 0° */}
        <circle cx="1060" cy="450" r="3.5" fill="#cccccc"/>
        {/* f6 r=220 120° */}
        <circle cx="590" cy="641" r="3.5" fill="#cccccc"/>
        {/* f7 r=500 30° */}
        <circle cx="1133" cy="700" r="3.5" fill="#cccccc"/>
        {/* f8 r=360 150° */}
        <circle cx="388" cy="630" r="3.5" fill="#cccccc"/>

        {/* Small tick marks on rings for premium feel */}
        <line x1="700" y1="230" x2="700" y2="210" stroke="#d8d8d8" strokeWidth="1.2"/>
        <line x1="700" y1="670" x2="700" y2="690" stroke="#d8d8d8" strokeWidth="1.2"/>
        <line x1="480" y1="450" x2="460" y2="450" stroke="#d8d8d8" strokeWidth="1.2"/>
        <line x1="920" y1="450" x2="940" y2="450" stroke="#d8d8d8" strokeWidth="1.2"/>
      </svg>

      {/* ── Floating subject cards ── */}
      <div className={styles.floaters} aria-hidden="true">
        {floaters.map(({ cls, Icon, label, sub }) => (
          <div key={cls} className={`${styles.floater} ${styles[cls]}`}>
            <div className={styles.floaterIconWrap}><Icon /></div>
            <div>
              <span className={styles.floaterLabel}>{label}</span>
              <span className={styles.floaterSub}>{sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main content ── */}
      <div className={styles.container}>

        <div className={styles.logoSection}>
          <span className={styles.logoText}>REVIZ<span className={styles.logoDot}>.</span></span>
        </div>

        <h1 className={styles.headline}>
          Tes fiches qui te font mémoriser
        </h1>

        <p className={styles.subheadline}>
          Générées en 30 secondes, basées sur les mécanismes de la mémoire
          validés par les neurosciences.
        </p>

        <div className={styles.ctaSection}>
          <Link href="/sign-up" className={styles.btnPrimary}>
            Générer ma première fiche
          </Link>
          <Link href="/sign-in" className={styles.btnSecondary}>
            Se connecter
          </Link>
        </div>

        <p className={styles.trustLine}>
          <span className={styles.trustHighlight}>4,99€/mois</span>
          {' '}— c'est le prix d'un cahier de fiches. Pas d'engagement.
        </p>

      </div>
    </section>
  );
}
