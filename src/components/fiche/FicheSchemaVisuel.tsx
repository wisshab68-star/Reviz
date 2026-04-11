import type { FicheSchema } from "@/types/fiche-generated";

const COULEURS: Record<string, { fill: string; stroke: string; text: string }> = {
  bleu: { fill: "#EAF0FF", stroke: "#2F5BFF", text: "#1736B6" },
  teal: { fill: "#E9FFF8", stroke: "#24A878", text: "#156A52" },
  coral: { fill: "#FFE8EE", stroke: "#FF7CAA", text: "#A63E67" },
  violet: { fill: "#F1ECFF", stroke: "#8969F7", text: "#5842B7" },
  gris: { fill: "#FFF8E9", stroke: "#D6A838", text: "#7D5A12" },
};

interface FicheSchemaVisuelProps {
  schema: FicheSchema;
  blueprintId?: string;
}

interface NodeBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function polarPoint(cx: number, cy: number, radiusX: number, radiusY: number, angle: number) {
  return {
    x: cx + radiusX * Math.cos(angle),
    y: cy + radiusY * Math.sin(angle),
  };
}

function buildCloudPath(box: NodeBox) {
  const { x, y, width, height } = box;
  const right = x + width;
  const bottom = y + height;
  const cx = x + width / 2;
  const cy = y + height / 2;

  return [
    `M ${x + width * 0.18} ${bottom - height * 0.08}`,
    `Q ${x - width * 0.02} ${cy + height * 0.18} ${x + width * 0.08} ${y + height * 0.34}`,
    `Q ${x + width * 0.1} ${y + height * 0.02} ${x + width * 0.34} ${y + height * 0.08}`,
    `Q ${cx} ${y - height * 0.08} ${right - width * 0.3} ${y + height * 0.08}`,
    `Q ${right + width * 0.02} ${y + height * 0.18} ${right - width * 0.08} ${cy}`,
    `Q ${right + width * 0.01} ${bottom - height * 0.06} ${right - width * 0.22} ${bottom - height * 0.08}`,
    `Q ${cx} ${bottom + height * 0.08} ${x + width * 0.18} ${bottom - height * 0.08}`,
    "Z",
  ].join(" ");
}

function boxCenter(box: NodeBox) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

function buildNodePositions(
  elements: FicheSchema["elements"],
  svgWidth: number,
  svgHeight: number,
  blueprintId?: string,
) {
  const boxes: Record<string, NodeBox> = {};
  if (elements.length === 0) {
    return boxes;
  }

  if (blueprintId === "chronologie") {
    const width = 160;
    const height = 68;
    const gap = 18;
    const totalWidth = Math.min(elements.length, 4) * width + Math.max(0, Math.min(elements.length, 4) - 1) * gap;
    let startX = (svgWidth - totalWidth) / 2;
    let row = 0;
    let col = 0;

    elements.forEach((element, index) => {
      if (index > 0 && index % 4 === 0) {
        row += 1;
        col = 0;
        startX = (svgWidth - Math.min(elements.length - index, 4) * width - Math.max(0, Math.min(elements.length - index, 4) - 1) * gap) / 2;
      }
      boxes[element.id] = {
        x: startX + col * (width + gap),
        y: 86 + row * 120,
        width,
        height,
      };
      col += 1;
    });

    return boxes;
  }

  if (blueprintId === "algorithmique") {
    const centerWidth = 200;
    const centerHeight = 78;
    const outerWidth = 170;
    const outerHeight = 68;
    const centerX = svgWidth / 2 - centerWidth / 2;
    const centerY = svgHeight / 2 - centerHeight / 2;

    boxes[elements[0].id] = { x: centerX, y: centerY, width: centerWidth, height: centerHeight };

    const positions = [
      { x: centerX, y: 52 },
      { x: svgWidth - outerWidth - 72, y: 138 },
      { x: centerX, y: svgHeight - outerHeight - 56 },
      { x: 72, y: 140 },
      { x: 118, y: svgHeight / 2 - outerHeight / 2 },
      { x: svgWidth - outerWidth - 118, y: svgHeight / 2 - outerHeight / 2 },
    ];

    elements.slice(1).forEach((element, index) => {
      const point = positions[index % positions.length];
      boxes[element.id] = {
        x: point.x,
        y: point.y,
        width: outerWidth,
        height: outerHeight,
      };
    });

    return boxes;
  }

  const centerWidth = 220;
  const centerHeight = 88;
  const outerWidth = 166;
  const outerHeight = 70;
  const centerX = svgWidth / 2 - centerWidth / 2;
  const centerY = svgHeight / 2 - centerHeight / 2;

  boxes[elements[0].id] = {
    x: centerX,
    y: centerY,
    width: centerWidth,
    height: centerHeight,
  };

  const outer = elements.slice(1);
  const radiusX = Math.min(264, svgWidth * 0.35);
  const radiusY = Math.min(178, svgHeight * 0.28);

  outer.forEach((element, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(outer.length, 1)) * Math.PI * 2;
    const point = polarPoint(svgWidth / 2, svgHeight / 2, radiusX, radiusY, angle);
    boxes[element.id] = {
      x: point.x - outerWidth / 2,
      y: point.y - outerHeight / 2,
      width: outerWidth,
      height: outerHeight,
    };
  });

  return boxes;
}

function getSchemaBadge(blueprintId?: string) {
  switch (blueprintId) {
    case "formulaire":
      return "Carte formule";
    case "algorithmique":
      return "Carte logique";
    case "chronologie":
      return "Carte repere";
    case "mecanisme":
      return "Carte mecanisme";
    case "comparaison":
      return "Carte comparaison";
    case "taxonomie":
      return "Carte classement";
    case "cas-pratique":
      return "Carte decision";
    default:
      return "Carte mentale";
  }
}

export function FicheSchemaVisuel({ schema, blueprintId }: FicheSchemaVisuelProps) {
  const elements = schema.elements ?? [];
  const connexions = schema.connexions ?? [];
  const svgWidth = 760;
  const svgHeight = blueprintId === "chronologie" ? 420 : elements.length <= 4 ? 420 : 500;
  const positions = buildNodePositions(elements, svgWidth, svgHeight, blueprintId);

  return (
    <div className="reviz-schema-shell" data-print="carte-mentale" style={{ background: "#FFFFFF", color: "#000000" }}>
      <div className="reviz-schema-badge">{getSchemaBadge(blueprintId)}</div>
      <p className="reviz-schema-description">{schema.description}</p>
      <svg
        className="reviz-schema-svg"
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: "100%", height: "auto" }}
      >
        <defs>
          <marker id="arr-schema" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
            <path d="M0,0 L0,8 L10,4 z" fill="#2F5BFF" />
          </marker>
        </defs>

        <circle cx="72" cy="56" r="12" fill="#FFE8EE" stroke="#050505" strokeWidth="2" />
        <circle cx="682" cy="66" r="10" fill="#EAF0FF" stroke="#050505" strokeWidth="2" />
        <path d="M640 410 q18 -18 36 0 q-18 18 -36 0z" fill="#FFF8E9" stroke="#050505" strokeWidth="2" />
        {blueprintId === "chronologie" ? (
          <line x1="90" y1="122" x2="670" y2="122" stroke="#111111" strokeWidth="2" strokeDasharray="8 8" />
        ) : null}

        {connexions.map((connexion, index) => {
          const from = positions[connexion.de];
          const to = positions[connexion.vers];
          if (!from || !to) {
            return null;
          }

          const fromCenter = boxCenter(from);
          const toCenter = boxCenter(to);
          const x1 = fromCenter.x;
          const y1 = fromCenter.y;
          const x2 = toCenter.x;
          const y2 = toCenter.y;
          const midX = (x1 + x2) / 2;
          const midY = (y1 + y2) / 2;
          const controlX = (midX + svgWidth / 2) / 2;
          const controlY = (midY + svgHeight / 2) / 2;

          const connectionColor = blueprintId === "algorithmique" ? "#111111" : "#2F5BFF";

          return (
            <g key={`${connexion.de}-${connexion.vers}-${index}`}>
              <path
                d={`M ${x1} ${y1} Q ${controlX} ${controlY} ${x2} ${y2}`}
                stroke={connectionColor}
                strokeWidth="3"
                fill="none"
                markerEnd={blueprintId === "chronologie" ? undefined : "url(#arr-schema)"}
              />
              {connexion.label ? (
                <text
                  x={midX}
                  y={midY - 10}
                  textAnchor="middle"
                  fontSize="14"
                  fontFamily="'Patrick Hand', cursive"
                  fill="#465886"
                >
                  {connexion.label}
                </text>
              ) : null}
            </g>
          );
        })}

        {elements.map((element) => {
          const box = positions[element.id];
          if (!box) {
            return null;
          }

          const cfg = COULEURS[element.couleur] ?? COULEURS.gris;
          const center = boxCenter(box);
          const isCentral = element.id === elements[0]?.id;

          return (
            <g key={element.id}>
              {isCentral ? (
                <path d={buildCloudPath(box)} fill={cfg.fill} stroke="#050505" strokeWidth="3" />
              ) : (
                <rect
                  x={box.x}
                  y={box.y}
                  width={box.width}
                  height={box.height}
                  rx="28"
                  fill={cfg.fill}
                  stroke="#050505"
                  strokeWidth="3"
                />
              )}
              <circle
                cx={center.x - box.width * 0.3}
                cy={box.y + 16}
                r="5"
                fill="#ffffff"
                stroke="#050505"
                strokeWidth="1.5"
              />
              <text
                x={center.x}
                y={center.y + 6}
                textAnchor="middle"
                fontSize={isCentral ? "18" : "16"}
                fontWeight="700"
                fontFamily={isCentral ? "'Caveat', 'Patrick Hand', cursive" : "'Patrick Hand', cursive"}
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
