"use client";

import { useRouter } from "next/navigation";

export function DemoAccessButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/demo")}
      style={{
        background: "#3B5BDB",
        borderRadius: "50px",
        padding: "16px 48px",
        color: "#FFFFFF",
        border: "none",
        cursor: "pointer",
        fontWeight: 700,
        fontSize: "15px",
      }}
    >
      Voir ma fiche exemple →
    </button>
  );
}
