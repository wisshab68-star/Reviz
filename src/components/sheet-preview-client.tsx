"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

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

export function SheetPreviewClient() {
  const [preview, setPreview] = useState<PreviewPayload | null>(null);
  const [ready, setReady] = useState(false);

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
    <div className="content-shell sheet-content-shell">
      <div className="reviz-sheet-frame">
        <div className="reviz-sheet-orb reviz-sheet-orb-a" aria-hidden="true" />
        <div className="reviz-sheet-orb reviz-sheet-orb-b" aria-hidden="true" />
        <header className="reviz-sheet-page-header">
          <div className="reviz-sheet-page-top">
            <div>
              <p className="eyebrow">Apercu temporaire</p>
              <h1 className="reviz-sheet-page-title">
                {preview?.generated.title ?? "Fiche en preparation"}
              </h1>
            </div>
            <div className="cta-row reviz-sheet-page-actions">
              <Link href="/app" className="btn btn-soft">
                Retour
              </Link>
              <Link href="/library" className="btn btn-primary">
                Bibliotheque
              </Link>
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
        ) : null}
      </div>
    </div>
  );
}
