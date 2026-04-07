import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { LibraryClient } from "@/components/library-client";

export default async function LibraryPage() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /library, continuing as guest.", error);
  }

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
