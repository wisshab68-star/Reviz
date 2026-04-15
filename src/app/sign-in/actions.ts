"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { signIn } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";

const SIGN_IN_PATH = "/sign-in";

function buildRedirectUrl(mode: string, error: string) {
  const params = new URLSearchParams({
    mode,
    error,
  });

  return `${SIGN_IN_PATH}?${params.toString()}`;
}

function redirectWithError(mode: string, error: string): never {
  redirect(buildRedirectUrl(mode, error));
}

function normalizeMode(rawMode: FormDataEntryValue | null) {
  return rawMode === "login" ? "login" : "signup";
}

function normalizeEmail(rawEmail: FormDataEntryValue | null) {
  return typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
}

function normalizeText(rawValue: FormDataEntryValue | null) {
  return typeof rawValue === "string" ? rawValue.trim() : "";
}

export async function signInWithGoogleAction(formData: FormData) {
  const googleClientId = process.env.AUTH_GOOGLE_ID
    ?? process.env.GOOGLE_CLIENT_ID
    ?? process.env.NEXTAUTH_GOOGLE_ID;
  const googleClientSecret = process.env.AUTH_GOOGLE_SECRET
    ?? process.env.GOOGLE_CLIENT_SECRET
    ?? process.env.NEXTAUTH_GOOGLE_SECRET;

  if (!googleClientId || !googleClientSecret || googleClientId === "google-client-id") {
    redirectWithError("login", "Connexion Google indisponible pour le moment. Verifie la configuration OAuth.");
  }

  const rawRedirectTo = normalizeText(formData.get("redirectTo"));
  const safeRedirectTo = rawRedirectTo.startsWith("/") ? rawRedirectTo : "/app";

  await signIn("google", { redirectTo: safeRedirectTo });
}

export async function authenticateWithPasswordAction(formData: FormData) {
  const mode = normalizeMode(formData.get("mode"));
  const name = normalizeText(formData.get("name"));
  const email = normalizeEmail(formData.get("email"));
  const password = normalizeText(formData.get("password"));
  const rawRedirectTo = normalizeText(formData.get("redirectTo"));
  const safeRedirectTo = rawRedirectTo.startsWith("/") ? rawRedirectTo : "/app";

  if (!email) {
    redirectWithError(mode, "Entre ton adresse email.");
  }

  if (!password) {
    redirectWithError(mode, "Entre ton mot de passe.");
  }

  if (password.length < 8) {
    redirectWithError(mode, "Ton mot de passe doit contenir au moins 8 caracteres.");
  }

  try {
    if (mode === "signup") {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (existingUser?.passwordHash) {
        redirectWithError(mode, "Un compte existe deja avec cet email.");
      }

      const passwordHash = await hashPassword(password);

      if (existingUser) {
        await db.user.update({
          where: { email },
          data: {
            name: existingUser.name ?? name ?? null,
            passwordHash,
            emailVerified: existingUser.emailVerified ?? new Date(),
          },
        });
      } else {
        await db.user.create({
          data: {
            name: name || null,
            email,
            passwordHash,
            emailVerified: new Date(),
          },
        });
      }
    } else {
      const existingUser = await db.user.findUnique({
        where: { email },
      });

      if (!existingUser) {
        redirectWithError(mode, "Aucun compte n'existe avec cet email.");
      }

      if (!existingUser.passwordHash) {
        redirectWithError(mode, "Ce compte utilise Google. Clique sur Continuer avec Google.");
      }

      const isValidPassword = await verifyPassword(password, existingUser.passwordHash);

      if (!isValidPassword) {
        redirectWithError(mode, "Mot de passe incorrect.");
      }
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: safeRedirectTo,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Credentials auth failed on /sign-in.", error);
    redirectWithError(mode, "Impossible de te connecter pour le moment. Reessaie dans un instant.");
  }
}
