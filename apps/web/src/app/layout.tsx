import type { Metadata } from "next";
import { Manrope, Newsreader } from "next/font/google";

import { SiteFrame } from "@/components/layout/site-frame";
import { Providers } from "@/components/providers";
import { getCommercialContent } from "@/lib/commercial-content-api";
import { toGuidedCatalogProducts } from "@/lib/guided-catalog";
import { DEFAULT_OG_IMAGE_PATH, SITE_URL } from "@/lib/seo";
import { getProducts } from "@/lib/storefront-api";

import "./globals.css";

const manrope = Manrope({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-manrope",
});

const newsreader = Newsreader({
  display: "swap",
  subsets: ["latin"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Skin Hearten | Skincare premium",
    template: "%s | Skin Hearten",
  },
  description:
    "Skincare premium con enfoque mobile first para manchas, antiedad, sensibilidad, hidratacion y proteccion solar.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "Skin Hearten",
    locale: "es_MX",
    images: [
      {
        url: DEFAULT_OG_IMAGE_PATH,
        width: 1200,
        height: 630,
        alt: "Skin Hearten",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_OG_IMAGE_PATH],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [products, commercialContent] = await Promise.all([getProducts(), getCommercialContent()]);
  const catalogProducts = toGuidedCatalogProducts(products);

  return (
    <html className={`${manrope.variable} ${newsreader.variable}`} lang="es">
      <body className="font-sans text-stone-900">
        <Providers>
          <SiteFrame catalogProducts={catalogProducts} commercialContent={commercialContent}>
            {children}
          </SiteFrame>
        </Providers>
      </body>
    </html>
  );
}
