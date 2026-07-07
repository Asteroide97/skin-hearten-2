import "server-only";

import { requestAdminJson } from "@/lib/admin-api-client";
import type { CommercialContent } from "@/lib/commercial-content";

export async function getAdminCommercialContent() {
  return requestAdminJson<CommercialContent>("/admin/commercial-content");
}

export async function updateAdminCommercialContent(payload: CommercialContent) {
  return requestAdminJson<CommercialContent>("/admin/commercial-content", {
    method: "PUT",
    body: payload as unknown as Record<string, unknown>,
  });
}
