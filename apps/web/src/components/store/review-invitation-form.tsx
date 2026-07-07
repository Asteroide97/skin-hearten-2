"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { StarIcon } from "@/components/shared/icons";
import { formatLongDate } from "@/lib/format";
import { trackEvent } from "@/lib/analytics";
import type { ReviewInvitation } from "@/lib/reviews";

type Notice =
  | {
      kind: "error" | "success";
      message: string;
    }
  | null;

type ReviewInvitationFormProps = {
  invitation: ReviewInvitation;
};

export function ReviewInvitationForm({ invitation }: ReviewInvitationFormProps) {
  const [status, setStatus] = useState(invitation.status);
  const [selectedProductId, setSelectedProductId] = useState<number>(invitation.selectedProductId ?? invitation.items[0]?.productId ?? 0);
  const [customerName, setCustomerName] = useState(invitation.customerName ?? "");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProduct = useMemo(
    () => invitation.items.find((item) => item.productId === selectedProductId) ?? null,
    [invitation.items, selectedProductId],
  );

  useEffect(() => {
    trackEvent("review_started", {
      product_id: selectedProduct ? String(selectedProduct.productId) : undefined,
      product_name: selectedProduct?.productName,
      source: "verified_reviews",
    });
  }, [selectedProduct]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedBody = body.trim();
    const normalizedTitle = title.trim();
    const normalizedName = customerName.trim();

    if (!selectedProductId) {
      setFieldError("Selecciona uno de los productos del pedido.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setFieldError("Selecciona una calificacion.");
      return;
    }
    if (normalizedBody.length < 10) {
      setFieldError("Comparte una experiencia un poco mas completa.");
      return;
    }

    setFieldError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/reviews/invitations/${encodeURIComponent(invitation.token)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProductId,
          rating,
          title: normalizedTitle.length > 0 ? normalizedTitle : undefined,
          body: normalizedBody,
          customerName: normalizedName.length > 0 ? normalizedName : undefined,
        }),
      });
      const result = (await response.json()) as
        | { ok: true }
        | { ok: false; message?: string };

      if (!response.ok || !result.ok) {
        setNotice({
          kind: "error",
          message:
            !result.ok && result.message
              ? result.message
              : "No pudimos recibir tu resena en este momento.",
        });
        return;
      }

      setStatus("submitted");
      setNotice({
        kind: "success",
        message: "Gracias. Tu resena sera revisada antes de publicarse.",
      });
      trackEvent("review_submitted", {
        product_id: selectedProduct ? String(selectedProduct.productId) : undefined,
        product_name: selectedProduct?.productName,
        rating,
        source: "verified_reviews",
        verified: true,
      });
    } catch {
      setNotice({
        kind: "error",
        message: "No pudimos recibir tu resena en este momento.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
      <aside className="rounded-[1.8rem] bg-[#f5ece3] p-6 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Invitacion verificada</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-stone-950">Comparte tu experiencia real</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          Esta invitacion valida tu pedido y deja tu opinion en revision antes de publicarse.
        </p>

        <div className="mt-8 space-y-4 rounded-[1.5rem] border border-stone-200 bg-white p-5">
          <InfoRow label="Pedido" value={invitation.orderNumber} />
          <InfoRow label="Cliente" value={invitation.customerName ?? "Compra verificada"} />
          <InfoRow
            label="Vigencia"
            value={invitation.expiresAt ? `Disponible hasta ${formatLongDate(invitation.expiresAt)}` : "Sin fecha limite"}
          />
        </div>

        <div className="mt-6 space-y-3">
          {invitation.items.map((item, index) => (
            <div
              className={`rounded-[1.4rem] border px-4 py-4 text-sm ${
                item.productId === selectedProductId ? "border-stone-900 bg-white text-stone-950" : "border-stone-200 bg-white/70 text-stone-600"
              }`}
              key={`${item.productId}-${index}`}
            >
              <p className="font-semibold">{item.productName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">Producto del pedido</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link className="btn-secondary" href="/reviews">
            Ver resenas publicadas
          </Link>
          <Link className="btn-ghost px-0 py-0 text-stone-900" href="/productos">
            Volver a la tienda
          </Link>
        </div>
      </aside>

      <section className="soft-panel rounded-[1.8rem] p-5 sm:p-6">
        {status === "pending" ? (
          <>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">Formulario corto</p>
              <h2 className="mt-2 font-serif text-3xl text-stone-900">Tu resena quedara como compra verificada</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Escribe solo lo importante: como se sintio, que notaste y si volverias a usarlo.
              </p>
            </div>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              {invitation.selectedProductId ? (
                <div className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Producto</p>
                  <p className="mt-2 font-medium text-stone-950">{selectedProduct?.productName}</p>
                </div>
              ) : (
                <label className="block">
                  <span className="text-sm font-semibold text-stone-900">Producto comprado</span>
                  <select
                    className="mt-3 w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
                    onChange={(event) => {
                      setSelectedProductId(Number(event.target.value));
                    }}
                    value={selectedProductId}
                  >
                    <option value={0}>Selecciona un producto</option>
                    {invitation.items.map((item) => (
                      <option key={item.productId} value={item.productId}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label className="block">
                <span className="text-sm font-semibold text-stone-900">Nombre visible opcional</span>
                <input
                  className="mt-3 w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
                  onChange={(event) => {
                    setCustomerName(event.target.value);
                  }}
                  placeholder="Como quieres aparecer"
                  value={customerName}
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-900">Titulo opcional</span>
                <input
                  className="mt-3 w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
                  onChange={(event) => {
                    setTitle(event.target.value);
                  }}
                  placeholder="Ejemplo: Muy comodo para uso diario"
                  value={title}
                />
              </label>

              <div>
                <p className="text-sm font-semibold text-stone-900">Calificacion</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const ratingValue = index + 1;
                    const isActive = rating >= ratingValue;

                    return (
                      <button
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition ${
                          isActive
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-300 bg-white text-stone-700 hover:border-stone-500"
                        }`}
                        key={ratingValue}
                        onClick={() => {
                          setRating(ratingValue);
                        }}
                        type="button"
                      >
                        <StarIcon className={isActive ? "text-amber-300" : "text-stone-400"} />
                        {ratingValue}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block">
                <span className="text-sm font-semibold text-stone-900">Comentario</span>
                <textarea
                  className="mt-3 min-h-40 w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-stone-700 outline-none transition focus:border-stone-500"
                  onChange={(event) => {
                    setBody(event.target.value);
                  }}
                  placeholder="Cuentanos como te fue con el producto y como se sintio en tu piel."
                  value={body}
                />
              </label>

              {fieldError ? (
                <div className="rounded-[1.4rem] border border-[#ead0c7] bg-[#fff6f2] px-4 py-4 text-sm text-[#8a4d3b]">
                  {fieldError}
                </div>
              ) : null}

              {notice ? (
                <div
                  className={`rounded-[1.4rem] border px-4 py-4 text-sm leading-7 ${
                    notice.kind === "success"
                      ? "border-[#d8e3cf] bg-[#f5faf1] text-[#476638]"
                      : "border-[#ead0c7] bg-[#fff6f2] text-[#8a4d3b]"
                  }`}
                >
                  {notice.message}
                </div>
              ) : null}

              <button
                className="inline-flex w-full items-center justify-center rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Enviando..." : "Enviar resena verificada"}
              </button>
            </form>
          </>
        ) : (
          <div className="flex min-h-[420px] flex-col justify-center rounded-[1.6rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
            <p className="font-serif text-3xl text-stone-950">
              {status === "submitted" ? "Esta invitacion ya fue utilizada" : "Esta invitacion expiro"}
            </p>
            <p className="mt-4 text-sm leading-7 text-stone-600">
              {status === "submitted"
                ? "Gracias por compartir tu experiencia. Tu resena esta en revision."
                : "Si necesitas un nuevo enlace, escribe a soporte o responde al mensaje donde recibiste la invitacion."}
            </p>
            {notice ? (
              <div className="mx-auto mt-6 max-w-lg rounded-[1.4rem] border border-[#d8e3cf] bg-[#f5faf1] px-4 py-4 text-sm text-[#476638]">
                {notice.message}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm text-stone-800">{value}</p>
    </div>
  );
}
