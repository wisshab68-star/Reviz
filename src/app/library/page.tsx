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
            <p className="eyebrow">REVIZ</p>
            <h1>tes fiches.</h1>
            <p>
              {session?.user?.id
                ? "Retrouve tes fiches et relance une revision en un clic."
                : "Mode demo actif. Tu peux consulter les fiches deja generees."}
            </p>
            <p className="library-support-note">(PDF, TXT, PNG, JPG, JPEG, WEBP, photo)</p>
          </div>

          <LibraryClient />
        </section>
      </div>
    </main>
  );
}
