import { NextResponse } from "next/server";

import { resolveRoutineForStorefront } from "@/lib/routines-api";
import type { RoutineSource } from "@/lib/routines";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const productRef = searchParams.get("product") ?? "";

  if (!productRef.trim()) {
    return NextResponse.json(
      {
        ok: false,
        reason: "invalid_response",
        message: "Product is required.",
      },
      { status: 400 },
    );
  }

  const result = await resolveRoutineForStorefront({
    productRef: productRef.trim(),
    goal: searchParams.get("goal"),
    category: searchParams.get("category"),
    source: (searchParams.get("source") ?? "product") as RoutineSource,
  });

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}
