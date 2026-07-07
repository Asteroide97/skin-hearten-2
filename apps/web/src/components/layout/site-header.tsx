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
  const supportWhatsAppUrl =
    commercialContent.header.supportWhatsAppUrl ??
    "https://wa.me/525500000000?text=Hola%20Skin%20Hearten%2C%20necesito%20asesoria%20para%20mi%20rutina.";

  return (
    <>
      <SkinQuizModal catalogProducts={catalogProducts} />
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white shadow-[0_12px_34px_rgba(28,20,16,0.06)]">
        <div className="border-b border-stone-200 bg-[#fff7f0]">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2 text-[11px] tracking-[0.08em] text-stone-700 sm:px-6 lg:px-8">
            <p className="truncate">{commercialContent.header.topLeftText}</p>
            <p className="hidden shrink-0 sm:block">{commercialContent.header.topRightText}</p>
          </div>
        </div>

        <div className="border-b border-[#ef8f7b] bg-[#ff9b88]">
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
                            : "bg-white/28 font-semibold text-stone-950 hover:bg-white/48"
                          : isActive
                            ? "bg-white/85 font-semibold text-stone-950"
                            : "text-stone-900 hover:bg-white/35"
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
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/55 bg-white/35 px-3 py-2 text-sm font-semibold text-stone-950 transition hover:bg-white/55"
                  href={supportWhatsAppUrl}
                  target="_blank"
                >
                  <WhatsAppIcon className="text-[#154f3b]" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </Link>
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
                          : "bg-white/28 font-semibold text-stone-950"
                        : isActive
                          ? "bg-white/85 font-semibold text-stone-950"
                          : "bg-white/18 text-stone-900"
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

        <div className="border-b border-stone-200 bg-[#fff8f2]">
          <div className="mx-auto flex max-w-[1320px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
            {quickAccessItems.map((item) => (
              isCommercialQuizAction(item.action) ? (
                <SkinQuizTrigger
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#ef8f7b] bg-[#ffe6df] px-3 py-2 text-sm font-semibold text-stone-950 transition hover:bg-[#ffd8ce]"
                  key={`${item.name}-${item.order}`}
                  source="header"
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-white/65 px-2 text-[10px] font-semibold text-stone-900">
                    {item.icon ?? "Q"}
                  </span>
                  <span>{item.name}</span>
                </SkinQuizTrigger>
              ) : (
                <Link
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-800 transition hover:border-stone-400 hover:bg-[#fffdfb]"
                  href={resolveCommercialHref({ type: item.action, value: item.value })}
                  key={`${item.name}-${item.order}`}
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#ffe3da] px-2 text-[10px] font-semibold text-stone-900">
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
