"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { trackPaywallDisplayed, getGa4ClientId } from "@/lib/analytics";

type Plan = {
  id: "STANDARD" | "PRO";
  label: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  featured: boolean;
};

const PLANS: Plan[] = [
  {
    id: "STANDARD",
    label: "Standard",
    price: "4,99",
    period: "/mois",
    description: "Pour réviser régulièrement tout au long de l'année.",
    features: [
      "20 fiches complètes par mois",
      "Carte mentale + méthode Feynman",
      "Flashcards intelligentes",
      "Export PDF",
      "Support email",
    ],
    cta: "Commencer Standard",
    featured: false,
  },
  {
    id: "PRO",
    label: "Pro",
    badge: "Le plus populaire",
    price: "7,99",
    period: "/mois",
    description: "La puissance complète de Reviz pour dominer chaque matière.",
    features: [
      "50 fiches complètes par mois",
      "Carte mentale + méthode Feynman",
      "Flashcards intelligentes",
      "Export PDF prioritaire",
      "Support prioritaire",
      "Accès aux nouvelles fonctions en avant-première",
    ],
    cta: "Commencer Pro",
    featured: true,
  },
];

type TryPaywallProps = {
  isLoggedIn: boolean;
};

export function TryPaywall({ isLoggedIn }: TryPaywallProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    trackPaywallDisplayed();
  }, []);

  async function handleSubscribe(tier: "STANDARD" | "PRO") {
    if (!isLoggedIn) {
      window.location.href = `/sign-in?mode=signup&redirectTo=/pricing`;
      return;
    }

    setLoadingTier(tier);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, gaClientId: getGa4ClientId() }),
      });
      const data = await res.json() as { success?: boolean; url?: string; error?: string };
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erreur lors de la redirection vers le paiement.");
        setLoadingTier(null);
      }
    } catch {
      alert("Erreur réseau. Réessaie.");
      setLoadingTier(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(47,91,255,0.12)",
            border: "1px solid rgba(47,91,255,0.3)",
            borderRadius: 999,
            padding: "6px 14px",
            marginBottom: "1.25rem",
          }}
        >
          <span style={{ fontSize: 14, color: "#7B9FFF", fontWeight: 600, letterSpacing: "0.02em" }}>
            2/2 fiches gratuites utilisées
          </span>
        </div>
        <h2
          style={{
            margin: "0 0 0.5rem",
            fontFamily: "var(--display-font)",
            fontSize: "clamp(22px, 5vw, 30px)",
            fontWeight: 900,
            color: "#FFFFFF",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          Continue à réviser<br />sans limite
        </h2>
        <p style={{ color: "#8B8B9E", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
          Moins cher qu'un McDo 🍔 — continue à générer tes fiches sans limite.
        </p>
      </div>

      {/* Plans */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            style={{
              position: "relative",
              background: plan.featured
                ? "linear-gradient(135deg, rgba(47,91,255,0.15) 0%, rgba(100,60,255,0.1) 100%)"
                : "rgba(255,255,255,0.03)",
              border: plan.featured
                ? "1.5px solid rgba(47,91,255,0.6)"
                : "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "1.4rem 1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {/* Badge */}
            {plan.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -13,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(90deg, #2F5BFF, #6C3FFF)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  padding: "4px 14px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                }}
              >
                {plan.badge}
              </div>
            )}

            {/* Plan header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
              <div>
                <div style={{ color: "#8B8B9E", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                  {plan.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                  <span
                    style={{
                      fontFamily: "var(--display-font)",
                      fontSize: 32,
                      fontWeight: 900,
                      color: "#FFFFFF",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price} €
                  </span>
                  <span style={{ color: "#8B8B9E", fontSize: 13 }}>{plan.period}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {plan.features.map((feature) => (
                <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#D4D4E8", fontSize: 13 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: plan.featured ? "rgba(47,91,255,0.25)" : "rgba(255,255,255,0.07)",
                      marginTop: 1,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={plan.featured ? "#7B9FFF" : "#8B8B9E"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <button
              type="button"
              onClick={() => void handleSubscribe(plan.id)}
              disabled={loadingTier !== null}
              style={{
                width: "100%",
                padding: "0.85rem 1rem",
                borderRadius: 14,
                border: "none",
                cursor: loadingTier ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 15,
                transition: "opacity 0.15s",
                opacity: loadingTier && loadingTier !== plan.id ? 0.5 : 1,
                background: plan.featured
                  ? "linear-gradient(135deg, #2F5BFF 0%, #6C3FFF 100%)"
                  : "rgba(255,255,255,0.08)",
                color: "#FFFFFF",
                boxShadow: plan.featured ? "0 4px 24px rgba(47,91,255,0.35)" : "none",
              }}
            >
              {loadingTier === plan.id ? "Redirection…" : plan.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Footer trust */}
      <div style={{ textAlign: "center", marginTop: "1.5rem", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
          {["Paiement sécurisé Stripe", "Résiliation en 1 clic", "Aucune CB requise pour l'essai"].map((item) => (
            <span key={item} style={{ color: "#5C5C78", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="#5C5C78" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {item}
            </span>
          ))}
        </div>
        {!isLoggedIn && (
          <p style={{ color: "#5C5C78", fontSize: 12, margin: 0 }}>
            Déjà abonné ?{" "}
            <Link href="/sign-in?redirectTo=/app" style={{ color: "#7B9FFF", textDecoration: "none" }}>
              Se connecter
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
