"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const SETTINGS_PATH = "/settings";

function buildSettingsRedirect(status: "updated" | "error", message?: string) {
  const params = new URLSearchParams();
  params.set("password", status);

  if (message) {
    params.set("message", message);
  }

  return `${SETTINGS_PATH}?${params.toString()}`;
}

function redirectWithPasswordError(message: string): never {
  redirect(buildSettingsRedirect("error", message));
}

function normalizeField(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

export async function updatePasswordAction(formData: FormData) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const newPassword = normalizeField(formData.get("newPassword"));
  const confirmPassword = normalizeField(formData.get("confirmPassword"));

  if (!newPassword || !confirmPassword) {
    redirectWithPasswordError("Remplis tous les champs avant de mettre a jour ton mot de passe.");
  }

  if (newPassword.length < 8) {
    redirectWithPasswordError("Ton nouveau mot de passe doit contenir au moins 8 caracteres.");
  }

  if (newPassword !== confirmPassword) {
    redirectWithPasswordError("La confirmation ne correspond pas au nouveau mot de passe.");
  }

  try {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: {
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      redirectWithPasswordError("Ce compte utilise Google. Aucun mot de passe n'est gere ici.");
    }

    const nextPasswordHash = await hashPassword(newPassword);

    await db.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash: nextPasswordHash,
      },
    });

    redirect(buildSettingsRedirect("updated"));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    console.error("Password update failed on /settings.", error);
    redirectWithPasswordError("Impossible de mettre a jour le mot de passe pour le moment.");
  }
}
