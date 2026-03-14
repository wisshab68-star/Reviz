import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { HomeGenerator } from "@/components/home-generator";

export default async function AppPage() {
  const session = await auth();

  return (
    <main className="app-layout">
      <AppTopbar />

      <div className="content-shell content-shell-home content-shell-home-marketing">
        <section className="landing-stage landing-stage-marketing">
          <HomeGenerator
            isAuthenticated={Boolean(session?.user?.id)}
            plan={session?.user?.plan ?? "FREE"}
            minimal
          />
        </section>
      </div>
    </main>
  );
}
