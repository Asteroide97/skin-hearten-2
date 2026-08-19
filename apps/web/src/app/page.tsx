import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { NewsletterSignup } from "@/components/store/newsletter-signup";
import { HeroCtaLink } from "@/components/store/hero-cta-link";
import { HeroQuizButton } from "@/components/store/hero-quiz-button";
import { NeedCardLink } from "@/components/store/need-card-link";
import { CheckCircleIcon, StarIcon } from "@/components/shared/icons";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { passthroughImageLoader, resolveAssetUrl } from "@/lib/assets";
import {
  getCommercialSection,
  getDefaultCommercialContent,
  isCommercialQuizAction,
  resolveCommercialHref,
} from "@/lib/commercial-content";
import { getCommercialContent } from "@/lib/commercial-content-api";
import { formatCurrency } from "@/lib/format";
import { createEmptyReviewsSummary } from "@/lib/reviews";
import { getReviewsSummary } from "@/lib/reviews-api";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildOrganizationJsonLd,
  buildPublicMetadata,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import { shopNeeds } from "@/lib/site-data";
import { getBrands, getProducts } from "@/lib/storefront-api";
import type { Product } from "@/lib/types";

export const metadata: Metadata = buildPublicMetadata({
  title: "Rutinas premium para manchas, hidratacion y piel sensible",
  description:
    "Diagnostico guiado, rutinas premium y skincare seleccionado para manchas, hidratacion, sensibilidad y proteccion solar en Mexico.",
  path: "/",
});

export default async function HomePage() {
  const [catalogProducts, storefrontBrands, commercialContent, reviewSummaryResult] = await Promise.all([
    getProducts(),
    getBrands(),
    getCommercialContent(),
    getReviewsSummary(),
  ]);

  const featuredSelection = catalogProducts.filter((product) => product.featured).slice(0, 4);
  const featured = featuredSelection.length > 0 ? featuredSelection : catalogProducts.slice(0, 4);
  const leadProduct = featured[0] ?? null;
  const supportingProducts = featured.slice(1, 4);
  const defaultCommercialContent = getDefaultCommercialContent();
  const hero = commercialContent.hero;
  const trustSignals = hero.trustSignals.length > 0 ? hero.trustSignals : defaultCommercialContent.hero.trustSignals;
  const featuredRoutinesSection = getCommercialSection(commercialContent, "featured_routines");
  const featuredProductsSection = getCommercialSection(commercialContent, "featured_products");
  const shopNeedsSection = getCommercialSection(commercialContent, "shop_needs");
  const reviewsSection =
    getCommercialSection(commercialContent, "reviews") ?? getCommercialSection(commercialContent, "testimonials");
  const routineGuideSteps =
    commercialContent.routineGuideSteps.length > 0
      ? commercialContent.routineGuideSteps
      : defaultCommercialContent.routineGuideSteps;
  const reviewSummary = reviewSummaryResult.ok ? reviewSummaryResult.data : createEmptyReviewsSummary();
  const brandsPreview = storefrontBrands.slice(0, 4);
  const visibleNeeds = shopNeeds.slice(0, 6);
  const homeSchemas = [
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
    buildCollectionPageJsonLd({
      path: "/",
      name: "Skin Hearten Home",
      description:
        "Portada minimalista de Skin Hearten con productos destacados, categorias por necesidad y rutinas guiadas para skincare.",
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
    ...(reviewSummary.totalReviews > 0
      ? [
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Resenas destacadas Skin Hearten",
            itemListElement: reviewSummary.approvedReviewsPreview.slice(0, 3).map((review, index) => ({
              "@type": "ListItem",
              position: index + 1,
              url: absoluteUrl(`/producto/${review.productSlug}`),
              name: review.title ?? review.productName,
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <JsonLd data={homeSchemas} />
      <div className="home-page mx-auto flex max-w-[1320px] flex-col gap-16 px-5 py-6 sm:px-6 lg:gap-20 lg:px-8 lg:py-8">
        {hero.isVisible ? (
          <section className="relative overflow-hidden rounded-[2.8rem] border border-[#ede3d7] bg-[linear-gradient(135deg,#fffdf9_0%,#f7efe8_52%,#f1e3e3_100%)] px-5 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            <div className="absolute -left-12 top-10 h-44 w-44 rounded-full bg-[#e7d8eb] opacity-80 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-52 w-52 rounded-full bg-[#eadfcb] opacity-80 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
              <div className="space-y-7">
                <div className="space-y-4">
                  <p className="inline-flex rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[0.72rem] font-semibold tracking-[0.18em] text-stone-600">
                    SKINCARE SIMPLE Y CURADO
                  </p>
                  <h1 className="max-w-[11ch] text-[2.8rem] font-semibold leading-[0.9] tracking-[-0.07em] text-stone-950 sm:text-[4rem] lg:text-[5rem]">
                    Una rutina simple que si vas a querer seguir.
                  </h1>
                  <p className="max-w-xl text-base leading-8 text-stone-600 sm:text-[1.05rem]">
                    {hero.subtitle ??
                      "Menos ruido, mas claridad: empezamos por lo que tu piel necesita y despues te llevamos a una seleccion corta de productos."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                  {isCommercialQuizAction(hero.secondaryButton.type) ? (
                    <HeroQuizButton className="btn-secondary px-6 py-3.5" destination="skin_quiz" source="home">
                      {hero.secondaryButton.label}
                    </HeroQuizButton>
                  ) : (
                    <HeroCtaLink
                      className="btn-secondary px-6 py-3.5"
                      destination={hero.secondaryButton.value}
                      href={resolveCommercialHref(hero.secondaryButton)}
                    >
                      {hero.secondaryButton.label}
                    </HeroCtaLink>
                  )}
                  {hero.tertiaryButton ? (
                    <HeroCtaLink
                      className="btn-ghost px-0 py-3 text-stone-900"
                      destination={hero.tertiaryButton.value}
                      href={resolveCommercialHref(hero.tertiaryButton)}
                    >
                      {hero.tertiaryButton.label}
                    </HeroCtaLink>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {trustSignals.slice(0, 3).map((signal) => (
                    <div
                      className="rounded-[1.4rem] border border-white/70 bg-white/78 px-4 py-4 shadow-[0_14px_34px_rgba(32,24,19,0.06)]"
                      key={signal}
                    >
                      <CheckCircleIcon className="h-4 w-4 text-stone-900" />
                      <p className="mt-3 text-sm font-medium leading-6 text-stone-700">{signal}</p>
                    </div>
                  ))}
                </div>
              </div>

              <HeroProductSpotlight
                brandsPreview={brandsPreview}
                leadProduct={leadProduct}
                reviewSummary={reviewSummary}
                supportingProducts={supportingProducts}
              />
            </div>
          </section>
        ) : null}

        {shopNeedsSection?.active !== false ? (
          <section className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-start" id="shop-needs">
            <div className="space-y-6 lg:sticky lg:top-28">
              <SectionHeading
                eyebrow={shopNeedsSection?.eyebrow ?? "Compra por necesidad"}
                title={shopNeedsSection?.title ?? "Entra directo por lo que quieres mejorar."}
                description={
                  shopNeedsSection?.description ??
                  "La portada deja de ser ruidosa: eliges manchas, acne, sensibilidad o hidratacion y te llevamos directo a lo importante."
                }
                titleClassName="!font-sans max-w-[12ch] text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.06em] sm:text-[3.3rem]"
                descriptionClassName="max-w-md text-base leading-8 text-stone-600"
              />

              <article className="rounded-[2.2rem] border border-[#ece3d8] bg-[#fbf5ef] p-6 shadow-[0_20px_44px_rgba(31,24,19,0.05)]">
                <p className="section-label">Diagnostico rapido</p>
                <h3 className="mt-4 max-w-[12ch] text-[2rem] font-semibold leading-[0.98] tracking-[-0.05em] text-stone-950">
                  No necesitas adivinar tu rutina.
                </h3>
                <p className="mt-4 text-sm leading-7 text-stone-600">
                  Te hacemos una ruta simple en dos minutos y luego te mostramos una seleccion corta. Mas cercano a una recomendacion que a un catalogo infinito.
                </p>
                <div className="mt-6">
                  <HeroQuizButton className="btn-primary px-5 py-3.5" destination="skin_quiz" source="home">
                    Hacer diagnostico
                  </HeroQuizButton>
                </div>
              </article>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleNeeds.map((need) => (
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
          <section className="space-y-8" id="featured-products">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <SectionHeading
                eyebrow={featuredProductsSection?.eyebrow ?? "Best sellers"}
                title={featuredProductsSection?.title ?? "Una seleccion corta para comprar mejor."}
                description={
                  featuredProductsSection?.description ??
                  "Tomamos la energia de una tienda mas visual, pero con una seleccion mas limpia, menos saturada y facil de recorrer."
                }
                titleClassName="!font-sans max-w-[12ch] text-[2.75rem] font-semibold leading-[0.95] tracking-[-0.06em] sm:text-[3.4rem]"
                descriptionClassName="max-w-2xl text-base leading-8 text-stone-600"
              />
              {featuredProductsSection?.ctaLabel && featuredProductsSection.ctaType && featuredProductsSection.ctaValue ? (
                <Link
                  className="btn-secondary w-full justify-center px-5 py-3.5 sm:w-auto"
                  href={resolveCommercialHref({
                    type: featuredProductsSection.ctaType,
                    value: featuredProductsSection.ctaValue,
                  })}
                >
                  {featuredProductsSection.ctaLabel}
                </Link>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((product) => (
                <HomeProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}

        {featuredRoutinesSection?.active !== false || reviewsSection?.active !== false ? (
          <section className="grid gap-5 lg:grid-cols-[1.04fr_0.96fr]">
            {featuredRoutinesSection?.active !== false ? (
              <article className="rounded-[2.4rem] border border-[#ece3d8] bg-white p-6 shadow-[0_20px_48px_rgba(31,24,19,0.05)] sm:p-7">
                <SectionHeading
                  eyebrow={featuredRoutinesSection?.eyebrow ?? "Rutina guiada"}
                  title={featuredRoutinesSection?.title ?? "Tres pasos claros. Nada mas."}
                  description={
                    featuredRoutinesSection?.description ??
                    "El flujo de compra se siente mas liviano cuando primero entiendes el problema y despues ves que comprar."
                  }
                  titleClassName="!font-sans max-w-[14ch] text-[2.4rem] font-semibold leading-[0.97] tracking-[-0.05em] sm:text-[3rem]"
                  descriptionClassName="max-w-2xl text-base leading-8 text-stone-600"
                />

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {routineGuideSteps.slice(0, 3).map((step) => (
                    <div
                      className="rounded-[1.8rem] border border-[#eee6db] bg-[#fcf8f2] p-5"
                      key={step.title}
                    >
                      <p className="section-label">{step.eyebrow}</p>
                      <h3 className="mt-4 text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.04em] text-stone-950">
                        {step.title}
                      </h3>
                      <p className="mt-4 text-sm leading-7 text-stone-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}

            {reviewsSection?.active !== false ? (
              <article className="rounded-[2.4rem] border border-[#ece3d8] bg-[linear-gradient(180deg,#fffdfa_0%,#f6efe7_100%)] p-6 shadow-[0_20px_48px_rgba(31,24,19,0.05)] sm:p-7">
                <p className="section-label">{reviewsSection?.eyebrow ?? "Confianza visible"}</p>
                <h2 className="mt-4 max-w-[13ch] text-[2.4rem] font-semibold leading-[0.97] tracking-[-0.05em] text-stone-950 sm:text-[3rem]">
                  {reviewsSection?.title ?? "La tienda se siente mas facil de creer."}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-8 text-stone-600">
                  {reviewsSection?.description ??
                    "Mantenemos la portada clara, pero dejamos visibles los datos que ayudan a confiar antes de comprar."}
                </p>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5">
                    <p className="section-label">Resenas</p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-[2.8rem] font-semibold leading-none tracking-[-0.06em] text-stone-950">
                        {reviewSummary.totalReviews > 0 ? reviewSummary.averageRating.toFixed(1) : "0.0"}
                      </span>
                      <span className="pb-1 text-sm text-stone-500">
                        {reviewSummary.totalReviews > 0
                          ? `${reviewSummary.totalReviews} publicadas`
                          : "espacio listo para resenas reales"}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-[#b36b47]">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <StarIcon className="h-4 w-4" key={`summary-star-${index}`} />
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5">
                    <p className="section-label">Marcas visibles</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {brandsPreview.length > 0 ? (
                        brandsPreview.map((brand) => (
                          <span
                            className="rounded-full border border-stone-200 bg-[#fcf7f1] px-3 py-2 text-sm text-stone-700"
                            key={brand.id}
                          >
                            {brand.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm leading-7 text-stone-600">
                          El bloque queda preparado aunque la API de marcas no responda.
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 rounded-[1.8rem] border border-white/70 bg-white/80 p-5">
                  <p className="section-label">Por que se siente mas simple</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      "Hero mas limpio y directo",
                      "Seleccion corta para comprar rapido",
                      "Entradas por necesidad sin saturacion",
                    ].map((item) => (
                      <div className="rounded-[1.3rem] bg-[#fbf5ef] px-4 py-4 text-sm leading-6 text-stone-700" key={item}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ) : null}
          </section>
        ) : null}

        <NewsletterSignup />
      </div>
    </>
  );
}

function HeroProductSpotlight({
  brandsPreview,
  leadProduct,
  reviewSummary,
  supportingProducts,
}: {
  brandsPreview: Array<{ id: string; name: string }>;
  leadProduct: Product | null;
  reviewSummary: ReturnType<typeof createEmptyReviewsSummary>;
  supportingProducts: Product[];
}) {
  if (!leadProduct) {
    return (
      <div className="rounded-[2.6rem] border border-white/70 bg-white/75 p-6 shadow-[0_24px_60px_rgba(31,24,19,0.08)]">
        <p className="text-base leading-8 text-stone-600">
          La portada queda lista para mostrar producto real apenas el catalogo este disponible.
        </p>
      </div>
    );
  }

  const assetUrl = resolveAssetUrl(leadProduct.image ?? leadProduct.images[0]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px]">
      <article className="rounded-[2.6rem] border border-white/70 bg-white/74 p-4 shadow-[0_24px_60px_rgba(31,24,19,0.08)] sm:p-5">
        <div className={`rounded-[2.2rem] bg-gradient-to-br ${leadProduct.gradient} p-5`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="section-label text-stone-700">Seleccion curada</p>
              <h2 className="mt-3 max-w-[9ch] text-[2rem] font-semibold leading-[0.95] tracking-[-0.05em] text-stone-950 sm:text-[2.45rem]">
                {leadProduct.name}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-7 text-stone-700">{leadProduct.highlight}</p>
            </div>
            <div className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5 text-sm font-semibold text-stone-900">
              {formatCurrency(leadProduct.price)}
            </div>
          </div>

          <div className="relative mt-6 overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(249,239,232,0.96))] px-4 py-4 sm:px-6 sm:py-6">
            <div className="absolute left-1/2 top-4 h-24 w-24 -translate-x-1/2 rounded-full bg-white/70 blur-2xl" />
            <div className="relative flex min-h-[250px] items-center justify-center sm:min-h-[300px]">
              {assetUrl ? (
                <Image
                  alt={leadProduct.name}
                  className="h-full w-full object-contain"
                  fill
                  loader={passthroughImageLoader}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  src={assetUrl}
                  unoptimized
                />
              ) : (
                <>
                  <div className="absolute inset-x-[20%] top-8 h-24 rounded-full bg-[radial-gradient(circle,rgba(244,209,213,0.8),transparent_70%)] blur-2xl" />
                  <div className="absolute bottom-8 left-[18%] h-28 w-20 -rotate-[12deg] rounded-[1.6rem] border border-white/80 bg-white/78" />
                  <div className="absolute bottom-6 right-[18%] h-24 w-16 rotate-[14deg] rounded-[1.4rem] border border-white/76 bg-[#f7efe6]/86" />
                  <div className="absolute bottom-4 left-1/2 h-44 w-36 -translate-x-1/2 rounded-[3.4rem_3.4rem_1.8rem_1.8rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(244,228,221,0.94))]" />
                  <div className="absolute bottom-28 left-1/2 h-11 w-20 -translate-x-1/2 rounded-full bg-[#ead7c8]/95" />
                  <div className="absolute inset-x-[26%] bottom-3 h-6 rounded-full bg-[#d6c1b8]/55 blur-md" />
                </>
              )}
            </div>

            <div className="absolute bottom-5 left-5 rounded-[1.3rem] border border-white/80 bg-white/86 px-4 py-3 shadow-[0_16px_36px_rgba(31,24,19,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{leadProduct.category}</p>
              <p className="mt-1 text-sm font-medium text-stone-800">{leadProduct.brand}</p>
            </div>
          </div>
        </div>
      </article>

      <div className="grid gap-4">
        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_44px_rgba(31,24,19,0.06)]">
          <p className="section-label">Lo mas pedido</p>
          <div className="mt-4 space-y-3">
            {[leadProduct, ...supportingProducts].slice(0, 3).map((product) => (
              <div
                className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-[#fbf5ef] px-3.5 py-3"
                key={product.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-stone-900">{product.name}</p>
                  <p className="text-xs text-stone-500">{product.brand}</p>
                </div>
                <span className="text-sm font-semibold text-stone-800">{formatCurrency(product.price)}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_18px_44px_rgba(31,24,19,0.06)]">
          <p className="section-label">Compra tranquila</p>
          <div className="mt-4">
            <p className="text-[2.4rem] font-semibold leading-none tracking-[-0.06em] text-stone-950">
              {reviewSummary.totalReviews > 0 ? reviewSummary.averageRating.toFixed(1) : "4"}
            </p>
            <p className="mt-2 text-sm leading-7 text-stone-600">
              {reviewSummary.totalReviews > 0
                ? `${reviewSummary.totalReviews} resenas aprobadas y visibles.`
                : "Portada limpia con foco en producto, necesidad y decision."}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-1 text-[#b36b47]">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon className="h-4 w-4" key={`hero-star-${index}`} />
            ))}
          </div>
          <div className="mt-5 border-t border-stone-200 pt-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Marcas</p>
            <p className="mt-2 text-sm leading-7 text-stone-700">
              {brandsPreview.length > 0
                ? brandsPreview.map((brand) => brand.name).join(" • ")
                : "La seleccion se mantiene visible aunque la API de marcas no responda."}
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}

function HomeProductCard({ product }: { product: Product }) {
  const compareAtPrice = product.compareAtPrice ?? product.price;
  const hasOffer = compareAtPrice > product.price;
  const savings = hasOffer ? Math.round(((compareAtPrice - product.price) / compareAtPrice) * 100) : 0;
  const assetUrl = resolveAssetUrl(product.image ?? product.images[0]);

  return (
    <article className="group flex h-full flex-col rounded-[2.15rem] border border-[#ece3d8] bg-white p-4 shadow-[0_18px_40px_rgba(31,24,19,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(31,24,19,0.08)]">
      <Link className="block" href={`/producto/${product.slug}`}>
        <div className={`overflow-hidden rounded-[1.9rem] bg-gradient-to-br ${product.gradient} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {product.bestSeller ? (
                <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-semibold text-stone-800">
                  Bestseller
                </span>
              ) : null}
              {hasOffer ? (
                <span className="rounded-full border border-white/70 bg-white/85 px-3 py-1 text-[11px] font-semibold text-stone-800">
                  Oferta {savings}%
                </span>
              ) : null}
            </div>
            <span className="text-[11px] text-stone-600">{product.category}</span>
          </div>

          <div className="relative mt-4 overflow-hidden rounded-[1.6rem] border border-white/75 bg-white/72 px-4 py-4">
            <div className="relative flex min-h-[220px] items-center justify-center">
              {assetUrl ? (
                <Image
                  alt={product.name}
                  className="h-full w-full object-contain"
                  fill
                  loader={passthroughImageLoader}
                  sizes="(min-width: 1280px) 25vw, (min-width: 768px) 45vw, 100vw"
                  src={assetUrl}
                  unoptimized
                />
              ) : (
                <>
                  <div className="absolute left-1/2 top-4 h-20 w-20 -translate-x-1/2 rounded-full bg-white/65 blur-2xl" />
                  <div className="absolute bottom-0 h-44 w-32 rounded-[3rem_3rem_1.6rem_1.6rem] border border-white/80 bg-white/84" />
                  <div className="absolute bottom-10 h-7 w-16 rounded-full bg-[#ead7c8]/92" />
                  <div className="absolute bottom-3 right-[24%] h-28 w-20 rotate-[8deg] rounded-[1.4rem] border border-white/76 bg-white/70" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 px-1 pb-2 pt-5">
          <div className="flex items-center gap-1 text-[#b36b47]">
            <StarIcon className="h-4 w-4" />
            <span className="text-sm font-medium text-stone-800">
              {product.rating.toFixed(1)} · {product.reviewCount} resenas
            </span>
          </div>
          <p className="text-[0.72rem] font-semibold tracking-[0.14em] text-stone-500">{product.brand}</p>
          <h3 className="max-w-[12ch] text-[1.55rem] font-semibold leading-[0.98] tracking-[-0.04em] text-stone-950">
            {product.name}
          </h3>
          <p className="text-sm leading-7 text-stone-600">{product.highlight}</p>
        </div>
      </Link>

      <div className="mt-auto border-t border-stone-200 px-1 pt-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            {hasOffer ? (
              <p className="text-sm text-stone-400 line-through">{formatCurrency(compareAtPrice)}</p>
            ) : null}
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
      </div>
    </article>
  );
}
