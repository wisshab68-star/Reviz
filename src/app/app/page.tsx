import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { HomeGenerator } from "@/components/home-generator";
import { PremiumUpgradeBanner } from "@/components/premium-upgrade-banner";
import { getCurrentUserAccess } from "@/lib/user-access";

export const metadata: Metadata = {
  title: "Generer une fiche - Reviz",
  description: "Transforme ton cours en fiche de revision intelligente en 30 secondes.",
};

type AppPageProps = {
  searchParams?: Promise<{
    upgraded?: string;
  }>;
};

export default async function AppPage({ searchParams }: AppPageProps) {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await searchParams;
  const upgraded = resolvedSearchParams?.upgraded === "true";

  return (
    <main
      className="app-layout"
      style={{
        background: "#0F0F13",
        minHeight: "100vh",
        width: "100%",
        color: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="content-shell content-shell-home content-shell-home-marketing"
        style={{
          width: "100%",
          maxWidth: 1080,
          margin: "0 auto",
          padding: "32px 40px",
          background: "#0F0F13",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
        }}
      >
        <PremiumUpgradeBanner active={upgraded} />

        <section className="landing-stage landing-stage-marketing" style={{ width: "100%", background: "#0F0F13" }}>
          <HomeGenerator
            isAuthenticated
            plan={access.plan}
            subscriptionStatus={access.subscriptionStatus}
            sheetCount={access.sheetCount}
            minimal
            welcomeName={access.welcomeName}
          />
        </section>
      </div>
    </main>
  );
}
