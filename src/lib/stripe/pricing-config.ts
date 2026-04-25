export const PRICING_TIERS = {
  FREE: {
    tier: "FREE" as const,
    name: "Gratuit",
    price: 0,
    monthlyLimit: 2,
    stripePriceId: null as null,
    description: "Pour découvrir Reviz",
    features: ["2 fiches gratuites", "Tous les formats d'import", "Bibliothèque personnelle"],
  },

  STANDARD: {
    tier: "STANDARD" as const,
    name: "Standard",
    price: 4.99,
    monthlyLimit: 20,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD ?? "",
    description: "Le plus populaire",
    features: ["Générez jusqu'à 20 fiches", "Export PDF", "Support email"],
  },

  PRO: {
    tier: "PRO" as const,
    name: "Pro",
    price: 7.99,
    monthlyLimit: 50,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "",
    description: "Pour les étudiants sérieux",
    features: ["Générez jusqu'à 50 fiches", "Export PDF", "Priorité support"],
  },

  STANDARD_ANNUAL: {
    tier: "STANDARD_ANNUAL" as const,
    name: "Standard Annuel",
    price: 3.99,
    monthlyLimit: 20,
    stripePriceId: process.env.STRIPE_PRICE_STANDARD_ANNUAL ?? "",
    description: "Le meilleur rapport qualité/prix",
    features: ["Générez jusqu'à 20 fiches/mois", "Export PDF", "Support email", "2 mois offerts vs mensuel"],
  },

  EXAM_PROMO_20: {
    tier: "EXAM_PROMO_20" as const,
    name: "Promo Examen — 20 fiches",
    price: 2.0,
    monthlyLimit: 20,
    stripePriceId: process.env.STRIPE_PRICE_EXAM_20 ?? "",
    description: "Offre limitée — abonnés uniquement",
    features: ["20 fiches supplémentaires", "Valide pendant les examens"],
  },

  EXAM_PROMO_40: {
    tier: "EXAM_PROMO_40" as const,
    name: "Promo Examen — 40 fiches",
    price: 4.0,
    monthlyLimit: 40,
    stripePriceId: process.env.STRIPE_PRICE_EXAM_40 ?? "",
    description: "Offre limitée — abonnés uniquement",
    features: ["40 fiches supplémentaires", "Valide pendant les examens"],
  },
} as const;

export type TierKey = keyof typeof PRICING_TIERS;

export const EXAM_PROMO_DATES = {
  startDate: new Date("2025-05-01"),
  endDate: new Date("2025-06-30"),
  enabled: true,
};

export function isExamPromoActive(): boolean {
  const now = new Date();
  return (
    EXAM_PROMO_DATES.enabled &&
    now >= EXAM_PROMO_DATES.startDate &&
    now <= EXAM_PROMO_DATES.endDate
  );
}

/** Map a Stripe price ID to a tier key */
export function tierFromPriceId(priceId: string): TierKey {
  for (const [key, config] of Object.entries(PRICING_TIERS)) {
    if (config.stripePriceId && config.stripePriceId === priceId) {
      return key as TierKey;
    }
  }
  return "FREE";
}
