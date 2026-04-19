"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FicheRenderer } from "@/components/fiche/FicheRenderer";
import { TryPaywall } from "@/components/try/TryPaywall";
import { trackCreateOwnClicked, trackUploadPdfInitiated, trackUploadPdfCompleted, trackTestSheetViewed, trackGoogleSigninClicked, trackSheetUnlocked, trackPaywallShown } from "@/lib/analytics";
import type { FicheGeneree } from "@/types/fiche-generated";

type Step = "input" | "uploading" | "viewing";

type StoredTryState = {
  count: number;
  fiche: FicheGeneree | null;
};

type TryGeneratorProps = {
  initialIsLoggedIn?: boolean;
};

const STORAGE_KEY = "reviz.try.funnel.v1";
const MAX_FREE_TRIES = 2;

function readStoredState(): StoredTryState {
  if (typeof window === "undefined") {
    return { count: 0, fiche: null };
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return { count: 0, fiche: null };
    }

    const parsed = JSON.parse(rawValue) as Partial<StoredTryState>;
    return {
      count: typeof parsed.count === "number" ? parsed.count : 0,
      fiche: parsed.fiche ?? null,
    };
  } catch {
    return { count: 0, fiche: null };
  }
}

function writeStoredState(state: StoredTryState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getFriendlyError(status: number, error?: string) {
  if (status === 422 || error === "UNPROCESSABLE_FILE") {
    return "Ton fichier est difficile a lire automatiquement. Essaie un PDF de cours en texte, sans trop d'images.";
  }

  if (status === 429) {
    return "Tu as deja utilise tes 2 essais gratuits. Passe a l'abonnement pour generer plus de fiches.";
  }

  return error ?? "Une erreur est survenue lors de la generation. Reessaie.";
}

export function TryGenerator({ initialIsLoggedIn = false }: TryGeneratorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isTester = searchParams.get("tester") === "1";
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoggedIn] = useState(initialIsLoggedIn);
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [uploadProgress, setUploadProgress] = useState("");
  const [fiche, setFiche] = useState<FicheGeneree | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tryCount, setTryCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isTester) {
      writeStoredState({ count: 0, fiche: null });
    }
    const storedState = readStoredState();
    setTryCount(storedState.count);
    setFiche(storedState.fiche);

    if (initialIsLoggedIn && !storedState.fiche) {
      // Logged-in user with no pending fiche → go to app
      router.replace("/app");
      return;
    }

    setStep(storedState.fiche ? "viewing" : "input");
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    writeStoredState({ count: tryCount, fiche });
  }, [fiche, isHydrated, tryCount]);

  // hasReachedTryLimit is purely cosmetic (badge display) — real blocking is server-side IP rate limit
  const hasReachedTryLimit = tryCount >= MAX_FREE_TRIES;
  const currentAttemptLabel = `${Math.min(tryCount, MAX_FREE_TRIES)}/${MAX_FREE_TRIES} fiche${MAX_FREE_TRIES > 1 ? "s" : ""} testee${MAX_FREE_TRIES > 1 ? "s" : ""}`;

  function resetForAnotherTry() {
    setError(null);
    setText("");
    setFiche(null);
    setStep("input");
  }

  async function handleFile(file: File) {
    trackUploadPdfInitiated();
    setError(null);
    setStep("uploading");

    const messages = [
      "On analyse ton cours...",
      "Extraction du texte...",
      "Generation de ta fiche...",
    ];

    let i = 0;
    setUploadProgress(messages[0] ?? "On analyse ton cours...");
    const interval = setInterval(() => {
      i = Math.min(i + 1, messages.length - 1);
      setUploadProgress(messages[i] ?? messages[messages.length - 1] ?? "Generation...");
    }, 2500);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/uploads", { method: "POST", body: formData });
      const uploadData = (await uploadRes.json()) as {
        success?: boolean;
        data?: { extractedText?: string };
        error?: string;
      };

      if (!uploadRes.ok || !uploadData.success || !uploadData.data?.extractedText) {
        throw new Error(uploadData.error ?? "Impossible de lire ce fichier. Essaie un PDF de cours en texte.");
      }

      clearInterval(interval);
      setUploadProgress("Generation de ta fiche...");
      await generateFiche(uploadData.data.extractedText);
    } catch (err) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setStep(fiche ? "viewing" : "input");
    }
  }

  async function handleTextSubmit() {

    if (text.trim().length < 80) {
      setError("Colle au moins quelques paragraphes de cours (minimum 80 caracteres).");
      return;
    }

    setError(null);
    setStep("uploading");
    setUploadProgress("Generation de ta fiche...");
    await generateFiche(text.trim());
  }

  async function generateFiche(content: string) {
    try {
      // Step 1 — Inventory (~20s)
      setUploadProgress("Analyse du contenu...");
      const step1Res = await fetch("/api/generate/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      let step1Data: (Record<string, unknown> & { error?: string; token?: string }) = {};
      try {
        step1Data = await step1Res.json() as typeof step1Data;
      } catch {
        throw new Error("La génération a pris trop de temps. Réessaie.");
      }
      if (!step1Res.ok) throw new Error(getFriendlyError(step1Res.status, step1Data.error));
      if (!step1Data.token) {
        throw new Error("La session d'essai a expire. Relance la generation.");
      }

      // Step 2 — Sheet generation (~30s)
      setUploadProgress("Génération de ta fiche...");
      const step2Res = await fetch("/api/generate/demo/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(step1Data),
      });

      let step2Data: { fiche?: FicheGeneree; error?: string } = {};
      try {
        step2Data = await step2Res.json() as typeof step2Data;
      } catch {
        throw new Error("La génération a pris trop de temps. Réessaie.");
      }
      if (!step2Res.ok || !step2Data.fiche) {
        throw new Error(getFriendlyError(step2Res.status, step2Data.error));
      }

      setFiche(step2Data.fiche);
      setTryCount((currentCount) => Math.min(currentCount + 1, MAX_FREE_TRIES));
      trackUploadPdfCompleted(0, step2Data.fiche?.matiere ?? "unknown");
      trackTestSheetViewed("demo");
      if (isLoggedIn) trackSheetUnlocked("demo");
      setText("");
      setError(null);
      setStep("viewing");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de la generation. Reessaie.");
      setStep(fiche ? "viewing" : "input");
    }
  }

  if (!isHydrated) {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0", color: "#8B8B9E" }}>
        Chargement de ton essai...
      </div>
    );
  }

  if (step === "uploading") {
    return (
      <div style={{ textAlign: "center", padding: "2rem 0" }}>
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #2F5BFF",
            borderTopColor: "transparent",
            borderRadius: "50%",
            margin: "0 auto 1.5rem",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "#fff", fontWeight: 600, fontSize: "1rem", margin: 0 }}>{uploadProgress}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (step === "viewing" && fiche) {
    return (
      <div style={{ display: "grid", gap: "1rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignSelf: "flex-start",
            padding: "6px 12px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "#8B8B9E",
            fontSize: "12px",
            fontWeight: 600,
          }}
        >
          {currentAttemptLabel}
        </div>

        <div style={{ paddingBottom: !isLoggedIn ? "72px" : 0 }}>
          <FicheRenderer fiche={fiche} previewMode={!isLoggedIn} />
        </div>

        {!isLoggedIn ? (
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(15,15,19,0.97)",
              borderTop: "1px solid rgba(255,255,255,0.08)",
              backdropFilter: "blur(12px)",
              zIndex: 50,
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
              flexWrap: "wrap",
            }}
          >
            <p style={{ color: "#fff", margin: 0, fontSize: "0.9rem", lineHeight: 1.4 }}>
              <strong>Carte mentale + Feynman + flashcards</strong>
              <span style={{ color: "rgba(255,255,255,0.5)", fontWeight: 400 }}> — debloque en 2 sec avec Google</span>
            </p>
            <Link
              href="/sign-in?mode=signup&redirectTo=/try"
              onClick={() => { trackGoogleSigninClicked("blurred_sheet"); trackCreateOwnClicked("try-demo"); }}
              style={{
                background: "#2F5BFF",
                color: "#fff",
                padding: "0.65rem 1.25rem",
                borderRadius: "999px",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: "0.9rem",
                flexShrink: 0,
              }}
            >
              Continuer avec Google →
            </Link>
          </div>
        ) : isLoggedIn ? (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(47,91,255,0.18), rgba(59,91,219,0.12))",
              border: "1px solid rgba(47,91,255,0.35)",
              borderRadius: 18,
              padding: "1.1rem 1rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <p style={{ margin: 0, color: "#FFFFFF", fontWeight: 700 }}>🎉 Ta fiche complete est debloquee !</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, fontSize: "0.95rem" }}>
              Retrouve toutes tes fiches et genere autant de cours que tu veux dans ton espace.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/app"
                onClick={() => trackCreateOwnClicked("try-demo")}
                style={{
                  background: "#2F5BFF",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "0.75rem 1.25rem",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Acceder a mon espace →
              </Link>
              <button
                type="button"
                onClick={resetForAnotherTry}
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  background: "transparent",
                  borderRadius: "999px",
                  padding: "0.75rem 1.15rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tester une autre fiche
              </button>
            </div>
          </div>
        ) : hasReachedTryLimit ? (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(230,255,221,0.12), rgba(255,232,188,0.08))",
              border: "1px solid rgba(185, 152, 90, 0.28)",
              borderRadius: 18,
              padding: "1.1rem 1rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <p style={{ margin: 0, color: "#F7F4EA", fontWeight: 700 }}>2/2 fiches testees.</p>
            <p style={{ margin: 0, color: "#C9C0A7", lineHeight: 1.5, fontSize: "0.95rem" }}>
              Pour generer plus de fiches, passe a Reviz Premium. 4,99 EUR/mois - moins cher qu'un McDo.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link
                href="/pricing"
                style={{
                  background: "#F3E5B4",
                  color: "#2B2414",
                  borderRadius: "999px",
                  padding: "0.75rem 1.15rem",
                  textDecoration: "none",
                  fontWeight: 700,
                }}
              >
                Voir l'abonnement
              </Link>
              <Link
                href="/app"
                style={{
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#F7F4EA",
                  borderRadius: "999px",
                  padding: "0.75rem 1.15rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Ouvrir mon espace
              </Link>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "linear-gradient(135deg, rgba(5,150,105,0.18), rgba(13,148,136,0.12))",
              border: "1px solid rgba(16,185,129,0.28)",
              borderRadius: 18,
              padding: "1.1rem 1rem",
              display: "grid",
              gap: "0.75rem",
            }}
          >
            <p style={{ margin: 0, color: "#FFFFFF", fontWeight: 700 }}>Fiche complete debloquee.</p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.82)", lineHeight: 1.5, fontSize: "0.95rem" }}>
              Tu peux maintenant tester une 2e fiche gratuitement avant de passer a l'abonnement.
            </p>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={resetForAnotherTry}
                style={{
                  background: "#FFFFFF",
                  color: "#0D9488",
                  border: "none",
                  borderRadius: "999px",
                  padding: "0.75rem 1.15rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Tester une 2e fiche
              </button>
              <Link
                href="/app"
                style={{
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#FFFFFF",
                  borderRadius: "999px",
                  padding: "0.75rem 1.15rem",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Ouvrir mon espace
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show paywall when limit is reached and no fiche is currently displayed
  if (hasReachedTryLimit && step === "input" && !isTester) {
    return <TryPaywall isLoggedIn={isLoggedIn} />;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".pdf,image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) void handleFile(selectedFile);
        }}
      />
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: "none" }}
        onChange={(e) => {
          const selectedFile = e.target.files?.[0];
          if (selectedFile) void handleFile(selectedFile);
        }}
      />

      {/* Hint */}
      <p
        style={{
          fontSize: 13,
          color: "#9CA3AF",
          background: "#1a1a24",
          padding: "10px 14px",
          borderRadius: 6,
          lineHeight: 1.5,
          margin: 0,
        }}
      >
        Fonctionne avec : PDF de cours en texte, jusqu'à 15 Mo
        <br />
        Évite : PDFs avec beaucoup de schémas ou scans flous
      </p>

      {/* Action buttons — identical to app */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "#3B5BDB",
            border: "none",
            color: "#FFFFFF",
            borderRadius: 12,
            padding: "18px 36px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--display-font)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#2946c4"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "#3B5BDB"; }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
          Importer
        </button>

        <button
          type="button"
          onClick={() => photoInputRef.current?.click()}
          style={{
            background: "transparent",
            border: "1px solid #2A2A38",
            color: "#8B8B9E",
            borderRadius: 12,
            padding: "18px 36px",
            cursor: "pointer",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--display-font)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#3B5BDB";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#2A2A38";
            e.currentTarget.style.color = "#8B8B9E";
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Photo
        </button>
      </div>

      {/* Textarea */}
      <div style={{ width: "100%" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ou colle ton cours ici..."
          rows={6}
          style={{
            width: "100%",
            background: "#1A1A26",
            border: "1px solid #2A2A38",
            borderRadius: 14,
            padding: "16px",
            color: "#FFFFFF",
            fontFamily: "inherit",
            fontSize: 14,
            lineHeight: 1.6,
            resize: "vertical",
            outline: "none",
            boxSizing: "border-box",
            transition: "border-color 0.15s",
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = "#3B5BDB"; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = "#2A2A38"; }}
        />
      </div>

      {/* Generate button — identical to app */}
      <button
        type="button"
        onClick={() => void handleTextSubmit()}
        disabled={text.trim().length < 80}
        style={{
          background: text.trim().length >= 80 ? "#3B5BDB" : "#1E1E2A",
          color: text.trim().length >= 80 ? "#FFFFFF" : "#8B8B9E",
          borderRadius: 50,
          padding: "16px 0",
          width: "100%",
          maxWidth: 320,
          margin: "0 auto",
          display: "block",
          fontFamily: "var(--display-font)",
          fontSize: 14,
          fontWeight: 700,
          border: "none",
          boxShadow: text.trim().length >= 80 ? "0 0 32px rgba(59, 91, 219, 0.35)" : "none",
          letterSpacing: "0.08em",
          textTransform: "uppercase" as const,
          cursor: text.trim().length < 80 ? "not-allowed" : "pointer",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          if (text.trim().length >= 80) {
            e.currentTarget.style.background = "#2946c4";
            e.currentTarget.style.boxShadow = "0 0 48px rgba(59, 91, 219, 0.5)";
          }
        }}
        onMouseLeave={(e) => {
          if (text.trim().length >= 80) {
            e.currentTarget.style.background = "#3B5BDB";
            e.currentTarget.style.boxShadow = "0 0 32px rgba(59, 91, 219, 0.35)";
          }
        }}
      >
        Générer ma fiche
      </button>

      {error ? (
        <div
          style={{
            background: "#252532",
            border: "1px solid #2A2A38",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            color: "#fff",
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      {!isLoggedIn && (
        <p style={{ textAlign: "center", color: "#8B8B9E", fontSize: 12, margin: 0 }}>
          Déjà un compte ?{" "}
          <Link href="/sign-in?redirectTo=/try" style={{ color: "#3B5BDB", textDecoration: "none" }}>
            Se connecter
          </Link>
        </p>
      )}
    </div>
  );
}
