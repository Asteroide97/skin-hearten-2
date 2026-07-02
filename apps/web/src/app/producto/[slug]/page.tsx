import type { Metadata } from "next";

import { notFound } from "next/navigation";

import { CheckCircleIcon } from "@/components/shared/icons";
import { SectionHeading } from "@/components/shared/section-heading";
import { EditorialFigure } from "@/components/store/editorial-figure";
import { ProductReviewsSection } from "@/components/store/product-reviews-section";
import { RoutineBuilderTrigger } from "@/components/store/routine-builder-trigger";
import { ProductViewTracker } from "@/components/store/product-view-tracker";
import { formatCurrency } from "@/lib/format";
import { createEmptyProductReviewSummary } from "@/lib/product-reviews";
import { getProductReviews } from "@/lib/product-reviews-api";
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
  benefitCards: Array<{ title: string; description: string; tone: string }>;
  idealFor: string[];
  ingredientCards: Array<{ name: string; effect: string }>;
  notRecommendedIf: string;
  usageTimeline: Array<{ label: string; title: string; description: string }>;
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

  return {
    title: `${product.name} | Skin Hearten`,
    description: product.highlight,
  };
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

  return (
    <div className="product-page mx-auto max-w-[1180px] space-y-12 px-5 py-8 sm:px-6 lg:px-8 lg:space-y-14">
      <ProductViewTracker
        category={product.category}
        price={product.price}
        productId={product.id}
        productName={product.name}
      />

      <section className="grid gap-8 border-b border-stone-200 pb-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <EditorialFigure
            className="min-h-[640px]"
            description={product.highlight}
            frame="portrait"
            label="Producto"
            title={product.name}
            tone="linen"
          />
        </div>

        <div className="space-y-6 lg:pl-4">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">{product.brand}</p>
            <h1 className="font-serif text-[3.1rem] leading-[0.92] text-stone-950 sm:text-[3.9rem]">
              {product.name}
            </h1>
            <p className="max-w-lg text-base leading-8 text-stone-600">{product.highlight}</p>
            <p className="max-w-lg text-sm leading-7 text-stone-500">
              {product.benefits[0] ?? product.description}
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <p className="text-3xl font-semibold text-stone-950">{formatCurrency(product.price)}</p>
            {product.compareAtPrice ? (
              <p className="text-lg text-stone-400 line-through">{formatCurrency(product.compareAtPrice)}</p>
            ) : null}
          </div>

          <p className="text-sm text-stone-600">
            Stock disponible: <span className="font-semibold text-stone-950">{product.stock}</span>
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <RoutineBuilderTrigger
              buttonClassName="btn-primary"
              categoryHint={categoryHint}
              label="Agregar a mi rutina"
              product={product}
              sourceHint={sourceHint}
            />
            <a className="btn-secondary" href="#opiniones">
              Ver opiniones
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]" id="para-quien">
        <div className="space-y-4">
          <SectionHeading
            eyebrow="Para quien es"
            title="Responde primero si este producto si es para ti"
            description="Antes de pensar en una rutina completa, aclara si encaja con lo que tu piel necesita hoy."
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-[#f7efe7] p-6 sm:p-7">
            <p className="section-label">Ideal para...</p>
            <div className="mt-5 grid gap-3">
              {experience.idealFor.map((item) => (
                <div className="flex items-start gap-3 text-sm leading-7 text-stone-700" key={item}>
                  <CheckCircleIcon className="mt-1 h-4 w-4 shrink-0 text-stone-950" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-[2rem] border border-stone-200 bg-white p-6 sm:p-7">
            <p className="section-label">No recomendado si...</p>
            <p className="mt-5 text-sm leading-8 text-stone-600">{experience.notRecommendedIf}</p>
          </article>
        </div>
      </section>

      <section className="space-y-8 border-y border-stone-200 py-10">
        <SectionHeading
          eyebrow="Beneficios"
          title="Lo que deberias sentir cuando si encaja con tu piel"
          description={product.description}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {experience.benefitCards.map((card) => (
            <article className={`rounded-[2rem] p-6 ${card.tone}`} key={card.title}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-300/60 bg-white/70 text-sm font-semibold text-stone-950">
                {card.title.slice(0, 1)}
              </div>
              <h3 className="mt-6 font-serif text-[2rem] leading-[0.96] text-stone-950">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-stone-600">{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-8" id="como-usarlo">
        <SectionHeading
          eyebrow="Como usarlo"
          title="Piensalo como un ritmo simple"
          description="Manana, noche y frecuencia. Nada mas."
        />

        <div className="grid gap-4 md:grid-cols-3">
          {experience.usageTimeline.map((entry, index) => (
            <article className="rounded-[2rem] border border-stone-200 bg-[#fffaf7] p-5 sm:p-6" key={entry.label}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">{entry.label}</p>
              <div className="mt-5 flex h-10 w-10 items-center justify-center rounded-full bg-stone-950 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-5 font-serif text-[2rem] leading-[0.98] text-stone-950">{entry.title}</h3>
              <p className="mt-4 text-sm leading-7 text-stone-600">{entry.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-8">
        <SectionHeading
          eyebrow="Ingredientes"
          title="Que hace cada pieza dentro de la formula"
          description="No necesitas memorizar la lista completa. Solo entender para que esta ahi."
        />

        <div className="grid gap-x-6 gap-y-4 border-t border-stone-200 pt-2 md:grid-cols-2 xl:grid-cols-3">
          {experience.ingredientCards.map((ingredient) => (
            <article className="border-b border-stone-200 py-4" key={ingredient.name}>
              <h3 className="font-serif text-[1.65rem] leading-[1.02] text-stone-950">{ingredient.name}</h3>
              <p className="mt-2 text-sm leading-7 text-stone-600">{ingredient.effect}</p>
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

      <section className="border-t border-stone-200 pt-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Decision final</p>
            <p className="mt-2 font-serif text-[2rem] leading-[0.98] text-stone-950">
              Si es para tu piel, sigue con la rutina.
            </p>
          </div>
          <RoutineBuilderTrigger
            buttonClassName="btn-primary"
            categoryHint={categoryHint}
            label="Agregar a mi rutina"
            product={product}
            sourceHint={sourceHint}
          />
        </div>
      </section>
    </div>
  );
}

function buildProductExperience(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const idealFor = [...product.skinTypes, ...product.concerns].slice(0, 4);
  const notRecommendedIf =
    product.category === "Tratamientos" || product.category === "Serums"
      ? "Tu barrera esta muy sensibilizada o quieres usar demasiados activos al mismo tiempo. Mejor entra poco a poco y con constancia."
      : product.category === "Protector Solar"
        ? "Esperas que un solo paso corrija tono o firmeza. Aqui protege muy bien, pero funciona mejor dentro de una rutina completa."
        : "Buscas un cambio inmediato sin sostener manana y noche. Esta formula se luce mas cuando la rutina se vuelve estable.";

  return {
    benefitCards: buildBenefitCards(product),
    idealFor,
    ingredientCards: product.ingredients.map((ingredient) => ({
      name: ingredient,
      effect: ingredientGlossary[ingredient] ?? `${ingredient} acompana la formula sin volver la rutina mas pesada de lo necesario.`,
    })),
    notRecommendedIf,
    usageTimeline: buildUsageTimeline(product),
  } satisfies ProductExperience;
}

function buildBenefitCards(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>) {
  const concern = product.concerns[0]?.toLowerCase() ?? "uniformidad";

  if (product.category === "Limpiadores") {
    return [
      {
        title: "Limpia",
        description: "Retira residuos y exceso sin dejar a la piel tirante ni incomoda.",
        tone: "bg-[#f7efe7]",
      },
      {
        title: "Calma",
        description: "Hace que la limpieza se sienta suave desde el primer contacto.",
        tone: "bg-white",
      },
      {
        title: "Respeta",
        description: "Mantiene la barrera mas tranquila para que lo que sigue se tolere mejor.",
        tone: "bg-[#fbf4ec]",
      },
      {
        title: "Prepara",
        description: `Deja la piel lista para trabajar ${concern} con mas constancia.`,
        tone: "bg-[#f3e8de]",
      },
    ];
  }

  if (product.category === "Protector Solar") {
    return [
      {
        title: "Protege",
        description: "Cierra la rutina con defensa diaria frente al sol.",
        tone: "bg-[#f7efe7]",
      },
      {
        title: "Previene",
        description: "Ayuda a que manchas y sensibilidad no se intensifiquen tan facil.",
        tone: "bg-white",
      },
      {
        title: "Acompana",
        description: "Se reaplica con mas facilidad cuando la textura no pesa.",
        tone: "bg-[#fbf4ec]",
      },
      {
        title: "Sostiene",
        description: "Convierte el tratamiento previo en un esfuerzo que vale la pena proteger.",
        tone: "bg-[#f3e8de]",
      },
    ];
  }

  if (product.category === "Hidratantes") {
    return [
      {
        title: "Hidrata",
        description: "Deja una sensacion mas flexible y menos tirante desde las primeras aplicaciones.",
        tone: "bg-[#f7efe7]",
      },
      {
        title: "Sella",
        description: "Ayuda a que el resto de la rutina no se evapore demasiado rapido.",
        tone: "bg-white",
      },
      {
        title: "Conforta",
        description: "Hace que la piel se sienta mas arropada sin perder elegancia en la textura.",
        tone: "bg-[#fbf4ec]",
      },
      {
        title: "Suaviza",
        description: "Con constancia, la piel suele verse mas lisa y descansada.",
        tone: "bg-[#f3e8de]",
      },
    ];
  }

  return [
    {
      title: "Uniforma",
      description: `Trabaja ${concern} con una formula pensada para sostenerse mejor en el tiempo.`,
      tone: "bg-[#f7efe7]",
    },
    {
      title: "Suaviza",
      description: "La textura suele verse mas pulida cuando la rutina se vuelve constante.",
      tone: "bg-white",
    },
    {
      title: "Acompana",
      description: "No busca impresionar en una noche. Busca que si quieras seguir usandolo.",
      tone: "bg-[#fbf4ec]",
    },
    {
      title: "Equilibra",
      description: "Ayuda a que la piel se sienta tratada sin entrar en exceso.",
      tone: "bg-[#f3e8de]",
    },
  ];
}

function buildUsageTimeline(
  product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>,
) {
  const usageText = product.usage.join(" ").toLowerCase();
  const frequency =
    usageText.includes("alternados")
      ? "Empieza en dias alternados y sube cuando la piel se vea comoda."
      : usageText.includes("2 a 3")
        ? "Dos a tres veces por semana al principio, luego segun tolerancia."
        : usageText.includes("dia y de noche")
          ? "Manana y noche, como parte de una rutina estable."
          : usageText.includes("cada 2 a 3 horas")
            ? "Reaplicalo durante el dia cada vez que la exposicion lo pida."
            : "Manten una frecuencia constante para que el cambio no dependa de impulsos.";

  const morning =
    product.category === "Protector Solar"
      ? "Ultimo paso de cada manana, antes de salir."
      : product.category === "Tratamientos"
        ? "Solo si tu piel ya lo tolera y siempre seguido de protector solar."
        : product.category === "Serums"
          ? "Despues de limpiar y antes de la crema, si tu piel lo recibe bien."
          : product.usage[0];

  const night =
    product.category === "Protector Solar"
      ? "Por la noche ya no hace falta. Cambia a limpieza, tratamiento e hidratacion."
      : product.category === "Limpiadores"
        ? "Repite el gesto para retirar el dia sin resecar de mas."
        : product.usage[1] ?? product.usage[0];

  return [
    {
      label: "Manana",
      title: "Empieza ligera",
      description: morning,
    },
    {
      label: "Noche",
      title: "Trabaja sin prisa",
      description: night,
    },
    {
      label: "Frecuencia",
      title: "Constancia antes que intensidad",
      description: frequency,
    },
  ];
}
