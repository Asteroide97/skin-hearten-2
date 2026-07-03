import { getProductBySlug as getFallbackProductBySlug, products as fallbackProducts } from "@/lib/site-data";
import type { Product } from "@/lib/types";

export type RoutineSource = "product" | "category" | "skin_quiz";

export type RoutineLinkedProduct = {
  id: number;
  productId: number | string;
  productName: string;
  productSlug: string;
  isPrimary: boolean;
  priority: number;
};

export type RoutineStep = {
  id: number;
  order: number;
  productId: number | string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  productBenefit: string | null;
  productGradient: string | null;
  productPrice: number | null;
  title: string;
  shortDescription: string;
  image: string | null;
  badge: string | null;
};

export type Routine = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  image: string | null;
  color: string | null;
  goalKey: string | null;
  categoryKey: string | null;
  steps: RoutineStep[];
  linkedProducts: RoutineLinkedProduct[];
};

export type RoutineResolveData = {
  routine: Routine | null;
  matchedBy: string | null;
};

export type AdminRoutineStepInput = {
  order: number;
  productId: number;
  title: string;
  shortDescription: string;
  image: string | null;
  badge: string | null;
};

export type AdminRoutineLinkedProductInput = {
  productId: number;
  isPrimary: boolean;
  priority: number;
};

export type AdminRoutineWriteInput = {
  name: string;
  description: string | null;
  isActive: boolean;
  image: string | null;
  color: string | null;
  goalKey: string | null;
  categoryKey: string | null;
  steps: AdminRoutineStepInput[];
  linkedProducts: AdminRoutineLinkedProductInput[];
};

type RoutineTemplate = {
  id: number;
  name: string;
  slug: string;
  description: string;
  goalKey: string | null;
  categoryKey: string | null;
  color: string;
  linkedProducts: Array<{ productSlug: string; isPrimary: boolean; priority: number }>;
  steps: Array<{
    order: number;
    productSlug: string;
    title: string;
    shortDescription: string;
    badge: string | null;
  }>;
};

const fallbackRoutineTemplates: RoutineTemplate[] = [
  {
    id: 1,
    name: "Rutina Firmeza Esencial",
    slug: "rutina-firmeza-esencial",
    description: "Una secuencia corta para firmeza, textura y luminosidad diaria.",
    goalKey: "lineas_expresion",
    categoryKey: "serums",
    color: "#EFDCCF",
    linkedProducts: [
      { productSlug: "serum-renovador-peptidos", isPrimary: true, priority: 0 },
      { productSlug: "gel-limpiador-barrera", isPrimary: false, priority: 1 },
      { productSlug: "crema-firmeza-ceramidas", isPrimary: false, priority: 2 },
      { productSlug: "protector-solar-seda-fps50", isPrimary: false, priority: 3 },
    ],
    steps: [
      {
        order: 1,
        productSlug: "gel-limpiador-barrera",
        title: "Preparar la piel",
        shortDescription: "Limpieza suave para que el tratamiento se sienta mas amable.",
        badge: "Paso 1",
      },
      {
        order: 2,
        productSlug: "serum-renovador-peptidos",
        title: "Tratamiento clave",
        shortDescription: "Peptidos y antioxidantes para una piel mas lisa y luminosa.",
        badge: "Producto actual",
      },
      {
        order: 3,
        productSlug: "crema-firmeza-ceramidas",
        title: "Sellar confort",
        shortDescription: "Ceramidas para sostener elasticidad y confort visible.",
        badge: "Paso 3",
      },
      {
        order: 4,
        productSlug: "protector-solar-seda-fps50",
        title: "Proteger el avance",
        shortDescription: "Proteccion diaria para cuidar tono, firmeza y textura.",
        badge: "AM",
      },
    ],
  },
  {
    id: 2,
    name: "Rutina Tono Uniforme",
    slug: "rutina-tono-uniforme",
    description: "Pensada para manchas, tono desigual y proteccion constante.",
    goalKey: "manchas",
    categoryKey: "tratamientos",
    color: "#F4E7D7",
    linkedProducts: [
      { productSlug: "tratamiento-nocturno-manchas", isPrimary: true, priority: 0 },
      { productSlug: "protector-solar-seda-fps50", isPrimary: false, priority: 1 },
      { productSlug: "gel-limpiador-barrera", isPrimary: false, priority: 2 },
      { productSlug: "crema-firmeza-ceramidas", isPrimary: false, priority: 3 },
      { productSlug: "serum-renovador-peptidos", isPrimary: false, priority: 4 },
    ],
    steps: [
      {
        order: 1,
        productSlug: "gel-limpiador-barrera",
        title: "Base limpia",
        shortDescription: "Prepara la piel sin resecar ni irritar de mas.",
        badge: "Paso 1",
      },
      {
        order: 2,
        productSlug: "tratamiento-nocturno-manchas",
        title: "Correccion nocturna",
        shortDescription: "Activos renovadores para refinar textura y tono.",
        badge: "Paso 2",
      },
      {
        order: 3,
        productSlug: "crema-firmeza-ceramidas",
        title: "Soporte de barrera",
        shortDescription: "Ayuda a tolerar mejor el uso continuo del tratamiento.",
        badge: "Paso 3",
      },
      {
        order: 4,
        productSlug: "protector-solar-seda-fps50",
        title: "Proteccion diaria",
        shortDescription: "El paso que sostiene el trabajo sobre manchas.",
        badge: "Imprescindible",
      },
    ],
  },
  {
    id: 3,
    name: "Rutina Balance Acne Adulto",
    slug: "rutina-balance-acne-adulto",
    description: "Una rutina ligera para brotes, poros y marcas recientes.",
    goalKey: "acne",
    categoryKey: "tratamientos",
    color: "#EEE7DE",
    linkedProducts: [
      { productSlug: "serum-balance-bha-niacinamida", isPrimary: true, priority: 0 },
      { productSlug: "gel-limpiador-barrera", isPrimary: false, priority: 1 },
      { productSlug: "bruma-hidratante-esencia", isPrimary: false, priority: 2 },
      { productSlug: "protector-solar-seda-fps50", isPrimary: false, priority: 3 },
    ],
    steps: [
      {
        order: 1,
        productSlug: "gel-limpiador-barrera",
        title: "Limpieza amable",
        shortDescription: "Retira residuos sin dejar la piel tirante.",
        badge: "Paso 1",
      },
      {
        order: 2,
        productSlug: "serum-balance-bha-niacinamida",
        title: "Tratamiento ligero",
        shortDescription: "BHA y niacinamida para textura, brillo y poros visibles.",
        badge: "Producto actual",
      },
      {
        order: 3,
        productSlug: "bruma-hidratante-esencia",
        title: "Hidratacion sin peso",
        shortDescription: "Mantiene confort sin sentir la rutina densa.",
        badge: "Paso 3",
      },
      {
        order: 4,
        productSlug: "protector-solar-seda-fps50",
        title: "Proteccion diaria",
        shortDescription: "Ayuda a cuidar la piel y a evitar marcas mas visibles.",
        badge: "AM",
      },
    ],
  },
];

function getFallbackProduct(slug: string) {
  return getFallbackProductBySlug(slug) ?? null;
}

function normalizeRouteToken(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function slugify(value: string | null | undefined) {
  return normalizeRouteToken(value).replace(/\s+/g, "-");
}

function productImageValue(product: Product) {
  return product.image ?? product.images[0] ?? null;
}

function buildFallbackRoutine(template: RoutineTemplate): Routine {
  const linkedProducts = template.linkedProducts
    .map((link, index) => {
      const product = getFallbackProduct(link.productSlug);
      if (!product) {
        return null;
      }

      return {
        id: template.id * 100 + index + 1,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        isPrimary: link.isPrimary,
        priority: link.priority,
      } satisfies RoutineLinkedProduct;
    })
    .filter((entry) => entry !== null) as RoutineLinkedProduct[];

  const steps = template.steps
    .map((step, index) => {
      const product = getFallbackProduct(step.productSlug);
      if (!product) {
        return null;
      }

      return {
        id: template.id * 1000 + index + 1,
        order: step.order,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        productImage: productImageValue(product),
        productBenefit: product.highlight ?? product.benefits[0] ?? null,
        productGradient: product.gradient ?? null,
        productPrice: product.price,
        title: step.title,
        shortDescription: step.shortDescription,
        image: productImageValue(product),
        badge: step.badge,
      } satisfies RoutineStep;
    })
    .filter((entry) => entry !== null) as RoutineStep[];

  return {
    id: template.id,
    name: template.name,
    slug: template.slug,
    description: template.description,
    isActive: true,
    image: null,
    color: template.color,
    goalKey: template.goalKey,
    categoryKey: template.categoryKey,
    linkedProducts,
    steps,
  };
}

export function getFallbackRoutines() {
  return fallbackRoutineTemplates.map(buildFallbackRoutine);
}

export function resolveFallbackRoutine(params: {
  productRef: string;
  goal?: string | null;
  category?: string | null;
  source?: RoutineSource;
}): RoutineResolveData {
  const source = params.source ?? "product";
  const product = fallbackProducts.find(
    (entry) => entry.slug === params.productRef || String(entry.id) === params.productRef,
  );

  if (!product) {
    return {
      routine: null,
      matchedBy: null,
    };
  }

  const routines = getFallbackRoutines().filter((routine) => {
    return (
      routine.linkedProducts.some((link) => String(link.productId) === String(product.id)) ||
      routine.steps.some((step) => String(step.productId) === String(product.id))
    );
  });

  if (routines.length === 0) {
    return {
      routine: null,
      matchedBy: null,
    };
  }

  const goal = normalizeRouteToken(params.goal);
  const category = slugify(params.category);

  const selected = [...routines].sort((left, right) => {
    const scoreRoutine = (routine: Routine) => {
      const link = routine.linkedProducts.find((entry) => String(entry.productId) === String(product.id));
      const isPrimary = link?.isPrimary ? 1 : 0;
      const priority = -(link?.priority ?? 999);
      const goalMatch = goal && normalizeRouteToken(routine.goalKey) === goal ? 1 : 0;
      const categoryMatch = category && slugify(routine.categoryKey) === category ? 1 : 0;

      if (source === "skin_quiz") {
        return [goalMatch, isPrimary, categoryMatch, priority];
      }
      if (source === "category") {
        return [categoryMatch, isPrimary, goalMatch, priority];
      }

      return [isPrimary, goalMatch, categoryMatch, priority];
    };

    const [rightA, rightB, rightC, rightD] = scoreRoutine(right);
    const [leftA, leftB, leftC, leftD] = scoreRoutine(left);
    return (
      rightA - leftA || rightB - leftB || rightC - leftC || rightD - leftD
    );
  })[0];

  const primaryLink = selected.linkedProducts.find((entry) => String(entry.productId) === String(product.id));
  const goalMatch = goal.length > 0 && normalizeRouteToken(selected.goalKey) === goal;
  const categoryMatch = category.length > 0 && slugify(selected.categoryKey) === category;

  return {
    routine: selected,
    matchedBy:
      source === "skin_quiz" && goalMatch
        ? "goal"
        : source === "category" && categoryMatch
          ? "category"
          : primaryLink?.isPrimary
            ? "primary_product"
            : goalMatch
              ? "goal"
              : categoryMatch
                ? "category"
                : "linked_product",
  };
}
