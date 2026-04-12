import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { authenticateWithPasswordAction, signInWithGoogleAction } from "./actions";

export const metadata: Metadata = {
  title: "Connexion Reviz",
  description: "Connecte-toi a Reviz avec Google ou ton email et mot de passe.",
};

type SignInPageProps = {
  searchParams?: Promise<{
    error?: string;
    mode?: string;
  }>;
};

function inputStyle() {
  return {
    width: "100%",
    background: "#1E1E2A",
    border: "1px solid #2A2A38",
    borderRadius: "10px",
    padding: "12px 16px",
    color: "#FFFFFF",
    fontSize: "14px",
    outline: "none",
  } as const;
}

function bulletItem(label: string) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.15)",
        borderRadius: "12px",
        padding: "14px 18px",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        maxWidth: "360px",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", color: "#FFFFFF", flex: "0 0 auto" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span style={{ color: "#FFFFFF", fontSize: "14px" }}>{label}</span>
    </div>
  );
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  let session = null;

  try {
    session = await auth();
  } catch (error) {
    if (!isDatabaseConnectionError(error)) {
      throw error;
    }

    console.error("Auth lookup failed on /sign-in, continuing.", error);
  }

  if (session?.user) {
    redirect("/app");
  }

  const resolvedSearchParams = await searchParams;
  const mode = resolvedSearchParams?.mode === "login" ? "login" : "signup";
  const errorMessage = resolvedSearchParams?.error;
  const isLogin = mode === "login";
  const sharedInputStyle = inputStyle();

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0F0F13",
        display: "grid",
        gridTemplateColumns: "minmax(0, 560px) minmax(0, 1fr)",
      }}
    >
      <section
        style={{
          background: "#0F0F13",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto" }}>
          <div
            style={{
              background: "#1E1E2A",
              borderRadius: "50px",
              padding: "4px",
              display: "inline-flex",
              marginBottom: "24px",
            }}
          >
            <Link
              href="/sign-in?mode=signup"
              style={{
                background: !isLogin ? "#FFFFFF" : "transparent",
                color: !isLogin ? "#000000" : "#8B8B9E",
                borderRadius: "50px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 700,
                transition: "all 0.2s",
                textDecoration: "none",
              }}
            >
              Creer
            </Link>
            <Link
              href="/sign-in?mode=login"
              style={{
                background: isLogin ? "#FFFFFF" : "transparent",
                color: isLogin ? "#000000" : "#8B8B9E",
                borderRadius: "50px",
                padding: "8px 20px",
                fontSize: "13px",
                fontWeight: 700,
                transition: "all 0.2s",
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Connecter
            </Link>
          </div>

          <Link
            href="/"
            style={{
              display: "inline-block",
              marginBottom: "32px",
              textDecoration: "none",
              fontFamily: "var(--display-font)",
              fontSize: "28px",
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            <span>REVIZ</span>
            <span style={{ color: "#3B5BDB" }}>.</span>
          </Link>

          <h1
            style={{
              margin: "0 0 24px",
              fontFamily: "var(--display-font)",
              fontSize: "32px",
              fontWeight: 900,
              color: "#FFFFFF",
            }}
          >
            {isLogin ? "Se connecter" : "Creer mon compte"}
          </h1>

          {errorMessage ? (
            <div
              role="alert"
              style={{
                borderRadius: "12px",
                border: "1px solid #2A2A38",
                background: "#1E1E2A",
                color: "#FFFFFF",
                padding: "12px 16px",
                marginBottom: "16px",
              }}
            >
              {errorMessage}
            </div>
          ) : null}

          <div style={{ display: "grid", gap: "16px" }}>
            <form action={signInWithGoogleAction}>
              <button
                type="submit"
                style={{
                  width: "100%",
                  background: "#1E1E2A",
                  border: "1px solid #2A2A38",
                  borderRadius: "12px",
                  padding: "14px",
                  color: "#FFFFFF",
                  fontSize: "14px",
                  fontWeight: 600,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "border-color 0.2s ease",
                }}
              >
                <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="20" height="20">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.07 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.57-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                </span>
                <span>Continuer avec Google</span>
              </button>
            </form>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr auto 1fr",
                alignItems: "center",
                gap: "12px",
                color: "#2A2A38",
                fontSize: "14px",
              }}
            >
              <span style={{ borderTop: "1px solid #2A2A38" }} />
              <span>ou</span>
              <span style={{ borderTop: "1px solid #2A2A38" }} />
            </div>

            <form action={authenticateWithPasswordAction} style={{ display: "grid", gap: "14px" }}>
              <input type="hidden" name="mode" value={mode} />

              {!isLogin ? (
                <input
                  name="name"
                  type="text"
                  placeholder="Prenom"
                  autoComplete="given-name"
                  style={sharedInputStyle}
                />
              ) : null}

              <input
                name="email"
                type="email"
                placeholder="Email"
                autoComplete="email"
                required
                style={sharedInputStyle}
              />

              <input
                name="password"
                type="password"
                placeholder="Mot de passe"
                autoComplete={isLogin ? "current-password" : "new-password"}
                minLength={8}
                required
                style={sharedInputStyle}
              />

              <button
                type="submit"
                style={{
                  background: "#3B5BDB",
                  color: "#FFFFFF",
                  borderRadius: "50px",
                  padding: "14px",
                  width: "100%",
                  fontFamily: "var(--display-font)",
                  fontWeight: 700,
                  fontSize: "15px",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 0 24px rgba(59,91,219,0.3)",
                }}
              >
                {isLogin ? "Se connecter" : "Creer mon compte"}
              </button>
            </form>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", color: "#8B8B9E", fontSize: "14px" }}>
              <span>{isLogin ? "Pas encore de compte ?" : "Tu as deja un compte ?"}</span>
              <Link
                href={isLogin ? "/sign-in?mode=signup" : "/sign-in?mode=login"}
                style={{ color: "#3B5BDB", textDecoration: "none" }}
              >
                {isLogin ? "S'inscrire" : "Se connecter"}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "#3B5BDB",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px",
        }}
      >
        <div style={{ display: "grid", gap: "0", justifyItems: "center", width: "100%" }}>
          <h2
            style={{
              color: "#FFFFFF",
              fontFamily: "var(--display-font)",
              fontSize: "44px",
              fontWeight: 900,
              textAlign: "center",
              margin: "0 0 32px",
              lineHeight: 1,
            }}
          >
            Ton allie
            <br />
            pour reussir
          </h2>

          <div style={{ width: "100%", display: "grid", justifyItems: "center" }}>
            {bulletItem("Fiche generee en 30 secondes")}
            {bulletItem("Flashcards automatiques incluses")}
            {bulletItem("Methode validee par les neurosciences")}
          </div>
        </div>
      </section>
    </main>
  );
}
