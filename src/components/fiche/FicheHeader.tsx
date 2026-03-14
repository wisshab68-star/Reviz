import type { FicheMetrique } from "@/types/fiche-generated";

interface FicheHeaderProps {
  titre: string;
  matiere: string;
  niveau: string;
  metriques: FicheMetrique[];
}

export function FicheHeader({ titre, matiere, niveau, metriques }: FicheHeaderProps) {
  return (
    <div>
      <span
        style={{
          display: "inline-block",
          fontSize: 11,
          fontWeight: 600,
          padding: "4px 12px",
          background: "#f5f5f5",
          color: "var(--ink)",
          marginBottom: "1rem",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        Fiche resume · Reviz
      </span>
      <h1 style={{ fontSize: 28, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
        {titre}
      </h1>
      <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: "1.5rem" }}>
        {matiere} · {niveau}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {metriques.map((metric, index) => (
          <div key={`${metric.label}-${index}`} style={{ borderBottom: "1px solid var(--line)", padding: "12px 0" }}>
            <div style={{ fontSize: 22, fontWeight: 600, color: "var(--ink)", lineHeight: 1 }}>
              {metric.valeur}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
