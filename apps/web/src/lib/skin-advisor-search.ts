import { blogPosts } from "@/lib/site-data";
import { getFallbackRoutines } from "@/lib/routines";
import type { Product } from "@/lib/types";

export type AdvisorSearchResultKind =
  | "problema"
  | "ingrediente"
  | "rutina"
  | "producto"
  | "articulo";

export type AdvisorSearchResult = {
  id: string;
  kind: AdvisorSearchResultKind;
  title: string;
  description: string;
  href: string;
  meta?: string;
};

export type AdvisorSearchPrompt = {
  label: string;
  query: string;
};

export type AdvisorSearchExperience = {
  articleResults: AdvisorSearchResult[];
  fallbackPrompts: AdvisorSearchPrompt[];
  ingredientResults: AdvisorSearchResult[];
  intro: string;
  isEmpty: boolean;
  problemResults: AdvisorSearchResult[];
  productResults: AdvisorSearchResult[];
  routineResults: AdvisorSearchResult[];
  topHref: string;
};

export type AdvisorCatalogIntent = {
  category: string | null;
  concern: string | null;
  query: string;
};

type ProblemDefinition = {
  aliases: string[];
  articleKeywords: string[];
  description: string;
  href: string;
  id: string;
  keywords: string[];
  productCategory?: string;
  routineLabel: string;
  title: string;
};

type IngredientDefinition = {
  aliases: string[];
  description: string;
  id: string;
  name: string;
};

const problemDefinitions: ProblemDefinition[] = [
  {
    id: "manchas",
    title: "Manchas",
    aliases: ["manchas", "pigmentacion", "tono desigual", "melasma"],
    keywords: ["manchas", "fotoenvejecimiento", "tono desigual", "pigmentacion"],
    articleKeywords: ["manchas", "protector solar", "tono"],
    description: "Empieza por una rutina que corrija tono y sostenga proteccion diaria.",
    href: "/productos?problema=Manchas",
    routineLabel: "Rutina para manchas",
  },
  {
    id: "hidratacion",
    title: "Piel seca",
    aliases: ["piel seca", "seca", "hidratacion", "deshidratacion", "tirantez"],
    keywords: ["deshidratacion", "seca", "hidratacion", "tirantez", "barrera"],
    articleKeywords: ["hidratacion", "barrera", "piel madura"],
    description: "Lo primero es recuperar confort, capas ligeras y una barrera mas estable.",
    href: "/productos?problema=Deshidratacion",
    routineLabel: "Rutina de hidratacion",
  },
  {
    id: "sensible",
    title: "Piel sensible",
    aliases: ["piel sensible", "sensible", "sensibilidad", "reactiva", "rojeces"],
    keywords: ["sensible", "sensibilidad", "rojeces", "calma"],
    articleKeywords: ["barrera", "suave", "rutina"],
    description: "Conviene priorizar limpieza amable, barrera y formulas faciles de tolerar.",
    href: "/productos?problema=Sensibilidad",
    routineLabel: "Rutina para piel sensible",
  },
  {
    id: "acne",
    title: "Acne",
    aliases: ["acne", "brotes", "poros", "grasa", "piel grasa"],
    keywords: ["acne", "brotes", "poros", "textura", "grasa"],
    articleKeywords: ["niacinamida", "rutina", "textura"],
    description: "La clave es una rutina ligera, constante y enfocada en textura y brotes.",
    href: "/productos?problema=Acne",
    routineLabel: "Rutina para acne",
  },
  {
    id: "antiedad",
    title: "Antiedad",
    aliases: ["antiedad", "arrugas", "lineas", "lineas finas", "piel madura"],
    keywords: ["firmeza", "lineas", "arrugas", "textura", "madura"],
    articleKeywords: ["piel madura", "peptidos", "rutina"],
    description: "Empieza por firmeza, soporte de barrera y proteccion diaria sostenida.",
    href: "/productos?problema=Firmeza",
    routineLabel: "Rutina antiedad",
  },
  {
    id: "protector_solar",
    title: "Protector solar",
    aliases: ["protector solar", "fps", "solar", "sol"],
    keywords: ["protector solar", "fps", "fotoenvejecimiento", "manchas"],
    articleKeywords: ["protector solar", "reaplicar", "texturas"],
    description: "Busca proteccion elegante, facil de reaplicar y que si quieras usar diario.",
    href: "/productos?categoria=protector-solar",
    productCategory: "protector solar",
    routineLabel: "Rutina con protector solar",
  },
];

const ingredientDefinitions: IngredientDefinition[] = [
  {
    id: "niacinamida",
    name: "Niacinamida",
    aliases: ["niacinamida"],
    description: "Ayuda a equilibrar tono, poros visibles y soporte de barrera sin sentirse agresiva.",
  },
  {
    id: "peptidos",
    name: "Peptidos",
    aliases: ["peptidos", "peptido"],
    description: "Acompañan firmeza visual y una textura mas lisa con uso constante.",
  },
  {
    id: "ceramidas",
    name: "Ceramidas",
    aliases: ["ceramidas", "ceramida"],
    description: "Refuerzan la barrera para retener mejor hidratacion y confort.",
  },
  {
    id: "bha",
    name: "BHA",
    aliases: ["bha", "salicilico"],
    description: "Se enfoca en textura, poros y brotes cuando la piel necesita limpieza mas precisa.",
  },
  {
    id: "acido-mandelico",
    name: "Acido mandelico",
    aliases: ["mandelico", "acido mandelico"],
    description: "Trabaja tono y textura con una exfoliacion mas gradual que otras opciones.",
  },
  {
    id: "pantenol",
    name: "Pantenol",
    aliases: ["pantenol"],
    description: "Ayuda a que la piel se sienta mas calmada y menos reactiva.",
  },
  {
    id: "escualano",
    name: "Escualano",
    aliases: ["escualano"],
    description: "Suaviza y deja una sensacion flexible sin volver pesada la rutina.",
  },
  {
    id: "filtros-fotoestables",
    name: "Filtros fotoestables",
    aliases: ["filtros", "filtros fotoestables"],
    description: "Protegen frente al sol para que manchas y sensibilidad no se intensifiquen.",
  },
];

export const advisorSearchPrompts: AdvisorSearchPrompt[] = [
  { label: "Tengo manchas", query: "manchas" },
  { label: "Mi piel es sensible", query: "piel sensible" },
  { label: "Quiero una rutina", query: "quiero una rutina" },
  { label: "Protector solar", query: "protector solar" },
  { label: "Acne", query: "acne" },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function includesLoosely(source: string, candidate: string) {
  return source.includes(candidate) || candidate.includes(source);
}

function findMatchedProblems(query: string) {
  const matches = problemDefinitions.filter((problem) =>
    problem.aliases.some((alias) => includesLoosely(query, normalizeText(alias))),
  );

  const ageMatch = query.match(/\b(\d{2})\b/);
  if (ageMatch) {
    const age = Number(ageMatch[1]);
    if (age >= 35 && !matches.some((problem) => problem.id === "antiedad")) {
      const antiagingProblem = problemDefinitions.find((problem) => problem.id === "antiedad");
      if (antiagingProblem) {
        matches.push(antiagingProblem);
      }
    }
  }

  return matches;
}

function findMatchedIngredient(query: string) {
  return ingredientDefinitions.find((ingredient) =>
    ingredient.aliases.some((alias) => includesLoosely(query, normalizeText(alias))),
  ) ?? null;
}

function getRoutineHref(goalKey: string | null, categoryKey: string | null) {
  switch (goalKey) {
    case "manchas":
      return "/productos?problema=Manchas";
    case "acne":
      return "/productos?problema=Acne";
    case "lineas_expresion":
      return "/productos?problema=Firmeza";
    case "hidratacion":
      return "/productos?problema=Deshidratacion";
    case "proteccion_solar":
      return "/productos?categoria=protector-solar";
    default:
      break;
  }

  if (categoryKey === "protector-solar") {
    return "/productos?categoria=protector-solar";
  }

  return "/productos";
}

function buildProblemResults(matchedProblems: ProblemDefinition[]): AdvisorSearchResult[] {
  return matchedProblems.slice(0, 2).map((problem) => ({
    id: `problem-${problem.id}`,
    kind: "problema",
    title: problem.title,
    description: problem.description,
    href: problem.href,
  }));
}

function buildIngredientResults(
  matchedIngredient: IngredientDefinition | null,
  products: Product[],
): AdvisorSearchResult[] {
  if (!matchedIngredient) {
    return [];
  }

  const productCount = products.filter((product) =>
    product.ingredients.some((ingredient) => normalizeText(ingredient) === normalizeText(matchedIngredient.name)),
  ).length;

  return [
    {
      id: `ingredient-${matchedIngredient.id}`,
      kind: "ingrediente",
      title: matchedIngredient.name,
      description: matchedIngredient.description,
      href: `/productos?q=${encodeURIComponent(matchedIngredient.name)}`,
      meta: `${productCount} ${productCount === 1 ? "producto" : "productos"}`,
    },
  ];
}

function buildRoutineResults(
  query: string,
  matchedProblems: ProblemDefinition[],
): AdvisorSearchResult[] {
  const routines = getFallbackRoutines();
  const wantsRoutine = query.includes("rutina");

  const scored = routines
    .map((routine) => {
      let score = 0;

      matchedProblems.forEach((problem) => {
        if (
          (problem.id === "manchas" && routine.goalKey === "manchas") ||
          (problem.id === "acne" && routine.goalKey === "acne") ||
          (problem.id === "antiedad" && routine.goalKey === "lineas_expresion") ||
          (problem.id === "hidratacion" && routine.goalKey === "hidratacion") ||
          (problem.id === "protector_solar" && routine.categoryKey === "protector-solar") ||
          (problem.id === "sensible" && routine.steps.some((step) => normalizeText(step.shortDescription).includes("amable")))
        ) {
          score += 12;
        }
      });

      if (wantsRoutine) {
        score += 8;
      }

      const haystack = normalizeText(
        [routine.name, routine.description ?? "", routine.goalKey ?? "", routine.categoryKey ?? ""].join(" "),
      );
      if (query && haystack.includes(query)) {
        score += 6;
      }

      return {
        routine,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return scored.map(({ routine }) => {
    const linkedProblem = matchedProblems.find((problem) => {
      if (problem.id === "manchas") {
        return routine.goalKey === "manchas";
      }
      if (problem.id === "acne") {
        return routine.goalKey === "acne";
      }
      if (problem.id === "antiedad") {
        return routine.goalKey === "lineas_expresion";
      }
      if (problem.id === "hidratacion") {
        return routine.goalKey === "hidratacion";
      }
      if (problem.id === "protector_solar") {
        return routine.categoryKey === "protector-solar";
      }
      return false;
    });

    return {
      id: `routine-${routine.id}`,
      kind: "rutina",
      title: linkedProblem?.routineLabel ?? routine.name,
      description: routine.description ?? "Una secuencia breve para entender que paso sigue.",
      href: linkedProblem?.href ?? getRoutineHref(routine.goalKey, routine.categoryKey),
      meta: `${routine.steps.length} pasos`,
    } satisfies AdvisorSearchResult;
  });
}

function getProblemProductScore(product: Product, problem: ProblemDefinition) {
  const haystack = normalizeText(
    [product.category, product.highlight, ...product.concerns, ...product.skinTypes, ...product.ingredients].join(" "),
  );

  let score = 0;
  problem.keywords.forEach((keyword) => {
    if (haystack.includes(normalizeText(keyword))) {
      score += 5;
    }
  });

  if (problem.productCategory && normalizeText(product.category) === normalizeText(problem.productCategory)) {
    score += 6;
  }

  return score;
}

function buildProductResults(
  query: string,
  matchedProblems: ProblemDefinition[],
  matchedIngredient: IngredientDefinition | null,
  products: Product[],
): AdvisorSearchResult[] {
  const scored = products
    .map((product) => {
      let score = 0;
      const haystack = normalizeText(
        [
          product.name,
          product.brand,
          product.category,
          product.highlight,
          product.description,
          ...product.concerns,
          ...product.skinTypes,
          ...product.ingredients,
        ].join(" "),
      );

      if (query && haystack.includes(query)) {
        score += 8;
      }

      matchedProblems.forEach((problem) => {
        score += getProblemProductScore(product, problem);
      });

      if (
        matchedIngredient &&
        product.ingredients.some((ingredient) => normalizeText(ingredient) === normalizeText(matchedIngredient.name))
      ) {
        score += 18;
      }

      if (product.bestSeller) {
        score += 3;
      }

      if (product.featured) {
        score += 2;
      }

      score += Math.round(product.rating);

      return {
        product,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 4);

  return scored.map(({ product }) => ({
    id: `product-${product.id}`,
    kind: "producto",
    title: product.name,
    description: product.highlight,
    href: `/producto/${product.slug}`,
    meta: product.category,
  }));
}

function buildArticleResults(
  query: string,
  matchedProblems: ProblemDefinition[],
  matchedIngredient: IngredientDefinition | null,
) {
  const scored = blogPosts
    .map((post) => {
      let score = 0;
      const haystack = normalizeText([post.title, post.excerpt, ...post.content].join(" "));

      if (query && haystack.includes(query)) {
        score += 8;
      }

      matchedProblems.forEach((problem) => {
        problem.articleKeywords.forEach((keyword) => {
          if (haystack.includes(normalizeText(keyword))) {
            score += 4;
          }
        });
      });

      if (matchedIngredient && haystack.includes(normalizeText(matchedIngredient.name))) {
        score += 10;
      }

      return {
        post,
        score,
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, 3);

  return scored.map(({ post }) => ({
    id: `article-${post.id}`,
    kind: "articulo",
    title: post.title,
    description: post.excerpt,
    href: `/blog/${post.slug}`,
    meta: post.publishedAt,
  })) satisfies AdvisorSearchResult[];
}

function buildIntro(query: string, matchedProblems: ProblemDefinition[], matchedIngredient: IngredientDefinition | null) {
  if (matchedProblems[0]) {
    return `Estas buscando una solucion para ${matchedProblems[0].title.toLowerCase()}.`;
  }

  if (matchedIngredient) {
    return `Estas explorando ${matchedIngredient.name.toLowerCase()} y como entra en una rutina.`;
  }

  if (query.includes("rutina")) {
    return "Empecemos por una rutina, no por una lista de productos.";
  }

  return "Cuentanos que quieres mejorar y te acercamos una ruta clara.";
}

function getCatalogFiltersFromProblem(problem: ProblemDefinition | undefined) {
  if (!problem) {
    return {
      category: null,
      concern: null,
    };
  }

  switch (problem.id) {
    case "manchas":
      return { category: null, concern: "Manchas" };
    case "hidratacion":
      return { category: null, concern: "Deshidratacion" };
    case "sensible":
      return { category: null, concern: "Sensibilidad" };
    case "acne":
      return { category: null, concern: "Acne" };
    case "antiedad":
      return { category: null, concern: "Firmeza" };
    case "protector_solar":
      return { category: "protector-solar", concern: null };
    default:
      return {
        category: null,
        concern: null,
      };
  }
}

export function inferCatalogIntentFromSearch(rawQuery: string): AdvisorCatalogIntent {
  const query = rawQuery.trim();
  const normalizedQuery = normalizeText(query);
  const matchedProblem = findMatchedProblems(normalizedQuery)[0];
  const filters = getCatalogFiltersFromProblem(matchedProblem);

  return {
    category: filters.category,
    concern: filters.concern,
    query,
  };
}

export function buildAdvisorCatalogHref(rawQuery: string) {
  const intent = inferCatalogIntentFromSearch(rawQuery);
  const params = new URLSearchParams();

  if (intent.query) {
    params.set("q", intent.query);
  }

  if (intent.category) {
    params.set("categoria", intent.category);
  }

  if (intent.concern) {
    params.set("problema", intent.concern);
  }

  const queryString = params.toString();
  return queryString ? `/productos?${queryString}` : "/productos";
}

export function buildAdvisorSearchExperience(
  rawQuery: string,
  products: Product[],
): AdvisorSearchExperience {
  const query = normalizeText(rawQuery);

  if (!query) {
    return {
      articleResults: [],
      fallbackPrompts: advisorSearchPrompts,
      ingredientResults: [],
      intro: "Cuentanos que quieres mejorar.",
      isEmpty: false,
      problemResults: [],
      productResults: [],
      routineResults: [],
      topHref: "/productos",
    };
  }

  const matchedProblems = findMatchedProblems(query);
  const matchedIngredient = findMatchedIngredient(query);
  const problemResults = buildProblemResults(matchedProblems);
  const ingredientResults = buildIngredientResults(matchedIngredient, products);
  const routineResults = buildRoutineResults(query, matchedProblems);
  const productResults = buildProductResults(query, matchedProblems, matchedIngredient, products);
  const articleResults = buildArticleResults(query, matchedProblems, matchedIngredient);
  const isEmpty =
    problemResults.length === 0 &&
    ingredientResults.length === 0 &&
    routineResults.length === 0 &&
    productResults.length === 0 &&
    articleResults.length === 0;

  const topHref = buildAdvisorCatalogHref(rawQuery);

  return {
    articleResults,
    fallbackPrompts: advisorSearchPrompts,
    ingredientResults,
    intro: buildIntro(query, matchedProblems, matchedIngredient),
    isEmpty,
    problemResults,
    productResults,
    routineResults,
    topHref,
  };
}
