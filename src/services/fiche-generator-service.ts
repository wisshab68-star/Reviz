import { buildUserPrompt, FICHE_SYSTEM_PROMPT } from "@/lib/prompts/fiche-generator";
import { openai } from "@/lib/openai";
import { sanitizeJsonValue } from "@/lib/text";
import type { GenerateSheetRequest } from "@/lib/validations";
import type {
  FicheFlashcard,
  FicheGeneree,
  FicheMetrique,
  FicheSchema,
  FicheSchemaConnexion,
  FicheSchemaElement,
} from "@/types/fiche-generated";

function truncate(text: string, maxLength: number) {
  return text.length <= maxLength ? text : `${text.slice(0, maxLength - 3).trim()}...`;
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function splitSentences(content: string) {
  return content
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeText(sentence))
    .filter((sentence) => sentence.length > 20);
}

function extractKeywords(content: string) {
  const matches = content.match(/\b[A-Z][A-Za-z-]{3,}\b/g) ?? [];
  return [...new Set(matches.map((match) => normalizeText(match)))].slice(0, 8);
}

function extractNumbers(content: string) {
  return [...new Set(content.match(/\b\d+(?:[.,]\d+)?\b/g) ?? [])].slice(0, 8);
}

function ensureSentence(value: string, fallback: string, minLength: number, maxLength: number) {
  const cleaned = normalizeText(value);
  const safeValue = cleaned.length >= minLength ? cleaned : normalizeText(fallback);
  return truncate(safeValue, maxLength);
}

function inferSubject(content: string) {
  const lower = content.toLowerCase();

  if (/(vecteur|equation|fonction|derivee|geometr|algeb|theoreme|triangle|repere)/.test(lower)) {
    return "Mathematiques";
  }
  if (/(photosynthese|cellule|adn|ecosysteme|svt|chromosome|organe|respiration)/.test(lower)) {
    return "SVT";
  }
  if (/(revolution|empire|guerre|roi|histoire|republique|1789|1914|1945)/.test(lower)) {
    return "Histoire";
  }
  if (/(physique|force|energie|vitesse|mouvement|electricite|atome|molecule)/.test(lower)) {
    return "Physique-Chimie";
  }
  if (/(phrase|poesie|roman|figure de style|grammaire|conjugaison|texte)/.test(lower)) {
    return "Francais";
  }
  if (/(offre|demande|marche|croissance|inflation|economie|entreprise)/.test(lower)) {
    return "SES";
  }

  return "Cours";
}

function inferLevel(content: string) {
  const lower = content.toLowerCase();
  if (/(seconde|2nde)/.test(lower)) return "Seconde";
  if (/(premiere|1ere|1re)/.test(lower)) return "Premiere";
  if (/(terminale|bac)/.test(lower)) return "Terminale";
  if (/(licence|l1|l2|l3|universite)/.test(lower)) return "Licence";
  if (/(bts|dut|but)/.test(lower)) return "Post-bac";
  return "General";
}

function buildStrongMetrics(content: string, keywords: string[], sentences: string[]): FicheMetrique[] {
  const numbers = extractNumbers(content);
  const metrics: FicheMetrique[] = [];

  if (numbers[0]) {
    metrics.push({ valeur: numbers[0], label: "donnee cle" });
  }

  if (numbers[1]) {
    metrics.push({ valeur: numbers[1], label: "repere utile" });
  }

  if (keywords.length > 0) {
    metrics.push({ valeur: String(keywords.length), label: "notions majeures" });
  }

  while (metrics.length < 3) {
    const index = metrics.length;
    metrics.push({
      valeur: String(index === 0 ? sentences.length || 3 : index === 1 ? keywords.length || 4 : 4),
      label: index === 0 ? "etapes" : index === 1 ? "idees cles" : "flashcards",
    });
  }

  return metrics.slice(0, 3);
}

function buildSchemaElements(keywords: string[], sentences: string[]): FicheSchemaElement[] {
  const candidates = [
    keywords[0] ?? "Concept central",
    keywords[1] ?? "Definition",
    keywords[2] ?? "Condition",
    keywords[3] ?? "Mecanisme",
    keywords[4] ?? "Application",
    keywords[5] ?? "Resultat",
    sentences[0]?.slice(0, 28) ?? "",
    sentences[1]?.slice(0, 28) ?? "",
  ]
    .map((item) => normalizeText(item))
    .filter((item) => item.length > 0);

  const uniqueLabels = [...new Set(candidates)].slice(0, 6);
  const colors: FicheSchemaElement["couleur"][] = ["bleu", "teal", "violet", "coral", "gris", "teal"];

  return uniqueLabels.map((label, index) => ({
    id: `node_${index + 1}`,
    label: truncate(label, 34),
    couleur: colors[index] ?? "gris",
  }));
}

function buildSchemaConnexions(elements: FicheSchemaElement[]): FicheSchemaConnexion[] {
  const connexions: FicheSchemaConnexion[] = [];

  for (let index = 0; index < elements.length - 1; index += 1) {
    connexions.push({
      de: elements[index].id,
      vers: elements[index + 1].id,
      label: index === 0 ? "definit" : index === elements.length - 2 ? "aboutit a" : "entraine",
    });
  }

  if (elements.length >= 4) {
    connexions.push({
      de: elements[0].id,
      vers: elements[Math.min(3, elements.length - 1)].id,
      label: "structure",
    });
  }

  return connexions.slice(0, 8);
}

function buildFallbackSchema(content: string, keywords: string[], sentences: string[]): FicheSchema {
  const elements = buildSchemaElements(keywords, sentences);

  return {
    type: /formule|=|calcul/.test(content.toLowerCase()) ? "formule" : "processus",
    description:
      "Ce schema montre le concept central, ses conditions, son fonctionnement et son resultat pour visualiser rapidement la logique du cours.",
    elements,
    connexions: buildSchemaConnexions(elements),
  };
}

function buildFallbackFlashcards(sentences: string[], keywords: string[]): FicheFlashcard[] {
  return [
    {
      question: `Quelle notion faut-il definir en premier${keywords[0] ? ` : ${keywords[0]}` : " ?"}`,
      reponse: truncate(sentences[0] ?? "Il faut commencer par la notion centrale du cours.", 180),
    },
    {
      question: "Quel mecanisme ou quelle etape faut-il comprendre ?",
      reponse: truncate(sentences[1] ?? sentences[0] ?? "Il faut comprendre la logique interne du concept.", 180),
    },
    {
      question: "Quelle erreur classique faut-il eviter ?",
      reponse: truncate(sentences[2] ?? "Il ne faut pas confondre deux notions proches ni inverser les etapes.", 180),
    },
    {
      question: "Comment reconnaitre ce concept dans un exercice ?",
      reponse: truncate(
        sentences[3] ?? "Il faut identifier les indices, les relations et le vocabulaire cle du cours.",
        180,
      ),
    },
  ];
}

function normalizeMetrics(metrics: FicheMetrique[], fallback: FicheMetrique[]) {
  const normalized = metrics
    .filter((metric) => normalizeText(metric.valeur).length > 0 && normalizeText(metric.label).length > 0)
    .slice(0, 3)
    .map((metric) => ({
      valeur: truncate(normalizeText(metric.valeur), 24),
      label: truncate(normalizeText(metric.label), 32),
    }));

  while (normalized.length < 3) {
    normalized.push(fallback[normalized.length]);
  }

  return normalized;
}

function normalizeSchema(schema: FicheSchema, fallback: FicheSchema) {
  const elements = (schema.elements ?? [])
    .filter((element) => normalizeText(element.id).length > 0 && normalizeText(element.label).length > 0)
    .slice(0, 6)
    .map((element, index) => ({
      id: normalizeText(element.id) || `node_${index + 1}`,
      label: truncate(normalizeText(element.label), 34),
      couleur: element.couleur,
    }));

  fallback.elements.forEach((element) => {
    if (elements.length < 6 && !elements.some((item) => item.label === element.label)) {
      elements.push(element);
    }
  });

  const connexions = (schema.connexions ?? [])
    .filter((connexion) => normalizeText(connexion.de).length > 0 && normalizeText(connexion.vers).length > 0)
    .slice(0, 8)
    .map((connexion) => ({
      de: normalizeText(connexion.de),
      vers: normalizeText(connexion.vers),
      label: connexion.label ? truncate(normalizeText(connexion.label), 18) : undefined,
    }));

  while (connexions.length < 4 && elements.length > connexions.length + 1) {
    connexions.push({
      de: elements[connexions.length].id,
      vers: elements[connexions.length + 1].id,
      label: connexions.length === 0 ? "definit" : "mene a",
    });
  }

  return {
    ...fallback,
    ...schema,
    description: ensureSentence(schema.description ?? "", fallback.description, 50, 260),
    elements,
    connexions,
  };
}

function normalizeFlashcards(flashcards: FicheFlashcard[], fallback: FicheFlashcard[]) {
  const normalized = flashcards
    .filter(
      (flashcard) =>
        normalizeText(flashcard.question).length > 0 && normalizeText(flashcard.reponse).length > 0,
    )
    .slice(0, 4)
    .map((flashcard) => ({
      question: truncate(normalizeText(flashcard.question), 110),
      reponse: truncate(normalizeText(flashcard.reponse), 180),
    }));

  while (normalized.length < 4) {
    normalized.push(fallback[normalized.length]);
  }

  return normalized;
}

function enrichFiche(input: GenerateSheetRequest, fiche: FicheGeneree): FicheGeneree {
  const sentences = splitSentences(input.content);
  const keywords = extractKeywords(input.content);
  const subject = inferSubject(input.content);
  const level = inferLevel(input.content);
  const safeImageMentale = fiche.imageMentale ?? { titre: "", texte: "" };
  const safeSchema = fiche.schema ?? { type: "processus", description: "", elements: [], connexions: [] };
  const safeMetrics = Array.isArray(fiche.metriques) ? fiche.metriques : [];
  const safeFlashcards = Array.isArray(fiche.flashcards) ? fiche.flashcards : [];
  const fallbackSchema = buildFallbackSchema(input.content, keywords, sentences);
  const fallbackMetrics = buildStrongMetrics(input.content, keywords, sentences);
  const fallbackFlashcards = buildFallbackFlashcards(sentences, keywords);
  const fallbackDefinition = `Le concept central du cours est ${normalizeText(
    keywords[0] ?? "la notion principale",
  )}. ${truncate(sentences[0] ?? input.content, 220)}`;
  const fallbackExample = `Exemple concret : ${sentences[1] ?? sentences[0] ?? input.content}`;
  const fallbackTrap = `Piege classique : confondre ${normalizeText(
    keywords[0] ?? "la notion centrale",
  )} avec une idee voisine, ou oublier l'ordre logique du raisonnement.`;
  const fallbackImage = `Imagine ${keywords[0] ?? "le concept"} comme un repere visuel simple : ${truncate(
    sentences[1] ?? sentences[0] ?? input.content,
    160,
  )}`;
  const fallbackFeynman = `Explique-le comme a un enfant : ${keywords[0] ?? "ce concept"} fonctionne comme un systeme simple ou chaque etape prepare la suivante jusqu'au resultat final.`;

  return {
    ...fiche,
    titre: truncate(normalizeText(fiche.titre || input.titleHint || "Fiche de revision"), 60),
    matiere: normalizeText(fiche.matiere) || subject,
    niveau: normalizeText(fiche.niveau) || level,
    metriques: normalizeMetrics(safeMetrics, fallbackMetrics),
    imageMentale: {
      titre: truncate(normalizeText(safeImageMentale.titre || `Image mentale : ${keywords[0] ?? "idee centrale"}`), 60),
      texte: ensureSentence(safeImageMentale.texte, fallbackImage, 60, 240),
    },
    definition: ensureSentence(fiche.definition, fallbackDefinition, 90, 340),
    exemple: ensureSentence(fiche.exemple, fallbackExample, 70, 240),
    piege: ensureSentence(fiche.piege, fallbackTrap, 70, 240),
    schema: normalizeSchema(safeSchema, fallbackSchema),
    feynman: ensureSentence(fiche.feynman, fallbackFeynman, 90, 360),
    flashcards: normalizeFlashcards(safeFlashcards, fallbackFlashcards),
  };
}

function buildDemoFiche(input: GenerateSheetRequest): FicheGeneree {
  const sentences = splitSentences(input.content);
  const keywords = extractKeywords(input.content);
  const excerpt = normalizeText(input.content.slice(0, 180));
  const fallbackSchema = buildFallbackSchema(input.content, keywords, sentences);

  return {
    titre: input.titleHint?.trim() || "Fiche de revision",
    matiere: inferSubject(input.content),
    niveau: inferLevel(input.content),
    metriques: buildStrongMetrics(input.content, keywords, sentences),
    imageMentale: {
      titre: `Image mentale : ${keywords[0] ?? "idee centrale"}`,
      texte: `Imagine une scene tres simple : ${keywords[0] ?? "le concept"} agit comme un repere visuel qui organise tout le reste du cours. ${truncate(sentences[0] ?? excerpt, 150)}`,
    },
    definition: ensureSentence("", `Definition precise : ${sentences[0] ?? excerpt}`, 90, 320),
    exemple: ensureSentence("", `Exemple concret : ${sentences[1] ?? sentences[0] ?? excerpt}`, 70, 220),
    piege:
      "Piege classique : inverser les etapes, confondre deux notions proches ou apprendre la lecon sans comprendre la logique du cours.",
    schema: fallbackSchema,
    feynman:
      "Explique-le comme un enfant : on part d'une idee centrale, puis on suit quelques etapes simples qui montrent comment elle fonctionne et ce qu'elle produit.",
    flashcards: buildFallbackFlashcards(sentences, keywords),
  };
}

function validateFicheQuality(fiche: FicheGeneree): string[] {
  const issues: string[] = [];

  if (!fiche.definition || fiche.definition.length < 50) {
    issues.push(`definition trop courte (${fiche.definition?.length ?? 0} chars, min 50)`);
  }
  if (!fiche.exemple || fiche.exemple.length < 40) {
    issues.push(`exemple trop court (${fiche.exemple?.length ?? 0} chars, min 40)`);
  }
  if (!fiche.piege || fiche.piege.length < 40) {
    issues.push(`piege trop court (${fiche.piege?.length ?? 0} chars, min 40)`);
  }
  if (!fiche.feynman || fiche.feynman.length < 50) {
    issues.push(`feynman trop court (${fiche.feynman?.length ?? 0} chars, min 50)`);
  }

  const validFlashcards = (fiche.flashcards ?? []).filter(
    (f) => f.question?.length >= 10 && f.reponse?.length >= 15,
  );
  if (validFlashcards.length < 3) {
    issues.push(`seulement ${validFlashcards.length} flashcards valides (min 3)`);
  }

  const elements = fiche.schema?.elements ?? [];
  const connexions = fiche.schema?.connexions ?? [];
  if (elements.length < 3) {
    issues.push(`schema: seulement ${elements.length} elements (min 3)`);
  }
  if (connexions.length < 2) {
    issues.push(`schema: seulement ${connexions.length} connexions (min 2)`);
  }

  return issues;
}

export async function generateRichFiche(input: GenerateSheetRequest): Promise<FicheGeneree> {
  if (!process.env.OPENAI_API_KEY) {
    return buildDemoFiche(input);
  }

  const wordCount = input.content.trim().split(/\s+/).length;
  if (wordCount < 30) {
    console.warn(`Source text too short (${wordCount} words), using demo fiche.`);
    return buildDemoFiche(input);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.25,
      max_tokens: 3200,
      messages: [
        { role: "system", content: FICHE_SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input.content) },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = sanitizeJsonValue(JSON.parse(cleaned)) as FicheGeneree;

    const issues = validateFicheQuality(parsed);
    if (issues.length > 0) {
      console.warn("Fiche quality issues detected:", issues);
    }

    return enrichFiche(input, parsed);
  } catch (error) {
    console.warn("Structured fiche generation failed, using demo fiche.", error);
    return buildDemoFiche(input);
  }
}
