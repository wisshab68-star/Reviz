"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";

type SheetSourceType = "TEXT" | "PDF" | "IMAGE" | "DOCX" | "AUDIO";

type SheetListItem = {
  id: string;
  title: string;
  summary: string;
  sourceType: SheetSourceType;
  status: string;
  createdAt: string;
  updatedAt: string;
  masteryScore?: number;
};

type SheetsResponse = {
  success: boolean;
  data?: SheetListItem[];
  error?: string;
};

const SOURCE_BADGE_CONFIG: Record<
  SheetSourceType,
  { label: string; bg: string; color: string }
> = {
  TEXT: { label: "Texte", bg: "#eaf0ff", color: "#1736b6" },
  PDF: { label: "PDF", bg: "#eaf0ff", color: "#1736b6" },
  IMAGE: { label: "Image", bg: "#eaf0ff", color: "#1736b6" },
  DOCX: { label: "Word", bg: "#eaf0ff", color: "#1736b6" },
  AUDIO: { label: "Audio", bg: "#eaf0ff", color: "#1736b6" },
};

export function LibraryClient() {
  const [items, setItems] = useState<SheetListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSheets() {
      try {
        const response = await fetch("/api/sheets", { cache: "no-store" });
        const data = (await response.json()) as SheetsResponse;

        if (!response.ok || !data.success || !data.data) {
          throw new Error(data.error ?? "Impossible de charger les fiches.");
        }

        setItems(data.data);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Une erreur inattendue est survenue.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSheets();
  }, []);

  if (loading) {
    return <div className="status-box">Chargement des fiches...</div>;
  }

  if (error) {
    return <div className="status-box error">{error}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="card empty-state">
        <div className="reviz-empty-art" aria-hidden="true">
          <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
          <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
        </div>
        <p>Aucune fiche pour le moment.</p>
        <div className="cta-row" style={{ justifyContent: "center", marginTop: "1rem" }}>
          <Link href="/app" className="btn btn-primary">
            Nouvelle fiche
          </Link>
          <Link href="/sign-in" className="btn btn-soft">
            Connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="library-workspace">
      <div className="library-toolbar">
        <div>
          <p className="eyebrow">Reviz</p>
          <h2 className="workspace-title">bibliotheque</h2>
        </div>
        <div className="reviz-library-art" aria-hidden="true">
          <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
          <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
          <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
        </div>
        <Link href="/app" className="btn btn-primary">
          Ajouter
        </Link>
      </div>

      <div className="library-ledger">
        <div className="library-ledger-head">
          <span>Titre</span>
          <span>Source</span>
          <span>Date</span>
          <span>Actions</span>
        </div>

        <div className="library-ledger-body">
          {items.map((item) => {
            const badge = SOURCE_BADGE_CONFIG[item.sourceType] ?? {
              label: item.sourceType,
              bg: "#f5f5f5",
              color: "#111111",
            };
            const derivedMastery =
              item.masteryScore ?? Math.min(92, Math.max(28, 45 + item.summary.length / 12));

            return (
              <article key={item.id} className="library-row">
                <div className="library-row-main">
                  <div className="library-row-heading">
                    <h3>{item.title}</h3>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 20,
                        background: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p>{item.summary}</p>
                  {(item.masteryScore !== undefined || item.summary.length > 0) ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: "#e9e9e9",
                          borderRadius: 2,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 2,
                            background: "#111111",
                            width: `${derivedMastery}%`,
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: "#6a6a6a", whiteSpace: "nowrap" }}>
                        {Math.round(derivedMastery)}%
                      </span>
                    </div>
                  ) : null}
                </div>
                <span className="library-row-meta">{item.sourceType}</span>
                <span className="library-row-meta">
                  {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </span>
                <div className="cta-row">
                  <Link href={`/sheet/${item.id}`} className="btn btn-primary">
                    Ouvrir
                  </Link>
                  <Link href={`/review/${item.id}`} className="btn btn-soft">
                    Reviser
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
