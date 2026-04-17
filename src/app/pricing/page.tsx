import Link from "next/link";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { MobileNav } from "@/components/mobile-nav";
import { PRICING_TIERS } from "@/lib/stripe/pricing-config";
import { getOrCreateSubscription } from "@/lib/stripe/subscription-service";
import { PricingCards } from "@/components/pricing-cards";

export const metadata: Metadata = {
  title: "Reviz Premium — Génère des fiches sans limite",
  description: "Moins cher qu'un McDo. Génère jusqu'à 50 fiches par mois avec carte mentale, Feynman et flashcards.",
};

const PLANS = [
  {
    id: "STANDARD" as const,
    label: "Standard",
    price: "4,99",
    period: "/mois",
    tagline: "Pour réviser toute l'année",
    features: [
      "20 fiches complètes par mois",
      "Carte mentale générée par IA",
      "Méthode Feynman intégrée",
      "Flashcards intelligentes",
      "Export PDF",
      "Support email",
    ],
    cta: "Commencer Standard",
    featured: false,
    badge: null as string | null,
  },
  {
    id: "PRO" as const,
    label: "Pro",
    price: "7,99",
    period: "/mois",
    tagline: "Pour dominer chaque matière",
    features: [
      "50 fiches complètes par mois",
      "Carte mentale générée par IA",
      "Méthode Feynman intégrée",
      "Flashcards intelligentes",
      "Export PDF prioritaire",
      "Support prioritaire",
      "Accès aux nouvelles fonctions en avant-première",
    ],
    cta: "Commencer Pro",
    featured: true,
    badge: "Le plus populaire",
  },
];

export default async function PricingPage() {
  let currentTier = "FREE";
  let hasPremium = false;
  let isLoggedIn = false;

  try {
    const session = await auth();
    isLoggedIn = Boolean(session?.user?.id);
    if (session?.user?.id) {
      try {
        const sub = await getOrCreateSubscription(session.user.id);
        currentTier = sub.tier;
        hasPremium = currentTier === "STANDARD" || currentTier === "PRO";
      } catch {
        // continue with defaults
      }
    }
  } catch (error) {
    if (!isDatabaseConnectionError(error)) throw error;
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0F0F13" }}>
      <AppTopbar />
      <main className="app-main-content" style={{ flex: 1, minWidth: 0, background: "#0F0F13" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "3rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(47,91,255,0.12)",
                border: "1px solid rgba(47,91,255,0.3)",
                borderRadius: 999,
                padding: "6px 16px",
                marginBottom: "1.5rem",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#2F5BFF",
                  display: "inline-block",
                  boxShadow: "0 0 6px #2F5BFF",
                }}
              />
              <span style={{ fontSize: 13, color: "#7B9FFF", fontWeight: 600, letterSpacing: "0.04em" }}>
                Reviz Premium
              </span>
            </div>

            <h1
              style={{
                margin: "0 0 1rem",
                fontFamily: "var(--display-font)",
                fontSize: "clamp(32px, 6vw, 52px)",
                fontWeight: 900,
                color: "#FFFFFF",
                letterSpacing: "-0.04em",
                lineHeight: 1.05,
              }}
            >
              Révise plus vite,<br />
              <span style={{ color: "#2F5BFF" }}>sans limite</span>
            </h1>

            <p style={{ color: "#8B8B9E", fontSize: 16, margin: 0, lineHeight: 1.7, maxWidth: 480, marginInline: "auto" }}>
              Moins cher qu'un McDo 🍔 — génère autant de fiches que tu veux avec carte mentale, Feynman et flashcards.
            </p>
          </div>

          {/* Plan actuel badge */}
          {isLoggedIn && hasPremium && (
            <div
              style={{
                background: "rgba(5,150,105,0.12)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 14,
                padding: "0.85rem 1.25rem",
                marginBottom: "2rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "#34D399",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#34D399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tu es déjà abonné{" "}
              <span style={{ color: "#fff", fontWeight: 700 }}>
                {PRICING_TIERS[currentTier as keyof typeof PRICING_TIERS]?.name ?? currentTier}
              </span>
              {" "}— réussi avec la méthode Reviz !
            </div>
          )}

          {/* Cards */}
          <PricingCards plans={PLANS} currentTier={currentTier} hasPremium={hasPremium} isLoggedIn={isLoggedIn} />

          {/* Social proof */}
          <div
            style={{
              marginTop: "3rem",
              padding: "1.5rem",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 20,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "1.5rem",
              textAlign: "center",
            }}
          >
            {[
              { value: "30 sec", label: "pour générer une fiche" },
              { value: "100%", label: "IA pédagogique" },
              { value: "0 CB", label: "requis pour l'essai" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  style={{
                    fontFamily: "var(--display-font)",
                    fontSize: 26,
                    fontWeight: 900,
                    color: "#FFFFFF",
                    letterSpacing: "-0.03em",
                    lineHeight: 1,
                    marginBottom: 4,
                  }}
                >
                  {stat.value}
                </div>
                <div style={{ color: "#5C5C78", fontSize: 12 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Trust footer */}
          <div style={{ textAlign: "center", marginTop: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
              {["Paiement sécurisé Stripe", "Résiliation en 1 clic", "Données protégées"].map((item) => (
                <span key={item} style={{ color: "#3D3D52", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="#3D3D52" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {item}
                </span>
              ))}
            </div>
            {!isLoggedIn && (
              <p style={{ color: "#3D3D52", fontSize: 12, marginTop: "1rem" }}>
                Déjà abonné ?{" "}
                <Link href="/sign-in?redirectTo=/app" style={{ color: "#7B9FFF", textDecoration: "none" }}>
                  Se connecter
                </Link>
              </p>
            )}
          </div>
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
