"use client";

import { useEffect, useMemo, useState } from "react";

import type { AdminProduct } from "@/lib/admin-products";
import type { AdminRoutineWriteInput, Routine } from "@/lib/routines";

type RoutinesApiResponse =
  | { ok: true; data: Routine[] }
  | { ok: false; reason: string; message?: string };

type ProductsApiResponse =
  | { ok: true; data: AdminProduct[] }
  | { ok: false; reason: string; message?: string };

type RoutineMutationResponse =
  | { ok: true; data: Routine }
  | { ok: false; reason: string; message?: string };

type DeleteApiResponse =
  | { ok: true; data: { message: string } }
  | { ok: false; reason: string; message?: string };

type Notice =
  | {
      kind: "error" | "success";
      message: string;
    }
  | null;

type DraftLinkedProduct = {
  clientId: string;
  productId: number;
  isPrimary: boolean;
  priority: number;
};

type DraftStep = {
  clientId: string;
  order: number;
  productId: number;
  title: string;
  shortDescription: string;
  image: string;
  badge: string;
};

type DraftState = {
  name: string;
  description: string;
  isActive: boolean;
  image: string;
  color: string;
  goalKey: string;
  categoryKey: string;
  linkedProducts: DraftLinkedProduct[];
  steps: DraftStep[];
};

const goalOptions = [
  { value: "", label: "Sin objetivo fijo" },
  { value: "manchas", label: "Manchas" },
  { value: "acne", label: "Acne" },
  { value: "lineas_expresion", label: "Lineas de expresion" },
  { value: "hidratacion", label: "Hidratacion" },
  { value: "luminosidad", label: "Luminosidad" },
  { value: "proteccion_solar", label: "Proteccion solar" },
];

const categoryOptions = [
  { value: "", label: "Sin categoria fija" },
  { value: "limpiadores", label: "Limpiadores" },
  { value: "serums", label: "Serums" },
  { value: "hidratantes", label: "Hidratantes" },
  { value: "protector-solar", label: "Protector solar" },
  { value: "tratamientos", label: "Tratamientos" },
];

function createClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createEmptyDraft(productId = 0): DraftState {
  return {
    name: "",
    description: "",
    isActive: true,
    image: "",
    color: "#EFDCCF",
    goalKey: "",
    categoryKey: "",
    linkedProducts: productId
      ? [{ clientId: createClientId(), productId, isPrimary: true, priority: 0 }]
      : [],
    steps: productId
      ? [
          {
            clientId: createClientId(),
            order: 1,
            productId,
            title: "Paso clave",
            shortDescription: "",
            image: "",
            badge: "",
          },
        ]
      : [],
  };
}

function mapRoutineToDraft(routine: Routine): DraftState {
  return {
    name: routine.name,
    description: routine.description ?? "",
    isActive: routine.isActive,
    image: routine.image ?? "",
    color: routine.color ?? "",
    goalKey: routine.goalKey ?? "",
    categoryKey: routine.categoryKey ?? "",
    linkedProducts: routine.linkedProducts.map((linkedProduct) => ({
      clientId: createClientId(),
      productId: Number(linkedProduct.productId),
      isPrimary: linkedProduct.isPrimary,
      priority: linkedProduct.priority,
    })),
    steps: routine.steps.map((step) => ({
      clientId: createClientId(),
      order: step.order,
      productId: Number(step.productId),
      title: step.title,
      shortDescription: step.shortDescription,
      image: step.image ?? "",
      badge: step.badge ?? "",
    })),
  };
}

function buildPayloadFromDraft(draft: DraftState): AdminRoutineWriteInput {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || null,
    isActive: draft.isActive,
    image: draft.image.trim() || null,
    color: draft.color.trim() || null,
    goalKey: draft.goalKey.trim() || null,
    categoryKey: draft.categoryKey.trim() || null,
    linkedProducts: draft.linkedProducts.map((linkedProduct, index) => ({
      productId: linkedProduct.productId,
      isPrimary: linkedProduct.isPrimary,
      priority: index,
    })),
    steps: draft.steps
      .slice()
      .sort((left, right) => left.order - right.order)
      .map((step) => ({
        order: step.order,
        productId: step.productId,
        title: step.title.trim(),
        shortDescription: step.shortDescription.trim(),
        image: step.image.trim() || null,
        badge: step.badge.trim() || null,
      })),
  };
}

function getPageMessage(reason: string | null) {
  if (!reason) {
    return "Aun no hay rutinas configuradas. Crea una secuencia para antiedad, manchas o acne y conectala a tus productos.";
  }

  if (reason === "api_url_missing") {
    return "Configura NEXT_PUBLIC_API_URL para administrar rutinas reales desde FastAPI.";
  }

  if (reason === "auth_failed") {
    return "Tu sesion de SuperAdmin no es valida o expiro. Vuelve a iniciar sesion.";
  }

  return "No pudimos cargar rutinas por ahora. El panel conserva un estado vacio amigable mientras la API no este disponible.";
}

function getRoutineStatusBadgeClasses(isActive: boolean) {
  return isActive
    ? "border-[#d8e3cf] bg-[#f3faf0] text-[#476638]"
    : "border-stone-200 bg-stone-100 text-stone-600";
}

export function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [pageNotice, setPageNotice] = useState<Notice>(null);

  const [selectedRoutineId, setSelectedRoutineId] = useState<number | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("edit");
  const [draft, setDraft] = useState<DraftState>(createEmptyDraft());
  const [drawerNotice, setDrawerNotice] = useState<Notice>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeRoutine = selectedRoutineId
    ? routines.find((routine) => routine.id === selectedRoutineId) ?? null
    : null;

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setIsLoading(true);

      try {
        const [routinesResponse, productsResponse] = await Promise.all([
          fetch("/api/admin/routines", { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
        ]);
        const routinesPayload = (await routinesResponse.json()) as RoutinesApiResponse;
        const productsPayload = (await productsResponse.json()) as ProductsApiResponse;

        if (cancelled) {
          return;
        }

        if (!routinesResponse.ok || !routinesPayload.ok) {
          setRoutines([]);
          setProducts(productsPayload.ok ? productsPayload.data : []);
          setErrorReason(routinesPayload.ok ? "fetch_failed" : routinesPayload.reason);
          return;
        }

        setRoutines(routinesPayload.data);
        setProducts(productsPayload.ok ? productsPayload.data : []);
        setErrorReason(productsPayload.ok ? null : productsPayload.reason);
      } catch {
        if (!cancelled) {
          setRoutines([]);
          setProducts([]);
          setErrorReason("fetch_failed");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (drawerMode === "create") {
      const firstProductId = products[0]?.id ?? 0;
      setDraft(createEmptyDraft(firstProductId));
      return;
    }

    if (activeRoutine) {
      setDraft(mapRoutineToDraft(activeRoutine));
    }
  }, [activeRoutine, drawerMode, products]);

  const productOptions = useMemo(() => {
    return products.map((product) => ({
      label: `${product.name} / ${product.category}`,
      value: product.id,
    }));
  }, [products]);

  const routineCountLabel = useMemo(() => {
    return routines.length === 1 ? "1 rutina" : `${routines.length} rutinas`;
  }, [routines.length]);

  function openCreateDrawer() {
    setDrawerMode("create");
    setSelectedRoutineId(null);
    setDrawerNotice(null);
  }

  function openEditDrawer(routineId: number) {
    setDrawerMode("edit");
    setSelectedRoutineId(routineId);
    setDrawerNotice(null);
  }

  function closeDrawer() {
    setSelectedRoutineId(null);
    setDrawerMode("edit");
    setDrawerNotice(null);
    setIsDeleting(false);
    setIsSaving(false);
  }

  function mergeRoutine(updatedRoutine: Routine) {
    setRoutines((current) => {
      const existingIndex = current.findIndex((routine) => routine.id === updatedRoutine.id);
      if (existingIndex === -1) {
        return [updatedRoutine, ...current];
      }

      return current.map((routine) => (routine.id === updatedRoutine.id ? updatedRoutine : routine));
    });
  }

  function setPrimaryLinkedProduct(clientId: string) {
    setDraft((current) => ({
      ...current,
      linkedProducts: current.linkedProducts.map((linkedProduct) => ({
        ...linkedProduct,
        isPrimary: linkedProduct.clientId === clientId,
      })),
    }));
  }

  function addLinkedProduct() {
    const fallbackProductId = products[0]?.id ?? 0;
    if (!fallbackProductId) {
      return;
    }

    setDraft((current) => ({
      ...current,
      linkedProducts: [
        ...current.linkedProducts,
        {
          clientId: createClientId(),
          productId: fallbackProductId,
          isPrimary: current.linkedProducts.length === 0,
          priority: current.linkedProducts.length,
        },
      ],
    }));
  }

  function addStep() {
    const fallbackProductId = products[0]?.id ?? 0;
    if (!fallbackProductId) {
      return;
    }

    setDraft((current) => ({
      ...current,
      steps: [
        ...current.steps,
        {
          clientId: createClientId(),
          order: current.steps.length + 1,
          productId: fallbackProductId,
          title: `Paso ${current.steps.length + 1}`,
          shortDescription: "",
          image: "",
          badge: "",
        },
      ],
    }));
  }

  async function handleSave() {
    const payload = buildPayloadFromDraft(draft);

    if (!payload.name || payload.steps.length === 0 || payload.linkedProducts.length === 0) {
      setDrawerNotice({
        kind: "error",
        message: "Nombre, productos vinculados y al menos un paso son obligatorios.",
      });
      return;
    }

    if (payload.steps.some((step) => !step.title || !step.shortDescription)) {
      setDrawerNotice({
        kind: "error",
        message: "Cada paso necesita titulo y descripcion corta.",
      });
      return;
    }

    setIsSaving(true);
    setDrawerNotice(null);

    try {
      const requestUrl = drawerMode === "create" ? "/api/admin/routines" : `/api/admin/routines/${selectedRoutineId}`;
      const response = await fetch(requestUrl, {
        method: drawerMode === "create" ? "POST" : "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as RoutineMutationResponse;

      if (!response.ok || !result.ok) {
        setDrawerNotice({
          kind: "error",
          message: result.ok ? "No pudimos guardar la rutina." : result.message ?? "No pudimos guardar la rutina.",
        });
        return;
      }

      mergeRoutine(result.data);
      setSelectedRoutineId(result.data.id);
      setDrawerMode("edit");
      setDrawerNotice({
        kind: "success",
        message: "Rutina guardada correctamente.",
      });
      setPageNotice({
        kind: "success",
        message: `Se guardo ${result.data.name}.`,
      });
    } catch {
      setDrawerNotice({
        kind: "error",
        message: "No pudimos guardar la rutina por ahora.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!activeRoutine) {
      return;
    }

    setIsDeleting(true);
    setDrawerNotice(null);

    try {
      const response = await fetch(`/api/admin/routines/${activeRoutine.id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as DeleteApiResponse;

      if (!response.ok || !result.ok) {
        setDrawerNotice({
          kind: "error",
          message: result.ok ? "No pudimos eliminar la rutina." : result.message ?? "No pudimos eliminar la rutina.",
        });
        return;
      }

      setRoutines((current) => current.filter((routine) => routine.id !== activeRoutine.id));
      setPageNotice({
        kind: "success",
        message: result.data.message,
      });
      closeDrawer();
    } catch {
      setDrawerNotice({
        kind: "error",
        message: "No pudimos eliminar la rutina por ahora.",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleDuplicate(routine: Routine) {
    setDrawerNotice(null);
    setPageNotice(null);

    try {
      const response = await fetch(`/api/admin/routines/${routine.id}/duplicate`, {
        method: "POST",
      });
      const result = (await response.json()) as RoutineMutationResponse;

      if (!response.ok || !result.ok) {
        setPageNotice({
          kind: "error",
          message: result.ok ? "No pudimos duplicar la rutina." : result.message ?? "No pudimos duplicar la rutina.",
        });
        return;
      }

      mergeRoutine(result.data);
      setPageNotice({
        kind: "success",
        message: `Se duplico ${routine.name}.`,
      });
    } catch {
      setPageNotice({
        kind: "error",
        message: "No pudimos duplicar la rutina por ahora.",
      });
    }
  }

  return (
    <>
      <div className="space-y-6">
        <section className="soft-panel rounded-[1.8rem] p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Rutinas</p>
              <h1 className="mt-2 font-serif text-4xl text-stone-900">Routine Builder</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
                Define secuencias completas, vincula productos a multiples rutinas y controla que recomendacion aparece antes de mandar al carrito.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-full border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">
                {isLoading ? "Cargando..." : routineCountLabel}
              </div>
              <button
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white"
                onClick={openCreateDrawer}
                type="button"
              >
                Nueva rutina
              </button>
            </div>
          </div>

          {pageNotice ? <NoticeBanner className="mt-5" notice={pageNotice} /> : null}
        </section>

        <section className="soft-panel rounded-[1.8rem] p-4 sm:p-6">
          {isLoading ? (
            <EmptyBlock message="Cargando rutinas reales..." />
          ) : routines.length === 0 ? (
            <EmptyBlock message={getPageMessage(errorReason)} />
          ) : (
            <div className="overflow-hidden rounded-[1.6rem] border border-stone-200 bg-white">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-stone-200 text-left">
                  <thead className="bg-[#fff8f3] text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                    <tr>
                      <th className="px-4 py-4">Rutina</th>
                      <th className="px-4 py-4">Objetivo</th>
                      <th className="px-4 py-4">Categoria</th>
                      <th className="px-4 py-4">Vinculos</th>
                      <th className="px-4 py-4">Pasos</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-4 py-4 text-right">Gestion</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-sm text-stone-700">
                    {routines.map((routine) => (
                      <tr className="align-top" key={routine.id}>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-stone-900">{routine.name}</p>
                          <p className="mt-1 text-xs text-stone-500">{routine.description ?? "Sin descripcion corta"}</p>
                        </td>
                        <td className="px-4 py-4 text-stone-600">{routine.goalKey ?? "Libre"}</td>
                        <td className="px-4 py-4 text-stone-600">{routine.categoryKey ?? "Libre"}</td>
                        <td className="px-4 py-4 text-xs leading-6 text-stone-600">
                          {routine.linkedProducts.slice(0, 3).map((linkedProduct) => (
                            <p key={linkedProduct.id}>
                              {linkedProduct.productName}
                              {linkedProduct.isPrimary ? " / principal" : ""}
                            </p>
                          ))}
                          {routine.linkedProducts.length > 3 ? (
                            <p>+{routine.linkedProducts.length - 3} mas</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 text-stone-600">{routine.steps.length}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRoutineStatusBadgeClasses(routine.isActive)}`}>
                            {routine.isActive ? "Activa" : "Inactiva"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                              onClick={() => {
                                void handleDuplicate(routine);
                              }}
                              type="button"
                            >
                              Duplicar
                            </button>
                            <button
                              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                              onClick={() => {
                                openEditDrawer(routine.id);
                              }}
                              type="button"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {(drawerMode === "create" || activeRoutine) ? (
        <div className="fixed inset-0 z-50 bg-stone-950/20 backdrop-blur-sm">
          <div className="ml-auto h-full w-full max-w-[960px] overflow-y-auto bg-[#fffaf6] px-5 py-6 shadow-2xl sm:px-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
                  {drawerMode === "create" ? "Nueva rutina" : "Detalle"}
                </p>
                <h2 className="mt-2 font-serif text-3xl text-stone-900">
                  {drawerMode === "create" ? "Crear rutina" : activeRoutine?.name ?? "Editar rutina"}
                </h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">
                  Ajusta textos, orden, productos y prioridad de seleccion sin tocar codigo del storefront.
                </p>
              </div>
              <button
                className="rounded-full border border-stone-300 px-3 py-2 text-sm text-stone-700"
                onClick={closeDrawer}
                type="button"
              >
                Cerrar
              </button>
            </div>

            {drawerNotice ? <NoticeBanner className="mt-5" notice={drawerNotice} /> : null}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field
                label="Nombre"
                onChange={(value) => {
                  setDraft((current) => ({ ...current, name: value }));
                }}
                placeholder="Rutina antimanchas"
                value={draft.name}
              />
              <Field
                label="Color"
                onChange={(value) => {
                  setDraft((current) => ({ ...current, color: value }));
                }}
                placeholder="#EFDCCF"
                value={draft.color}
              />
              <div className="sm:col-span-2">
                <Field
                  label="Descripcion corta"
                  onChange={(value) => {
                    setDraft((current) => ({ ...current, description: value }));
                  }}
                  placeholder="Que vende esta rutina en una frase."
                  value={draft.description}
                />
              </div>
              <div className="sm:col-span-2">
                <Field
                  label="Imagen opcional"
                  onChange={(value) => {
                    setDraft((current) => ({ ...current, image: value }));
                  }}
                  placeholder="https://..."
                  value={draft.image}
                />
              </div>
              <SelectField
                label="Objetivo"
                onChange={(value) => {
                  setDraft((current) => ({ ...current, goalKey: value }));
                }}
                options={goalOptions}
                value={draft.goalKey}
              />
              <SelectField
                label="Categoria relacionada"
                onChange={(value) => {
                  setDraft((current) => ({ ...current, categoryKey: value }));
                }}
                options={categoryOptions}
                value={draft.categoryKey}
              />
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
              <input
                checked={draft.isActive}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, isActive: event.target.checked }));
                }}
                type="checkbox"
              />
              Rutina activa y disponible para recomendacion
            </label>

            <section className="mt-6 rounded-[1.6rem] border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Relacion de productos</p>
                  <h3 className="mt-2 font-serif text-2xl text-stone-900">Productos vinculados</h3>
                </div>
                <button
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                  onClick={addLinkedProduct}
                  type="button"
                >
                  Agregar producto
                </button>
              </div>

              <div className="mt-4 space-y-3">
                {draft.linkedProducts.map((linkedProduct, index) => (
                  <div className="grid gap-3 rounded-[1.2rem] bg-[#fff8f3] p-4 lg:grid-cols-[minmax(0,1fr)_130px_auto]" key={linkedProduct.clientId}>
                    <SelectField
                      label={`Producto ${index + 1}`}
                      onChange={(value) => {
                        setDraft((current) => ({
                          ...current,
                          linkedProducts: current.linkedProducts.map((entry) =>
                            entry.clientId === linkedProduct.clientId
                              ? { ...entry, productId: Number(value) }
                              : entry,
                          ),
                        }));
                      }}
                      options={productOptions}
                      value={String(linkedProduct.productId)}
                    />
                    <label className="space-y-2">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Principal</span>
                      <button
                        className={`w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
                          linkedProduct.isPrimary
                            ? "border-stone-950 bg-stone-950 text-white"
                            : "border-stone-300 bg-white text-stone-700"
                        }`}
                        onClick={() => {
                          setPrimaryLinkedProduct(linkedProduct.clientId);
                        }}
                        type="button"
                      >
                        {linkedProduct.isPrimary ? "Principal" : "Marcar"}
                      </button>
                    </label>
                    <div className="flex items-end">
                      <button
                        className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                        onClick={() => {
                          setDraft((current) => ({
                            ...current,
                            linkedProducts: current.linkedProducts.filter((entry) => entry.clientId !== linkedProduct.clientId),
                          }));
                        }}
                        type="button"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-6 rounded-[1.6rem] border border-stone-200 bg-white p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Timeline del modal</p>
                  <h3 className="mt-2 font-serif text-2xl text-stone-900">Pasos de la rutina</h3>
                </div>
                <button
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                  onClick={addStep}
                  type="button"
                >
                  Agregar paso
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {draft.steps
                  .slice()
                  .sort((left, right) => left.order - right.order)
                  .map((step) => (
                    <div className="rounded-[1.3rem] bg-[#fff8f3] p-4" key={step.clientId}>
                      <div className="grid gap-3 lg:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
                        <Field
                          label="Orden"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId
                                  ? { ...entry, order: Number(value) || 0 }
                                  : entry,
                              ),
                            }));
                          }}
                          type="number"
                          value={String(step.order)}
                        />
                        <SelectField
                          label="Producto"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId
                                  ? { ...entry, productId: Number(value) }
                                  : entry,
                              ),
                            }));
                          }}
                          options={productOptions}
                          value={String(step.productId)}
                        />
                        <Field
                          label="Badge"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId ? { ...entry, badge: value } : entry,
                              ),
                            }));
                          }}
                          placeholder="Producto actual"
                          value={step.badge}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-2">
                        <Field
                          label="Titulo"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId ? { ...entry, title: value } : entry,
                              ),
                            }));
                          }}
                          placeholder="Tratamiento clave"
                          value={step.title}
                        />
                        <Field
                          label="Imagen opcional"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId ? { ...entry, image: value } : entry,
                              ),
                            }));
                          }}
                          placeholder="https://..."
                          value={step.image}
                        />
                      </div>

                      <div className="mt-3">
                        <Field
                          label="Descripcion corta"
                          onChange={(value) => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.map((entry) =>
                                entry.clientId === step.clientId
                                  ? { ...entry, shortDescription: value }
                                  : entry,
                              ),
                            }));
                          }}
                          placeholder="Que aporta este paso a la rutina."
                          value={step.shortDescription}
                        />
                      </div>

                      <div className="mt-3 flex justify-end">
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700"
                          onClick={() => {
                            setDraft((current) => ({
                              ...current,
                              steps: current.steps.filter((entry) => entry.clientId !== step.clientId),
                            }));
                          }}
                          type="button"
                        >
                          Quitar paso
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
                disabled={isSaving}
                onClick={() => {
                  void handleSave();
                }}
                type="button"
              >
                {isSaving ? "Guardando..." : drawerMode === "create" ? "Crear rutina" : "Guardar cambios"}
              </button>
              {drawerMode === "edit" && activeRoutine ? (
                <button
                  className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700"
                  onClick={() => {
                    void handleDuplicate(activeRoutine);
                  }}
                  type="button"
                >
                  Duplicar
                </button>
              ) : null}
              {drawerMode === "edit" && activeRoutine ? (
                <button
                  className="rounded-full border border-stone-300 px-5 py-3 text-sm font-medium text-stone-700 disabled:opacity-60"
                  disabled={isDeleting}
                  onClick={() => {
                    void handleDelete();
                  }}
                  type="button"
                >
                  {isDeleting ? "Procesando..." : "Eliminar"}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "number";
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <input
        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: number | string }>;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <select
        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={String(option.value)} value={String(option.value)}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyBlock({ message }: { message: string }) {
  return (
    <div className="rounded-[1.6rem] border border-dashed border-stone-300 bg-[#fffaf6] px-6 py-12 text-center text-sm leading-7 text-stone-600">
      {message}
    </div>
  );
}

function NoticeBanner({
  notice,
  className = "",
}: {
  notice: Exclude<Notice, null>;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[1.2rem] border px-4 py-4 text-sm ${
        notice.kind === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-[#d8e3cf] bg-[#f3faf0] text-[#476638]"
      } ${className}`}
    >
      {notice.message}
    </div>
  );
}
