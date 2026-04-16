import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { BillingActions } from "@/components/billing-actions";
import { MobileNav } from "@/components/mobile-nav";
import { PromoButtons } from "@/components/promo-buttons";
import { PRICING_TIERS, isExamPromoActive } from "@/lib/stripe/pricing-config";
import { getOrCreateSubscription } from "@/lib/stripe/subscription-service";

export default async function PricingPage() {
  let session = null;
  let currentTier = "FREE";
  let sheetsUsed = 0;
  let monthlyLimit = 2;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
    console.error("Auth lookup failed on /pricing, continuing as guest.", error);
  }

  if (session?.user?.id) {
    try {
      const sub = await getOrCreateSubscription(session.user.id);
      currentTier = sub.tier;
      sheetsUsed = sub.sheetsUsedMonth;
      monthlyLimit = sub.monthlyLimit;
    } catch {
      // continue with defaults
    }
  }

  const hasPremium = currentTier === "STANDARD" || currentTier === "PRO";
  const promoActive = isExamPromoActive();

  const tierConfig = PRICING_TIERS[currentTier as keyof typeof PRICING_TIERS];

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13", overflowX: "hidden" }}>
      <AppTopbar />
      <main className="app-main-content" style={{ flex: 1, minWidth: 0, width: "100%", background: "#0F0F13", overflowX: "hidden" }}>
      <div className="content-shell">
        <section className="section-block">
          <div className="section-title">
            <p className="eyebrow">Tarifs</p>
            <h1>Choisis ton plan</h1>
            <p>Commence gratuitement, upgrade quand tu veux lever les limites.</p>
          </div>

          {/* Usage indicator for logged-in users */}
          {session?.user && (
            <div className="status-box" style={{ marginBottom: "1.5rem" }}>
              Plan actuel : <strong>{tierConfig?.name ?? currentTier}</strong>
              {" · "}
              {sheetsUsed} / {monthlyLimit} fiches utilisées ce mois
            </div>
          )}

          <div className="pricing-grid">
            {/* FREE */}
            <article className="pricing-panel">
              <span className="pill">Gratuit</span>
              <h2>Pour découvrir</h2>
              <p>Parfait pour tester la promesse avant de s&apos;engager.</p>
              <div className="pricing-amount">0 €</div>
              <ul className="list">
                {PRICING_TIERS.FREE.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {currentTier === "FREE" && (
                <p style={{ fontWeight: 600, color: "#059669", marginTop: "1rem" }}>✓ Plan actuel</p>
              )}
            </article>

            {/* STANDARD */}
            <article className="pricing-panel">
              <span className="pill">Standard</span>
              <h2>Pour progresser</h2>
              <p>Le plan idéal pour réviser régulièrement tout au long de l&apos;année.</p>
              <div className="pricing-amount">
                4,99 €{" "}
                <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>/mois</span>
              </div>
              <ul className="list">
                {PRICING_TIERS.STANDARD.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {currentTier === "STANDARD" && (
                <p style={{ fontWeight: 600, color: "#059669", marginTop: "1rem" }}>✓ Plan actuel</p>
              )}
            </article>

            {/* PRO */}
            <article className="pricing-panel pricing-panel-featured">
              <span className="pill">Pro</span>
              <h2>Pour les sérieux</h2>
              <p>La puissance complète de Reviz pour dominer chaque matière.</p>
              <div className="pricing-amount">
                7,99 €{" "}
                <span style={{ fontSize: "0.9rem", fontWeight: 400 }}>/mois</span>
              </div>
              <ul className="list">
                {PRICING_TIERS.PRO.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {currentTier === "PRO" && (
                <p style={{ fontWeight: 600, color: "#059669", marginTop: "1rem" }}>✓ Plan actuel</p>
              )}
            </article>
          </div>

          {/* Promo exam — only for active subscribers during exam period */}
          {promoActive && hasPremium && (
            <div
              className="workspace-panel"
              style={{ borderLeft: "4px solid #ef4444", marginTop: "2rem" }}
            >
              <p className="eyebrow" style={{ color: "#ef4444" }}>🔥 Offre limitée — Examens</p>
              <h2 style={{ marginTop: 0 }}>Recharge de fiches</h2>
              <p>
                Disponible uniquement pendant la période d&apos;examens pour les abonnés actifs.
                Les fiches s&apos;ajoutent immédiatement à ton quota du mois.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1rem" }}>
                <div className="pricing-panel" style={{ flex: 1, minWidth: "180px" }}>
                  <div className="pricing-amount" style={{ color: "#ef4444" }}>2 €</div>
                  <p style={{ margin: "0.25rem 0" }}>+ 20 fiches ce mois</p>
                </div>
                <div className="pricing-panel" style={{ flex: 1, minWidth: "180px" }}>
                  <div className="pricing-amount" style={{ color: "#ef4444" }}>4 €</div>
                  <p style={{ margin: "0.25rem 0" }}>+ 40 fiches ce mois</p>
                </div>
              </div>
              {session?.user && <PromoButtons />}
            </div>
          )}

          {/* Subscription actions */}
          <div className="workspace-panel">
            <h2 style={{ marginTop: 0 }}>Activation</h2>
            <p className="workspace-copy">
              {session?.user
                ? "Ton compte est prêt. Lance ou gère ton abonnement ci-dessous."
                : "Connecte-toi pour activer un abonnement."}
            </p>
            {session?.user ? (
              <BillingActions hasPremium={hasPremium} currentTier={currentTier} />
            ) : (
              <div className="status-box">
                <a href="/sign-in" style={{ color: "#2F5BFF" }}>Connecte-toi</a>{" "}
                pour démarrer un abonnement.
              </div>
            )}
          </div>
        </section>
      </div>
      </main>
      <MobileNav />
    </div>
  );
}
