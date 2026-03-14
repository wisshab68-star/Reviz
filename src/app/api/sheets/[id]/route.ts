import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await auth();
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
}
