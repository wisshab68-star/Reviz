"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import type { FicheGeneree } from "@/types/fiche-generated";
import { DEMO_FICHES } from "@/data/demo-fiches";
import { FicheRenderer } from "@/components/fiche/FicheRenderer";

const MATIERES = [
  "Mathématiques",
  "Physique-Chimie",
  "SVT",
  "Histoire-Géographie",
  "Français",
  "Philosophie",
] as const;

const NIVEAUX = [
  "Collège",
  "Seconde",
  "Première",
  "Terminale",
  "BTS / Licence",
] as const;

type Step = "picker" | "viewing";

const STORAGE_KEY = "reviz-try-selection";

export function TryGenerator() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated" && !!session?.user;

  const [step, setStep] = useState<Step>("picker");
  const [selectedMatiere, setSelectedMatiere] = useState<string | null>(null);
  const [selectedNiveau, setSelectedNiveau] = useState<string | null>(null);

  // On mount: if user is logged in and has a saved selection, auto-view
  useEffect(() => {
    if (status === "loading") return;
    if (!isLoggedIn) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { matiere?: string; niveau?: string };
        if (parsed.matiere && parsed.niveau) {
          setSelectedMatiere(parsed.matiere);
          setSelectedNiveau(parsed.niveau);
          setStep("viewing");
        }
      }
    } catch {
      // ignore parse errors
    }
  }, [status, isLoggedIn]);

  function handleViewFiche() {
    if (!selectedMatiere || !selectedNiveau) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ matiere: selectedMatiere, niveau: selectedNiveau })
      );
    } catch {
      // ignore storage errors
    }
    setStep("viewing");
  }

  if (step === "picker") {
    const canSubmit = selectedMatiere !== null && selectedNiveau !== null;

    return (
      <div className="try-picker">
        <div className="try-group">
          <p className="try-label">Choisis ta matière</p>
          <div className="try-pills">
            {MATIERES.map((m) => (
              <button
                key={m}
                type="button"
                className={`try-pill${selectedMatiere === m ? " try-pill-active" : ""}`}
                onClick={() => setSelectedMatiere(m)}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="try-group">
          <p className="try-label">Ton niveau</p>
          <div className="try-pills">
            {NIVEAUX.map((n) => (
              <button
                key={n}
                type="button"
                className={`try-pill${selectedNiveau === n ? " try-pill-active" : ""}`}
                onClick={() => setSelectedNiveau(n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="btn btn-primary try-cta"
          disabled={!canSubmit}
          style={{ opacity: canSubmit ? 1 : 0.4 }}
          onClick={handleViewFiche}
        >
          Voir ma fiche gratuite →
        </button>

        <p style={{ textAlign: "center", marginTop: "1rem", color: "#8B8B9E", fontSize: "0.9rem" }}>
          Tu as déjà un compte ?{" "}
          <a href="/sign-in" style={{ color: "#2F5BFF", textDecoration: "none" }}>
            Se connecter
          </a>
        </p>
      </div>
    );
  }

  // "viewing" step
  const baseFiche: FicheGeneree =
    (selectedMatiere && DEMO_FICHES[selectedMatiere])
      ? DEMO_FICHES[selectedMatiere]
      : DEMO_FICHES["Mathématiques"];

  const displayFiche: FicheGeneree = {
    ...baseFiche,
    niveau: selectedNiveau ?? baseFiche.niveau,
    flashcards: isLoggedIn
      ? baseFiche.flashcards
      : baseFiche.flashcards.slice(0, 2),
  };

  return (
    <>
      <style>{`
        .demo-fiche-locked [data-print="feynman"] {
          filter: blur(5px);
          pointer-events: none;
          user-select: none;
          position: relative;
        }
        .demo-fiche-locked [data-print="carte-mentale"] {
          filter: blur(5px);
          pointer-events: none;
          user-select: none;
        }
        .demo-fiche-container {
          padding-bottom: 80px;
        }
      `}</style>

      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          onClick={() => setStep("picker")}
          style={{
            background: "none",
            border: "none",
            color: "#8B8B9E",
            cursor: "pointer",
            fontSize: "0.9rem",
            padding: 0,
          }}
        >
          ← Changer de matière
        </button>
      </div>

      <div className={`demo-fiche-container${isLoggedIn ? "" : " demo-fiche-locked"}`}>
        <FicheRenderer fiche={displayFiche} />

        {!isLoggedIn && (
          <div
            style={{
              border: "2px dashed rgba(47,91,255,0.4)",
              borderRadius: "16px",
              padding: "2rem",
              textAlign: "center",
              background: "rgba(47,91,255,0.05)",
              margin: "1rem 0",
            }}
          >
            <p style={{ margin: "0 0 0.5rem", fontWeight: 700 }}>
              🔒 4 flashcards supplémentaires
            </p>
            <p style={{ margin: "0 0 1rem", opacity: 0.7, fontSize: "0.9rem" }}>
              + Carte mentale complète + Méthode Feynman
            </p>
            <a
              href={`/sign-in?redirectTo=/try`}
              style={{
                background: "#2F5BFF",
                color: "#fff",
                padding: "0.7rem 1.6rem",
                borderRadius: "12px",
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              Débloquer gratuitement →
            </a>
          </div>
        )}
      </div>

      {!isLoggedIn && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(135deg, #2F5BFF, #7C3AED)",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 100,
            boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#fff", fontSize: "0.95rem" }}>
              Ta fiche est prête à 80%
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.8)", fontSize: "0.82rem" }}>
              Crée ton compte gratuit pour tout voir
            </p>
          </div>
          <a
            href="/sign-in?redirectTo=/try"
            style={{
              background: "#fff",
              color: "#2F5BFF",
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
              fontSize: "0.9rem",
            }}
          >
            Débloquer →
          </a>
        </div>
      )}

      {isLoggedIn && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "linear-gradient(135deg, #059669, #0D9488)",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 100,
          }}
        >
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: "#fff" }}>
              ✅ Fiche complète débloquée !
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.85)", fontSize: "0.85rem" }}>
              Génère maintenant ta fiche sur ton vrai cours
            </p>
          </div>
          <a
            href="/app"
            style={{
              background: "#fff",
              color: "#059669",
              padding: "0.6rem 1.2rem",
              borderRadius: "10px",
              fontWeight: 700,
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            Générer ma fiche →
          </a>
        </div>
      )}
    </>
  );
}
