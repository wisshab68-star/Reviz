import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { BillingActions } from "@/components/billing-actions";
import { FREE_MONTHLY_SHEET_LIMIT, getPlanLabel, hasUnlimitedSheets } from "@/lib/plans";
import { getMonthlySheetUsage } from "@/services/usage-service";

export default async function SettingsPage() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /settings, redirecting to sign-in.", error);
  }

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const usage = await getMonthlySheetUsage(session.user.id);
  const usedSheets = usage._sum.quantity ?? 0;
  const unlimited = hasUnlimitedSheets(session.user.plan);
  const remainingSheets = unlimited ? null : Math.max(FREE_MONTHLY_SHEET_LIMIT - usedSheets, 0);

  return (
    <main className="page-shell">
      <AppTopbar />

      <div className="content-shell">
        <section className="section-block">
          <div className="section-title">
            <p className="eyebrow">Compte</p>
            <h1>Profil et abonnement</h1>
            <p>Gere ton plan, suis ton quota mensuel et pilote ton acces Premium depuis ici.</p>
          </div>

          <div className="metrics-grid">
            <article className="metric-card">
              <h3>Plan actuel</h3>
              <p>{getPlanLabel(session.user.plan)}</p>
            </article>
            <article className="metric-card">
              <h3>Fiches ce mois</h3>
              <p>{usedSheets}</p>
            </article>
            <article className="metric-card">
              <h3>Quota restant</h3>
              <p>{unlimited ? "Illimite" : `${remainingSheets} / ${FREE_MONTHLY_SHEET_LIMIT}`}</p>
            </article>
          </div>

          <div className="workspace-panel">
            <h2 style={{ marginTop: 0 }}>Facturation</h2>
            <p className="workspace-copy">
              Passe en Premium pour lever les limites de generation et gerer ensuite ton abonnement
              depuis le portail Stripe.
            </p>
            <BillingActions hasPremium={session.user.plan === "PREMIUM"} />
          </div>
        </section>
      </div>
    </main>
  );
}
