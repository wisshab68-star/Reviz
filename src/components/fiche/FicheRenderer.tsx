import { FicheContentBlock } from "@/components/fiche/FicheContentBlock";
import { FicheFeynman } from "@/components/fiche/FicheFeynman";
import { FicheFlashcards } from "@/components/fiche/FicheFlashcards";
import { FicheHeader } from "@/components/fiche/FicheHeader";
import { FicheImageMentaleBlock } from "@/components/fiche/FicheImageMentaleBlock";
import { FicheSchemaVisuel } from "@/components/fiche/FicheSchemaVisuel";
import { MathRenderer } from "@/components/math-renderer";
import { looksLikeFormula, sanitizeAiText } from "@/lib/text";
import type { FicheGeneree } from "@/types/fiche-generated";
import type { ReactElement, ReactNode } from "react";

interface FicheRendererProps {
  fiche: FicheGeneree;
}

function Divider() {
  return <hr className="reviz-fiche-divider" />;
}

function normalizeDisplayText(value: string) {
  // Use sanitizeAiText instead of normalizeAcademicText to preserve LaTeX backslashes.
  return sanitizeAiText(value).replace(/\s+/g, " ").trim();
}

function normalizeDisplayFormula(value: string) {
  // Preserve LaTeX delimiters ($$, \(, $) — normalizeFormulaText strips them.
  // Only apply light sanitization for display.
  const cleaned = sanitizeAiText(value).trim();
  // If the formula has no LaTeX delimiters, wrap it in $$ for KaTeX rendering
  if (!/^\$\$|^\\\(|^\$/.test(cleaned) && /[=^_]/.test(cleaned)) {
    return `$$${cleaned}$$`;
  }
  return cleaned;
}

function isDisplayFormula(value: string) {
  return looksLikeFormula(value);
}

function isDisplayProperty(value: string) {
  return value.length >= 25 && !/^(les|partie|chapitre|section)\b/i.test(value) && !/^\d+[\).:-]/.test(value);
}

function normalizeFicheForDisplay(fiche: FicheGeneree): FicheGeneree {
  return {
    ...fiche,
    titre: normalizeDisplayText(fiche.titre),
    matiere: normalizeDisplayText(fiche.matiere),
    niveau: normalizeDisplayText(fiche.niveau),
    metriques: fiche.metriques.map((metric) => ({
      valeur: normalizeDisplayText(metric.valeur),
      label: normalizeDisplayText(metric.label),
    })),
    imageMentale: {
      titre: normalizeDisplayText(fiche.imageMentale.titre),
      texte: normalizeDisplayText(fiche.imageMentale.texte),
    },
    definition: normalizeDisplayText(fiche.definition),
    exemple: normalizeDisplayText(fiche.exemple),
    piege: normalizeDisplayText(fiche.piege),
    schema: {
      ...fiche.schema,
      description: normalizeDisplayText(fiche.schema.description),
      elements: fiche.schema.elements.map((element) => ({
        ...element,
        label: normalizeDisplayText(element.label),
      })),
      connexions: fiche.schema.connexions.map((connexion) => ({
        ...connexion,
        label: connexion.label ? normalizeDisplayText(connexion.label) : undefined,
      })),
    },
    feynman: normalizeDisplayText(fiche.feynman),
    flashcards: fiche.flashcards.map((flashcard) => ({
      question: normalizeDisplayText(flashcard.question),
      reponse: normalizeDisplayText(flashcard.reponse),
    })),
    blueprintSections: fiche.blueprintSections
      ? {
          tableauSynthese: fiche.blueprintSections.tableauSynthese?.map((item) => ({
            ...item,
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
          etapesCles: fiche.blueprintSections.etapesCles?.map((item) => ({
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
          distinctions: fiche.blueprintSections.distinctions?.map((item) => ({
            axe: normalizeDisplayText(item.axe),
            gauche: normalizeDisplayText(item.gauche),
            droite: normalizeDisplayText(item.droite),
          })),
          pseudoCode: fiche.blueprintSections.pseudoCode?.map((item) => ({
            ligne: normalizeDisplayText(item.ligne),
            explication: item.explication ? normalizeDisplayText(item.explication) : undefined,
          })),
          casLimites: fiche.blueprintSections.casLimites?.map((item) => normalizeDisplayText(item)),
          reperes: fiche.blueprintSections.reperes?.map((item) => ({
            titre: normalizeDisplayText(item.titre),
            detail: normalizeDisplayText(item.detail),
          })),
          classifications: fiche.blueprintSections.classifications?.map((item) => ({
            categorie: normalizeDisplayText(item.categorie),
            elements: item.elements.map((element) => normalizeDisplayText(element)),
          })),
          applications: fiche.blueprintSections.applications?.map((item) => ({
            ...item,
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
        }
      : undefined,
    notionsCles: fiche.notionsCles?.map((item) => normalizeDisplayText(item)),
    formulesCles: fiche.formulesCles?.map((item) => normalizeDisplayFormula(item)).filter((item) => isDisplayFormula(item)),
    proprietesCles: fiche.proprietesCles?.map((item) => normalizeDisplayText(item)).filter((item) => isDisplayProperty(item)),
  };
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <p className="reviz-fiche-section-label">{children}</p>;
}

type FicheSectionKey =
  | "imageMentale"
  | "definition"
  | "notions"
  | "blueprint"
  | "formules"
  | "proprietes"
  | "exemple"
  | "piege"
  | "schema"
  | "feynman"
  | "flashcards";

const DEFAULT_SECTION_ORDER: FicheSectionKey[] = [
  "imageMentale",
  "definition",
  "notions",
  "exemple",
  "piege",
  "blueprint",
  "formules",
  "proprietes",
  "schema",
  "feynman",
  "flashcards",
];

const SECTION_ORDER_BY_BLUEPRINT: Record<string, FicheSectionKey[]> = {
  formulaire: [
    "imageMentale",
    "definition",
    "formules",
    "proprietes",
    "blueprint",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
  ],
  mecanisme: [
    "imageMentale",
    "definition",
    "blueprint",
    "exemple",
    "schema",
    "proprietes",
    "piege",
    "feynman",
    "flashcards",
  ],
  chronologie: [
    "imageMentale",
    "definition",
    "blueprint",
    "schema",
    "exemple",
    "proprietes",
    "piege",
    "feynman",
    "flashcards",
  ],
  comparaison: [
    "imageMentale",
    "definition",
    "notions",
    "blueprint",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
  ],
  algorithmique: [
    "imageMentale",
    "definition",
    "blueprint",
    "schema",
    "exemple",
    "piege",
    "formules",
    "proprietes",
    "feynman",
    "flashcards",
  ],
  "cas-pratique": [
    "imageMentale",
    "definition",
    "blueprint",
    "exemple",
    "piege",
    "schema",
    "proprietes",
    "feynman",
    "flashcards",
  ],
  taxonomie: [
    "imageMentale",
    "definition",
    "notions",
    "blueprint",
    "schema",
    "proprietes",
    "exemple",
    "piege",
    "feynman",
    "flashcards",
  ],
  concepts: DEFAULT_SECTION_ORDER,
};

function getSectionOrder(blueprintId?: string) {
  return SECTION_ORDER_BY_BLUEPRINT[blueprintId ?? "concepts"] ?? DEFAULT_SECTION_ORDER;
}

function buildMentalAnchors(fiche: FicheGeneree) {
  return [
    { label: "Idee cle", content: fiche.imageMentale.titre },
    { label: "A retenir", content: fiche.definition },
    { label: "Attention", content: fiche.piege },
  ];
}

function buildSchemaReadingGrid(fiche: FicheGeneree) {
  return fiche.schema.elements.slice(0, 4).map((element, index, elements) => ({
    title:
      fiche.blueprintId === "chronologie"
        ? index === 0
          ? "Repere de depart"
          : index === elements.length - 1
            ? "Repere cle"
            : `Temps 0${index + 1}`
        : fiche.blueprintId === "algorithmique"
          ? index === 0
            ? "Entree"
            : index === elements.length - 1
              ? "Sortie"
              : `Etat 0${index + 1}`
          : index === 0
            ? "Point de depart"
            : index === elements.length - 1
              ? "Resultat"
              : `Etape 0${index + 1}`,
    content: element.label,
  }));
}

function buildConnectionNarrative(fiche: FicheGeneree) {
  return fiche.schema.connexions.slice(0, 5).map((connexion, index) => {
    const from = fiche.schema.elements.find((element) => element.id === connexion.de)?.label ?? connexion.de;
    const to = fiche.schema.elements.find((element) => element.id === connexion.vers)?.label ?? connexion.vers;
    const verb = connexion.label?.trim() || "mene a";

    if (fiche.blueprintId === "chronologie") {
      return `${index + 1}. ${from} puis ${to}`;
    }

    if (fiche.blueprintId === "algorithmique") {
      return `${index + 1}. Etat ${from} -> ${to} (${verb})`;
    }

    return `${index + 1}. ${from} ${verb} ${to}`;
  });
}

function renderBlueprintContent(fiche: FicheGeneree) {
  const sections = fiche.blueprintSections;
  if (!sections) {
    return null;
  }

  return (
    <>
      {sections.tableauSynthese?.length ? (
        <>
          <SectionLabel>Tableau de synthese</SectionLabel>
          <div className="reviz-blueprint-grid">
            {sections.tableauSynthese.map((item) => (
              <article key={`${item.titre}-${item.contenu}`} className={`reviz-blueprint-card reviz-blueprint-card-${item.accent ?? "bleu"}`}>
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer content={item.contenu} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}

      {sections.etapesCles?.length ? (
        <>
          <SectionLabel>Etapes a suivre</SectionLabel>
          <div className="reviz-steps">
            {sections.etapesCles.map((step, index) => (
              <article key={`${step.titre}-${index}`} className="reviz-step-card">
                <div className="reviz-step-badge">{index + 1}</div>
                <div>
                  <p className="reviz-blueprint-card-title">{step.titre}</p>
                  <MathRenderer content={step.contenu} className="reviz-blueprint-card-text" />
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {sections.distinctions?.length ? (
        <>
          <SectionLabel>Distinctions utiles</SectionLabel>
          <div className="reviz-comparison-grid">
            {sections.distinctions.map((item) => (
              <article key={`${item.axe}-${item.gauche}-${item.droite}`} className="reviz-comparison-card">
                <p className="reviz-blueprint-card-title">{item.axe}</p>
                <div className="reviz-comparison-columns">
                  <p>{item.gauche}</p>
                  <p>{item.droite}</p>
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {sections.pseudoCode?.length ? (
        <>
          <SectionLabel>Logique a suivre</SectionLabel>
          <div className="reviz-pseudocode">
            {sections.pseudoCode.map((item) => (
              <div key={item.ligne} className="reviz-pseudocode-line">
                <code>{item.ligne}</code>
                {item.explication ? <p>{item.explication}</p> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {sections.reperes?.length ? (
        <>
          <SectionLabel>Reperes a memoriser</SectionLabel>
          <div className="reviz-reperes">
            {sections.reperes.map((item) => (
              <article key={`${item.titre}-${item.detail}`} className="reviz-repere-card">
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer content={item.detail} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}

      {sections.classifications?.length ? (
        <>
          <SectionLabel>Organisation du chapitre</SectionLabel>
          <div className="reviz-classification-grid">
            {sections.classifications.map((item) => (
              <article key={item.categorie} className="reviz-classification-card">
                <p className="reviz-blueprint-card-title">{item.categorie}</p>
                <ul>
                  {item.elements.map((element) => (
                    <li key={element}>{element}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {sections.casLimites?.length ? (
        <>
          <SectionLabel>Cas limites a retenir</SectionLabel>
          <div className="reviz-pills-wrap">
            {sections.casLimites.map((item) => (
              <span key={item} className="reviz-case-pill">{item}</span>
            ))}
          </div>
        </>
      ) : null}

      {sections.applications?.length ? (
        <>
          <SectionLabel>Applications directes</SectionLabel>
          <div className="reviz-blueprint-grid">
            {sections.applications.map((item) => (
              <article key={`${item.titre}-${item.contenu}`} className={`reviz-blueprint-card reviz-blueprint-card-${item.accent ?? "menthe"}`}>
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer content={item.contenu} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function FicheRenderer({ fiche }: FicheRendererProps) {
  const displayFiche = normalizeFicheForDisplay(fiche);
  const anchors = buildMentalAnchors(displayFiche);
  const schemaReadingGrid = buildSchemaReadingGrid(displayFiche);
  const connectionNarrative = buildConnectionNarrative(displayFiche);
  const sectionOrder = getSectionOrder(displayFiche.blueprintId);
  const blueprintSection = renderBlueprintContent(displayFiche);
  const sectionMap: Record<FicheSectionKey, ReactElement | null> = {
    imageMentale: (
      <div key="imageMentale">
        <SectionLabel>Image mentale - retiens ca d'abord</SectionLabel>
        <FicheImageMentaleBlock imageMentale={displayFiche.imageMentale} />
        <div className="fiche-anchor-grid">
          {anchors.map((anchor) => (
            <article key={anchor.label} className="fiche-anchor-card">
              <p className="fiche-anchor-label">{anchor.label}</p>
              <p className="fiche-anchor-text">{anchor.content}</p>
            </article>
          ))}
        </div>
      </div>
    ),
    definition: (
      <div key="definition">
        <SectionLabel>Definition</SectionLabel>
        <FicheContentBlock type="definition" content={displayFiche.definition} />
      </div>
    ),
    notions: displayFiche.notionsCles?.length ? (
      <div key="notions">
        <SectionLabel>Notions cles</SectionLabel>
        <div className="fiche-schema-legend">
          {displayFiche.notionsCles.map((item) => (
            <div key={`notion-${item}`} className="fiche-schema-legend-item">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null,
    blueprint: blueprintSection ? (
      <div key="blueprint">{blueprintSection}</div>
    ) : null,
    formules: displayFiche.formulesCles?.length ? (
      <div key="formules">
        <SectionLabel>Formules a memoriser</SectionLabel>
        <div className="fiche-logic-strip fiche-logic-strip-formulas">
          <div className="fiche-logic-list fiche-logic-list-formulas">
            {displayFiche.formulesCles.map((item) => (
              <MathRenderer
                key={`formule-${item}`}
                content={item}
                className="fiche-logic-item fiche-logic-item-formula"
              />
            ))}
          </div>
        </div>
      </div>
    ) : null,
    proprietes: displayFiche.proprietesCles?.length ? (
      <div key="proprietes">
        <SectionLabel>Points a connaitre</SectionLabel>
        <div className="fiche-logic-strip fiche-logic-strip-properties">
          <div className="fiche-logic-list fiche-logic-list-properties">
            {displayFiche.proprietesCles.map((item, index) => (
              <div
                key={`propriete-${item}`}
                className="fiche-logic-item fiche-logic-item-property"
                data-number={String(index + 1).padStart(2, "0")}
              >
                <MathRenderer content={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null,
    exemple: (
      <div key="exemple">
        <SectionLabel>Exemple concret</SectionLabel>
        <FicheContentBlock type="exemple" content={displayFiche.exemple} />
      </div>
    ),
    piege: (
      <div key="piege">
        <SectionLabel>Piege classique</SectionLabel>
        <FicheContentBlock type="piege" content={displayFiche.piege} />
      </div>
    ),
    schema: (
      <div key="schema">
        <SectionLabel>Carte mentale</SectionLabel>
        <FicheSchemaVisuel schema={displayFiche.schema} blueprintId={displayFiche.blueprintId} />
        <div className="fiche-schema-reading-grid">
          {schemaReadingGrid.map((item) => (
            <article key={`${item.title}-${item.content}`} className="fiche-schema-reading-card">
              <p className="fiche-anchor-label">{item.title}</p>
              <p className="fiche-anchor-text">{item.content}</p>
            </article>
          ))}
        </div>
        <div className="fiche-logic-strip">
          <p className="fiche-logic-title">Parcours logique a retenir</p>
          <div className="fiche-logic-list">
            {connectionNarrative.map((item) => (
              <p key={item} className="fiche-logic-item">
                {item}
              </p>
            ))}
          </div>
        </div>
      </div>
    ),
    feynman: (
      <div key="feynman">
        <SectionLabel>Methode Feynman - explique a un enfant de 10 ans</SectionLabel>
        <FicheFeynman texte={displayFiche.feynman} />
      </div>
    ),
    flashcards: (
      <div key="flashcards">
        <SectionLabel>Flashcards</SectionLabel>
        <FicheFlashcards flashcards={displayFiche.flashcards} blueprintId={displayFiche.blueprintId} />
      </div>
    ),
  };
  const orderedSections = sectionOrder
    .map((key) => sectionMap[key])
    .filter((section): section is ReactElement => section !== null);

  return (
    <div className="reviz-fiche-page">
      <FicheHeader
        titre={displayFiche.titre}
        matiere={displayFiche.matiere}
        niveau={displayFiche.niveau}
        metriques={displayFiche.metriques}
      />
      {orderedSections.map((section, index) => (
        <div key={`section-${index}`}>
          <Divider />
          {section}
        </div>
      ))}
    </div>
  );
}
