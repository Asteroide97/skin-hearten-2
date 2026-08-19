"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";

import { trackEvent } from "@/lib/analytics";
import { formatCurrency } from "@/lib/format";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { SkinRoutineBanner } from "@/components/quiz/skin-routine-banner";
import { CouponApplyForm } from "@/components/store/coupon-apply-form";
import {
  getCartDiscount,
  getCartItemCount,
  getCartShipping,
  getCartSubtotal,
  getCartTotal,
  useCartStore,
} from "@/store/cart-store";

export function CartPage() {
  const { items, coupon, removeItem, updateQuantity } = useCartStore();

  const subtotal = useMemo(() => getCartSubtotal(items), [items]);
  const discount = useMemo(() => getCartDiscount(coupon), [coupon]);
  const shipping = useMemo(() => getCartShipping(subtotal, coupon), [coupon, subtotal]);
  const total = useMemo(() => getCartTotal(subtotal, discount, shipping), [discount, shipping, subtotal]);
  const itemCount = useMemo(() => getCartItemCount(items), [items]);

  useEffect(() => {
    trackEvent("cart_viewed", {
      cart_total: total,
      item_count: itemCount,
    });
  }, [itemCount, total]);

  return (
    <div className="space-y-8">
      <SkinRoutineBanner context="cart" />

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <section className="space-y-4">
        {items.length === 0 ? (
          <div className="soft-panel rounded-[1.8rem] p-8">
            <h2 className="font-serif text-3xl text-stone-900">Tu rutina aun no empieza</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-stone-600">
              Puedes empezar por un diagnostico corto o explorar esenciales si ya sabes lo que quieres mejorar.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <SkinQuizTrigger className="btn-primary" source="home">
                Encontrar mi rutina
              </SkinQuizTrigger>
              <Link
                className="btn-secondary"
                href="/productos"
              >
                Explorar esenciales
              </Link>
            </div>
          </div>
        ) : (
          items.map((item, index) => (
            <article
              className="soft-panel flex flex-col gap-4 rounded-[1.8rem] p-6 sm:flex-row sm:items-center sm:justify-between"
              key={item.productId}
            >
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">Paso {index + 1}</p>
                <h3 className="mt-2 text-xl font-semibold text-stone-900">{item.name}</h3>
                <p className="mt-2 text-sm text-stone-600">{formatCurrency(item.price)} por unidad</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                <input
                  aria-label={`Cantidad para ${item.name}`}
                  className="w-20 rounded-full border border-stone-200 bg-white px-4 py-2 text-center text-sm text-stone-700"
                  min={1}
                  onChange={(event) => updateQuantity(item.productId, Number(event.target.value))}
                  type="number"
                  value={item.quantity}
                />
                <button
                  aria-label={`Quitar ${item.name} de tu rutina`}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                  onClick={() => {
                    trackEvent("product_removed_from_cart", {
                      product_id: item.productId,
                      product_name: item.name,
                      quantity: item.quantity,
                      price: item.price,
                    });
                    removeItem(item.productId);
                  }}
                  type="button"
                >
                  Quitar
                </button>
              </div>
            </article>
          ))
        )}
        </section>

        <aside className="soft-panel h-fit rounded-[1.8rem] p-6">
          <h2 className="font-serif text-3xl text-stone-900">Tu rutina</h2>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            Una vista tranquila antes de envio, pago y confirmacion.
          </p>
          <div className="mt-6 space-y-4 text-sm text-stone-700">
            <div className="flex items-start justify-between gap-3">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Ajuste</span>
              <span>-{formatCurrency(discount)}</span>
            </div>
            <div className="flex items-start justify-between gap-3">
              <span>Envio</span>
              <span>{shipping === 0 ? "Protegido sin costo" : formatCurrency(shipping)}</span>
            </div>
            <div className="flex items-start justify-between gap-3 border-t border-stone-200 pt-4 text-base font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className="mt-8">
            <CouponApplyForm />
          </div>

          <div className="mt-8 space-y-3 rounded-[1.6rem] bg-white/80 px-4 py-4 text-sm leading-7 text-stone-600">
            <p>Productos originales.</p>
            <p>Envio protegido.</p>
            <p>Sin pruebas en animales.</p>
          </div>

          <Link
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
            href="/checkout"
          >
            Continuar con mi rutina
          </Link>
        </aside>
      </div>
    </div>
  );
}
