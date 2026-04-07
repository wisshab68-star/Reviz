import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    let session = null;

    try {
      session = await auth();
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      console.error("Auth lookup failed on GET /api/sheets/[id], continuing as guest.", error);
    }

    const { id } = await context.params;
    const sheet = session?.user?.id
      ? await db.studySheet.findFirst({
          where: { id, userId: session.user.id },
        })
      : await db.studySheet.findUnique({
          where: { id },
        });

    if (!sheet) {
      return NextResponse.json(
        { success: false, error: "Sheet not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: sheet,
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json(
        { success: false, error: "La base de donnees est temporairement indisponible." },
        { status: 503 },
      );
    }

    throw error;
  }
}
