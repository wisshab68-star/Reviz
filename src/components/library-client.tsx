"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SheetSourceType = "TEXT" | "PDF" | "IMAGE" | "DOCX" | "AUDIO";

type SheetListItem = {
  id: string;
  title?: string | null;
  summary?: string | null;
  description?: string | null;
  sourceType?: SheetSourceType | null;
  status?: string | null;
  createdAt: string;
  updatedAt: string;
  masteryScore?: number;
};

type SheetsResponse = {
  success: boolean;
  data?: SheetListItem[];
  error?: string;
};

type SubjectTheme = {
  label: string;
  background: string;
  color: string;
  border?: string;
};

function getSubjectTheme(title: string, summary: string): SubjectTheme {
  const haystack = `${title} ${summary}`.toLowerCase();

  if (haystack.includes("math")) {
    return { label: "Maths", background: "#1e3a8a", color: "#93c5fd" };
  }

  if (haystack.includes("svt") || haystack.includes("biologie") || haystack.includes("science de la vie")) {
    return { label: "SVT", background: "#14532d", color: "#86efac" };
  }

  if (haystack.includes("histoire") || haystack.includes("geo") || haystack.includes("géographie")) {
    return { label: "Histoire", background: "#78350f", color: "#fcd34d" };
  }

  if (haystack.includes("physique") || haystack.includes("chimie")) {
    return { label: "Physique", background: "#4a1d96", color: "#c4b5fd" };
  }

  return {
    label: "Autres",
    background: "#1E1E2A",
    color: "#8B8B9E",
    border: "1px solid #2A2A38",
  };
}

function getSafeTitle(sheet: SheetListItem) {
  return sheet.title?.trim().length ? sheet.title : "Fiche generee";
}

function getSafeDescription(sheet: SheetListItem) {
  if (sheet.description?.length && sheet.description.trim().length > 0) {
    return sheet.description;
  }

  if (sheet.summary?.length && sheet.summary.trim().length > 0) {
    return sheet.summary;
  }

  if (sheet.status?.length && sheet.status.trim().length > 0) {
    return `Statut: ${sheet.status}`;
  }

  if (sheet.sourceType?.length && sheet.sourceType.trim().length > 0) {
    return `Source: ${sheet.sourceType}`;
  }

  return "Fiche generee";
}

function getSafeDate(value: string) {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "Date indisponible";
  }

  return parsed.toLocaleDateString("fr-FR");
}

export function LibraryClient() {
  const router = useRouter();
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
    return (
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#8B8B9E",
          background: "#0F0F13",
        }}
      >
        Chargement des fiches...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          background: "#0F0F13",
          border: "1px solid #2A2A38",
          borderRadius: 12,
          padding: "24px",
        }}
      >
        {error}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 80px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          textAlign: "center",
          background: "#0F0F13",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2A2A38"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <h2
          style={{
            margin: "24px 0 0",
            color: "#FFFFFF",
            fontFamily: "var(--font-heading)",
            fontSize: "24px",
          }}
        >
          Aucune fiche pour le moment
        </h2>
        <p
          style={{
            margin: 0,
            color: "#8B8B9E",
            fontSize: "14px",
          }}
        >
          Genere ta premiere fiche en 30 secondes.
        </p>
        <Link
          href="/app"
          style={{
            marginTop: "8px",
            background: "#3B5BDB",
            color: "#FFFFFF",
            borderRadius: "50px",
            padding: "14px 32px",
            fontFamily: "var(--font-heading)",
            textDecoration: "none",
          }}
        >
          Creer ma premiere fiche
        </Link>
      </div>
    );
  }

  return (
    <div style={{ background: "#0F0F13" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1
          style={{
            fontFamily: "var(--display-font)",
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 900,
            color: "#FFFFFF",
            margin: "0 0 8px",
          }}
        >
          Tes fiches.
        </h1>

        <p
          style={{
            color: "#8B8B9E",
            fontSize: "14px",
            margin: 0,
          }}
        >
          {`${items.length} fiche${items.length > 1 ? "s" : ""} generee${items.length > 1 ? "s" : ""}`}
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "16px",
        }}
      >
        {items.map((sheet) => {
          const safeTitle = getSafeTitle(sheet);
          const safeDescription = getSafeDescription(sheet);
          const safeDate = getSafeDate(sheet.createdAt);
          const subjectTheme = getSubjectTheme(safeTitle, safeDescription);

          return (
            <article
              key={sheet.id}
              onClick={() => router.push(`/sheet/${sheet.id}`)}
              style={{
                background: "#1E1E2A",
                border: "1px solid #2A2A38",
                borderRadius: "16px",
                padding: "24px",
                cursor: "pointer",
                transition: "all 0.2s",
                display: "flex",
                flexDirection: "column",
                minHeight: "220px",
              }}
              onMouseEnter={(event) => {
                event.currentTarget.style.borderColor = "#3B5BDB";
                event.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.borderColor = "#2A2A38";
                event.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignSelf: "flex-start",
                  borderRadius: "50px",
                  padding: "4px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  background: subjectTheme.background,
                  color: subjectTheme.color,
                  border: subjectTheme.border ?? "none",
                }}
              >
                {subjectTheme.label}
              </div>

              <h3
                style={{
                  fontFamily: "var(--display-font)",
                  fontSize: "18px",
                  fontWeight: 900,
                  color: "#FFFFFF",
                  margin: "12px 0 8px",
                  lineHeight: 1.2,
                }}
              >
                {safeTitle?.length > 0 ? safeTitle : "Fiche generee"}
              </h3>

              <p
                style={{
                  color: "#8B8B9E",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  margin: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {safeDescription?.length > 0 ? safeDescription : "Fiche generee"}
              </p>

              <span
                style={{
                  color: "#2A2A38",
                  fontSize: "11px",
                  marginTop: "16px",
                }}
              >
                {safeDate}
              </span>
            </article>
          );
        })}
      </div>
    </div>
  );
}
