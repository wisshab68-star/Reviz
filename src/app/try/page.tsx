import Link from "next/link"
import type { Metadata } from "next"
import { TryGeneratorWithSession } from "@/components/try/TryGeneratorWithSession"

export const metadata: Metadata = {
  title: "Génère ta fiche gratuite — Reviz",
  description:
    "Choisir ta matière, ton niveau, et Reviz génère ta fiche de révision en 30 secondes. Gratuit, sans inscription.",
}

export default function TryPage() {
  return (
    <div className="try-page">
      <header className="try-topbar">
        <Link href="/" className="try-logo">
          Reviz
        </Link>
      </header>

      <main className="try-main">
        <div className="try-card">
          <div className="try-card-head">
            <p className="eyebrow">Gratuit · Sans inscription</p>
            <h1 className="try-title">Génère ta fiche en 30 secondes</h1>
            <p className="try-subtitle">
              Choisis ta matière et ton niveau. On s&apos;occupe du reste.
            </p>
          </div>

          <TryGeneratorWithSession />
        </div>
      </main>
    </div>
  )
}
