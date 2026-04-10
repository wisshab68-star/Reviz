import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  const sheet = await db.studySheet.findUnique({
    where: { id },
    select: { id: true, status: true, title: true },
  });

  if (!sheet) {
    return NextResponse.json(
      { success: false, error: "Not found" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    success: true,
    data: sheet,
  });
}
