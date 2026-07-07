import { getDefaultCommercialContent, type CommercialContent } from "@/lib/commercial-content";

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
}

export async function getCommercialContent(): Promise<CommercialContent> {
  const apiBaseUrl = getApiBaseUrl();
  if (!apiBaseUrl) {
    return getDefaultCommercialContent();
  }

  try {
    const response = await fetch(`${apiBaseUrl}/commercial-content`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return getDefaultCommercialContent();
    }

    return (await response.json()) as CommercialContent;
  } catch {
    return getDefaultCommercialContent();
  }
}
