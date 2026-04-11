import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { authenticateWithPasswordAction, signInWithGoogleAction } from "./actions";

export const metadata: Metadata = {
  title: "Connexion Reviz",
  description: "Connecte-toi a Reviz avec Google ou ton email et mot de passe.",
};

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
    mode?: string;
  }>;
};

function RevizProfessorMascot({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 420" aria-hidden="true" className={className}>
      <defs>
        <radialGradient id="revizGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="70%" stopColor="#dfe7ff" stopOpacity="0.48" />
          <stop offset="100%" stopColor="#dfe7ff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="coatFill" x1="90" y1="176" x2="278" y2="304" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#203bdb" />
          <stop offset="100%" stopColor="#7d5cff" />
        </linearGradient>
        <linearGradient id="screenFill" x1="260" y1="56" x2="378" y2="148" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#eef4ff" />
        </linearGradient>
      </defs>

      <ellipse cx="208" cy="210" rx="150" ry="150" fill="url(#revizGlow)" />
      <ellipse cx="212" cy="356" rx="92" ry="18" fill="#d8def3" fillOpacity="0.7" />

      <g opacity="0.4" stroke="#9ea6d8" strokeWidth="3" strokeLinecap="round">
        <path d="M68 136h28" />
        <path d="M82 122v28" />
        <path d="M328 96h18" />
        <path d="M337 87v18" />
        <path d="M82 238 108 220" />
        <path d="M300 246c10-8 20-14 30-18" />
        <path d="M112 94c30-8 56-8 82 0" />
        <path d="M82 170c22-8 40-10 62-6" />
        <path d="M284 178c20-6 38-6 58 0" />
      </g>

      <g transform="translate(282 88)">
        <rect x="0" y="0" width="108" height="78" rx="16" fill="url(#screenFill)" stroke="#ffffff" strokeWidth="3" />
        <rect x="10" y="10" width="88" height="10" rx="5" fill="#dde4ff" />
        <rect x="10" y="10" width="42" height="10" rx="5" fill="#44d4eb" />
        <text x="14" y="34" fontSize="10" fontWeight="700" fill="#9aa3b9">NOTIONS CLES</text>
        <text x="14" y="50" fontSize="14" fontWeight="800" fill="#111827">Probabilites</text>
        <g transform="translate(14 58)">
          <circle cx="8" cy="8" r="8" fill="#ebf5ff" />
          <text x="8" y="12" textAnchor="middle" fontSize="10" fontWeight="800" fill="#1f6eff">6</text>
          <circle cx="40" cy="8" r="8" fill="#fff1f1" />
          <text x="40" y="12" textAnchor="middle" fontSize="10" fontWeight="800" fill="#d7375b">4</text>
          <circle cx="72" cy="8" r="8" fill="#effcec" />
          <text x="72" y="12" textAnchor="middle" fontSize="10" fontWeight="800" fill="#37a85d">3</text>
        </g>
      </g>

      <g transform="translate(106 54)">
        <path d="M42 164c16-8 42-12 62 0l18 62H26Z" fill="url(#coatFill)" stroke="#233056" strokeWidth="6" />
        <path d="M72 166v62" stroke="#6de5ff" strokeWidth="6" strokeLinecap="round" />
        <path d="M34 208h24" stroke="#6de5ff" strokeWidth="6" strokeLinecap="round" />
        <path d="M86 208h24" stroke="#6de5ff" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="72" cy="68" rx="58" ry="54" fill="#f8efe2" stroke="#5f506a" strokeWidth="5" />
        <path d="M42 18c10-10 24-16 40-16 26 0 48 16 56 40" stroke="#f4f8ff" strokeWidth="10" strokeLinecap="round" opacity="0.55" />
        <path d="M50 52c4-6 10-10 18-10 6 0 12 2 16 6" stroke="#ffffff" strokeWidth="7" strokeLinecap="round" opacity="0.62" />

        <g stroke="#26324f" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="54" cy="76" r="18" fill="none" />
          <circle cx="102" cy="76" r="18" fill="none" />
          <path d="M72 76h12" />
          <path d="M120 72 136 66" />
          <path d="M36 72 20 66" />
        </g>

        <circle cx="54" cy="76" r="7" fill="#6f5bff" />
        <circle cx="102" cy="76" r="7" fill="#6f5bff" />
        <circle cx="54" cy="76" r="3" fill="#ffffff" />
        <circle cx="102" cy="76" r="3" fill="#ffffff" />

        <path d="M76 92c2 8 0 16-8 22h16c-8-6-10-14-8-22Z" fill="#37263d" />
        <path d="M60 120c10 10 26 10 36 0" stroke="#37263d" strokeWidth="4" strokeLinecap="round" />
        <path d="M56 126h44" stroke="#37263d" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 134h6M72 134h6M82 134h6M92 134h6" stroke="#37263d" strokeWidth="2.5" strokeLinecap="round" />

        <path d="M66 152h12l4 16h-20Z" fill="#ffffff" />
        <path d="M18 186c20-18 32-24 44-20" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />
        <path d="M128 182c18-8 32-22 48-40" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />
        <path d="M176 142c8 8 8 18-2 24" stroke="#2b3557" strokeWidth="5" strokeLinecap="round" />
        <circle cx="182" cy="138" r="6" fill="#f7efe4" stroke="#2b3557" strokeWidth="4" />

        <path d="M24 190c-6 16-12 30-18 42" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />
        <path d="M116 190c10 16 20 30 32 42" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />
        <path d="M52 228c-4 20-8 38-12 54" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />
        <path d="M92 228c6 20 12 38 18 54" stroke="#2b3557" strokeWidth="6" strokeLinecap="round" />

        <path d="M12 236c18-10 28-8 40 6" stroke="#5e7cff" strokeWidth="5" strokeLinecap="round" />
        <path d="M136 240c10-10 22-12 38-8" stroke="#5e7cff" strokeWidth="5" strokeLinecap="round" />

        <g transform="translate(-8 178) rotate(-12)">
          <rect x="0" y="0" width="12" height="52" rx="6" fill="#ffffff" stroke="#2b3557" strokeWidth="4" />
          <path d="M6 52 1 64h10Z" fill="#d8e7ff" stroke="#2b3557" strokeWidth="4" />
          <rect x="2.5" y="8" width="7" height="26" rx="3.5" fill="#6de5ff" />
        </g>
      </g>
    </svg>
  );
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /sign-in, continuing.", error);
  }

  if (session?.user) {
    redirect("/app");
  }

  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams?.mode === "login" ? "login" : "signup";
  const errorMessage = resolvedSearchParams?.error;
  const isLogin = mode === "login";

  return (
    <main className="page-shell">
      <AppTopbar />

      <div className="content-shell">
        <section className="section-block">
          <div className="signin-shell signin-shell-clean">
            <div className="workspace-panel signin-panel signin-panel-clean">
              <div className="signin-brand-lockup">
                <div className="signin-brand-mark">R</div>
                <div className="signin-brand-copy">
                  <p className="signin-brand-name">REVIZ</p>
                  <p className="signin-brand-tag">la methode reviz</p>
                </div>
              </div>

              <div className="signin-card-head signin-card-head-clean">
                <span className="signin-kicker">Espace eleve</span>
                <h1>la methode reviz</h1>
                <p className="signin-card-copy signin-card-copy-clean">
                  Connecte-toi pour sauvegarder tes fiches, retrouver ta bibliotheque et relancer tes revisions en un clic.
                </p>
              </div>

              <div className="signin-mode-switch signin-mode-switch-clean" role="tablist" aria-label="Mode de connexion">
                <Link
                  href="/sign-in?mode=signup"
                  className={`signin-mode-pill ${!isLogin ? "signin-mode-pill-active" : ""}`}
                >
                  Creer un compte
                </Link>
                <Link
                  href="/sign-in?mode=login"
                  className={`signin-mode-pill ${isLogin ? "signin-mode-pill-active" : ""}`}
                >
                  Se connecter
                </Link>
              </div>

              {errorMessage ? (
                <div className="signin-alert" role="alert">
                  {errorMessage}
                </div>
              ) : null}

              <div className="form-grid signin-form-grid signin-form-grid-clean">
                <form action={signInWithGoogleAction}>
                  <button className="btn signin-google-button signin-google-button-clean" type="submit">
                    <span className="signin-google-mark" aria-hidden="true">G</span>
                    {isLogin ? "Continuer avec Google" : "S'inscrire avec Google"}
                  </button>
                </form>

                <div className="signin-divider">
                  <span>ou</span>
                </div>

                <form action={authenticateWithPasswordAction}>
                  <input type="hidden" name="mode" value={mode} />

                  {!isLogin ? (
                    <div className="field">
                      <label htmlFor="name">Ton prenom</label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Ex : Lea"
                        autoComplete="given-name"
                      />
                    </div>
                  ) : null}

                  <div className="field">
                    <label htmlFor="email">Ton email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="toi@reviz.app"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="password">Mot de passe</label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Au moins 8 caracteres"
                      autoComplete={isLogin ? "current-password" : "new-password"}
                      minLength={8}
                      required
                    />
                  </div>

                  <button className="btn btn-accent signin-email-button" type="submit">
                    {isLogin ? "Se connecter" : "Creer mon compte"}
                  </button>
                </form>

                <div className="signin-under-note">
                  <span>{isLogin ? "Pas encore de compte ?" : "Tu as deja un compte ?"}</span>
                  <Link href={isLogin ? "/sign-in?mode=signup" : "/sign-in?mode=login"}>
                    <strong>{isLogin ? "Creer un compte" : "Se connecter"}</strong>
                  </Link>
                </div>
              </div>
            </div>

            <div className="signin-visual-panel">
              <div className="signin-visual-surface signin-visual-surface-reviz">
                <div className="signin-floating-pill signin-floating-pill-green">ton prof revision</div>
                <div className="signin-floating-pill signin-floating-pill-pink">booste par l&apos;IA</div>
                <div className="signin-floating-pill signin-floating-pill-blue">tes fiches en 30 s</div>

                <div className="signin-formula signin-formula-one">f&apos;(x) = 2x</div>
                <div className="signin-formula signin-formula-two">P(A ∪ B)</div>
                <div className="signin-formula signin-formula-three">CO2 + lumiere</div>

                <div className="signin-mascot-stage signin-mascot-stage-reviz">
                  <RevizProfessorMascot className="reviz-prof-mascot reviz-prof-mascot-hero" />
                </div>

                <div className="signin-visual-copy signin-visual-copy-reviz">
                  <p>ton allie</p>
                  <h2>pour reussir</h2>
                  <span>Google ou email + mot de passe. Simple, propre, Reviz.</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
