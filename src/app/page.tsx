import type { Metadata } from "next";
import { MarketingSite } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "Reviz AI",
  description: "Reviz AI - Transforme tes revisions avec l'intelligence artificielle",
  openGraph: {
    title: "Reviz AI",
    description: "Reviz AI - Transforme tes revisions avec l'intelligence artificielle",
  },
};

export default function HomePage() {
  return <MarketingSite />;
}
