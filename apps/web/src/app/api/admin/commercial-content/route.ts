import { NextResponse } from "next/server";

import {
  getAdminCommercialContent,
  updateAdminCommercialContent,
} from "@/lib/admin-commercial-content-api";
import type { CommercialContent } from "@/lib/commercial-content";

export async function GET() {
  const result = await getAdminCommercialContent();
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}

export async function PUT(request: Request) {
  const payload = (await request.json()) as CommercialContent;
  const result = await updateAdminCommercialContent(payload);
  return NextResponse.json(result, { status: result.ok ? 200 : result.status ?? 500 });
}
