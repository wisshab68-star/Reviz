"use client";

import { FicheContentBlock } from "@/components/fiche/FicheContentBlock";
import { FicheFeynman } from "@/components/fiche/FicheFeynman";
import { FicheFlashcards } from "@/components/fiche/FicheFlashcards";
import { FicheHeader } from "@/components/fiche/FicheHeader";
import { FicheImageMentaleBlock } from "@/components/fiche/FicheImageMentaleBlock";
import { FicheSchemaVisuel } from "@/components/fiche/FicheSchemaVisuel";
import { MathRenderer } from "@/components/math-renderer";
import { detectSubjectFamily, getFormulesSectionLabel } from "@/lib/subject-families";
import { looksLikeFormula, sanitizeAiText } from "@/lib/text";
import type { FicheGeneree, ZonedBlock, ZonedFiche } from "@/types/fiche-generated";
import type { ReactElement, ReactNode } from "react";

type RenderableFiche = FicheGeneree | ZonedFiche;

interface FicheRendererProps {
  fiche: RenderableFiche;
  sheetId?: string;
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
  let cleaned = sanitizeAiText(value).trim();
  // Fix common non-LaTeX operators that the AI generates as plain text
  cleaned = cleaned
    .replace(/<\s*=/g, "\\leq ")
    .replace(/>\s*=/g, "\\geq ")
    .replace(/!=/g, "\\neq ");
  // If the formula has no LaTeX delimiters, wrap it in $$ for KaTeX rendering
  if (!/^\$\$|^\\\(|^\$/.test(cleaned) && /[=^_\\]/.test(cleaned)) {
    return `$$${cleaned}$$`;
  }
  return cleaned;
}

function isTruncatedNodeLabel(label: string) {
  return label.trim().length < 4
    || ["probl", "ainsi", "terre", "suite", "cause", "donc", "etat", "premi", "deuxi", "troisi"].includes(
      label.trim().toLowerCase(),
    );
}

function isDisplayFormula(value: string) {
  return looksLikeFormula(value);
}

function normalizeDisplayFormules(
  values: string[] | undefined,
  subjectFamily: ReturnType<typeof detectSubjectFamily>,
) {
  if (!values?.length) {
    return [];
  }

  // Always apply formula normalization — formulesCles always contain math-like content
  return values
    .map((item) => normalizeDisplayFormula(item))
    .filter((item) => subjectFamily === "exact_sciences" || subjectFamily === "life_sciences"
      ? isDisplayFormula(item)
      : item.length > 0);
}

function isDisplayProperty(value: string) {
  return value.length >= 25 && !/^(les|partie|chapitre|section)\b/i.test(value) && !/^\d+[\).:-]/.test(value);
}

function normalizeFicheForDisplay<T extends RenderableFiche>(fiche: T): T {
  const subjectFamily = ("subjectFamily" in fiche && fiche.subjectFamily)
    ? fiche.subjectFamily
    : detectSubjectFamily(fiche.matiere);
  const blueprintSections = "blueprintSections" in fiche ? fiche.blueprintSections : undefined;
  const safeMetriques = Array.isArray(fiche.metriques) ? fiche.metriques : [];
  const safeImageMentale = fiche.imageMentale ?? {
    titre: "Image mentale",
    texte: "Aucune image mentale n'est disponible pour cette fiche.",
  };
  const safeSchema = fiche.schema ?? {
    type: "relations",
    description: "",
    elements: [],
    connexions: [],
  };
  const normalized = {
    ...fiche,
    titre: normalizeDisplayText(fiche.titre),
    matiere: normalizeDisplayText(fiche.matiere),
    niveau: normalizeDisplayText(fiche.niveau),
    metriques: safeMetriques.map((metric) => ({
      valeur: normalizeDisplayText(metric.valeur),
      label: normalizeDisplayText(metric.label),
    })),
    imageMentale: {
      titre: normalizeDisplayText(safeImageMentale.titre),
      texte: normalizeDisplayText(safeImageMentale.texte),
    },
    definition: normalizeDisplayText(fiche.definition),
    exemple: normalizeDisplayText(fiche.exemple),
    piege: normalizeDisplayText(fiche.piege),
    schema: {
      ...safeSchema,
      description: normalizeDisplayText(safeSchema.description),
      elements: safeSchema.elements.map((element) => ({
        ...element,
        label: isTruncatedNodeLabel(normalizeDisplayText(element.label))
          ? "[concept manquant]"
          : normalizeDisplayText(element.label),
      })),
      connexions: safeSchema.connexions.map((connexion) => ({
        ...connexion,
        label: connexion.label ? normalizeDisplayText(connexion.label) : undefined,
      })),
    },
    feynman: normalizeDisplayText(fiche.feynman),
    flashcards: fiche.flashcards.map((flashcard) => ({
      question: normalizeDisplayText(flashcard.question),
      reponse: normalizeDisplayText(flashcard.reponse),
    })),
    blueprintSections: blueprintSections
      ? {
          tableauSynthese: blueprintSections.tableauSynthese?.map((item) => ({
            ...item,
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
          etapesCles: blueprintSections.etapesCles?.map((item) => ({
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
          distinctions: blueprintSections.distinctions?.map((item) => ({
            axe: normalizeDisplayText(item.axe),
            gauche: normalizeDisplayText(item.gauche),
            droite: normalizeDisplayText(item.droite),
          })),
          pseudoCode: blueprintSections.pseudoCode?.map((item) => ({
            ligne: normalizeDisplayText(item.ligne),
            explication: item.explication ? normalizeDisplayText(item.explication) : undefined,
          })),
          casLimites: blueprintSections.casLimites?.map((item) => normalizeDisplayText(item)),
          reperes: blueprintSections.reperes?.map((item) => ({
            titre: normalizeDisplayText(item.titre),
            detail: normalizeDisplayText(item.detail),
          })),
          classifications: blueprintSections.classifications?.map((item) => ({
            categorie: normalizeDisplayText(item.categorie),
            elements: item.elements.map((element) => normalizeDisplayText(element)),
          })),
          applications: blueprintSections.applications?.map((item) => ({
            ...item,
            titre: normalizeDisplayText(item.titre),
            contenu: normalizeDisplayText(item.contenu),
          })),
        }
      : undefined,
    notionsCles: fiche.notionsCles?.map((item) => normalizeDisplayText(item)),
    formulesCles: normalizeDisplayFormules(fiche.formulesCles, subjectFamily),
    proprietesCles: fiche.proprietesCles?.map((item) => normalizeDisplayText(item)).filter((item) => isDisplayProperty(item)),
  } as T;

  if ("anchorImageMentale" in fiche) {
    const zoned = normalized as ZonedFiche;
    zoned.anchorImageMentale = {
      titre: normalizeDisplayText(fiche.anchorImageMentale.titre),
      texte: normalizeDisplayText(fiche.anchorImageMentale.texte),
    };
    zoned.anchorDefinition = normalizeDisplayText(fiche.anchorDefinition);
    zoned.coreBlocks = fiche.coreBlocks.map((block) => ({
      ...block,
      title: normalizeDisplayText(block.title),
      content: block.type === "formula" ? normalizeDisplayFormula(block.content) : normalizeDisplayText(block.content),
    }));
    zoned.actionExample = normalizeDisplayText(fiche.actionExample);
    zoned.actionTrap = normalizeDisplayText(fiche.actionTrap);
    zoned.actionQuiz = fiche.actionQuiz?.map((flashcard) => ({
      question: normalizeDisplayText(flashcard.question),
      reponse: normalizeDisplayText(flashcard.reponse),
    }));
  }

  return normalized;
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
  "formules",
  "notions",
  "exemple",
  "piege",
  "schema",
  "feynman",
  "flashcards",
  "blueprint",
];

const SECTION_ORDER_BY_BLUEPRINT: Record<string, FicheSectionKey[]> = {
  formulaire: [
    "imageMentale",
    "definition",
    "formules",
    "notions",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  mecanisme: [
    "imageMentale",
    "definition",
    "notions",
    "exemple",
    "schema",
    "piege",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  chronologie: [
    "imageMentale",
    "definition",
    "notions",
    "schema",
    "exemple",
    "piege",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  comparaison: [
    "imageMentale",
    "definition",
    "notions",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  algorithmique: [
    "imageMentale",
    "definition",
    "formules",
    "notions",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  "cas-pratique": [
    "imageMentale",
    "definition",
    "notions",
    "exemple",
    "piege",
    "schema",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  taxonomie: [
    "imageMentale",
    "definition",
    "notions",
    "schema",
    "exemple",
    "piege",
    "feynman",
    "flashcards",
    "blueprint",
  ],
  concepts: DEFAULT_SECTION_ORDER,
};

const PRINT_RECTO_KEYS: FicheSectionKey[] = [
  "imageMentale",
  "definition",
  "formules",
  "notions",
  "proprietes",
];

const PRINT_VERSO_KEYS: FicheSectionKey[] = [
  "exemple",
  "piege",
  "schema",
  "feynman",
  "flashcards",
  "blueprint",
];

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
  const explicitNarrative = fiche.schema.connexions.slice(0, 5).map((connexion, index) => {
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

  if (explicitNarrative.length > 0) {
    return explicitNarrative;
  }

  const fallbackElements = fiche.schema.elements
    .map((element) => element.label)
    .filter((label) => label && label !== "[concept manquant]")
    .slice(0, 3);

  if (fallbackElements.length >= 3) {
    return [
      `1. ${fallbackElements[0]} -> ${fallbackElements[1]} -> ${fallbackElements[2]}`,
    ];
  }

  return [];
}

function isZonedFiche(fiche: RenderableFiche): fiche is ZonedFiche {
  return Array.isArray((fiche as ZonedFiche).coreBlocks) && (fiche as ZonedFiche).coreBlocks.length > 0;
}

function renderZonedBlock(block: ZonedBlock) {
  return (
    <article key={block.id} className={`reviz-zoned-block reviz-level-${block.level}`}>
      <span className="reviz-block-type-badge">{block.type}</span>
      <p className="reviz-block-title">{block.title}</p>
      <MathRenderer text={block.content} className="reviz-block-content" />
    </article>
  );
}

function renderBlueprintContent(fiche: Pick<FicheGeneree, "blueprintSections">) {
  const sections = fiche.blueprintSections;
  if (!sections) {
    return null;
  }

  const hasTableauSynthese = Boolean(sections.tableauSynthese && sections.tableauSynthese.length > 0);
  const hasEtapes = Boolean(sections.etapesCles && sections.etapesCles.length > 0);
  const hasDistinctions = Boolean(sections.distinctions && sections.distinctions.length > 0);
  const hasPseudoCode = Boolean(sections.pseudoCode && sections.pseudoCode.length > 0);
  const hasReperes = Boolean(sections.reperes && sections.reperes.length > 0);
  const hasClassifications = Boolean(sections.classifications && sections.classifications.length > 0);
  const hasCasLimites = Boolean(sections.casLimites && sections.casLimites.length > 0);
  const hasApplications = Boolean(sections.applications && sections.applications.length > 0);
  const tableauSynthese = sections.tableauSynthese ?? [];
  const etapesCles = sections.etapesCles ?? [];
  const distinctions = sections.distinctions ?? [];
  const pseudoCode = sections.pseudoCode ?? [];
  const reperes = sections.reperes ?? [];
  const classifications = sections.classifications ?? [];
  const casLimites = sections.casLimites ?? [];
  const applications = sections.applications ?? [];

  if (!hasTableauSynthese && !hasEtapes && !hasDistinctions && !hasPseudoCode && !hasReperes && !hasClassifications && !hasCasLimites && !hasApplications) {
    return null;
  }

  return (
    <>
      {hasTableauSynthese ? (
        <>
          <SectionLabel>Tableau de synthese</SectionLabel>
          <div className="reviz-blueprint-grid">
            {tableauSynthese.map((item) => (
              <article key={`${item.titre}-${item.contenu}`} className={`reviz-blueprint-card reviz-blueprint-card-${item.accent ?? "bleu"}`}>
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer text={item.contenu} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}

      {hasEtapes ? (
        <>
          <SectionLabel>Etapes a suivre</SectionLabel>
          <div className="reviz-steps">
            {etapesCles.map((step, index) => (
              <article key={`${step.titre}-${index}`} className="reviz-step-card">
                <div className="reviz-step-badge">{index + 1}</div>
                <div>
                  <p className="reviz-blueprint-card-title">{step.titre}</p>
                  <MathRenderer text={step.contenu} className="reviz-blueprint-card-text" />
                </div>
              </article>
            ))}
          </div>
        </>
      ) : null}

      {hasDistinctions ? (
        <>
          <SectionLabel>Distinctions utiles</SectionLabel>
          <div className="reviz-comparison-grid">
            {distinctions.map((item) => (
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

      {hasPseudoCode ? (
        <>
          <SectionLabel>Logique a suivre</SectionLabel>
          <div className="reviz-pseudocode">
            {pseudoCode.map((item) => (
              <div key={item.ligne} className="reviz-pseudocode-line">
                <code>{item.ligne}</code>
                {item.explication ? <p>{item.explication}</p> : null}
              </div>
            ))}
          </div>
        </>
      ) : null}

      {hasReperes ? (
        <>
          <SectionLabel>Reperes a memoriser</SectionLabel>
          <div className="reviz-reperes">
            {reperes.map((item) => (
              <article key={`${item.titre}-${item.detail}`} className="reviz-repere-card">
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer text={item.detail} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}

      {hasClassifications ? (
        <>
          <SectionLabel>Organisation du chapitre</SectionLabel>
          <div className="reviz-classification-grid">
            {classifications.map((item) => (
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

      {hasCasLimites ? (
        <>
          <SectionLabel>Cas limites a retenir</SectionLabel>
          <div className="reviz-pills-wrap">
            {casLimites.map((item) => (
              <span key={item} className="reviz-case-pill">{item}</span>
            ))}
          </div>
        </>
      ) : null}

      {hasApplications ? (
        <>
          <SectionLabel>Applications directes</SectionLabel>
          <div className="reviz-blueprint-grid">
            {applications.map((item) => (
              <article key={`${item.titre}-${item.contenu}`} className={`reviz-blueprint-card reviz-blueprint-card-${item.accent ?? "menthe"}`}>
                <p className="reviz-blueprint-card-title">{item.titre}</p>
                <MathRenderer text={item.contenu} className="reviz-blueprint-card-text" />
              </article>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}

export function FicheRenderer({ fiche, sheetId }: FicheRendererProps) {
  const displayFiche = normalizeFicheForDisplay(fiche);
  const subjectFamily = displayFiche.subjectFamily ?? detectSubjectFamily(displayFiche.matiere);
  const formulesLabel = getFormulesSectionLabel(subjectFamily);
  const handlePrint = () => {
    window.print();
  };

  if (isZonedFiche(displayFiche)) {
    return (
      <div className="reviz-fiche-page fiche-container" style={{ background: "#FFFFFF", color: "#000000" }}>
        <FicheHeader
          titre={displayFiche.titre}
          matiere={displayFiche.matiere}
          niveau={displayFiche.niveau}
          metriques={displayFiche.metriques}
        />
        <Divider />
        <div className="reviz-zone-anchor" data-print="section">
          <SectionLabel>Zone ancre</SectionLabel>
          <FicheImageMentaleBlock imageMentale={displayFiche.anchorImageMentale} />
          <div className="reviz-zoned-definition">
            <p className="reviz-zone-label">Definition cle</p>
            <FicheContentBlock type="definition" content={displayFiche.anchorDefinition} />
          </div>
        </div>
        <Divider />
        <div className="reviz-zone-core" data-print="section">
          <p className="reviz-zone-label">Zone coeur</p>
          <div className="reviz-zoned-core-list">
            {displayFiche.coreBlocks.map((block) => renderZonedBlock(block))}
          </div>
        </div>
        {displayFiche.formulesCles?.length ? (
          <>
            <Divider />
            <div className="reviz-zone-core" data-print="section">
              <SectionLabel>{formulesLabel}</SectionLabel>
              <div className="fiche-logic-strip fiche-logic-strip-formulas">
                <div className="fiche-logic-list fiche-logic-list-formulas">
                  {displayFiche.formulesCles.map((item) => (
                    subjectFamily === "exact_sciences" || subjectFamily === "life_sciences" ? (
                      <MathRenderer
                        key={`zoned-formule-${item}`}
                        text={item}
                        className="fiche-logic-item fiche-logic-item-formula"
                      />
                    ) : (
                      <p key={`zoned-formule-${item}`} className="fiche-logic-item">
                        {item}
                      </p>
                    )
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
        {displayFiche.notionsCles?.length ? (
          <>
            <Divider />
            <div className="reviz-zone-core" data-print="section">
              <SectionLabel>Points a connaitre</SectionLabel>
              <div className="fiche-schema-legend" data-print="points-grid">
                {displayFiche.notionsCles.map((item) => (
                  <div key={`zoned-notion-${item}`} className="fiche-schema-legend-item">
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
        <Divider />
        <div className="reviz-zone-action" data-print="section">
          <p className="reviz-zone-label">Zone action</p>
          <div className="reviz-zoned-action-grid">
            <div>
              <SectionLabel>Exemple resolu</SectionLabel>
              <FicheContentBlock type="exemple" content={displayFiche.actionExample} />
            </div>
            <div>
              <SectionLabel>Piege detaille</SectionLabel>
              <FicheContentBlock type="piege" content={displayFiche.actionTrap} />
            </div>
          </div>
          <div data-print="feynman">
            <SectionLabel>Methode Feynman - explique a un enfant de 10 ans</SectionLabel>
            <FicheFeynman texte={displayFiche.feynman} />
          </div>
          {displayFiche.schema?.elements?.length ? (
            <>
              <SectionLabel>Carte mentale</SectionLabel>
              <FicheSchemaVisuel schema={displayFiche.schema} blueprintId={displayFiche.blueprintId} />
            </>
          ) : null}
          {displayFiche.blueprintSections ? (
            <div>{renderBlueprintContent({ blueprintSections: displayFiche.blueprintSections })}</div>
          ) : null}
          <SectionLabel>Flashcards</SectionLabel>
          <FicheFlashcards flashcards={displayFiche.actionQuiz ?? displayFiche.flashcards} blueprintId={displayFiche.blueprintId} />
          <button
            className="btn btn-soft reviz-print-btn print-hidden"
            onClick={handlePrint}
            type="button"
          >
            Imprimer la fiche
          </button>
        </div>
      </div>
    );
  }

  const anchors = buildMentalAnchors(displayFiche);
  const schemaReadingGrid = buildSchemaReadingGrid(displayFiche);
  const connectionNarrative = buildConnectionNarrative(displayFiche);
  const sectionOrder = getSectionOrder(displayFiche.blueprintId);
  const blueprintSection = renderBlueprintContent(displayFiche);
  const sectionMap: Record<FicheSectionKey, ReactElement | null> = {
    imageMentale: (
      <div key="imageMentale" data-print="section">
        <SectionLabel>Image mentale - retiens ca d'abord</SectionLabel>
        <FicheImageMentaleBlock imageMentale={displayFiche.imageMentale} />
        <div className="fiche-anchor-grid">
          {anchors.map((anchor) => (
            <article key={anchor.label} className="fiche-anchor-card">
              <p className="fiche-anchor-label">{anchor.label}</p>
              <MathRenderer text={anchor.content} className="fiche-anchor-text" />
            </article>
          ))}
        </div>
      </div>
    ),
    definition: (
      <div key="definition" data-print="section">
        <SectionLabel>Definition</SectionLabel>
        <FicheContentBlock type="definition" content={displayFiche.definition} />
      </div>
    ),
    notions: displayFiche.notionsCles?.length ? (
      <div key="notions" data-print="section">
        <SectionLabel>Points a connaitre</SectionLabel>
        <div className="fiche-schema-legend" data-print="points-grid">
          {displayFiche.notionsCles.map((item) => (
            <div key={`notion-${item}`} className="fiche-schema-legend-item">
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    ) : null,
    blueprint: blueprintSection ? (
      <div key="blueprint" data-print="section">{blueprintSection}</div>
    ) : null,
    formules: displayFiche.formulesCles?.length ? (
      <div key="formules" data-print="section">
        <SectionLabel>{formulesLabel}</SectionLabel>
        <div className="fiche-logic-strip fiche-logic-strip-formulas">
          <div className="fiche-logic-list fiche-logic-list-formulas">
            {displayFiche.formulesCles.map((item) => (
              <MathRenderer
                key={`formule-${item}`}
                text={item}
                className="fiche-logic-item fiche-logic-item-formula"
              />
            ))}
          </div>
        </div>
      </div>
    ) : null,
    proprietes: displayFiche.proprietesCles?.length ? (
      <div key="proprietes" data-print="section">
        <SectionLabel>Points a connaitre</SectionLabel>
        <div className="fiche-logic-strip fiche-logic-strip-properties">
          <div className="fiche-logic-list fiche-logic-list-properties">
            {displayFiche.proprietesCles.map((item, index) => (
              <div
                key={`propriete-${item}`}
                className={`fiche-logic-item fiche-logic-item-property${index < 3 ? " fiche-logic-item-essential" : ""}`}
                data-number={String(index + 1).padStart(2, "0")}
              >
                <MathRenderer text={item} />
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : null,
    exemple: displayFiche.exemple ? (
      <div key="exemple" data-print="section">
        <SectionLabel>Exemple concret</SectionLabel>
        <FicheContentBlock type="exemple" content={displayFiche.exemple} />
      </div>
    ) : null,
    piege: (
      <div key="piege" data-print="section">
        <SectionLabel>Piege classique</SectionLabel>
        <FicheContentBlock type="piege" content={displayFiche.piege} />
      </div>
    ),
    schema: (
      <div key="schema" data-print="section">
        <SectionLabel>Structure du cours</SectionLabel>
        {/* Rendu linéaire numéroté en priorité — SVG en fallback si les éléments sont riches */}
        {displayFiche.schema?.elements && displayFiche.schema.elements.length > 0 ? (
          <div className="fiche-tree-structure">
            {displayFiche.schema.elements.map((el, idx) => (
              <div key={el.id ?? idx} className="fiche-tree-item">
                <span className="fiche-tree-number">{String(idx + 1).padStart(2, '0')}</span>
                <span className="fiche-tree-label">{el.label}</span>
              </div>
            ))}
          </div>
        ) : (
          <FicheSchemaVisuel schema={displayFiche.schema} blueprintId={displayFiche.blueprintId} />
        )}
        <div className="fiche-schema-reading-grid" data-print="etapes-wrapper">
          {schemaReadingGrid.map((item) => (
            <article key={`${item.title}-${item.content}`} className="fiche-schema-reading-card">
              <p className="fiche-anchor-label">{item.title}</p>
              <p className="fiche-anchor-text">{item.content}</p>
            </article>
          ))}
        </div>
        <div data-print="parcours-wrapper">
          <div className="fiche-logic-strip" data-print="parcours-logique">
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
      </div>
    ),
    feynman: (
      <div key="feynman" data-print="feynman">
        <SectionLabel>Methode Feynman - explique a un enfant de 10 ans</SectionLabel>
        <FicheFeynman texte={displayFiche.feynman} />
      </div>
    ),
    flashcards: (
      <div key="flashcards" data-print="section">
        <SectionLabel>Flashcards</SectionLabel>
        <FicheFlashcards flashcards={displayFiche.flashcards} blueprintId={displayFiche.blueprintId} />
      </div>
    ),
  };
  const MAX_SECTIONS = 8;
  const allSectionKeys = sectionOrder.filter((key) => sectionMap[key] !== null);
  if (allSectionKeys.length > MAX_SECTIONS) {
    console.warn(`⚠️ Reviz: ${allSectionKeys.length} sections détectées, limité à ${MAX_SECTIONS}`);
  }
  const orderedSectionKeys = allSectionKeys.slice(0, MAX_SECTIONS);
  const firstVersoKey = orderedSectionKeys.find((key) => PRINT_VERSO_KEYS.includes(key));

  return (
    <div className="reviz-fiche-page fiche-container" style={{ background: "#FFFFFF", color: "#000000" }}>
      <FicheHeader
        titre={displayFiche.titre}
        matiere={displayFiche.matiere}
        niveau={displayFiche.niveau}
        metriques={displayFiche.metriques}
      />
      {orderedSectionKeys.map((key) => {
        const section = sectionMap[key];
        if (!section) {
          return null;
        }

        const printBucketClass = PRINT_RECTO_KEYS.includes(key)
          ? "reviz-print-section-recto"
          : "reviz-print-section-verso";
        const printBreakClass = key === firstVersoKey ? " reviz-print-break-before" : "";

        return (
          <div
            key={`section-${key}`}
            className={`reviz-print-section reviz-print-section-${key} ${printBucketClass}${printBreakClass}`}
            data-print={key === "feynman" ? "feynman-wrapper" : "section"}
          >
          <Divider />
          {section}
          </div>
        );
      })}
      <button
        className="btn btn-soft reviz-print-btn print-hidden"
        onClick={handlePrint}
        type="button"
      >
        Imprimer la fiche
      </button>
    </div>
  );
}
