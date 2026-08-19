const SUPPORT_WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";

export function buildSupportWhatsAppHref(message: string) {
  if (!SUPPORT_WHATSAPP_NUMBER) {
    return null;
  }

  return `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
