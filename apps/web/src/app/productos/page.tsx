import type { Metadata } from "next";

import { CatalogPage } from "@/components/catalog/catalog-page";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { absoluteUrl, buildBreadcrumbJsonLd, buildCollectionPageJsonLd, buildPublicMetadata } from "@/lib/seo";
import { getCategories, getProducts } from "@/lib/storefront-api";

type ProductsPageProps = {
  searchParams?: Promise<{
    categoria?: string;
    q?: string;
    problema?: string;
  }>;
};

export const metadata: Metadata = buildPublicMetadata({
  title: "Productos de skincare premium por necesidad",
  description:
    "Explora skincare premium por categoria, problema de piel, ingrediente y tipo de piel con una seleccion curada para Mexico.",
  path: "/productos",
});

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const productSchemas = products.slice(0, 8).map((product) => ({
    "@type": "ListItem",
    position: Number(product.id) || undefined,
    url: absoluteUrl(`/producto/${product.slug}`),
    name: product.name,
  }));
  const productsSchemas = [
    buildCollectionPageJsonLd({
      path: "/productos",
      name: "Catalogo de productos Skin Hearten",
      description:
        "Seleccion curada de skincare premium por categoria, problema de piel e ingredientes.",
    }),
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Productos", path: "/productos" },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Productos Skin Hearten",
      itemListElement: productSchemas.map((item, index) => ({
        ...item,
        position: index + 1,
      })),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
      <JsonLd data={productsSchemas} />
      <SectionHeading
        eyebrow="Seleccion"
        title="Seleccion curada para una rutina consistente"
        description="Filtra por categoria, tipo de piel, problema, disponibilidad y orden para encontrar lo que encaja contigo."
      />
      <CatalogPage
        categories={categories}
        initialCategory={resolvedSearchParams?.categoria}
        initialConcern={resolvedSearchParams?.problema}
        initialProducts={products}
        initialSearch={resolvedSearchParams?.q}
      />
    </div>
  );
}
