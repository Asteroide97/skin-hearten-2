"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { SkinRoutineBanner } from "@/components/quiz/skin-routine-banner";
import { SectionHeading } from "@/components/shared/section-heading";
import {
  hasCheckoutSuccessBeenTracked,
  markCheckoutSuccessTracked,
  readLastCheckoutOrder,
  type StoredCheckoutOrder,
} from "@/lib/checkout";
import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";

const whatsappHref =
  "https://wa.me/525500000000?text=Hola%20Skin%20Hearten%2C%20tengo%20dudas%20sobre%20mi%20pedido.";

export default function CheckoutThankYouPage() {
  const [order, setOrder] = useState<StoredCheckoutOrder | null>(null);

  useEffect(() => {
    const latestOrder = readLastCheckoutOrder();
    setOrder(latestOrder);

    if (!latestOrder || hasCheckoutSuccessBeenTracked(latestOrder.orderId)) {
      return;
    }

    trackEvent("checkout_completed", {
      cart_total: latestOrder.total,
      item_count: 0,
      order_id: latestOrder.orderId,
      order_number: latestOrder.orderNumber,
      payment_method:
        latestOrder.nextAction.type === "redirect" ? latestOrder.nextAction.provider : "mock",
      payment_status: latestOrder.paymentStatus,
    });
    markCheckoutSuccessTracked(latestOrder.orderId);
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-5 py-8 sm:px-6 lg:px-8">
      <SectionHeading
        eyebrow="Pedido recibido"
        title="Recibimos tu pedido"
        description="Guardamos el resumen mas reciente para que puedas revisar numero, total y estado desde esta pantalla."
      />

      <SkinRoutineBanner context="thankyou" />

      {order ? (
        <section className="soft-panel rounded-[2rem] p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                Confirmacion
              </p>
              <h2 className="mt-3 font-serif text-4xl text-stone-900">{order.orderNumber}</h2>
              <p className="mt-4 text-sm leading-7 text-stone-600">
                {order.customerName.length > 0
                  ? `${order.customerName}, recibimos tu pedido y ya quedo registrado en el flujo actual.`
                  : "Recibimos tu pedido y ya quedo registrado en el flujo actual."}
              </p>
            </div>

            <div className="rounded-[1.8rem] border border-stone-200 bg-white p-5">
              <div className="space-y-4 text-sm text-stone-700">
                <div className="flex items-center justify-between">
                  <span>Estado de orden</span>
                  <span className="font-semibold capitalize text-stone-900">{order.status}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estado de pago</span>
                  <span className="font-semibold capitalize text-stone-900">
                    {order.paymentStatus.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Descuento</span>
                  <span>-{formatCurrency(order.discount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Envio</span>
                  <span>{order.shipping === 0 ? "Gratis" : formatCurrency(order.shipping)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white"
              href={whatsappHref}
              rel="noreferrer"
              target="_blank"
            >
              WhatsApp para dudas
            </a>
            <Link
              className="inline-flex items-center justify-center rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-800"
              href="/productos"
            >
              Volver a la seleccion
            </Link>
          </div>
        </section>
      ) : (
        <section className="soft-panel rounded-[2rem] p-8 text-center">
          <h2 className="font-serif text-3xl text-stone-900">No encontramos un pedido reciente</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Completa el checkout cuando tu rutina este lista o vuelve a la seleccion para empezar de nuevo.
          </p>
          <Link
            className="mt-6 inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white"
            href="/productos"
          >
            Ir a la seleccion
          </Link>
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.8rem] bg-[#f7efe7] p-5 sm:p-6">
          <p className="section-label">Como aplicarla</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">Manana y noche, sin prisa.</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Empieza por limpiador, sigue con tratamiento o serum, sella con hidratante y no olvides el protector solar por la manana.
          </p>
        </article>
        <article className="rounded-[1.8rem] bg-[#fbf4ec] p-5 sm:p-6">
          <p className="section-label">Que esperar</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">Primero constancia, luego cambio visible.</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Las primeras semanas suelen sentirse en textura y confort. Los cambios de tono, firmeza o brotes se sostienen con uso continuo.
          </p>
        </article>
        <article className="rounded-[1.8rem] bg-[#eef2ed] p-5 sm:p-6">
          <p className="section-label">Siguiente compra</p>
          <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">Tu rutina se repone, no se improvisa.</h2>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            Cuando notes que tu hidratante o tratamiento baja, vuelve a tu seleccion guardada para reponer sin empezar de cero.
          </p>
        </article>
      </section>
    </div>
  );
}
