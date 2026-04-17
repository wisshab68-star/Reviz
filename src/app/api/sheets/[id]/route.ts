import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const sheet = await db.studySheet.findFirst({
    where: { id, userId: session.user.id },
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
