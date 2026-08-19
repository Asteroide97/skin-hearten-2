"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { SkinQuizModal } from "@/components/quiz/skin-quiz-modal";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { CartIcon, SearchIcon, WhatsAppIcon } from "@/components/shared/icons";
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0),
  );
  const primaryNavItems = sortCommercialItems(commercialContent.navigation).filter((item) => item.active);
  const quickAccessItems = sortCommercialItems(commercialContent.quickLinks).filter((item) => item.active);
  const supportWhatsAppUrl = commercialContent.header.supportWhatsAppUrl?.trim() || null;
  const headerMessage = useMemo(() => {
    const values = [
      commercialContent.header.topLeftText?.trim(),
      commercialContent.header.topRightText?.trim(),
    ].filter(Boolean);

    return values.join(" • ");
  }, [commercialContent.header.topLeftText, commercialContent.header.topRightText]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <SkinQuizModal catalogProducts={catalogProducts} />
      <header className="sticky top-0 z-30 border-b border-[#ede3d7] bg-[rgba(255,252,248,0.96)] shadow-[0_14px_34px_rgba(31,24,19,0.05)] backdrop-blur-xl">
        <div className="bg-[#d4bfd5] px-4 py-2 text-center text-[11px] font-semibold tracking-[0.16em] text-white">
          {headerMessage || "ENVIO GRATIS EN COMPRAS MAYORES A $1,500"}
        </div>

        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-3 py-4">
            <Link
              className="min-w-0 truncate text-[1.85rem] font-semibold leading-none tracking-[-0.07em] text-stone-950 sm:text-[2rem]"
              href="/"
            >
              {commercialContent.header.logoText}
            </Link>

            <nav className="hidden min-w-0 items-center justify-center gap-1 lg:flex">
              {primaryNavItems.map((item) => {
                const href = resolveCommercialHref({ type: item.type, value: item.value });
                const isActive = isActivePath(pathname, href);

                return (
                  <Link
                    className={`inline-flex whitespace-nowrap rounded-full px-4 py-2.5 text-sm transition ${
                      isActive
                        ? "bg-[#f6efe8] font-semibold text-stone-950"
                        : "text-stone-700 hover:bg-white hover:text-stone-950"
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
              <button
                aria-controls="mobile-site-menu"
                aria-expanded={isMobileMenuOpen}
                aria-label={isMobileMenuOpen ? "Cerrar menu principal" : "Abrir menu principal"}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#e7ddd2] bg-white px-3 text-sm font-semibold text-stone-950 transition hover:border-stone-300 md:hidden"
                onClick={() => {
                  setIsMobileMenuOpen((current) => !current);
                }}
                type="button"
              >
                <span aria-hidden="true" className="flex h-3.5 w-4 flex-col justify-between">
                  <span className="block h-[1.5px] rounded-full bg-current" />
                  <span className="block h-[1.5px] rounded-full bg-current" />
                  <span className="block h-[1.5px] rounded-full bg-current" />
                </span>
              </button>

              <Link
                aria-label="Explorar productos"
                className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#e7ddd2] bg-white text-stone-900 transition hover:border-stone-300 hover:bg-[#fffdfa] sm:inline-flex"
                href="/productos"
              >
                <SearchIcon className="h-4 w-4" />
              </Link>

              {supportWhatsAppUrl ? (
                <Link
                  aria-label="Asesoria por WhatsApp"
                  className="hidden h-11 w-11 items-center justify-center rounded-full border border-[#e7ddd2] bg-white text-[#1a5b45] transition hover:border-stone-300 hover:bg-[#fffdfa] md:inline-flex"
                  href={supportWhatsAppUrl}
                  target="_blank"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                </Link>
              ) : null}

              <Link
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
                href="/carrito"
              >
                <CartIcon className="h-4 w-4" />
                <span className="hidden min-[430px]:inline">Tu rutina</span>
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs">{itemCount}</span>
              </Link>
            </div>
          </div>

          <div
            className={`grid overflow-hidden transition-[grid-template-rows,opacity,margin] duration-200 md:hidden ${
              isMobileMenuOpen ? "mb-4 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="min-h-0">
              <div
                className="rounded-[1.8rem] border border-[#ece2d8] bg-white/92 p-3 shadow-[0_20px_44px_rgba(31,24,19,0.08)]"
                id="mobile-site-menu"
              >
                <nav className="grid gap-2 min-[430px]:grid-cols-2">
                  {primaryNavItems.map((item) => {
                    const href = resolveCommercialHref({ type: item.type, value: item.value });
                    const isActive = isActivePath(pathname, href);

                    return (
                      <Link
                        className={`inline-flex min-h-11 items-center justify-between rounded-[1.2rem] px-3.5 py-3 text-sm transition ${
                          isActive
                            ? "bg-[#f6efe8] font-semibold text-stone-950"
                            : "border border-[#ece2d8] bg-[#fffdfa] text-stone-700"
                        }`}
                        href={href}
                        key={`mobile-panel-${item.name}-${item.order}`}
                      >
                        <span>{item.name}</span>
                        <span className="text-xs text-stone-500">Ir</span>
                      </Link>
                    );
                  })}
                </nav>

                <div className="mt-3 flex gap-2">
                  <Link
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#ece2d8] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-stone-950"
                    href="/productos"
                  >
                    <SearchIcon className="h-4 w-4" />
                    <span>Explorar</span>
                  </Link>
                  {supportWhatsAppUrl ? (
                    <Link
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full border border-[#ece2d8] bg-[#fffdfa] px-3 py-2 text-sm font-semibold text-stone-950"
                      href={supportWhatsAppUrl}
                      target="_blank"
                    >
                      <WhatsAppIcon className="h-4 w-4 text-[#1a5b45]" />
                      <span>WhatsApp</span>
                    </Link>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="scrollbar-none flex gap-2 overflow-x-auto border-t border-[#efe5da] py-3 md:py-4">
            {quickAccessItems.map((item) =>
              isCommercialQuizAction(item.action) ? (
                <SkinQuizTrigger
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#e9dfd3] bg-white px-3.5 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-300 hover:bg-[#fffdfa]"
                  key={`${item.name}-${item.order}`}
                  source="header"
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f6eee7] px-2 text-[10px] font-semibold text-stone-900">
                    {item.icon ?? "Q"}
                  </span>
                  <span>{item.name}</span>
                </SkinQuizTrigger>
              ) : (
                <Link
                  className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#e9dfd3] bg-white px-3.5 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-300 hover:bg-[#fffdfa]"
                  href={resolveCommercialHref({ type: item.action, value: item.value })}
                  key={`${item.name}-${item.order}`}
                >
                  <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[#f6eee7] px-2 text-[10px] font-semibold text-stone-900">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              ),
            )}
          </div>
        </div>
      </header>
    </>
  );
}
