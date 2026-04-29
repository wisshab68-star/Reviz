import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

const PROTECTED_PATHS = ["/app", "/library", "/settings"];

export default async function middleware(req: NextRequest) {
  // Step 1 — Redirect www → non-www on EVERY route (must run before any cookie is set)
  const host = req.headers.get("host") ?? "";
  if (host.startsWith("www.")) {
    const url = req.nextUrl.clone();
    url.host = host.replace(/^www\./, "");
    return NextResponse.redirect(url, 301);
  }

  // Step 2 — Auth check on protected routes
  const path = req.nextUrl.pathname;
  if (PROTECTED_PATHS.some((p) => path.startsWith(p))) {
    const session = await auth();
    if (!session?.user) {
      const signInUrl = new URL("/sign-in", req.nextUrl.origin);
      return NextResponse.redirect(signInUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all paths except static assets, _next internals, and image files
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js)).*)"],
};
