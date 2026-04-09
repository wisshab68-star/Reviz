import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Google from "next-auth/providers/google";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";

import { db } from "@/lib/db";

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

if (process.env.EMAIL_SERVER_HOST && process.env.EMAIL_SERVER_HOST !== "smtp.example.com") {
  providers.push(
    Email({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  );
}

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
    error(code, ...message) {
      const args = message as Record<string, unknown>[];
      console.error("[AUTH_ERROR]", code, JSON.stringify(args, null, 2));
      if (args?.[0]?.cause) {
        const cause = args[0].cause as Error;
        console.error("[AUTH_CAUSE]", JSON.stringify(cause, Object.getOwnPropertyNames(cause), 2));
      }
    },
    warn(code) {
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
