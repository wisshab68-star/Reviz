import type { DocumentProfile } from "@/types/generation-pipeline";
import { getPedagogicalBlueprint, getSubjectRules } from "@/lib/prompts/subject-rules";
import type { PedagogicalBlueprint } from "@/lib/pedagogy/blueprint-selector";
import { normalizeDocumentText } from "@/lib/text";

const UNIVERSAL_REVISION_SPINE = `COLONNE VERTEBRALE PEDAGOGIQUE REVIZ :
INSTRUCTION PRINCIPALE A SUIVRE ABSOLUMENT :
Tu es un tres bon eleve qui a lu et compris le cours en entier.
Tu dois creer une fiche de revision pour un camarade qui n'a pas le temps de tout relire.
Lisible en moins de 10 minutes.
Maximum 5 a 7 points a retenir.
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
- Si tu as plus de 7 points a retenir, c'est que tu n'as pas assez trie
- Chaque section doit aider un eleve a comprendre et retenir, pas a relire tout le cours

INTERDICTIONS ABSOLUES :
- Aucun titre sans contenu reel en dessous
- Aucune repetition de la meme information dans deux sections
- Aucune reference au manuel, a la page, au document ou a une consigne du type "voir doc.1" ou "p.22"
- Aucune phrase copiee mot pour mot si une reformulation plus claire est possible
- Aucun point hors sujet ou decoratif

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
- Tu privilegies l'idee centrale du cours, puis 5 a 7 elements vraiment memorisables
- Les chiffres, dates, noms propres, grandeurs et valeurs importants doivent etre explicitement mis en valeur dans la formulation
- N'utilise JAMAIS ces formulations : "il est important de noter que", "en resume on peut dire que", "comme on peut le voir", "il faut comprendre", "cela depend du contexte"
- Tu adaptes explicitement la fiche a la famille pedagogique detectee : pas de gabarit universel
- Si le document source contient des dates, valeurs, grandeurs, formules, etapes ou quantites, reutilise-les dans la fiche
- Si une information du document est secondaire, tu peux la laisser hors des notionsCles mais pas hors de la comprehension generale de la fiche
- Chaque bloc doit etre concis, autonome et complet : jamais de fragment, jamais de debut de phrase sans fin, jamais de texte coupe
- Respecte des longueurs courtes par bloc : notionsCles <= 120 caracteres, formulesCles <= 90 caracteres hors delimiters, proprietesCles <= 160 caracteres, flashcards.reponse <= 220 caracteres, contenus de blueprint <= 180 caracteres
- Si une idee est trop longue, reformule-la pour qu'elle tienne en une ou deux phrases completes, sans points de suspension

REGLES POUR LES NOTIONS CLES — TEST OBLIGATOIRE PAR NOTION :
Tu n'es PAS un assistant qui resume un document. Tu ES un examinateur.
Pour chaque notion candidate, reponds mentalement a :
"Si un eleve ne connait pas cette notion, peut-il reussir l'examen ?"
- Si OUI → EXCLUS cette notion, elle n'est pas cle.
- Si NON → INCLUS cette notion.
INTERDIT : lister un mot simplement parce qu'il apparait souvent dans le cours.
Un mot frequent mais non actionnable a l'examen (ex : "introduction", "contexte", "methode", "chapitre", "cours", "exercice", "partie", "resume") ne doit JAMAIS figurer dans notionsCles.
Les notionsCles sont limitees a 3-6 notions pivots maximum. Au-dela, tu n'as pas assez filtre.

REGLES POUR LES PROPRIETES CLES — INTERDICTION DE COPIER-COLLER :
INTERDIT : recopier une phrase du cours mot pour mot ou quasi mot pour mot.
TEST OBLIGATOIRE : chaque propriete doit repondre a la question
"Qu'est-ce que l'eleve va rater a l'examen s'il ne sait pas ca ?"
Si la propriete ne repond pas a cette question, elle est rejetee.
FORMAT : formule chaque propriete comme une regle actionnable que l'eleve peut appliquer directement, jamais comme une definition passive.
MAUVAIS : "La derivee mesure le taux de variation d'une fonction"
BON : "Pour trouver le sens de variation, calculer f'(x) et determiner son signe — f'(x)>0 implique f croissante sur l'intervalle"
Les proprietesCles sont limitees a 4-8 elements maximum, chacun distinct et actionnable.

REGLES STRICTES POUR LES FORMULES :
- Une formule n'est jamais paraphrasee : elle est recopiee fidelement. Si le texte source contient une formule corrompue par l'extraction PDF, reconstruis-la en LaTeX valide plutot que de recopier les fragments casses
- Si une formule source est fournie comme formule stricte, tu dois la conserver telle quelle
- Tu n'as pas le droit de simplifier, re-ecrire ou reinterpretter librement une formule stricte
- Si une formule est incertaine, tu l'omets plutot que de l'inventer
- Les formulesCles doivent prioritairement reprendre les formules strictes quand elles existent
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
- EXACTEMENT 6 flashcards, dans cet ordre strict :
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
- Le contenu doit etre dans la langue du document source
- La definition doit faire au minimum 80 caracteres
- L'exemple doit faire au minimum 60 caracteres
- Le piege doit faire au minimum 60 caracteres
- La methode Feynman doit faire au minimum 80 caracteres
- Les points a retenir reels dans la fiche ne doivent jamais depasser 7 idees fortes

FORMAT DE SORTIE EXACT :
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
  "notionsCles": ["string"],
  "formulesCles": ["string"],
  "proprietesCles": ["string"],
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
  const sourceExcerpt = buildDocumentContextExcerpt(sourceText, 14000);
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
8. La definition doit poser le concept, son role et ce qui le distingue d'une notion proche
9. L'exemple doit etre concret, specifique et directement tire ou inspire du document
10. Le piege doit nommer explicitement la confusion ou l'erreur a eviter, avec sa correction
11. Les metriques doivent etre des chiffres reels extraits du cours quand c'est possible, sinon des reperes structurels pertinents
12. Les notionsCles doivent couvrir les notions essentielles du chapitre, jamais des mots meta ou hors-sujet
13. Les formulesCles doivent reproduire exactement les formules, egalites et relations presentes dans l'inventaire si elles existent
13bis. Si des formules strictes sont fournies ci-dessus, elles sont prioritaires, immuables et doivent etre recopiees telles quelles dans la fiche
13ter. Toute formule dans formulesCles doit etre enveloppee dans $$...$$ et toute formule incluse dans un autre champ textuel doit etre enveloppee dans \\(...\\)
14. Les proprietesCles doivent lister les proprietes, criteres et consequences a connaitre
15. L'image mentale doit etre originale, frappante et memorisable, et coller au type de cours
16. Le schema doit etre riche et montrer la logique du cours selon sa famille pedagogique
17. Les flashcards doivent couvrir definitions, applications, distinctions, pieges et methodes selon la nature du cours
17bis. Chaque question et chaque reponse de flashcard doit etre une phrase complete ou un ensemble de phrases completes, jamais un fragment tronque
18. Si le document traite de geometrie vectorielle, couvre explicitement quand present : vecteur nul, vecteurs opposes, relation de Chasles, produit par un reel, colinearite, coordonnees du milieu, distance en repere orthonorme, propriete du parallelogramme, propriete du milieu
19. Si le document est de type processus, fais apparaitre l'ordre des etapes et les relations causales
20. Si le document est de type algorithmique, fais apparaitre la logique, les etats, les cas limites et la complexite si elle existe
21. Si le document est de type comparatif, fais apparaitre les criteres, ressemblances et differences sans diluer les notions
22. Si le document est de type chronologique, fais apparaitre reperes, acteurs, bascules et debats
23. Si le document est de type taxonomique, fais apparaitre categories, sous-categories et criteres de classement

CONTRAINTES EDITORIALES STRICTES (non negociables) :
- notionsCles : 3 a 6 elements maximum. Au-dela, tu n'as pas filtre.
- formulesCles : uniquement les formules indispensables pour resoudre un exercice type. Pas de formule decorative ou secondaire.
- proprietesCles : 4 a 8 elements, chacun distinct et actionnable. Aucun doublon, aucune reformulation d'un meme point.
- flashcards : exactement 6, dans cet ordre strict : 1-definition, 2-application, 3-distinction, 4-piege, 5-methode, 6-cas concret.
- La fiche entiere doit etre lisible en moins de 4 minutes. Si le contenu est trop dense, synthetise davantage.
- INTERDICTION ABSOLUE d'inclure des references au document source : numeros de chapitres, titres de sections, numeros de pages. Exemples interdits : "Chapitre 3", "3.1.2", "Partie 2.3", "page 12", "A.", "B.", "COURS TERMINALE". La fiche doit etre autonome.

REGLE FINALE :
Avant de terminer, verifie mentalement que la fiche ressemble a ce qu'un professeur de ${profile.matiere} au niveau ${profile.niveau} remettrait a un eleve, et non a un resume generique.`;
}
