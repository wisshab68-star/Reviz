"use client";

export function GoogleSignInButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      style={{
        width: "100%",
        background: "#FFFFFF",
        border: "none",
        borderRadius: "14px",
        padding: "16px",
        color: "#111",
        fontSize: "15px",
        fontWeight: 700,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        cursor: "pointer",
        boxShadow: "0 2px 16px rgba(0,0,0,0.3)",
      }}
    >
      {children}
    </button>
  );
}
