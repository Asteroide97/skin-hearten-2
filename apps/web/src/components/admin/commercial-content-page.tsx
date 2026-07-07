"use client";

import { useEffect, useMemo, useState } from "react";

import {
  getDefaultCommercialContent,
  type CommercialActionConfig,
  type CommercialActionType,
  type CommercialBanner,
  type CommercialContent,
  type CommercialFooterColumn,
  type CommercialFooterLink,
  type CommercialHomeTestimonial,
  type CommercialNavItem,
  type CommercialNavigationType,
  type CommercialQuickLink,
  type CommercialRoutineGuideStep,
  type CommercialSciencePoint,
  type CommercialSection,
} from "@/lib/commercial-content";

type CommercialContentApiResponse =
  | { ok: true; data: CommercialContent }
  | { ok: false; reason: string; message?: string };

type Notice =
  | {
      kind: "error" | "success";
      message: string;
    }
  | null;

const navigationTypeOptions: Array<{ label: string; value: CommercialActionType }> = [
  { label: "URL", value: "url" },
  { label: "Categoria", value: "category" },
  { label: "Coleccion", value: "collection" },
  { label: "Skin Quiz", value: "skin_quiz" },
  { label: "Pagina", value: "page" },
  { label: "Rutina", value: "routine" },
];

const actionTypeOptions: Array<{ label: string; value: CommercialActionType }> = [
  { label: "Skin Quiz", value: "skin_quiz" },
  { label: "Buscar", value: "search" },
  { label: "Categoria", value: "category" },
  { label: "Coleccion", value: "collection" },
  { label: "Producto", value: "product" },
  { label: "Rutina", value: "routine" },
  { label: "Pagina", value: "page" },
  { label: "URL", value: "url" },
];

function cloneContent(content: CommercialContent) {
  return JSON.parse(JSON.stringify(content)) as CommercialContent;
}

function normalizeOrderedItems<TItem extends { order: number }>(items: TItem[]) {
  return items.map((item, index) => ({ ...item, order: index }));
}

function moveItem<TItem>(items: TItem[], fromIndex: number, toIndex: number) {
  const nextItems = [...items];
  const [removedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, removedItem);
  return nextItems;
}

function getPageMessage(reason: string | null) {
  if (!reason) {
    return "Ajusta header, hero, accesos, bloques editoriales y footer sin tocar codigo.";
  }

  if (reason === "api_url_missing") {
    return "Configura NEXT_PUBLIC_API_URL para administrar contenido comercial real desde FastAPI.";
  }

  if (reason === "auth_failed") {
    return "Tu sesion de SuperAdmin expiro. Vuelve a iniciar sesion para guardar cambios.";
  }

  return "No pudimos cargar el contenido comercial por ahora. El panel usa fallback seguro para que puedas revisar la estructura.";
}

export function CommercialContentPage() {
  const [draft, setDraft] = useState<CommercialContent>(getDefaultCommercialContent());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [draggedQuickLinkIndex, setDraggedQuickLinkIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCommercialContent() {
      setIsLoading(true);

      try {
        const response = await fetch("/api/admin/commercial-content", {
          cache: "no-store",
        });
        const payload = (await response.json()) as CommercialContentApiResponse;

        if (cancelled) {
          return;
        }

        if (!response.ok || !payload.ok) {
          setDraft(getDefaultCommercialContent());
          setErrorReason(payload.ok ? "fetch_failed" : payload.reason);
          return;
        }

        setDraft(cloneContent(payload.data));
        setErrorReason(null);
      } catch {
        if (!cancelled) {
          setDraft(getDefaultCommercialContent());
          setErrorReason("fetch_failed");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadCommercialContent();
    return () => {
      cancelled = true;
    };
  }, []);

  const orderedNavigation = useMemo(() => normalizeOrderedItems([...draft.navigation]), [draft.navigation]);
  const orderedQuickLinks = useMemo(() => normalizeOrderedItems([...draft.quickLinks]), [draft.quickLinks]);
  const orderedSections = useMemo(() => normalizeOrderedItems([...draft.sections]), [draft.sections]);
  const orderedBanners = useMemo(() => normalizeOrderedItems([...draft.banners]), [draft.banners]);

  async function handleSave() {
    setIsSaving(true);
    setNotice(null);

    try {
      const response = await fetch("/api/admin/commercial-content", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json()) as CommercialContentApiResponse;

      if (!response.ok || !payload.ok) {
        setNotice({
          kind: "error",
          message: payload.ok ? "No pudimos guardar el contenido comercial." : payload.message ?? "No pudimos guardar el contenido comercial.",
        });
        return;
      }

      setDraft(cloneContent(payload.data));
      setNotice({
        kind: "success",
        message: "Contenido comercial guardado correctamente.",
      });
      setErrorReason(null);
    } catch {
      setNotice({
        kind: "error",
        message: "No pudimos guardar el contenido comercial por ahora.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="soft-panel rounded-[1.8rem] p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">Contenido Comercial</p>
            <h1 className="mt-2 font-serif text-4xl text-stone-900">CMS interno</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">{getPageMessage(errorReason)}</p>
          </div>
          <button
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
            disabled={isSaving}
            onClick={() => {
              void handleSave();
            }}
            type="button"
          >
            {isSaving ? "Guardando..." : "Guardar contenido"}
          </button>
        </div>

        {notice ? <NoticeBanner className="mt-5" notice={notice} /> : null}
      </section>

      <section className="soft-panel rounded-[1.8rem] p-5 sm:p-6">
        {isLoading ? (
          <EmptyBlock message="Cargando contenido comercial real..." />
        ) : (
          <div className="space-y-6">
            <EditorSection
              description="Logo textual, textos superiores y menu principal."
              title="Header"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Logo"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      header: { ...current.header, logoText: value },
                    }));
                  }}
                  value={draft.header.logoText}
                />
                <Field
                  label="Logo imagen"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      header: { ...current.header, logoImage: value },
                    }));
                  }}
                  placeholder="https://..."
                  value={draft.header.logoImage ?? ""}
                />
                <Field
                  label="Texto superior izquierdo"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      header: { ...current.header, topLeftText: value },
                    }));
                  }}
                  value={draft.header.topLeftText ?? ""}
                />
                <Field
                  label="Texto superior derecho"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      header: { ...current.header, topRightText: value },
                    }));
                  }}
                  value={draft.header.topRightText ?? ""}
                />
                <div className="sm:col-span-2">
                  <Field
                    label="WhatsApp soporte"
                    onChange={(value) => {
                      setDraft((current) => ({
                        ...current,
                        header: { ...current.header, supportWhatsAppUrl: value },
                      }));
                    }}
                    value={draft.header.supportWhatsAppUrl ?? ""}
                  />
                </div>
              </div>

              <ArrayHeader
                actionLabel="Agregar item"
                onAdd={() => {
                  setDraft((current) => ({
                    ...current,
                    navigation: normalizeOrderedItems([
                      ...current.navigation,
                      { name: "Nuevo item", order: current.navigation.length, active: true, type: "url", value: "/" },
                    ]),
                  }));
                }}
                title="Menu principal"
              />

              <div className="space-y-3">
                {orderedNavigation.map((item, index) => (
                  <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4" key={`${item.name}-${index}`}>
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
                      <Field
                        label="Nombre"
                        onChange={(value) => {
                          updateOrderedArray("navigation", index, { name: value });
                        }}
                        value={item.name}
                      />
                        <SelectField
                          label="Tipo"
                          onChange={(value) => {
                            updateOrderedArray("navigation", index, { type: value as CommercialNavigationType });
                          }}
                          options={navigationTypeOptions}
                          value={item.type}
                      />
                      <Field
                        label="Valor"
                        onChange={(value) => {
                          updateOrderedArray("navigation", index, { value });
                        }}
                        value={item.value}
                      />
                      <div className="flex items-end justify-end gap-2">
                        <TogglePill
                          active={item.active}
                          label={item.active ? "Activo" : "Inactivo"}
                          onToggle={() => {
                            updateOrderedArray("navigation", index, { active: !item.active });
                          }}
                        />
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                          onClick={() => {
                            removeOrderedArrayItem("navigation", index);
                          }}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </EditorSection>

            <EditorSection
              description="Diagnostico y accesos orientados por intencion. Incluye drag & drop para ordenar."
              title="Accesos rapidos"
            >
              <ArrayHeader
                actionLabel="Agregar acceso"
                onAdd={() => {
                  setDraft((current) => ({
                    ...current,
                    quickLinks: normalizeOrderedItems([
                      ...current.quickLinks,
                      {
                        name: "Nuevo acceso",
                        icon: "N",
                        order: current.quickLinks.length,
                        active: true,
                        action: "url",
                        value: "/",
                      },
                    ]),
                  }));
                }}
                title="Lista de accesos"
              />

              <div className="space-y-3">
                {orderedQuickLinks.map((item, index) => (
                  <div
                    className="rounded-[1.2rem] border border-stone-200 bg-white p-4"
                    draggable
                    key={`${item.name}-${index}`}
                    onDragOver={(event) => {
                      event.preventDefault();
                    }}
                    onDragStart={() => {
                      setDraggedQuickLinkIndex(index);
                    }}
                    onDrop={() => {
                      if (draggedQuickLinkIndex === null || draggedQuickLinkIndex === index) {
                        return;
                      }

                      setDraft((current) => ({
                        ...current,
                        quickLinks: normalizeOrderedItems(
                          moveItem(current.quickLinks, draggedQuickLinkIndex, index),
                        ),
                      }));
                      setDraggedQuickLinkIndex(null);
                    }}
                  >
                    <div className="grid gap-3 xl:grid-cols-[90px_minmax(0,1fr)_150px_minmax(0,1fr)_auto]">
                      <Field
                        label="Icono"
                        onChange={(value) => {
                          updateOrderedArray("quickLinks", index, { icon: value });
                        }}
                        value={item.icon ?? ""}
                      />
                      <Field
                        label="Nombre"
                        onChange={(value) => {
                          updateOrderedArray("quickLinks", index, { name: value });
                        }}
                        value={item.name}
                      />
                      <SelectField
                        label="Accion"
                        onChange={(value) => {
                          updateOrderedArray("quickLinks", index, { action: value as CommercialActionType });
                        }}
                        options={actionTypeOptions}
                        value={item.action}
                      />
                      <Field
                        label="Valor"
                        onChange={(value) => {
                          updateOrderedArray("quickLinks", index, { value });
                        }}
                        value={item.value}
                      />
                      <div className="flex items-end justify-end gap-2">
                        <TogglePill
                          active={item.active}
                          label={item.active ? "Activo" : "Inactivo"}
                          onToggle={() => {
                            updateOrderedArray("quickLinks", index, { active: !item.active });
                          }}
                        />
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                          onClick={() => {
                            removeOrderedArrayItem("quickLinks", index);
                          }}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-stone-500">Arrastra para reordenar.</p>
                  </div>
                ))}
              </div>
            </EditorSection>

            <EditorSection
              description="Copy principal, CTAs y senales de confianza que viven arriba del home."
              title="Hero principal"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextAreaField
                    label="Titulo"
                    onChange={(value) => {
                      setDraft((current) => ({
                        ...current,
                        hero: { ...current.hero, title: value },
                      }));
                    }}
                    rows={3}
                    value={draft.hero.title}
                  />
                </div>
                <div className="sm:col-span-2">
                  <TextAreaField
                    label="Subtitulo"
                    onChange={(value) => {
                      setDraft((current) => ({
                        ...current,
                        hero: { ...current.hero, subtitle: value },
                      }));
                    }}
                    rows={3}
                    value={draft.hero.subtitle ?? ""}
                  />
                </div>
                <Field
                  label="Imagen"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, image: value },
                    }));
                  }}
                  placeholder="https://..."
                  value={draft.hero.image ?? ""}
                />
                <Field
                  label="Video"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, video: value },
                    }));
                  }}
                  placeholder="https://..."
                  value={draft.hero.video ?? ""}
                />
                <Field
                  label="Color de fondo"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, backgroundColor: value },
                    }));
                  }}
                  value={draft.hero.backgroundColor ?? ""}
                />
                <label className="flex items-center gap-3 rounded-[1.2rem] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-700">
                  <input
                    checked={draft.hero.isVisible}
                    onChange={(event) => {
                      setDraft((current) => ({
                        ...current,
                        hero: { ...current.hero, isVisible: event.target.checked },
                      }));
                    }}
                    type="checkbox"
                  />
                  Mostrar hero
                </label>
              </div>

              <div className="mt-5 grid gap-4 xl:grid-cols-3">
                <ActionConfigCard
                  action={draft.hero.primaryButton}
                  label="Boton principal"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, primaryButton: value },
                    }));
                  }}
                />
                <ActionConfigCard
                  action={draft.hero.secondaryButton}
                  label="Boton secundario"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, secondaryButton: value },
                    }));
                  }}
                />
                <ActionConfigCard
                  action={draft.hero.tertiaryButton ?? { label: "", type: "url", value: "" }}
                  label="Boton terciario"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      hero: { ...current.hero, tertiaryButton: value.label.trim().length > 0 ? value : null },
                    }));
                  }}
                />
              </div>

              <StringListEditor
                items={draft.hero.trustSignals}
                label="Indicadores de confianza"
                onChange={(items) => {
                  setDraft((current) => ({
                    ...current,
                    hero: { ...current.hero, trustSignals: items },
                  }));
                }}
              />
            </EditorSection>

            <EditorSection
              description="Orden, visibilidad y copy breve de cada bloque del home."
              title="Bloques editoriales"
            >
              <div className="space-y-3">
                {orderedSections.map((section, index) => (
                  <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4" key={`${section.key}-${index}`}>
                    <div className="grid gap-3 xl:grid-cols-[140px_140px_minmax(0,1fr)_auto]">
                      <Field
                        label="Clave"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { key: value });
                        }}
                        value={section.key}
                      />
                      <Field
                        label="Eyebrow"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { eyebrow: value });
                        }}
                        value={section.eyebrow ?? ""}
                      />
                      <Field
                        label="Titulo"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { title: value });
                        }}
                        value={section.title}
                      />
                      <div className="flex items-end justify-end gap-2">
                        <TogglePill
                          active={section.active}
                          label={section.active ? "Activo" : "Inactivo"}
                          onToggle={() => {
                            updateOrderedArray("sections", index, { active: !section.active });
                          }}
                        />
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                          onClick={() => {
                            removeOrderedArrayItem("sections", index);
                          }}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_180px_180px]">
                      <TextAreaField
                        label="Descripcion"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { description: value });
                        }}
                        rows={3}
                        value={section.description ?? ""}
                      />
                      <Field
                        label="CTA label"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { ctaLabel: value });
                        }}
                        value={section.ctaLabel ?? ""}
                      />
                      <SelectField
                        label="CTA tipo"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { ctaType: value as CommercialActionType });
                        }}
                        options={actionTypeOptions}
                        value={section.ctaType ?? "url"}
                      />
                    </div>
                    <div className="mt-3">
                      <Field
                        label="CTA valor"
                        onChange={(value) => {
                          updateOrderedArray("sections", index, { ctaValue: value });
                        }}
                        value={section.ctaValue ?? ""}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <ArrayHeader
                actionLabel="Agregar bloque"
                onAdd={() => {
                  setDraft((current) => ({
                    ...current,
                    sections: normalizeOrderedItems([
                      ...current.sections,
                      {
                        key: `bloque-${current.sections.length + 1}`,
                        eyebrow: "",
                        title: "Nuevo bloque",
                        description: "",
                        ctaLabel: "",
                        ctaType: "url",
                        ctaValue: "/",
                        order: current.sections.length,
                        active: true,
                      },
                    ]),
                  }));
                }}
                title="Lista de bloques"
              />

              <ObjectListEditor<CommercialRoutineGuideStep>
                description="Pasos introductorios del bloque de rutinas destacadas cuando la clienta aun no completa el quiz."
                items={draft.routineGuideSteps}
                label="Rutinas destacadas"
                onAdd={() => ({ eyebrow: "Nuevo paso", title: "Titulo", description: "Descripcion" })}
                onChange={(items) => {
                  setDraft((current) => ({ ...current, routineGuideSteps: items }));
                }}
                renderFields={(item, index, updateItem) => (
                  <div className="grid gap-3 xl:grid-cols-3">
                    <Field label="Eyebrow" onChange={(value) => updateItem(index, { eyebrow: value })} value={item.eyebrow} />
                    <Field label="Titulo" onChange={(value) => updateItem(index, { title: value })} value={item.title} />
                    <Field
                      label="Descripcion"
                      onChange={(value) => updateItem(index, { description: value })}
                      value={item.description}
                    />
                  </div>
                )}
              />

              <ObjectListEditor<CommercialSciencePoint>
                description="Puntos editoriales del bloque ciencia/beneficios."
                items={draft.sciencePoints}
                label="Beneficios editoriales"
                onAdd={() => ({ eyebrow: "Nuevo punto", title: "Titulo", description: "Descripcion" })}
                onChange={(items) => {
                  setDraft((current) => ({ ...current, sciencePoints: items }));
                }}
                renderFields={(item, index, updateItem) => (
                  <div className="grid gap-3 xl:grid-cols-3">
                    <Field label="Eyebrow" onChange={(value) => updateItem(index, { eyebrow: value })} value={item.eyebrow} />
                    <Field label="Titulo" onChange={(value) => updateItem(index, { title: value })} value={item.title} />
                    <Field
                      label="Descripcion"
                      onChange={(value) => updateItem(index, { description: value })}
                      value={item.description}
                    />
                  </div>
                )}
              />

              <ObjectListEditor<CommercialHomeTestimonial>
                description="Testimonios destacados del home."
                items={draft.homeTestimonials}
                label="Resenas / testimonios"
                onAdd={() => ({ name: "Nueva clienta", city: "Ciudad", rating: 5, text: "Comentario" })}
                onChange={(items) => {
                  setDraft((current) => ({ ...current, homeTestimonials: items }));
                }}
                renderFields={(item, index, updateItem) => (
                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_200px_120px_minmax(0,1.4fr)]">
                    <Field label="Nombre" onChange={(value) => updateItem(index, { name: value })} value={item.name} />
                    <Field label="Ciudad" onChange={(value) => updateItem(index, { city: value })} value={item.city} />
                    <Field
                      label="Rating"
                      onChange={(value) => updateItem(index, { rating: Number(value) || 5 })}
                      type="number"
                      value={String(item.rating)}
                    />
                    <Field label="Texto" onChange={(value) => updateItem(index, { text: value })} value={item.text} />
                  </div>
                )}
              />
            </EditorSection>

            <EditorSection
              description="Mensajes globales preparados para top bar, temporada, promociones, envios o WhatsApp."
              title="Mensajes globales"
            >
              <ArrayHeader
                actionLabel="Agregar mensaje"
                onAdd={() => {
                  setDraft((current) => ({
                    ...current,
                    banners: normalizeOrderedItems([
                      ...current.banners,
                      {
                        key: `mensaje-${current.banners.length + 1}`,
                        title: "Nuevo mensaje",
                        message: "",
                        value: "",
                        order: current.banners.length,
                        active: true,
                      },
                    ]),
                  }));
                }}
                title="Lista de mensajes"
              />
              <div className="space-y-3">
                {orderedBanners.map((banner, index) => (
                  <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4" key={`${banner.key}-${index}`}>
                    <div className="grid gap-3 xl:grid-cols-[140px_180px_minmax(0,1fr)_auto]">
                      <Field label="Clave" onChange={(value) => updateOrderedArray("banners", index, { key: value })} value={banner.key} />
                      <Field label="Titulo" onChange={(value) => updateOrderedArray("banners", index, { title: value })} value={banner.title} />
                      <Field label="Valor" onChange={(value) => updateOrderedArray("banners", index, { value })} value={banner.value ?? ""} />
                      <div className="flex items-end justify-end gap-2">
                        <TogglePill
                          active={banner.active}
                          label={banner.active ? "Activo" : "Inactivo"}
                          onToggle={() => {
                            updateOrderedArray("banners", index, { active: !banner.active });
                          }}
                        />
                        <button
                          className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                          onClick={() => {
                            removeOrderedArrayItem("banners", index);
                          }}
                          type="button"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                    <div className="mt-3">
                      <TextAreaField
                        label="Mensaje"
                        onChange={(value) => {
                          updateOrderedArray("banners", index, { message: value });
                        }}
                        rows={3}
                        value={banner.message ?? ""}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </EditorSection>

            <EditorSection
              description="Columnas, links, redes, contacto y texto de soporte del footer."
              title="Footer"
            >
              <div className="space-y-4">
                <TextAreaField
                  label="Intro"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, introText: value },
                    }));
                  }}
                  rows={3}
                  value={draft.footer.introText ?? ""}
                />

                <StringListEditor
                  items={draft.footer.contactLines}
                  label="Lineas de contacto"
                  onChange={(items) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, contactLines: items },
                    }));
                  }}
                />

                <FooterColumnsEditor
                  columns={draft.footer.columns}
                  onChange={(columns) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, columns },
                    }));
                  }}
                />

                <FooterLinksEditor
                  items={draft.footer.legalLinks}
                  label="Links legales"
                  onChange={(legalLinks) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, legalLinks },
                    }));
                  }}
                />

                <SocialLinksEditor
                  items={draft.footer.socialLinks}
                  onChange={(socialLinks) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, socialLinks },
                    }));
                  }}
                />

                <TextAreaField
                  label="Aviso"
                  onChange={(value) => {
                    setDraft((current) => ({
                      ...current,
                      footer: { ...current.footer, noticeText: value },
                    }));
                  }}
                  rows={3}
                  value={draft.footer.noticeText ?? ""}
                />
              </div>
            </EditorSection>

            <div className="flex justify-end">
              <button
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-medium text-white disabled:bg-stone-300"
                disabled={isSaving}
                onClick={() => {
                  void handleSave();
                }}
                type="button"
              >
                {isSaving ? "Guardando..." : "Guardar contenido"}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );

  function updateOrderedArray(
    key: "navigation" | "quickLinks" | "sections" | "banners",
    index: number,
    patch: Partial<CommercialNavItem> | Partial<CommercialQuickLink> | Partial<CommercialSection> | Partial<CommercialBanner>,
  ) {
    setDraft((current) => {
      const nextItems = [...current[key]];
      nextItems[index] = { ...nextItems[index], ...patch } as (typeof nextItems)[number];

      if (key === "navigation") {
        return { ...current, navigation: normalizeOrderedItems(nextItems as CommercialNavItem[]) };
      }
      if (key === "quickLinks") {
        return { ...current, quickLinks: normalizeOrderedItems(nextItems as CommercialQuickLink[]) };
      }
      if (key === "sections") {
        return { ...current, sections: normalizeOrderedItems(nextItems as CommercialSection[]) };
      }
      return { ...current, banners: normalizeOrderedItems(nextItems as CommercialBanner[]) };
    });
  }

  function removeOrderedArrayItem(key: "navigation" | "quickLinks" | "sections" | "banners", index: number) {
    setDraft((current) => {
      const nextItems = current[key].filter((_, itemIndex) => itemIndex !== index);

      if (key === "navigation") {
        return { ...current, navigation: normalizeOrderedItems(nextItems as CommercialNavItem[]) };
      }
      if (key === "quickLinks") {
        return { ...current, quickLinks: normalizeOrderedItems(nextItems as CommercialQuickLink[]) };
      }
      if (key === "sections") {
        return { ...current, sections: normalizeOrderedItems(nextItems as CommercialSection[]) };
      }
      return { ...current, banners: normalizeOrderedItems(nextItems as CommercialBanner[]) };
    });
  }
}

function EditorSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{title}</p>
        <p className="mt-2 text-sm leading-7 text-stone-600">{description}</p>
      </div>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function ArrayHeader({
  title,
  actionLabel,
  onAdd,
}: {
  title: string;
  actionLabel: string;
  onAdd: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm font-semibold text-stone-900">{title}</p>
      <button className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700" onClick={onAdd} type="button">
        {actionLabel}
      </button>
    </div>
  );
}

function ActionConfigCard({
  label,
  action,
  onChange,
}: {
  label: string;
  action: CommercialActionConfig;
  onChange: (value: CommercialActionConfig) => void;
}) {
  return (
    <div className="rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <p className="text-sm font-semibold text-stone-900">{label}</p>
      <div className="mt-4 space-y-3">
        <Field
          label="Texto"
          onChange={(value) => {
            onChange({ ...action, label: value });
          }}
          value={action.label}
        />
        <SelectField
          label="Tipo"
          onChange={(value) => {
            onChange({ ...action, type: value as CommercialActionType });
          }}
          options={actionTypeOptions}
          value={action.type}
        />
        <Field
          label="Valor"
          onChange={(value) => {
            onChange({ ...action, value });
          }}
          value={action.value}
        />
      </div>
    </div>
  );
}

function StringListEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <ArrayHeader
        actionLabel="Agregar linea"
        onAdd={() => {
          onChange([...items, ""]);
        }}
        title={label}
      />
      {items.map((item, index) => (
        <div className="flex gap-3" key={`${label}-${index}`}>
          <input
            className="w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700"
            onChange={(event) => {
              const nextItems = [...items];
              nextItems[index] = event.target.value;
              onChange(nextItems);
            }}
            value={item}
          />
          <button
            className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
            onClick={() => {
              onChange(items.filter((_, itemIndex) => itemIndex !== index));
            }}
            type="button"
          >
            Quitar
          </button>
        </div>
      ))}
    </div>
  );
}

function ObjectListEditor<TItem>({
  label,
  description,
  items,
  onChange,
  onAdd,
  renderFields,
}: {
  label: string;
  description: string;
  items: TItem[];
  onChange: (items: TItem[]) => void;
  onAdd: () => TItem;
  renderFields: (
    item: TItem,
    index: number,
    updateItem: (index: number, patch: Partial<TItem>) => void,
  ) => React.ReactNode;
}) {
  function updateItem(index: number, patch: Partial<TItem>) {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], ...patch };
    onChange(nextItems);
  }

  return (
    <div className="space-y-3 rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <ArrayHeader
        actionLabel="Agregar item"
        onAdd={() => {
          onChange([...items, onAdd()]);
        }}
        title={label}
      />
      <p className="text-xs leading-6 text-stone-500">{description}</p>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div className="rounded-[1rem] border border-stone-200 bg-[#fffaf6] p-4" key={`${label}-${index}`}>
            {renderFields(item, index, updateItem)}
            <div className="mt-3 flex justify-end">
              <button
                className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
                onClick={() => {
                  onChange(items.filter((_, itemIndex) => itemIndex !== index));
                }}
                type="button"
              >
                Quitar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FooterColumnsEditor({
  columns,
  onChange,
}: {
  columns: CommercialFooterColumn[];
  onChange: (columns: CommercialFooterColumn[]) => void;
}) {
  function updateColumn(index: number, patch: Partial<CommercialFooterColumn>) {
    const nextColumns = [...columns];
    nextColumns[index] = { ...nextColumns[index], ...patch };
    onChange(nextColumns);
  }

  return (
    <div className="space-y-3 rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <ArrayHeader
        actionLabel="Agregar columna"
        onAdd={() => {
          onChange([...columns, { title: "Nueva columna", links: [] }]);
        }}
        title="Columnas"
      />
      {columns.map((column, columnIndex) => (
        <div className="rounded-[1rem] border border-stone-200 bg-[#fffaf6] p-4" key={`${column.title}-${columnIndex}`}>
          <div className="flex gap-3">
            <Field
              label="Titulo"
              onChange={(value) => {
                updateColumn(columnIndex, { title: value });
              }}
              value={column.title}
            />
            <button
              className="mt-8 rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
              onClick={() => {
                onChange(columns.filter((_, index) => index !== columnIndex));
              }}
              type="button"
            >
              Quitar
            </button>
          </div>

          <FooterLinksEditor
            items={column.links}
            label="Links de columna"
            onChange={(links) => {
              updateColumn(columnIndex, { links });
            }}
          />
        </div>
      ))}
    </div>
  );
}

function FooterLinksEditor({
  label,
  items,
  onChange,
}: {
  label: string;
  items: CommercialFooterLink[];
  onChange: (items: CommercialFooterLink[]) => void;
}) {
  function updateLink(index: number, patch: Partial<CommercialFooterLink>) {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], ...patch };
    onChange(nextItems);
  }

  return (
    <div className="mt-4 space-y-3">
      <ArrayHeader
        actionLabel="Agregar link"
        onAdd={() => {
          onChange([...items, { label: "Nuevo link", type: "url", value: "/" }]);
        }}
        title={label}
      />
      {items.map((item, index) => (
        <div className="grid gap-3 rounded-[1rem] border border-stone-200 bg-white p-4 xl:grid-cols-[minmax(0,1fr)_150px_minmax(0,1fr)_auto]" key={`${item.label}-${index}`}>
          <Field label="Label" onChange={(value) => updateLink(index, { label: value })} value={item.label} />
          <SelectField
            label="Tipo"
            onChange={(value) => updateLink(index, { type: value as CommercialActionType })}
            options={actionTypeOptions}
            value={item.type}
          />
          <Field label="Valor" onChange={(value) => updateLink(index, { value })} value={item.value} />
          <div className="flex items-end justify-end">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
              onClick={() => {
                onChange(items.filter((_, itemIndex) => itemIndex !== index));
              }}
              type="button"
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialLinksEditor({
  items,
  onChange,
}: {
  items: Array<{ label: string; url: string }>;
  onChange: (items: Array<{ label: string; url: string }>) => void;
}) {
  function updateItem(index: number, patch: Partial<{ label: string; url: string }>) {
    const nextItems = [...items];
    nextItems[index] = { ...nextItems[index], ...patch };
    onChange(nextItems);
  }

  return (
    <div className="space-y-3 rounded-[1.2rem] border border-stone-200 bg-white p-4">
      <ArrayHeader
        actionLabel="Agregar red"
        onAdd={() => {
          onChange([...items, { label: "Nueva red", url: "https://" }]);
        }}
        title="Redes"
      />
      {items.map((item, index) => (
        <div className="grid gap-3 rounded-[1rem] border border-stone-200 bg-[#fffaf6] p-4 xl:grid-cols-[220px_minmax(0,1fr)_auto]" key={`${item.label}-${index}`}>
          <Field label="Label" onChange={(value) => updateItem(index, { label: value })} value={item.label} />
          <Field label="URL" onChange={(value) => updateItem(index, { url: value })} value={item.url} />
          <div className="flex items-end justify-end">
            <button
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700"
              onClick={() => {
                onChange(items.filter((_, itemIndex) => itemIndex !== index));
              }}
              type="button"
            >
              Quitar
            </button>
          </div>
        </div>
      ))}
    </div>
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

function TextAreaField({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-stone-900">{label}</span>
      <textarea
        className="mt-3 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm leading-7 text-stone-700"
        onChange={(event) => {
          onChange(event.target.value);
        }}
        rows={rows}
        value={value}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
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
          <option key={`${option.label}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TogglePill({
  active,
  label,
  onToggle,
}: {
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      className={`rounded-full border px-4 py-2 text-sm font-medium ${
        active ? "border-[#d8e3cf] bg-[#f3faf0] text-[#476638]" : "border-stone-300 bg-white text-stone-700"
      }`}
      onClick={onToggle}
      type="button"
    >
      {label}
    </button>
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
