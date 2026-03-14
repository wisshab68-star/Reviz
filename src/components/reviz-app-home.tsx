"use client";

import { useRouter } from "next/navigation";

type RevizAppHomeProps = {
  plan: "FREE" | "PREMIUM";
};

export function RevizAppHome({ plan }: RevizAppHomeProps) {
  const router = useRouter();

  return (
    <section className="reviz-app-home">
      <div className="reviz-app-home-card">
        <p className="reviz-app-eyebrow">Reviz AI</p>
        <h1>Transformez un cours en fiche de revision en quelques secondes.</h1>
        <p className="reviz-app-lead">
          Un accueil volontairement simple : importe un support ou prends une photo, puis Reviz
          genere une fiche claire, lisible et prete a reviser.
        </p>

        <div className="reviz-app-actions">
          <button
            type="button"
            className="btn btn-primary reviz-app-button"
            onClick={() => router.push("/app/generator?mode=file")}
          >
            Importer un fichier
          </button>
          <button
            type="button"
            className="btn btn-ghost reviz-app-button"
            onClick={() => router.push("/app/generator?mode=photo")}
          >
            Prendre une photo
          </button>
        </div>

        <div className="reviz-app-notes">
          <span className="reviz-app-note">{plan === "PREMIUM" ? "Premium" : "Plan gratuit"}</span>
          <span className="reviz-app-note">PDF, image, photo, texte</span>
          <span className="reviz-app-note">Fiche, flashcards, quiz</span>
        </div>
      </div>
    </section>
  );
}
