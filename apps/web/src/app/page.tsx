import type { Metadata } from "next";
import Link from "next/link";

import { SkinRoutineGuide } from "@/components/quiz/skin-routine-guide";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { CheckCircleIcon } from "@/components/shared/icons";
import { JsonLd } from "@/components/shared/json-ld";
import { RatingStars } from "@/components/shared/rating-stars";
import { SectionHeading } from "@/components/shared/section-heading";
import { EditorialFigure } from "@/components/store/editorial-figure";
import { NeedCardLink } from "@/components/store/need-card-link";
import { ProductCard } from "@/components/store/product-card";
import {
  getCommercialSection,
  getDefaultCommercialContent,
  isCommercialQuizAction,
  resolveCommercialHref,
} from "@/lib/commercial-content";
import { getCommercialContent } from "@/lib/commercial-content-api";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildCollectionPageJsonLd,
  buildOrganizationJsonLd,
  buildPublicMetadata,
  buildWebsiteJsonLd,
} from "@/lib/seo";
import { getBrands, getProducts } from "@/lib/storefront-api";
import { shopNeeds } from "@/lib/site-data";

export const metadata: Metadata = buildPublicMetadata({
  title: "Rutinas premium para manchas, hidratacion y piel sensible",
  description:
    "Diagnostico guiado, rutinas premium y skincare seleccionado para manchas, hidratacion, sensibilidad y proteccion solar en Mexico.",
  path: "/",
});

export default async function HomePage() {
  const [catalogProducts, storefrontBrands, commercialContent] = await Promise.all([
    getProducts(),
    getBrands(),
    getCommercialContent(),
  ]);

  const featuredSelection = catalogProducts.filter((product) => product.featured).slice(0, 4);
  const featured = featuredSelection.length > 0 ? featuredSelection : catalogProducts.slice(0, 4);
  const defaultCommercialContent = getDefaultCommercialContent();
  const hero = commercialContent.hero;
  const trustSignals = hero.trustSignals.length > 0 ? hero.trustSignals : defaultCommercialContent.hero.trustSignals;
  const featuredRoutinesSection = getCommercialSection(commercialContent, "featured_routines");
  const featuredProductsSection = getCommercialSection(commercialContent, "featured_products");
  const shopNeedsSection = getCommercialSection(commercialContent, "shop_needs");
  const storySection = getCommercialSection(commercialContent, "science");
  const testimonialsSection = getCommercialSection(commercialContent, "testimonials");
  const routineGuideSteps =
    commercialContent.routineGuideSteps.length > 0
      ? commercialContent.routineGuideSteps
      : defaultCommercialContent.routineGuideSteps;
  const storyHighlights =
    commercialContent.sciencePoints.length > 0
      ? commercialContent.sciencePoints.slice(0, 3)
      : defaultCommercialContent.sciencePoints.slice(0, 3);
  const homeTestimonials =
    commercialContent.homeTestimonials.length > 0
      ? commercialContent.homeTestimonials
      : defaultCommercialContent.homeTestimonials;
  const leadTestimonial = homeTestimonials[0] ?? defaultCommercialContent.homeTestimonials[0];
  const supportingTestimonials =
    homeTestimonials.length > 1
      ? homeTestimonials.slice(1, 3)
      : defaultCommercialContent.homeTestimonials.slice(1, 3);
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
                <p className="max-w-md text-base leading-8 text-stone-600">{hero.subtitle}</p>
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
                title="Una marca que acompana como consultora antes de vender."
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
              {shopNeedsSection?.ctaLabel && shopNeedsSection.ctaType && shopNeedsSection.ctaValue ? (
                <Link
                  className="btn-ghost px-0 py-0 text-stone-950"
                  href={resolveCommercialHref({
                    type: shopNeedsSection.ctaType,
                    value: shopNeedsSection.ctaValue,
                  })}
                >
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

        {storySection?.active !== false ? (
          <section className="grid gap-8 border-y border-stone-200 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-5">
              <p className="section-label">{storySection?.eyebrow ?? "Historias reales"}</p>
              <h2 className="max-w-xl font-serif text-[2.5rem] leading-[0.98] text-stone-950">
                {storySection?.title ?? "Historias reales, proximamente"}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                {storySection?.description ??
                  "Estamos reuniendo casos completos de constancia, textura y proteccion diaria. Mientras tanto, empieza con un diagnostico y una rutina clara."}
              </p>
              <div className="rounded-[2rem] bg-[#f6eee6] px-5 py-6 text-sm leading-7 text-stone-700">
                La transformacion real llega cuando una rutina cabe en la vida diaria. Este espacio quedara listo para documentar casos completos, sin promesas exageradas.
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-500">
                {storefrontBrands.slice(0, 4).map((brand) => (
                  <span key={brand.id}>{brand.name}</span>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {storyHighlights.map((highlight) => (
                <article className="border-t border-stone-200 pt-4" key={highlight.title}>
                  <p className="section-label">{highlight.eyebrow}</p>
                  <p className="mt-3 text-sm font-semibold text-stone-900">{highlight.title}</p>
                  <p className="mt-2 text-sm leading-7 text-stone-600">{highlight.description}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {testimonialsSection?.active !== false ? (
          <section className="grid gap-8 border-t border-stone-200 pt-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
            <div className="space-y-4">
              <p className="section-label">{testimonialsSection?.eyebrow ?? "Voces de la comunidad"}</p>
              <h2 className="max-w-lg font-serif text-[2.6rem] leading-[0.98] text-stone-950">
                {testimonialsSection?.title ?? "La confianza entra mejor cuando se lee como testimonio."}
              </h2>
              <p className="max-w-xl text-sm leading-7 text-stone-600">
                {testimonialsSection?.description ?? "Historias reales de clientas que compran con mas criterio y menos ruido."}
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
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

              <div className="grid gap-4">
                {supportingTestimonials.map((testimonial, index) => (
                  <article className="rounded-[1.8rem] border border-stone-200 bg-white p-5" key={`${testimonial.name}-${index}`}>
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f3e7dd] text-sm font-semibold text-stone-950">
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
          </section>
        ) : null}
      </div>
    </>
  );
}
