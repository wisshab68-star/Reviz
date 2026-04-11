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
    <div className="status-box success" style={{ width: "min(920px, 100%)", marginBottom: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
        <span>Bienvenue dans Reviz Premium !</span>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => setVisible(false)}
          style={{ minHeight: "42px" }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
