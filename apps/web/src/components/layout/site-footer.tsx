import Link from "next/link";

import { resolveCommercialHref, type CommercialContent } from "@/lib/commercial-content";

export function SiteFooter({ commercialContent }: { commercialContent: CommercialContent }) {
  const footer = commercialContent.footer;
  const contactLines = footer.contactLines.filter((line) => line.trim().length > 0);
  const footerColumns = footer.columns.filter((column) => column.links.length > 0);
  const legalLinks = footer.legalLinks.filter((link) => link.value.trim().length > 0);
  const socialLinks = footer.socialLinks.filter((link) => link.url.trim().length > 0);

  return (
    <footer className="border-t border-stone-200 bg-[#f6f1ea]">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr_0.8fr_0.9fr] lg:px-8">
        <div className="space-y-4">
          <p className="font-serif text-[2rem] leading-none text-stone-950">{commercialContent.header.logoText}</p>
          {footer.introText ? (
            <p className="max-w-sm text-sm leading-7 text-stone-600">
              {footer.introText}
            </p>
          ) : null}
          {footer.noticeText ? (
            <p className="max-w-sm text-xs leading-6 text-stone-500">{footer.noticeText}</p>
          ) : null}
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">Contacto</p>
          {contactLines.length > 0 ? (
            contactLines.map((line) => (
              <p key={line}>{line}</p>
            ))
          ) : (
            <p>La informacion de contacto se muestra aqui cuando este configurada.</p>
          )}
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">{footerColumns[0]?.title ?? "Explorar"}</p>
          {(footerColumns[0]?.links ?? []).map((link) => (
            <Link className="block hover:text-stone-950" href={resolveCommercialHref(link)} key={`${link.label}-${link.value}`}>
              {link.label}
            </Link>
          ))}
        </div>
        <div className="space-y-3 text-sm text-stone-600">
          <p className="section-label">Legal y redes</p>
          {legalLinks.map((link) => (
            <Link className="block hover:text-stone-950" href={resolveCommercialHref(link)} key={`${link.label}-${link.value}`}>
              {link.label}
            </Link>
          ))}
          {socialLinks.map((socialLink) => (
            <Link className="block hover:text-stone-950" href={socialLink.url} key={socialLink.label} target="_blank">
              {socialLink.label}
            </Link>
          ))}
          {legalLinks.length === 0 && socialLinks.length === 0 ? (
            <p>Las rutas legales y sociales se mantienen ocultas hasta tener datos reales.</p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
