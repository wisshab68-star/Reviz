import type { Metadata } from "next";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { HomeGenerator } from "@/components/home-generator";

export const metadata: Metadata = {
  title: "G\u00e9n\u00e9rer une fiche \u2014 Reviz",
  description: "Transforme ton cours en fiche de r\u00e9vision intelligente en 30 secondes.",
};

export default async function AppPage() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /app, continuing as guest.", error);
  }

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell content-shell-home content-shell-home-marketing">
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
