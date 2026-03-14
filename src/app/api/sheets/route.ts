import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();
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
}
