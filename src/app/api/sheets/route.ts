import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const sheets = await db.studySheet.findMany({
    where: {
      userId: session.user.id,
      status: { notIn: ["FAILED"] },
    },
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
