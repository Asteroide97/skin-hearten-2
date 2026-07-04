"use client";

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";

import {
  getIntelligencePriorityLabel,
  getIntelligenceScoreBandLabel,
  type IntelligenceAskResponse,
  type IntelligenceCustomerScore,
  type IntelligenceDashboard,
  type IntelligenceFunnelStep,
  type IntelligenceKPI,
  type IntelligenceProductScore,
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

type OpportunityCard = {
  id: string;
  priority: IntelligenceRecommendation["priority"];
  title: string;
  detail: string;
  href: string;
  cta: string;
  impact: string | null;
};

const SOURCE_LINKS: Record<string, { href: string; label: string }> = {
  clientes: { href: "/admin/crm", label: "Ver clientes" },
  crm: { href: "/admin/crm", label: "Ver clientes" },
  cupones: { href: "/admin/cupones", label: "Ver cupones" },
  inventario: { href: "/admin/productos", label: "Ver producto" },
  resenas: { href: "/admin/reviews", label: "Ver resenas" },
  skin_quiz: { href: "/admin/skin-quiz-leads", label: "Analizar" },
};

const DEFAULT_OPEN_SECTIONS: Record<string, boolean> = {
  executive: false,
  skinQuiz: false,
  products: false,
  customers: false,
  routines: false,
  marketing: false,
  funnel: false,
  telemetry: false,
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

function getGreetingLabel() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Buenos dias.";
  }

  if (hour < 19) {
    return "Buenas tardes.";
  }

  return "Buenas noches.";
}

function buildOpportunityCards(dashboard: IntelligenceDashboard): OpportunityCard[] {
  const cards: OpportunityCard[] = dashboard.recommendations.slice(0, 3).map((recommendation) => ({
    id: recommendation.id,
    priority: recommendation.priority,
    title: recommendation.title,
    detail: recommendation.suggestedAction,
    href: getSourceLink(recommendation.source).href,
    cta: getSourceLink(recommendation.source).label,
    impact: recommendation.impactValue,
  }));

  if (cards.length < 3 && dashboard.analysis.priorityCustomers[0]) {
    const customer = dashboard.analysis.priorityCustomers[0];
    cards.push({
      id: `customer-${customer.contactId ?? customer.customerId ?? customer.name}`,
      priority: customer.repurchaseScore >= 75 ? "high" : "medium",
      title: `${customer.name} esta lista para recompra.`,
      detail: customer.suggestedAction,
      href: "/admin/crm",
      cta: "Ver clientes",
      impact: `${customer.repurchaseScore}/100`,
    });
  }

  if (cards.length < 3 && dashboard.analysis.productAnswers[0]) {
    const productAnswer = dashboard.analysis.productAnswers[0];
    cards.push({
      id: `product-${productAnswer.id}`,
      priority: productAnswer.tone === "critical" ? "high" : "medium",
      title: productAnswer.answer,
      detail: productAnswer.detail ?? "Abrir el catalogo para revisar inventario, margen y conversion.",
      href: "/admin/productos",
      cta: "Ver producto",
      impact: null,
    });
  }

  if (cards.length < 3 && dashboard.analysis.skinQuizAnswers[0]) {
    const skinQuizAnswer = dashboard.analysis.skinQuizAnswers[0];
    cards.push({
      id: `quiz-${skinQuizAnswer.id}`,
      priority: skinQuizAnswer.tone === "critical" ? "high" : "medium",
      title: skinQuizAnswer.answer,
      detail: skinQuizAnswer.detail ?? "Analiza la diferencia entre lo recomendado y lo comprado.",
      href: "/admin/skin-quiz-analytics",
      cta: "Analizar",
      impact: null,
    });
  }

  return cards.slice(0, 3);
}

export function IntelligencePage() {
  const [dashboard, setDashboard] = useState<IntelligenceDashboard | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(DEFAULT_OPEN_SECTIONS);

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
  const opportunityCards = useMemo(() => (dashboard ? buildOpportunityCards(dashboard) : []), [dashboard]);
  const headline = useMemo(() => {
    if (!dashboard) {
      return "Hoy hay tres oportunidades importantes.";
    }

    if (opportunityCards.length === 1) {
      return "Hoy hay una oportunidad importante.";
    }

    if (opportunityCards.length === 2) {
      return "Hoy hay dos oportunidades importantes.";
    }

    return "Hoy hay tres oportunidades importantes.";
  }, [dashboard, opportunityCards.length]);

  function toggleSection(id: string) {
    setOpenSections((current) => ({
      ...current,
      [id]: !current[id],
    }));
  }

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

  if (isLoading) {
    return (
      <div className="admin-workspace admin-intelligence space-y-4">
        <section className="admin-panel px-5 py-6 sm:px-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-36 rounded-full bg-stone-200" />
            <div className="h-12 w-[26rem] max-w-full rounded-[1rem] bg-stone-200" />
            <div className="h-5 w-72 max-w-full rounded-full bg-stone-100" />
          </div>
        </section>
        <section className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div className="admin-panel h-48 animate-pulse rounded-[1.35rem] bg-white" key={`intelligence-loading-card-${index}`} />
          ))}
        </section>
        <section className="soft-panel rounded-[1.5rem] p-5">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-48 rounded-full bg-stone-200" />
            <div className="h-10 rounded-[1rem] bg-white" />
            <div className="h-28 rounded-[1.2rem] bg-white" />
          </div>
        </section>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="admin-workspace admin-intelligence space-y-4">
        <section className="soft-panel rounded-[1.5rem] p-4 sm:p-5">
          <EmptyBlock message={getLoadMessage(errorReason)} />
        </section>
      </div>
    );
  }

  return (
    <div className="admin-workspace admin-intelligence space-y-4">
      <section className="admin-panel px-5 py-6 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-4xl">
            <p className="section-label">Centro de Inteligencia</p>
            <h1 className="mt-2 font-serif text-[2.65rem] leading-[0.94] text-stone-950 sm:text-[3.2rem]">
              {getGreetingLabel()}
            </h1>
            <p className="mt-3 text-lg font-medium text-stone-900 sm:text-[1.15rem]">{headline}</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              {dashboard.executiveSummary.headline}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 xl:max-w-sm xl:justify-end">
            <MetricPill
              label="Actualizado"
              value={formatDateTime(dashboard.generatedAt)}
            />
            <MetricPill label="Motor" value={dashboard.aiModule.provider === "rules" ? "Reglas" : "IA"} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {opportunityCards.map((card) => (
          <PriorityCard card={card} key={card.id} />
        ))}
      </section>

      <section className="soft-panel rounded-[1.5rem] p-4 sm:p-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <p className="section-label">{dashboard.aiModule.title}</p>
            <h2 className="mt-2 font-serif text-[2rem] leading-[1] text-stone-950">Hazme una pregunta.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              {dashboard.aiModule.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {dashboard.aiModule.suggestedQuestions.map((suggestedQuestion) => (
                <button
                  className="rounded-full border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-700 transition hover:border-stone-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                className="min-h-24 w-full rounded-[1.2rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-900 outline-none transition focus:border-stone-500"
                onChange={(event) => {
                  setQuestion(event.target.value);
                }}
                placeholder="Ejemplo: que producto deberia empujar primero sin castigar margen?"
                value={question}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-stone-500">
                  Usa reglas y datos reales. No cambia nada operativo: solo ayuda a decidir.
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
                  <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">Hechos de soporte</p>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                    {answer.supportingFacts.map((fact) => (
                      <p key={fact}>{fact}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-[1.2rem] bg-[#f6faf5] px-4 py-4">
                  <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">Siguientes pasos</p>
                  <div className="mt-2 space-y-2 text-sm leading-6 text-stone-700">
                    {answer.suggestedActions.map((action) => (
                      <p key={action}>{action}</p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyBlock message="Haz una pregunta directa para recibir una recomendacion concreta con contexto comercial." />
            )}
          </div>
        </div>
      </section>

      <section className="admin-panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Que conviene hacer ahora</p>
            <h2 className="mt-2 font-serif text-2xl text-stone-950 sm:text-[2rem]">Empieza por aqui.</h2>
            <p className="mt-3 text-sm leading-7 text-stone-600">
              La lista ya esta priorizada por impacto, riesgo y siguiente accion sugerida.
            </p>
          </div>
          {topCustomer ? (
            <div className="rounded-[1.2rem] border border-stone-200 bg-[#fcfaf7] px-4 py-3 text-sm text-stone-700">
              <span className="font-semibold text-stone-950">{topCustomer.name}</span>
              <span> lidera recompra con {topCustomer.repurchaseScore}/100.</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 space-y-3">
          {dashboard.recommendations.length === 0 ? (
            <EmptyBlock message="Todavia no hay acciones sugeridas porque faltan suficientes senales persistidas." />
          ) : (
            dashboard.recommendations.map((recommendation) => (
              <article className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4" key={recommendation.id}>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 max-w-4xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(recommendation.priority)}`}>
                        Prioridad {getIntelligencePriorityLabel(recommendation.priority)}
                      </span>
                      <span className="inline-flex rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-1 text-[11px] font-semibold text-stone-700">
                        Impacto {recommendation.impactValue}
                      </span>
                    </div>
                    <h3 className="mt-3 text-base font-semibold leading-7 text-stone-950">{recommendation.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-stone-600">{recommendation.description}</p>
                    <p className="mt-3 text-sm font-medium text-stone-800">{recommendation.suggestedAction}</p>
                  </div>
                  <Link
                    className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
                    href={getSourceLink(recommendation.source).href}
                  >
                    {getSourceLink(recommendation.source).label}
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="admin-panel overflow-hidden">
        <AccordionSection
          description="Hoy, esta semana y este mes condensados como lectura operativa."
          id="executive"
          isOpen={openSections.executive}
          onToggle={toggleSection}
          title="Resumen Ejecutivo"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <div>
              <div className="rounded-[1.25rem] border border-stone-200 bg-[#fffaf7] px-4 py-4">
                <h3 className="text-lg font-semibold text-stone-950">{dashboard.executiveSummary.headline}</h3>
                <p className="mt-2 text-sm leading-7 text-stone-700">{dashboard.executiveSummary.summary}</p>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {dashboard.executiveSummary.bullets.map((bullet) => (
                  <div className="rounded-[1.15rem] border border-stone-200 bg-white px-4 py-3 text-sm leading-6 text-stone-700" key={bullet}>
                    {bullet}
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                {dashboard.analysis.executivePeriods.map((period) => (
                  <article className={`rounded-[1.2rem] border px-4 py-4 ${getToneClasses(period.tone)}`} key={period.id}>
                    <p className="text-xs font-semibold tracking-[0.08em] opacity-75">{period.label}</p>
                    <h4 className="mt-2 text-sm font-semibold leading-6 text-current">{period.headline}</h4>
                    <div className="mt-3 space-y-2 text-sm leading-6 opacity-85">
                      {period.details.map((detail) => (
                        <p key={detail}>{detail}</p>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {dashboard.kpis.slice(0, 4).map((metric) => (
                <CompactKpiCard key={metric.id} metric={metric} />
              ))}
            </div>
          </div>
        </AccordionSection>

        <AccordionSection
          description="Lo que el quiz revela sobre demanda, recomendacion y compra real."
          id="skinQuiz"
          isOpen={openSections.skinQuiz}
          onToggle={toggleSection}
          title="Skin Quiz"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        </AccordionSection>

        <AccordionSection
          description="Productos con senales de conversion, margen, resenas o inventario."
          id="products"
          isOpen={openSections.products}
          onToggle={toggleSection}
          title="Productos"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <QuestionGrid items={dashboard.analysis.productAnswers} />
            <ProductScoreList items={dashboard.productScores.slice(0, 5)} />
          </div>
        </AccordionSection>

        <AccordionSection
          description="Segmentos que merecen seguimiento comercial inmediato."
          id="customers"
          isOpen={openSections.customers}
          onToggle={toggleSection}
          title="Clientes"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <QuestionGrid items={dashboard.analysis.customerAnswers} />
            <CustomerPriorityList customers={dashboard.analysis.priorityCustomers} />
          </div>
        </AccordionSection>

        <AccordionSection
          description="Rendimiento de rutinas y senales del flujo Routine Builder."
          id="routines"
          isOpen={openSections.routines}
          onToggle={toggleSection}
          title="Rutinas"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {dashboard.analysis.routineBuilderMetrics.map((metric) => (
              <StatCard key={metric.id} metric={metric} />
            ))}
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
            <QuestionGrid items={dashboard.analysis.routineBuilderAnswers} />
            <RankedList
              emptyLabel="Todavia no hay una rutina dominante."
              items={dashboard.analysis.routineBuilderRoutines}
              title="Rutinas con mas salida"
            />
          </div>
        </AccordionSection>

        <AccordionSection
          description="Origen de compra y cupones con salida real."
          id="marketing"
          isOpen={openSections.marketing}
          onToggle={toggleSection}
          title="Marketing"
        >
          <div className="grid gap-4 xl:grid-cols-2">
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
        </AccordionSection>

        <AccordionSection
          description="Convierte primero donde mas fuga se acumula."
          id="funnel"
          isOpen={openSections.funnel}
          onToggle={toggleSection}
          title="Embudo"
        >
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_340px]">
            <div className="space-y-3">
              {dashboard.analysis.funnelSteps.map((step) => (
                <FunnelStepCard key={step.id} step={step} />
              ))}
            </div>
            <article className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">Lectura del embudo</p>
              <div className="mt-3 space-y-3 text-sm leading-7 text-stone-700">
                {dashboard.analysis.funnelInsights.map((insight) => (
                  <p key={insight}>{insight}</p>
                ))}
              </div>
            </article>
          </div>
        </AccordionSection>

        <AccordionSection
          description="Aclara que esta medido y donde aun dependemos de proxies honestos."
          id="telemetry"
          isOpen={openSections.telemetry}
          onToggle={toggleSection}
          title="Telemetria"
        >
          <div className="grid gap-3 md:grid-cols-3">
            {dashboard.analysis.measurementNotes.map((note) => (
              <div className="rounded-[1.15rem] border border-dashed border-stone-300 bg-white px-4 py-4 text-sm leading-6 text-stone-600" key={note}>
                {note}
              </div>
            ))}
          </div>
        </AccordionSection>
      </section>
    </div>
  );
}

function AccordionSection({
  id,
  title,
  description,
  isOpen,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="border-t border-stone-200 first:border-t-0">
      <button
        aria-controls={`${id}-panel`}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
        onClick={() => {
          onToggle(id);
        }}
        type="button"
      >
        <div className="min-w-0">
          <p className="text-base font-semibold text-stone-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
        </div>
        <span className="shrink-0 rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
          {isOpen ? "Cerrar" : "Abrir"}
        </span>
      </button>
      {isOpen ? (
        <div className="px-4 pb-5 sm:px-5" id={`${id}-panel`}>
          {children}
        </div>
      ) : null}
    </div>
  );
}

function PriorityCard({ card }: { card: OpportunityCard }) {
  return (
    <article className="admin-panel flex h-full flex-col justify-between p-4 sm:p-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold ${getPriorityClasses(card.priority)}`}>
            Prioridad {getIntelligencePriorityLabel(card.priority)}
          </span>
          {card.impact ? (
            <span className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1 text-[11px] font-semibold text-stone-700">
              {card.impact}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 font-serif text-[1.9rem] leading-[1.02] text-stone-950">{card.title}</h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">{card.detail}</p>
      </div>
      <div className="mt-5">
        <Link
          className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:border-stone-500"
          href={card.href}
        >
          {card.cta}
        </Link>
      </div>
    </article>
  );
}

function CompactKpiCard({ metric }: { metric: IntelligenceKPI }) {
  return (
    <article className={`rounded-[1.15rem] border px-4 py-4 ${getToneClasses(metric.tone)}`}>
      <p className="text-xs font-semibold tracking-[0.08em] opacity-75">{metric.label}</p>
      <p className="mt-2 text-xl font-semibold text-current">{metric.displayValue}</p>
      {metric.helper ? <p className="mt-2 text-sm leading-6 opacity-85">{metric.helper}</p> : null}
    </article>
  );
}

function StatCard({ metric }: { metric: IntelligenceStat }) {
  return (
    <article className={`rounded-[1.15rem] border px-4 py-4 ${getToneClasses(metric.tone)}`}>
      <p className="text-xs font-semibold tracking-[0.08em] opacity-75">{metric.label}</p>
      <div className="mt-2 flex items-center gap-2">
        <p className="text-xl font-semibold text-current">{metric.displayValue}</p>
        {metric.isEstimated ? (
          <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold tracking-[0.08em]">
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
    <article className={`rounded-[1.2rem] border px-4 py-4 ${getToneClasses(item.tone)}`}>
      <p className="text-xs font-semibold tracking-[0.08em] opacity-75">{item.question}</p>
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
    <article className="rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">{title}</p>
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

function ProductScoreList({ items }: { items: IntelligenceProductScore[] }) {
  return (
    <article className="rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">Score de producto</p>
          <h3 className="mt-2 text-base font-semibold text-stone-950">Que producto revisar primero</h3>
        </div>
        <Link
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-stone-500"
          href="/admin/productos"
        >
          Ver productos
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="mt-4 rounded-[1.1rem] border border-dashed border-stone-300 bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-stone-500">
          Todavia no hay suficientes senales para priorizar productos.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div className="rounded-[1.1rem] border border-stone-200 bg-[#fcfaf7] px-4 py-4" key={`${item.productId}-${item.slug}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-950">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {item.brand} / {item.category}
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                  {item.intelligenceScore}/100
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                <p>Stock: {item.stock}</p>
                <p>Ingresos: {formatCurrency(item.revenue)}</p>
                <p>Margen: {item.marginPercent.toFixed(1)}%</p>
                <p>Resenas: {item.reviewCount}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{item.recommendedAction}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function CustomerPriorityList({ customers }: { customers: IntelligenceCustomerScore[] }) {
  return (
    <article className="rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">Prioridad hoy</p>
          <h3 className="mt-2 text-base font-semibold text-stone-950">A quien contactar</h3>
        </div>
        <Link
          className="rounded-full border border-stone-300 bg-white px-3 py-2 text-xs font-semibold text-stone-800 transition hover:border-stone-500"
          href="/admin/crm"
        >
          Abrir CRM
        </Link>
      </div>
      {customers.length === 0 ? (
        <div className="mt-4 rounded-[1.1rem] border border-dashed border-stone-300 bg-[#fcfaf7] px-4 py-4 text-sm leading-6 text-stone-500">
          Todavia no hay clientas con historial suficiente para priorizar recompra.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {customers.map((customer) => (
            <div className="rounded-[1.1rem] border border-stone-200 bg-[#fcfaf7] px-4 py-4" key={`${customer.contactId ?? "c"}-${customer.customerId ?? "u"}-${customer.name}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-stone-950">{customer.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {customer.whatsapp ?? customer.email ?? "Sin canal"}
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-800">
                  {customer.repurchaseScore}/100
                </span>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-stone-700 sm:grid-cols-2">
                <p>Ticket: {formatCurrency(customer.averageTicket)}</p>
                <p>Estado: {getIntelligenceScoreBandLabel(customer.scoreBand)}</p>
                <p>Compras: {customer.orderCount}</p>
                <p>Goal: {customer.mainGoal?.replaceAll("_", " ") ?? "Sin definir"}</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-600">{customer.suggestedAction}</p>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function FunnelStepCard({ step }: { step: IntelligenceFunnelStep }) {
  return (
    <article className="rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-stone-500">{step.label}</p>
          <p className="mt-2 text-lg font-semibold text-stone-950">{step.displayValue}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-stone-200 bg-[#fff8f3] px-3 py-1 text-xs font-semibold text-stone-700">
            {step.measurement === "measured"
              ? "Medido"
              : step.measurement === "proxy"
                ? "Proxy"
                : "Sin telemetria"}
          </span>
          {step.conversionFromPrevious != null ? (
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
              Conv. {step.conversionFromPrevious.toFixed(1)}%
            </span>
          ) : null}
          {step.lossFromPrevious != null ? (
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-semibold text-stone-700">
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
