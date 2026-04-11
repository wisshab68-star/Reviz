"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

function getSubjectTheme(title: string, summary: string) {
  const haystack = `${title} ${summary}`.toLowerCase();

  if (haystack.includes("math")) {
    return { label: "Maths", color: "#3B5BDB" };
  }

  if (haystack.includes("svt") || haystack.includes("biologie") || haystack.includes("science de la vie")) {
    return { label: "SVT", color: "#16a34a" };
  }

  if (haystack.includes("histoire") || haystack.includes("geo") || haystack.includes("géographie")) {
    return { label: "Histoire-Géo", color: "#d97706" };
  }

  if (haystack.includes("physique") || haystack.includes("chimie")) {
    return { label: "Physique-Chimie", color: "#9333ea" };
  }

  return { label: "Autres", color: "#6b7280" };
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
          Génère ta première fiche en 30 secondes.
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
          Créer ma première fiche
        </Link>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0F0F13",
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: "16px",
      }}
    >
      {items.map((item) => {
        const subjectTheme = getSubjectTheme(item.title, item.summary);

        return (
          <article
            key={item.id}
            onClick={() => router.push(`/sheet/${item.id}`)}
            style={{
              background: "#1E1E2A",
              border: "0.5px solid #2A2A38",
              borderRadius: "12px",
              padding: "20px",
              cursor: "pointer",
              transition: "border-color 0.2s ease, transform 0.2s ease",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              minHeight: "180px",
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
                padding: "6px 10px",
                borderRadius: "999px",
                background: subjectTheme.color,
                color: "#FFFFFF",
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-heading)",
              }}
            >
              {subjectTheme.label}
            </div>

            <div style={{ display: "grid", gap: "8px" }}>
              <h3
                style={{
                  margin: 0,
                  color: "#FFFFFF",
                  fontFamily: "var(--font-heading)",
                  fontSize: "20px",
                  lineHeight: 1.2,
                }}
              >
                {item.title}
              </h3>
              <p
                style={{
                  margin: 0,
                  color: "#8B8B9E",
                  fontSize: "14px",
                  lineHeight: 1.5,
                }}
              >
                {item.summary}
              </p>
            </div>

            <span
              style={{
                marginTop: "auto",
                color: "#8B8B9E",
                fontSize: "12px",
              }}
            >
              {new Date(item.createdAt).toLocaleDateString("fr-FR")}
            </span>
          </article>
        );
      })}
    </div>
  );
}
