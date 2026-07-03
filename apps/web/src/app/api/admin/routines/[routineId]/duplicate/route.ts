import { NextResponse } from "next/server";

import { duplicateAdminRoutine } from "@/lib/admin-routines-api";

type RouteContext = {
  params: Promise<{ routineId: string }>;
};

export async function POST(_: Request, context: RouteContext) {
  const { routineId } = await context.params;
  const result = await duplicateAdminRoutine(Number(routineId));
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}
