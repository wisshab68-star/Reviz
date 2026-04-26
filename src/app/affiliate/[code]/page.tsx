import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { CopyButton } from "./copy-button";

export const metadata: Metadata = { title: "Dashboard Affiliée — Reviz", robots: "noindex" };

export default async function AffiliateDashboard({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const affiliate = await db.affiliate.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!affiliate) notFound();

  const affiliateLink = `https://revizai.app?ref=${affiliate.code}`;

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F13", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ width: "100%", maxWidth: 520, display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: "var(--display-font)", fontSize: 28, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", marginBottom: 6 }}>
            Reviz.
          </div>
          <p style={{ color: "#5C5C78", fontSize: 14, margin: 0 }}>Dashboard Affiliée</p>
        </div>

        {/* Welcome */}
        <div style={{ background: "rgba(47,91,255,0.1)", border: "1px solid rgba(47,91,255,0.3)", borderRadius: 20, padding: "1.5rem", textAlign: "center" }}>
          <p style={{ margin: "0 0 4px", color: "#7B9FFF", fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>Bienvenue</p>
          <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: "#fff", fontFamily: "var(--display-font)" }}>{affiliate.name} 👋</h1>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#fff", fontFamily: "var(--display-font)", lineHeight: 1 }}>
              {affiliate.totalSales}
            </div>
            <div style={{ color: "#5C5C78", fontSize: 13, marginTop: 6 }}>Ventes générées</div>
          </div>
          <div style={{ background: "rgba(47,91,255,0.08)", border: "1px solid rgba(47,91,255,0.2)", borderRadius: 16, padding: "1.25rem", textAlign: "center" }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: "#7B9FFF", fontFamily: "var(--display-font)", lineHeight: 1 }}>
              {affiliate.totalEarnings.toFixed(2)} €
            </div>
            <div style={{ color: "#5C5C78", fontSize: 13, marginTop: 6 }}>Gains totaux</div>
          </div>
        </div>

        {/* Affiliate link */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "1.25rem" }}>
          <p style={{ margin: "0 0 10px", color: "#5C5C78", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Ton lien affilié</p>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.3)", borderRadius: 10, padding: "0.75rem 1rem" }}>
            <span style={{ flex: 1, color: "#C4C4D4", fontSize: 13, wordBreak: "break-all" }}>{affiliateLink}</span>
            <CopyButton text={affiliateLink} />
          </div>
          <p style={{ margin: "10px 0 0", color: "#5C5C78", fontSize: 12 }}>
            Code promo : <span style={{ color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>{affiliate.code}</span>
          </p>
        </div>

        {/* Commission info */}
        <div style={{ background: "rgba(5,150,105,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 16, padding: "1.25rem", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>💸</div>
          <div>
            <p style={{ margin: "0 0 2px", color: "#34D399", fontSize: 14, fontWeight: 700 }}>1,50 € par vente</p>
            <p style={{ margin: 0, color: "#5C5C78", fontSize: 13 }}>Prochain paiement le 1er du mois</p>
          </div>
        </div>

      </div>
    </div>
  );
}
