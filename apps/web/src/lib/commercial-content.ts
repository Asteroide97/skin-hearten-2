export type CommercialNavigationType = "url" | "category" | "collection" | "skin_quiz" | "page" | "routine";
export type CommercialActionType =
  | CommercialNavigationType
  | "search"
  | "product";

export type CommercialNavItem = {
  id?: number | null;
  name: string;
  order: number;
  active: boolean;
  type: CommercialNavigationType;
  value: string;
};

export type CommercialQuickLink = {
  id?: number | null;
  name: string;
  icon?: string | null;
  order: number;
  active: boolean;
  action: CommercialActionType;
  value: string;
};

export type CommercialActionConfig = {
  label: string;
  type: CommercialActionType;
  value: string;
};

export type CommercialHero = {
  title: string;
  subtitle?: string | null;
  primaryButton: CommercialActionConfig;
  secondaryButton: CommercialActionConfig;
  tertiaryButton?: CommercialActionConfig | null;
  image?: string | null;
  video?: string | null;
  backgroundColor?: string | null;
  isVisible: boolean;
  trustSignals: string[];
};

export type CommercialSection = {
  id?: number | null;
  key: string;
  eyebrow?: string | null;
  title: string;
  description?: string | null;
  ctaLabel?: string | null;
  ctaType?: CommercialActionType | null;
  ctaValue?: string | null;
  order: number;
  active: boolean;
};

export type CommercialBanner = {
  id?: number | null;
  key: string;
  title: string;
  message?: string | null;
  value?: string | null;
  order: number;
  active: boolean;
};

export type CommercialFooterLink = {
  label: string;
  type: CommercialActionType;
  value: string;
};

export type CommercialFooterColumn = {
  title: string;
  links: CommercialFooterLink[];
};

export type CommercialSocialLink = {
  label: string;
  url: string;
};

export type CommercialHeader = {
  logoText: string;
  logoImage?: string | null;
  topLeftText?: string | null;
  topRightText?: string | null;
  supportWhatsAppUrl?: string | null;
};

export type CommercialFooter = {
  introText?: string | null;
  contactLines: string[];
  columns: CommercialFooterColumn[];
  legalLinks: CommercialFooterLink[];
  socialLinks: CommercialSocialLink[];
  noticeText?: string | null;
};

export type CommercialRoutineGuideStep = {
  eyebrow: string;
  title: string;
  description: string;
};

export type CommercialSciencePoint = {
  eyebrow: string;
  title: string;
  description: string;
};

export type CommercialHomeTestimonial = {
  name: string;
  city: string;
  rating: number;
  text: string;
};

export type CommercialContent = {
  storeKey: string;
  header: CommercialHeader;
  navigation: CommercialNavItem[];
  quickLinks: CommercialQuickLink[];
  hero: CommercialHero;
  sections: CommercialSection[];
  banners: CommercialBanner[];
  footer: CommercialFooter;
  routineGuideSteps: CommercialRoutineGuideStep[];
  sciencePoints: CommercialSciencePoint[];
  homeTestimonials: CommercialHomeTestimonial[];
};

export function getDefaultCommercialContent(): CommercialContent {
  return {
    storeKey: "default",
    header: {
      logoText: "Skin Hearten",
      logoImage: null,
      topLeftText: "Skincare curado para rutinas mas claras.",
      topRightText: "Compra tranquila y enfoque en conversion real.",
      supportWhatsAppUrl: null,
    },
    navigation: [
      { name: "Mas Vendidos", order: 0, active: true, type: "collection", value: "best-sellers" },
      { name: "OFERTA", order: 1, active: true, type: "collection", value: "offers" },
      { name: "Productos", order: 2, active: true, type: "page", value: "productos" },
      { name: "Kits y Duos", order: 3, active: true, type: "url", value: "/productos?q=kit" },
      { name: "Tipo de Piel", order: 4, active: true, type: "page", value: "productos" },
      { name: "Blog", order: 5, active: true, type: "page", value: "blog" },
      { name: "Cuenta", order: 6, active: true, type: "page", value: "cuenta" },
    ],
    quickLinks: [
      { name: "Diagnostico en 2 minutos", icon: "Q", order: 0, active: true, action: "skin_quiz", value: "home" },
      { name: "Tengo manchas", icon: "M", order: 1, active: true, action: "search", value: "manchas" },
      { name: "Mi piel es sensible", icon: "~", order: 2, active: true, action: "search", value: "piel sensible" },
      { name: "Quiero una rutina", icon: "R", order: 3, active: true, action: "search", value: "quiero una rutina" },
      { name: "Protector solar", icon: "SPF", order: 4, active: true, action: "category", value: "protector-solar" },
      { name: "Acne", icon: "A", order: 5, active: true, action: "search", value: "acne" },
      { name: "Anti-edad", icon: "+", order: 6, active: true, action: "url", value: "/productos?problema=Firmeza" },
    ],
    hero: {
      title: "Tu piel no necesita mas productos. Necesita direccion.",
      subtitle: "Empezamos por lo que quieres mejorar. Despues construimos una rutina que si quieras seguir.",
      primaryButton: { label: "Encontrar mi rutina", type: "skin_quiz", value: "home" },
      secondaryButton: { label: "Diagnostico en 2 minutos", type: "skin_quiz", value: "home" },
      tertiaryButton: { label: "Ver la seleccion", type: "url", value: "#featured-products" },
      image: null,
      video: null,
      backgroundColor: "#fffaf6",
      isVisible: true,
      trustSignals: [
        "Productos originales",
        "Envios a todo Mexico",
        "Pago seguro",
        "Asesoria especializada",
      ],
    },
    sections: [
      {
        key: "featured_routines",
        eyebrow: "Diagnostico guiado",
        title: "Primero tu piel. Luego tu rutina.",
        description: "El recorrido cambia: te entendemos, diagnosticamos y despues te mostramos lo que realmente vale la pena usar.",
        ctaLabel: "Encontrar mi rutina",
        ctaType: "skin_quiz",
        ctaValue: "home",
        order: 0,
        active: true,
      },
      {
        key: "featured_products",
        eyebrow: "Tu seleccion",
        title: "Aqui aparecen los productos. Ya con contexto.",
        description: "Cada formula llega despues del diagnostico, la rutina y la razon de uso.",
        ctaLabel: "Ver toda la seleccion",
        ctaType: "page",
        ctaValue: "productos",
        order: 1,
        active: true,
      },
      {
        key: "shop_needs",
        eyebrow: "Si prefieres explorar",
        title: "Tambien puedes entrar por necesidad.",
        description: "Una ruta secundaria para quien ya sabe si busca acne, manchas, hidratacion o sensibilidad.",
        ctaLabel: "Ver toda la seleccion",
        ctaType: "page",
        ctaValue: "productos",
        order: 2,
        active: true,
      },
      {
        key: "science",
        eyebrow: "La ciencia detras",
        title: "No vendemos primero. Explicamos primero.",
        description: "La piel mejora mas facil cuando entiendes que hace cada paso y por que esta en tu rutina.",
        order: 3,
        active: true,
      },
      {
        key: "testimonials",
        eyebrow: "Voces de la comunidad",
        title: "La confianza entra mejor cuando se lee como testimonio.",
        description: "Historias reales de clientas que compran con mas criterio y menos ruido.",
        order: 4,
        active: true,
      },
      {
        key: "bestsellers",
        eyebrow: "Bestsellers",
        title: "Lo que vuelve a entrar a la rutina.",
        description: "Formulas que se recompran por sensorial, constancia y resultado.",
        order: 5,
        active: true,
      },
      {
        key: "reviews",
        eyebrow: "Resenas verificadas",
        title: "Lo que dicen nuestras clientas",
        description: "Resenas aprobadas, lectura limpia y compras verificadas antes de decidir.",
        ctaLabel: "Ver todas las resenas",
        ctaType: "page",
        ctaValue: "reviews",
        order: 6,
        active: true,
      },
      {
        key: "blog",
        eyebrow: "Diario Skin Hearten",
        title: "Lectura tranquila para seguir explorando.",
        description: "Activos, rutina y cuidado de la piel en tono editorial.",
        ctaLabel: "Ir al blog",
        ctaType: "page",
        ctaValue: "blog",
        order: 7,
        active: true,
      },
    ],
    banners: [
      { key: "top_bar_left", title: "Banner superior", message: "Skincare curado para rutinas mas claras.", order: 0, active: true },
      { key: "top_bar_right", title: "Envios", message: "Compra tranquila y enfoque en conversion real.", order: 1, active: true },
      { key: "promotion", title: "Promocion", message: "Compra con tranquilidad y soporte humano visible.", order: 2, active: false },
      { key: "seasonal", title: "Temporada", message: "Seleccion editorial para rutinas de verano y clima calido.", order: 3, active: false },
      {
        key: "whatsapp",
        title: "WhatsApp",
        message: "Asesoria especializada por WhatsApp",
        value: "",
        order: 4,
        active: false,
      },
    ],
    footer: {
      introText: "Skincare seleccionado para rutinas mas claras, piel mas estable y una experiencia editorial que prioriza criterio.",
      contactLines: [],
      columns: [
        {
          title: "Explorar",
          links: [
            { label: "Seleccion", type: "page", value: "productos" },
            { label: "Blog", type: "page", value: "blog" },
            { label: "Cuenta", type: "page", value: "cuenta" },
          ],
        },
      ],
      legalLinks: [],
      socialLinks: [],
      noticeText: "Contenido comercial editable desde SuperAdmin con fallback seguro si la API no esta disponible.",
    },
    routineGuideSteps: [
      {
        eyebrow: "1. Te entendemos",
        title: "Primero hablamos de piel, no de producto.",
        description: "Empiezas por manchas, sensibilidad, hidratacion o brotes. No por un catalogo infinito.",
      },
      {
        eyebrow: "2. Conocemos tu piel",
        title: "El diagnostico toma dos minutos.",
        description: "Tipo de piel, objetivo, sensibilidad y tiempo real para seguir una rutina.",
      },
      {
        eyebrow: "3. Te recomendamos una rutina",
        title: "Manana y noche, paso por paso.",
        description: "Una guia clara para usar menos, pero usar mejor.",
      },
      {
        eyebrow: "4. Aqui estan los productos",
        title: "Solo despues llegan los esenciales.",
        description: "Cada recomendacion ya tiene una razon de estar en tu rutina.",
      },
    ],
    sciencePoints: [
      {
        eyebrow: "La ciencia detras",
        title: "Menos pasos funciona mejor cuando cada formula tiene una razon.",
        description: "Activos, barrera y consistencia explicados con lenguaje claro.",
      },
      {
        eyebrow: "Como se usa",
        title: "Manana y noche no es una regla. Es una forma de bajar friccion.",
        description: "Te ayudamos a entender orden, frecuencia y combinaciones sin sobrecargar la piel.",
      },
      {
        eyebrow: "Errores comunes",
        title: "Exfoliar de mas, mezclar sin criterio o abandonar a la semana.",
        description: "La educacion evita decisiones impulsivas y mejora adherencia a la rutina.",
      },
      {
        eyebrow: "Ingredientes",
        title: "Lo importante no es memorizar INCI. Es saber por que esta cada cosa.",
        description: "Peptidos, niacinamida, ceramidas o filtros: cada uno resuelve un momento distinto.",
      },
    ],
    homeTestimonials: [],
  };
}

export function sortCommercialItems<TItem extends { order: number }>(items: TItem[]) {
  return [...items].sort((left, right) => left.order - right.order);
}

export function getCommercialSection(content: CommercialContent, key: string) {
  return sortCommercialItems(content.sections).find((section) => section.key === key) ?? null;
}

export function isCommercialQuizAction(action: CommercialActionType | null | undefined) {
  return action === "skin_quiz";
}

export function resolveCommercialHref(config: { type: CommercialActionType; value: string }) {
  const value = config.value.trim();
  if (!value) {
    return "/";
  }

  switch (config.type) {
    case "page":
      return value.startsWith("/") ? value : `/${value.replace(/^\/+/, "")}`;
    case "category":
      return `/productos?categoria=${encodeURIComponent(value)}`;
    case "collection":
      if (value === "best-sellers") {
        return "/productos?bestSeller=true";
      }
      if (value === "offers") {
        return "/productos?destacados=true";
      }
      if (value === "featured") {
        return "/productos?featured=true";
      }
      return `/productos?q=${encodeURIComponent(value)}`;
    case "routine":
      return `/productos?q=${encodeURIComponent(value)}`;
    case "search":
      return `/productos?q=${encodeURIComponent(value)}`;
    case "product":
      return value.startsWith("/") ? value : `/producto/${encodeURIComponent(value)}`;
    case "skin_quiz":
      return "#";
    case "url":
    default:
      return value;
  }
}
