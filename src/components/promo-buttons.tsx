"use client";

import { useState } from "react";

import { getGa4ClientId } from "@/lib/analytics";

export function PromoButtons() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(tier: "EXAM_PROMO_20" | "EXAM_PROMO_40") {
    setLoading(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, gaClientId: getGa4ClientId() }),
      });
      const data = (await res.json()) as { success: boolean; url?: string; error?: string };
      if (!data.success || !data.url) throw new Error(data.error ?? "Erreur Stripe.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inattendue.");
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: "1rem" }}>
      <button
        type="button"
        className="btn btn-accent"
        disabled={loading !== null}
        onClick={() => void buy("EXAM_PROMO_20")}
        style={{ background: "#ef4444", borderColor: "#ef4444" }}
      >
        {loading === "EXAM_PROMO_20" ? "Redirection..." : "Acheter 20 fiches — 2€"}
      </button>
      <button
        type="button"
        className="btn btn-accent"
        disabled={loading !== null}
        onClick={() => void buy("EXAM_PROMO_40")}
        style={{ background: "#ef4444", borderColor: "#ef4444" }}
      >
        {loading === "EXAM_PROMO_40" ? "Redirection..." : "Acheter 40 fiches — 4€"}
      </button>
      {error && <p style={{ color: "#ef4444", fontSize: "0.9rem", margin: 0 }}>{error}</p>}
    </div>
  );
}
