import type { Metadata } from "next";
import Link from "next/link";

import { NewsletterSignup } from "@/components/store/newsletter-signup";
import { SkinRoutineGuide } from "@/components/quiz/skin-routine-guide";
import { CheckCircleIcon } from "@/components/shared/icons";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { EditorialFigure } from "@/components/store/editorial-figure";
import { HeroCtaLink } from "@/components/store/hero-cta-link";
import { HeroQuizButton } from "@/components/store/hero-quiz-button";
import { NeedCardLink } from "@/components/store/need-card-link";
import { ProductCard } from "@/components/store/product-card";
import { ReviewsShowcase } from "@/components/store/reviews-showcase";
import {
  getCommercialSection,
  getDefaultCommercialContent,
  isCommercialQuizAction,
  resolveCommercialHref,
} from "@/lib/commercial-content";
import { getCommercialContent } from "@/lib/commercial-content-api";
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
import { blogPosts, shopNeeds } from "@/lib/site-data";
import { getBrands, getProducts } from "@/lib/storefront-api";

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
  const defaultCommercialContent = getDefaultCommercialContent();
  const hero = commercialContent.hero;
  const trustSignals = hero.trustSignals.length > 0 ? hero.trustSignals : defaultCommercialContent.hero.trustSignals;
  const featuredRoutinesSection = getCommercialSection(commercialContent, "featured_routines");
  const featuredProductsSection = getCommercialSection(commercialContent, "featured_products");
  const shopNeedsSection = getCommercialSection(commercialContent, "shop_needs");
  const scienceSection = getCommercialSection(commercialContent, "science");
  const reviewsSection =
    getCommercialSection(commercialContent, "reviews") ?? getCommercialSection(commercialContent, "testimonials");
  const educationSection = getCommercialSection(commercialContent, "blog");
  const routineGuideSteps =
    commercialContent.routineGuideSteps.length > 0
      ? commercialContent.routineGuideSteps
      : defaultCommercialContent.routineGuideSteps;
  const scienceHighlights =
    commercialContent.sciencePoints.length > 0
      ? commercialContent.sciencePoints.slice(0, 3)
      : defaultCommercialContent.sciencePoints.slice(0, 3);
  const featuredPosts = blogPosts.slice(0, 3);
  const reviewSummary = reviewSummaryResult.ok ? reviewSummaryResult.data : createEmptyReviewsSummary();
  const heroTitleLines = hero.title.split(". ");
  const homeSchemas = [
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
    buildCollectionPageJsonLd({
      path: "/",
      name: "Skin Hearten Home",
      description:
        "Portada editorial de Skin Hearten con rutinas premium, categorias por necesidad y productos curados para skincare.",
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
      <div className="home-page mx-auto flex max-w-[1320px] flex-col gap-20 px-5 py-6 sm:px-6 lg:gap-24 lg:px-8 lg:py-10">
        {hero.isVisible ? (
          <section
            className="grid gap-8 rounded-[2.8rem] border border-stone-200 bg-[rgba(255,252,248,0.92)] px-5 py-6 shadow-[0_30px_90px_rgba(28,20,16,0.06)] sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:grid-cols-[0.82fr_1.18fr] xl:gap-10"
            style={hero.backgroundColor ? { backgroundColor: hero.backgroundColor } : undefined}
          >
            <div className="max-w-xl space-y-8 xl:py-4">
              <div className="space-y-4">
                <p className="section-label">Home editorial</p>
                <h1 className="font-serif text-[2.85rem] leading-[0.92] text-stone-950 sm:text-[4rem] lg:text-[4.65rem] xl:text-[5.15rem]">
                  {heroTitleLines.map((part, index) => (
                    <span key={`${part}-${index}`}>
                      {part}
                      {index < heroTitleLines.length - 1 ? (
                        <>
                          .
                          <br />
                        </>
                      ) : null}
                    </span>
                  ))}
                </h1>
                <p className="max-w-md text-base leading-8 text-stone-600">{hero.subtitle}</p>
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
                    className="btn-ghost px-0 py-3 text-stone-950"
                    destination={hero.tertiaryButton.value}
                    href={resolveCommercialHref(hero.tertiaryButton)}
                  >
                    {hero.tertiaryButton.label}
                  </HeroCtaLink>
                ) : null}
              </div>

              <div className="grid gap-3 border-t border-stone-200 pt-6 sm:grid-cols-2">
                {trustSignals.slice(0, 4).map((signal) => (
                  <div className="flex items-center gap-3 text-sm text-stone-700" key={signal}>
                    <CheckCircleIcon className="h-4 w-4 shrink-0 text-stone-950" />
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <div className="grid gap-4">
                <article className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-soft">
                  <p className="section-label">Quiz visible</p>
                  <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">
                    Primero entendemos la necesidad.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600">
                    El cuestionario sigue vivo y ahora acompana la portada sin interrumpirla al primer segundo.
                  </p>
                </article>
                <EditorialFigure
                  className="min-h-[300px] sm:min-h-[320px]"
                  description="Espacio preparado para fotografia de textura, ingredient shot o still life real."
                  frame="texture"
                  label="Textura ligera"
                  title="Visuales sobrios para vender con criterio, no con ruido."
                  tone="linen"
                />
              </div>

              <div className="grid gap-4">
                <EditorialFigure
                  className="min-h-[340px] sm:min-h-[420px]"
                  description="Composicion de portada lista para reemplazar con fotografia oficial sin rehacer el layout."
                  frame="portrait"
                  label="Hero frame"
                  title="Una marca mas tranquila, centrada en piel, rutina y producto."
                  tone="blush"
                />
                <article className="rounded-[2rem] border border-stone-200 bg-[#f7efe7] p-5 shadow-soft">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="section-label">Catalogo</p>
                      <p className="mt-3 font-serif text-[2rem] leading-none text-stone-950">{featured.length}</p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">destacados claros para empezar rapido.</p>
                    </div>
                    <div>
                      <p className="section-label">Resenas</p>
                      <p className="mt-3 font-serif text-[2rem] leading-none text-stone-950">
                        {reviewSummary.totalReviews > 0 ? reviewSummary.averageRating.toFixed(1) : "0.0"}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-stone-600">
                        {reviewSummary.totalReviews > 0
                          ? `${reviewSummary.totalReviews} opiniones publicadas.`
                          : "El bloque queda listo para resenas reales."}
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 border-t border-stone-200 pt-4 text-sm text-stone-600">
                    {storefrontBrands.length > 0
                      ? `Marcas visibles hoy: ${storefrontBrands.slice(0, 4).map((brand) => brand.name).join(", ")}.`
                      : "La tienda puede seguir operando aun cuando la API de marcas no este disponible."}
                  </div>
                </article>
              </div>
            </div>
          </section>
        ) : null}

        {featuredRoutinesSection?.active !== false ? (
          <SkinRoutineGuide
            description={featuredRoutinesSection?.description ?? undefined}
            eyebrow={featuredRoutinesSection?.eyebrow ?? undefined}
            steps={routineGuideSteps}
            title={featuredRoutinesSection?.title ?? undefined}
          />
        ) : null}

        {featuredProductsSection?.active !== false ? (
          <section className="grid gap-8 lg:grid-cols-[0.76fr_1.24fr] lg:items-start" id="featured-products">
            <div className="space-y-5 lg:pt-6">
              <SectionHeading
                eyebrow={featuredProductsSection?.eyebrow ?? "Seleccion destacada"}
                title={featuredProductsSection?.title ?? "Productos elegidos para empezar bien."}
                description={
                  featuredProductsSection?.description ??
                  "Una seleccion corta para quien ya encontro su necesidad y quiere pasar a la rutina."
                }
              />
              {featuredProductsSection?.ctaLabel && featuredProductsSection.ctaType && featuredProductsSection.ctaValue ? (
                <Link
                  className="btn-ghost px-0 py-0 text-stone-950"
                  href={resolveCommercialHref({
                    type: featuredProductsSection.ctaType,
                    value: featuredProductsSection.ctaValue,
                  })}
                >
                  {featuredProductsSection.ctaLabel}
                </Link>
              ) : null}
            </div>
            <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-4">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        ) : null}

        {shopNeedsSection?.active !== false ? (
          <section className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]" id="shop-needs">
            <div className="space-y-6 lg:sticky lg:top-28 lg:self-start">
              <SectionHeading
                eyebrow={shopNeedsSection?.eyebrow ?? "Compra segun tu necesidad"}
                title={shopNeedsSection?.title ?? "Tambien puedes entrar por lo que quieres mejorar."}
                description={
                  shopNeedsSection?.description ??
                  "Acne, manchas, hidratacion, sensibilidad o proteccion solar. Una entrada clara para cada objetivo."
                }
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shopNeeds.map((need) => (
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

        {reviewsSection?.active !== false ? (
          <ReviewsShowcase
            description={
              reviewsSection?.description ??
              "Resenas aprobadas, lectura limpia y compras verificadas antes de decidir."
            }
            eyebrow={reviewsSection?.eyebrow ?? "Resenas verificadas"}
            primaryCtaLabel={reviewsSection?.ctaLabel ?? "Ver todas las resenas"}
            summary={reviewSummary}
            title={reviewsSection?.title ?? "Lo que dicen nuestras clientas"}
          />
        ) : null}

        {scienceSection?.active !== false ? (
          <section className="grid gap-8 border-y border-stone-200 py-10 lg:grid-cols-[0.84fr_1.16fr] lg:items-start">
            <div className="space-y-5">
              <SectionHeading
                eyebrow={scienceSection?.eyebrow ?? "Compra con contexto"}
                title={scienceSection?.title ?? "Menos saturacion, mas criterio de compra."}
                description={
                  scienceSection?.description ??
                  "La educacion sigue estando presente, pero ahora sostiene la compra en vez de pelearle espacio al producto."
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {scienceHighlights.map((highlight) => (
                <article className="rounded-[1.8rem] border border-stone-200 bg-white p-5" key={highlight.title}>
                  <p className="section-label">{highlight.eyebrow}</p>
                  <h3 className="mt-3 font-serif text-[1.75rem] leading-[1] text-stone-950">{highlight.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{highlight.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {educationSection?.active !== false ? (
          <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="space-y-5 lg:pt-4">
              <SectionHeading
                eyebrow={educationSection?.eyebrow ?? "Educacion breve"}
                title={educationSection?.title ?? "Tres lecturas para comprar con mejor criterio."}
                description={
                  educationSection?.description ??
                  "Activos, rutinas y fotoproteccion sin convertir la Home en un blog largo."
                }
              />
              <Link className="btn-ghost px-0 py-0 text-stone-950" href="/blog">
                Ir al blog
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {featuredPosts.map((post) => (
                <Link
                  className="group rounded-[2rem] border border-stone-200 bg-white p-5 shadow-soft transition hover:-translate-y-1 hover:border-stone-300"
                  href={`/blog/${post.slug}`}
                  key={post.id}
                >
                  <p className="section-label">{post.publishedAt}</p>
                  <h3 className="mt-4 font-serif text-[2rem] leading-[0.98] text-stone-950">{post.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-stone-600">{post.excerpt}</p>
                  <p className="mt-6 text-sm font-semibold text-stone-950">Seguir leyendo</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <NewsletterSignup />
      </div>
    </>
  );
}
