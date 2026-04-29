"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

type WebviewType = "tiktok" | "snapchat" | "instagram" | "facebook" | "other" | "none";

function detectWebview(ua: string): WebviewType {
  if (/musical_ly|TikTok|BytedanceWebview/i.test(ua)) return "tiktok";
  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/Instagram/i.test(ua)) return "instagram";
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return "facebook";
  // Generic webview detection on iOS (no Safari in UA)
  if (/iPhone|iPad|iPod/i.test(ua) && !/Safari/i.test(ua)) return "other";
  // Generic webview on Android
  if (/Android/i.test(ua) && /; wv\)/i.test(ua)) return "other";
  return "none";
}

function GoPageInner() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const destination = `https://revizai.app${ref ? `?ref=${ref}` : ""}`;

  const [webview, setWebview] = useState<WebviewType>("none");
  const [isIOS, setIsIOS] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const detected = detectWebview(ua);
    const ios = /iPhone|iPad|iPod/i.test(ua);
    setWebview(detected);
    setIsIOS(ios);

    if (detected === "none") {
      // Real browser → redirect immediately
      window.location.replace(destination);
    }
  }, [destination]);

  const tryOpenInBrowser = () => {
    if (isIOS) {
      // Try x-safari-https first (works in TikTok, fails silently in Snapchat)
      window.location.href = destination.replace("https://", "x-safari-https://");
    } else {
      // Android: intent:// scheme to force Chrome
      const encoded = encodeURIComponent(destination);
      window.location.href = `intent://${destination.replace("https://", "")}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encoded};end`;
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(destination);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = destination;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (webview === "none") {
    return (
      <div style={{ minHeight: "100vh", background: "#0F0F13", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#fff", fontFamily: "sans-serif" }}>Redirection en cours...</p>
      </div>
    );
  }

  // Specific instructions per app
  const appName = webview === "tiktok" ? "TikTok"
                : webview === "snapchat" ? "Snapchat"
                : webview === "instagram" ? "Instagram"
                : webview === "facebook" ? "Facebook"
                : "cette app";

  const browserName = isIOS ? "Safari" : "Chrome";

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F13",
      padding: "2rem 1.5rem",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        maxWidth: 420,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginTop: "1rem" }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🔓</div>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Ouvre dans {browserName}
          </h1>
          <p style={{ color: "#8B8B9E", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            {appName} bloque la connexion Google.
          </p>
        </div>

        {/* Method 1 — Try button */}
        <button
          onClick={tryOpenInBrowser}
          style={{
            width: "100%",
            padding: "16px",
            background: "linear-gradient(135deg, #2F5BFF, #7B9FFF)",
            border: "none",
            borderRadius: 16,
            color: "#fff",
            fontSize: 16,
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "-0.01em",
          }}
        >
          Essayer d'ouvrir dans {browserName} →
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#3A3A4A", fontSize: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#2A2A38" }} />
          <span>OU MANUELLEMENT</span>
          <div style={{ flex: 1, height: 1, background: "#2A2A38" }} />
        </div>

        {/* Method 2 — Manual instructions */}
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16,
          padding: "1.25rem",
        }}>
          <p style={{ margin: "0 0 12px", color: "#fff", fontWeight: 700, fontSize: 14 }}>
            Comment faire dans {appName} :
          </p>

          {webview === "snapchat" && (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#C4C4D4", fontSize: 14, lineHeight: 1.7 }}>
              <li>Appuie sur les <strong>•••</strong> en haut à droite</li>
              <li>Choisis <strong>« Ouvrir dans le navigateur »</strong></li>
            </ol>
          )}

          {webview === "tiktok" && (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#C4C4D4", fontSize: 14, lineHeight: 1.7 }}>
              <li>Appuie sur les <strong>•••</strong> en haut à droite</li>
              <li>Choisis <strong>« Ouvrir dans {browserName} »</strong></li>
            </ol>
          )}

          {webview === "instagram" && (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#C4C4D4", fontSize: 14, lineHeight: 1.7 }}>
              <li>Appuie sur les <strong>•••</strong> en haut à droite</li>
              <li>Choisis <strong>« Ouvrir avec {browserName} »</strong></li>
            </ol>
          )}

          {(webview === "facebook" || webview === "other") && (
            <ol style={{ margin: 0, paddingLeft: 20, color: "#C4C4D4", fontSize: 14, lineHeight: 1.7 }}>
              <li>Appuie sur le menu (••• ou ⋮)</li>
              <li>Choisis <strong>« Ouvrir dans {browserName} »</strong></li>
            </ol>
          )}
        </div>

        {/* Method 3 — Copy link fallback */}
        <button
          onClick={copyLink}
          style={{
            width: "100%",
            padding: "14px",
            background: "transparent",
            border: "1px solid #2A2A38",
            borderRadius: 12,
            color: copied ? "#34D399" : "#C4C4D4",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {copied ? "✓ Lien copié !" : "Copier le lien"}
        </button>

        {/* Footer */}
        <p style={{ textAlign: "center", color: "#5C5C78", fontSize: 12, margin: "0.5rem 0 0", lineHeight: 1.5 }}>
          revizai.app
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
