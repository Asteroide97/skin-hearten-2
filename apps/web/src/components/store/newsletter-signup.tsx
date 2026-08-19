"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { trackEvent } from "@/lib/analytics";
import {
  newsletterSubscriptionSchema,
  type NewsletterSubscriptionValues,
} from "@/schemas/newsletter-subscription";

type Notice =
  | {
      kind: "error" | "success";
      message: string;
    }
  | null;

export function NewsletterSignup() {
  const form = useForm<NewsletterSubscriptionValues>({
    resolver: zodResolver(newsletterSubscriptionSchema),
    defaultValues: {
      firstName: "",
      email: "",
      acceptedMarketing: false,
    },
  });
  const [notice, setNotice] = useState<Notice>(null);

  async function handleSubmit(values: NewsletterSubscriptionValues) {
    setNotice(null);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
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
              : "No pudimos guardar tu suscripcion por ahora.",
        });
        return;
      }

      form.reset({
        firstName: values.firstName,
        email: values.email,
        acceptedMarketing: true,
      });
      setNotice({
        kind: "success",
        message: "Tu suscripcion quedo registrada. Te contactaremos cuando la integracion este lista para enviar novedades.",
      });
      trackEvent("newsletter_subscribed", { source: "home" });
    } catch {
      setNotice({
        kind: "error",
        message: "No pudimos guardar tu suscripcion por ahora.",
      });
    }
  }

  return (
    <section className="overflow-hidden rounded-[2.8rem] border border-[#ece3d8] bg-[linear-gradient(135deg,#fbf5ef_0%,#f2e8ed_100%)] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
        <div className="space-y-4">
          <p className="section-label">Newsletter</p>
          <h2 className="max-w-[12ch] text-[2.8rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-950 sm:text-[3.35rem]">
            Novedades utiles. Sin ruido.
          </h2>
          <p className="max-w-xl text-base leading-8 text-stone-600">
            Guias cortas, lanzamientos y recordatorios de rutina. Solo te escribimos si aceptas recibir comunicacion comercial y educativa.
          </p>
        </div>

        <form
          className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/88 p-5 shadow-[0_18px_44px_rgba(31,24,19,0.06)] sm:p-6"
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-stone-900">Nombre</span>
              <input
                className="mt-3 w-full rounded-[1.1rem] border border-[#ece3d8] bg-[#fdf8f4] px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
                placeholder="Tu nombre"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName?.message ? (
                <p className="mt-2 text-xs text-red-600">{form.formState.errors.firstName.message}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-stone-900">Email</span>
              <input
                className="mt-3 w-full rounded-[1.1rem] border border-[#ece3d8] bg-[#fdf8f4] px-4 py-3 text-sm text-stone-700 outline-none transition focus:border-stone-500"
                placeholder="tu@email.com"
                {...form.register("email")}
              />
              {form.formState.errors.email?.message ? (
                <p className="mt-2 text-xs text-red-600">{form.formState.errors.email.message}</p>
              ) : null}
            </label>
          </div>

          <label className="flex items-start gap-3 rounded-[1.25rem] border border-[#ece3d8] bg-[#fdf8f4] px-4 py-4 text-sm leading-6 text-stone-600">
            <input className="mt-1 h-4 w-4" type="checkbox" {...form.register("acceptedMarketing")} />
            <span>
              Acepto recibir comunicacion comercial y educativa de Skin Hearten en este email.
            </span>
          </label>
          {form.formState.errors.acceptedMarketing?.message ? (
            <p className="text-xs text-red-600">{form.formState.errors.acceptedMarketing.message}</p>
          ) : null}

          {notice ? (
            <div
              className={`rounded-[1.3rem] border px-4 py-4 text-sm leading-7 ${
                notice.kind === "success"
                  ? "border-[#d8e3cf] bg-[#f5faf1] text-[#476638]"
                  : "border-[#ead0c7] bg-[#fff6f2] text-[#8a4d3b]"
              }`}
            >
              {notice.message}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-6 text-stone-500">
              Si la API publica no esta configurada, te lo mostramos con error claro. No fingimos suscripciones activas.
            </p>
            <button
              className="btn-primary px-5 py-3.5"
              disabled={form.formState.isSubmitting}
              type="submit"
            >
              {form.formState.isSubmitting ? "Guardando..." : "Quiero recibir novedades"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
