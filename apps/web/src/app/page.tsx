import type { Metadata } from "next";
import Link from "next/link";

import { SkinRoutineGuide } from "@/components/quiz/skin-routine-guide";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { ArrowUpRightIcon, CheckCircleIcon } from "@/components/shared/icons";
import { JsonLd } from "@/components/shared/json-ld";
import { SectionHeading } from "@/components/shared/section-heading";
import { RatingStars } from "@/components/shared/rating-stars";
import { EditorialFigure } from "@/components/store/editorial-figure";
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
import { getBrands, getProducts } from "@/lib/storefront-api";
import {
  blogPosts,
  shopNeeds,
} from "@/lib/site-data";

export const metadata: Metadata = buildPublicMetadata({
  title: "Rutinas premium para manchas, hidratacion y piel sensible",
  description:
    "Diagnostico guiado, rutinas premium y skincare seleccionado para manchas, hidratacion, sensibilidad y proteccion solar en Mexico.",
  path: "/",
});

export default async function HomePage() {
  const [catalogProducts, storefrontBrands, reviewsSummaryResult, commercialContent] = await Promise.all([
    getProducts(),
    getBrands(),
    getReviewsSummary(),
    getCommercialContent(),
  ]);
  const featuredSelection = catalogProducts.filter((product) => product.featured).slice(0, 4);
  const bestSellerSelection = catalogProducts.filter((product) => product.bestSeller).slice(0, 3);
  const featured = featuredSelection.length > 0 ? featuredSelection : catalogProducts.slice(0, 4);
  const bestSellers = bestSellerSelection.length > 0 ? bestSellerSelection : catalogProducts.slice(0, 3);
  const featuredPost = blogPosts[0];
  const secondaryPosts = blogPosts.slice(1);
  const defaultCommercialContent = getDefaultCommercialContent();
  const hero = commercialContent.hero;
  const trustSignals = hero.trustSignals.length > 0 ? hero.trustSignals : defaultCommercialContent.hero.trustSignals;
  const featuredRoutinesSection = getCommercialSection(commercialContent, "featured_routines");
  const featuredProductsSection = getCommercialSection(commercialContent, "featured_products");
  const shopNeedsSection = getCommercialSection(commercialContent, "shop_needs");
  const scienceSection = getCommercialSection(commercialContent, "science");
  const testimonialsSection = getCommercialSection(commercialContent, "testimonials");
  const bestsellersSection = getCommercialSection(commercialContent, "bestsellers");
  const reviewsSection = getCommercialSection(commercialContent, "reviews");
  const blogSection = getCommercialSection(commercialContent, "blog");
  const routineGuideSteps =
    commercialContent.routineGuideSteps.length > 0
      ? commercialContent.routineGuideSteps
      : defaultCommercialContent.routineGuideSteps;
  const sciencePoints =
    commercialContent.sciencePoints.length > 0
      ? commercialContent.sciencePoints
      : defaultCommercialContent.sciencePoints;
  const homeTestimonials =
    commercialContent.homeTestimonials.length > 0
      ? commercialContent.homeTestimonials
      : defaultCommercialContent.homeTestimonials;
  const leadTestimonial = homeTestimonials[0] ?? defaultCommercialContent.homeTestimonials[0];
  const supportingTestimonials =
    homeTestimonials.length > 1
      ? homeTestimonials.slice(1, 4)
      : defaultCommercialContent.homeTestimonials.slice(1, 4);
  const heroTitleLines = hero.title.split(". ");
  const reviewsSummary = reviewsSummaryResult.ok ? reviewsSummaryResult.data : createEmptyReviewsSummary();
  const homeSchemas = [
    buildOrganizationJsonLd(),
    buildWebsiteJsonLd(),
    buildCollectionPageJsonLd({
      path: "/",
      name: "Skin Hearten Home",
      description:
        "Portada editorial de Skin Hearten con rutinas premium, categorias por necesidad y productos curados para skincare.",
    }),
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
    ]),
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
      <div className="home-page mx-auto max-w-[1320px] space-y-24 px-5 py-6 sm:px-6 lg:space-y-28 lg:px-8 lg:py-10">
        {hero.isVisible ? (
          <section
            className="grid gap-10 border-b border-stone-200 pb-18 lg:grid-cols-[0.84fr_1.16fr] lg:items-start lg:pb-24"
            style={hero.backgroundColor ? { backgroundColor: hero.backgroundColor } : undefined}
          >
          <div className="max-w-xl space-y-8 lg:pt-8">
            <div className="space-y-4">
              <p className="section-label">Te entendemos</p>
              <h1 className="font-serif text-[3.15rem] leading-[0.92] text-stone-950 sm:text-[4.15rem] lg:text-[5.35rem]">
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
              <p className="max-w-md text-base leading-8 text-stone-600">
                {hero.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {isCommercialQuizAction(hero.primaryButton.type) ? (
                <SkinQuizTrigger className="btn-primary px-6 py-3.5" source="home">
                  {hero.primaryButton.label}
                </SkinQuizTrigger>
              ) : (
                <Link className="btn-primary px-6 py-3.5" href={resolveCommercialHref(hero.primaryButton)}>
                  {hero.primaryButton.label}
                </Link>
              )}
              {isCommercialQuizAction(hero.secondaryButton.type) ? (
                <SkinQuizTrigger className="btn-secondary px-6 py-3.5" source="home">
                  {hero.secondaryButton.label}
                </SkinQuizTrigger>
              ) : (
                <Link className="btn-secondary px-6 py-3.5" href={resolveCommercialHref(hero.secondaryButton)}>
                  {hero.secondaryButton.label}
                </Link>
              )}
              {hero.tertiaryButton ? (
                <Link className="btn-ghost px-0 py-3 text-stone-950" href={resolveCommercialHref(hero.tertiaryButton)}>
                  {hero.tertiaryButton.label}
                </Link>
              ) : null}
            </div>

            <div className="grid gap-3 border-t border-stone-200 pt-6 sm:grid-cols-2">
              {trustSignals.map((signal) => (
                <div className="flex items-center gap-3 text-sm text-stone-700" key={signal}>
                  <CheckCircleIcon className="h-4 w-4 shrink-0 text-stone-950" />
                  <span>{signal}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
            <div className="grid gap-4">
              <EditorialFigure
                className="min-h-[300px]"
                description="Lavabo, textura e ingrediente. Aire suficiente para fotografia futura."
                frame="texture"
                label="Texture study"
                title="Formulas que se sienten ligeras antes de tocar la piel."
                tone="linen"
              />
              <EditorialFigure
                className="min-h-[340px]"
                description="Espacio preparado para still life, repisa y rutina de manana."
                frame="vanity"
                label="Quiet shelf"
                title="Una escena limpia para ritual, objeto y luz suave."
                tone="mist"
              />
            </div>
            <EditorialFigure
              className="min-h-[660px]"
              description="La portada deja sitio para retrato, gesto y empaque sin recurrir a placeholders gigantes."
              frame="portrait"
              label="Cover frame"
              title="Una marca que se lee como revista y acompana como consultora."
              tone="blush"
            />
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
          <div className="space-y-5 lg:pt-8">
            <SectionHeading
              eyebrow={featuredProductsSection?.eyebrow ?? "Tu seleccion"}
              title={featuredProductsSection?.title ?? "Aqui aparecen los productos. Ya con contexto."}
              description={featuredProductsSection?.description ?? "Cada formula llega despues del diagnostico, la rutina y la razon de uso."}
            />
            <p className="max-w-sm text-sm leading-7 text-stone-600">
              No es una lista infinita primero. Es una rutina que aterriza en esenciales concretos.
            </p>
            {featuredProductsSection?.ctaLabel && featuredProductsSection.ctaType && featuredProductsSection.ctaValue ? (
              <Link className="btn-ghost px-0 py-0 text-stone-950" href={resolveCommercialHref({ type: featuredProductsSection.ctaType, value: featuredProductsSection.ctaValue })}>
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
              eyebrow={shopNeedsSection?.eyebrow ?? "Si prefieres explorar"}
              title={shopNeedsSection?.title ?? "Tambien puedes entrar por necesidad."}
              description={shopNeedsSection?.description ?? "Una ruta secundaria para quien ya sabe si busca acne, manchas, hidratacion o sensibilidad."}
            />
            <p className="max-w-sm text-sm leading-7 text-stone-600">
              Cada entrada conduce a una seleccion concreta, no a una exploracion abierta sin criterio.
            </p>
            {shopNeedsSection?.ctaLabel && shopNeedsSection.ctaType && shopNeedsSection.ctaValue ? (
              <Link className="btn-ghost px-0 py-0 text-stone-950" href={resolveCommercialHref({ type: shopNeedsSection.ctaType, value: shopNeedsSection.ctaValue })}>
                {shopNeedsSection.ctaLabel}
              </Link>
            ) : null}
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

        {scienceSection?.active !== false ? (
          <section className="grid gap-8 border-y border-stone-200 py-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
          <EditorialFigure
            className="min-h-[520px]"
            description="Una base lista para retratos, ingredientes y escenas de bano minimalista."
            frame="vanity"
            label="Editorial space"
            title="La educacion tambien acompana cuando la rutina es clara."
            tone="sand"
          />
          <div className="grid gap-8 content-start">
            <div className="space-y-4">
              <p className="section-label">{scienceSection?.eyebrow ?? "La ciencia detras"}</p>
              <h2 className="max-w-xl font-serif text-[2.45rem] leading-[0.98] text-stone-950 sm:text-[3rem]">
                {scienceSection?.title ?? "No vendemos primero. Explicamos primero."}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                {scienceSection?.description ?? "La piel mejora mas facil cuando entiendes que hace cada paso y por que esta en tu rutina."}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {sciencePoints.map((moment) => (
                <div className="border-t border-stone-200 pt-4" key={moment.title}>
                  <p className="section-label">{moment.eyebrow}</p>
                  <p className="mt-3 text-sm font-semibold text-stone-900">{moment.title}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{moment.description}</p>
                </div>
              ))}
            </div>

            <div className="editorial-divider pt-6">
              <p className="section-label">Marcas seleccionadas</p>
              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-lg text-stone-700">
                {storefrontBrands.map((brand) => (
                  <span key={brand.id}>{brand.name}</span>
                ))}
              </div>
            </div>
          </div>
          </section>
        ) : null}

        {(testimonialsSection?.active !== false || bestsellersSection?.active !== false) ? (
          <section className="grid gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start" id="bestsellers">
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="section-label">{testimonialsSection?.eyebrow ?? "Voces de la comunidad"}</p>
              <h2 className="max-w-lg font-serif text-[2.6rem] leading-[0.98] text-stone-950">
                {testimonialsSection?.title ?? "La confianza entra mejor cuando se lee como testimonio."}
              </h2>
            </div>

            <article className="rounded-[2.2rem] bg-[#efe4d8] p-6 sm:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 font-serif text-xl text-stone-950">
                  {leadTestimonial.name
                    .split(" ")
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")}
                </div>
                <div>
                  <p className="font-semibold text-stone-900">{leadTestimonial.name}</p>
                  <p className="text-sm text-stone-500">{leadTestimonial.city}</p>
                </div>
              </div>
              <RatingStars className="mt-6" rating={leadTestimonial.rating} />
              <p className="mt-6 max-w-2xl font-serif text-[2rem] leading-[1.02] text-stone-950 sm:text-[2.45rem]">
                {leadTestimonial.text}
              </p>
              <p className="mt-6 text-sm text-stone-500">Compra verificada</p>
            </article>

            <div className="grid gap-4 sm:grid-cols-2">
              {supportingTestimonials.map((testimonial, index) => (
                <article className="border-t border-stone-200 pt-5" key={`${testimonial.name}-${index}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e5dc] text-sm font-semibold text-stone-900">
                      {testimonial.name
                        .split(" ")
                        .slice(0, 2)
                        .map((part) => part[0])
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{testimonial.name}</p>
                      <p className="text-xs text-stone-500">{testimonial.city}</p>
                    </div>
                  </div>
                  <RatingStars className="mt-4" rating={testimonial.rating} />
                  <p className="mt-4 text-sm leading-7 text-stone-700">{testimonial.text}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <SectionHeading
              eyebrow={bestsellersSection?.eyebrow ?? "Bestsellers"}
              title={bestsellersSection?.title ?? "Lo que vuelve a entrar a la rutina."}
              description={bestsellersSection?.description ?? "Formulas que se recompran por sensorial, constancia y resultado."}
            />
            <div className="grid gap-x-6 gap-y-10 md:grid-cols-2 xl:grid-cols-3">
              {bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
          </section>
        ) : null}

        {reviewsSection?.active !== false ? (
          <ReviewsShowcase
            description={reviewsSection?.description ?? undefined}
            eyebrow={reviewsSection?.eyebrow ?? undefined}
            primaryCtaLabel={reviewsSection?.ctaLabel ?? undefined}
            summary={reviewsSummary}
            title={reviewsSection?.title ?? undefined}
          />
        ) : null}

        {blogSection?.active !== false ? (
          <section className="space-y-10">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <SectionHeading
              eyebrow={blogSection?.eyebrow ?? "Diario Skin Hearten"}
              title={blogSection?.title ?? "Lectura tranquila para seguir explorando."}
              description={blogSection?.description ?? "Activos, rutina y cuidado de la piel en tono editorial."}
            />
            <Link
              className="group overflow-hidden rounded-[2.5rem] bg-[#f6eee6] p-6 sm:p-8"
              href={`/blog/${featuredPost.slug}`}
            >
              <div className="flex min-h-[420px] flex-col justify-between gap-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="section-label">Edicion principal</p>
                    <p className="mt-2 text-sm text-stone-500">{featuredPost.publishedAt}</p>
                  </div>
                  <span className="rounded-full border border-stone-300/80 px-3 py-1 text-xs font-medium text-stone-600">
                    Guia
                  </span>
                </div>
                <div>
                  <h3 className="max-w-2xl font-serif text-4xl leading-[1] text-stone-900 transition duration-300 group-hover:translate-x-1 sm:text-5xl">
                    {featuredPost.title}
                  </h3>
                  <p className="mt-5 max-w-xl text-sm leading-7 text-stone-700 sm:text-base">
                    {featuredPost.excerpt}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-stone-900">
                    Leer articulo
                    <ArrowUpRightIcon />
                  </div>
                </div>
              </div>
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {secondaryPosts.map((post, index) => (
              <Link className="border-t border-stone-200 pt-5" href={`/blog/${post.slug}`} key={post.id}>
                <p className="section-label">Columna 0{index + 1}</p>
                <h3 className="mt-5 font-serif text-[2rem] leading-[1.02] text-stone-900">{post.title}</h3>
                <p className="mt-4 text-sm leading-7 text-stone-600">{post.excerpt}</p>
                <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
                  <span>{post.author}</span>
                  <span>{post.publishedAt}</span>
                </div>
              </Link>
            ))}
          </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
