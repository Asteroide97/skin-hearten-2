"use client";

import Link from "next/link";

import { useStoredSkinQuizResult } from "@/hooks/use-stored-skin-quiz-result";
import {
  getSkinQuizCommitmentLabel,
  getSkinQuizGoalLabel,
  getSkinQuizSkinTypeLabel,
} from "@/lib/skin-quiz";
import { SkinQuizTrigger } from "@/components/quiz/skin-quiz-trigger";
import { ArrowUpRightIcon, CheckCircleIcon } from "@/components/shared/icons";

const guidedSteps = [
  {
    eyebrow: "1. Te entendemos",
    title: "Primero hablamos de piel, no de producto.",
    description: "Empiezas por manchas, sensibilidad, hidratacion o brotes. No por un catalogo infinito.",
  },
  {
    eyebrow: "2. Conocemos tu piel",
    title: "El diagnostico toma dos minutos.",
    description: "Tipo de piel, objetivo, sensibilidad y tiempo real para seguir una rutina.",
  },
  {
    eyebrow: "3. Te recomendamos una rutina",
    title: "Manana y noche, paso por paso.",
    description: "Una guia clara para usar menos, pero usar mejor.",
  },
  {
    eyebrow: "4. Aqui estan los productos",
    title: "Solo despues llegan los esenciales.",
    description: "Cada recomendacion ya tiene una razon de estar en tu rutina.",
  },
];

export function SkinRoutineGuide() {
  const result = useStoredSkinQuizResult();

  if (result) {
    return (
      <section className="overflow-hidden rounded-[2.6rem] bg-[#f3e9de] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
          <div className="space-y-5">
            <p className="section-label">Tu rutina</p>
            <h2 className="max-w-lg font-serif text-[2.6rem] leading-[0.96] text-stone-950 sm:text-[3.25rem]">
              Ya conocemos tu piel.
            </h2>
            <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
              Guardamos tu diagnostico para que la tienda te hable de rutina, no de catalogo.
            </p>

            <div className="flex flex-wrap gap-2">
              <span className="admin-chip">Piel {getSkinQuizSkinTypeLabel(result.answers.skinType)}</span>
              <span className="admin-chip">Objetivo {getSkinQuizGoalLabel(result.answers.goal)}</span>
              <span className="admin-chip">Rutina {getSkinQuizCommitmentLabel(result.answers.timeCommitment)}</span>
            </div>

            <p className="max-w-xl text-sm leading-7 text-stone-700">{result.summary}</p>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link className="btn-primary" href={result.collectionHref}>
                Ver rutina
              </Link>
              <SkinQuizTrigger className="btn-secondary" source="home">
                Ajustar diagnostico
              </SkinQuizTrigger>
            </div>

            <div className="rounded-[1.8rem] bg-white/75 px-5 py-5">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-stone-900" />
                <p className="text-sm leading-7 text-stone-700">
                  No volveremos a preguntarte al entrar. Si algo cambia, puedes ajustar tu rutina cuando quieras.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <RoutinePreview
              eyebrow="Rutina manana"
              title="Lo que tu piel necesita al empezar el dia."
              steps={result.amRoutine.map((step) => ({
                note: step.note,
                slot: step.slot,
                title: step.product.name,
              }))}
            />
            <RoutinePreview
              eyebrow="Rutina noche"
              title="La parte que trabaja mientras descansas."
              steps={result.pmRoutine.map((step) => ({
                note: step.note,
                slot: step.slot,
                title: step.product.name,
              }))}
            />
            <article className="rounded-[2rem] border border-stone-200/80 bg-white/82 p-5 lg:col-span-2">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-label">Productos ideales para ti</p>
                  <h3 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">
                    Seleccionados desde tu diagnostico
                  </h3>
                </div>
                <Link className="btn-ghost px-0 py-0 text-stone-950" href={result.collectionHref}>
                  Ver seleccion
                </Link>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {result.recommendedProducts.slice(0, 4).map((product) => (
                  <div className="border-t border-stone-200 pt-4" key={product.id}>
                    <p className="text-xs text-stone-500">{product.category}</p>
                    <p className="mt-2 text-sm font-semibold text-stone-950">{product.name}</p>
                    <p className="mt-2 text-sm leading-6 text-stone-600">{product.highlight}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-8 rounded-[2.6rem] bg-[#f7efe7] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[0.74fr_1.26fr] lg:items-end">
        <div className="space-y-4">
          <p className="section-label">Diagnostico guiado</p>
          <h2 className="max-w-lg font-serif text-[2.7rem] leading-[0.96] text-stone-950 sm:text-[3.35rem]">
            Primero tu piel. Luego tu rutina.
          </h2>
          <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
            El recorrido cambia: te entendemos, diagnosticamos y despues te mostramos lo que realmente vale la pena usar.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap lg:justify-end">
          <SkinQuizTrigger className="btn-primary" source="home">
            Encontrar mi rutina
          </SkinQuizTrigger>
          <SkinQuizTrigger className="btn-secondary" source="home">
            Diagnostico en 2 minutos
          </SkinQuizTrigger>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        {guidedSteps.map((step) => (
          <article className="rounded-[2rem] bg-white/82 p-5" key={step.eyebrow}>
            <p className="section-label">{step.eyebrow}</p>
            <h3 className="mt-4 font-serif text-[2rem] leading-[0.98] text-stone-950">
              {step.title}
            </h3>
            <p className="mt-4 text-sm leading-7 text-stone-600">{step.description}</p>
          </article>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        El diagnostico no te empuja a comprar.
        <ArrowUpRightIcon />
      </div>
    </section>
  );
}

function RoutinePreview({
  eyebrow,
  steps,
  title,
}: {
  eyebrow: string;
  title: string;
  steps: Array<{ slot: string; title: string; note: string }>;
}) {
  return (
    <article className="rounded-[2rem] border border-stone-200/80 bg-white/82 p-5">
      <p className="section-label">{eyebrow}</p>
      <h3 className="mt-3 font-serif text-[2rem] leading-[0.98] text-stone-950">{title}</h3>
      <div className="mt-5 space-y-4">
        {steps.map((step, index) => (
          <div className="border-t border-stone-200 pt-4" key={`${eyebrow}-${step.slot}-${index}`}>
            <p className="text-xs font-semibold tracking-[0.12em] text-stone-500">Paso {index + 1}</p>
            <p className="mt-2 text-sm font-semibold text-stone-950">{step.slot}</p>
            <p className="mt-1 text-sm text-stone-700">{step.title}</p>
            <p className="mt-2 text-sm leading-6 text-stone-600">{step.note}</p>
          </div>
        ))}
      </div>
    </article>
  );
}
