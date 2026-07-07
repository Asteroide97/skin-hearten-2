import { NextResponse } from "next/server";

import { submitReviewInvitation } from "@/lib/reviews-api";
import type { ReviewInvitationSubmitInput } from "@/lib/reviews";

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const payload = (await request.json()) as ReviewInvitationSubmitInput;
  const result = await submitReviewInvitation(token, payload);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result, { status: 201 });
}
