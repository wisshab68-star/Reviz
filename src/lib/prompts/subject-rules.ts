import type { DocumentProfile } from "@/types/generation-pipeline";

const MATH_RULES = `
REGLES SPECIFIQUES - MATHEMATIQUES ET SCIENCES FORMELLES :
- Les formules sont reproduites avec leur notation exacte, sans approximation
- Les theoremes incluent leurs conditions d'application completes
- Si une demonstration est presente dans le document, l'inclure integralement
- Les criteres, equivalences et implications ne sont jamais approximes
- Les cas particuliers et contre-exemples sont systematiquement mentionnes
- Les notations sont coherentes avec celles du document source
- Si le texte source provient d'un PDF, les formules peuvent etre corrompues par l'extraction (indices, exposants et commandes LaTeX casses en fragments separes par des espaces). Reconstruis-les en LaTeX valide. Exemples : "u n+1" -> u_{n+1}, "f '(x)" -> f'(x), "x 2" en contexte de puissance -> x^{2}, "a n" en contexte de suite -> a_n
- Les etapes de raisonnement sont numerotees et explicites
`;

const PHYSICS_CHEMISTRY_RULES = `
REGLES SPECIFIQUES - PHYSIQUE ET CHIMIE :
- Les unites sont systematiquement precisees pour chaque grandeur
- Les lois sont formulees avec leurs conditions de validite et leur domaine d'application
- Les constantes physiques importantes sont rappelees avec leur valeur et unite
- Les conventions de signe sont explicitees
- Les schemas experimentaux ou de mecanismes sont decrits avec precision
`;

const BIOLOGY_MEDICINE_RULES = `
REGLES SPECIFIQUES - SVT, BIOLOGIE, MEDECINE :
- Les mecanismes biologiques sont decrits sequentiellement, etape par etape
- Les echelles sont distinguees : moleculaire, cellulaire, tissulaire, organisme, ecosysteme
- Les relations structure-fonction sont mises en evidence
- Les regulations, retrocontroles et causalites sont explicites
- Les termes scientifiques exacts sont conserves et expliques
`;

const HUMANITIES_RULES = `
REGLES SPECIFIQUES - SCIENCES HUMAINES :
- Les dates, acteurs, lieux ou cadres de reference sont systematiquement mentionnes
- Les causalites sont distinguees des correlations
- Les concepts sont definis avant d'etre utilises
- Les debats, distinctions ou courants doivent etre presentes sans melange
`;

const PHILOSOPHY_LITERATURE_RULES = `
REGLES SPECIFIQUES - PHILOSOPHIE ET LETTRES :
- Les theses sont distinguees des arguments qui les soutiennent
- Les auteurs et oeuvres sont associes a leurs idees
- Les distinctions conceptuelles sont preservees
- Les objections et contre-arguments sont mentionnes quand ils figurent dans le document
`;

const COMPUTER_SCIENCE_RULES = `
REGLES SPECIFIQUES - INFORMATIQUE ET ALGORITHMIQUE :
- Les algorithmes sont decrits etape par etape avec leur logique
- La complexite temporelle et spatiale est mentionnee si presente
- Les structures de donnees sont explicitees avec leurs operations et contraintes
- Le pseudocode et les exemples de code sont conserves fidelement
- Les cas limites et conditions d'arret sont signales
`;

const LANGUAGES_RULES = `
REGLES SPECIFIQUES - LANGUES ET LINGUISTIQUE :
- Les regles grammaticales sont enoncees avec leurs exceptions
- Les exemples incluent systematiquement leur contexte ou leur traduction
- Les nuances semantiques et registres sont preserves
- Les tableaux comparatifs et oppositions utiles doivent etre privilegies
`;

const MANAGEMENT_RULES = `
REGLES SPECIFIQUES - GESTION, FINANCE, MARKETING :
- Les definitions normatives sont reproduites avec precision
- Les methodes de calcul sont detaillees etape par etape
- Les ratios et indicateurs sont definis avec leur formule
- Les modeles theoriques sont nommes et contextualises
`;

const DEFAULT_RULES = `
REGLES GENERALES :
- Chaque notion est definie avant d'etre utilisee
- Les exemples sont concrets et directement lies au contenu du cours
- Les pieges sont realistes et correspondent a des erreurs frequentes d'apprenants
- Le vocabulaire technique est defini rigoureusement
- Les hierarchies conceptuelles sont respectees
`;

export function getSubjectRules(matiere: string): string {
  const lower = matiere.toLowerCase();

  if (/(math|algebre|geometr|analyse|probabilit|statistiq|arithm)/.test(lower)) {
    return MATH_RULES;
  }
  if (/(physique|chimie|thermodynami|mecanique|optique|electro)/.test(lower)) {
    return PHYSICS_CHEMISTRY_RULES;
  }
  if (/(svt|biolog|biochim|genetiq|medecin|anatom|physiolog|pharmaco|semiolog)/.test(lower)) {
    return BIOLOGY_MEDICINE_RULES;
  }
  if (/(histoire|geograph|geopoliti|economie|sociolog|droit|science po)/.test(lower)) {
    return HUMANITIES_RULES;
  }
  if (/(philosoph|lettres|francais|litteratur|linguistiq)/.test(lower)) {
    return PHILOSOPHY_LITERATURE_RULES;
  }
  if (/(informatiqu|algorithm|programm|base.?de.?donn|reseau|systeme)/.test(lower)) {
    return COMPUTER_SCIENCE_RULES;
  }
  if (/(anglais|espagnol|allemand|italien|langue|chinois|arabe|portugais)/.test(lower)) {
    return LANGUAGES_RULES;
  }
  if (/(comptabil|finance|management|marketing|ressources humaines|gestion)/.test(lower)) {
    return MANAGEMENT_RULES;
  }

  return DEFAULT_RULES;
}

export function getPedagogicalBlueprint(profile: DocumentProfile): string {
  const levelGuard =
    profile.niveau_precision === "introductif"
      ? "Le niveau doit rester tres accessible, sans jargon non explique."
      : profile.niveau_precision === "expert"
        ? "Le niveau doit rester exigeant, techniquement complet et sans simplification abusive."
        : profile.niveau_precision === "avance"
          ? "Le niveau doit etre dense, precis et rigoureux, avec les conditions, nuances et details utiles."
          : "Le niveau doit etre clair, structure et suffisamment complet pour une revision serieuse.";

  const familyBlueprints: Record<DocumentProfile["famille_pedagogique"], string> = {
    formel: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS FORMEL :
1. Idee centrale du chapitre en une phrase exacte
2. Tableau mental des formules, criteres ou relations a connaitre
3. Conditions d'application et distinctions entre cas
4. Methode ou raisonnement type en etapes
5. Pieges de notation, de signe, de condition ou de confusion conceptuelle
6. Flashcards centrees sur formules, criteres, distinctions et applications`,
    processus: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS DE PROCESSUS :
1. Idee centrale du mecanisme ou du cycle
2. Etapes successives du processus dans le bon ordre
3. Acteurs, structures ou elements impliques
4. Schema de flux ou de transformation
5. Consequences, regulation, exceptions ou points de vigilance
6. Flashcards centrees sur l'ordre, les roles et les relations de cause a effet`,
    conceptuel: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS CONCEPTUEL :
1. Idee ou these centrale en une phrase
2. Definitions rigoureuses des notions pivots
3. Distinctions importantes entre notions proches
4. Exemple ou cas d'application qui concretise le concept
5. Erreurs d'interpretation ou contresens frequents
6. Flashcards centrees sur distinctions, consequences et articulation des idees`,
    algorithmique: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS ALGORITHMIQUE :
1. But de l'algorithme ou du mecanisme
2. Entrees, sorties et objets manipules
3. Etapes de l'algorithme ou transitions d'etat
4. Pseudocode, complexite, cas limites ou invariants s'ils existent
5. Exemple d'execution ou cas test
6. Flashcards centrees sur logique, structure, cas limites et interpretation`,
    comparatif: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS COMPARATIF :
1. Idee directrice de la comparaison
2. Tableau mental ou distinctions entre categories, types ou periodes
3. Points communs et differences essentielles
4. Exemple typique de chaque categorie
5. Confusions frequentes entre categories proches
6. Flashcards centrees sur distinctions, criteres et reperes`,
    chronologique: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS CHRONOLOGIQUE :
1. Contexte de depart et cadre temporel
2. Grandes periodes ou etapes dans le bon ordre
3. Acteurs, tournants et enjeux
4. Debats, interpretations ou memoires s'ils existent
5. Reperes dates/faits a retenir
6. Flashcards centrees sur chronologie, acteurs, ruptures et enjeux`,
    "cas-pratique": `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS DE CAS PRATIQUES :
1. Regle, principe ou cadre de base
2. Conditions d'application
3. Methode de raisonnement ou de decision
4. Cas typique ou exemple applique
5. Exceptions, contre-exemples ou erreurs frequentes
6. Flashcards centrees sur situations, conditions et choix de la bonne regle`,
    taxonomique: `
STRUCTURE PEDAGOGIQUE A PRIVILEGIER - COURS TAXONOMIQUE :
1. Idee generale de la classification
2. Categories principales
3. Sous-categories ou niveaux
4. Critere de classement
5. Exemples typiques et confusions frequentes
6. Flashcards centrees sur classement, reperage et distinction`,
  };

  return `${familyBlueprints[profile.famille_pedagogique]}

REGLE DE PERTINENCE DES NOTIONS CLES :
- Les notionsCles doivent etre choisies par centralite conceptuelle, jamais par simple frequence
- Interdis explicitement les mots meta ou scolaires du type : chapitre, cours, notion, methode, exercice, exemple, introduction, conclusion
- Une notion cle doit etre indispensable pour comprendre ou reconstituer le chapitre

REGLE SUR L'OBJECTIF DE REVISION :
- L'objectif de revision principal detecte est : ${profile.objectif_revision}
- Si l'objectif est "resoudre", privilegie methodes, conditions, formules et pieges d'application
- Si l'objectif est "memoriser", privilegie les notions pivots, reperes, categories et images mentales
- Si l'objectif est "raisonner" ou "rediger", privilegie articulations, distinctions, arguments et enchainements logiques
- Si l'objectif est "programmer", privilegie flux, structures, cas limites, etats et execution
- Si l'objectif est "comparer", privilegie oppositions, criteres, tableaux et contrastes
- Si l'objectif est "analyser", privilegie lecture de documents, interpretation, mecanismes et causes/effets

${levelGuard}`;
}
