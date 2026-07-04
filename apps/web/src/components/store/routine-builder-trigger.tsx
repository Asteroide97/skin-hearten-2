"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import type { RoutineResolveData, RoutineSource } from "@/lib/routines";
import { useStoredSkinQuizResult } from "@/hooks/use-stored-skin-quiz-result";
import type { Product } from "@/lib/types";
import { useCartStore } from "@/store/cart-store";

type RoutineApiResponse =
  | { ok: true; data: RoutineResolveData }
  | { ok: false; reason: string; message?: string };

type RoutineBuilderTriggerProps = {
  product: Product;
  buttonClassName?: string;
  categoryHint?: string | null;
  label?: string;
  sourceHint?: RoutineSource;
};

function resolveAssetUrl(value: string | null | undefined) {
  const normalizedValue = value?.trim() ?? "";
  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.startsWith("http://") || normalizedValue.startsWith("https://")) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith("/")) {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
    if (!apiBaseUrl) {
      return normalizedValue;
    }

    const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
    return `${origin}${normalizedValue}`;
  }

  return null;
}

function passthroughImageLoader({ src }: { src: string }) {
  return src;
}

export function RoutineBuilderTrigger({
  product,
  buttonClassName = "btn-primary",
  categoryHint,
  label = "Agregar a mi rutina",
  sourceHint = "product",
}: RoutineBuilderTriggerProps) {
  const addItem = useCartStore((state) => state.addItem);
  const storedQuizResult = useStoredSkinQuizResult();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedRoutine, setResolvedRoutine] = useState<RoutineResolveData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionLabel, setActionLabel] = useState<"routine" | "single" | null>(null);
  const isActionPending = actionLabel !== null;

  const resolvedSource: RoutineSource = storedQuizResult ? "skin_quiz" : sourceHint;
  const resolvedGoal = storedQuizResult?.answers.goal ?? null;
  const resolvedCategory = sourceHint === "category" ? categoryHint ?? product.category : null;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let cancelled = false;

    async function loadRoutine() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({
          product: product.slug,
          source: resolvedSource,
        });
        if (resolvedGoal) {
          params.set("goal", resolvedGoal);
        }
        if (resolvedCategory) {
          params.set("category", resolvedCategory);
        }

        const response = await fetch(`/api/routines/resolve?${params.toString()}`, {
          cache: "no-store",
        });
        const payload = (await response.json()) as RoutineApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok) {
          setResolvedRoutine(null);
          setErrorMessage(payload.ok ? "No pudimos cargar la rutina sugerida." : payload.message ?? "No pudimos cargar la rutina sugerida.");
          return;
        }

        setResolvedRoutine(payload.data);
      } catch {
        if (!cancelled) {
          setResolvedRoutine(null);
          setErrorMessage("No pudimos cargar la rutina sugerida.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadRoutine();
    return () => {
      cancelled = true;
    };
  }, [isOpen, product.slug, resolvedCategory, resolvedGoal, resolvedSource]);

  const orderedSteps = useMemo(() => {
    return resolvedRoutine?.routine?.steps.slice().sort((left, right) => left.order - right.order) ?? [];
  }, [resolvedRoutine?.routine?.steps]);

  async function addSingleProduct() {
    if (isActionPending) {
      return;
    }

    addItem({ productId: product.id, slug: product.slug, name: product.name, price: product.price });
    trackEvent("routine_single_added", {
      product_id: product.id,
      product_name: product.name,
      routine_id: resolvedRoutine?.routine?.id,
      routine_name: resolvedRoutine?.routine?.name ?? null,
      source: resolvedSource,
    });
    setActionLabel("single");
    window.setTimeout(() => {
      setIsOpen(false);
      setActionLabel(null);
    }, 500);
  }

  async function addFullRoutine() {
    if (isActionPending) {
      return;
    }

    const uniqueSteps = orderedSteps.filter(
      (step, index, list) => list.findIndex((entry) => entry.productSlug === step.productSlug) === index,
    );

    uniqueSteps.forEach((step) => {
      const stepPrice =
        typeof step.productPrice === "number" && Number.isFinite(step.productPrice)
          ? step.productPrice
          : step.productSlug === product.slug
            ? product.price
            : product.price;

      addItem({
        productId: String(step.productId),
        slug: step.productSlug,
        name: step.productName,
        price: stepPrice,
      });
    });

    trackEvent("routine_full_added", {
      item_count: uniqueSteps.length,
      product_id: product.id,
      product_ids: uniqueSteps.map((step) => String(step.productId)),
      routine_id: resolvedRoutine?.routine?.id,
      routine_name: resolvedRoutine?.routine?.name ?? null,
      source: resolvedSource,
    });

    setActionLabel("routine");
    window.setTimeout(() => {
      setIsOpen(false);
      setActionLabel(null);
    }, 500);
  }

  return (
    <>
      <button
        className={buttonClassName}
        onClick={() => {
          trackEvent("routine_builder_opened", {
            product_id: product.id,
            product_name: product.name,
            source: resolvedSource,
          });
          setIsOpen(true);
        }}
        type="button"
      >
        {label}
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-stone-950/35 backdrop-blur-sm">
          <div className="mx-auto flex min-h-full max-w-[1200px] items-start px-4 py-4 sm:px-6 sm:py-6 lg:items-center">
            <div className="my-auto w-full rounded-[2rem] border border-stone-200 bg-[#fffaf6] px-4 py-5 shadow-[0_32px_80px_rgba(28,25,23,0.18)] sm:rounded-[2.6rem] sm:px-8 sm:py-8">
              <div className="flex flex-col gap-5 border-b border-stone-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Routine Builder</p>
                  <h2 className="mt-3 font-serif text-[2.4rem] leading-[0.95] text-stone-950 sm:text-[3rem]">
                    Tu rutina puede funcionar aun mejor.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-stone-600 sm:text-base">
                    Este producto normalmente se utiliza como parte de una rutina completa.
                  </p>
                </div>

                <button
                  className="self-start rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                  disabled={isActionPending}
                  onClick={() => {
                    setIsOpen(false);
                  }}
                  type="button"
                >
                  Cerrar
                </button>
              </div>

              {isLoading ? (
                <div className="mt-8 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]" aria-hidden="true">
                  <div className="rounded-[2rem] bg-[#f7efe7] p-6 sm:p-7">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-stone-200" />
                    <div className="mt-4 h-10 w-3/4 animate-pulse rounded-full bg-stone-200" />
                    <div className="mt-4 h-3 w-full animate-pulse rounded-full bg-stone-200" />
                    <div className="mt-3 h-3 w-5/6 animate-pulse rounded-full bg-stone-200" />
                    <div className="mt-6 flex gap-2">
                      <div className="h-8 w-32 animate-pulse rounded-full bg-white/80" />
                      <div className="h-8 w-24 animate-pulse rounded-full bg-white/80" />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div
                        className="rounded-[2rem] border border-stone-200 bg-white px-4 py-5"
                        key={`routine-loading-${index}`}
                      >
                        <div className="h-3 w-16 animate-pulse rounded-full bg-stone-200" />
                        <div className="mt-4 h-36 animate-pulse rounded-[1.5rem] bg-stone-100" />
                        <div className="mt-4 h-6 w-24 animate-pulse rounded-full bg-stone-100" />
                        <div className="mt-4 h-8 w-4/5 animate-pulse rounded-full bg-stone-200" />
                        <div className="mt-3 h-3 w-full animate-pulse rounded-full bg-stone-100" />
                        <div className="mt-2 h-3 w-5/6 animate-pulse rounded-full bg-stone-100" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {resolvedRoutine?.routine ? (
                    <div className="mt-8 grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
                      <div className="rounded-[2rem] bg-[#f7efe7] p-6 sm:p-7">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Seleccion</p>
                        <h3 className="mt-4 font-serif text-[2.1rem] leading-[0.96] text-stone-950">
                          {resolvedRoutine.routine.name}
                        </h3>
                        <p className="mt-4 text-sm leading-7 text-stone-600">
                          {resolvedRoutine.routine.description ?? "Secuencia curada para que el producto tenga mejor contexto dentro de la rutina."}
                        </p>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {resolvedRoutine.matchedBy ? (
                            <span className="rounded-full border border-stone-300 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
                              {resolvedRoutine.matchedBy === "goal"
                                ? "Segun tu necesidad"
                                : resolvedRoutine.matchedBy === "category"
                                  ? "Segun categoria"
                                  : resolvedRoutine.matchedBy === "primary_product"
                                    ? "Rutina principal"
                                    : "Producto vinculado"}
                            </span>
                          ) : null}
                          <span className="rounded-full border border-stone-300 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-700">
                            {orderedSteps.length} pasos
                          </span>
                        </div>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {orderedSteps.map((step) => {
                          const isCurrent = step.productSlug === product.slug;
                          const assetUrl = resolveAssetUrl(step.image ?? step.productImage);

                          return (
                            <article
                              className={`rounded-[2rem] border px-4 py-5 ${
                                isCurrent
                                  ? "border-stone-950 bg-stone-950 text-white"
                                  : "border-stone-200 bg-white text-stone-900"
                              }`}
                              key={step.id}
                            >
                              <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${isCurrent ? "text-white/65" : "text-stone-500"}`}>
                                Paso {step.order}
                              </p>

                              <div className="mt-4 overflow-hidden rounded-[1.5rem]">
                                {assetUrl ? (
                                  <Image
                                    alt={step.productName}
                                    className="h-36 w-full object-cover"
                                    height={288}
                                    loader={passthroughImageLoader}
                                    loading="lazy"
                                    sizes="(min-width: 1280px) 220px, (min-width: 768px) 45vw, 100vw"
                                    src={assetUrl}
                                    unoptimized
                                    width={320}
                                  />
                                ) : (
                                  <div
                                    className={`flex h-36 items-end justify-center bg-gradient-to-br ${step.productGradient ?? product.gradient} px-4 py-5`}
                                  >
                                    <div className="relative h-24 w-16 rounded-[1.8rem] border border-white/70 bg-white/85" />
                                  </div>
                                )}
                              </div>

                              <div className="mt-4 space-y-2">
                                {step.badge ? (
                                  <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isCurrent ? "border-white/30 bg-white/10 text-white/80" : "border-stone-200 bg-[#fff8f3] text-stone-700"}`}>
                                    {step.badge}
                                  </span>
                                ) : null}
                                <h4 className="font-serif text-[1.55rem] leading-[0.98]">{step.productName}</h4>
                                <p className={`text-sm leading-7 ${isCurrent ? "text-white/76" : "text-stone-600"}`}>
                                  {step.shortDescription}
                                </p>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-8 rounded-[2rem] border border-stone-200 bg-white px-6 py-10 text-center">
                      <h3 className="font-serif text-[2rem] text-stone-950">Seguimos afinando esta rutina</h3>
                      <p className="mt-3 text-sm leading-7 text-stone-600">
                        {errorMessage ?? "Por ahora puedes continuar con este producto y completar la rutina despues."}
                      </p>
                    </div>
                  )}

                  <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                    <div className="text-sm text-stone-600">
                      <p className="font-medium text-stone-900">{product.name}</p>
                      <p className="mt-1">{formatCurrency(product.price)}</p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      {resolvedRoutine?.routine ? (
                        <button
                          className="btn-primary"
                          disabled={isLoading || isActionPending}
                          onClick={() => {
                            void addFullRoutine();
                          }}
                          type="button"
                        >
                          {actionLabel === "routine" ? "Rutina anadida" : "Agregar rutina completa"}
                        </button>
                      ) : null}
                      <button
                        className="btn-secondary"
                        disabled={isLoading || isActionPending}
                        onClick={() => {
                          void addSingleProduct();
                        }}
                        type="button"
                      >
                        {actionLabel === "single" ? "Producto anadido" : "Continuar solo con este producto"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
