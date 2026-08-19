import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { HeroCtaLink } from "@/components/store/hero-cta-link";
import { HeroQuizButton } from "@/components/store/hero-quiz-button";
import { NeedCardLink } from "@/components/store/need-card-link";
import { NewsletterSignup } from "@/components/store/newsletter-signup";
import { JsonLd } from "@/components/shared/json-ld";
import { passthroughImageLoader, resolveAssetUrl } from "@/lib/assets";
import { getCommercialSection, isCommercialQuizAction, resolveCommercialHref } from "@/lib/commercial-content";
import { getCommercialContent } from "@/lib/commercial-content-api";
import { formatCurrency } from "@/lib/format";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildOrganizationJsonLd,
  buildPublicMetadata,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import { shopNeeds } from "@/lib/site-data";
import { getProducts } from "@/lib/storefront-api";
import type { Product } from "@/lib/types";

export const metadata: Metadata = buildPublicMetadata({
  title: "Skincare simple para tu piel",
  description: "Una seleccion corta de skincare para manchas, acne, sensibilidad e hidratacion.",
  path: "/",
});

export default async function HomePage() {
  const [catalogProducts, commercialContent] = await Promise.all([getProducts(), getCommercialContent()]);
  const featuredSelection = catalogProducts.filter((product) => product.featured).slice(0, 3);
  const featured = featuredSelection.length > 0 ? featuredSelection : catalogProducts.slice(0, 3);
  const leadProduct = featured[0] ?? null;
  const hero = commercialContent.hero;
  const shopNeedsSection = getCommercialSection(commercialContent, "shop_needs");
  const featuredProductsSection = getCommercialSection(commercialContent, "featured_products");
  const homeSchemas = [
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
    buildCollectionPageJsonLd({
      path: "/",
      name: "Skin Hearten",
      description: "Skincare curado para encontrar productos por necesidad.",
    }),
    buildBreadcrumbJsonLd([{ name: "Inicio", path: "/" }]),
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Productos destacados Skin Hearten",
      itemListElement: featured.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(`/producto/${product.slug}`),
        name: product.name,
      })),
    },
  ];

  return (
    <>
      <JsonLd data={homeSchemas} />
      <main className="home-page mx-auto flex max-w-[1240px] flex-col gap-14 px-5 py-8 sm:px-6 lg:gap-20 lg:px-8 lg:py-12">
        {hero.isVisible ? (
          <section className="relative overflow-hidden rounded-[2.8rem] border border-[#ece3d8] bg-[linear-gradient(125deg,#fffdfa_0%,#f8efe8_58%,#eee1e5_100%)] px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-16">
            <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-white/50 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[1fr_0.62fr] lg:items-center">
              <div>
                <p className="section-label">SKINCARE CURADO</p>
                <h1 className="mt-5 max-w-[10ch] text-[3.4rem] font-semibold leading-[0.88] tracking-[-0.075em] text-stone-950 sm:text-[5.4rem] lg:text-[6.1rem]">
                  Una rutina que si vas a seguir.
                </h1>
                <p className="mt-6 max-w-md text-base leading-7 text-stone-600 sm:text-lg">
                  Te ayudamos a encontrar lo esencial para tu piel.
                </p>
                <div className="mt-8">
                  {isCommercialQuizAction(hero.primaryButton.type) ? (
                    <HeroQuizButton className="btn-primary px-6 py-3.5" destination="skin_quiz" source="home">
                      {hero.primaryButton.label}
                    </HeroQuizButton>
                  ) : (
                    <HeroCtaLink
                      className="btn-primary px-6 py-3.5"
                      destination={hero.primaryButton.value}
                      href={resolveCommercialHref(hero.primaryButton)}
                    >
                      {hero.primaryButton.label}
                    </HeroCtaLink>
                  )}
                </div>
                <p className="mt-8 text-sm text-stone-500">Productos originales · Pago seguro · Envios a todo Mexico</p>
              </div>
              <HeroProduct product={leadProduct} />
            </div>
          </section>
        ) : null}

        {shopNeedsSection?.active !== false ? (
          <section id="shop-needs">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-label">ENCUENTRA LO QUE BUSCAS</p>
                <h2 className="mt-3 text-[2.6rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-950 sm:text-[3.6rem]">
                  Compra por necesidad.
                </h2>
              </div>
              <HeroQuizButton className="btn-secondary w-fit px-5 py-3" destination="skin_quiz" source="home">
                No se que elegir
              </HeroQuizButton>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {shopNeeds.slice(0, 3).map((need) => (
                <NeedCardLink
                  accent={need.accent}
                  analyticsNeed={need.analyticsNeed}
                  description={need.description}
                  eyebrow={need.eyebrow}
                  href={need.href}
                  key={need.id}
                  title={need.title}
                />
              ))}
            </div>
          </section>
        ) : null}

        {featuredProductsSection?.active !== false ? (
          <section id="featured-products">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="section-label">SELECCION DE HOY</p>
                <h2 className="mt-3 text-[2.6rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-950 sm:text-[3.6rem]">
                  Los esenciales.
                </h2>
              </div>
              <Link className="hidden text-sm font-semibold text-stone-700 underline underline-offset-4 sm:inline" href="/productos">
                Ver todos
              </Link>
            </div>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {featured.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}

        <NewsletterSignup />
      </main>
    </>
  );
}

function HeroProduct({ product }: { product: Product | null }) {
  if (!product) {
    return <div className="hidden min-h-[360px] rounded-[2.4rem] bg-white/45 lg:block" />;
  }

  const assetUrl = resolveAssetUrl(product.image ?? product.images[0]);

  return (
    <Link
      className={`group relative mx-auto flex w-full max-w-[370px] items-end justify-center overflow-hidden rounded-[2.4rem] bg-gradient-to-br ${product.gradient} px-8 pb-10 pt-8 transition duration-300 hover:-translate-y-1`}
      href={`/producto/${product.slug}`}
    >
      <div className="absolute inset-x-10 top-12 h-36 rounded-full bg-white/60 blur-3xl" />
      <div className="relative flex h-[340px] w-full items-center justify-center rounded-[2rem] bg-white/45">
        {assetUrl ? (
          <Image
            alt={product.name}
            className="object-contain p-8 transition duration-300 group-hover:scale-105"
            fill
            loader={passthroughImageLoader}
            sizes="(min-width: 1024px) 32vw, 90vw"
            src={assetUrl}
            unoptimized
          />
        ) : (
          <div className="relative h-52 w-36 rounded-[3.4rem_3.4rem_1.6rem_1.6rem] border border-white/80 bg-white/80 shadow-[0_26px_48px_rgba(31,24,19,0.08)]">
            <div className="absolute left-1/2 top-8 h-10 w-20 -translate-x-1/2 rounded-full bg-[#ead7c8]" />
          </div>
        )}
      </div>
      <div className="absolute bottom-5 left-5 rounded-full bg-white/85 px-4 py-2 text-sm font-semibold text-stone-900">
        Ver producto
      </div>
    </Link>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  const compareAtPrice = product.compareAtPrice ?? product.price;
  const hasOffer = compareAtPrice > product.price;
  const assetUrl = resolveAssetUrl(product.image ?? product.images[0]);

  return (
    <article className="group flex h-full flex-col rounded-[2rem] border border-[#ece3d8] bg-white p-4 shadow-[0_18px_40px_rgba(31,24,19,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(31,24,19,0.08)]">
      <Link className="block" href={`/producto/${product.slug}`}>
        <div className={`relative overflow-hidden rounded-[1.65rem] bg-gradient-to-br ${product.gradient}`}>
          {product.bestSeller ? (
            <span className="absolute left-3 top-3 z-10 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-stone-800">
              Bestseller
            </span>
          ) : null}
          <div className="relative flex min-h-[250px] items-center justify-center p-6">
            {assetUrl ? (
              <Image
                alt={product.name}
                className="object-contain p-5"
                fill
                loader={passthroughImageLoader}
                sizes="(min-width: 768px) 33vw, 100vw"
                src={assetUrl}
                unoptimized
              />
            ) : (
              <div className="h-40 w-28 rounded-[3rem_3rem_1.4rem_1.4rem] border border-white/80 bg-white/82 shadow-[0_18px_36px_rgba(31,24,19,0.06)]" />
            )}
          </div>
        </div>
        <div className="px-1 pb-4 pt-5">
          <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-stone-500">{product.brand}</p>
          <h3 className="mt-2 max-w-[14ch] text-[1.55rem] font-semibold leading-[0.98] tracking-[-0.05em] text-stone-950">
            {product.name}
          </h3>
        </div>
      </Link>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-200 px-1 pt-4">
        <div>
          {hasOffer ? <p className="text-sm text-stone-400 line-through">{formatCurrency(compareAtPrice)}</p> : null}
          <p className="text-2xl font-semibold tracking-[-0.04em] text-stone-950">{formatCurrency(product.price)}</p>
        </div>
        <AddToCartButton
          className="btn-primary px-4 py-3"
          disabled={product.stock <= 0}
          label="Agregar"
          name={product.name}
          price={product.price}
          productId={product.id}
          slug={product.slug}
        />
      </div>
    </article>
  );
}
