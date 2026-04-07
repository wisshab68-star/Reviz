import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { AppTopbar } from "@/components/app-topbar";
import { HomeGenerator } from "@/components/home-generator";

export default async function AppPage() {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /app, continuing as guest.", error);
  }

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell content-shell-home content-shell-home-marketing">
        <section className="landing-stage landing-stage-marketing">
          <HomeGenerator
            isAuthenticated={Boolean(session?.user?.id)}
            plan={session?.user?.plan ?? "FREE"}
          />
        </section>
      </div>
    </main>
  );
}
