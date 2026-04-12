"use client";

import { signOut } from "next-auth/react";

export function SettingsSignOutButton() {
  return (
    <button
      type="button"
      onClick={() => void signOut({ callbackUrl: "/sign-in" })}
      style={{
        color: "#ef4444",
        background: "transparent",
        border: "1px solid #2A2A38",
        borderRadius: "8px",
        padding: "10px 20px",
        fontSize: "14px",
        cursor: "pointer",
        transition: "border-color 0.2s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.borderColor = "#ef4444";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.borderColor = "#2A2A38";
      }}
    >
      Se deconnecter
    </button>
  );
}
