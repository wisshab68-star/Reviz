"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function GoPageInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const destination = `https://revizai.app${ref ? `?ref=${ref}` : ""}`;

  const [isTikTok, setIsTikTok] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const tiktok = /musical_ly|TikTok|BytedanceWebview/i.test(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua);
    setIsTikTok(tiktok);
    setIsIOS(ios);

    if (!tiktok) {
      window.location.replace(destination);
    }
  }, [destination]);

  const openInBrowser = () => {
    if (isIOS) {
      // iOS : ouvre dans Safari via le schéma x-safari
      window.location.href = destination.replace("https://", "x-safari-https://");
    } else {
      // Android : ouvre dans Chrome via intent://
      const encoded = encodeURIComponent(destination);
      window.location.href = `intent://${destination.replace("https://", "")}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encoded};end`;
    }
  };

  if (!isTikTok) {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0F13", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Redirection en cours...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F13",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "2rem",
      fontFamily: "sans-serif",
    }}>
      <div style={{
        width: "100%",
        maxWidth: 360,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>

        <div>
          <h1 style={{ color: "#fff", fontSize: 22, fontWeight: 900, margin: "0 0 8px" }}>
            Ouvre dans ton navigateur
          </h1>
          <p style={{ color: "#5C5C78", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            TikTok bloque la connexion Google.<br />
            Appuie sur le bouton pour continuer dans {isIOS ? "Safari" : "Chrome"}.
          </p>
        </div>

        <button
          onClick={openInBrowser}
          style={{
            width: "100%",
            padding: "16px",
            background: "linear-gradient(135deg, #2F5BFF, #7B9FFF)",
            border: "none",
            borderRadius: 16,
            color: "#fff",
            fontSize: 17,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "-0.02em",
          }}
        >
          Ouvrir dans {isIOS ? "Safari" : "Chrome"} →
        </button>

        <p style={{ color: "#5C5C78", fontSize: 12, margin: 0 }}>
          Tu seras redirigé vers revizai.app
        </p>
      </div>
    </div>
  );
}

export default function GoPage() {
  return (
    <Suspense>
      <GoPageInner />
    </Suspense>
  );
}
