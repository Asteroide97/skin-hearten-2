import type { Metadata } from "next";

export const SITE_NAME = "Skin Hearten";
export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL ?? "https://skinhearten.mx");
export const DEFAULT_OG_IMAGE_PATH = "/opengraph-image";

function normalizeSiteUrl(value: string) {
  return value.trim().replace(/\/$/, "");
}

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}

export function resolveSeoImage(candidate?: string | null) {
  const value = candidate?.trim() ?? "";
  if (!value) {
    return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }

  if (value.startsWith("/")) {
    return absoluteUrl(value);
  }

  return absoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
};

export function buildPublicMetadata({
  title,
  description,
  path,
  image,
  type = "website",
}: PublicMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const socialImage = resolveSeoImage(image);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type,
      siteName: SITE_NAME,
      locale: "es_MX",
      images: [
        {
          url: socialImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    image: absoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description:
      "Skincare premium con enfoque editorial para manchas, antiedad, hidratacion, sensibilidad y proteccion solar en Mexico.",
    areaServed: "MX",
  };
}

export function buildWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description:
      "Diagnostico guiado, rutinas premium y skincare seleccionado para manchas, hidratacion, sensibilidad y proteccion solar.",
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/productos")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildCollectionPageJsonLd({
  path,
  name,
  description,
}: {
  path: string;
  name: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: absoluteUrl(path),
    isPartOf: absoluteUrl("/"),
  };
}
