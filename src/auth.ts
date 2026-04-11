import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

const providers: Provider[] = [];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  && process.env.AUTH_GOOGLE_ID !== "google-client-id") {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
  "| AUTH_GOOGLE_ID set:", !!process.env.AUTH_GOOGLE_ID,
  "| AUTH_GOOGLE_SECRET set:", !!process.env.AUTH_GOOGLE_SECRET,
  "| AUTH_SECRET set:", !!process.env.AUTH_SECRET);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database",
  },
  secret: process.env.AUTH_SECRET,
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
