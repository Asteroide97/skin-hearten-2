export type NeedAnalyticsValue =
  | "acne"
  | "manchas"
  | "antiedad"
  | "hidratacion"
  | "piel_sensible"
  | "protector_solar";

export type SkinQuizAnalyticsSource = "auto_home" | "header" | "home";
export type PublicAnalyticsSource =
  | "blog"
  | "cart"
  | "category"
  | "checkout"
  | "header"
  | "home"
  | "product"
  | "products"
  | "quiz"
  | "reviews"
  | "skin_quiz"
  | "verified_reviews";
export type RoutineBuilderAnalyticsSource = "product" | "category" | "skin_quiz";

export type AnalyticsEventMap = {
  home_viewed: {
    source: "home";
  };
  hero_cta_clicked: {
    destination: string;
    label: string;
    location: "hero";
  };
  site_visit: {
    source?: PublicAnalyticsSource;
    referrer?: string | null;
  };
  product_view: {
    product_id: string;
    product_name: string;
    category: string;
    price: number;
  };
  product_viewed: {
    product_id: string;
    product_name: string;
    category: string;
    price: number;
  };
  product_added_to_cart: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  };
  product_removed_from_cart: {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
  };
  search_used: {
    query: string;
    source: "header";
  };
  search_submitted: {
    query: string;
    source: "header";
  };
  need_card_click: {
    need: NeedAnalyticsValue;
  };
  cart_viewed: {
    cart_total: number;
    item_count: number;
  };
  checkout_started: {
    cart_total: number;
    item_count: number;
  };
  purchase_attempted: {
    payment_method: "mercadopago" | "paypal" | "stripe" | "mock";
    cart_total: number;
    item_count: number;
  };
  checkout_completed: {
    order_id: number;
    order_number: string;
    payment_method: "mercadopago" | "paypal" | "stripe" | "mock";
    payment_status: string;
    cart_total: number;
    item_count: number;
  };
  skin_quiz_opened: {
    source: SkinQuizAnalyticsSource;
    has_saved_result: boolean;
  };
  skin_quiz_started: {
    source: SkinQuizAnalyticsSource;
  };
  skin_quiz_step_answered: {
    step_id: "skinType" | "goal" | "ageRange" | "frequency" | "sensitivity" | "timeCommitment";
    answer: string;
    step_number: number;
  };
  skin_quiz_completed: {
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    skin_type: "seca" | "mixta" | "grasa" | "sensible" | "no_segura";
    age_range?: "18_24" | "25_34" | "35_44" | "45_plus";
    recommended_product_ids: string[];
    source?: SkinQuizAnalyticsSource;
  };
  quiz_result_viewed: {
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    source?: SkinQuizAnalyticsSource;
  };
  skin_quiz_dismissed: {
    source: SkinQuizAnalyticsSource;
    reason: "now_later" | "close";
    reopen_after_days: number;
  };
  skin_quiz_add_routine_to_cart: {
    product_ids: string[];
    item_count: number;
    cart_total: number;
  };
  skin_quiz_lead_step_viewed: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    has_saved_lead: boolean;
  };
  skin_quiz_lead_captured: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    has_email: boolean;
    accepted_marketing: boolean;
  };
  skin_quiz_lead_skipped: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
  };
  recommendation_clicked: {
    destination: string;
    product_ids: string[];
    source: "skin_quiz";
  };
  skin_quiz_lead_sync_started: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
  };
  skin_quiz_lead_sync_success: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    lead_id: number;
  };
  skin_quiz_lead_sync_failed: {
    source: SkinQuizAnalyticsSource;
    goal:
      | "manchas"
      | "acne"
      | "lineas_expresion"
      | "hidratacion"
      | "luminosidad"
      | "proteccion_solar";
    reason: string;
  };
  routine_builder_opened: {
    product_id: string;
    product_name: string;
    source: RoutineBuilderAnalyticsSource;
  };
  routine_full_added: {
    product_id: string;
    product_ids: string[];
    item_count: number;
    routine_id?: number;
    routine_name?: string | null;
    source: RoutineBuilderAnalyticsSource;
  };
  routine_single_added: {
    product_id: string;
    product_name: string;
    routine_id?: number;
    routine_name?: string | null;
    source: RoutineBuilderAnalyticsSource;
  };
  review_started: {
    product_id?: string;
    product_name?: string;
    source: "product" | "verified_reviews";
  };
  review_viewed: {
    product_id?: string;
    product_name?: string;
    source: "home" | "product";
  };
  review_submitted: {
    product_id?: string;
    product_name?: string;
    rating: number;
    source: "product" | "verified_reviews";
    verified: boolean;
  };
  newsletter_subscribed: {
    source: "home" | "footer";
  };
};

export type AnalyticsEventName = keyof AnalyticsEventMap;
export type AnalyticsEventPayload<TEvent extends AnalyticsEventName> = AnalyticsEventMap[TEvent];
export type PublicAnalyticsEventName =
  | "home_viewed"
  | "hero_cta_clicked"
  | "site_visit"
  | "search_submitted"
  | "quiz_started"
  | "quiz_question_answered"
  | "quiz_completed"
  | "quiz_result_viewed"
  | "product_viewed"
  | "product_added_to_cart"
  | "product_removed_from_cart"
  | "recommendation_clicked"
  | "routine_builder_opened"
  | "routine_full_added"
  | "routine_single_added"
  | "cart_viewed"
  | "checkout_started"
  | "checkout_completed"
  | "newsletter_subscribed"
  | "review_viewed"
  | "review_started"
  | "review_submitted";

export type AnalyticsTrackedEvent<TEvent extends AnalyticsEventName = AnalyticsEventName> = {
  name: TEvent;
  payload: AnalyticsEventPayload<TEvent>;
  timestamp: string;
  path: string;
  sessionId: string | null;
};
type AnyAnalyticsTrackedEvent = {
  [TEvent in AnalyticsEventName]: AnalyticsTrackedEvent<TEvent>;
}[AnalyticsEventName];

type AnalyticsTransportEvent = {
  eventName: PublicAnalyticsEventName;
  metadata?: Record<string, unknown>;
  orderId?: number;
  path?: string;
  productId?: number;
  routineId?: number;
  sessionId?: string | null;
  source?: string;
};

const ANALYTICS_STORAGE_KEY = "skin-hearten.analytics.queue";
const ANALYTICS_SESSION_ID_KEY = "skin-hearten.analytics.session-id";
const analyticsQueue: AnalyticsTrackedEvent[] = [];

function isBrowser() {
  return typeof window !== "undefined";
}

function getLocalStorage() {
  if (!isBrowser() || typeof window.localStorage === "undefined") {
    return null;
  }

  return window.localStorage;
}

function getSessionStorage() {
  if (!isBrowser() || typeof window.sessionStorage === "undefined") {
    return null;
  }

  return window.sessionStorage;
}

function getCurrentPath() {
  if (!isBrowser()) {
    return "";
  }

  const pathname = typeof window.location?.pathname === "string" ? window.location.pathname : "";
  const search = typeof window.location?.search === "string" ? window.location.search : "";
  return `${pathname}${search}`;
}

function readStoredQueue() {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return [];
  }

  try {
    const storedQueue = sessionStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (!storedQueue) {
      return [];
    }

    const parsedQueue = JSON.parse(storedQueue);
    return Array.isArray(parsedQueue) ? parsedQueue : [];
  } catch {
    return [];
  }
}

function persistQueue(queue: AnalyticsTrackedEvent[]) {
  const sessionStorage = getSessionStorage();
  if (!sessionStorage) {
    return;
  }

  try {
    sessionStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(queue));
  } catch {
    // Ignore storage failures so telemetry never blocks the storefront.
  }
}

function buildSessionId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `sh-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getAnalyticsSessionId() {
  const storage = getLocalStorage();
  if (!storage) {
    return null;
  }

  try {
    const existingValue = storage.getItem(ANALYTICS_SESSION_ID_KEY)?.trim();
    if (existingValue) {
      return existingValue;
    }

    const nextValue = buildSessionId();
    storage.setItem(ANALYTICS_SESSION_ID_KEY, nextValue);
    return nextValue;
  } catch {
    return null;
  }
}

export function getQueuedAnalyticsEvents() {
  return [...(analyticsQueue.length > 0 ? analyticsQueue : readStoredQueue())];
}

function getAnalyticsEndpoint() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    return null;
  }

  return `${apiUrl.replace(/\/$/, "")}/analytics/events`;
}

function toPositiveInt(value: unknown) {
  const numericValue = typeof value === "string" ? Number(value) : value;
  return typeof numericValue === "number" && Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined;
}

function omitUndefined<TValue extends Record<string, unknown>>(value: TValue) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  ) as TValue;
}

function omitUndefinedTransport<TValue extends AnalyticsTransportEvent>(value: TValue) {
  return omitUndefined(value) as AnalyticsTransportEvent;
}

function buildTransportEvent<TEvent extends AnalyticsEventName>(
  event: AnyAnalyticsTrackedEvent,
): AnalyticsTransportEvent | null {
  switch (event.name) {
    case "home_viewed":
      return {
        eventName: "home_viewed",
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "hero_cta_clicked":
      return {
        eventName: "hero_cta_clicked",
        metadata: {
          destination: event.payload.destination,
          label: event.payload.label,
          location: event.payload.location,
        },
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.location,
      };
    case "site_visit":
      return omitUndefinedTransport({
        eventName: "site_visit",
        metadata: event.payload.referrer ? { referrer: event.payload.referrer } : undefined,
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "search_submitted":
    case "search_used":
      return {
        eventName: "search_submitted",
        metadata: { query: event.payload.query },
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "skin_quiz_started":
      return {
        eventName: "quiz_started",
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "skin_quiz_step_answered":
      return {
        eventName: "quiz_question_answered",
        metadata: {
          answer: event.payload.answer,
          step_id: event.payload.step_id,
          step_number: event.payload.step_number,
        },
        path: event.path,
        sessionId: event.sessionId,
      };
    case "skin_quiz_completed":
      return omitUndefinedTransport({
        eventName: "quiz_completed",
        metadata: {
          age_range: event.payload.age_range,
          goal: event.payload.goal,
          recommended_product_ids: event.payload.recommended_product_ids,
          skin_type: event.payload.skin_type,
        },
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "quiz_result_viewed":
      return omitUndefinedTransport({
        eventName: "quiz_result_viewed",
        metadata: {
          goal: event.payload.goal,
        },
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "product_viewed":
    case "product_view":
      return {
        eventName: "product_viewed",
        metadata: {
          category: event.payload.category,
          price: event.payload.price,
          product_name: event.payload.product_name,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
      };
    case "product_added_to_cart":
      return {
        eventName: "product_added_to_cart",
        metadata: {
          price: event.payload.price,
          product_name: event.payload.product_name,
          quantity: event.payload.quantity,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
      };
    case "product_removed_from_cart":
      return {
        eventName: "product_removed_from_cart",
        metadata: {
          price: event.payload.price,
          product_name: event.payload.product_name,
          quantity: event.payload.quantity,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
      };
    case "recommendation_clicked":
      return {
        eventName: "recommendation_clicked",
        metadata: {
          destination: event.payload.destination,
          product_ids: event.payload.product_ids,
        },
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "routine_builder_opened":
      return {
        eventName: "routine_builder_opened",
        metadata: { product_name: event.payload.product_name },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "routine_full_added":
      return omitUndefinedTransport({
        eventName: "routine_full_added",
        metadata: {
          item_count: event.payload.item_count,
          product_ids: event.payload.product_ids,
          routine_name: event.payload.routine_name,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        routineId: event.payload.routine_id,
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "routine_single_added":
      return omitUndefinedTransport({
        eventName: "routine_single_added",
        metadata: {
          product_name: event.payload.product_name,
          routine_name: event.payload.routine_name,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        routineId: event.payload.routine_id,
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "cart_viewed":
      return {
        eventName: "cart_viewed",
        metadata: {
          cart_total: event.payload.cart_total,
          item_count: event.payload.item_count,
        },
        path: event.path,
        sessionId: event.sessionId,
      };
    case "checkout_started":
      return {
        eventName: "checkout_started",
        metadata: {
          cart_total: event.payload.cart_total,
          item_count: event.payload.item_count,
        },
        path: event.path,
        sessionId: event.sessionId,
      };
    case "checkout_completed":
      return {
        eventName: "checkout_completed",
        metadata: {
          cart_total: event.payload.cart_total,
          item_count: event.payload.item_count,
          order_number: event.payload.order_number,
          payment_method: event.payload.payment_method,
          payment_status: event.payload.payment_status,
        },
        orderId: event.payload.order_id,
        path: event.path,
        sessionId: event.sessionId,
      };
    case "newsletter_subscribed":
      return {
        eventName: "newsletter_subscribed",
        path: event.path,
        sessionId: event.sessionId,
        source: event.payload.source,
      };
    case "review_viewed":
      return omitUndefinedTransport({
        eventName: "review_viewed",
        metadata: {
          product_name: event.payload.product_name,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "review_started":
      return omitUndefinedTransport({
        eventName: "review_started",
        metadata: {
          product_name: event.payload.product_name,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    case "review_submitted":
      return omitUndefinedTransport({
        eventName: "review_submitted",
        metadata: {
          product_name: event.payload.product_name,
          rating: event.payload.rating,
          verified: event.payload.verified,
        },
        path: event.path,
        productId: toPositiveInt(event.payload.product_id),
        sessionId: event.sessionId,
        source: event.payload.source,
      });
    default:
      return null;
  }
}

export function buildAnalyticsApiRequest<TEvent extends AnalyticsEventName>(
  event: AnalyticsTrackedEvent<TEvent>,
) {
  const endpoint = getAnalyticsEndpoint();
  const transportEvent = buildTransportEvent(event as AnyAnalyticsTrackedEvent);
  if (!endpoint || !transportEvent) {
    return null;
  }

  return {
    url: endpoint,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: transportEvent.eventName,
        session_id: transportEvent.sessionId ?? undefined,
        product_id: transportEvent.productId,
        order_id: transportEvent.orderId,
        routine_id: transportEvent.routineId,
        source: transportEvent.source,
        path: transportEvent.path,
        metadata: transportEvent.metadata,
      }),
      keepalive: true,
    } satisfies RequestInit,
  };
}

function dispatchAnalyticsRequest<TEvent extends AnalyticsEventName>(
  event: AnalyticsTrackedEvent<TEvent>,
) {
  const request = buildAnalyticsApiRequest(event);
  if (!request) {
    return;
  }

  void fetch(request.url, request.init).catch(() => {
    // Telemetry must never block UI or surface noisy errors to shoppers.
  });
}

export function trackEvent<TEvent extends AnalyticsEventName>(
  name: TEvent,
  payload: AnalyticsEventPayload<TEvent>,
) {
  if (!isBrowser()) {
    return;
  }

  const trackedEvent: AnalyticsTrackedEvent<TEvent> = {
    name,
    payload,
    timestamp: new Date().toISOString(),
    path: getCurrentPath(),
    sessionId: getAnalyticsSessionId(),
  };

  const nextQueue = [
    ...(analyticsQueue.length > 0 ? analyticsQueue : readStoredQueue()),
    trackedEvent,
  ];

  analyticsQueue.splice(0, analyticsQueue.length, ...nextQueue);
  persistQueue(nextQueue);

  if (process.env.NODE_ENV === "development") {
    const request = buildAnalyticsApiRequest(trackedEvent);
    console.log("[analytics]", trackedEvent, {
      pendingApiEndpoint: request?.url ?? null,
      transportPayload: request ? JSON.parse(String(request.init.body ?? "{}")) : null,
    });
  }

  dispatchAnalyticsRequest(trackedEvent);

  if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("skin-hearten-analytics", {
        detail: trackedEvent,
      }),
    );
  }
}
