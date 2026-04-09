import Link from "next/link";

const sourceCards = [
  {
    kicker: "Je pars d’un cours",
    title: "PDF",
    copy: "Un poly, un chapitre, un support de cours. Reviz te fait gagner du temps.",
    symbol: "↓",
    tone: "light",
  },
  {
    kicker: "Je pars d’une page",
    title: "PHOTO",
    copy: "Tu photographies ton cahier ou ton tableau. L’app remet tout au propre.",
    symbol: "◉",
    tone: "dark",
  },
  {
    kicker: "Je pars de l’essentiel",
    title: "TEXTE",
    copy: "Tu colles ton contenu et Reviz construit directement la fiche de revision.",
    symbol: "✦",
    tone: "blue",
  },
] as const;

const steps = [
  {
    number: "01",
    title: "importe",
    copy: "PDF, photo, image ou texte. Tu commences avec ce que tu as deja.",
  },
  {
    number: "02",
    title: "transforme",
    copy: "Reviz genere une fiche claire avec schema, notions, flashcards et quiz.",
  },
  {
    number: "03",
    title: "retiens",
    copy: "Tu ouvres la fiche, tu revises mieux, tu passes a la suite sans te perdre.",
  },
] as const;

const outputs = [
  {
    number: "01",
    title: "fiche",
    copy: "Les notions importantes, les definitions, les exemples et les points a retenir sans surcharge.",
    preview: (
      <div className="preview-sheet">
        <h4>Fiche structurée</h4>
        <ul>
          <li>Titre du chapitre + idée centrale</li>
          <li>3 points à retenir pour réviser vite</li>
          <li>Définition, piège et schéma mémoire</li>
        </ul>
      </div>
    ),
  },
  {
    number: "02",
    title: "cartes",
    copy: "Des flashcards simples pour te tester vite et repasser sur les notions centrales.",
    preview: (
      <div className="preview-flashcards">
        <article className="flashcard flashcard-back">
          <strong>Verso</strong>
          <p>Elle peut produire plusieurs issues possibles.</p>
        </article>
        <article className="flashcard flashcard-middle">
          <strong>Recto</strong>
          <p>Que signifie une expérience aléatoire ?</p>
        </article>
        <article className="flashcard flashcard-front">
          <strong>Recto</strong>
          <p>0 ≤ P(E) ≤ 1</p>
        </article>
      </div>
    ),
  },
  {
    number: "03",
    title: "quiz",
    copy: "Une revision active pour verifier si tu as vraiment compris au lieu de relire en boucle.",
    preview: (
      <div className="preview-quiz">
        <h4>Quiz express</h4>
        <div className="quiz-option">A. P(A ∪ B) = P(A) + P(B)</div>
        <div className="quiz-option correct">B. P(A ∪ B) = P(A) + P(B) - P(A ∩ B)</div>
        <div className="quiz-option">C. P(A ∪ B) = 1 - P(A)</div>
        <div className="quiz-option">D. P(A ∩ B) = P(A) + P(B)</div>
      </div>
    ),
  },
] as const;

const testimonials = [
  "J'ai eu 16 en SVT après avoir révisé avec Reviz. — Léa, Terminale S",
  "En 10 minutes j'avais une fiche complète sur la Révolution française. — Adam, 3ème",
  "Parfait pour mes partiels, je gagne un temps fou. — Inès, L1 Droit",
] as const;

export function MarketingSite() {
  return (
    <div className="landing">
      <header className="topbar">
        <Link href="/" className="brand">REVIZ</Link>
        <nav className="nav">
          <a href="#hero" className="pill pill-active">Accueil</a>
          <a href="#modes" className="pill">A propos</a>
          <a href="#exemples" className="pill">Exemples</a>
          <Link href="/sign-in" className="pill">Connexion</Link>
        </nav>
      </header>

      <main className="page">
        <section id="hero" className="panel hero">
          <div className="hero-copy">
            <p className="eyebrow">RÉVISION SIMPLE. VITE. BIEN.</p>
            <h1 className="brand-mark">REVIZ</h1>
            <h2 className="hero-title">
              transforme tes <span className="chip">cours</span> en fiches.
            </h2>
            <p className="lead">
              PDF, photo, image ou texte. Reviz AI genere une fiche claire, un schema,
              des flashcards et un quiz sans te noyer sous le blabla.
            </p>
            <div className="cta-row">
              <Link href="/app" className="btn btn-primary">Commencer</Link>
              <a href="#steps" className="btn btn-secondary">Voir comment</a>
            </div>
            <div className="tag-row">
              <span className="tag">PDF</span>
              <span className="tag">Photo</span>
              <span className="tag">Texte</span>
              <span className="tag">Fiche IA</span>
              <span className="tag">Flashcards</span>
              <span className="tag">Quiz</span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-badge">REVISION FUN</div>
            <div className="hero-mock">
              <div className="mock-header">
                <div className="dots">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mock-title">Une experience ultra visuelle, du cours brut a la revision active.</div>
              </div>
              <div className="mock-grid">
                <div className="mock-sheet">
                  <div className="mini-card mini-card-blue">
                    <p className="mini-kicker">Fiches intelligentes</p>
                    <h3>Probabilités</h3>
                    <ul>
                      <li>Définition précise</li>
                      <li>Schéma mémoire</li>
                      <li>Pièges d'examen</li>
                    </ul>
                  </div>
                  <div className="mini-card">
                    <p className="mini-kicker">Photo de cours</p>
                    <p>Transforme une page manuscrite en fiche prete a reviser.</p>
                  </div>
                </div>
                <div className="mock-side">
                  <div className="mini-card stack-card">
                    <div className="stack-card-inner offset-a">
                      <strong>Recto</strong>
                      <p>Quelle formule utiliser ?</p>
                    </div>
                    <div className="stack-card-inner offset-b">
                      <strong>Verso</strong>
                      <p>P(A ∪ B) = P(A) + P(B) - P(A ∩ B)</p>
                    </div>
                  </div>
                  <div className="mini-card">
                    <p className="mini-kicker">Sortie Reviz</p>
                    <ul>
                      <li>Definition precise</li>
                      <li>Schema memoire</li>
                      <li>Flashcards</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="modes" className="panel section">
          <div className="section-head">
            <span className="section-kicker">Choisis ton entree</span>
            <h2>importe. capture. revise.</h2>
          </div>
          <div className="grid grid-3">
            {sourceCards.map((card) => (
              <article key={card.title} className={`source-card source-card-${card.tone}`}>
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
        </section>

        <section id="steps" className="panel section section-blue">
          <div className="section-head">
            <span className="section-kicker section-kicker-light">Comment ca marche</span>
            <h2>3 etapes. pas plus.</h2>
            <p className="section-note section-note-light">
              Reviz est volontairement simple : tu donnes ton cours, l’IA structure,
              puis tu revises.
            </p>
          </div>
          <div className="grid grid-3">
            {steps.map((step) => (
              <article key={step.number} className="step-card">
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </article>
            ))}
          </div>
          <div className="section-cta">
            <Link href="/app" className="btn btn-secondary">Générer ma première fiche →</Link>
          </div>
        </section>

        <section id="exemples" className="panel section">
          <div className="section-head">
            <span className="section-kicker">Ce que tu obtiens</span>
            <h2>une sortie utile. pas un pavé.</h2>
          </div>
          <div className="grid grid-3">
            {outputs.map((output) => (
              <article key={output.title} className="output-card">
                <span className="output-pill">{output.number}</span>
                <div className="output-preview">{output.preview}</div>
                <h3>{output.title}</h3>
                <p>{output.copy}</p>
              </article>
            ))}
          </div>
          <div className="section-cta">
            <Link href="/app" className="btn btn-primary">Générer ma première fiche →</Link>
          </div>
        </section>

        <section className="panel section social-proof">
          <div className="section-head">
            <span className="section-kicker section-kicker-light">Ils révisent déjà avec Reviz</span>
            <h2>déjà utilisé par +2 000 élèves</h2>
          </div>
          <div className="grid grid-3">
            {testimonials.map((quote) => (
              <article key={quote} className="testimonial-card">
                <div className="stars">★★★★★</div>
                <p>{quote}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="footer">
        <div>
          <div className="footer-brand">REVIZ</div>
          <p className="footer-copy">Transforme tes cours en fiches de revision.</p>
          <p className="footer-copy">© 2025 Reviz AI</p>
        </div>
        <div className="footer-links">
          <a href="/mentions-legales">Mentions légales</a>
          <a href="mailto:contact@reviz.ai">Contact</a>
          <a href="/cgu">CGU</a>
        </div>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: #ffffff;
          color: #090909;
          padding: 18px 22px 28px;
        }

        .topbar {
          position: sticky;
          top: 18px;
          z-index: 40;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .brand,
        .brand-mark,
        .hero-title,
        .section-head h2,
        .source-card h3,
        .step-card h3,
        .output-card h3,
        .footer-brand {
          font-family: "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif;
          letter-spacing: -0.06em;
          line-height: 0.88;
          font-weight: 800;
        }

        .brand {
          font-size: clamp(2.4rem, 4vw, 3.8rem);
        }

        .page {
          width: 100%;
          max-width: 1440px;
          margin: 0 auto;
          display: grid;
          gap: 24px;
        }

        .nav {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 24px 60px rgba(9, 9, 9, 0.08);
          border: 1px solid rgba(9, 9, 9, 0.08);
        }

        .pill {
          min-height: 50px;
          padding: 0 22px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #f2f3f7;
          font-weight: 700;
          font-size: 0.96rem;
        }

        .pill-active {
          background: #141414;
          color: #ffffff;
        }

        .panel {
          width: 100%;
          border: 3px solid #090909;
          border-radius: 40px;
          background: #ffffff;
          box-shadow: 10px 10px 0 #090909;
          padding: 28px;
        }

        .hero {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
          gap: 22px;
          min-height: 90vh;
          align-items: stretch;
        }

        .hero-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 12px 8px;
        }

        .eyebrow,
        .section-kicker,
        .mini-kicker,
        .stars {
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.82rem;
        }

        .brand-mark {
          margin: 0;
          font-size: clamp(6rem, 15vw, 12rem);
          line-height: 0.78;
          letter-spacing: -0.08em;
        }

        .hero-title {
          margin: 10px 0 0;
          max-width: 8.5ch;
          font-size: clamp(3.4rem, 7vw, 6.2rem);
        }

        .chip {
          display: inline-block;
          padding: 0.02em 0.18em;
          border-radius: 0.26em;
          background: #2f5bff;
          color: #ffffff;
          box-shadow: 4px 4px 0 #090909;
        }

        .lead,
        .section-note,
        .source-copy,
        .step-card p,
        .output-card p,
        .testimonial-card p,
        .footer-copy,
        .mini-card p,
        .mini-card li {
          color: #585f6b;
          line-height: 1.7;
        }

        .cta-row,
        .tag-row,
        .section-cta {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 22px;
        }

        .tag {
          min-height: 42px;
          padding: 0 16px;
          border-radius: 999px;
          border: 2px solid rgba(9, 9, 9, 0.12);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.92rem;
        }

        .btn {
          min-height: 62px;
          padding: 0 28px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #090909;
          font-weight: 800;
          font-size: 1rem;
        }

        .btn-primary {
          background: #2f5bff;
          color: #ffffff;
          box-shadow: 8px 8px 0 #090909;
        }

        .btn-secondary,
        .source-btn {
          background: #ffffff;
          color: #090909;
        }

        .hero-visual {
          position: relative;
          min-height: 720px;
          border: 3px solid #090909;
          border-radius: 42px;
          background: linear-gradient(180deg, #f5f7ff 0%, #dbe4ff 100%);
          box-shadow: 10px 10px 0 #090909;
          overflow: hidden;
          padding: 24px;
        }

        .hero-badge,
        .output-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 40px;
          padding: 0 16px;
          border-radius: 999px;
          border: 2px solid #090909;
          font-weight: 800;
        }

        .hero-mock {
          position: absolute;
          inset: 86px 24px 24px;
          border: 3px solid #090909;
          border-radius: 32px;
          background: #ffffff;
          box-shadow: 10px 10px 0 #090909;
          overflow: hidden;
        }

        .mock-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 3px solid #090909;
          background: #f4f6ff;
        }

        .dots {
          display: flex;
          gap: 8px;
        }

        .dots span {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid #090909;
          background: #ffffff;
        }

        .mock-title {
          font-weight: 800;
          font-size: 0.96rem;
        }

        .mock-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) 220px;
          gap: 16px;
          padding: 18px;
        }

        .mock-sheet,
        .mock-side {
          display: grid;
          gap: 14px;
        }

        .mini-card,
        .source-card,
        .step-card,
        .output-card,
        .testimonial-card {
          border: 3px solid #090909;
          border-radius: 28px;
          background: #ffffff;
          padding: 22px;
        }

        .mini-card-blue {
          background: #eaf0ff;
        }

        .mini-card h3,
        .source-card h3,
        .step-card h3,
        .output-card h3 {
          margin: 12px 0 0;
          font-size: clamp(2.1rem, 3.4vw, 3.4rem);
        }

        .mini-card ul,
        .preview-sheet ul {
          margin: 12px 0 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 8px;
        }

        .mini-card li,
        .preview-sheet li {
          border-left: 3px solid #090909;
          padding-left: 10px;
        }

        .stack-card {
          position: relative;
          min-height: 220px;
        }

        .stack-card-inner,
        .flashcard {
          position: absolute;
          border: 3px solid #090909;
          border-radius: 24px;
          background: #ffffff;
          padding: 16px;
          box-shadow: 7px 7px 0 #090909;
        }

        .stack-card-inner {
          inset: 18px;
        }

        .offset-a {
          transform: rotate(-5deg) translate(-6px, 18px);
          background: #fff7db;
        }

        .offset-b {
          transform: rotate(4deg) translate(8px, -4px);
          background: #eaf0ff;
        }

        .grid {
          display: grid;
          gap: 18px;
        }

        .grid-3 {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .section-head h2 {
          margin: 14px 0 0;
          font-size: clamp(2.8rem, 5vw, 4.8rem);
        }

        .section-blue {
          background: #2f5bff;
          color: #ffffff;
        }

        .section-kicker-light {
          background: #ffffff;
          color: #090909;
        }

        .section-note-light {
          color: rgba(255, 255, 255, 0.86);
        }

        .source-card {
          min-height: 360px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .source-card-dark {
          background: #101010;
          color: #ffffff;
        }

        .source-card-blue {
          background: #2f5bff;
          color: #ffffff;
        }

        .source-symbol {
          font-size: 4.8rem;
          line-height: 1;
        }

        .step-number {
          display: inline-grid;
          place-items: center;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #090909;
          color: #ffffff;
          font-weight: 800;
        }

        .output-card {
          padding: 22px;
        }

        .output-preview {
          margin-top: 18px;
          min-height: 236px;
          border: 3px solid #090909;
          border-radius: 28px;
          background: #ffffff;
          padding: 16px;
          display: grid;
          gap: 12px;
        }

        .preview-sheet h4,
        .preview-quiz h4 {
          margin: 0;
          font-family: "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif;
          font-size: 1.28rem;
          letter-spacing: -0.05em;
        }

        .preview-flashcards {
          position: relative;
          min-height: 184px;
        }

        .flashcard {
          inset: 0;
        }

        .flashcard-back {
          transform: rotate(-5deg) translate(-6px, 14px);
          background: #fff7db;
        }

        .flashcard-middle {
          transform: rotate(4deg) translate(8px, 4px);
          background: #eaf0ff;
        }

        .flashcard-front {
          transform: rotate(-1deg);
          background: #ffffff;
        }

        .flashcard strong {
          display: block;
          margin-bottom: 10px;
          font-size: 0.86rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .flashcard p {
          margin: 0;
          font-family: "Baloo 2", "Arial Rounded MT Bold", "Trebuchet MS", sans-serif;
          font-size: 1.18rem;
          line-height: 0.96;
          letter-spacing: -0.05em;
        }

        .preview-quiz {
          display: grid;
          gap: 10px;
        }

        .quiz-option {
          border: 2px solid #090909;
          border-radius: 16px;
          padding: 10px 12px;
          font-size: 0.88rem;
          line-height: 1.45;
        }

        .correct {
          background: #2f5bff;
          color: #ffffff;
        }

        .social-proof {
          background: #090909;
          color: #ffffff;
        }

        .testimonial-card {
          min-height: 210px;
          background: #ffffff;
          color: #090909;
        }

        .stars {
          color: #2f5bff;
          margin-bottom: 14px;
        }

        .footer {
          max-width: 1440px;
          margin: 24px auto 0;
          background: #090909;
          color: #ffffff;
          border: 3px solid #090909;
          border-radius: 38px;
          box-shadow: 10px 10px 0 #090909;
          padding: 28px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 24px;
          align-items: end;
        }

        .footer-brand {
          font-size: clamp(2.2rem, 4vw, 3.6rem);
        }

        .footer-links {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .footer-links a {
          min-height: 48px;
          padding: 0 18px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        @media (max-width: 1180px) {
          .hero,
          .grid-3,
          .mock-grid,
          .footer {
            grid-template-columns: 1fr;
          }

          .hero-visual {
            min-height: 640px;
          }

          .footer-links {
            justify-content: flex-start;
          }
        }

        @media (max-width: 767px) {
          .landing {
            padding: 14px 14px 22px;
          }

          .topbar {
            position: static;
            flex-direction: column;
            align-items: flex-start;
          }

          .nav {
            width: 100%;
            overflow-x: auto;
          }

          .panel,
          .footer,
          .hero-visual,
          .source-card,
          .step-card,
          .output-card,
          .testimonial-card {
            border-radius: 28px;
          }

          .hero {
            min-height: auto;
            grid-template-columns: 1fr;
          }

          .hero-copy {
            min-height: 78vh;
            align-items: center;
            text-align: center;
          }

          .lead {
            max-width: 32rem;
          }

          .cta-row,
          .tag-row,
          .section-cta {
            justify-content: center;
          }

          .hero-visual {
            display: none;
          }

          .grid-3 {
            grid-template-columns: 1fr;
          }

          .footer {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
