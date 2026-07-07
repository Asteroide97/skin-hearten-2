import Link from "next/link";

import { resolveCommercialHref, type CommercialContent } from "@/lib/commercial-content";

export function SiteFooter({ commercialContent }: { commercialContent: CommercialContent }) {
  const footer = commercialContent.footer;

  return (
    <footer className="border-t border-stone-200 bg-[#f6f1ea]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.15fr_0.75fr_0.75fr_0.85fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-serif text-[2rem] leading-none text-stone-950">{commercialContent.header.logoText}</p>
          <p className="max-w-sm text-sm leading-7 text-stone-600">
            {footer.introText}
          </p>
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">Contacto</p>
          {footer.contactLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">{footer.columns[0]?.title ?? "Explorar"}</p>
          {(footer.columns[0]?.links ?? []).map((link) => (
            <Link className="block hover:text-stone-950" href={resolveCommercialHref(link)} key={`${link.label}-${link.value}`}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">Legal</p>
          {footer.legalLinks.map((link) => (
            <Link className="block hover:text-stone-950" href={resolveCommercialHref(link)} key={`${link.label}-${link.value}`}>
              {link.label}
            </Link>
          ))}
          {footer.socialLinks.map((socialLink) => (
            <Link className="block hover:text-stone-950" href={socialLink.url} key={socialLink.label} target="_blank">
              {socialLink.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
