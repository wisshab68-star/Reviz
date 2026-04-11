import type { NextAuthConfig } from "next-auth";

function readEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

const authSecret = readEnv("AUTH_SECRET", "NEXTAUTH_SECRET");

const authConfig = {
  trustHost: true,
  secret: authSecret,
  providers: [],
  pages: {
    signIn: "/sign-in",
  },
} satisfies NextAuthConfig;

export default authConfig;
