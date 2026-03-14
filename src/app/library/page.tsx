import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { LibraryClient } from "@/components/library-client";

export default async function LibraryPage() {
  const session = await auth();

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell library-content-shell">
        <section className="section-block library-section-block">
          <div className="section-title library-section-title">
            <p className="eyebrow">Bibliotheque</p>
            <h1>Toutes les fiches generees</h1>
            <p>
              {session?.user?.id
                ? "Retrouve les fiches sauvegardees, ouvre-les rapidement et relance une session de revision en un clic."
                : "Mode demo actif : tu peux consulter les fiches generees sans connexion."}
            </p>
            <p className="library-support-note">
              (PDF, TXT, PNG, JPG, JPEG, WEBP, photo)
            </p>
          </div>

          <LibraryClient />
        </section>
      </div>
    </main>
  );
}
