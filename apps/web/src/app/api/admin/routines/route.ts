import { NextResponse } from "next/server";

import { createAdminRoutine, listAdminRoutines } from "@/lib/admin-routines-api";
import type { AdminRoutineWriteInput } from "@/lib/routines";

export async function GET() {
  const result = await listAdminRoutines();
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminRoutineWriteInput;
  const result = await createAdminRoutine(payload);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result, { status: 201 });
}
