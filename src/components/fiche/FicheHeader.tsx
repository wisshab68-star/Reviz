import type { FicheMetrique } from "@/types/fiche-generated";
import { RevizMascotDoodle, RevizMindOrbitDoodle, RevizNotebookDoodle } from "@/components/reviz-illustrations";

interface FicheHeaderProps {
  titre: string;
  matiere: string;
  niveau: string;
  metriques: FicheMetrique[];
}

export function FicheHeader({ titre, matiere, niveau, metriques }: FicheHeaderProps) {
  return (
    <div className="reviz-fiche-header" style={{ background: "#FFFFFF", color: "#000000" }}>
      <span className="reviz-fiche-badge">Fiche Reviz</span>
      <h1 className="reviz-fiche-title">{titre}</h1>
      <p className="reviz-fiche-meta">{matiere} - {niveau}</p>
      <div className="reviz-fiche-header-art" aria-hidden="true">
        <RevizNotebookDoodle className="reviz-illustration reviz-illustration-notebook" />
        <RevizMindOrbitDoodle className="reviz-illustration reviz-illustration-orbit" />
        <RevizMascotDoodle className="reviz-illustration reviz-illustration-mascot" />
      </div>
      <div className="reviz-fiche-metrics">
        {metriques.map((metric, index) => (
          <div key={`${metric.label}-${index}`} className="reviz-fiche-metric">
            <div className="reviz-fiche-metric-value">{metric.valeur}</div>
            <div className="reviz-fiche-metric-label">{metric.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
