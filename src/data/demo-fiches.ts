import type { FicheGeneree } from "@/types/fiche-generated";

export const DEMO_FICHES: Record<string, FicheGeneree> = {
  "Mathématiques": {
    titre: "Les Probabilités",
    matiere: "Mathématiques",
    niveau: "Terminale",
    metriques: [
      { valeur: "P(Ω)=1", label: "Certitude" },
      { valeur: "P(∅)=0", label: "Impossibilité" },
      { valeur: "P(Ā)=1-P(A)", label: "Événement contraire" },
    ],
    notionsCles: ["Expérience aléatoire", "Univers Ω", "Événement A", "Probabilité P(A)"],
    formulesCles: [
      "$$P(A) = \\frac{\\text{issues favorables}}{\\text{issues totales}}$$",
      "$$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$$",
      "$$P(\\bar{A}) = 1 - P(A)$$",
    ],
    imageMentale: {
      titre: "Le dé truqué",
      texte:
        "Imagine un sac avec des billes : tu ne vois pas dedans, mais tu sais combien il y en a de chaque couleur. La probabilité, c'est la proportion de billes favorables sur le total — avant même de plonger la main.",
    },
    definition:
      "La probabilité d'un événement A est un nombre entre 0 et 1 qui mesure la chance que cet événement se réalise lors d'une expérience aléatoire. Si les issues sont équiprobables : P(A) = nombre d'issues favorables / nombre d'issues totales. P(Ω)=1 (certain), P(∅)=0 (impossible).",
    exemple:
      "On lance un dé équilibré à 6 faces. Probabilité d'obtenir un nombre pair : issues favorables = {2,4,6}, soit 3 issues sur 6 au total. P(pair) = 3/6 = 1/2. Probabilité de ne pas obtenir de 6 : P(non 6) = 1 - P(6) = 1 - 1/6 = 5/6.",
    piege:
      "PIÈGE : Confondre 'issue' et 'événement'. Une issue est un résultat élémentaire (ex: obtenir 3), un événement est un ensemble d'issues (ex: obtenir un pair = {2,4,6}).\nCORRECT : P(A∪B) = P(A)+P(B) seulement si A et B sont incompatibles (A∩B=∅). Sinon il faut soustraire P(A∩B).",
    schema: {
      type: "relations",
      description: "Structure des probabilités",
      elements: [
        { id: "e1", label: "Expérience aléatoire", couleur: "bleu" },
        { id: "e2", label: "Univers Ω", couleur: "teal" },
        { id: "e3", label: "Événement A", couleur: "violet" },
        { id: "e4", label: "Probabilité P(A)", couleur: "coral" },
        { id: "e5", label: "Événement contraire Ā", couleur: "gris" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "définit" },
        { de: "e2", vers: "e3", label: "contient" },
        { de: "e3", vers: "e4", label: "mesure" },
        { de: "e3", vers: "e5", label: "complément" },
      ],
    },
    feynman:
      "Imagine que tu joues à pile ou face avec une pièce. Sur 1 000 lancers, tu verras environ 500 piles et 500 faces. La probabilité, c'est exactement ça : si tu répètes l'expérience un nombre infini de fois, la proportion de fois où l'événement arrive tend vers un nombre précis. Ce nombre, c'est sa probabilité.",
    flashcards: [
      {
        question: "Qu'est-ce que la probabilité d'un événement A ?",
        reponse:
          "Un nombre entre 0 et 1 mesurant la chance que A se réalise. Si les issues sont équiprobables : P(A) = issues favorables / issues totales.",
      },
      {
        question: "Quelle est la formule de P(A∪B) lorsque A et B ne sont pas incompatibles ?",
        reponse: "P(A∪B) = P(A) + P(B) − P(A∩B). On soustrait l'intersection pour ne pas la compter deux fois.",
      },
      {
        question: "Comment calcule-t-on P(Ā), la probabilité de l'événement contraire ?",
        reponse: "P(Ā) = 1 − P(A). La somme d'un événement et de son contraire est toujours égale à 1.",
      },
      {
        question: "Quelle est la différence entre une issue et un événement ?",
        reponse:
          "Une issue est un résultat élémentaire (ex: obtenir 3 sur un dé). Un événement est un ensemble d'issues (ex: obtenir un nombre pair = {2,4,6}).",
      },
      {
        question: "Quand deux événements A et B sont-ils dits équiprobables ?",
        reponse:
          "Lorsque toutes les issues de l'univers ont la même probabilité d'apparaître. On peut alors calculer P(A) = |A| / |Ω|.",
      },
      {
        question: "Qu'affirme la loi des grands nombres concernant les probabilités ?",
        reponse:
          "Lorsqu'on répète une expérience aléatoire un très grand nombre de fois, la fréquence relative d'un événement se rapproche de sa probabilité théorique.",
      },
    ],
  },

  "Physique-Chimie": {
    titre: "Les Transformations Chimiques",
    matiere: "Physique-Chimie",
    niveau: "Première",
    metriques: [
      { valeur: "n=m/M", label: "Quantité de matière" },
      { valeur: "τ=xf/xmax", label: "Taux d'avancement" },
      { valeur: "22,4 L/mol", label: "Volume molaire (CNTP)" },
    ],
    notionsCles: ["Réactif limitant", "Avancement x", "Taux d'avancement τ", "Conservation de la masse"],
    formulesCles: [
      "$$n = \\frac{m}{M}$$",
      "$$\\tau = \\frac{x_f}{x_{max}}$$",
      "$$C = \\frac{n}{V}$$",
    ],
    imageMentale: {
      titre: "La recette de cuisine",
      texte:
        "Une réaction chimique, c'est comme une recette : tu as des ingrédients (réactifs) qui se transforment en plat (produits). Si tu n'as plus de farine (réactif limitant), tu ne peux plus faire de gâteau même si tu as des œufs en excès. L'avancement x, c'est la progression de la recette.",
    },
    definition:
      "Une transformation chimique est une réaction au cours de laquelle des réactifs disparaissent pour former des produits, selon une équation bilan équilibrée. La loi de conservation de la masse s'applique : m(réactifs) = m(produits). Le réactif limitant est celui entièrement consommé en premier. Le taux d'avancement τ = xf/xmax indique si la réaction est totale (τ=1) ou limitée (τ<1).",
    exemple:
      "Réaction : 2H₂ + O₂ → 2H₂O. On dispose de 4 mol de H₂ et 1 mol de O₂. Avancement maximal : limité par O₂ (1 mol consomme 2 mol H₂, donc xmax = 1 mol). Réactif limitant : O₂. Masse d'eau produite : n(H₂O) = 2×1 = 2 mol, m = 2×18 = 36 g. Vérification : 4g(H₂) + 32g(O₂) = 36g(H₂O) ✓",
    piege:
      "PIÈGE : Oublier d'équilibrer l'équation avant de calculer les quantités de matière.\nCORRECT : On équilibre d'abord (conservation des atomes), puis on détermine le réactif limitant en comparant les rapports n/coefficient stoechiométrique pour chaque réactif. Le plus petit rapport donne le réactif limitant.",
    schema: {
      type: "processus",
      description: "Déroulement d'une transformation chimique",
      elements: [
        { id: "e1", label: "Réactifs", couleur: "bleu" },
        { id: "e2", label: "Équation bilan", couleur: "teal" },
        { id: "e3", label: "Avancement x", couleur: "violet" },
        { id: "e4", label: "Réactif limitant", couleur: "coral" },
        { id: "e5", label: "Produits", couleur: "gris" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "équilibrer" },
        { de: "e2", vers: "e3", label: "calculer" },
        { de: "e3", vers: "e4", label: "identifier" },
        { de: "e4", vers: "e5", label: "→ produits" },
      ],
    },
    feynman:
      "Imagine que tu construis des voitures. Chaque voiture nécessite 4 roues et 1 moteur. Si tu as 20 roues et 3 moteurs, tu peux faire seulement 3 voitures (limité par les moteurs). Les roues, tu en as trop. C'est exactement ça le réactif limitant : l'ingrédient qui s'épuise en premier et qui bloque la réaction.",
    flashcards: [
      {
        question: "Qu'est-ce que le réactif limitant dans une transformation chimique ?",
        reponse:
          "C'est le réactif entièrement consommé en premier, qui détermine la quantité maximale de produits formés.",
      },
      {
        question: "Comment identifier le réactif limitant à partir des quantités initiales ?",
        reponse:
          "On calcule le rapport n/coefficient stoechiométrique pour chaque réactif. Celui qui donne le plus petit rapport est le réactif limitant.",
      },
      {
        question: "Que représente le taux d'avancement τ et quand vaut-il 1 ?",
        reponse:
          "τ = xf/xmax mesure la progression de la réaction. τ = 1 signifie que la réaction est totale (le réactif limitant est entièrement consommé).",
      },
      {
        question: "Quelle est la différence entre une réaction totale et une réaction limitée ?",
        reponse:
          "Une réaction totale (τ=1) consomme complètement le réactif limitant. Une réaction limitée (τ<1) atteint un état d'équilibre avant consommation totale.",
      },
      {
        question: "Quelle est la méthode pour résoudre un exercice de transformation chimique ?",
        reponse:
          "1) Écrire et équilibrer l'équation. 2) Calculer les quantités de matière (n=m/M). 3) Identifier le réactif limitant (rapport n/coefficient). 4) Calculer les quantités de produits formés.",
      },
      {
        question: "Un élève calcule n(H₂O) sans équilibrer 2H₂ + O₂ → 2H₂O. Quelle erreur commet-il ?",
        reponse:
          "Sans équilibrage, les coefficients stoechiométriques sont incorrects, ce qui fausse le calcul du réactif limitant et des masses de produits.",
      },
    ],
  },

  "SVT": {
    titre: "La Photosynthèse",
    matiere: "SVT",
    niveau: "Première",
    metriques: [
      { valeur: "6CO₂+6H₂O→C₆H₁₂O₆+6O₂", label: "Équation bilan" },
      { valeur: "2 phases", label: "Étapes" },
      { valeur: "Chloroplaste", label: "Lieu" },
    ],
    notionsCles: ["Chloroplaste", "Phase photochimique", "Cycle de Calvin", "Glucose"],
    formulesCles: [],
    imageMentale: {
      titre: "L'usine solaire",
      texte:
        "Le chloroplaste est une usine alimentée par le soleil. Elle prend deux matières premières gratuites — le CO₂ de l'air et l'eau du sol — et fabrique du sucre (glucose) comme carburant pour la plante, en rejetant de l'oxygène comme déchet. Deux chaînes de production : l'une capte l'énergie lumineuse, l'autre fabrique le sucre.",
    },
    definition:
      "La photosynthèse est le processus par lequel les végétaux chlorophylliens synthétisent de la matière organique (glucose) à partir de matière minérale (CO₂, H₂O) en utilisant l'énergie lumineuse. Elle se déroule dans les chloroplastes en deux phases : la phase photochimique (thylakoïdes) qui capte la lumière et produit ATP+NADPH, et le cycle de Calvin (stroma) qui réduit le CO₂ en glucose.",
    exemple:
      "Une feuille exposée 1h à la lumière : phase 1 dans les thylakoïdes — les photons excitent la chlorophylle, l'eau est oxydée (libère O₂), l'ATP et le NADPH sont produits. Phase 2 dans le stroma — le CO₂ est capté et réduit grâce à l'ATP et au NADPH pour former du glycéraldéhyde-3-phosphate (G3P), précurseur du glucose.",
    piege:
      "PIÈGE : Croire que la photosynthèse se fait uniquement le jour et que la respiration uniquement la nuit.\nCORRECT : La respiration cellulaire se déroule en permanence (jour ET nuit). La photosynthèse, elle, nécessite de la lumière. La nuit, seule la respiration a lieu, donc la plante consomme du O₂ et rejette du CO₂.",
    schema: {
      type: "processus",
      description: "Les deux phases de la photosynthèse",
      elements: [
        { id: "e1", label: "Lumière solaire", couleur: "gris" },
        { id: "e2", label: "Phase photochimique", couleur: "bleu" },
        { id: "e3", label: "ATP + NADPH", couleur: "teal" },
        { id: "e4", label: "Cycle de Calvin", couleur: "violet" },
        { id: "e5", label: "Glucose (C₆H₁₂O₆)", couleur: "coral" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "énergie" },
        { de: "e2", vers: "e3", label: "produit" },
        { de: "e3", vers: "e4", label: "alimente" },
        { de: "e4", vers: "e5", label: "synthétise" },
      ],
    },
    feynman:
      "Imagine une plante comme un robot solaire. Elle a deux usines internes. La première usine (dans les thylakoïdes) capte les rayons du soleil comme des panneaux solaires — elle décompose l'eau et stocke l'énergie sous forme d'ATP. La deuxième usine (le cycle de Calvin) utilise cette énergie pour assembler des molécules de CO₂ et fabriquer du sucre, comme un constructeur qui assemble des briques.",
    flashcards: [
      {
        question: "Quelle est l'équation bilan simplifiée de la photosynthèse ?",
        reponse: "6CO₂ + 6H₂O + lumière → C₆H₁₂O₆ (glucose) + 6O₂",
      },
      {
        question: "Où se déroulent les deux phases de la photosynthèse dans le chloroplaste ?",
        reponse:
          "La phase photochimique se déroule dans les thylakoïdes (membranes internes). Le cycle de Calvin se déroule dans le stroma (liquide entourant les thylakoïdes).",
      },
      {
        question: "Quels sont les produits de la phase photochimique utilisés par le cycle de Calvin ?",
        reponse:
          "L'ATP (énergie chimique) et le NADPH (pouvoir réducteur), tous deux produits lors de la capture de l'énergie lumineuse.",
      },
      {
        question: "Quelle est la différence entre photosynthèse et respiration cellulaire ?",
        reponse:
          "La photosynthèse consomme CO₂ et H₂O pour produire glucose et O₂ (nécessite la lumière). La respiration cellulaire consomme glucose et O₂ pour produire CO₂, H₂O et ATP (se déroule en permanence).",
      },
      {
        question: "Quelle molécule capte la lumière lors de la phase photochimique ?",
        reponse:
          "La chlorophylle, pigment vert contenu dans les thylakoïdes. Elle absorbe principalement les longueurs d'onde rouge et bleue.",
      },
      {
        question: "La nuit, une plante produit-elle ou consomme-t-elle du CO₂ ? Justifie.",
        reponse:
          "La nuit, la plante consomme du O₂ et rejette du CO₂, car seule la respiration cellulaire a lieu (la photosynthèse nécessite de la lumière et est donc arrêtée).",
      },
    ],
  },

  "Histoire-Géographie": {
    titre: "La Première Guerre Mondiale",
    matiere: "Histoire-Géographie",
    niveau: "Première",
    metriques: [
      { valeur: "1914-1918", label: "Durée" },
      { valeur: "17M morts", label: "Bilan humain" },
      { valeur: "1919", label: "Traité de Versailles" },
    ],
    notionsCles: ["Guerre de tranchées", "Triple Entente", "Brutalisation", "Traité de Versailles"],
    formulesCles: [],
    imageMentale: {
      titre: "L'engrenage fatal",
      texte:
        "L'Europe de 1914 ressemble à des dominos alignés : l'attentat de Sarajevo fait tomber le premier, et les alliances enchaînées font tomber tous les autres en quelques semaines. Une fois l'engrenage lancé, personne ne peut l'arrêter — c'est la mécanique des alliances qui transforme un assassinat en guerre mondiale.",
    },
    definition:
      "La Première Guerre mondiale (1914-1918) est un conflit mondial déclenché par l'assassinat de l'archiduc François-Ferdinand à Sarajevo (28 juin 1914). Les alliances opposent la Triple Entente (France, Royaume-Uni, Russie) à la Triple Alliance (Allemagne, Autriche-Hongrie, Empire ottoman). La guerre est caractérisée par une guerre de positions (tranchées), l'utilisation d'armes nouvelles (gaz, chars, aviation) et une brutalisation des combats.",
    exemple:
      "Bataille de Verdun (février-décembre 1916) : symbole de la guerre de tranchées. 300 000 morts en 10 mois pour un gain territorial quasi nul. Les soldats (poilus) vivent dans des conditions inhumaines. Cette bataille illustre la 'brutalisation' — la déshumanisation progressive des combattants et le dépassement des normes morales en temps de guerre.",
    piege:
      "PIÈGE : Croire que la Première Guerre mondiale a été causée uniquement par l'attentat de Sarajevo.\nCORRECT : L'attentat est le détonateur, pas la cause profonde. Les causes profondes sont : le système d'alliances rigides, les nationalismes exacerbés, l'impérialisme colonial et la course aux armements depuis les années 1870. L'attentat a mis le feu aux poudres d'une Europe déjà explosive.",
    schema: {
      type: "processus",
      description: "De l'attentat à la guerre mondiale",
      elements: [
        { id: "e1", label: "Attentat Sarajevo", couleur: "coral" },
        { id: "e2", label: "Système d'alliances", couleur: "bleu" },
        { id: "e3", label: "Mobilisation générale", couleur: "violet" },
        { id: "e4", label: "Guerre de tranchées", couleur: "gris" },
        { id: "e5", label: "Traité de Versailles", couleur: "teal" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "déclenche" },
        { de: "e2", vers: "e3", label: "active" },
        { de: "e3", vers: "e4", label: "→" },
        { de: "e4", vers: "e5", label: "aboutit à" },
      ],
    },
    feynman:
      "Imagine l'Europe de 1914 comme une cour de récréation divisée en deux bandes rivales. Chaque bande a juré de défendre ses alliés. Un jour, un élève d'une bande frappe un élève de l'autre. Les chefs de bande interviennent, puis leurs amis, puis leurs amis… En une semaine, toute la cour se bat, même ceux qui n'avaient rien demandé. C'est exactement ça, le système d'alliances de 1914.",
    flashcards: [
      {
        question: "Quel événement déclenche la Première Guerre mondiale et quand ?",
        reponse:
          "L'assassinat de l'archiduc François-Ferdinand d'Autriche à Sarajevo le 28 juin 1914, par Gavrilo Princip, nationaliste serbe.",
      },
      {
        question: "Quels pays composent la Triple Entente et la Triple Alliance en 1914 ?",
        reponse:
          "Triple Entente : France, Royaume-Uni, Russie. Triple Alliance : Allemagne, Autriche-Hongrie, Empire ottoman (l'Italie reste neutre puis rejoint l'Entente en 1915).",
      },
      {
        question: "Qu'est-ce que la 'brutalisation' selon l'historien George Mosse ?",
        reponse:
          "C'est le processus par lequel la violence de guerre déshumanise progressivement les combattants, abaisse le seuil de tolérance à la violence et normalise les comportements brutaux.",
      },
      {
        question: "Quelle est la différence entre les causes profondes et le déclencheur de la guerre ?",
        reponse:
          "L'attentat de Sarajevo est le déclencheur (étincelle). Les causes profondes sont : alliances rigides, nationalismes, impérialisme et course aux armements depuis les années 1870.",
      },
      {
        question: "Quelles sont les principales clauses du Traité de Versailles (1919) ?",
        reponse:
          "L'Allemagne reconnaît sa culpabilité (article 231), paie des réparations, perd des territoires (Alsace-Lorraine à la France) et voit son armée limitée à 100 000 hommes.",
      },
      {
        question: "Donne un exemple concret illustrant la guerre de tranchées et ses conditions.",
        reponse:
          "La bataille de Verdun (fév.-déc. 1916) : 300 000 morts en 10 mois pour un gain territorial quasi nul. Les poilus vivent dans la boue, sous les obus, exposés aux gaz, illustrant l'absurdité de la guerre d'usure.",
      },
    ],
  },

  "Français": {
    titre: "L'Argumentation",
    matiere: "Français",
    niveau: "Première",
    metriques: [
      { valeur: "Convaincre", label: "→ Raison" },
      { valeur: "Persuader", label: "→ Émotions" },
      { valeur: "Thèse+Arguments+Exemples", label: "Structure de base" },
    ],
    notionsCles: ["Thèse", "Argument", "Connecteurs logiques", "Figures de style argumentatives"],
    formulesCles: [],
    imageMentale: {
      titre: "L'avocat au tribunal",
      texte:
        "Argumenter, c'est être un avocat devant un jury : tu as une position à défendre (thèse), des preuves à apporter (arguments), des exemples concrets (illustrations), et tu dois convaincre par la logique OU persuader par les émotions selon ton jury. Les connecteurs, c'est ta façon de guider le jury dans ton raisonnement.",
    },
    definition:
      "L'argumentation est l'ensemble des procédés par lesquels un locuteur cherche à modifier l'opinion de son destinataire. Convaincre fait appel à la raison (arguments logiques, preuves, faits). Persuader fait appel aux émotions et à la sensibilité. La structure de base : thèse (position défendue) + arguments (raisons) + exemples (illustrations). Les connecteurs logiques organisent la progression du discours.",
    exemple:
      "Texte : 'Les réseaux sociaux nuisent à la concentration des jeunes. En effet, les notifications constantes fragmentent l'attention en micro-interruptions (argument). Ainsi, une étude Microsoft (2015) montre que la durée d'attention moyenne est passée de 12 à 8 secondes en 15 ans (exemple). Par conséquent, les établissements scolaires devraient interdire les téléphones en classe (conclusion).' Connecteurs utilisés : 'en effet' (cause), 'ainsi' (illustration), 'par conséquent' (conséquence).",
    piege:
      "PIÈGE : Confondre argument et exemple. L'argument est une raison abstraite qui soutient la thèse. L'exemple est un cas concret qui illustre l'argument.\nCORRECT : Ordre obligatoire = Thèse → Argument → Exemple (jamais l'inverse). Un exemple seul ne prouve rien sans l'argument général qui le précède.",
    schema: {
      type: "processus",
      description: "Structure d'un texte argumentatif",
      elements: [
        { id: "e1", label: "Thèse", couleur: "bleu" },
        { id: "e2", label: "Arguments", couleur: "teal" },
        { id: "e3", label: "Exemples", couleur: "violet" },
        { id: "e4", label: "Connecteurs", couleur: "gris" },
        { id: "e5", label: "Conclusion", couleur: "coral" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "soutenue par" },
        { de: "e2", vers: "e3", label: "illustré par" },
        { de: "e4", vers: "e2", label: "articulent" },
        { de: "e2", vers: "e5", label: "aboutit à" },
      ],
    },
    feynman:
      "Tu veux convaincre tes parents de te laisser sortir le soir. Tu ne dis pas juste 'j'ai envie' (ce n'est pas un argument). Tu dis : 'Ça développe mon autonomie (thèse) parce que j'apprends à gérer mon temps et à faire des choix responsables (argument). D'ailleurs, les enfants qui sortent en groupe ont de meilleurs résultats sociaux à l'âge adulte selon des études (exemple).' Voilà comment fonctionne l'argumentation.",
    flashcards: [
      {
        question: "Quelle est la différence entre convaincre et persuader ?",
        reponse:
          "Convaincre fait appel à la raison (arguments logiques, faits, preuves). Persuader fait appel aux émotions et à la sensibilité du destinataire.",
      },
      {
        question: "Donne un exemple de texte argumentatif avec thèse, argument et exemple.",
        reponse:
          "Thèse : 'Les réseaux sociaux nuisent à la concentration.' Argument : 'Les notifications fragmentent l'attention.' Exemple : 'Une étude montre que la durée d'attention est passée de 12 à 8 secondes en 15 ans.'",
      },
      {
        question: "Quelle est la différence entre un argument et un exemple ?",
        reponse:
          "L'argument est une raison abstraite et générale qui soutient la thèse. L'exemple est un cas concret et particulier qui illustre et renforce l'argument.",
      },
      {
        question: "Quel est le piège classique à éviter dans la construction d'un paragraphe argumentatif ?",
        reponse:
          "Commencer par l'exemple avant l'argument. L'ordre obligatoire est : Thèse → Argument → Exemple. Un exemple seul sans argument général ne prouve rien.",
      },
      {
        question: "Cite 3 connecteurs logiques et leur fonction dans un texte argumentatif.",
        reponse:
          "'En effet' (explication/cause), 'Par conséquent' / 'Donc' (conséquence), 'Cependant' / 'Or' (opposition/nuance), 'Ainsi' / 'Par exemple' (illustration).",
      },
      {
        question: "Comment reconnaître une figure de style argumentative dans un texte ?",
        reponse:
          "Elle cherche à influencer le lecteur : la métaphore crée une image frappante, l'hyperbole insiste, la question rhétorique interpelle, l'anaphore martèle une idée par répétition.",
      },
    ],
  },

  "Philosophie": {
    titre: "La Conscience et l'Inconscient",
    matiere: "Philosophie",
    niveau: "Terminale",
    metriques: [
      { valeur: "Cogito", label: "Descartes" },
      { valeur: "Ça/Moi/Surmoi", label: "Freud" },
      { valeur: "Liberté vs Déterminisme", label: "Enjeu central" },
    ],
    notionsCles: ["Conscience réflexive", "Inconscient freudien", "Cogito cartésien", "Déterminisme psychique"],
    formulesCles: [],
    imageMentale: {
      titre: "L'iceberg",
      texte:
        "La psyché humaine est un iceberg : la conscience, c'est la partie visible au-dessus de l'eau — ce dont tu es aware, tes pensées présentes. L'inconscient, c'est la masse immergée et invisible qui détermine pourtant la direction du bateau. Freud dit que nos actes sont guidés par cette partie cachée que nous ne contrôlons pas.",
    },
    definition:
      "La conscience est la capacité de l'être humain à se représenter lui-même et le monde (conscience réflexive). Descartes fonde la certitude sur le cogito : 'Je pense donc je suis'. Pour Freud, l'inconscient est un système psychique contenant des désirs refoulés qui influencent notre comportement à notre insu. Les trois instances freudiennes : le Ça (pulsions), le Moi (médiateur entre Ça et réalité), le Surmoi (intériorisation des normes sociales).",
    exemple:
      "Acte manqué (Freud) : tu 'oublies' l'anniversaire de quelqu'un que tu n'apprécies pas. Pour Freud, ce n'est pas un hasard : ton inconscient exprime un désir (ne pas célébrer cette personne) que ta conscience censure. L'oubli est la manifestation d'un conflit entre le Ça (hostilité) et le Surmoi (normes de politesse). Cela montre que nous ne sommes pas maîtres de nos actes.",
    piege:
      "PIÈGE : Confondre 'inconscient' (Freud : système dynamique avec des désirs refoulés) et 'non-conscient' (simple absence de conscience, ex: la digestion).\nCORRECT : L'inconscient freudien est ACTIF — il cherche à s'exprimer, il provoque des rêves, des lapsus, des actes manqués. Ce n'est pas juste 'ce dont on n'a pas conscience' mais une force psychique qui agit contre la volonté consciente.",
    schema: {
      type: "relations",
      description: "Conscience et inconscient selon Freud et Descartes",
      elements: [
        { id: "e1", label: "Conscience réflexive", couleur: "bleu" },
        { id: "e2", label: "Cogito (Descartes)", couleur: "teal" },
        { id: "e3", label: "Inconscient (Freud)", couleur: "violet" },
        { id: "e4", label: "Ça / Moi / Surmoi", couleur: "coral" },
        { id: "e5", label: "Liberté & Déterminisme", couleur: "gris" },
      ],
      connexions: [
        { de: "e1", vers: "e2", label: "fondée par" },
        { de: "e3", vers: "e4", label: "structure" },
        { de: "e1", vers: "e3", label: "s'oppose à" },
        { de: "e3", vers: "e5", label: "questionne" },
      ],
    },
    feynman:
      "Tu crois contrôler tes choix, mais Freud dit que c'est une illusion. Imagine un iceberg : tu vois le sommet (ta conscience, tes décisions 'rationnelles'), mais sous l'eau il y a une masse énorme (l'inconscient) qui oriente silencieusement le bateau. Quand tu tombes amoureux de quelqu'un qui ressemble à ta mère, ce n'est pas 'rationnel' — c'est ton inconscient qui joue. Descartes, lui, pense que la conscience est le seul point fixe certain : 'je pense, donc je suis' — même si tout le reste est illusion.",
    flashcards: [
      {
        question: "Qu'est-ce que la conscience réflexive selon Descartes ?",
        reponse:
          "C'est la capacité de l'être humain à se prendre lui-même pour objet de pensée. Le cogito ('Je pense donc je suis') en est le fondement : la conscience de penser est la seule certitude absolue.",
      },
      {
        question: "Donne un exemple d'acte manqué et explique son interprétation freudienne.",
        reponse:
          "Oublier l'anniversaire de quelqu'un qu'on n'aime pas. Pour Freud, ce n'est pas un hasard : l'inconscient exprime un désir (ne pas célébrer cette personne) que la conscience censure.",
      },
      {
        question: "Quelle est la différence entre l'inconscient freudien et le simple 'non-conscient' ?",
        reponse:
          "Le non-conscient est une simple absence de conscience (ex: la digestion). L'inconscient freudien est ACTIF : il contient des désirs refoulés qui cherchent à s'exprimer via rêves, lapsus, actes manqués.",
      },
      {
        question: "Quel est le piège classique en philosophie sur la conscience et le libre arbitre ?",
        reponse:
          "Croire que la conscience garantit la liberté. Pour Freud, nous sommes déterminés par notre inconscient. La conscience n'est que la partie visible de notre psyché, masquant des forces qui nous gouvernent.",
      },
      {
        question: "Comment Freud articule-t-il les trois instances psychiques Ça, Moi et Surmoi ?",
        reponse:
          "Le Ça contient les pulsions primitives. Le Surmoi intériorise les normes sociales et morales. Le Moi est le médiateur entre les exigences du Ça, du Surmoi et de la réalité extérieure.",
      },
      {
        question: "En quoi la thèse de Freud sur l'inconscient remet-elle en cause la liberté humaine ?",
        reponse:
          "Si nos actes sont déterminés par des désirs inconscients que nous ne contrôlons pas, alors nous ne sommes pas vraiment libres. Le sujet croit choisir, mais il est en réalité guidé par des forces psychiques qui lui échappent.",
      },
    ],
  },
};
