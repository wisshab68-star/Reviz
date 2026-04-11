"use client";

import { useState } from "react";

type UpgradeButtonProps = {
  children?: React.ReactNode;
  className?: string;
};

export function UpgradeButton({
  children = "Passer a Reviz Pro",
  className = "btn btn-primary",
}: UpgradeButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleUpgrade() {
    try {
      setLoading(true);

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
      });

      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        throw new Error(data.error ?? "Impossible de lancer le paiement.");
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Stripe checkout failed.", error);
      setLoading(false);
      window.alert("Impossible de lancer le paiement pour le moment.");
    }
  }

  return (
    <button type="button" className={className} onClick={handleUpgrade} disabled={loading}>
      {loading ? "Redirection..." : children}
    </button>
  );
}
