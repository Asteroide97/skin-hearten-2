"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SiteSearch } from "@/components/layout/site-search";
import { SkinQuizModal } from "@/components/quiz/skin-quiz-modal";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { CartIcon, WhatsAppIcon } from "@/components/shared/icons";
import {
  isCommercialQuizAction,
  resolveCommercialHref,
  sortCommercialItems,
  type CommercialContent,
} from "@/lib/commercial-content";
import type { GuidedCatalogProduct } from "@/lib/guided-catalog";
import { useCartStore } from "@/store/cart-store";

type SiteHeaderProps = {
  catalogProducts: GuidedCatalogProduct[];
  commercialContent: CommercialContent;
};

function getBasePath(href: string) {
  return href.split("?")[0] ?? href;
}

function isActivePath(pathname: string, href: string) {
  const basePath = getBasePath(href);
  if (basePath === "/") {
    return pathname === "/";
  }

  if (basePath === "/productos") {
    return pathname.startsWith("/productos");
  }

  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}

export function SiteHeader({ catalogProducts, commercialContent }: SiteHeaderProps) {
  const pathname = usePathname();
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const primaryNavItems = sortCommercialItems(commercialContent.navigation).filter((item) => item.active);
  const quickAccessItems = sortCommercialItems(commercialContent.quickLinks).filter((item) => item.active);
  const supportWhatsAppUrl = commercialContent.header.supportWhatsAppUrl?.trim() || null;

  return (
    <>
      <SkinQuizModal catalogProducts={catalogProducts} />
      <header className="sticky top-0 z-30 border-b border-stone-200/90 bg-[rgba(250,247,242,0.94)] shadow-[0_16px_36px_rgba(28,20,16,0.05)] backdrop-blur-xl">
        <div className="border-b border-stone-200/80 bg-[#fbf7f2]">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2 text-[11px] tracking-[0.08em] text-stone-600 sm:px-6 lg:px-8">
            {commercialContent.header.topLeftText ? <p className="truncate">{commercialContent.header.topLeftText}</p> : <span />}
            {commercialContent.header.topRightText ? <p className="hidden shrink-0 sm:block">{commercialContent.header.topRightText}</p> : null}
          </div>
        </div>

        <div className="border-b border-stone-200/80 bg-[linear-gradient(180deg,rgba(255,252,248,0.95),rgba(249,243,237,0.96))]">
          <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-8">
              <Link
                className="min-w-0 truncate font-serif text-[1.75rem] leading-none tracking-[-0.05em] text-stone-950 sm:text-[2rem]"
                href="/"
              >
                {commercialContent.header.logoText}
              </Link>

              <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
                {primaryNavItems.map((item) => {
                  const href = resolveCommercialHref({ type: item.type, value: item.value });
                  const isActive = isActivePath(pathname, href);
                  const isAccent = item.name.toUpperCase() === "OFERTA";

                  return (
                    <Link
                      className={`inline-flex whitespace-nowrap rounded-full px-3 py-2 text-sm transition ${
                        isAccent
                          ? isActive
                            ? "bg-stone-950 text-white"
                            : "border border-stone-200 bg-white font-semibold text-stone-950 hover:border-stone-300"
                          : isActive
                            ? "bg-white font-semibold text-stone-950 shadow-[0_10px_24px_rgba(28,20,16,0.05)]"
                            : "text-stone-700 hover:bg-white/80 hover:text-stone-950"
                      }`}
                      href={href}
                      key={`${item.name}-${item.order}`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="flex shrink-0 items-center gap-2">
                {supportWhatsAppUrl ? (
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-950 transition hover:border-stone-300 hover:bg-[#fffdfb]"
                    href={supportWhatsAppUrl}
                    target="_blank"
                  >
                    <WhatsAppIcon className="text-[#154f3b]" />
                    <span className="hidden sm:inline">WhatsApp</span>
                  </Link>
                ) : null}
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 sm:px-4"
                  href="/carrito"
                >
                  <CartIcon className="h-4 w-4" />
                  <span className="hidden min-[430px]:inline">Tu rutina</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{itemCount}</span>
                </Link>
              </div>
            </div>

            <nav className="mt-4 flex gap-2 overflow-x-auto lg:hidden">
              {primaryNavItems.map((item) => {
                const href = resolveCommercialHref({ type: item.type, value: item.value });
                const isActive = isActivePath(pathname, href);
                const isAccent = item.name.toUpperCase() === "OFERTA";

                return (
                  <Link
                    className={`inline-flex shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm transition ${
                      isAccent
                        ? isActive
                          ? "bg-stone-950 text-white"
                          : "border border-stone-200 bg-white font-semibold text-stone-950"
                        : isActive
                          ? "bg-white font-semibold text-stone-950 shadow-[0_10px_24px_rgba(28,20,16,0.05)]"
                          : "border border-stone-200 bg-[rgba(255,255,255,0.78)] text-stone-700"
                    }`}
                    href={href}
                    key={`mobile-${item.name}-${item.order}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-5 flex justify-center">
              <SiteSearch
                catalogProducts={catalogProducts}
                className="w-full max-w-4xl"
                variant="header"
              />
            </div>
          </div>
        </div>

        <div className="border-b border-stone-200/70 bg-[rgba(255,251,246,0.92)]">
          <div className="mx-auto flex max-w-[1320px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {quickAccessItems.map((item) => (
              isCommercialQuizAction(item.action) ? (
                <SkinQuizTrigger
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm font-semibold text-stone-950 transition hover:border-stone-300 hover:bg-[#fffdfb]"
                  key={`${item.name}-${item.order}`}
                  source="header"
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f6eee8] px-2 text-[10px] font-semibold text-stone-900">
                    {item.icon ?? "Q"}
                  </span>
                  <span>{item.name}</span>
                </SkinQuizTrigger>
              ) : (
                <Link
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 transition hover:border-stone-300 hover:bg-[#fffdfb]"
                  href={resolveCommercialHref({ type: item.action, value: item.value })}
                  key={`${item.name}-${item.order}`}
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f6eee8] px-2 text-[10px] font-semibold text-stone-900">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              )
            ))}
          </div>
        </div>
      </header>
    </>
  );
}
