import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AppTopbar } from "@/components/app-topbar";
import { DemoSeenTracker } from "@/components/demo-seen-tracker";
import { DemoSheetExperience } from "@/components/demo-sheet-experience";
import { getCurrentUserAccess } from "@/lib/user-access";

export const metadata: Metadata = {
  title: "Demo Reviz",
  description: "Decouvre une fiche Reviz exemple sans generation IA.",
};

export default async function DemoPage() {
  const access = await getCurrentUserAccess();

  if (!access) {
    redirect("/sign-in");
  }

  return (
    <main className="app-layout" style={{ background: "#0F0F13", minHeight: "100vh" }}>
      <AppTopbar />
      <DemoSeenTracker />

      <div className="content-shell sheet-content-shell" style={{ width: "100%", background: "#0F0F13" }}>
        <section className="section-block" style={{ width: "min(1080px, 100%)", background: "#0F0F13" }}>
          <div className="section-title" style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <p className="eyebrow">Demo Reviz</p>
            <h1 style={{ color: "#FFFFFF" }}>Une fiche exemple, avant de passer Premium</h1>
            <p style={{ marginLeft: "auto", marginRight: "auto", color: "#8B8B9E" }}>
              Cette page simule une generation en quelques secondes, puis affiche une fiche Reviz complete.
            </p>
          </div>

          <DemoSheetExperience />
        </section>
      </div>
    </main>
  );
}
