import { redirect } from "next/navigation";

import { auth, signIn } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";

export default async function SignInPage() {
  const session = await auth();

  if (session?.user) {
    redirect("/library");
  }

  return (
    <main className="page-shell">
      <AppTopbar />

      <div className="content-shell">
        <section className="section-block">
          <div className="signin-shell">
            <div className="signin-intro">
              <p className="eyebrow">Connexion</p>
              <h1>Sauvegarde tes fiches et retrouve-les partout</h1>
              <p className="workspace-copy">
                Connecte-toi avec Google ou recois un lien magique par email pour acceder a ta
                bibliotheque.
              </p>
            </div>

            <div className="workspace-panel signin-panel">
              <div className="form-grid" style={{ marginTop: 0 }}>
                <form
                  action={async () => {
                    "use server";
                    await signIn("google", { redirectTo: "/library" });
                  }}
                >
                  <button className="btn btn-primary" type="submit" style={{ width: "100%" }}>
                    Continuer avec Google
                  </button>
                </form>

                <form
                  action={async (formData) => {
                    "use server";
                    const email = formData.get("email");

                    if (typeof email !== "string" || !email) {
                      return;
                    }

                    await signIn("email", {
                      email,
                      redirectTo: "/library",
                    });
                  }}
                >
                  <div className="field">
                    <label htmlFor="email">Adresse email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="toi@example.com"
                      required
                    />
                  </div>
                  <button
                    className="btn btn-accent"
                    type="submit"
                    style={{ width: "100%", marginTop: "1rem" }}
                  >
                    Recevoir un lien magique
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
