"use client";

import { useState } from "react";

type BillingActionsProps = {
  hasPremium: boolean;
};

export function BillingActions({ hasPremium }: BillingActionsProps) {
  const [loading, setLoading] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function launch(route: "/api/billing/checkout" | "/api/billing/portal", mode: "checkout" | "portal") {
    setLoading(mode);
    setError(null);

    try {
      const response = await fetch(route, {
        method: "POST",
      });
      const data = (await response.json()) as { success: boolean; url?: string; error?: string };

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir Stripe.");
      }

      window.location.href = data.url;
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Une erreur inattendue est survenue.",
      );
      setLoading(null);
    }
  }

  return (
    <div className="cta-row" style={{ marginTop: "1rem" }}>
      {hasPremium ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void launch("/api/billing/portal", "portal")}
          disabled={loading !== null}
        >
          {loading === "portal" ? "Ouverture..." : "Gerer mon abonnement"}
        </button>
      ) : (
        <button
          type="button"
          className="btn btn-accent"
          onClick={() => void launch("/api/billing/checkout", "checkout")}
          disabled={loading !== null}
        >
          {loading === "checkout" ? "Redirection..." : "Passer en Premium"}
        </button>
      )}

      {error ? <div className="status-box error" style={{ width: "100%" }}>{error}</div> : null}
    </div>
  );
}
