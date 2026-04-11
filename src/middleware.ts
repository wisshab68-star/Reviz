import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import authConfig from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth?.user) {
    const signInUrl = new URL("/sign-in", req.nextUrl.origin);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/app/:path*", "/library/:path*", "/demo/:path*"],
};
