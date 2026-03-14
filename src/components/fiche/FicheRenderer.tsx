import { FicheContentBlock } from "@/components/fiche/FicheContentBlock";
import { FicheFeynman } from "@/components/fiche/FicheFeynman";
import { FicheFlashcards } from "@/components/fiche/FicheFlashcards";
import { FicheHeader } from "@/components/fiche/FicheHeader";
import { FicheImageMentaleBlock } from "@/components/fiche/FicheImageMentaleBlock";
import { FicheSchemaVisuel } from "@/components/fiche/FicheSchemaVisuel";
import type { FicheGeneree } from "@/types/fiche-generated";

interface FicheRendererProps {
  fiche: FicheGeneree;
}

function Divider() {
  return <hr style={{ border: "none", borderTop: "0.5px solid var(--line)", margin: "1.5rem 0" }} />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 600,
        textTransform: "uppercase",
        letterSpacing: "0.07em",
        color: "var(--muted)",
        marginBottom: 10,
      }}
    >
      {children}
    </p>
  );
}

function buildMentalAnchors(fiche: FicheGeneree) {
  return [
    { label: "A voir", content: fiche.imageMentale.titre },
    { label: "A comprendre", content: fiche.definition },
    { label: "A eviter", content: fiche.piege },
  ].map((anchor) => ({
    ...anchor,
    content: anchor.content.length > 140 ? `${anchor.content.slice(0, 137).trim()}...` : anchor.content,
  }));
}

function buildSchemaReadingGrid(fiche: FicheGeneree) {
  return fiche.schema.elements.slice(0, 4).map((element, index, elements) => ({
    title: index === 0 ? "Point de depart" : index === elements.length - 1 ? "Resultat" : `Etape 0${index + 1}`,
    content: element.label,
  }));
}

function buildConnectionNarrative(fiche: FicheGeneree) {
  return fiche.schema.connexions.slice(0, 5).map((connexion, index) => {
    const from = fiche.schema.elements.find((element) => element.id === connexion.de)?.label ?? connexion.de;
    const to = fiche.schema.elements.find((element) => element.id === connexion.vers)?.label ?? connexion.vers;
    const verb = connexion.label?.trim() || "mene a";

    return `${index + 1}. ${from} ${verb} ${to}`;
  });
}

export function FicheRenderer({ fiche }: FicheRendererProps) {
  const anchors = buildMentalAnchors(fiche);
  const schemaReadingGrid = buildSchemaReadingGrid(fiche);
  const connectionNarrative = buildConnectionNarrative(fiche);

  return (
    <div style={{ maxWidth: 768, margin: "0 auto", padding: "0" }}>
      <FicheHeader
        titre={fiche.titre}
        matiere={fiche.matiere}
        niveau={fiche.niveau}
        metriques={fiche.metriques}
      />

      <Divider />

      <SectionLabel>Image mentale - retiens ca d'abord</SectionLabel>
      <FicheImageMentaleBlock imageMentale={fiche.imageMentale} />
      <div className="fiche-anchor-grid">
        {anchors.map((anchor) => (
          <article key={anchor.label} className="fiche-anchor-card">
            <p className="fiche-anchor-label">{anchor.label}</p>
            <p className="fiche-anchor-text">{anchor.content}</p>
          </article>
        ))}
      </div>

      <Divider />

      <SectionLabel>Definition</SectionLabel>
      <FicheContentBlock type="definition" content={fiche.definition} />

      <SectionLabel>Exemple concret</SectionLabel>
      <FicheContentBlock type="exemple" content={fiche.exemple} />

      <SectionLabel>Piege classique</SectionLabel>
      <FicheContentBlock type="piege" content={fiche.piege} />

      <Divider />

      <SectionLabel>Schema visuel</SectionLabel>
      <FicheSchemaVisuel schema={fiche.schema} />
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

      <Divider />

      <SectionLabel>Methode Feynman - explique a un enfant de 10 ans</SectionLabel>
      <FicheFeynman texte={fiche.feynman} />

      <Divider />

      <SectionLabel>Flashcards</SectionLabel>
      <FicheFlashcards flashcards={fiche.flashcards} />
    </div>
  );
}
