"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { trackEvent } from "@/lib/analytics";
import type { GuidedCatalogProduct } from "@/lib/guided-catalog";

type SiteFrameProps = {
  catalogProducts: GuidedCatalogProduct[];
  children: React.ReactNode;
};

export function SiteFrame({ catalogProducts, children }: SiteFrameProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return (
      <div className="app-shell min-h-screen bg-[linear-gradient(180deg,#f8f4ef_0%,#f5f0e9_100%)]">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  return (
    <div className="app-shell flex min-h-screen flex-col">
      <Suspense fallback={null}>
        <SiteVisitTracker pathname={pathname} />
      </Suspense>
      <SiteHeader catalogProducts={catalogProducts} />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteVisitTracker({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const source =
      pathname === "/"
        ? "home"
        : pathname.startsWith("/producto/")
          ? "product"
          : pathname.startsWith("/productos")
            ? "products"
            : pathname.startsWith("/blog")
              ? "blog"
              : pathname.startsWith("/carrito")
                ? "cart"
                : pathname.startsWith("/checkout")
                  ? "checkout"
                  : pathname.startsWith("/reviews")
                    ? "reviews"
                    : "home";

    trackEvent("site_visit", {
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      source,
    });
  }, [pathname, searchKey]);

  return null;
}
