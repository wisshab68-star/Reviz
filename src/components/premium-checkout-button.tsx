"use client";

import { useState, type CSSProperties } from "react";

type PremiumCheckoutButtonProps = {
  children: React.ReactNode;
  loadingLabel?: string;
  style?: CSSProperties;
};

export function PremiumCheckoutButton({
  children,
  loadingLabel = "Redirection...",
  style,
}: PremiumCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de lancer Stripe.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe checkout failed.", error);
      setLoading(false);
      window.alert("Impossible de lancer le paiement pour le moment.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCheckout()}
      disabled={loading}
      style={style}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
