import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AppTopbar } from "@/components/app-topbar";
import { SettingsPremiumButton } from "@/components/settings-premium-button";
import { SettingsSignOutButton } from "@/components/settings-signout-button";
import { db } from "@/lib/db";

import { updatePasswordAction } from "./actions";

type SettingsPageProps = {
  searchParams?: Promise<{
    password?: string;
    message?: string;
  }>;
};

const cardStyle = {
  background: "#1E1E2A",
  border: "1px solid #2A2A38",
  borderRadius: "16px",
  padding: "24px",
  marginBottom: "12px",
};

const sectionTitleStyle = {
  fontFamily: "var(--display-font)",
  fontSize: "16px",
  fontWeight: 900,
  color: "#FFFFFF",
  margin: "0 0 20px",
};

const fieldLabelStyle = {
  fontSize: "12px",
  color: "#8B8B9E",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
  marginBottom: "6px",
};

const fieldValueStyle = {
  fontSize: "15px",
  color: "#FFFFFF",
  background: "#252532",
  border: "1px solid #2A2A38",
  borderRadius: "8px",
  padding: "10px 14px",
  width: "100%",
};

const inputStyle = {
  width: "100%",
  background: "#252532",
  border: "1px solid #2A2A38",
  borderRadius: "8px",
  padding: "10px 14px",
  color: "#FFFFFF",
  fontSize: "15px",
  outline: "none",
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      passwordHash: true,
      subscriptionStatus: true,
      accounts: {
        select: {
          provider: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/sign-in");
  }

  const resolvedSearchParams = await searchParams;
  const passwordStatus = resolvedSearchParams?.password;
  const passwordMessage = resolvedSearchParams?.message;
  const isGoogleAuth = user.accounts.some((account) => account.provider === "google") && !user.passwordHash;
  const isEmailAuth = Boolean(user.passwordHash);
  const isSubscriptionActive = user.subscriptionStatus === "active";
  const firstName = user.name?.trim().split(/\s+/)[0] ?? "Ton compte";

  return (
    <main style={{ minHeight: "100vh", background: "#0F0F13", display: "flex" }}>
      <AppTopbar />

      <div style={{ flex: 1, minWidth: 0, background: "#0F0F13" }}>
        <div
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            padding: "48px 32px",
            background: "#0F0F13",
          }}
        >
          <p
            style={{
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#8B8B9E",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            COMPTE
          </p>

          <h1
            style={{
              fontFamily: "var(--display-font)",
              fontSize: "52px",
              fontWeight: 900,
              color: "#FFFFFF",
              letterSpacing: "-0.02em",
              margin: "0 0 40px",
            }}
          >
            Parametres
          </h1>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Mon compte</h2>

            <div style={{ display: "grid", gap: "18px" }}>
              <div>
                <div style={fieldLabelStyle}>Prenom</div>
                <div style={fieldValueStyle}>{firstName}</div>
              </div>

              <div>
                <div style={fieldLabelStyle}>Email</div>
                <div style={fieldValueStyle}>{user.email ?? "Email indisponible"}</div>
                {isGoogleAuth ? (
                  <span
                    style={{
                      display: "inline-flex",
                      marginTop: "10px",
                      background: "#1a2744",
                      color: "#93c5fd",
                      fontSize: "11px",
                      padding: "3px 10px",
                      borderRadius: "50px",
                    }}
                  >
                    Connecte via Google
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Mot de passe</h2>

            {passwordStatus === "updated" ? (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#14532d",
                  color: "#86efac",
                  fontSize: "13px",
                }}
              >
                Mot de passe mis a jour.
              </div>
            ) : null}

            {passwordStatus === "error" && passwordMessage ? (
              <div
                style={{
                  marginBottom: "18px",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "#3b1d24",
                  color: "#fca5a5",
                  fontSize: "13px",
                }}
              >
                {passwordMessage}
              </div>
            ) : null}

            {isGoogleAuth && !isEmailAuth ? (
              <p
                style={{
                  margin: 0,
                  color: "#8B8B9E",
                  fontSize: "13px",
                  fontStyle: "italic",
                }}
              >
                Tu utilises la connexion Google - aucun mot de passe a gerer.
              </p>
            ) : (
              <form action={updatePasswordAction} style={{ display: "grid", gap: "16px" }}>
                <div>
                  <div style={fieldLabelStyle}>Nouveau mot de passe</div>
                  <input name="newPassword" type="password" autoComplete="new-password" style={inputStyle} />
                </div>

                <div>
                  <div style={fieldLabelStyle}>Confirmer</div>
                  <input name="confirmPassword" type="password" autoComplete="new-password" style={inputStyle} />
                </div>

                <div>
                  <button
                    type="submit"
                    style={{
                      background: "#3B5BDB",
                      borderRadius: "50px",
                      padding: "10px 24px",
                      border: "none",
                      color: "#FFFFFF",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Mettre a jour
                  </button>
                </div>
              </form>
            )}
          </section>

          <section style={cardStyle}>
            <h2 style={sectionTitleStyle}>Abonnement</h2>

            {isSubscriptionActive ? (
              <>
                <span
                  style={{
                    background: "#14532d",
                    color: "#86efac",
                    fontSize: "13px",
                    fontWeight: 700,
                    padding: "6px 16px",
                    borderRadius: "50px",
                    display: "inline-block",
                    marginBottom: "12px",
                  }}
                >
                  Premium actif
                </span>
                <p style={{ margin: 0, color: "#FFFFFF", fontSize: "15px" }}>
                  Ton abonnement Premium est actif.
                </p>
              </>
            ) : (
              <SettingsPremiumButton>
                Passer Premium 4,99€/mois
              </SettingsPremiumButton>
            )}
          </section>

          <div style={{ marginTop: "20px" }}>
            <SettingsSignOutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
