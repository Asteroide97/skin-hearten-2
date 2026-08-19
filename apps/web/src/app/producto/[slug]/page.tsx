import Image from "next/image";
import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { JsonLd } from "@/components/shared/json-ld";
import { RatingStars } from "@/components/shared/rating-stars";
import { CheckCircleIcon } from "@/components/shared/icons";
import { SectionHeading } from "@/components/shared/section-heading";
import { AddToCartButton } from "@/components/store/add-to-cart-button";
import { ProductReviewsSection } from "@/components/store/product-reviews-section";
import { ProductViewTracker } from "@/components/store/product-view-tracker";
import { RoutineBuilderTrigger } from "@/components/store/routine-builder-trigger";
import { passthroughImageLoader, resolveAssetUrl } from "@/lib/assets";
import { formatCurrency } from "@/lib/format";
import type { ProductReviewSummary } from "@/lib/product-reviews";
import { createEmptyProductReviewSummary } from "@/lib/product-reviews";
import { getProductReviews } from "@/lib/product-reviews-api";
import {
  absoluteUrl,
  buildBreadcrumbJsonLd,
  buildPublicMetadata,
  resolveSeoImage,
} from "@/lib/seo";
import { getProductBySlug } from "@/lib/storefront-api";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    category?: string;
    source?: string;
  }>;
};

type ProductExperience = {
  idealFor: string[];
  ingredientCards: Array<{ name: string; effect: string }>;
  keyBenefits: string[];
  notRecommendedIf: string;
  usageNotes: string[];
};

const ingredientGlossary: Record<string, string> = {
  "Acido mandelico": "Ayuda a refinar la textura con una exfoliacion mas gradual que otras opciones.",
  "Agua de rosas": "Aporta frescura ligera y hace mas agradable sumar hidratacion durante el dia.",
  "Avena coloidal": "Calma y acompana una limpieza que no deja sensacion tirante.",
  BHA: "Trabaja sobre poros y textura para que la piel se vea mas uniforme.",
  "Beta glucanos": "Sostienen confort e hidratacion cuando la piel se siente cansada o reactiva.",
  Ceramidas: "Refuerzan la barrera para que la piel retenga mejor hidratacion y confort.",
  Escualano: "Suaviza y deja una sensacion flexible sin volver pesada la rutina.",
  Glicerina: "Atrae agua hacia la piel y da hidratacion inmediata.",
  Niacinamida: "Acompana luminosidad, uniformidad y una barrera mas estable.",
  Pantenol: "Ayuda a que la piel se sienta mas calmada y menos reactiva.",
  Peptidos: "Acompanan firmeza visual y una textura mas lisa con uso constante.",
  Resveratrol: "Aporta apoyo antioxidante para sostener una piel mas uniforme.",
  "Vitamina E": "Suma confort y soporte antioxidante para una rutina mas estable.",
  "Zinc PCA": "Ayuda a equilibrar brillo y brotes sin resecar de mas.",
  "Extracto de arroz": "Aporta suavidad y ayuda a que la formula se sienta mas ligera.",
  "Filtros fotoestables": "Protegen frente al sol para que manchas y sensibilidad no se intensifiquen.",
  "Manteca de karite": "Envuelve la piel en confort y ayuda a sellar hidratacion.",
};

export async function generateMetadata({ params }: ProductDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {};
  }

  return buildPublicMetadata({
    title: product.name,
    description: product.highlight,
    path: `/producto/${product.slug}`,
    image: product.image,
  });
}

export default async function ProductDetailPage({ params, searchParams }: ProductDetailPageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const [product, reviewResult] = await Promise.all([
    getProductBySlug(slug),
    getProductReviews(slug),
  ]);

  if (!product) {
    notFound();
  }

  const reviewSummary = reviewResult.ok
    ? reviewResult.data
    : createEmptyProductReviewSummary(Number(product.id));

  const experience = buildProductExperience(product);
  const sourceHint = query.source === "category" ? "category" : "product";
  const categoryHint = query.category ?? product.category;
  const productSchemas = buildProductSchemas(product, reviewSummary);
  const productMedia = Array.from(
    new Set(
      [product.image, ...product.images]
        .map((asset) => resolveAssetUrl(asset))
        .filter((asset): asset is string => Boolean(asset)),
    ),
  );
  const primaryImage = productMedia[0] ?? null;
  const secondaryImages = productMedia.slice(1, 3);
  const displayRating = reviewSummary.reviewCount > 0 ? reviewSummary.averageRating : product.rating;
  const displayReviewCount = reviewSummary.reviewCount > 0 ? reviewSummary.reviewCount : product.reviewCount;

  return (
    <div className="product-page mx-auto max-w-[1180px] space-y-10 px-5 py-8 sm:px-6 lg:px-8 lg:space-y-12">
      <JsonLd data={productSchemas} />
      <ProductViewTracker
        category={product.category}
        price={product.price}
        productId={product.id}
        productName={product.name}
      />

      <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-start">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[2.35rem] border border-stone-200 bg-[#fbf6f1]">
            {primaryImage ? (
              <div className="relative min-h-[420px] sm:min-h-[520px]">
                <Image
                  alt={product.name}
                  className="h-full w-full object-contain p-6 sm:p-10"
                  fill
                  loader={passthroughImageLoader}
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  src={primaryImage}
                  unoptimized
                />
              </div>
            ) : (
              <div className={`relative min-h-[420px] bg-gradient-to-br ${product.gradient} px-6 py-6 sm:min-h-[520px]`}>
                <div className="absolute left-1/2 top-10 h-28 w-28 -translate-x-1/2 rounded-full bg-white/72 blur-3xl" />
                <div className="relative flex h-full items-end justify-center">
                  <div className="absolute bottom-0 h-64 w-40 rounded-[3.4rem_3.4rem_1.9rem_1.9rem] border border-white/80 bg-white/84" />
                  <div className="absolute bottom-14 left-[56%] h-40 w-24 rotate-[7deg] rounded-[1.7rem] border border-white/78 bg-white/72" />
                  <div className="absolute bottom-10 left-[26%] h-10 w-20 rounded-full bg-[#ead7c8]/92" />
                  <div className="relative z-10 mb-8 rounded-full border border-white/70 bg-white/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-700">
                    Fotografia pendiente
                  </div>
                </div>
              </div>
            )}
          </div>

          {secondaryImages.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {secondaryImages.map((asset, index) => (
                <div className="overflow-hidden rounded-[1.8rem] border border-stone-200 bg-white" key={`${asset}-${index}`}>
                  <Image
                    alt={`${product.name} vista ${index + 2}`}
                    className="h-44 w-full object-contain p-4"
                    height={240}
                    loader={passthroughImageLoader}
                    sizes="(min-width: 640px) 50vw, 100vw"
                    src={asset}
                    unoptimized
                    width={320}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6 lg:pl-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
              {product.category}
            </span>
            {product.bestSeller ? (
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
                Bestseller
              </span>
            ) : null}
            {product.stock > 0 ? (
              <span className="rounded-full border border-[#d8e3cf] bg-[#f5faf1] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#476638]">
                Disponible
              </span>
            ) : (
              <span className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-600">
                Sin stock
              </span>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{product.brand}</p>
            <h1 className="font-serif text-[2.8rem] leading-[0.92] text-stone-950 sm:text-[3.5rem]">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-4">
              <RatingStars rating={displayRating} reviewCount={displayReviewCount} />
              {displayReviewCount > 0 ? (
                <a className="text-sm text-stone-600 underline-offset-4 hover:underline" href="#opiniones">
                  {displayReviewCount} opiniones
                </a>
              ) : null}
            </div>
            <p className="max-w-xl text-base leading-8 text-stone-700">{product.highlight}</p>
            <p className="max-w-xl text-sm leading-7 text-stone-600">{product.description}</p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <p className="text-3xl font-semibold text-stone-950">{formatCurrency(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-lg text-stone-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
            ) : null}
          </div>

          <div className="rounded-[1.8rem] bg-[#fbf4ec] p-5">
            <p className="section-label">Lo esencial</p>
            <div className="mt-4 grid gap-3">
              {experience.keyBenefits.map((benefit) => (
                <div className="flex items-start gap-3 text-sm leading-7 text-stone-700" key={benefit}>
                  <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-stone-950" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <AddToCartButton
              className="btn-primary px-6 py-3.5"
              disabled={product.stock <= 0}
              label="Agregar al carrito"
              name={product.name}
              price={product.price}
              productId={product.id}
              slug={product.slug}
            />
            <RoutineBuilderTrigger
              buttonClassName="btn-secondary px-6 py-3.5"
              categoryHint={categoryHint}
              label="Ver en Routine Builder"
              product={product}
              sourceHint={sourceHint}
            />
            <a className="btn-ghost px-0 py-3 text-stone-950" href="#opiniones">
              Ver opiniones
            </a>
          </div>

          <p className="text-sm leading-7 text-stone-600">
            Compra directa si ya sabes lo que quieres. Si prefieres contexto, el Routine Builder sigue disponible como apoyo y no como desvio obligatorio.
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.9rem] border border-stone-200 bg-white p-5 sm:p-6">
          <p className="section-label">Ideal para</p>
          <div className="mt-5 grid gap-3">
            {experience.idealFor.map((item) => (
              <div className="flex items-start gap-3 text-sm leading-7 text-stone-700" key={item}>
                <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-stone-950" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200 bg-[#fffaf7] p-5 sm:p-6">
          <p className="section-label">Como usarlo</p>
          <div className="mt-5 grid gap-3">
            {experience.usageNotes.map((entry) => (
              <p className="text-sm leading-7 text-stone-700" key={entry}>
                {entry}
              </p>
            ))}
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-stone-200 bg-white p-5 sm:p-6">
          <p className="section-label">Antes de comprar</p>
          <p className="mt-5 text-sm leading-7 text-stone-700">{experience.notRecommendedIf}</p>
        </article>
      </section>

      <section className="space-y-8 border-y border-stone-200 py-10">
        <SectionHeading
          eyebrow="Ingredientes"
          title="Que hace la formula sin volverte la compra mas pesada"
          description="Solo una lectura corta de los activos o soportes que mas explican el producto."
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {experience.ingredientCards.slice(0, 6).map((ingredient) => (
            <article className="rounded-[1.8rem] border border-stone-200 bg-white p-5" key={ingredient.name}>
              <h2 className="font-serif text-[1.55rem] leading-[1] text-stone-950">{ingredient.name}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{ingredient.effect}</p>
            </article>
          ))}
        </div>
      </section>

      <div id="opiniones">
        <ProductReviewsSection
          initialSummary={reviewSummary}
          productName={product.name}
          productRef={product.slug}
        />
      </div>
    </div>
  );
}

function buildProductExperience(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const idealFor = [...product.skinTypes, ...product.concerns].filter(Boolean).slice(0, 4);
  const notRecommendedIf =
    product.category === "Tratamientos" || product.category === "Serums"
      ? "Tu barrera esta muy sensibilizada o quieres usar demasiados activos al mismo tiempo. Mejor entra poco a poco y con constancia."
      : product.category === "Protector Solar"
        ? "Esperas que un solo paso corrija tono o firmeza. Aqui protege muy bien, pero funciona mejor dentro de una rutina completa."
        : "Buscas un cambio inmediato sin sostener manana y noche. Esta formula se luce mas cuando la rutina se vuelve estable.";

  return {
    idealFor:
      idealFor.length > 0
        ? idealFor
        : [
            "Rutinas que necesitan una pieza clara y facil de sostener.",
            "Compras con foco en una necesidad especifica.",
          ],
    ingredientCards: product.ingredients.map((ingredient) => ({
      name: ingredient,
      effect:
        ingredientGlossary[ingredient] ??
        `${ingredient} acompana la formula sin volver la rutina mas pesada de lo necesario.`,
    })),
    keyBenefits: buildKeyBenefits(product),
    notRecommendedIf,
    usageNotes: buildUsageNotes(product),
  } satisfies ProductExperience;
}

function buildKeyBenefits(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const providedBenefits = product.benefits.filter(Boolean).slice(0, 3);
  if (providedBenefits.length > 0) {
    return providedBenefits;
  }

  switch (product.category) {
    case "Limpiadores":
      return [
        "Limpia sin dejar una sensacion tirante.",
        "Prepara la piel para lo que sigue.",
        "Baja friccion en la rutina diaria.",
      ];
    case "Protector Solar":
      return [
        "Protege todos los dias sin volver pesada la rutina.",
        "Ayuda a sostener tratamientos y tono uniforme.",
        "Se integra mejor cuando la textura no estorba.",
      ];
    case "Hidratantes":
      return [
        "Suma confort y flexibilidad desde las primeras aplicaciones.",
        "Ayuda a sellar mejor la hidratacion.",
        "Acompana una piel mas estable con uso constante.",
      ];
    default:
      return [
        `Trabaja ${product.concerns[0]?.toLowerCase() ?? "tu objetivo principal"} con una formula pensada para sostenerse mejor en el tiempo.`,
        "Se integra facil en una rutina real, no solo en una promesa de marketing.",
        "Busca constancia antes que saturacion.",
      ];
  }
}

function buildUsageNotes(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const usage = product.usage.filter(Boolean);
  if (usage.length >= 3) {
    return usage.slice(0, 3);
  }

  const notes = [...usage];

  if (product.category === "Protector Solar") {
    notes.push("Usalo como ultimo paso de la manana y reaplica cuando la exposicion lo pida.");
  } else if (product.category === "Limpiadores") {
    notes.push("Empieza sobre piel humeda y retira sin friccion extra.");
  } else if (product.category === "Serums" || product.category === "Tratamientos") {
    notes.push("Introduce el activo poco a poco si tu piel aun no lo conoce.");
  } else {
    notes.push("Manten una frecuencia constante para que el resultado no dependa de impulsos.");
  }

  if (
    !notes.some((entry) => entry.toLowerCase().includes("protector solar")) &&
    product.category !== "Protector Solar"
  ) {
    notes.push("Si lo usas por la manana, acompana siempre con protector solar.");
  }

  return Array.from(new Set(notes)).slice(0, 3);
}

function buildProductSchemas(
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>,
  reviewSummary: ProductReviewSummary,
) {
  const reviews = reviewSummary.reviews.slice(0, 5).map((review) => ({
    "@type": "Review",
    author: {
      "@type": "Person",
      name: review.customerName,
    },
    datePublished: review.createdAt,
    reviewBody: review.body,
    name: review.title ?? `Opinion sobre ${product.name}`,
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
    },
  }));

  const aggregateRating =
    reviewSummary.reviewCount > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: reviewSummary.averageRating,
          reviewCount: reviewSummary.reviewCount,
          bestRating: 5,
        }
      : product.reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
            bestRating: 5,
          }
        : undefined;

  return [
    buildBreadcrumbJsonLd([
      { name: "Inicio", path: "/" },
      { name: "Productos", path: "/productos" },
      { name: product.name, path: `/producto/${product.slug}` },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.description,
      sku: product.sku,
      category: product.category,
      image: [resolveSeoImage(product.image)],
      brand: {
        "@type": "Brand",
        name: product.brand,
      },
      offers: {
        "@type": "Offer",
        url: absoluteUrl(`/producto/${product.slug}`),
        priceCurrency: "MXN",
        price: product.price,
        availability:
          product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      aggregateRating,
      review: reviews.length > 0 ? reviews : undefined,
    },
  ];
}
