"use client";

import Link from "next/link";

import { ArrowUpRightIcon } from "@/components/shared/icons";
import { trackEvent, type NeedAnalyticsValue } from "@/lib/analytics";

type NeedCardLinkProps = {
  accent: string;
  analyticsNeed: NeedAnalyticsValue;
  description: string;
  eyebrow: string;
  href: string;
  title: string;
};

export function NeedCardLink({
  accent,
  analyticsNeed,
  description,
  eyebrow,
  href,
  title,
}: NeedCardLinkProps) {
  return (
    <Link
      className="group relative overflow-hidden rounded-[2rem] border border-[#ece3d8] bg-white shadow-[0_18px_40px_rgba(31,24,19,0.04)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_54px_rgba(31,24,19,0.08)]"
      href={href}
      onClick={() => {
        trackEvent("need_card_click", {
          need: analyticsNeed,
        });
      }}
    >
      <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${accent}`} />
      <div className="absolute right-5 top-5 rounded-full border border-[#ebe1d6] bg-[#fbf5ef] p-2 text-stone-700 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
        <ArrowUpRightIcon />
      </div>
      <div className="relative flex min-h-[190px] flex-col justify-between p-6">
        <div>
          <p className="section-label">{eyebrow}</p>
          <h3 className="mt-7 max-w-[10rem] text-[1.9rem] font-semibold leading-[0.96] tracking-[-0.05em] text-stone-950">
            {title}
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-6 text-stone-600">{description}</p>
        </div>
        <p className="mt-5 text-sm font-semibold text-stone-900">Ver seleccion</p>
      </div>
    </Link>
  );
}
