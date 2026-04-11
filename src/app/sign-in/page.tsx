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
    color: "#FFFFFF",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    outline: "none",
  } as const;
}

function bulletItem(label: string) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.1)",
        borderRadius: "12px",
        padding: "12px 16px",
        margin: "8px 0",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        width: "100%",
        maxWidth: "360px",
      }}
    >
      <span aria-hidden="true" style={{ display: "inline-flex", color: "#93c5fd", flex: "0 0 auto" }}>
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
        gridTemplateColumns: "minmax(0, 540px) minmax(0, 1fr)",
      }}
    >
      <section
        style={{
          background: "#0F0F13",
          color: "#FFFFFF",
          padding: "48px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div style={{ width: "100%", maxWidth: "420px", margin: "0 auto", display: "grid", gap: "24px" }}>
          <div style={{ display: "grid", gap: "20px" }}>
            <Link
              href="/"
              style={{
                color: "#FFFFFF",
                fontFamily: "var(--font-heading)",
                fontSize: "28px",
                lineHeight: 1,
                textDecoration: "none",
              }}
            >
              REVIZ
            </Link>

            <div style={{ display: "inline-flex", gap: "8px", padding: "4px", background: "#1A1A24", borderRadius: "8px", width: "fit-content" }}>
              <Link
                href="/sign-in?mode=signup"
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: !isLogin ? "#FFFFFF" : "transparent",
                  color: !isLogin ? "#0F0F13" : "#8B8B9E",
                  textDecoration: "none",
                  fontWeight: 600,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                Creer un compte
              </Link>
              <Link
                href="/sign-in?mode=login"
                style={{
                  padding: "10px 14px",
                  borderRadius: "6px",
                  background: isLogin ? "#FFFFFF" : "transparent",
                  color: isLogin ? "#0F0F13" : "#8B8B9E",
                  textDecoration: "none",
                  fontWeight: 600,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                Se connecter
              </Link>
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <h1
              style={{
                margin: 0,
                color: "#FFFFFF",
                fontFamily: "var(--font-heading)",
                fontSize: "clamp(36px, 5vw, 52px)",
                lineHeight: 0.95,
              }}
            >
              la methode reviz
            </h1>
            <p
              style={{
                margin: 0,
                color: "#8B8B9E",
                lineHeight: 1.7,
                fontSize: "15px",
              }}
            >
              Google d&apos;abord, email ensuite. Une connexion claire, rapide et sans friction pour retrouver tes fiches.
            </p>
          </div>

          {errorMessage ? (
            <div
              role="alert"
              style={{
                borderRadius: "8px",
                border: "1px solid #2A2A38",
                background: "#1E1E2A",
                color: "#FFFFFF",
                padding: "12px 16px",
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
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "12px",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
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
                color: "#8B8B9E",
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
                <label style={{ display: "grid", gap: "8px" }}>
                  <span style={{ color: "#8B8B9E", fontSize: "13px" }}>Prénom</span>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ex : Lea"
                    autoComplete="given-name"
                    style={sharedInputStyle}
                  />
                </label>
              ) : null}

              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ color: "#8B8B9E", fontSize: "13px" }}>Email</span>
                <input
                  name="email"
                  type="email"
                  placeholder="toi@reviz.app"
                  autoComplete="email"
                  required
                  style={sharedInputStyle}
                />
              </label>

              <label style={{ display: "grid", gap: "8px" }}>
                <span style={{ color: "#8B8B9E", fontSize: "13px" }}>Mot de passe</span>
                <input
                  name="password"
                  type="password"
                  placeholder="Au moins 8 caracteres"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={8}
                  required
                  style={sharedInputStyle}
                />
              </label>

              <button
                type="submit"
                style={{
                  background: "#3B5BDB",
                  color: "#FFFFFF",
                  borderRadius: "8px",
                  padding: "14px",
                  width: "100%",
                  fontFamily: "var(--font-heading)",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                {isLogin ? "CONNEXION" : "CREER MON COMPTE"}
              </button>
            </form>

            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", color: "#8B8B9E" }}>
              <span>{isLogin ? "Pas encore de compte ?" : "Tu as deja un compte ?"}</span>
              <Link
                href={isLogin ? "/sign-in?mode=signup" : "/sign-in?mode=login"}
                style={{ color: "#3B5BDB", textDecoration: "none" }}
              >
                {isLogin ? "Creer un compte" : "Se connecter"}
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
          height: "100%",
          padding: "40px",
        }}
      >
        <div style={{ display: "grid", gap: "20px", justifyItems: "center", width: "100%" }}>
          <h2
            style={{
              margin: 0,
              color: "#FFFFFF",
              fontFamily: "var(--font-heading)",
              fontSize: "42px",
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            Ton allié
            <br />
            pour réussir
          </h2>

          <div style={{ width: "100%", display: "grid", justifyItems: "center" }}>
            {bulletItem("Fiche générée en 30 secondes")}
            {bulletItem("Flashcards automatiques incluses")}
            {bulletItem("Méthode validée par les neurosciences")}
          </div>
        </div>
      </section>
    </main>
  );
}
