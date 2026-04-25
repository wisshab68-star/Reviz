"use client";

import { useState } from "react";

export function SettingsManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/portal", { method: "POST" });
      const data = (await response.json()) as { success: boolean; url?: string; error?: string };

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error ?? "Impossible d'ouvrir le portail.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setLoading(false);
    }
  }

  return (
    <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
      <button
        type="button"
        onClick={() => void openPortal()}
        disabled={loading}
        style={{
          background: "transparent",
          border: "1px solid #2A2A38",
          borderRadius: "8px",
          padding: "10px 20px",
          color: "#8B8B9E",
          fontSize: "14px",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "border-color 0.2s, color 0.2s",
          alignSelf: "flex-start",
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.currentTarget.style.borderColor = "#FFFFFF";
            e.currentTarget.style.color = "#FFFFFF";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "#2A2A38";
          e.currentTarget.style.color = "#8B8B9E";
        }}
      >
        {loading ? "Ouverture..." : "Gérer mon abonnement →"}
      </button>
      {error ? (
        <p style={{ margin: 0, color: "#ef4444", fontSize: "13px" }}>{error}</p>
      ) : null}
    </div>
  );
}
