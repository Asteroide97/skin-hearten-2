"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import Link from "next/link";

import { trackEvent } from "@/lib/analytics";

type HeroCtaLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "children" | "href"> & {
  children: ReactNode;
  destination: string;
  href: string;
};

export function HeroCtaLink({
  children,
  destination,
  href,
  onClick,
  ...props
}: HeroCtaLinkProps) {
  const label = typeof children === "string" ? children : "CTA";

  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        trackEvent("hero_cta_clicked", {
          destination,
          label,
          location: "hero",
        });
        onClick?.(event);
      }}
    >
      {children}
    </Link>
  );
}
