import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { BillingActions } from "@/components/billing-actions";

export default async function PricingPage() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /pricing, continuing as guest.", error);
  }
  const hasPremium = session?.user?.plan === "PREMIUM";

  return (
    <main className="page-shell">
      <AppTopbar />

      <div className="content-shell">
        <section className="section-block">
          <div className="section-title">
            <p className="eyebrow">Tarifs</p>
            <h1>Un plan gratuit pour essayer, Premium pour aller plus loin</h1>
            <p>
              Commence gratuitement puis passe en Premium quand tu veux lever les limites de
              generation et utiliser le produit au quotidien.
            </p>
          </div>

          <div className="pricing-grid">
            <article className="pricing-panel">
              <span className="pill">Gratuit</span>
              <h2>Pour tester le produit</h2>
              <p>Ideal pour verifier la promesse et produire les premieres fiches.</p>
              <div className="pricing-amount">0 EUR</div>
              <ul className="list">
                <li>5 fiches par mois</li>
                <li>Import texte, PDF, image</li>
                <li>Bibliotheque personnelle</li>
              </ul>
            </article>

            <article className="pricing-panel pricing-panel-featured">
              <span className="pill">Premium</span>
              <h2>Pour une utilisation serieuse</h2>
              <p>Le mode complet pour reviser sans limite et structurer toute sa bibliotheque.</p>
              <div className="pricing-amount">9,99 EUR</div>
              <ul className="list">
                <li>Fiches illimitees</li>
                <li>Acces complet a la generation</li>
                <li>Gestion d&apos;abonnement Stripe</li>
              </ul>
            </article>
          </div>

          <div className="workspace-panel">
            <h2 style={{ marginTop: 0 }}>Activation</h2>
            <p className="workspace-copy">
              {session?.user
                ? "Ton compte est pret. Tu peux lancer un abonnement ou gerer ton plan actuel."
                : "Connecte-toi d'abord pour activer un abonnement Premium."}
            </p>
            {session?.user ? (
              <BillingActions hasPremium={hasPremium} />
            ) : (
              <div className="status-box">Connecte-toi pour demarrer un abonnement Premium.</div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
