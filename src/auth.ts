import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

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
const authUrl = readEnv("AUTH_URL", "NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL");
const googleClientId = readEnv("AUTH_GOOGLE_ID", "GOOGLE_CLIENT_ID", "NEXTAUTH_GOOGLE_ID");
const googleClientSecret = readEnv("AUTH_GOOGLE_SECRET", "GOOGLE_CLIENT_SECRET", "NEXTAUTH_GOOGLE_SECRET");

const providers: Provider[] = [];

if (googleClientId && googleClientSecret && googleClientId !== "google-client-id") {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      checks: ["state"],
    }),
  );
}

providers.push(
  Credentials({
    name: "Reviz Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
      const password = typeof credentials?.password === "string" ? credentials.password : "";

      if (!email || !password) {
        return null;
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user?.passwordHash) {
        return null;
      }

      const isValidPassword = await verifyPassword(password, user.passwordHash);

      if (!isValidPassword) {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        plan: user.plan,
      };
    },
  }),
);

console.log("[AUTH_INIT] providers registered:", providers.length,
  "| GOOGLE client set:", !!googleClientId,
  "| GOOGLE secret set:", !!googleClientSecret,
  "| AUTH secret set:", !!authSecret,
  "| AUTH url set:", !!authUrl);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
  },
  secret: authSecret,
  providers,
  logger: {
    error: (error: unknown) => {
      const err = error as Record<string, unknown>;
      console.error("[AUTH_ERROR]", err?.type, err?.message);
      if (err?.cause) {
        const cause = err.cause as Record<string, unknown>;
        console.error("[AUTH_CAUSE]", JSON.stringify(cause, null, 2));
        if (cause?.stack) {
          console.error("[AUTH_STACK]", cause.stack);
        }
      }
    },
    warn: (code: unknown) => {
      console.warn("[AUTH_WARN]", code);
    },
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("[AUTH_DEBUG] signIn called", { userId: user?.id, provider: account?.provider });
      return true;
    },
    redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }

      try {
        const targetUrl = new URL(url);

        if (targetUrl.origin === baseUrl) {
          return url;
        }
      } catch {
        return `${baseUrl}/app`;
      }

      return `${baseUrl}/app`;
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.plan = user.plan;
      }

      return session;
    },
  },
  pages: {
    signIn: "/sign-in",
  },
});
