import { NextResponse } from "next/server";

import { createAdminReviewInvitation, listAdminReviewInvitations } from "@/lib/admin-reviews-api";
import type { AdminReviewInvitationCreateInput } from "@/lib/admin-reviews";

export async function GET() {
  const result = await listAdminReviewInvitations();
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as AdminReviewInvitationCreateInput;
  const result = await createAdminReviewInvitation(payload);
  if (!result.ok) {
    return NextResponse.json(result, { status: result.status ?? 503 });
  }

  return NextResponse.json(result, { status: 201 });
}
