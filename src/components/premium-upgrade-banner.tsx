"use client";

import { useEffect, useState } from "react";

type PremiumUpgradeBannerProps = {
  active: boolean;
};

export function PremiumUpgradeBanner({ active }: PremiumUpgradeBannerProps) {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    if (!active) {
      return;
    }

    setVisible(true);

    const url = new URL(window.location.href);
    url.searchParams.delete("upgraded");
    window.history.replaceState({}, "", url.toString());
  }, [active]);

  if (!visible) {
    return null;
  }

  return (
    <div
      className="status-box success"
      style={{
        width: "100%",
        marginBottom: 0,
        background: "transparent",
        border: "none",
        boxShadow: "none",
        borderRadius: 0,
        padding: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "#FFFFFF", fontFamily: "var(--display-font)" }}>Bienvenue dans Reviz Premium !</span>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => setVisible(false)}
          style={{
            minHeight: "42px",
            background: "#0F0F13",
            color: "#FFFFFF",
            border: "1px solid #2A2A38",
            boxShadow: "none",
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
