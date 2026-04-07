import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isDatabaseConnectionError } from "@/lib/database-fallback";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    let session = null;

    try {
      session = await auth();
    } catch (error) {
      if (!isDatabaseConnectionError(error)) {
        throw error;
      }

      console.error("Auth lookup failed on GET /api/sheets, continuing as guest.", error);
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const effectiveUserId = session?.user?.id ?? userId;

    if (!effectiveUserId) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const sheets = await db.studySheet.findMany({
      where: { userId: effectiveUserId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        summary: true,
        sourceType: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: sheets,
    });
  } catch (error) {
    if (isDatabaseConnectionError(error)) {
      return NextResponse.json({
        success: true,
        data: [],
        warning: "La base de donnees est temporairement indisponible.",
      });
    }

    throw error;
  }
}
