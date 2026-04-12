"use client";

import { PremiumCheckoutButton } from "@/components/premium-checkout-button";

type SettingsPremiumButtonProps = {
  children: React.ReactNode;
};

export function SettingsPremiumButton({ children }: SettingsPremiumButtonProps) {
  return (
    <PremiumCheckoutButton
      loadingLabel="Redirection..."
      style={{
        background: "#3B5BDB",
        color: "#FFFFFF",
        borderRadius: "50px",
        padding: "14px 32px",
        fontFamily: "var(--display-font)",
        fontWeight: 700,
        border: "none",
        boxShadow: "0 0 32px rgba(59,91,219,0.4)",
        cursor: "pointer",
      }}
    >
      {children}
    </PremiumCheckoutButton>
  );
}
