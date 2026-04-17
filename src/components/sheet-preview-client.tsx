"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";
import { SheetView } from "@/components/sheet-view";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { GeneratedSheet } from "@/types/sheet";

const PREVIEW_STORAGE_KEY = "reviz-preview-sheet";

type PreviewPayload = {
  generated: GeneratedSheet;
  fiche: FicheGeneree | null;
};

function parsePreviewPayload(raw: string | null): PreviewPayload | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<PreviewPayload>;

    if (!parsed.generated) {
      return null;
    }

    return {
      generated: parsed.generated as GeneratedSheet,
      fiche: (parsed.fiche as FicheGeneree | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

function SheetPreviewInner() {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [ready, setReady] = useState(false);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("funnel") === "demo";

  useEffect(() => {
    const sessionPreview = parsePreviewPayload(window.sessionStorage.getItem(PREVIEW_STORAGE_KEY));
    const localPreview = parsePreviewPayload(window.localStorage.getItem(PREVIEW_STORAGE_KEY));
    const resolvedPreview = sessionPreview ?? localPreview;

    if (resolvedPreview) {
      setPreview(resolvedPreview);
    }

    setReady(true);
  }, []);

  return (
    <div className="content-shell sheet-content-shell" style={isDemo ? { paddingBottom: "80px" } : undefined}>
      <div className="reviz-sheet-frame">
        <div className="reviz-sheet-orb reviz-sheet-orb-a" aria-hidden="true" />
        <div className="reviz-sheet-orb reviz-sheet-orb-b" aria-hidden="true" />
        <header className="reviz-sheet-page-header">
          <div className="reviz-sheet-page-top">
            <div>
              <p className="eyebrow">{isDemo ? "Aperçu de ta fiche — 80% débloqué" : "Apercu temporaire"}</p>
              <h1 className="reviz-sheet-page-title">
                {preview?.generated.title ?? "Fiche en preparation"}
              </h1>
            </div>
            <div className="cta-row reviz-sheet-page-actions">
              {isDemo ? (
                <>
                  <Link href="/sign-in" className="btn btn-soft">
                    Se connecter
                  </Link>
                  <Link href="/sign-in?mode=signup" className="btn btn-primary">
                    Créer mon compte gratuit
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/app" className="btn btn-soft">
                    Retour
                  </Link>
                  <Link href="/library" className="btn btn-primary">
                    Bibliotheque
                  </Link>
                </>
              )}
            </div>
          </div>
          <p className="reviz-sheet-page-summary">
            {preview?.generated.summary
              ?? "Cet apercu s'affiche directement depuis ton navigateur, sans attendre une sauvegarde en base."}
          </p>
          <div className="reviz-sheet-page-art" aria-hidden="true">
            <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
            <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
            <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
          </div>
        </header>

        {!ready ? (
          <section style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
            <div className="status-box">Chargement de l'apercu...</div>
          </section>
        ) : null}

        {ready && !preview ? (
          <section style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
            <div className="status-box error">
              Aucun apercu temporaire n'est disponible sur cet appareil. Relance une generation depuis
              l'accueil pour ouvrir la fiche ici.
            </div>
          </section>
        ) : null}

        {ready && preview ? (
          <div style={{ position: "relative" }}>
            <SheetView
              summary={preview.generated.summary}
              keyPoints={preview.generated.keyPoints}
              definitions={preview.generated.definitions}
              flashcards={preview.generated.flashcards}
              quiz={preview.generated.quiz}
              contentBlocks={preview.generated.contentBlocks}
              feynmanExplanation={preview.generated.feynmanExplanation}
              keyMetrics={preview.generated.keyMetrics}
              ficheGeneree={preview.fiche}
            />
            {isDemo ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backdropFilter: "blur(8px)",
                  background: "rgba(0,0,0,0.55)",
                  zIndex: 10,
                  borderRadius: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "1rem",
                  padding: "2rem",
                  textAlign: "center",
                }}
              >
                <p style={{ color: "#fff", fontSize: "1.25rem", fontWeight: 800, margin: 0, letterSpacing: "-0.01em" }}>
                  Tu rates le plus important 👆
                </p>
                <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.9rem", margin: 0, maxWidth: "280px", lineHeight: 1.5 }}>
                  Flashcards, carte mentale, quiz — les outils qui font vraiment la différence sont juste là.
                </p>
                <Link
                  href="/sign-in?mode=signup"
                  className="btn btn-primary"
                  style={{ marginTop: "0.25rem", fontSize: "15px", fontWeight: 700 }}
                >
                  Débloquer en 2 secondes →
                </Link>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "12px", margin: 0 }}>
                  Connexion Google — sans formulaire
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {isDemo ? (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(17,17,17,0.96)",
            borderTop: "1px solid rgba(255,255,255,0.1)",
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
          <p style={{ color: "#fff", margin: 0, fontSize: "0.95rem", lineHeight: 1.4 }}>
            <strong>Tu rates le plus important</strong>
            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 400 }}> — moins cher qu'un McDo</span>
          </p>
          <Link href="/sign-in?mode=signup" className="btn btn-primary" style={{ flexShrink: 0, fontWeight: 700 }}>
            Continuer avec Google →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export function SheetPreviewClient() {
  return (
    <Suspense fallback={
      <div className="content-shell sheet-content-shell">
        <div className="reviz-sheet-frame">
          <section style={{ paddingTop: "2rem", paddingBottom: "2rem" }}>
            <div className="status-box">Chargement...</div>
          </section>
        </div>
      </div>
    }>
      <SheetPreviewInner />
    </Suspense>
  );
}
