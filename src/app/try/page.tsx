import Link from "next/link"
import type { Metadata } from "next"

import { auth } from "@/auth"
import { TryGenerator } from "@/components/try/TryGenerator"

export const metadata: Metadata = {
  title: "Genere ta fiche gratuite - Reviz",
  description:
    "Importe ton PDF, prends une photo ou colle ton texte. Reviz genere ta fiche en 30 secondes. Gratuit, sans inscription.",
}

export default async function TryPage() {
  let isLoggedIn = false
  try {
    const session = await auth()
    isLoggedIn = Boolean(session?.user?.id)
  } catch {
    isLoggedIn = false
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0F0F13",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glows — same as app */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: -180,
          left: "50%",
          transform: "translateX(-50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(47,91,255,0.13) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: 80,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(108,63,255,0.09) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Topbar — identical to app topbar feel */}
      <header
        style={{
          position: "relative",
          zIndex: 10,
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Link
          href="/"
          style={{
            fontFamily: "var(--display-font)",
            fontSize: 22,
            fontWeight: 900,
            letterSpacing: "-0.03em",
            color: "#fff",
            textDecoration: "none",
            lineHeight: 1,
          }}
        >
          REVIZ<span style={{ color: "#3B5BDB" }}>.</span>
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {!isLoggedIn && (
            <Link
              href="/sign-in?redirectTo=/app"
              style={{
                fontSize: 13,
                color: "#8B8B9E",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Se connecter
            </Link>
          )}
          {isLoggedIn && (
            <Link
              href="/app"
              style={{
                fontSize: 13,
                color: "#8B8B9E",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Mon espace →
            </Link>
          )}
        </div>
      </header>

      {/* Main */}
      <main
        style={{
          flex: 1,
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "3rem 1rem 6rem",
        }}
      >
        {/* Hero */}
        <div
          style={{
            width: "100%",
            maxWidth: 640,
            textAlign: "center",
            marginBottom: "2.5rem",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 999,
              padding: "5px 14px",
              marginBottom: "1.25rem",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#2F5BFF",
                display: "inline-block",
                boxShadow: "0 0 6px #2F5BFF",
              }}
            />
            <span style={{ fontSize: 12, color: "#8B8B9E", fontWeight: 600, letterSpacing: "0.04em" }}>
              Gratuit · Sans inscription · 30 secondes
            </span>
          </div>

          <h1
            style={{
              margin: "0 0 1rem",
              fontFamily: "var(--display-font)",
              fontSize: "clamp(2rem, 6vw, 3.2rem)",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.04em",
              lineHeight: 1.05,
            }}
          >
            Transforme ton cours<br />
            <span style={{ color: "#2F5BFF" }}>en fiche en 30 sec</span>
          </h1>

          <p style={{ color: "#8B8B9E", fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            PDF, photo ou texte — Reviz génère ta fiche complète avec carte mentale,<br />
            méthode Feynman et flashcards.
          </p>
        </div>

        {/* Generator */}
        <div style={{ width: "100%", maxWidth: 640 }}>
          <TryGenerator initialIsLoggedIn={isLoggedIn} />
        </div>

        {/* Mini stats */}
        <div
          style={{
            marginTop: "3rem",
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {[
            { value: "30 s", label: "pour générer" },
            { value: "5", label: "formats acceptés" },
            { value: "100%", label: "IA pédagogique" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: 22,
                  fontWeight: 900,
                  color: "#FFFFFF",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </div>
              <div style={{ color: "#5C5C78", fontSize: 12, marginTop: 3 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
