import type { Metadata } from "next";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { HomeGenerator } from "@/components/home-generator";
import { PremiumUpgradeBanner } from "@/components/premium-upgrade-banner";

export const metadata: Metadata = {
  title: "G\u00e9n\u00e9rer une fiche \u2014 Reviz",
  description: "Transforme ton cours en fiche de r\u00e9vision intelligente en 30 secondes.",
};

type AppPageProps = {
  searchParams?: Promise<{
    upgraded?: string;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /app, continuing as guest.", error);
  }

  const resolvedSearchParams = await searchParams;
  const upgraded = resolvedSearchParams?.upgraded === "true";

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell content-shell-home content-shell-home-marketing">
        <PremiumUpgradeBanner active={upgraded} />
        <section className="landing-stage landing-stage-marketing">
          <HomeGenerator
            isAuthenticated={Boolean(session?.user?.id)}
            plan={session?.user?.plan ?? "FREE"}
            minimal
          />
        </section>
      </div>
    </main>
  );
}
