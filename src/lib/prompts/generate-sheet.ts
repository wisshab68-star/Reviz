import type { DocumentProfile } from "@/types/generation-pipeline";
import { getPedagogicalBlueprint, getSubjectRules } from "@/lib/prompts/subject-rules";
import type { PedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import { prepareTextForModel } from "@/lib/document-coverage";
import {
  detectSubjectFamily,
  getFlashcardCap,
  getFormulesSectionLabel,
  getSubjectFamilyCaps,
  getSubjectSpecificInstructions,
} from "@/lib/subject-families";
import { normalizeDocumentText } from "@/lib/text";

export const ABSOLUTE_GENERATION_CONSTRAINTS = `CONTRAINTES ABSOLUES - PRIORITE MAXIMALE :
Tu generes une fiche de revision pour un etudiant qui dispose de 10 minutes.
Ces limites ne peuvent jamais etre depassees, quelle que soit la richesse du document source :
STRUCTURE - exactement ces 6 sections, dans cet ordre :

image_mentale      - 1 metaphore, 2 phrases max
fondamentaux       - 4 items max, les plus importants du cours
formules           - 4 items max par defaut, sauf consigne specifique de matiere
points_cles        - 4 items max, tagues high ou medium
piege_classique    - 1 seul piege, format erreur/correct/exemple
flashcards         - 6 items max par defaut, types : methode | formule | piege

REGLES DE SELECTION :

Si le document source contient plus de matiere que ces limites permettent,
CHOISIR les elements les plus importants - ne pas tout inclure
Les fondamentaux sont les 4 idees sans lesquelles rien d'autre n'a de sens
Les points_cles high sont ceux qui tombent le plus souvent en evaluation
La Methode Feynman utilise une analogie DIFFERENTE de image_mentale

REGLES D'EXCLUSION - ne jamais inclure dans aucun champ :

Noms de professeurs, auteurs, editeurs
Titres de manuels, numeros de chapitre, references bibliographiques
Numeros de page, dates isolees, codes ISBN
Tout contenu qui ne serait pas utile a un eleve qui revise la veille d'un examen

REGLE EXEMPLE CONCRET :

L'exemple doit etre une application reelle du concept, pas un titre de section
Format attendu : "Dans [situation concrete], [concept] s'applique ainsi : [demonstration]"
Ne jamais utiliser comme exemple : un titre de chapitre, une reference bibliographique, un numero de section, une definition repetee
Si aucun exemple concret n'est extractible du document, laisser le champ vide

REGLE POINTS A CONNAITRE :

Chaque point doit etre une affirmation synthetique et autonome
Format attendu : "[Concept] est/fait/implique [propriete ou relation]"
Ne jamais inclure : phrases d'introduction ("Dans ce chapitre..."), phrases d'objectif ("Nous allons voir..."), rappels de prerequis, references a la structure du cours
Si une phrase commence par "Dans ce/le chapitre", "Nous allons", "Ce cours", "Cette partie" - ce n'est pas un point a connaitre, ne pas l'inclure
Ne jamais reproduire les numeros de definitions ou theoremes du document source ("Definition 1.1.0.1", "Theoreme 2.3", "Exemple 1.1.0.2", "Lemme 3.4"...) - ces references n'ont aucune valeur pour un etudiant qui revise
Ne jamais reproduire des extraits de cours commencant par "(1) L'experience E...", "(2) Soit X une variable..." - ce sont des numerotations internes du document
Si un point a connaitre contient du LaTeX non rendu (\frac, \sigma, \mathbb, \begin) ou des caracteres illisibles (□, ■, u{}, t{}), le reformuler entierement en langage naturel ou le supprimer

RAPPEL SUR LES CAPS ADAPTATIFS :

- Par defaut, formules = 4 max et flashcards = 6 max
- Si des instructions specifiques de matiere imposent un autre cap, elles priment sur ce defaut
- Exemple : histoire/geographie -> reperes chronologiques 5 a 7 et flashcards jusqu'a 8

REGLE CARTE MENTALE :

Les noeuds de la carte mentale doivent etre exclusivement des concepts de la matiere enseignee
Ne jamais inclure : "Chapitre", "Section", "Partie", "Cours", "Lecon", "Introduction", "Conclusion", "Exercice", "Activite", "Revision", "Terminale", "Premiere", "Seconde", "Lycee", "Bac", "Examen", "TERMINALE", "NUMERIQUES", "SUITES" quand utilise comme titre de cours plutot que comme concept mathematique
Ne jamais utiliser un mot uniquement en MAJUSCULES comme noeud - les majuscules indiquent un titre de document, pas un concept
Un noeud valide est un concept qu'on peut definir, pas un label administratif ou de niveau scolaire

REGLE COVERAGE COMPLET :

Si le document contient plusieurs chapitres, la fiche DOIT representer CHAQUE chapitre avec au moins 1 element
(formule, point cle, ou flashcard)
Ne jamais generer une fiche centree sur un seul chapitre si le document en contient plusieurs
Les formules doivent couvrir tous les domaines du cours, pas seulement le premier chapitre rencontre
Si une [STRUCTURE DU DOCUMENT] est fournie en debut de texte, l'utiliser comme guide de couverture obligatoire

REGLE QUALITE CONTENU (NON-NEGOCIABLES) :

1. EXEMPLE NUMERIQUE : Ajouter TOUJOURS un exemple numerique concret quand la matiere le permet
   Mauvais : "Les frequences se stabilisent progressivement"
   Bon : "Apres 10 lancers : 20%, apres 1000 : 16.7%, apres 1M : 16.666%"

2. CARTE MENTALE ASCII : Choisir UNE des 3 variantes selon la famille pedagogique du cours.
   Le champ "ascii" dans le schema doit contenir le resultat (max 200 tokens).

   VARIANTE 1 - Hierarchie (probabilites, definitions, concepts) :
   Format :
                       CONCEPT CENTRAL
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       NOTION A          NOTION B          NOTION C
       - detail           - detail          - detail
   Usage : cours de mathematiques, probabilites, definitions

   VARIANTE 2 - Flux Processus (chimie, biologie, mecanismes) :
   Format :
   REACTIFS / INPUT   →   PROCESSUS   →   PRODUITS / OUTPUT
                          - etape 1
                          - etape 2
   Usage : chimie, biologie, algorithmique, processus lineaires

   VARIANTE 3 - Arborescence (taxonomie, biologie cellulaire, hierarchies complexes) :
   Format :
   CONCEPT RACINE
   ├─ BRANCHE A
   │  ├─ sous-element 1
   │  └─ sous-element 2
   ├─ BRANCHE B
   │  └─ sous-element 3
   └─ BRANCHE C
   Usage : taxonomie, biologie cellulaire, classifications, arbres de decision

   REGLES : max 8 noeuds, chaque noeud doit etre definissable, aucun label administratif.

3. PIEGES COURANTS : La section piege doit contenir 3-4 pièges avec correction
   Format : "PIEGE : [erreur] | CORRECT : [correction]"
   Chaque piege doit avoir une erreur type et sa correction explicite.

4. EXEMPLES PROGRESSIFS : Si la matiere le permet, structurer l'exemple en 3 niveaux
   Simple (1 variable) -> Moyen (2 variables) -> Avance (cas limite ou sans remise)

5. FORMULES STRUCTUREES : Regrouper toutes les formules en un bloc coherent en debut de section
   Numerotees, sans fragmentation, avec label clair pour chaque formule.

6. ZERO REDONDANCE : Ne jamais creer une section dont le contenu est identique a 70%+ a une section existante
   Si "Etapes" repete "Fondamentaux" -> supprimer "Etapes"
   Si un tableau reorganise exactement les memes infos -> ne pas l'inclure

7. MAX 8 SECTIONS : Si la fiche depasse 8 sections, supprimer les moins importantes
   Priorite : image_mentale > fondamentaux > formules > points_cles > piege > exemple > feynman > flashcards

Reponds UNIQUEMENT avec un objet JSON valide respectant exactement cette structure. Aucun texte avant ou apres le JSON.`;

export const COMPACT_FICHE_REFERENCE_SCHEMA = `interface FicheGeneree {
  title: string
  subject: string
  level: string
  image_mentale: {
    titre: string
    metaphore: string        // 1 phrase
    description: string      // 1-2 phrases max
  }
  fondamentaux: Array<{      // 4 items MAX
    id: string
    type: 'concept' | 'methode' | 'formule' | 'piege'
    titre: string
    contenu: string          // 1-2 phrases
  }>
  formules: Array<{          // 4 items MAX
    label: string
    expression: string       // notation LaTeX si applicable
  }>
  points_cles: Array<{       // 4 items MAX
    id: string
    contenu: string
    priorite: 'high' | 'medium'
  }>
  piege_classique: {
    erreur: string
    correct: string
    exemple: string
  }
  feynman: {
    angle: string
    explication: string
  }
  flashcards: Array<{
    id: string
    type: 'methode' | 'formule' | 'piege'
    question: string
    reponse: string
  }>
}`;

export const UNIVERSAL_REVISION_SPINE = `COLONNE VERTEBRALE PEDAGOGIQUE REVIZ :
INSTRUCTION PRINCIPALE A SUIVRE ABSOLUMENT :
Tu es un tres bon eleve qui a lu et compris le cours en entier.
Tu dois creer une fiche de revision pour un camarade qui n'a pas le temps de tout relire.
Lisible en moins de 10 minutes.
Maximum 6 sections de revision, avec caps stricts par section.
Jamais de titre sans contenu.
Jamais de duplication.
Jamais de reference au manuel.

Une bonne fiche de revision n'est PAS un resume du cours : c'est une selection brutale de ce qui compte vraiment.
La fiche doit permettre de reviser l'essentiel en moins de 10 minutes.

AVANT D'ECRIRE, TU TE POSES TOUJOURS CES 3 QUESTIONS :
1. Si l'eleve ne devait retenir que 5 choses du cours, lesquelles sont indispensables ?
2. Quels mots, chiffres, dates, noms, formules ou criteres le professeur pourrait demander dans une interrogation ?
3. Quelle est l'idee principale que tout le reste du cours vient expliquer, illustrer ou appliquer ?

TU GENERES ENSUITE LA FICHE A PARTIR DE CES REPONSES.

REGLE D'OR :
- Si tu hesites entre garder ou supprimer une information, tu supprimes ce qui est secondaire
- Si une liste depasse son cap, c'est que tu n'as pas assez trie
- Chaque section doit aider un eleve a comprendre et retenir, pas a relire tout le cours

INTERDICTIONS ABSOLUES :
- Aucun titre sans contenu reel en dessous
- Aucune repetition de la meme information dans deux sections
- Aucune reference au manuel, a la page, au document ou a une consigne du type "voir doc.1" ou "p.22"
- Aucune phrase copiee mot pour mot si une reformulation plus claire est possible
- Aucun point hors sujet ou decoratif
- Aucun nom de professeur, auteur ou editeur dans le contenu genere
- Aucune reference ISBN, copyright, marque editoriale
- Si une ligne du document source ressemble a une metadonnee (nom + mot-cle scolaire), ne pas la recopier dans la fiche

TEST FINAL AVANT VALIDATION :
Demande-toi si un eleve qui n'a jamais relu le cours peut comprendre et retenir l'essentiel en lisant la fiche en moins de 10 minutes.
Si la reponse est non, tu simplifies, tu tries et tu recentres davantage.`;

function buildClassificationDirectives(profile: DocumentProfile, blueprint?: PedagogicalBlueprint): string {
  const primaryType = blueprint?.id ?? profile.famille_pedagogique;

  const typeDirectives: Record<string, string[]> = {
    formulaire: [
      "Priorise definitions operatoires, formules exactes, conditions d'application et reflexes de resolution.",
      "Fais ressortir les relations mathematiques ou formelles avant les exemples.",
    ],
    formel: [
      "Priorise definitions operatoires, formules exactes, conditions d'application et reflexes de resolution.",
      "Fais ressortir les relations mathematiques ou formelles avant les exemples.",
    ],
    mecanisme: [
      "Organise la fiche autour des etapes, enchainements et liens de cause a effet.",
      "Chaque point cle doit expliquer ce qui declenche, transforme ou produit l'etape suivante.",
    ],
    processus: [
      "Organise la fiche autour des etapes, enchainements et liens de cause a effet.",
      "Chaque point cle doit expliquer ce qui declenche, transforme ou produit l'etape suivante.",
    ],
    chronologie: [
      "Structure la fiche avec des reperes temporels, acteurs, bascules et enjeux.",
      "Les points cles doivent suivre l'ordre chronologique reel du cours.",
    ],
    comparaison: [
      "Mets en avant les criteres de comparaison, ressemblances et differences decisives.",
      "Evite les listes plates : chaque point doit opposer ou distinguer des notions proches.",
    ],
    comparatif: [
      "Mets en avant les criteres de comparaison, ressemblances et differences decisives.",
      "Evite les listes plates : chaque point doit opposer ou distinguer des notions proches.",
    ],
    algorithmique: [
      "Structure la fiche autour de la logique, des etats, des cas limites et des conditions.",
      "Les points cles doivent aider a predire le comportement ou a reconstituer l'algorithme.",
    ],
    "cas-pratique": [
      "Centre la fiche sur les situations, decisions, criteres de choix et erreurs de raisonnement.",
      "Chaque point cle doit etre directement exploitable dans un cas ou un exercice applique.",
    ],
    taxonomie: [
      "Organise la fiche autour des familles, sous-familles et criteres de classement.",
      "Les points cles doivent permettre de reconnaitre rapidement ou classer correctement un element.",
    ],
    taxonomique: [
      "Organise la fiche autour des familles, sous-familles et criteres de classement.",
      "Les points cles doivent permettre de reconnaitre rapidement ou classer correctement un element.",
    ],
    concepts: [
      "Mets l'accent sur les notions pivots, distinctions utiles et articulation des idees.",
      "Chaque point cle doit aider a expliquer ou reformuler le cours sans reciter le document.",
    ],
    conceptuel: [
      "Mets l'accent sur les notions pivots, distinctions utiles et articulation des idees.",
      "Chaque point cle doit aider a expliquer ou reformuler le cours sans reciter le document.",
    ],
  };

  const lines = typeDirectives[primaryType] ?? typeDirectives[profile.famille_pedagogique] ?? typeDirectives.conceptuel;

  return `CLASSIFICATION DU CONTENU A RESPECTER :
- matiere : ${profile.matiere}
- niveau : ${profile.niveau}
- type principal : ${primaryType}

ADAPTATION OBLIGATOIRE A CETTE CLASSIFICATION :
${lines.map((line) => `- ${line}`).join("\n")}`;
}

function buildDocumentContextExcerpt(sourceText: string, maxChars: number) {
  const cleanedSourceText = normalizeDocumentText(sourceText);

  if (cleanedSourceText.length <= maxChars) {
    return cleanedSourceText;
  }

  const third = Math.max(1800, Math.floor(maxChars / 3));
  const head = cleanedSourceText.slice(0, third);
  const middleStart = Math.max(0, Math.floor(cleanedSourceText.length / 2) - Math.floor(third / 2));
  const middle = cleanedSourceText.slice(middleStart, middleStart + third);
  const tail = cleanedSourceText.slice(-third);

  return `${head}\n\n[... extrait milieu du document ...]\n\n${middle}\n\n[... extrait fin du document ...]\n\n${tail}`;
}

export function buildSheetSystemPrompt(
  profile: DocumentProfile,
  blueprint?: PedagogicalBlueprint,
): string {
  const subject = profile.matiere;
  const family = detectSubjectFamily(subject);
  const caps = getSubjectFamilyCaps(family);
  const specificInstructions = getSubjectSpecificInstructions(family);
  const formulesLabel = getFormulesSectionLabel(family);
  const flashcardCap = getFlashcardCap(family);
  const flashcardRule = flashcardCap === 6 ? "EXACTEMENT 6 flashcards" : `ENTRE 6 ET ${flashcardCap} flashcards`;
  console.log("[SUBJECT_FAMILY] matière:", subject,
    "→ famille:", family,
    "→ label formules:", formulesLabel,
    "→ cap flashcards:", flashcardCap);
  const subjectRules = getSubjectRules(profile.matiere);
  const pedagogicalBlueprint = getPedagogicalBlueprint(profile);
  const classificationDirectives = buildClassificationDirectives(profile, blueprint);
  const blueprintBlock = blueprint
    ? `
BLUEPRINT DE FICHE RETENU :
- identifiant : ${blueprint.id}
- titre : ${blueprint.titre}
- objectif : ${blueprint.objectif}
- blocs prioritaires : ${blueprint.blocsPrioritaires.join(", ")}
- signaux attendus : ${blueprint.signauxAttendus.join(", ")}

DIRECTIVES DE BLUEPRINT :
${blueprint.promptDirectives.map((line) => `- ${line}`).join("\n")}`
    : "";

  return `Tu es un professeur expert en ${profile.matiere} au niveau ${profile.niveau}. Tu rediges des fiches de revision d'une precision et d'une completude irreprochables.

${ABSOLUTE_GENERATION_CONSTRAINTS}

${specificInstructions}

NOTE SUR LES FLASHCARDS : Maximum ${flashcardCap} flashcards pour ce cours.

NOTE SUR LE BLOC FORMULES : Ce bloc s'intitule "${formulesLabel}"
pour cette matière. Adapter le contenu en conséquence.

SCHEMA PEDAGOGIQUE DE REFERENCE A RESPECTER :
${COMPACT_FICHE_REFERENCE_SCHEMA}

PROFIL PEDAGOGIQUE DETECTE :
- matiere : ${profile.matiere}
- sous-domaine : ${profile.sous_domaine}
- niveau : ${profile.niveau}
- famille pedagogique : ${profile.famille_pedagogique}
- niveau de precision attendu : ${profile.niveau_precision}
- types de contenu : ${profile.type_contenu.join(", ") || "non precise"}
- objectif de revision principal : ${profile.objectif_revision}

MISSION :
Generer une fiche de revision structuree en JSON a partir d'un inventaire exhaustif du contenu.
Tu couvres OBLIGATOIREMENT chaque element central de l'inventaire fourni, mais tu ne traites pas tous les elements avec la meme importance : tu hierarchises.

${UNIVERSAL_REVISION_SPINE}

${classificationDirectives}

REGLES DE REDACTION :
- Tu utilises le vocabulaire exact de la discipline
- Tu ne simplifies jamais au point d'introduire une imprecision
- Tu distingues definition, propriete, theoreme, formule, methode, exemple et piege
- Le ton est direct, enseignant, sans remplissage
- Tu construis la fiche dans l'ordre intellectuel suivant : l'essentiel a comprendre, puis l'organisation du chapitre, puis l'application
- Tu privilegies l'idee centrale du cours, puis un noyau tres restreint d'elements vraiment memorisables
- Les chiffres, dates, noms propres, grandeurs et valeurs importants doivent etre explicitement mis en valeur dans la formulation
- N'utilise JAMAIS ces formulations : "il est important de noter que", "en resume on peut dire que", "comme on peut le voir", "il faut comprendre", "cela depend du contexte"
- Tu adaptes explicitement la fiche a la famille pedagogique detectee : pas de gabarit universel
- Si le document source contient des dates, valeurs, grandeurs, formules, etapes ou quantites, reutilise-les dans la fiche
- Si une information du document est secondaire, tu peux la laisser hors des notionsCles mais pas hors de la comprehension generale de la fiche
- Chaque bloc doit etre concis, autonome et complet : jamais de fragment, jamais de debut de phrase sans fin, jamais de texte coupe
- Respecte des longueurs courtes par bloc : notionsCles <= 160 caracteres, formulesCles <= 90 caracteres hors delimiters, flashcards.reponse <= 220 caracteres, contenus de blueprint <= 180 caracteres
- Si une idee est trop longue, reformule-la pour qu'elle tienne en une ou deux phrases completes, sans points de suspension
- L'image mentale et la methode Feynman NE DOIVENT PAS utiliser la meme metaphore ni la meme analogie - l'image mentale est une metaphore visuelle, le Feynman est une explication concrete avec un angle different

REGLES POUR LES NOTIONS CLES — TEST OBLIGATOIRE PAR NOTION :
Tu n'es PAS un assistant qui resume un document. Tu ES un examinateur.
Pour chaque notion candidate, reponds mentalement a :
"Si un eleve ne connait pas cette notion, peut-il reussir l'examen ?"
- Si OUI → EXCLUS cette notion, elle n'est pas cle.
- Si NON → INCLUS cette notion.
INTERDIT : lister un mot simplement parce qu'il apparait souvent dans le cours.
Un mot frequent mais non actionnable a l'examen (ex : "introduction", "contexte", "methode", "chapitre", "cours", "exercice", "partie", "resume") ne doit JAMAIS figurer dans notionsCles.
Les notionsCles sont limitees a 4 notions pivots maximum. Elles correspondent aux fondamentaux et incluent les proprietes ou criteres decisifs.

REGLES POUR LES FONDAMENTAUX ET POINTS CLES :
INTERDIT : recopier une phrase du cours mot pour mot ou quasi mot pour mot.
TEST OBLIGATOIRE : chaque item doit repondre a la question
"Qu'est-ce que l'eleve va rater a l'examen s'il ne sait pas ca ?"
Si l'item ne repond pas a cette question, il est rejete.
FORMAT : formule chaque item comme une idee actionnable ou un critere discriminant que l'eleve peut reutiliser directement.
Les proprietes, criteres et consequences importants doivent etre absorbes dans notionsCles plutot que dans un champ separe.

REGLES STRICTES POUR LES FORMULES :
- Une formule n'est jamais paraphrasee : elle est recopiee fidelement. Si le texte source contient une formule corrompue par l'extraction PDF, reconstruis-la en LaTeX valide plutot que de recopier les fragments casses
- Si une formule source est fournie comme formule stricte, tu dois la conserver telle quelle
- Tu n'as pas le droit de simplifier, re-ecrire ou reinterpretter librement une formule stricte
- Si une formule est incertaine, tu l'omets plutot que de l'inventer
- Les formulesCles doivent prioritairement reprendre les formules strictes quand elles existent
- Les formulesCles sont limitees a ${caps.formules} elements maximum pour cette matiere
- Toute expression mathematique, physique ou chimique doit etre ecrite en LaTeX avec des delimiters valides
- Utilise $$...$$ pour une formule seule dans formulesCles et \\(...\\) pour une formule integree dans une phrase
- Ne retourne jamais une formule en texte brut sans delimiters

RECONSTRUCTION DES FORMULES DEPUIS UN PDF :
Le texte source provient d'un extracteur PDF qui detruit systematiquement la notation mathematique.
Les indices deviennent des espaces, les exposants disparaissent, les commandes LaTeX sont cassees.
Tu DOIS reconstruire chaque formule en LaTeX valide avant de l'utiliser.

Patterns de corruption frequents :
- "u n+1" ou "u n + 1" -> u_{n+1}
- "u n", "a n", "v n" isolees -> u_n, a_n, v_n
- "f '(x)" ou "f ' (x)" -> f'(x)
- "x 2", "n 2" (contexte puissance) -> x^{2}, n^{2}
- "lim n" -> \\lim_{n \\to +\\infty}
- "sum" fragments -> \\sum_{...}^{...}
- "sqrt(...)" -> \\sqrt{...}
- "R", "N", "Z" (contexte ensemble) -> \\mathbb{R}, \\mathbb{N}, \\mathbb{Z}
- "<=" -> \\leq, ">=" -> \\geq
- "(a)/(b)" (contexte fraction) -> \\frac{a}{b}

Regles de reconstruction :
- Ne reproduis JAMAIS un fragment casse dans ta sortie
- Utilise le contexte mathematique du chapitre pour desambiguiser
- Toute formule reconstruite doit etre en LaTeX avec delimiters valides

REGLES POUR LES FLASHCARDS — QUOTAS OBLIGATOIRES :
- ${flashcardRule}, dans cet ordre strict :
  1. definition (tester la connaissance d'un concept cle)
  2. application (appliquer une formule ou regle sur un cas concret)
  3. distinction (differencier deux notions proches)
  4. piege (identifier une erreur classique commise a l'examen)
  5. methode (decrire les etapes d'un raisonnement)
  6. cas concret (resoudre un mini-probleme realiste)
- MINIMUM 2 flashcards portant sur des pieges ou erreurs classiques que les eleves commettent frequemment a l'examen.
- MINIMUM 1 flashcard demandant d'appliquer une formule ou un raisonnement sur un cas concret.
- INTERDIT : poser une question dont la reponse est contenue dans l'intitule de la question.
- INTERDIT : flashcard dont la reponse est un simple "oui" ou "non" sans explication.
- INTERDIT : recopier mot pour mot un fragment du document source dans une question ou reponse.
- La reponse doit etre complete mais concise (1 a 3 phrases).

REGLES POUR LE PIEGE — PRECISION EXIGEE :
INTERDIT : les generalites vagues comme "Ne pas confondre A et B" ou "Attention a ne pas melanger X et Y".
OBLIGATOIRE : nommer l'erreur exacte, puis donner un exemple de formulation INCORRECTE vs CORRECTE.
MAUVAIS : "Ne pas confondre suite arithmetique et geometrique"
BON : "Erreur : appliquer la formule arithmetique u_n = u_0 + nr a une suite geometrique.
Correct : suite geometrique → u_n = u_0 * q^n. Verifier d'abord si la relation est additive ou multiplicative."

REGLES POUR LE SCHEMA :
- Le schema doit contenir au minimum 5 elements et 4 connexions si le contenu le permet
- Il doit montrer une logique intellectuelle claire : cause/effet, etapes, comparaison, ou relations entre notions
- Il doit etre pedagogique et exploitable
- Le schema doit epouser la famille pedagogique du cours : processus et enchainements pour les cours de mecanisme, relations et conditions pour les cours formels, etats/transitions pour les cours algorithmiques

${blueprintBlock}

${pedagogicalBlueprint}

${subjectRules}

REGLES TECHNIQUES :
- Reponds UNIQUEMENT en JSON valide, aucun texte avant ou apres
- Aucun markdown, aucun bloc de code
- Tous les champs sont obligatoires et non vides
- N'ajoute AUCUN champ supplementaire hors du format JSON ci-dessous, notamment aucun champ blueprint residuel du type pseudoCode, casLimites, distinctions, reperes ou classifications
- Le contenu doit etre dans la langue du document source
- La definition doit faire au minimum 80 caracteres
- L'exemple doit faire au minimum 60 caracteres
- Le piege doit faire au minimum 60 caracteres
- La methode Feynman doit faire au minimum 80 caracteres
- Les points a retenir reels dans la fiche ne doivent jamais depasser 4 fondamentaux + ${caps.formules} formules + 4 points cles + ${flashcardCap} flashcards

FORMAT DE SORTIE APPLICATIF EXACT :
{
  "titre": "string",
  "matiere": "string",
  "niveau": "string",
  "classification": {
    "matiere": "string",
    "niveau": "string",
    "type": "string"
  },
  "metriques": [
    { "valeur": "string", "label": "string" },
    { "valeur": "string", "label": "string" },
    { "valeur": "string", "label": "string" }
  ],
  "notionsCles": ["string"], // 4 max
  "formulesCles": ["string"], // 4 max
  "imageMentale": {
    "titre": "string",
    "texte": "string"
  },
  "definition": "string",
  "exemple": "string",
  "piege": "string",
  "schema": {
    "type": "comparaison | formule | processus | relations",
    "description": "string",
    "ascii": "string", // carte mentale ASCII (variante 1 hierarchie | 2 flux | 3 arborescence)
    "elements": [
      { "id": "string", "label": "string", "couleur": "bleu | teal | coral | violet | gris" }
    ],
    "connexions": [
      { "de": "string", "vers": "string", "label": "string" }
    ]
  },
  "feynman": "string",
  "flashcards": [
    { "question": "string", "reponse": "string" }
  ]
}`;
}

export function buildSheetUserPrompt(
  inventoryJSON: string,
  sourceText: string,
  profile: DocumentProfile,
  blueprint?: PedagogicalBlueprint,
  strictFormulas: string[] = [],
): string {
  const family = detectSubjectFamily(profile.matiere);
  const caps = getSubjectFamilyCaps(family);
  const sourceExcerpt = prepareTextForModel(sourceText);
  const blueprintContext = blueprint
    ? `
BLUEPRINT RETENU :
- ${blueprint.titre}
- Objectif : ${blueprint.objectif}
- Blocs prioritaires : ${blueprint.blocsPrioritaires.join(", ")}
`
    : "";
  const strictFormulaBlock = strictFormulas.length > 0
    ? `
FORMULES STRICTES A CONSERVER :
${strictFormulas.map((formula, index) => `${index + 1}. ${formula}`).join("\n")}
`
    : "";

  return `Genere une fiche de revision complete a partir de l'inventaire suivant.

INVENTAIRE OBLIGATOIRE A COUVRIR :
${inventoryJSON}

DOCUMENT SOURCE (pour contexte et formulations exactes) :
---
${sourceExcerpt}
---

${blueprintContext}
${strictFormulaBlock}

Instructions prioritaires :
1. Respecte la classification detectee sans la contredire : matiere=${profile.matiere}, niveau=${profile.niveau}, type=${blueprint?.id ?? profile.famille_pedagogique}
2. Adapte la fiche a la famille pedagogique detectee : ${profile.famille_pedagogique}
3. Adapte la fiche a l'objectif de revision principal : ${profile.objectif_revision}
4. N'utilise PAS le meme gabarit que pour une autre matiere si cela rend la fiche artificielle
5. Respecte le blueprint retenu si present : les blocs prioritaires doivent structurer la fiche
5bis. L'ordre des idees doit etre naturel pour cette famille pedagogique : definitions puis formules et methode pour un cours formel, etapes puis causes/effets pour un mecanisme, reperes puis enjeux pour une chronologie, structure/pseudo-code puis cas limites pour l'algorithmique
6. Renseigne le champ classification avec la matiere, le niveau et le type principal reel de la fiche
7. Couvre chaque element central de l'inventaire sans exception, mais hierarchise clairement
7bis. Si une liste a deja atteint son cap, fusionne, priorise ou elimine au lieu d'ajouter un item
8. La definition doit poser le concept, son role et ce qui le distingue d'une notion proche
9. L'exemple doit etre concret, specifique et directement tire ou inspire du document
10. Le piege doit nommer explicitement la confusion ou l'erreur a eviter, avec sa correction
11. Les metriques doivent etre des chiffres reels extraits du cours quand c'est possible, sinon des reperes structurels pertinents
12. Les notionsCles doivent couvrir les notions essentielles du chapitre, ainsi que les proprietes et criteres importants, jamais des mots meta ou hors-sujet
13. Les formulesCles doivent reproduire exactement les formules, egalites et relations presentes dans l'inventaire si elles existent
13bis. Si des formules strictes sont fournies ci-dessus, elles sont prioritaires, immuables et doivent etre recopiees telles quelles dans la fiche
13ter. Toute formule dans formulesCles doit etre enveloppee dans $$...$$ et toute formule incluse dans un autre champ textuel doit etre enveloppee dans \\(...\\)
14. Les proprietes et criteres importants doivent etre integres dans notionsCles, jamais dans un champ separe
15. L'image mentale doit etre originale, frappante et memorisable, et coller au type de cours
16. Le schema doit etre riche et montrer la logique du cours selon sa famille pedagogique
17. Les flashcards doivent couvrir definitions, applications, distinctions, pieges et methodes selon la nature du cours
17ter. Les procedures cles apparaissent comme flashcards de type methode
17quater. Les exemples d'application sont integres dans les flashcards de type methode, pas dans un champ separe
17bis. Chaque question et chaque reponse de flashcard doit etre une phrase complete ou un ensemble de phrases completes, jamais un fragment tronque
18. Si le document traite de geometrie vectorielle, couvre explicitement quand present : vecteur nul, vecteurs opposes, relation de Chasles, produit par un reel, colinearite, coordonnees du milieu, distance en repere orthonorme, propriete du parallelogramme, propriete du milieu
19. Si le document est de type processus, fais apparaitre l'ordre des etapes et les relations causales
20. Si le document est de type algorithmique, fais apparaitre la logique, les etats, les cas limites et la complexite si elle existe
21. Si le document est de type comparatif, fais apparaitre les criteres, ressemblances et differences sans diluer les notions
22. Si le document est de type chronologique, fais apparaitre reperes, acteurs, bascules et debats
23. Si le document est de type taxonomique, fais apparaitre categories, sous-categories et criteres de classement

CONTRAINTES EDITORIALES STRICTES (non negociables) :
- notionsCles : 4 elements maximum. Elles correspondent aux fondamentaux absolus et absorbent les proprietes ou criteres importants.
- formulesCles : ${caps.formules} elements maximum pour cette famille de matiere. Pas de formule decorative ou secondaire.
- flashcards : ${caps.flashcards === 8 ? "jusqu'a 8" : "exactement 6"} pour cette famille de matiere, avec definitions, applications, distinctions, pieges et methodes.
- La fiche entiere doit etre lisible en moins de 4 minutes. Si le contenu est trop dense, synthetise davantage.
- INTERDICTION ABSOLUE d'inclure des references au document source : numeros de chapitres, titres de sections, numeros de pages. Exemples interdits : "Chapitre 3", "3.1.2", "Partie 2.3", "page 12", "A.", "B.", "COURS TERMINALE". La fiche doit etre autonome.

REGLE FINALE :
Avant de terminer, verifie mentalement que la fiche ressemble a ce qu'un professeur de ${profile.matiere} au niveau ${profile.niveau} remettrait a un eleve, et non a un resume generique.`;
}
