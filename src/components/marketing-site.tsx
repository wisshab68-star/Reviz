"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";

import { AffiliateTracker } from "@/components/affiliate-tracker";

import { MethodeReviz } from "@/components/landing/MethodeReviz";
import HeroSection from "@/components/landing/HeroSection";
import { RevizVideoPlayer } from "@/components/landing/RevizVideoPlayer";

const sourceCards = [
  {
    kicker: "Je pars d'un cours",
    title: "PDF",
    copy: "Un poly, un chapitre, un support de cours. Reviz te fait gagner du temps.",
    symbol: "↓",
    tone: "light",
  },
  {
    kicker: "Je pars d'une page",
    title: "PHOTO",
    copy: "Tu photographies ton cahier ou ton tableau. L'app remet tout au propre.",
    symbol: "⊙",
    tone: "dark",
  },
  {
    kicker: "Je pars de l'essentiel",
    title: "TEXTE",
    copy: "Tu colles ton contenu et Reviz construit directement la fiche de revision.",
    symbol: "✦",
    tone: "blue",
  },
] as const;

const testimonials = [
  {
    initial: "L",
    colorClass: "avatar-blue",
    quote: "J'ai eu 16 en SVT apres avoir revise avec Reviz.",
    author: "Lea, Terminale S · SVT",
  },
  {
    initial: "A",
    colorClass: "avatar-green",
    quote: "En 10 minutes j'avais une fiche complete sur la Revolution francaise.",
    author: "Adam, 3eme · Histoire",
  },
  {
    initial: "I",
    colorClass: "avatar-violet",
    quote: "Parfait pour mes partiels, je gagne un temps fou.",
    author: "Ines, L1 Droit · Cours magistral",
  },
] as const;

const pricingPlans = [
  {
    badge: "Standard",
    name: "Standard",
    price: "3,99€",
    priceMonthly: "4,99€",
    period: "/mois en annuel",
    items: [
      "Jusqu'à 20 fiches par mois",
      "Toutes les matières lycée & collège",
      "Flashcards incluses",
      "Résiliation en 1 clic",
    ],
    cta: "Commencer",
    className: "plan-dark",
    ctaClass: "btn plan-dark-cta",
    annualBadge: true,
  },
  {
    badge: "Pro",
    name: "Pro",
    price: "7,99€",
    period: "/mois",
    items: [
      "Jusqu'à 50 fiches par mois",
      "Toutes les matières lycée & collège",
      "Flashcards incluses",
      "Résiliation en 1 clic",
    ],
    cta: "Commencer",
    className: "plan-dark",
    ctaClass: "btn plan-dark-cta",
  },
] as const;

const freePlan = {
  badge: "GRATUIT",
  price: "0€",
  subtitle: "Pour commencer",
  items: [
    "2 fiches gratuites",
    "Toutes les matières",
    "Flashcards incluses",
    "Accès à ta bibliothèque",
  ],
  cta: "Essayer gratuitement",
} as const;

const faqItems = [
  {
    question: "Reviz fonctionne pour le collège et le lycée ?",
    answer:
      "Oui, Reviz couvre toutes les matières du collège (6e-3e) et du lycée (Seconde-Terminale), ainsi que le BTS et la Licence.",
  },
  {
    question: "Comment fonctionne la fiche gratuite ?",
    answer:
      "Tu importes ton cours PDF ou tu prends une photo de ton cahier, tu choisis ta matière, et Reviz génère ta fiche en 30 secondes. Aucune carte bancaire requise pour commencer.",
  },
  {
    question: "Mes cours restent-ils confidentiels ?",
    answer:
      "Oui. Tes documents sont traités uniquement pour générer ta fiche et ne sont ni stockés ni partagés avec des tiers.",
  },
  {
    question: "Comment annuler mon abonnement ?",
    answer: "En un clic depuis ton espace compte. Aucune période d'engagement, aucun frais d'annulation.",
  },
  {
    question: "Reviz fonctionne-t-il sur téléphone ?",
    answer:
      "Oui, Reviz est optimisé mobile. Tu peux même prendre une photo de ton cahier ou tableau directement depuis l'app.",
  },
] as const;

function formatStudentCount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function StarIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="star-icon">
      <path d="M8 1.2 10.02 5.3l4.52.66-3.27 3.18.78 4.5L8 11.52 3.95 13.64l.78-4.5L1.46 5.96l4.52-.66Z" />
    </svg>
  );
}

export function MarketingSite() {
  const socialProofRef = useRef<HTMLElement | null>(null);
  const countStartedRef = useRef(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 18);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px" },
    );

    document.querySelectorAll(".reviz-reveal").forEach((element) => observer.observe(element));
    document.querySelectorAll(".reviz-reveal").forEach((element) => {
      const rect = element.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        element.classList.add("visible");
      }
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = socialProofRef.current;
    if (!node) return;

    const animateCount = () => {
      if (countStartedRef.current) return;
      countStartedRef.current = true;
      const start = performance.now();
      const duration = 1500;

      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - (1 - progress) ** 3;
        setStudentCount(Math.round(2000 * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };

      requestAnimationFrame(tick);
    };

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) animateCount();
        });
      },
      { threshold: 0.2 },
    );

    counterObserver.observe(node);
    return () => counterObserver.disconnect();
  }, []);

  return (
    <div className="landing">
      <Suspense fallback={null}><AffiliateTracker /></Suspense>
      <header className={`topbar ${isScrolled ? "topbar-scrolled" : ""}`}>
        <div className="container topbar-inner">
          <nav className="nav">
            <Link href="/sign-in" className="nav-link nav-link-outline">CONNEXION</Link>
            <Link href="/sign-up" className="nav-link nav-link-button">S&apos;INSCRIRE</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <h1 style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)", whiteSpace: "nowrap" }}>
          Reviz — Fiches de révision bac 2026 générées en 30 secondes
        </h1>
        <HeroSection />

        <section className="section-band video-band" style={{ background: "#0d0d0d" }}>
          <div className="video-band-inner">
            {/* Colonne gauche : texte */}
            <div className="video-band-text">
              <h2 className="reviz-reveal" style={{ color: "#fff", margin: 0 }}>
                Vois comment Reviz transforme ton cours en fiche
              </h2>
              <p className="section-note reviz-reveal reviz-reveal-delay-1" style={{ color: "rgba(255,255,255,0.6)", marginTop: "1.25rem" }}>
                Upload ton cours, choisis ta matière, et ta fiche complète arrive en moins d'1 minute.
              </p>
              <div style={{ marginTop: "2rem" }} className="reviz-reveal reviz-reveal-delay-2">
                <a href="/try" className="btn btn-primary" style={{ display: "inline-flex", textDecoration: "none" }}>
                  Essayer gratuitement →
                </a>
              </div>
            </div>

            {/* Colonne droite : vidéo pleine hauteur */}
            <div className="video-band-player reviz-reveal reviz-reveal-delay-1">
              <div className="video-frame">
                <RevizVideoPlayer />
              </div>
            </div>
          </div>
        </section>

<section id="steps" className="section-band section-band-blue">
          <div className="blue-particles" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span
                key={i}
                className="particle"
                style={{
                  left: `${8 + (i * 7.5) % 90}%`,
                  animationDuration: `${4 + (i % 5) * 1.5}s`,
                  animationDelay: `${(i * 0.6)}s`,
                  width: `${3 + (i % 3) * 2}px`,
                  height: `${3 + (i % 3) * 2}px`,
                }}
              />
            ))}
          </div>
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker section-kicker-light reviz-reveal reviz-reveal-delay-1">Comment ça marche</span>
              <h2 className="reviz-reveal">3 entrées. Un rendu net.</h2>
              <p className="section-note section-note-light reviz-reveal reviz-reveal-delay-1">
                Reviz est volontairement simple : tu donnes ton cours, l'IA structure, puis tu révises.
              </p>
            </div>
            <div className="grid grid-3">
              {sourceCards.map((card, index) => (
                <article key={card.title} className={`step-card reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div className="step-card-top">
                    <span className="step-number">{`0${index + 1}`}</span>
                    <div className="source-symbol" aria-hidden="true">{card.symbol}</div>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                </article>
              ))}
            </div>
            <div className="section-cta reviz-reveal reviz-reveal-delay-2">
              <Link href="/try" className="btn btn-secondary">Generer ma premiere fiche</Link>
            </div>
          </div>
        </section>

        <MethodeReviz />

        <section className="section-band pricing-proof">
          <div className="container section">
            <div className="section-head pricing-head">
              <span className="section-kicker reviz-reveal reviz-reveal-delay-1">Pricing</span>
              <h2 className="reviz-reveal">Dès 3,99€/mois — le prix d&apos;un cahier de fiches.</h2>
              <p className="section-note reviz-reveal reviz-reveal-delay-1">3,99€/mois en annuel · 4,99€/mois sans engagement. Annulation en un clic.</p>
            </div>
            <div className="pricing-grid">
              <article className="pricing-card pricing-card-free reviz-reveal reviz-reveal-delay-1">
                <div className="pricing-badge pricing-badge-free">{freePlan.badge}</div>
                <h3 className="pricing-title pricing-title-free">Gratuit</h3>
                <p className="pricing-price pricing-price-free">{freePlan.price}</p>
                <p className="pricing-subtitle">{freePlan.subtitle}</p>
                <ul className="pricing-list pricing-list-free">
                  {freePlan.items.map((item) => <li key={item}>• {item}</li>)}
                </ul>
                <Link href="/try" className="pricing-free-cta">
                  {freePlan.cta}
                </Link>
              </article>
              {pricingPlans.map((plan, index) => (
                <article key={plan.name} className={`pricing-card ${plan.className} reviz-reveal reviz-reveal-delay-${index + 2}`}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <div className="pricing-badge">{plan.badge}</div>
                    {"annualBadge" in plan && plan.annualBadge && (
                      <span style={{ background: "linear-gradient(90deg,#2f5bff,#6C3FFF)", color: "#fff", fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 999, letterSpacing: "0.05em" }}>−20% annuel</span>
                    )}
                  </div>
                  <h3 className="pricing-title">{plan.name}</h3>
                  <div>
                    {"priceMonthly" in plan && plan.priceMonthly && (
                      <span style={{ fontSize: "1.1rem", opacity: 0.45, textDecoration: "line-through", marginRight: 6 }}>{plan.priceMonthly}</span>
                    )}
                    <span className="pricing-price" style={{ display: "inline" }}>
                      {plan.price}
                    </span>
                    <span style={{ fontSize: "1rem", fontWeight: 400, opacity: 0.7 }}> {plan.period}</span>
                  </div>
                  <ul className="pricing-list">
                    {plan.items.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                  <Link href="/sign-in" className={plan.ctaClass}>{plan.cta}</Link>
                </article>
              ))}
            </div>
            <p className="pricing-footnote">Paiement securise Stripe · Annulation a tout moment · Sans engagement</p>

            {/* Offre spéciale examens */}
            <div className="promo-exam-block reviz-reveal">
              <div className="promo-exam-label">
                <span className="promo-exam-dot" />
                Offre spéciale · Période d&apos;examens
              </div>
              <div className="promo-exam-body">
                <div className="promo-exam-left">
                  <h3 className="promo-exam-title">Recharge express<br/>pour les révisions.</h3>
                  <p className="promo-exam-sub">Un paiement unique. Des fiches disponibles immédiatement. Réservé aux abonnés actifs.</p>
                  <span className="promo-exam-soon">🕐 Bientôt disponible</span>
                </div>
                <div className="promo-exam-cards">
                  <div className="promo-exam-card">
                    <p className="promo-exam-price">2€</p>
                    <p className="promo-exam-qty">20 fiches</p>
                    <p className="promo-exam-note">paiement unique</p>
                  </div>
                  <div className="promo-exam-card promo-exam-card-highlight">
                    <div className="promo-exam-best">Meilleure valeur</div>
                    <p className="promo-exam-price">4€</p>
                    <p className="promo-exam-qty">40 fiches</p>
                    <p className="promo-exam-note">paiement unique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-band faq-band">
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker reviz-reveal reviz-reveal-delay-1">FAQ</span>
              <h2 className="reviz-reveal">Questions fréquentes</h2>
            </div>
            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={item.question} className={`faq-item reviz-reveal reviz-reveal-delay-${(index % 3) + 1}`}>
                    <button
                      type="button"
                      className="faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaq((current) => (current === index ? null : index))}
                    >
                      <span>{item.question}</span>
                      <span className="faq-icon" aria-hidden="true">{isOpen ? "-" : "+"}</span>
                    </button>
                    <div className="faq-panel" data-open={isOpen}>
                      <p>{item.answer}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section ref={socialProofRef} className="section-band social-proof">
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker section-kicker-light reviz-reveal reviz-reveal-delay-1">Ils révisent déjà avec Reviz</span>
              <h2 className="reviz-reveal">Déjà utilisé par +{formatStudentCount(studentCount)} élèves</h2>
            </div>
            <div className="grid grid-3">
              {testimonials.map((testimonial, index) => (
                <article key={testimonial.author} className={`testimonial-card reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div className="testimonial-meta">
                    <div className={`testimonial-avatar ${testimonial.colorClass}`}>{testimonial.initial}</div>
                    <div>
                      <div className="stars" aria-label="5 etoiles">
                        <StarIcon />
                        <StarIcon />
                        <StarIcon />
                        <StarIcon />
                        <StarIcon />
                      </div>
                      <p>{testimonial.quote}</p>
                      <span className="testimonial-author">— {testimonial.author}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="footer reviz-reveal">
        <div className="container footer-inner">
          <div>
            <div className="footer-brand">REVIZ</div>
            <p className="footer-copy">Transforme tes cours en fiches de revision.</p>
            <p className="footer-copy">© 2025 Reviz AI</p>
          </div>
          <div className="footer-links">
            <a href="/mentions-legales">Mentions legales</a>
            <a href="mailto:contact@reviz.ai">Contact</a>
            <a href="/cgu">CGU</a>
          </div>
        </div>
      </footer>

      <Link href="/sign-up" className="mobile-sticky-cta">Essayer gratuitement →</Link>

      <style jsx global>{`
        .reviz-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1); }
        .reviz-reveal.visible { opacity: 1; transform: translateY(0); }
        .reviz-reveal-delay-1 { transition-delay: 0.1s; }
        .reviz-reveal-delay-2 { transition-delay: 0.2s; }
        .reviz-reveal-delay-3 { transition-delay: 0.3s; }
        .star-icon { width: 16px; height: 16px; fill: #FFB800; flex: 0 0 auto; animation: star-twinkle 2s ease-in-out infinite; }
        .star-icon:nth-child(2) { animation-delay: 0.2s; }
        .star-icon:nth-child(3) { animation-delay: 0.4s; }
        .star-icon:nth-child(4) { animation-delay: 0.6s; }
        .star-icon:nth-child(5) { animation-delay: 0.8s; }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 0.05; }
          50% { opacity: 0.12; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 4px 12px rgba(59, 91, 219, 0.15); }
          50% { box-shadow: 0 8px 32px rgba(59, 91, 219, 0.35), 0 0 60px rgba(59, 91, 219, 0.1); }
        }
        @keyframes float-particle {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-400px) translateX(80px); opacity: 0; }
        }
        @keyframes star-twinkle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
        }
        @keyframes tilt-in {
          from { opacity: 0; transform: perspective(800px) rotateY(8deg) translateX(30px); }
          to { opacity: 1; transform: perspective(800px) rotateY(0deg) translateX(0); }
        }
        @keyframes count-bar {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <style jsx>{`
        .landing { min-height: 100vh; background: #ffffff; color: #090909; }
        .container { width: min(100% - 48px, 1200px); margin: 0 auto; }
        .topbar { position: sticky; top: 0; z-index: 50; padding: 18px 0; transition: background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease; background: transparent; backdrop-filter: none; border-bottom: 1px solid transparent; }
        .topbar-scrolled { background: rgba(255,255,255,0.92); box-shadow: 0 10px 30px rgba(9,9,9,0.06); border-bottom: 1px solid rgba(9,9,9,0.08); }
        .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .brand, .hero-title, .section-head h2, .step-card h3, .footer-brand, .pricing-title, .pricing-price { font-family: var(--display-font), "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif; }
        .brand { font-size: 22px; font-weight: 900; color: #000000; letter-spacing: -0.02em; line-height: 1; }
        .brand-dot { color: #3B5BDB; }
        .nav { display: inline-flex; align-items: center; gap: 12px; }
        .nav-link { font-size: 14px; font-weight: 600; text-decoration: none; transition: box-shadow 0.2s ease, transform 0.2s ease, background 0.2s ease, color 0.2s ease, border-color 0.2s ease; }
        .nav-link-outline { color: #3B5BDB; border: 1px solid #3B5BDB; background: transparent; border-radius: 8px; padding: 10px 20px; }
        .nav-link-button { color: #ffffff; background: #3B5BDB; border: none; border-radius: 8px; padding: 10px 20px; font-weight: 600; }
        .nav-link-outline:hover,
        .nav-link-button:hover {
          box-shadow: 0 4px 12px rgba(63, 91, 219, 0.2);
          transform: translateY(-1px);
        }
        .hero { position: relative; width: 100%; min-height: 700px; background: #f8f9fa; display: flex; align-items: center; justify-content: center; overflow: hidden; z-index: 1; padding: 60px 24px; }
        .hero-orbits { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; pointer-events: none; }
        .orbit-ring { stroke: #d0d7de; stroke-width: 1; fill: none; opacity: 0.5; }
        .orbit-ring-outer { stroke-dasharray: 8 6; opacity: 0.3; }
        .orbit-line { stroke: #d0d7de; stroke-width: 1; fill: none; opacity: 0.4; }
        .hero-floaters { position: absolute; inset: 0; z-index: 2; pointer-events: none; }
        .floater { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 6px; animation: float 6s ease-in-out infinite; }
        .floater-1 { top: 14%; left: 8%; animation-delay: 0s; }
        .floater-2 { top: 8%; left: 38%; animation-delay: 0.8s; }
        .floater-3 { top: 22%; right: 10%; animation-delay: 1.2s; }
        .floater-4 { bottom: 28%; left: 6%; animation-delay: 0.4s; }
        .floater-5 { top: 10%; right: 18%; animation-delay: 1.6s; }
        .floater-6 { bottom: 18%; right: 8%; animation-delay: 2s; }
        .floater-7 { bottom: 12%; left: 18%; animation-delay: 0.6s; }
        .floater-8 { bottom: 22%; right: 16%; animation-delay: 1.4s; }
        .floater-9 { top: 40%; left: 4%; animation-delay: 1s; }
        .floater-10 { top: 36%; right: 5%; animation-delay: 1.8s; }
        .floater-emoji { font-size: 32px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08)); }
        .floater-icon { font-size: 28px; width: 52px; height: 52px; display: grid; place-items: center; background: #ffffff; border-radius: 14px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
        .floater-icon-circle { width: 44px; height: 44px; display: grid; place-items: center; background: #ffffff; border-radius: 50%; box-shadow: 0 4px 16px rgba(0,0,0,0.08); font-family: serif; font-size: 20px; color: #3B5BDB; font-weight: 700; }
        .floater-badge { font-size: 11px; font-weight: 600; color: #555; background: #ffffff; padding: 3px 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); white-space: nowrap; }
        .floater-chip { font-size: 12px; font-weight: 700; color: #1a7f37; background: #dafbe1; padding: 6px 14px; border-radius: 999px; box-shadow: 0 2px 10px rgba(0,0,0,0.06); white-space: nowrap; }
        .floater-chip-blue { color: #3B5BDB; background: #e8edff; }
        .floater-counter { font-size: 11px; font-weight: 700; color: #3B5BDB; background: #ffffff; padding: 2px 8px; border-radius: 999px; box-shadow: 0 2px 6px rgba(0,0,0,0.06); }
        .hero-content { position: relative; z-index: 10; text-align: center; max-width: 820px; padding: 0 20px; animation: hero-fade-up 1s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .eyebrow, .section-kicker, .source-kicker { font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.82rem; }
        .hero-brand-title { font-family: var(--display-font), "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif; font-size: clamp(42px, 7vw, 78px); font-weight: 900; color: #000000; margin: 0 0 28px; line-height: 1.08; letter-spacing: -0.03em; animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .hero-highlight { display: inline-block; background: #3B5BDB; color: #ffffff; padding: 2px 18px; border-radius: 14px; }
        .hero-desc { font-size: clamp(15px, 2vw, 18px); font-weight: 400; color: #555555; margin: 0 0 32px; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto; animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .lead, .section-note, .step-card p, .testimonial-card p, .footer-copy { color: #585f6b; line-height: 1.7; font-size: 1.04rem; }
        .hero-buttons { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both; }
        .hero-cta-primary { display: inline-flex; align-items: center; justify-content: center; background: #090909; color: #ffffff; border: 2px solid #090909; border-radius: 999px; padding: 16px 36px; font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-decoration: none; transition: all 300ms ease; box-shadow: 0 4px 12px rgba(0,0,0,0.1); animation: glow-pulse 3s ease-in-out 1.5s infinite; }
        .hero-cta-primary:hover { transform: scale(1.05) translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.18); }
        .hero-cta-outline { display: inline-flex; align-items: center; justify-content: center; background: transparent; color: #090909; border: 2px solid #090909; border-radius: 999px; padding: 16px 36px; font-size: 15px; font-weight: 700; letter-spacing: 0.06em; text-decoration: none; transition: all 300ms ease; }
        .hero-cta-outline:hover { background: #090909; color: #ffffff; transform: translateY(-2px); }
        .hero-microcopy { font-size: 13px; color: #888888; margin: 0; font-weight: 400; animation: hero-fade-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both; }
        .cta-row, .section-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 28px; }
        .btn { min-height: 62px; padding: 0 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; border: 3px solid #090909; font-weight: 800; font-size: 1rem; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1); }
        .btn:hover { transform: translateY(-3px); }
        .btn-primary { background: #2f5bff; color: #ffffff; box-shadow: 8px 8px 0 #090909; }
        .btn-secondary { background: #ffffff; color: #090909; }
        .section-kicker-light, .pricing-badge { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 16px; border-radius: 999px; font-weight: 800; }
        .section { padding: 110px 0; }
        .grid { display: grid; gap: 18px; }
        .grid-3 { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .section-head { max-width: 760px; margin-bottom: 36px; }
        .section-head h2 { margin: 14px 0 0; font-size: clamp(2.8rem,5vw,4.8rem); }
        .section-note { margin-top: 18px; }
        .section-note-light { color: rgba(255,255,255,0.86); }
        .section-band-blue { background: linear-gradient(135deg, #2f5bff 0%, #3B5BDB 40%, #5B4BF7 100%); background-size: 200% 200%; animation: gradient-shift 8s ease-in-out infinite; color: #ffffff; position: relative; overflow: hidden; }
        .section-band-blue::before { content: ""; position: absolute; inset: 0; background: radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%); pointer-events: none; }
        .source-card, .step-card, .testimonial-card, .pricing-card { border: 3px solid #090909; border-radius: 28px; background: #ffffff; padding: 22px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .source-card h3, .step-card h3 { margin: 12px 0 0; font-size: clamp(2.1rem,3.4vw,3.4rem); }
        .source-card { min-height: 360px; display: flex; flex-direction: column; justify-content: space-between; }
        .source-card-dark { background: #101010; color: #ffffff; }
        .source-card-blue { background: #2f5bff; color: #ffffff; }
        .source-card:hover, .pricing-card:hover { transform: translateY(-6px) scale(1.01); }
        .testimonial-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 12px 36px rgba(47, 91, 255, 0.12); }
        .source-symbol { font-size: 4.8rem; line-height: 1; }
        .step-card h3 { margin: 12px 0 0; font-size: clamp(2.1rem,3.4vw,3.4rem); }
        .step-card { min-height: 340px; display: flex; flex-direction: column; justify-content: space-between; color: #090909; transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease; }
        .step-card:hover { transform: translateY(-8px) scale(1.02) rotateX(2deg); box-shadow: 0 20px 40px rgba(0,0,0,0.12); }
        .step-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 28px; }
        .step-number { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: #090909; color: #ffffff; font-weight: 800; flex: 0 0 auto; }
        .pricing-head { text-align: center; margin-left: auto; margin-right: auto; }
        .pricing-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; max-width: 1040px; margin: 0 auto; }
        .pricing-card { width: 100%; display: flex; flex-direction: column; gap: 14px; border-color: rgba(9,9,9,0.14); padding: 32px; }
        .pricing-badge { width: fit-content; background: #eef1f6; color: #090909; font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .pricing-card-free { background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 16px; box-shadow: none; }
        .pricing-badge-free { background: #F3F4F6; color: #6B7280; min-height: auto; padding: 4px 12px; border-radius: 50px; font-size: 12px; }
        .pricing-title-free { color: #000000; }
        .pricing-price-free { font-size: 48px; font-weight: 900; color: #000000; }
        .pricing-subtitle { margin: -4px 0 0; color: #6B7280; font-size: 14px; }
        .pricing-list-free { color: #374151; font-size: 14px; gap: 10px; }
        .pricing-free-cta { margin-top: auto; width: 100%; min-height: 56px; border-radius: 50px; background: #000000; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-weight: 700; text-decoration: none; }
        .plan-dark { background: linear-gradient(135deg, #090909 0%, #1a1a2e 50%, #090909 100%); background-size: 200% 200%; animation: gradient-shift 6s ease-in-out infinite; color: #ffffff; border-color: #090909; box-shadow: 10px 10px 0 #2f5bff; transition: box-shadow 0.4s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1); }
        .plan-dark:hover { box-shadow: 14px 14px 0 #2f5bff, 0 0 40px rgba(47,91,255,0.15); }
        .plan-dark .pricing-badge { background: rgba(255,255,255,0.14); color: #ffffff; }
        .pricing-title { margin: 0; font-size: 2.1rem; }
        .pricing-price { margin: 0; font-size: clamp(2.6rem,4vw,3.8rem); }
        .pricing-list { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; color: #313844; line-height: 1.6; }
        .plan-dark .pricing-list { color: rgba(255,255,255,0.88); }
        .plan-dark-cta { margin-top: auto; background: #ffffff; color: #090909; box-shadow: 8px 8px 0 rgba(255,255,255,0.16); }
        .pricing-footnote { margin: 24px 0 0; text-align: center; color: #666d78; font-size: 0.95rem; }
        .promo-exam-block { margin-top: 48px; background: #090909; border: 3px solid #090909; border-radius: 28px; padding: 40px 36px; display: flex; flex-direction: column; gap: 28px; max-width: 1040px; margin-left: auto; margin-right: auto; box-shadow: 10px 10px 0 #2f5bff; position: relative; overflow: hidden; }
        .promo-exam-block::before { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 80% 0%, rgba(47,91,255,0.18) 0%, transparent 60%); pointer-events: none; }
        .promo-exam-label { display: inline-flex; align-items: center; gap: 8px; font-size: 0.72rem; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: #2f5bff; }
        .promo-exam-dot { width: 7px; height: 7px; border-radius: 50%; background: #2f5bff; box-shadow: 0 0 8px #2f5bff; flex-shrink: 0; }
        .promo-exam-body { display: flex; align-items: center; gap: 40px; flex-wrap: wrap; }
        .promo-exam-left { flex: 1; min-width: 220px; display: flex; flex-direction: column; gap: 12px; }
        .promo-exam-title { margin: 0; font-size: clamp(1.6rem, 3.5vw, 2.4rem); font-weight: 900; color: #ffffff; font-family: var(--display-font), sans-serif; line-height: 1.15; }
        .promo-exam-sub { margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.5); line-height: 1.6; max-width: 320px; }
        .promo-exam-cards { display: flex; gap: 14px; flex-wrap: wrap; }
        .promo-exam-card { min-width: 150px; background: #161616; border: 2px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 22px 24px; display: flex; flex-direction: column; gap: 4px; position: relative; transition: transform 0.25s cubic-bezier(0.16,1,0.3,1), box-shadow 0.25s; cursor: default; }
        .promo-exam-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(47,91,255,0.2); }
        .promo-exam-card-highlight { background: #2f5bff; border-color: #2f5bff; box-shadow: 6px 6px 0 rgba(255,255,255,0.12); }
        .promo-exam-card-highlight:hover { box-shadow: 10px 10px 0 rgba(255,255,255,0.16), 0 12px 32px rgba(47,91,255,0.4); }
        .promo-exam-best { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #ffffff; color: #090909; font-size: 0.68rem; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; padding: 3px 10px; border-radius: 999px; white-space: nowrap; }
        .promo-exam-price { margin: 0; font-size: 2.8rem; font-weight: 900; color: #ffffff; font-family: var(--display-font), sans-serif; line-height: 1; }
        .promo-exam-qty { margin: 0; font-size: 1rem; font-weight: 700; color: rgba(255,255,255,0.9); }
        .promo-exam-note { margin: 0; font-size: 0.75rem; color: rgba(255,255,255,0.45); text-transform: lowercase; }
        .promo-exam-soon { display: inline-flex; align-items: center; gap: 6px; margin-top: 4px; padding: 5px 14px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.15); background: rgba(255,255,255,0.06); font-size: 0.78rem; font-weight: 600; color: rgba(255,255,255,0.55); width: fit-content; }
        .faq-list { border-top: 1px solid rgba(9,9,9,0.12); }
        .faq-item { border-bottom: 1px solid rgba(9,9,9,0.12); }
        .faq-trigger { width: 100%; padding: 22px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 0; background: transparent; text-align: left; font-size: 1.02rem; font-weight: 700; color: #090909; }
        .faq-icon { flex: 0 0 auto; font-size: 1.6rem; line-height: 1; color: #2f5bff; }
        .faq-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease, padding-bottom 0.28s ease; padding-bottom: 0; }
        .faq-panel[data-open="true"] { grid-template-rows: 1fr; padding-bottom: 20px; }
        .faq-panel p { margin: 0; overflow: hidden; color: #616875; line-height: 1.7; }
        /* ── Video band ── */
        .video-band-inner { display: grid; grid-template-columns: 1fr auto; min-height: 90vh; max-width: 1400px; margin: 0 auto; padding: 0 40px; gap: 60px; align-items: center; }
        .video-band-text { max-width: 520px; }
        .video-band-text h2 { font-size: clamp(2.4rem, 4vw, 4rem); }
        .video-band-player { display: flex; align-items: center; justify-content: flex-end; height: 90vh; }
        .video-frame { height: 85vh; aspect-ratio: 9/16; border-radius: 28px; border: 3px solid #050505; box-shadow: 10px 10px 0 #2f5bff, 0 40px 80px rgba(0,0,0,0.6); overflow: hidden; background: #fff; flex-shrink: 0; }
        @media (max-width: 900px) {
          .video-band-inner { grid-template-columns: 1fr; min-height: auto; padding: 60px 24px; gap: 40px; }
          .video-band-player { height: auto; justify-content: center; }
          .video-frame { height: auto; width: min(320px, 85vw); aspect-ratio: 9/16; }
        }
        .blue-particles { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
        .particle { position: absolute; bottom: 0; border-radius: 50%; background: rgba(255,255,255,0.3); animation: float-particle linear infinite; }
        .social-proof { background: #090909; color: #ffffff; }
        .stars { display: flex; align-items: center; gap: 4px; margin-bottom: 14px; }
        .star-icon { width: 16px; height: 16px; fill: #FFB800; flex: 0 0 auto; }
        .testimonial-meta { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
        .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #ffffff; }
        .avatar-blue { background: #2f5bff; }
        .avatar-green { background: #27a26a; }
        .avatar-violet { background: #7f56d9; }
        .testimonial-author { display: block; margin-top: 10px; color: #6a7280; font-size: 0.96rem; line-height: 1.5; }
        .footer { background: #090909; color: #ffffff; }
        .footer-inner { padding: 100px 0 60px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 24px; align-items: end; }
        .footer-brand { font-size: clamp(2.2rem,4vw,3.6rem); transition: letter-spacing 0.4s ease; }
        .footer-brand:hover { letter-spacing: 0.06em; }
        .footer-links { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .footer-links a { min-height: 48px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,0.08); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
        .mobile-sticky-cta { display: none; }
        @media (max-width: 1180px) {
          .grid-3, .footer-inner { grid-template-columns: 1fr; } .pricing-grid { grid-template-columns: 1fr; }
          .footer-links { justify-content: flex-start; }
        }
        @media (max-width: 767px) {
          .container { width: min(100% - 28px, 1200px); }
          .topbar { padding: 12px 0; }
          .topbar-inner { flex-direction: column; align-items: stretch; }
          .nav { width: 100%; justify-content: flex-end; }
          .hero { min-height: 540px; padding: 48px 20px; background: #ffffff; }
          .hero-floaters { display: none; }
          .hero-orbits { display: none; }
          .hero-brand-title { font-size: clamp(32px, 10vw, 48px); }
          .hero-highlight { padding: 1px 12px; border-radius: 10px; }
          .hero-desc { font-size: 15px; }
          .hero-buttons { flex-direction: column; gap: 12px; }
          .hero-cta-primary, .hero-cta-outline { width: 100%; }
          .section { padding: 60px 0; }
          .grid-3, .footer-inner { grid-template-columns: 1fr; } .pricing-grid { grid-template-columns: 1fr; }
          .step-card, .testimonial-card, .pricing-card { min-height: auto; }
          .footer-inner { padding: 60px 0; }
          .mobile-sticky-cta {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: #090909;
            color: #ffffff;
            z-index: 200;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            box-shadow: 0 -8px 30px rgba(9,9,9,0.18);
          }
          .footer { padding-bottom: 56px; }
        }
      `}</style>
    </div>
  );
}

