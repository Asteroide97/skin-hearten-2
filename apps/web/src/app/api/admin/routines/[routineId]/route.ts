import { NextResponse } from "next/server";

import { deleteAdminRoutine, getAdminRoutine, updateAdminRoutine } from "@/lib/admin-routines-api";
import type { AdminRoutineWriteInput } from "@/lib/routines";

type RouteContext = {
  params: Promise<{ routineId: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  const { routineId } = await context.params;
  const result = await getAdminRoutine(Number(routineId));
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}

export async function PUT(request: Request, context: RouteContext) {
  const { routineId } = await context.params;
  const payload = (await request.json()) as AdminRoutineWriteInput;
  const result = await updateAdminRoutine(Number(routineId), payload);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}

export async function DELETE(_: Request, context: RouteContext) {
  const { routineId } = await context.params;
  const result = await deleteAdminRoutine(Number(routineId));
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}
