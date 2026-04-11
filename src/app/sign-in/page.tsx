import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";

function SkeletonProfessorMascot() {
  return (
    <svg viewBox="0 0 260 260" aria-hidden="true" className="reviz-prof-mascot">
      <ellipse cx="130" cy="236" rx="76" ry="14" className="mascot-shadow" />
      <path d="M78 52h104l-12 18H90Z" className="mascot-hat-top" />
      <path d="M66 68h128l-64 22Z" className="mascot-hat-brim" />
      <path d="M182 70l24 18" className="mascot-line" />
      <circle cx="208" cy="92" r="8" className="mascot-accent" />
      <circle cx="130" cy="102" r="52" className="mascot-bone" />
      <circle cx="111" cy="95" r="14" className="mascot-eye-ring" />
      <circle cx="149" cy="95" r="14" className="mascot-eye-ring" />
      <circle cx="111" cy="95" r="6" className="mascot-eye" />
      <circle cx="149" cy="95" r="6" className="mascot-eye" />
      <path d="M124 110h12" className="mascot-line" />
      <path d="M110 124c12 12 28 12 40 0" className="mascot-line" />
      <path d="M106 138h48" className="mascot-teeth" />
      <path d="M110 148h40" className="mascot-teeth" />
      <path d="M112 162c0-10 8-18 18-18s18 8 18 18v18h-36Z" className="mascot-coat" />
      <path d="M130 144v36" className="mascot-line" />
      <path d="M130 180v24" className="mascot-line" />
      <path d="M112 204l-10 26" className="mascot-line" />
      <path d="M148 204l10 26" className="mascot-line" />
      <path d="M104 172 78 192" className="mascot-line" />
      <path d="M156 172 184 192" className="mascot-line" />
      <circle cx="76" cy="194" r="10" className="mascot-bone" />
      <circle cx="186" cy="194" r="10" className="mascot-bone" />
      <path d="M68 168c18-8 28 8 18 20-6 6-18 8-28 4Z" className="mascot-note" />
      <path d="M188 176l18-20 10 10-20 18Z" className="mascot-accent" />
      <path d="M204 160l8-8" className="mascot-line" />
      <circle cx="84" cy="74" r="9" className="mascot-accent-soft" />
      <circle cx="180" cy="126" r="11" className="mascot-accent-soft" />
      <circle cx="58" cy="116" r="7" className="mascot-accent" />
    </svg>
  );
}

export default async function SignInPage() {
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

  return (
    <main className="page-shell">
      <AppTopbar />

      <div className="content-shell">
        <section className="section-block">
          <div className="signin-shell signin-shell-reviz">
            <div className="signin-story">
              <div className="signin-story-badge">methode de revision</div>
              <h1>la methode reviz</h1>
              <p className="workspace-copy signin-story-copy">
                Entre dans ton espace Reviz pour sauvegarder tes fiches, retrouver ta bibliotheque
                et reviser avec une methode plus claire, plus visuelle et plus fun.
              </p>

              <div className="signin-mascot-card">
                <SkeletonProfessorMascot />
                <div className="signin-mascot-copy">
                  <p className="signin-mascot-label">Le prof squelette Reviz</p>
                  <p>
                    Il remet les notions en ordre, souligne les pieges classiques et t&apos;aide
                    a retenir l&apos;essentiel sans stress.
                  </p>
                </div>
              </div>

              <div className="signin-method-steps" aria-label="Promesse Reviz">
                <div className="signin-method-step">
                  <span>1</span>
                  <strong>importe ton cours</strong>
                  <p>PDF, photo ou texte, tu pars de ce que tu as deja.</p>
                </div>
                <div className="signin-method-step">
                  <span>2</span>
                  <strong>reviz organise</strong>
                  <p>La fiche prend forme avec schema, notions, flashcards et quiz.</p>
                </div>
                <div className="signin-method-step">
                  <span>3</span>
                  <strong>toi, tu retiens</strong>
                  <p>Tu sauvegardes, tu retrouves tout et tu revises plus vite.</p>
                </div>
              </div>
            </div>

            <div className="workspace-panel signin-panel signin-panel-reviz">
              <div className="signin-card-head">
                <p className="eyebrow">Compte Reviz</p>
                <h2>Creer un compte ou se connecter</h2>
                <p className="signin-card-copy">
                  Avec Google ou ton email. Si ton compte existe deja, Reviz te reconnecte
                  directement. Sinon, ton espace se cree en quelques secondes.
                </p>
              </div>

              <div className="signin-mode-switch" aria-hidden="true">
                <span className="signin-mode-pill signin-mode-pill-active">Creer un compte</span>
                <span className="signin-mode-pill">Se connecter</span>
              </div>

              <div className="form-grid signin-form-grid">
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/app" });
                  }}
                >
                  <button className="btn btn-primary signin-google-button" type="submit">
                    <span className="signin-google-mark" aria-hidden="true">G</span>
                    Continuer avec Google
                  </button>
                </form>

                <div className="signin-divider">
                  <span>ou</span>
                </div>

                <form
                  action={async (formData) => {
                    "use server";
                    const email = formData.get("email");

                    if (typeof email !== "string" || !email) {
                      return;
                    }

                    await signIn("email", {
                      email,
                      redirectTo: "/app",
                    });
                  }}
                >
                  <div className="field">
                    <label htmlFor="email">Ton email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="toi@reviz.app"
                      required
                    />
                  </div>

                  <button className="btn btn-accent signin-email-button" type="submit">
                    Continuer par email
                  </button>
                </form>

                <div className="signin-helper-box">
                  <p className="signin-helper-title">Comment ca marche ?</p>
                  <p>
                    Entre ton email et Reviz t&apos;envoie un lien de connexion securise pour
                    creer ton compte ou retrouver ton espace.
                  </p>
                </div>

                <div className="signin-trust-row">
                  <span>Sans carte bancaire</span>
                  <span>Connexion securisee</span>
                  <span>Bibliotheque perso</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
