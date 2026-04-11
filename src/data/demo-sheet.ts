import type { FicheGeneree } from "@/types/fiche-generated";

export const demoSheet: FicheGeneree = {
  titre: "Les fonctions affines",
  matiere: "Mathématiques",
  subjectFamily: "mathematiques",
  niveau: "3ème",
  blueprintId: "formulaire",
  metriques: [
    { valeur: "9", label: "parties du cours" },
    { valeur: "6", label: "formules et relations" },
    { valeur: "5", label: "proprietes et criteres" },
  ],
  imageMentale: {
    titre: "La fonction affine comme une machine à transformer",
    texte:
      "f(x) = ax + b, c'est une machine : tu entres x, tu multiplies par a (la pente), tu ajoutes b (le décalage). Le résultat, c'est y. Chaque valeur de x donne exactement une valeur de y — jamais deux.",
  },
  definition:
    "Une fonction affine est une fonction de la forme f(x) = ax + b, où a est le coefficient directeur (pente de la droite) et b l'ordonnée à l'origine (point où la droite coupe l'axe des y). Sa représentation graphique est toujours une droite.",
  formulesCles: [
    "f(x) = ax + b",
    "Coefficient directeur : a = (yB - yA) / (xB - xA)",
    "Si a > 0 : fonction croissante — droite montante",
    "Si a < 0 : fonction décroissante — droite descendante",
    "Si a = 0 : fonction constante f(x) = b — droite horizontale",
    "Ordonnée à l'origine : b = f(0)",
  ],
  notionsCles: [
    "Le coefficient directeur a mesure l'inclinaison : plus |a| est grand, plus la droite est pentue",
    "b est la valeur de f quand x = 0 — c'est le point de départ sur l'axe y",
    "Deux points suffisent pour tracer une droite",
    "Une fonction linéaire est un cas particulier où b = 0, donc f(x) = ax",
    "Pour trouver a et b : poser un système de deux équations avec deux points connus",
  ],
  exemple:
    "Un taxi facture 2€ par km + 5€ de prise en charge. Le prix est f(x) = 2x + 5. Pour 10 km : f(10) = 2×10 + 5 = 25€. Le coefficient directeur a = 2 est le tarif au km, b = 5 est le forfait de départ.",
  piege:
    "Confondre coefficient directeur et ordonnée à l'origine. Dans f(x) = 3x + 2, a = 3 (pas 2) et b = 2 (pas 3). Astuce : a est toujours devant le x, b est le terme seul.",
  schema: {
    type: "formule",
    description:
      "La fonction affine s'organise autour de sa forme générale, de ses deux paramètres et du sens de variation de la droite.",
    elements: [
      { id: "node_1", label: "f(x) = ax + b", couleur: "bleu" },
      { id: "node_2", label: "Coefficient directeur a", couleur: "teal" },
      { id: "node_3", label: "Pente de la droite", couleur: "gris" },
      { id: "node_4", label: "Ordonnée à l'origine b", couleur: "violet" },
      { id: "node_5", label: "Point (0, b)", couleur: "coral" },
      { id: "node_6", label: "a > 0", couleur: "teal" },
      { id: "node_7", label: "Fonction croissante", couleur: "bleu" },
      { id: "node_8", label: "a < 0", couleur: "violet" },
      { id: "node_9", label: "Fonction décroissante", couleur: "coral" },
      { id: "node_10", label: "Cas particulier : b = 0", couleur: "gris" },
      { id: "node_11", label: "Fonction linéaire f(x) = ax", couleur: "teal" },
    ],
    connexions: [
      { de: "node_1", vers: "node_2", label: "contient" },
      { de: "node_2", vers: "node_3", label: "détermine" },
      { de: "node_1", vers: "node_4", label: "contient" },
      { de: "node_4", vers: "node_5", label: "repère" },
      { de: "node_1", vers: "node_6", label: "si" },
      { de: "node_6", vers: "node_7", label: "alors" },
      { de: "node_1", vers: "node_8", label: "si" },
      { de: "node_8", vers: "node_9", label: "alors" },
      { de: "node_1", vers: "node_10", label: "cas" },
      { de: "node_10", vers: "node_11", label: "devient" },
    ],
  },
  feynman:
    "Imagine une machine distributrice de bonbons. Tu mets x pièces, elle te rend toujours 2 fois ce que tu mets, plus 3 bonbons gratuits. Donc y = 2x + 3. Tu mets 5 pièces ? Tu reçois 13 bonbons. Le 2, c'est la générosité de la machine. Le 3, c'est le cadeau de départ.",
  flashcards: [
    {
      question: "Quelle est la forme générale d'une fonction affine ?",
      reponse: "f(x) = ax + b, où a est le coefficient directeur et b l'ordonnée à l'origine.",
    },
    {
      question: "Comment calculer le coefficient directeur entre deux points A et B ?",
      reponse:
        "a = (yB - yA) / (xB - xA). C'est le rapport de la variation de y sur la variation de x.",
    },
    {
      question: "Que représente b dans f(x) = ax + b ?",
      reponse:
        "b est l'ordonnée à l'origine : la valeur de f(0), c'est-à-dire où la droite coupe l'axe des y.",
    },
    {
      question: "Quelle est la différence entre fonction affine et fonction linéaire ?",
      reponse:
        "Une fonction linéaire est f(x) = ax (b = 0). La droite passe par l'origine. C'est un cas particulier de la fonction affine.",
    },
    {
      question: "Un taxi prend 3€/km + 4€ de forfait. Quelle est la fonction ? Combien pour 8 km ?",
      reponse: "f(x) = 3x + 4. Pour 8 km : f(8) = 3×8 + 4 = 28€.",
    },
    {
      question: "Comment tracer la droite de f(x) = 2x - 1 ?",
      reponse:
        "Calculer deux points : f(0) = -1 → point (0, -1). f(2) = 3 → point (2, 3). Tracer la droite passant par ces deux points.",
    },
  ],
};
