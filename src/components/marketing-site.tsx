"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MethodeReviz } from "@/components/landing/MethodeReviz";
import { OutputsReviz } from "@/components/landing/OutputsReviz";

const sourceCards = [
  { kicker: "Je pars d'un cours", title: "PDF", copy: "Un poly, un chapitre, un support de cours. Reviz te fait gagner du temps.", symbol: "↓", tone: "light" },
  { kicker: "Je pars d'une page", title: "PHOTO", copy: "Tu photographies ton cahier ou ton tableau. L'app remet tout au propre.", symbol: "◎", tone: "dark" },
  { kicker: "Je pars de l'essentiel", title: "TEXTE", copy: "Tu colles ton contenu et Reviz construit directement la fiche de revision.", symbol: "✦", tone: "blue" },
] as const;

const steps = [
  { number: "01", title: "importe", copy: "PDF, photo, image ou texte. Tu commences avec ce que tu as deja." },
  { number: "02", title: "transforme", copy: "Reviz genere une fiche claire avec schema, notions, flashcards et quiz." },
  { number: "03", title: "retiens", copy: "Tu ouvres la fiche, tu revises mieux, tu passes a la suite sans te perdre." },
] as const;

const testimonials = [
  { initial: "L", colorClass: "avatar-blue", quote: "J'ai eu 16 en SVT apres avoir revise avec Reviz.", author: "Lea, Terminale S · SVT" },
  { initial: "A", colorClass: "avatar-green", quote: "En 10 minutes j'avais une fiche complete sur la Revolution francaise.", author: "Adam, 3eme · Histoire" },
  { initial: "I", colorClass: "avatar-violet", quote: "Parfait pour mes partiels, je gagne un temps fou.", author: "Ines, L1 Droit · Cours magistral" },
] as const;

const pricingPlans = [
  { badge: "Pour decouvrir", name: "GRATUIT", price: "Gratuit", items: ["1 fiche par mois", "Sans carte bancaire", "Sans inscription"], cta: "Essayer maintenant", className: "plan-light", ctaClass: "btn btn-secondary" },
  { badge: "Le plus populaire", name: "PRO ⭐", price: "4,99€/mois", compareAt: "Koro AI : 9,99€/mois", items: ["Fiches illimitees", "Toutes les matieres lycee & college", "Flashcards + Quiz inclus", "Resiliation en 1 clic"], cta: "Commencer", className: "plan-dark", ctaClass: "btn plan-dark-cta" },
] as const;

const faqItems = [
  { question: "Reviz fonctionne pour le college et le lycee ?", answer: "Oui, Reviz couvre toutes les matieres du college (6eme-3eme) et du lycee (Seconde-Terminale), ainsi que le BTS et la Licence." },
  { question: "Comment fonctionne la fiche gratuite ?", answer: "Tu importes ton cours PDF ou tu prends une photo de ton cahier, tu choisis ta matiere, et Reviz genere ta fiche en 30 secondes. Aucune carte bancaire requise pour commencer." },
  { question: "Mes cours restent-ils confidentiels ?", answer: "Oui. Tes documents sont traites uniquement pour generer ta fiche et ne sont ni stockes ni partages avec des tiers." },
  { question: "Comment annuler mon abonnement ?", answer: "En un clic depuis ton espace compte. Aucune periode d'engagement, aucun frais d'annulation." },
  { question: "Reviz fonctionne-t-il sur telephone ?", answer: "Oui, Reviz est optimise mobile. Tu peux meme prendre une photo de ton cahier ou tableau directement depuis l'app." },
] as const;

const heroWords = ["REVIZ", "transforme", "tes", "cours", "en", "fiches."] as const;

function formatStudentCount(value: number) {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function StepIcon({ step }: { step: (typeof steps)[number]["number"] }) {
  if (step === "01") {
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true" className="step-icon-svg">
        <path d="M40 12v42" />
        <path d="M24 39 40 55 56 39" />
        <path d="M18 66h44" />
      </svg>
    );
  }

  if (step === "02") {
    return (
      <svg viewBox="0 0 80 80" aria-hidden="true" className="step-icon-svg">
        <path d="m40 12 6.5 16.5L63 35l-16.5 6.5L40 58l-6.5-16.5L17 35l16.5-6.5Z" />
        <path d="m58 14 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 80 80" aria-hidden="true" className="step-icon-svg">
      <path d="M14 24c0-4.4 3.6-8 8-8h16v44H22c-4.4 0-8-3.6-8-8Z" />
      <path d="M66 24c0-4.4-3.6-8-8-8H42v44h16c4.4 0 8-3.6 8-8Z" />
      <path d="M38 20h4" />
      <path d="M38 56h4" />
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
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.05, rootMargin: "0px" });

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

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) animateCount();
      });
    }, { threshold: 0.2 });

    counterObserver.observe(node);
    return () => counterObserver.disconnect();
  }, []);

  return (
    <div className="landing">
      <header className={`topbar ${isScrolled ? "topbar-scrolled" : ""}`}>
        <div className="container topbar-inner">
          <Link href="/" className="brand">REVIZ</Link>
          <nav className="nav">
            <a href="#hero" className="pill pill-active">Accueil</a>
            <a href="#modes" className="pill">A propos</a>
            <a href="#exemples" className="pill">Exemples</a>
            <Link href="/sign-in" className="pill">Connexion</Link>
          </nav>
        </div>
      </header>

      <main className="page">
        <section id="hero" className="hero-band">
          <div className="container hero">
            <div className="hero-copy">
              <p className="eyebrow">REVISION SIMPLE. VITE. BIEN.</p>
              <div className="hero-speed-badge">⚡ Fiche generee en 30 secondes</div>
              <h1 className="hero-title" aria-label="REVIZ transforme tes cours en fiches.">
                {heroWords.map((word, index) => (
                  <span key={word} className={`hero-word ${word === "cours" ? "chip" : ""}`} style={{ animationDelay: `${index * 0.08}s` }}>
                    {word}
                  </span>
                ))}
              </h1>
              <p className="lead">PDF, photo, image ou texte. Reviz AI genere une fiche claire, un schema, des flashcards et un quiz sans te noyer sous le blabla.</p>
              <div className="cta-row">
                <Link href="/app" className="btn btn-primary">Commencer</Link>
                <a href="#steps" className="btn btn-secondary">Voir comment</a>
              </div>
              <p className="hero-cta-note">1 fiche gratuite · Sans carte bancaire · Sans inscription</p>
              <div className="tag-row reviz-reveal reviz-reveal-delay-1">
                <span className="tag">PDF</span>
                <span className="tag">Photo</span>
                <span className="tag">Texte</span>
                <span className="tag">Fiche IA</span>
                <span className="tag">Flashcards</span>
                <span className="tag">Quiz</span>
              </div>
            </div>

            <div className="hero-visual" aria-hidden="true">
              <div className="hero-badge">REVISION FUN</div>
              <div className="hero-mock">
                <div className="mock-topbar">REVISION FUN</div>
                <div className="mock-sheet-card">
                  <p className="mock-section-kicker">PROBABILITES</p>
                  <p className="mock-sheet-title">Probabilites - Terminale</p>
                  <div className="mock-row"><span className="mock-dot mock-dot-blue" /> <span>Experience aleatoire : resultat imprevisible</span></div>
                  <div className="mock-row"><span className="mock-dot mock-dot-blue" /> <span>Univers Ω : ensemble de toutes les issues</span></div>
                  <div className="mock-row mock-row-success"><span className="mock-dot mock-dot-green" /> <span>Piege : confondre P(A|B) et P(B|A)</span></div>
                  <div className="mock-divider" />
                  <p className="mock-card-label">FLASHCARD</p>
                  <div className="mock-flashcard">
                    <p>Qu'est-ce qu'une experience aleatoire ?</p>
                    <span>Touche pour retourner →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="section-band section-band-white">
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker reviz-reveal reviz-reveal-delay-1">Choisis ton entree</span>
              <h2 className="reviz-reveal">importe. capture. revise.</h2>
            </div>
            <div className="grid grid-3">
              {sourceCards.map((card, index) => (
                <article key={card.title} className={`source-card source-card-${card.tone} reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div>
                    <p className="source-kicker">{card.kicker}</p>
                    <h3>{card.title}</h3>
                    <p className="source-copy">{card.copy}</p>
                  </div>
                  <div className="source-symbol">{card.symbol}</div>
                  <Link href="/app" className="btn source-btn">Utiliser</Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="steps" className="section-band section-band-blue">
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker section-kicker-light reviz-reveal reviz-reveal-delay-1">Comment ca marche</span>
              <h2 className="reviz-reveal">3 etapes. pas plus.</h2>
              <p className="section-note section-note-light reviz-reveal reviz-reveal-delay-1">Reviz est volontairement simple : tu donnes ton cours, l'IA structure, puis tu revises.</p>
            </div>
            <div className="grid grid-3">
              {steps.map((step, index) => (
                <article key={step.number} className={`step-card reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div className="step-card-top">
                    <span className="step-number">{step.number}</span>
                    <StepIcon step={step.number} />
                  </div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </article>
              ))}
            </div>
            <div className="section-cta reviz-reveal reviz-reveal-delay-2">
              <Link href="/app" className="btn btn-secondary">Generer ma premiere fiche →</Link>
            </div>
          </div>
        </section>

        <MethodeReviz />
        <OutputsReviz />

        <section className="section-band pricing-proof">
          <div className="container section">
            <div className="section-head pricing-head">
              <span className="section-kicker reviz-reveal reviz-reveal-delay-1">Pricing</span>
              <h2 className="reviz-reveal">Un prix honnete. Pas de surprise.</h2>
              <p className="section-note reviz-reveal reviz-reveal-delay-1">Le prix d'un cahier de fiches. Zero heure de boulot.</p>
            </div>
            <div className="pricing-grid">
              {pricingPlans.map((plan, index) => (
                <article key={plan.name} className={`pricing-card ${plan.className} reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div className="pricing-badge">{plan.badge}</div>
                  <h3 className="pricing-title">{plan.name}</h3>
                  <p className="pricing-price">{plan.price}</p>
                  {"compareAt" in plan ? <p className="pricing-struck">{plan.compareAt}</p> : <div className="pricing-spacer" />}
                  <ul className="pricing-list">
                    {plan.items.map((item) => <li key={item}>✓ {item}</li>)}
                  </ul>
                  <Link href="/app" className={plan.ctaClass}>{plan.cta}</Link>
                </article>
              ))}
            </div>
            <p className="pricing-footnote">🔒 Paiement securise Stripe · Annulation a tout moment · Sans engagement</p>
          </div>
        </section>

        <section className="section-band faq-band">
          <div className="container section">
            <div className="section-head">
              <span className="section-kicker reviz-reveal reviz-reveal-delay-1">FAQ</span>
              <h2 className="reviz-reveal">Questions frequentes</h2>
            </div>
            <div className="faq-list">
              {faqItems.map((item, index) => {
                const isOpen = openFaq === index;
                return (
                  <article key={item.question} className={`faq-item reviz-reveal reviz-reveal-delay-${(index % 3) + 1}`}>
                    <button type="button" className="faq-trigger" aria-expanded={isOpen} onClick={() => setOpenFaq((current) => current === index ? null : index)}>
                      <span>{item.question}</span>
                      <span className="faq-icon" aria-hidden="true">{isOpen ? "−" : "+"}</span>
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
              <span className="section-kicker section-kicker-light reviz-reveal reviz-reveal-delay-1">Ils revisent deja avec Reviz</span>
              <h2 className="reviz-reveal">deja utilise par +{formatStudentCount(studentCount)} eleves</h2>
            </div>
            <div className="grid grid-3">
              {testimonials.map((testimonial, index) => (
                <article key={testimonial.author} className={`testimonial-card reviz-reveal reviz-reveal-delay-${index + 1}`}>
                  <div className="stars">★★★★★</div>
                  <div className="testimonial-meta">
                    <div className={`testimonial-avatar ${testimonial.colorClass}`}>{testimonial.initial}</div>
                    <div>
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

      <Link href="/app" className="mobile-sticky-cta">Essayer gratuitement →</Link>

      <style jsx global>{`
        .reviz-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1); }
        .reviz-reveal.visible { opacity: 1; transform: translateY(0); }
        .reviz-reveal-delay-1 { transition-delay: 0.1s; }
        .reviz-reveal-delay-2 { transition-delay: 0.2s; }
        .reviz-reveal-delay-3 { transition-delay: 0.3s; }
      `}</style>

      <style jsx>{`
        .landing { min-height: 100vh; background: #ffffff; color: #090909; }
        .container { width: min(100% - 48px, 1200px); margin: 0 auto; }
        .topbar { position: sticky; top: 0; z-index: 50; padding: 18px 0; transition: background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease; }
        .topbar-scrolled { background: rgba(255,255,255,0.86); backdrop-filter: blur(16px); box-shadow: 0 16px 48px rgba(9,9,9,0.08); border-bottom: 1px solid rgba(9,9,9,0.08); }
        .topbar-inner { display: flex; align-items: center; justify-content: space-between; gap: 18px; }
        .brand, .hero-title, .section-head h2, .source-card h3, .step-card h3, .footer-brand, .pricing-title, .pricing-price { font-family: "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif; letter-spacing: -0.06em; line-height: 0.88; font-weight: 800; }
        .brand { font-size: clamp(2.2rem, 4vw, 3.4rem); }
        .nav { display: inline-flex; align-items: center; gap: 10px; padding: 8px; border-radius: 999px; background: rgba(255,255,255,0.94); box-shadow: 0 24px 60px rgba(9,9,9,0.08); border: 1px solid rgba(9,9,9,0.08); }
        .pill { min-height: 50px; padding: 0 22px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: #f2f3f7; font-weight: 700; font-size: 0.96rem; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), background 0.3s ease; }
        .pill:hover { transform: translateY(-2px); }
        .pill-active { background: #141414; color: #ffffff; }
        .hero { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 56px; align-items: center; padding: 120px 0; }
        .hero-copy { display: flex; flex-direction: column; align-items: flex-start; }
        .eyebrow, .section-kicker, .stars, .source-kicker { font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; font-size: 0.82rem; }
        .hero-speed-badge { display: inline-flex; align-items: center; justify-content: center; min-height: 38px; padding: 0 16px; margin-top: 14px; border-radius: 999px; background: #090909; color: #ffffff; font-size: 0.8rem; font-weight: 800; letter-spacing: 0.03em; }
        .hero-title { display: flex; flex-wrap: wrap; gap: 0.16em; margin: 12px 0 0; font-size: clamp(5rem,7vw,6.4rem); max-width: 11ch; }
        .hero-word { opacity: 0; transform: translateY(20px); animation: hero-word-in 0.5s cubic-bezier(0.16,1,0.3,1) forwards; }
        .chip { display: inline-block; padding: 0.02em 0.18em; border-radius: 0.26em; background: #2f5bff; color: #ffffff; box-shadow: 4px 4px 0 #090909; }
        .lead, .section-note, .source-copy, .step-card p, .testimonial-card p, .footer-copy { color: #585f6b; line-height: 1.7; font-size: 1.04rem; }
        .lead { max-width: 34rem; margin-top: 24px; }
        .hero-cta-note { margin: 12px 0 0; color: #767d88; font-size: 0.92rem; line-height: 1.5; }
        .cta-row, .tag-row, .section-cta { display: flex; gap: 14px; flex-wrap: wrap; margin-top: 28px; }
        .tag { min-height: 42px; padding: 0 16px; border-radius: 999px; border: 2px solid rgba(9,9,9,0.12); display: inline-flex; align-items: center; justify-content: center; font-size: 0.92rem; background: #ffffff; }
        .btn { min-height: 62px; padding: 0 28px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; border: 3px solid #090909; font-weight: 800; font-size: 1rem; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1); }
        .btn:hover { transform: translateY(-3px); }
        .btn-primary { background: #2f5bff; color: #ffffff; box-shadow: 8px 8px 0 #090909; }
        .btn-secondary, .source-btn { background: #ffffff; color: #090909; }
        .hero-visual { position: relative; border: 3px solid #090909; border-radius: 42px; background: linear-gradient(180deg,#f5f7ff 0%,#dbe4ff 100%); box-shadow: 10px 10px 0 #090909; padding: 24px; }
        .hero-badge, .section-kicker-light, .pricing-badge { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 0 16px; border-radius: 999px; font-weight: 800; }
        .hero-badge, .section-kicker-light { border: 2px solid #090909; }
        .hero-mock { margin-top: 20px; }
        .mock-topbar { display: inline-flex; min-height: 28px; padding: 0 14px; border-radius: 999px; background: #0d0d0d; color: #ffffff; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; align-items: center; justify-content: center; }
        .mock-sheet-card { margin-top: 16px; border: 2px solid #0d0d0d; border-radius: 16px; background: #ffffff; box-shadow: 8px 8px 0 #0d0d0d; padding: 20px; }
        .mock-section-kicker, .mock-card-label { margin: 0; color: #8a8f98; font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; }
        .mock-sheet-title { margin: 0 0 14px; color: #0d0d0d; font-size: 16px; font-weight: 700; line-height: 1.2; }
        .mock-row { display: grid; grid-template-columns: auto 1fr; gap: 10px; align-items: flex-start; color: #202631; font-size: 12px; line-height: 1.5; margin-bottom: 8px; }
        .mock-row-success { margin-bottom: 14px; padding: 8px; border-radius: 8px; background: #e8f5e9; color: #1b5e20; }
        .mock-dot { width: 7px; height: 7px; margin-top: 5px; border-radius: 50%; flex-shrink: 0; }
        .mock-dot-blue { background: #2f5bff; }
        .mock-dot-green { background: #43a047; }
        .mock-divider { border-top: 1px solid #f0f0f0; margin-bottom: 14px; }
        .mock-flashcard { width: 100%; padding: 14px; border-radius: 10px; background: #0d0d0d; }
        .mock-flashcard p { margin: 0; color: #ffffff; font-size: 13px; font-weight: 600; line-height: 1.45; margin-bottom: 4px; }
        .mock-flashcard span { display: block; margin-top: 8px; color: rgba(255,255,255,0.72); font-size: 11px; }
        .section { padding: 110px 0; }
        .grid { display: grid; gap: 18px; }
        .grid-3 { grid-template-columns: repeat(3,minmax(0,1fr)); }
        .section-head { max-width: 760px; margin-bottom: 36px; }
        .section-head h2 { margin: 14px 0 0; font-size: clamp(2.8rem,5vw,4.8rem); }
        .section-note { margin-top: 18px; }
        .section-note-light { color: rgba(255,255,255,0.86); }
        .section-band-blue { background: #2f5bff; color: #ffffff; }
        .source-card, .step-card, .testimonial-card, .pricing-card { border: 3px solid #090909; border-radius: 28px; background: #ffffff; padding: 22px; transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .source-card h3, .step-card h3 { margin: 12px 0 0; font-size: clamp(2.1rem,3.4vw,3.4rem); }
        .source-card { min-height: 360px; display: flex; flex-direction: column; justify-content: space-between; }
        .source-card-dark { background: #101010; color: #ffffff; }
        .source-card-blue { background: #2f5bff; color: #ffffff; }
        .source-card:hover, .pricing-card:hover, .testimonial-card:hover { transform: translateY(-6px) scale(1.01); }
        .source-symbol { font-size: 4.8rem; line-height: 1; }
        .step-card { min-height: 340px; display: flex; flex-direction: column; justify-content: space-between; color: #090909; }
        .step-card-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; margin-bottom: 28px; }
        .step-number { display: inline-grid; place-items: center; width: 44px; height: 44px; border-radius: 50%; background: #090909; color: #ffffff; font-weight: 800; flex: 0 0 auto; }
        .step-icon-svg { width: 80px; height: 80px; stroke: #090909; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; flex: 0 0 auto; }
        .pricing-head { text-align: center; margin-left: auto; margin-right: auto; }
        .pricing-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 20px; }
        .pricing-card { display: flex; flex-direction: column; gap: 14px; border-color: rgba(9,9,9,0.14); padding: 28px; }
        .pricing-badge { width: fit-content; background: #eef1f6; color: #090909; font-size: 0.76rem; letter-spacing: 0.08em; text-transform: uppercase; }
        .plan-dark { background: #090909; color: #ffffff; border-color: #090909; box-shadow: 10px 10px 0 #2f5bff; }
        .plan-dark .pricing-badge { background: rgba(255,255,255,0.14); color: #ffffff; }
        .pricing-title { margin: 0; font-size: 2.1rem; }
        .pricing-price { margin: 0; font-size: clamp(2.6rem,4vw,3.8rem); }
        .pricing-struck, .pricing-spacer { min-height: 22px; margin: -4px 0 0; color: #8a8f98; font-size: 0.92rem; text-decoration: line-through; }
        .plan-dark .pricing-struck { color: rgba(255,255,255,0.62); }
        .pricing-list { margin: 6px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; color: #313844; line-height: 1.6; }
        .plan-dark .pricing-list { color: rgba(255,255,255,0.88); }
        .plan-dark-cta { margin-top: auto; background: #ffffff; color: #090909; box-shadow: 8px 8px 0 rgba(255,255,255,0.16); }
        .pricing-footnote { margin: 24px 0 0; text-align: center; color: #666d78; font-size: 0.95rem; }
        .faq-list { border-top: 1px solid rgba(9,9,9,0.12); }
        .faq-item { border-bottom: 1px solid rgba(9,9,9,0.12); }
        .faq-trigger { width: 100%; padding: 22px 0; display: flex; align-items: center; justify-content: space-between; gap: 16px; border: 0; background: transparent; text-align: left; font-size: 1.02rem; font-weight: 700; color: #090909; }
        .faq-icon { flex: 0 0 auto; font-size: 1.6rem; line-height: 1; color: #2f5bff; }
        .faq-panel { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.28s ease, padding-bottom 0.28s ease; padding-bottom: 0; }
        .faq-panel[data-open="true"] { grid-template-rows: 1fr; padding-bottom: 20px; }
        .faq-panel p { margin: 0; overflow: hidden; color: #616875; line-height: 1.7; }
        .social-proof { background: #090909; color: #ffffff; }
        .stars { color: #2f5bff; margin-bottom: 14px; }
        .testimonial-meta { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
        .testimonial-avatar { width: 48px; height: 48px; border-radius: 50%; display: grid; place-items: center; font-weight: 800; color: #ffffff; }
        .avatar-blue { background: #2f5bff; }
        .avatar-green { background: #27a26a; }
        .avatar-violet { background: #7f56d9; }
        .testimonial-author { display: block; margin-top: 10px; color: #6a7280; font-size: 0.96rem; line-height: 1.5; }
        .footer { background: #090909; color: #ffffff; }
        .footer-inner { padding: 100px 0 60px; display: grid; grid-template-columns: minmax(0,1fr) auto; gap: 24px; align-items: end; }
        .footer-brand { font-size: clamp(2.2rem,4vw,3.6rem); }
        .footer-links { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
        .footer-links a { min-height: 48px; padding: 0 18px; border-radius: 999px; background: rgba(255,255,255,0.08); display: inline-flex; align-items: center; justify-content: center; font-weight: 700; }
        .mobile-sticky-cta { display: none; }
        @keyframes hero-word-in { to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 1180px) { .hero, .grid-3, .footer-inner, .pricing-grid { grid-template-columns: 1fr; } .hero { gap: 42px; } .footer-links { justify-content: flex-start; } }
        @media (max-width: 767px) { .container { width: min(100% - 28px, 1200px); } .topbar { padding: 12px 0; } .topbar-inner { flex-direction: column; align-items: flex-start; } .nav { width: 100%; overflow-x: auto; } .hero { grid-template-columns: 1fr; padding: 72px 0 60px; } .hero-title { font-size: min(48px, 14vw); max-width: 9ch; } .hero-visual { display: none; } .section { padding: 60px 0; } .grid-3, .footer-inner, .pricing-grid { grid-template-columns: 1fr; } .step-card, .source-card, .testimonial-card, .pricing-card { min-height: auto; } .footer-inner { padding: 60px 0; } .mobile-sticky-cta { position: fixed; bottom: 0; left: 0; right: 0; height: 56px; background: #090909; color: #ffffff; z-index: 200; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; box-shadow: 0 -8px 30px rgba(9,9,9,0.18); } .footer { padding-bottom: 56px; } }
      `}</style>
    </div>
  );
}
