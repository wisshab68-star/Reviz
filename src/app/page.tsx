import type { Metadata } from "next";
import { MarketingSite } from "@/components/marketing-site";

export const metadata: Metadata = {
  title: "Reviz AI - Transformez vos cours en fiches de revision",
  description:
    "Reviz AI transforme vos PDF, photos et textes de cours en fiches de revision claires avec resume, flashcards et quiz.",
};

export default function HomePage() {
  return <MarketingSite />;
}
