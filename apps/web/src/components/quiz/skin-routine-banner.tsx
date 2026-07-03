"use client";

import Link from "next/link";

import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { CheckCircleIcon } from "@/components/shared/icons";
import { useStoredSkinQuizResult } from "@/hooks/use-stored-skin-quiz-result";
import {
  getSkinQuizGoalLabel,
  getSkinQuizSkinTypeLabel,
} from "@/lib/skin-quiz";
import { cn } from "@/lib/utils";

type SkinRoutineBannerProps = {
  context: "product" | "cart" | "checkout" | "thankyou";
  className?: string;
  productId?: string;
  productName?: string;
};

export function SkinRoutineBanner({
  className,
  context,
  productId,
  productName,
}: SkinRoutineBannerProps) {
  const result = useStoredSkinQuizResult();

  if (!result) {
    return (
      <section className={cn("rounded-[2rem] bg-[#f7efe7] p-5 sm:p-6", className)}>
        <p className="section-label">Diagnostico guiado</p>
        <h2 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">
          {context === "product" ? "Quieres saber si va con tu piel?" : "Tu rutina puede empezar antes del checkout."}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
          {context === "product"
            ? "Responde el Skin Quiz y te diremos si este producto encaja con tu objetivo y con que conviene combinarlo."
            : "El Skin Quiz ordena la seleccion segun tu piel, tu tiempo y lo que quieres mejorar."}
        </p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <SkinQuizTrigger className="btn-primary" source="home">
            Encontrar mi rutina
          </SkinQuizTrigger>
          <SkinQuizTrigger className="btn-secondary" source="home">
            Diagnostico en 2 minutos
          </SkinQuizTrigger>
        </div>
      </section>
    );
  }

  const isRecommendedProduct = productId ? result.recommendedProductIds.includes(productId) : false;
  const heading =
    context === "product"
      ? isRecommendedProduct
        ? "Recomendado para tu piel"
        : "Puede encajar con tu rutina"
      : context === "thankyou"
        ? "Tu rutina sigue aqui"
        : "Tu diagnostico ya esta guiando esta rutina";
  const description =
    context === "product"
      ? isRecommendedProduct
        ? `${productName ?? "Este producto"} aparece dentro de tu seleccion recomendada para ${getSkinQuizGoalLabel(result.answers.goal)}.`
        : `Tu diagnostico actual busca ${getSkinQuizGoalLabel(result.answers.goal)} y puede ayudarte a decidir si ${productName ?? "este producto"} tiene sentido para tu piel.`
      : context === "checkout"
        ? `Tu piel ${getSkinQuizSkinTypeLabel(result.answers.skinType)} con foco en ${getSkinQuizGoalLabel(result.answers.goal)} ya tiene una guia guardada.`
        : context === "thankyou"
          ? "Cuando llegue tu pedido, puedes volver a tu resultado para recordar orden, frecuencia y objetivos."
          : `Tu piel ${getSkinQuizSkinTypeLabel(result.answers.skinType)} sigue siendo la referencia para lo que estas llevando hoy.`;

  return (
    <section className={cn("rounded-[2rem] bg-[#f3e8de] p-5 sm:p-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <p className="section-label">Para tu piel</p>
          <h2 className="font-serif text-[2rem] leading-[0.98] text-stone-950">{heading}</h2>
          <p className="max-w-2xl text-sm leading-7 text-stone-600">{description}</p>
          <div className="flex flex-wrap gap-2">
            <span className="admin-chip">Piel {getSkinQuizSkinTypeLabel(result.answers.skinType)}</span>
            <span className="admin-chip">Objetivo {getSkinQuizGoalLabel(result.answers.goal)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:min-w-[220px]">
          <Link className="btn-primary" href={result.collectionHref}>
            Ver mi rutina
          </Link>
          <SkinQuizTrigger className="btn-secondary" source="home">
            Ajustar diagnostico
          </SkinQuizTrigger>
        </div>
      </div>

      {context === "thankyou" ? (
        <div className="mt-5 flex items-start gap-3 rounded-[1.6rem] bg-white/80 px-4 py-4">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-stone-900" />
          <p className="text-sm leading-7 text-stone-700">
            No volveremos a preguntarte al entrar. Tu rutina queda guardada como referencia para reaplicar y reponer.
          </p>
        </div>
      ) : null}
    </section>
  );
}
