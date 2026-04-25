import type { Metadata } from "next";
import { MarketingSite } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "Reviz — Fiches de révision bac 2026 en 30s | 3,99€/an",
  description: "Reviz génère tes fiches de révision bac 2026 en 30 secondes à partir de tes cours. 3,99€/an en abonnement annuel. Essaie maintenant sur revizai.app",
  openGraph: {
    title: "Reviz — Fiches de révision bac 2026 en 30s",
    description: "Génère tes fiches de révision bac 2026 en 30 secondes. 3,99€/an.",
  },
};

export default function HomePage() {
  return <MarketingSite />;
}
