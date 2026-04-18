"use client";

import { useState } from "react";

import { getGa4ClientId } from "@/lib/analytics";

type BillingActionsProps = {
  currentTier: string;
  hasPremium: boolean;
};

export function BillingActions({ currentTier, hasPremium }: BillingActionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(tier: string) {
    setLoading(tier);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, gaClientId: getGa4ClientId() }),
      });
      const data = (await response.json()) as { success: boolean; url?: string; error?: string };

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir Stripe.");
      }

      window.location.href = data.url;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur inattendue est survenue.");
      setLoading(null);
    }
  }

  async function openPortal() {
    setLoading("portal");
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json()) as { success: boolean; url?: string; error?: string };

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir le portail.");
      }

      window.location.href = data.url;
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Une erreur inattendue est survenue.");
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
      {hasPremium ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void openPortal()}
          disabled={loading !== null}
        >
          {loading === "portal" ? "Ouverture..." : "Gérer mon abonnement"}
        </button>
      ) : (
        <div className="cta-row">
          <button
            type="button"
            className="btn btn-accent"
            onClick={() => void checkout("STANDARD")}
            disabled={loading !== null || currentTier === "STANDARD"}
          >
            {loading === "STANDARD" ? "Redirection..." : currentTier === "STANDARD" ? "Plan actuel" : "Passer en Standard — 4,99€/mois"}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void checkout("PRO")}
            disabled={loading !== null || currentTier === "PRO"}
          >
            {loading === "PRO" ? "Redirection..." : currentTier === "PRO" ? "Plan actuel" : "Passer en Pro — 7,99€/mois"}
          </button>
        </div>
      )}

      {error ? (
        <div className="status-box error" style={{ width: "100%" }}>
          {error}
        </div>
      ) : null}
    </div>
  );
}
