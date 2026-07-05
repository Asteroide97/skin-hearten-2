"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { SearchIcon } from "@/components/shared/icons";
import { trackEvent } from "@/lib/analytics";
import type { GuidedCatalogProduct } from "@/lib/guided-catalog";
import {
  buildAdvisorSearchExperience,
  type AdvisorSearchResult,
  type AdvisorSearchResultKind,
} from "@/lib/skin-advisor-search";
import { cn } from "@/lib/utils";

type SiteSearchProps = {
  catalogProducts: GuidedCatalogProduct[];
  className?: string;
  showPromptSuggestions?: boolean;
  variant?: "default" | "header";
};

export function SiteSearch({
  catalogProducts,
  className,
  showPromptSuggestions = false,
  variant = "default",
}: SiteSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const searchExperience = useMemo(
    () => buildAdvisorSearchExperience(query, catalogProducts),
    [catalogProducts, query],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsPanelOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsPanelOpen(false);
      }
    }

    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function navigateTo(href: string, trackedQuery?: string) {
    if (trackedQuery) {
      trackEvent("search_submitted", {
        query: trackedQuery,
        source: "header",
      });
    }

    setIsPanelOpen(false);
    router.push(href);
  }

  function applyPrompt(promptQuery: string) {
    setQuery(promptQuery);
    setIsPanelOpen(true);
    inputRef.current?.focus();
    trackEvent("search_submitted", {
      query: promptQuery,
      source: "header",
    });
  }

  const isHeaderVariant = variant === "header";

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        const normalized = query.trim();
        if (normalized.length > 0) {
          navigateTo(searchExperience.topHref, normalized);
          return;
        }
        navigateTo("/productos");
      }}
    >
      <label className="sr-only" htmlFor="site-search">
        Cuentanos que quieres mejorar
      </label>
      <div className="relative" ref={containerRef}>
        <div
          className={cn(
            "flex items-center gap-3 rounded-full border transition",
            isHeaderVariant
              ? "border-[#f1b2a5] bg-white px-4 py-2 shadow-[0_14px_36px_rgba(73,39,34,0.12)] focus-within:border-stone-900 sm:px-5 sm:py-2.5"
              : "border-stone-200 bg-white/95 px-4 py-2.5 shadow-[0_12px_28px_rgba(32,25,20,0.04)] focus-within:border-stone-400",
          )}
        >
          <SearchIcon className={isHeaderVariant ? "text-stone-500" : "text-stone-400"} />
          <input
            className={cn(
              "w-full bg-transparent outline-none",
              isHeaderVariant
                ? "text-sm text-stone-900 placeholder:text-stone-500 sm:text-base"
                : "text-sm text-stone-800 placeholder:text-stone-400",
            )}
            id="site-search"
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              setIsPanelOpen(nextQuery.trim().length > 0);
            }}
            onFocus={() => {
              if (query.trim().length > 0) {
                setIsPanelOpen(true);
              }
            }}
            placeholder="Cuentanos que quieres mejorar"
            ref={inputRef}
            type="search"
            value={query}
          />
          <button
            className={cn(
              "shrink-0 rounded-full font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
              isHeaderVariant
                ? "bg-stone-950 px-4 py-3 text-xs text-white hover:bg-stone-800 sm:px-6 sm:text-sm"
                : "btn-primary px-4 py-2.5 text-xs",
            )}
            type="submit"
          >
            Explorar
          </button>
        </div>

        {showPromptSuggestions ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {searchExperience.fallbackPrompts.map((prompt) => (
              <button
                className="rounded-full border border-stone-200 bg-white/90 px-3.5 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                key={prompt.query}
                onClick={() => {
                  applyPrompt(prompt.query);
                }}
                type="button"
              >
                {prompt.label}
              </button>
            ))}
          </div>
        ) : null}

        {isPanelOpen ? (
          <div
            className={cn(
              "absolute left-0 right-0 top-full z-40 mt-3 overflow-hidden rounded-[2rem] border bg-[#fffaf6] shadow-[0_28px_70px_rgba(34,25,20,0.14)]",
              isHeaderVariant ? "border-[#efc1b6]" : "border-stone-200",
            )}
          >
            <div className="border-b border-stone-200 bg-[#faf3eb] px-5 py-4 sm:px-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                Skin Advisor Search
              </p>
              <p className="mt-2 font-serif text-[1.8rem] leading-[0.98] text-stone-950">
                {query.trim()}
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">{searchExperience.intro}</p>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 sm:px-6">
              {searchExperience.isEmpty ? (
                <div className="space-y-5 rounded-[1.6rem] bg-white px-5 py-6">
                  <p className="font-serif text-[1.8rem] leading-[1] text-stone-950">
                    No encontramos exactamente eso.
                  </p>
                  <p className="text-sm leading-7 text-stone-600">
                    Buscas alguno de estos problemas?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {searchExperience.fallbackPrompts.map((prompt) => (
                      <button
                        className="rounded-full border border-stone-200 bg-[#fff8f3] px-3.5 py-2 text-xs font-medium text-stone-700 transition hover:border-stone-400 hover:text-stone-950"
                        key={prompt.query}
                        onClick={() => {
                          applyPrompt(prompt.query);
                        }}
                        type="button"
                      >
                        {prompt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {searchExperience.problemResults.length > 0 ? (
                    <SearchSection title="Problemas de piel">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {searchExperience.problemResults.map((result) => (
                          <SearchResultCard
                            key={result.id}
                            onClick={() => {
                              navigateTo(result.href, query.trim());
                            }}
                            result={result}
                          />
                        ))}
                      </div>
                    </SearchSection>
                  ) : null}

                  {searchExperience.ingredientResults.length > 0 ? (
                    <SearchSection title="Ingredientes">
                      <div className="grid gap-3">
                        {searchExperience.ingredientResults.map((result) => (
                          <SearchResultCard
                            key={result.id}
                            onClick={() => {
                              navigateTo(result.href, query.trim());
                            }}
                            result={result}
                          />
                        ))}
                      </div>
                    </SearchSection>
                  ) : null}

                  {searchExperience.routineResults.length > 0 ? (
                    <SearchSection title="Rutinas">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {searchExperience.routineResults.map((result) => (
                          <SearchResultCard
                            key={result.id}
                            onClick={() => {
                              navigateTo(result.href, query.trim());
                            }}
                            result={result}
                          />
                        ))}
                      </div>
                    </SearchSection>
                  ) : null}

                  {searchExperience.productResults.length > 0 ? (
                    <SearchSection title="Productos">
                      <div className="grid gap-3">
                        {searchExperience.productResults.map((result) => (
                          <SearchResultRow
                            key={result.id}
                            onClick={() => {
                              navigateTo(result.href, query.trim());
                            }}
                            result={result}
                          />
                        ))}
                      </div>
                    </SearchSection>
                  ) : null}

                  {searchExperience.articleResults.length > 0 ? (
                    <SearchSection title="Articulos">
                      <div className="grid gap-3">
                        {searchExperience.articleResults.map((result) => (
                          <SearchResultRow
                            key={result.id}
                            onClick={() => {
                              navigateTo(result.href, query.trim());
                            }}
                            result={result}
                          />
                        ))}
                      </div>
                    </SearchSection>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </form>
  );
}

function SearchSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
        {title}
      </p>
      {children}
    </section>
  );
}

function SearchResultCard({
  onClick,
  result,
}: {
  onClick: () => void;
  result: AdvisorSearchResult;
}) {
  return (
    <button
      className="rounded-[1.6rem] border border-stone-200 bg-white px-4 py-4 text-left transition hover:border-stone-400 hover:bg-[#fffdfb]"
      onClick={onClick}
      type="button"
    >
      <ResultBadge kind={result.kind} />
      <p className="mt-3 font-serif text-[1.55rem] leading-[0.98] text-stone-950">
        {result.title}
      </p>
      <p className="mt-2 text-sm leading-7 text-stone-600">{result.description}</p>
      {result.meta ? <p className="mt-3 text-xs text-stone-500">{result.meta}</p> : null}
    </button>
  );
}

function SearchResultRow({
  onClick,
  result,
}: {
  onClick: () => void;
  result: AdvisorSearchResult;
}) {
  return (
    <button
      className="flex w-full flex-col gap-2 rounded-[1.4rem] border border-stone-200 bg-white px-4 py-4 text-left transition hover:border-stone-400 hover:bg-[#fffdfb] sm:flex-row sm:items-start sm:justify-between"
      onClick={onClick}
      type="button"
    >
      <div className="min-w-0">
        <ResultBadge kind={result.kind} />
        <p className="mt-3 font-medium text-stone-950">{result.title}</p>
        <p className="mt-1 text-sm leading-7 text-stone-600">{result.description}</p>
      </div>
      {result.meta ? <p className="text-xs text-stone-500 sm:pl-4">{result.meta}</p> : null}
    </button>
  );
}

function ResultBadge({ kind }: { kind: AdvisorSearchResultKind }) {
  const labels: Record<AdvisorSearchResultKind, string> = {
    articulo: "Articulo",
    ingrediente: "Ingrediente",
    problema: "Problema",
    producto: "Producto",
    rutina: "Rutina",
  };

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
        kind === "rutina" || kind === "problema"
          ? "border-stone-300 bg-[#faf3eb] text-stone-800"
          : "border-stone-200 bg-white text-stone-600",
      )}
    >
      {labels[kind]}
    </span>
  );
}
