"use client";

import { useState } from "react";

import { getGa4ClientId } from "@/lib/analytics";

type Plan = {
  id: "STANDARD" | "PRO";
  label: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  featured: boolean;
  badge: string | null;
};

type PricingCardsProps = {
  plans: Plan[];
  currentTier: string;
  hasPremium: boolean;
  isLoggedIn: boolean;
};

export function PricingCards({ plans, currentTier, hasPremium, isLoggedIn }: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout(tier: "STANDARD" | "PRO") {
    if (!isLoggedIn) {
      window.location.href = `/sign-in?mode=signup&redirectTo=/pricing`;
      return;
    }

    if (hasPremium) {
      // Open portal to manage
      setLoadingTier("portal");
      try {
        const res = await fetch("/api/billing/portal", { method: "POST" });
        const data = await res.json() as { success?: boolean; url?: string; error?: string };
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          setError(data.error ?? "Impossible d'ouvrir le portail.");
          setLoadingTier(null);
        }
      } catch {
        setError("Erreur réseau.");
        setLoadingTier(null);
      }
      return;
    }

    setLoadingTier(tier);
    setError(null);
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
        setError(data.error ?? "Erreur lors de la redirection vers le paiement.");
        setLoadingTier(null);
      }
    } catch {
      setError("Erreur réseau. Réessaie.");
      setLoadingTier(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {plans.map((plan) => {
        const isCurrentPlan = currentTier === plan.id;
        const isLoading = loadingTier === plan.id;

        return (
          <div
            key={plan.id}
            style={{
              position: "relative",
              background: plan.featured
                ? "linear-gradient(135deg, rgba(47,91,255,0.14) 0%, rgba(108,63,255,0.09) 100%)"
                : "rgba(255,255,255,0.03)",
              border: plan.featured
                ? "1.5px solid rgba(47,91,255,0.55)"
                : "1px solid rgba(255,255,255,0.07)",
              borderRadius: 24,
              padding: "1.75rem",
              display: "grid",
              gridTemplateColumns: "1fr auto",
              gap: "1.5rem",
              alignItems: "start",
            }}
          >
            {/* Badge */}
            {plan.badge && (
              <div
                style={{
                  position: "absolute",
                  top: -14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "linear-gradient(90deg, #2F5BFF, #6C3FFF)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  padding: "5px 16px",
                  borderRadius: 999,
                  whiteSpace: "nowrap",
                  boxShadow: "0 2px 16px rgba(47,91,255,0.4)",
                }}
              >
                {plan.badge}
              </div>
            )}

            {/* Left: info + features */}
            <div>
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#5C5C78", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                  {plan.label}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--display-font)",
                      fontSize: 40,
                      fontWeight: 900,
                      color: "#FFFFFF",
                      letterSpacing: "-0.04em",
                      lineHeight: 1,
                    }}
                  >
                    {plan.price} €
                  </span>
                  <span style={{ color: "#5C5C78", fontSize: 13 }}>{plan.period}</span>
                </div>
                <p style={{ margin: 0, color: "#8B8B9E", fontSize: 13, lineHeight: 1.5 }}>
                  {plan.tagline}
                </p>
              </div>

              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
                {plan.features.map((feature) => (
                  <li key={feature} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#C4C4D4", fontSize: 13, lineHeight: 1.4 }}>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        background: plan.featured ? "rgba(47,91,255,0.22)" : "rgba(255,255,255,0.06)",
                        marginTop: 1,
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke={plan.featured ? "#7B9FFF" : "#6B6B8A"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right: CTA */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 12, minWidth: 160 }}>
              {isCurrentPlan && hasPremium ? (
                <>
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      background: "rgba(5,150,105,0.15)",
                      border: "1px solid rgba(16,185,129,0.3)",
                      borderRadius: 999,
                      padding: "6px 14px",
                      color: "#34D399",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Plan actuel
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleCheckout(plan.id)}
                    disabled={loadingTier !== null}
                    style={{
                      padding: "0.7rem 1.15rem",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.06)",
                      color: "#FFFFFF",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {loadingTier === "portal" ? "Ouverture…" : "Gérer"}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleCheckout(plan.id)}
                  disabled={loadingTier !== null}
                  style={{
                    padding: "0.85rem 1.5rem",
                    borderRadius: 16,
                    border: "none",
                    cursor: loadingTier ? "not-allowed" : "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                    whiteSpace: "nowrap",
                    opacity: loadingTier && loadingTier !== plan.id ? 0.5 : 1,
                    transition: "opacity 0.15s, transform 0.1s",
                    background: plan.featured
                      ? "linear-gradient(135deg, #2F5BFF 0%, #6C3FFF 100%)"
                      : "rgba(255,255,255,0.08)",
                    color: "#FFFFFF",
                    boxShadow: plan.featured ? "0 4px 24px rgba(47,91,255,0.4)" : "none",
                  }}
                >
                  {isLoading ? "Redirection…" : plan.cta}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {error && (
        <div
          style={{
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 12,
            padding: "0.75rem 1rem",
            color: "#FCA5A5",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}
