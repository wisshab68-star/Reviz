import type { FicheSchema } from "@/types/fiche-generated";

const COULEURS: Record<string, { fill: string; stroke: string; text: string }> = {
  bleu: { fill: "#E6F1FB", stroke: "#378ADD", text: "#0C447C" },
  teal: { fill: "#E1F5EE", stroke: "#1D9E75", text: "#085041" },
  coral: { fill: "#FAECE7", stroke: "#D85A30", text: "#712B13" },
  violet: { fill: "#EEEDFE", stroke: "#7F77DD", text: "#3C3489" },
  gris: { fill: "#F1EFE8", stroke: "#888780", text: "#444441" },
};

interface FicheSchemaVisuelProps {
  schema: FicheSchema;
}

export function FicheSchemaVisuel({ schema }: FicheSchemaVisuelProps) {
  const elements = schema.elements ?? [];
  const connexions = schema.connexions ?? [];
  const cols = Math.min(elements.length || 1, 3);
  const nodeWidth = 160;
  const nodeHeight = 50;
  const hGap = 60;
  const vGap = 50;
  const svgWidth = 680;
  const rows = Math.ceil(Math.max(elements.length, 1) / cols);
  const svgHeight = rows * (nodeHeight + vGap) + 60;
  const positions: Record<string, { x: number; y: number }> = {};

  elements.forEach((element, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const totalRowCols = Math.min(cols, elements.length - row * cols);
    const startX = (svgWidth - totalRowCols * nodeWidth - (totalRowCols - 1) * hGap) / 2;
    positions[element.id] = {
      x: startX + col * (nodeWidth + hGap),
      y: 30 + row * (nodeHeight + vGap),
    };
  });

  return (
    <div style={{ background: "var(--accent-soft)", padding: "1.25rem", marginBottom: "1rem" }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 12 }}>
        {schema.description}
      </p>
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          <marker id="arr-schema" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L8,3 z" fill="#888780" />
          </marker>
        </defs>

        {connexions.map((connexion, index) => {
          const from = positions[connexion.de];
          const to = positions[connexion.vers];
          if (!from || !to) {
            return null;
          }

          const x1 = from.x + nodeWidth / 2;
          const y1 = from.y + nodeHeight / 2;
          const x2 = to.x + nodeWidth / 2;
          const y2 = to.y + nodeHeight / 2;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;

          return (
            <g key={`${connexion.de}-${connexion.vers}-${index}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#B4B2A9"
                strokeWidth="1.5"
                markerEnd="url(#arr-schema)"
              />
              {connexion.label ? (
                <text x={midX} y={midY - 6} textAnchor="middle" fontSize="11" fill="#888780">
                  {connexion.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {elements.map((element) => {
          const pos = positions[element.id];
          if (!pos) {
            return null;
          }
          const cfg = COULEURS[element.couleur] ?? COULEURS.gris;

          return (
            <g key={element.id}>
              <rect
                x={pos.x}
                y={pos.y}
                width={nodeWidth}
                height={nodeHeight}
                rx="8"
                fill={cfg.fill}
                stroke={cfg.stroke}
                strokeWidth="1"
              />
              <text
                x={pos.x + nodeWidth / 2}
                y={pos.y + nodeHeight / 2 + 5}
                textAnchor="middle"
                fontSize="13"
                fontWeight="500"
                fill={cfg.text}
              >
                {element.label}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="fiche-schema-legend">
        {elements.map((element) => {
          const cfg = COULEURS[element.couleur] ?? COULEURS.gris;

          return (
            <div key={`legend-${element.id}`} className="fiche-schema-legend-item">
              <span
                className="fiche-schema-legend-dot"
                style={{ background: cfg.stroke }}
                aria-hidden="true"
              />
              <span>{element.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
