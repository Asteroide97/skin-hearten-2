"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  getIntelligencePriorityLabel,
  getIntelligenceScoreBandLabel,
  type IntelligenceAskResponse,
  type IntelligenceDashboard,
  type IntelligenceFunnelStep,
  type IntelligenceKPI,
  type IntelligenceQuestionAnswer,
  type IntelligenceRankedItem,
  type IntelligenceRecommendation,
  type IntelligenceStat,
} from "@/lib/admin-intelligence";
import { formatCurrency, formatDateTime } from "@/lib/format";

type DashboardApiResponse =
  | { ok: true; data: IntelligenceDashboard }
  | { ok: false; reason: string; message?: string };

type AskApiResponse =
  | { ok: true; data: IntelligenceAskResponse }
  | { ok: false; reason: string; message?: string };

const SOURCE_LINKS: Record<string, { href: string; label: string }> = {
  clientes: { href: "/admin/crm", label: "Abrir CRM" },
  crm: { href: "/admin/crm", label: "Abrir CRM" },
  cupones: { href: "/admin/cupones", label: "Ver cupones" },
  inventario: { href: "/admin/productos", label: "Ver productos" },
  resenas: { href: "/admin/reviews", label: "Ver resenas" },
  skin_quiz: { href: "/admin/skin-quiz-leads", label: "Ver leads" },
};

function getLoadMessage(reason: string | null) {
  if (!reason) {
    return "Todavia no hay suficiente actividad para construir una lectura ejecutiva util. Cuando entren ventas, pedidos, leads y CRM real, este modulo empezara a priorizar decisiones.";
  }

  if (reason === "api_url_missing") {
    return "Configura NEXT_PUBLIC_API_URL para conectar el Centro de Inteligencia con FastAPI.";
  }

  if (reason === "auth_failed") {
    return "Tu sesion de SuperAdmin no es valida o expiro. Vuelve a iniciar sesion.";
  }

  return "No fue posible cargar el Centro de Inteligencia ahora mismo. El resto del panel sigue aislado.";
}

function getToneClasses(tone: IntelligenceKPI["tone"]) {
  switch (tone) {
    case "positive":
      return "border-[#d8e3cf] bg-[#f3faf0] text-[#476638]";
    case "warning":
      return "border-[#ead9c8] bg-[#fff8f3] text-stone-800";
    case "critical":
      return "border-[#ead0c7] bg-[#fff6f2] text-[#8a4d3b]";
    case "neutral":
    default:
      return "border-stone-200 bg-white text-stone-700";
  }
}

function getPriorityClasses(priority: IntelligenceRecommendation["priority"]) {
  switch (priority) {
    case "critical":
      return "border-[#ead0c7] bg-[#fff6f2] text-[#8a4d3b]";
    case "high":
      return "border-[#ead9c8] bg-[#fff8f3] text-stone-800";
    case "medium":
      return "border-[#cfe0df] bg-[#eef8f7] text-[#2c6160]";
    case "low":
    default:
      return "border-stone-200 bg-white text-stone-600";
  }
}

function getSourceLink(source: string) {
  return SOURCE_LINKS[source] ?? { href: "/admin", label: "Abrir admin" };
}

function getPriorityStars(priority: IntelligenceRecommendation["priority"]) {
  switch (priority) {
    case "critical":
      return "★★★★★";
    case "high":
      return "★★★★☆";
    case "medium":
      return "★★★☆☆";
    case "low":
    default:
      return "★★☆☆☆";
  }
}

export function IntelligencePage() {
  const [dashboard, setDashboard] = useState<IntelligenceDashboard | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<IntelligenceAskResponse | null>(null);
  const [askError, setAskError] = useState<string | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/admin/intelligence", {
          cache: "no-store",
        });
        const payload = (await response.json()) as DashboardApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok) {
          setDashboard(null);
          setErrorReason(payload.ok ? "fetch_failed" : payload.reason);
          return;
        }

        setDashboard(payload.data);
        setErrorReason(null);
      } catch {
        if (!cancelled) {
          setDashboard(null);
          setErrorReason("fetch_failed");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const topCustomer = useMemo(() => dashboard?.analysis.priorityCustomers[0] ?? null, [dashboard]);

  async function submitQuestion(nextQuestion?: string) {
    const value = (nextQuestion ?? question).trim();
    if (!value) {
      setAskError("Escribe una pregunta concreta para consultar el motor.");
      return;
    }

    setIsAsking(true);
    setAskError(null);

    try {
      const response = await fetch("/api/admin/intelligence/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: value }),
      });
      const payload = (await response.json()) as AskApiResponse;

      if (!response.ok || !payload.ok) {
        setAskError(payload.ok ? "No pudimos responder esa consulta por ahora." : payload.message ?? "No pudimos responder esa consulta por ahora.");
        return;
      }

      setQuestion(value);
      setAnswer(payload.data);
    } catch {
      setAskError("No pudimos responder esa consulta por ahora.");
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <div className="admin-workspace admin-intelligence space-y-4">
      <section className="admin-panel px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-4xl">
            <p className="section-label">Centro de Inteligencia</p>
            <h1 className="mt-2 font-serif text-[2.8rem] leading-[0.94] text-stone-950 sm:text-[3.5rem]">
              Analisis para decidir mejor
            </h1>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              No muestra graficas por rutina. Responde preguntas de negocio con ventas, CRM, Skin Quiz, cupones, inventario y ordenes reales.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <MetricPill
              label="Actualizado"
              value={dashboard ? formatDateTime(dashboard.generatedAt) : isLoading ? "Cargando..." : "Sin datos"}
            />
            <MetricPill label="Motor" value={dashboard?.aiModule.provider === "rules" ? "Reglas" : "IA"} />
          </div>
        </div>
      </section>

      {isLoading ? (
        <section className="admin-panel p-4 sm:p-5">
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-52 rounded-full bg-stone-200" />
            <div className="grid gap-4 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div className="h-40 rounded-[1.4rem] bg-white" key={`intelligence-loading-${index}`} />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="h-72 rounded-[1.4rem] bg-white" />
              <div className="h-72 rounded-[1.4rem] bg-white" />
            </div>
          </div>
        </section>
      ) : dashboard ? (
        <>
          <section className="admin-panel p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
              <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5">
                <p className="section-label">Resumen ejecutivo</p>
                <h2 className="mt-2 font-serif text-2xl text-stone-950 sm:text-[2rem]">
                  {dashboard.executiveSummary.headline}
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-700">{dashboard.executiveSummary.summary}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {dashboard.executiveSummary.bullets.map((bullet) => (
                    <div
                      className="rounded-[1.1rem] border border-stone-200 bg-[#fff8f3] px-4 py-3 text-sm leading-6 text-stone-700"
                      key={bullet}
                    >
                      {bullet}
                    </div>
                  ))}
                </div>
              </article>

              <article className="soft-panel rounded-[1.5rem] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                  Prioridad comercial
                </p>
                <h2 className="mt-2 font-serif text-[2rem] leading-[0.98] text-stone-950">
                  {topCustomer ? topCustomer.name : "Sin cliente priorizado"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  {topCustomer
                    ? `${topCustomer.repurchaseScore}/100 de probabilidad de recompra con foco en ${topCustomer.mainGoal?.replaceAll("_", " ") ?? "rutina actual"}.`
                    : "Cuando haya mas compras cobradas y CRM real, aqui aparecera la siguiente clienta a contactar."}
                </p>
                {topCustomer ? (
                  <div className="mt-4 grid gap-3">
                    <MetaPill label="Ticket promedio" value={formatCurrency(topCustomer.averageTicket)} />
                    <MetaPill label="Estado" value={getIntelligenceScoreBandLabel(topCustomer.scoreBand)} />
                    <MetaPill
                      label="Canal"
                      value={topCustomer.whatsapp ?? topCustomer.email ?? "Sin canal disponible"}
                    />
                  </div>
                ) : null}
              </article>
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Business Intelligence"
              title="Resumen ejecutivo"
              description="Hoy, esta semana y este mes resumidos como lectura operativa."
            />
            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {dashboard.analysis.executivePeriods.map((period) => (
                <article
                  className={`rounded-[1.4rem] border p-5 ${getToneClasses(period.tone)}`}
                  key={period.id}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] opacity-75">
                    {period.label}
                  </p>
                  <h3 className="mt-3 text-lg font-semibold leading-7 text-current">{period.headline}</h3>
                  <div className="mt-4 space-y-2 text-sm leading-6 opacity-85">
                    {period.details.map((detail) => (
                      <p key={detail}>{detail}</p>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Skin Quiz Analytics"
              title="Que revela el quiz sobre la demanda"
              description="Lectura basada en quizzes persistidos, leads y compras relacionadas."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.analysis.skinQuizMetrics.map((metric) => (
                <StatCard key={metric.id} metric={metric} />
              ))}
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <QuestionGrid items={dashboard.analysis.skinQuizAnswers} />
              <div className="grid gap-4 md:grid-cols-2">
                <RankedList
                  emptyLabel="Todavia no hay suficientes recomendaciones persistidas."
                  items={dashboard.analysis.skinQuizRecommendedProducts}
                  title="Productos mas recomendados"
                />
                <RankedList
                  emptyLabel="Todavia no hay suficientes compras ligadas al quiz."
                  items={dashboard.analysis.skinQuizPurchasedProducts}
                  title="Productos realmente comprados"
                />
              </div>
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Routine Builder"
              title="Lo que las rutinas ya estan moviendo"
              description="Se interpreta con pedidos atribuidos a secuencias de rutina, no con clics sueltos."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {dashboard.analysis.routineBuilderMetrics.map((metric) => (
                <StatCard key={metric.id} metric={metric} />
              ))}
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
              <QuestionGrid items={dashboard.analysis.routineBuilderAnswers} />
              <RankedList
                emptyLabel="Todavia no hay una rutina dominante."
                items={dashboard.analysis.routineBuilderRoutines}
                title="Rutinas con mas salida"
              />
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Productos"
              title="Que producto necesita accion"
              description="Cada respuesta apunta a una decision de catalogo, margen o conversion."
            />
            <QuestionGrid items={dashboard.analysis.productAnswers} />
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Clientes"
              title="Que segmentos merecen atencion"
              description="Nuevas, activas, VIP, en riesgo y listas para recompra."
            />
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
              <QuestionGrid items={dashboard.analysis.customerAnswers} />
              <article className="rounded-[1.4rem] border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                      Prioridad hoy
                    </p>
                    <h3 className="mt-2 font-serif text-[1.8rem] text-stone-950">A quien contactar</h3>
                  </div>
                  <Link
                    className="rounded-full border border-stone-300 bg-white px-3 py-2 text-[11px] font-semibold text-stone-800 transition hover:border-stone-500"
                    href="/admin/crm"
                  >
                    Abrir CRM
                  </Link>
                </div>
                <div className="mt-4 space-y-3">
                  {dashboard.analysis.priorityCustomers.length === 0 ? (
                    <EmptyBlock message="Todavia no hay clientas con historial suficiente para priorizar recompra." />
                  ) : (
                    dashboard.analysis.priorityCustomers.map((customer) => (
                      <div className="rounded-[1.2rem] border border-stone-200 bg-[#fcfaf7] px-4 py-4" key={`${customer.contactId ?? "c"}-${customer.customerId ?? "u"}-${customer.name}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-stone-900">{customer.name}</p>
                            <p className="mt-1 text-xs text-stone-500">
                              {customer.whatsapp ?? customer.email ?? "Sin canal"}
                            </p>
                          </div>
                          <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                            {customer.repurchaseScore}/100
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-stone-700">{customer.suggestedAction}</p>
                      </div>
                    ))
                  )}
                </div>
              </article>
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Marketing"
              title="Cupones y origen de compra"
              description="Se apoya en redenciones reales y en origen inferido con senales persistidas."
            />
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
              <QuestionGrid items={dashboard.analysis.marketingAnswers} />
              <div className="grid gap-4 md:grid-cols-2">
                <RankedList
                  emptyLabel="Todavia no hay origenes de compra suficientes."
                  items={dashboard.analysis.marketingSources}
                  title="Origen de compra"
                />
                <RankedList
                  emptyLabel="Todavia no hay cupones con uso real."
                  items={dashboard.analysis.marketingCoupons}
                  title="Cupones con mejor salida"
                />
              </div>
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Embudo"
              title="Donde se pierde la conversion"
              description="Muestra medicion real cuando existe y proxies honestos cuando aun no hay evento persistido."
            />
            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
              <div className="space-y-3">
                {dashboard.analysis.funnelSteps.map((step) => (
                  <FunnelStepCard key={step.id} step={step} />
                ))}
              </div>
              <article className="rounded-[1.4rem] border border-stone-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Lectura del embudo
                </p>
                <div className="mt-3 space-y-3 text-sm leading-7 text-stone-700">
                  {dashboard.analysis.funnelInsights.map((insight) => (
                    <p key={insight}>{insight}</p>
                  ))}
                </div>
              </article>
            </div>
          </section>

          <section className="admin-panel p-4 sm:p-5">
            <SectionHeader
              eyebrow="Acciones sugeridas"
              title="Que conviene hacer ahora"
              description="La lista ya esta priorizada por riesgo, impacto y accion siguiente."
            />
            <div className="mt-4 space-y-3">
              {dashboard.recommendations.map((recommendation) => (
                <article
                  className="rounded-[1.4rem] border border-stone-200 bg-white p-5"
                  key={recommendation.id}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-sm font-semibold tracking-[0.08em] text-stone-500">
                        {getPriorityStars(recommendation.priority)}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold leading-7 text-stone-950">
                        {recommendation.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-stone-700">
                        {recommendation.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(recommendation.priority)}`}>
                        {getIntelligencePriorityLabel(recommendation.priority)}
                      </span>
                      <span className="inline-flex rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold text-stone-700">
                        Impacto {recommendation.impactValue}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
                    <MetaPill label="Siguiente paso" value={recommendation.suggestedAction} />
                    <Link
                      className="inline-flex items-center justify-center rounded-[1.1rem] border border-stone-300 bg-white px-4 py-3 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
                      href={getSourceLink(recommendation.source).href}
                    >
                      {getSourceLink(recommendation.source).label}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="soft-panel rounded-[1.5rem] p-4 sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
                  {dashboard.aiModule.title}
                </p>
                <h2 className="mt-2 font-serif text-2xl text-stone-950">Preguntale a Skin Hearten</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">{dashboard.aiModule.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {dashboard.aiModule.suggestedQuestions.map((suggestedQuestion) => (
                    <button
                      className="rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-2 text-[11px] font-semibold text-stone-700 transition hover:border-stone-400"
                      disabled={isAsking}
                      key={suggestedQuestion}
                      onClick={() => {
                        void submitQuestion(suggestedQuestion);
                      }}
                      type="button"
                    >
                      {suggestedQuestion}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-3">
                  <textarea
                    className="min-h-28 w-full rounded-[1.2rem] border border-stone-200 bg-[#fffaf7] px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                    onChange={(event) => {
                      setQuestion(event.target.value);
                    }}
                    placeholder="Ejemplo: que producto deberia impulsar primero sin castigar margen?"
                    value={question}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-stone-500">
                      La capa ya responde con reglas y datos persistidos. OpenAI queda como siguiente paso, no como requisito.
                    </p>
                    <button
                      className="rounded-full bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isAsking}
                      onClick={() => {
                        void submitQuestion();
                      }}
                      type="button"
                    >
                      {isAsking ? "Analizando..." : "Preguntar"}
                    </button>
                  </div>
                  {askError ? <NoticeBanner kind="error" message={askError} /> : null}
                </div>
              </div>

              <div>
                {answer ? (
                  <div className="space-y-3">
                    <div className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
                      <p className="text-sm leading-7 text-stone-800">{answer.answer}</p>
                    </div>
                    <div className="rounded-[1.2rem] bg-[#fff8f3] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Hechos de soporte
                      </p>
                      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                        {answer.supportingFacts.map((fact) => (
                          <p key={fact}>{fact}</p>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.2rem] bg-[#f6faf5] px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                        Siguientes pasos
                      </p>
                      <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                        {answer.suggestedActions.map((action) => (
                          <p key={action}>{action}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <EmptyBlock message="Escribe una pregunta o usa uno de los prompts sugeridos para obtener una recomendacion ejecutiva concreta." />
                )}
              </div>
            </div>
          </section>

          <section className="soft-panel rounded-[1.5rem] p-4 sm:p-5">
            <SectionHeader
              eyebrow="Robustez de datos"
              title="Donde aun falta telemetria persistida"
              description="Estas notas explican que partes del analisis salen de eventos medidos y cuales de proxies honestos."
            />
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {dashboard.analysis.measurementNotes.map((note) => (
                <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-white px-4 py-4 text-sm leading-6 text-stone-600" key={note}>
                  {note}
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="soft-panel rounded-[1.5rem] p-4 sm:p-5">
          <EmptyBlock message={getLoadMessage(errorReason)} />
        </section>
      )}
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="section-label">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-2xl text-stone-950 sm:text-[2rem]">{title}</h2>
      <p className="mt-3 text-sm leading-7 text-stone-600">{description}</p>
    </div>
  );
}

function StatCard({ metric }: { metric: IntelligenceStat }) {
  return (
    <article className={`rounded-[1.2rem] border px-4 py-4 ${getToneClasses(metric.tone)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">{metric.label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xl font-semibold">{metric.displayValue}</p>
        {metric.isEstimated ? (
          <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
            Proxy
          </span>
        ) : null}
      </div>
      {metric.helper ? <p className="mt-2 text-sm leading-6 opacity-85">{metric.helper}</p> : null}
    </article>
  );
}

function QuestionGrid({ items }: { items: IntelligenceQuestionAnswer[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {items.map((item) => (
        <QuestionCard item={item} key={item.id} />
      ))}
    </div>
  );
}

function QuestionCard({ item }: { item: IntelligenceQuestionAnswer }) {
  return (
    <article className={`rounded-[1.3rem] border p-4 ${getToneClasses(item.tone)}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-75">{item.question}</p>
      <p className="mt-3 text-sm font-semibold leading-7 text-current">{item.answer}</p>
      {item.detail ? <p className="mt-2 text-sm leading-6 opacity-85">{item.detail}</p> : null}
    </article>
  );
}

function RankedList({
  title,
  items,
  emptyLabel,
}: {
  title: string;
  items: IntelligenceRankedItem[];
  emptyLabel: string;
}) {
  return (
    <article className="rounded-[1.4rem] border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{title}</p>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[1.1rem] border border-dashed border-stone-300 bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-stone-500">
          {emptyLabel}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div className="rounded-[1.1rem] bg-[#fcfaf7] px-4 py-4" key={`${title}-${item.label}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{item.label}</p>
                  {item.helper ? <p className="mt-1 text-xs text-stone-500">{item.helper}</p> : null}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-stone-900">{item.count}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.share != null ? `${item.share.toFixed(1)}%` : "Sin share"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function FunnelStepCard({ step }: { step: IntelligenceFunnelStep }) {
  return (
    <article className="rounded-[1.3rem] border border-stone-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-500">
            {step.label}
          </p>
          <p className="mt-2 text-lg font-semibold text-stone-950">{step.displayValue}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold text-stone-700">
            {step.measurement === "measured"
              ? "Medido"
              : step.measurement === "proxy"
                ? "Proxy"
                : "Sin telemetria"}
          </span>
          {step.conversionFromPrevious != null ? (
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700">
              Conv. {step.conversionFromPrevious.toFixed(1)}%
            </span>
          ) : null}
          {step.lossFromPrevious != null ? (
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700">
              Perdida {step.lossFromPrevious}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs text-stone-700">
      <span className="font-semibold text-stone-900">{value}</span> {label}
    </div>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.1rem] bg-white px-4 py-3 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 text-sm font-medium text-stone-900">{value}</p>
    </div>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-[1.2rem] border border-dashed border-stone-300 bg-white px-4 py-5 text-sm leading-6 text-stone-500">
      {message}
    </div>
  );
}

function NoticeBanner({
  kind,
  message,
}: {
  kind: "error" | "success";
  message: string;
}) {
  return (
    <div
      className={`rounded-[1.4rem] border px-4 py-4 text-sm leading-7 ${
        kind === "success"
          ? "border-[#d8e3cf] bg-[#f5faf1] text-[#476638]"
          : "border-[#ead0c7] bg-[#fff6f2] text-[#8a4d3b]"
      }`}
    >
      {message}
    </div>
  );
}
