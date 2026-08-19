export function resolveAssetUrl(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.startsWith("http://") || normalizedValue.startsWith("https://")) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith("/")) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiBaseUrl) {
      return normalizedValue;
    }

    const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    return `${origin}${normalizedValue}`;
  }

  return null;
}

export function passthroughImageLoader({ src }: { src: string }) {
  return src;
}
