"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminGlobalSearch } from "@/components/admin/admin-global-search";
import { ADMIN_LOGIN_PATH } from "@/lib/admin-session";

const sections = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/clientes", label: "Clientes" },
];

const futureSections = ["Carritos", "Quiz de piel", "Marketing", "Descuentos", "Recompra", "Reviews", "Contenido", "Analitica", "Inventario", "Configuracion"];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    setIsNavOpen(false);
  }, [pathname]);

  if (pathname === ADMIN_LOGIN_PATH) {
    return <>{children}</>;
  }

  function isSectionActive(section: (typeof sections)[number]) {
    return section.href === "/admin" ? pathname === section.href : pathname === section.href || pathname.startsWith(`${section.href}/`);
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
    } finally {
      router.replace(ADMIN_LOGIN_PATH);
      router.refresh();
      setIsSigningOut(false);
    }
  }

  return (
    <>
      <div className="admin-workspace mx-auto w-full max-w-[1480px] px-3 py-3 sm:px-5 sm:py-4 lg:px-6 xl:px-8">
        <div className="grid items-start gap-3 xl:grid-cols-[240px_minmax(0,1fr)] xl:gap-8">
          <aside className="hidden xl:block">
            <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-[#fbf7f2] px-4 py-5">
              <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-5">
                <div>
                  <p className="section-label">Skin Hearten Admin</p>
                  <p className="mt-2 font-serif text-[1.9rem] leading-none text-stone-950">SuperAdmin</p>
                </div>
                <button
                  className="btn-ghost border border-stone-300 px-3 py-2 text-[11px]"
                  disabled={isSigningOut}
                  onClick={() => {
                    void handleSignOut();
                  }}
                  type="button"
                >
                  {isSigningOut ? "Cerrando" : "Salir"}
                </button>
              </div>

              <nav className="mt-5 space-y-1">
                {sections.map((section) => {
                  const isActive = isSectionActive(section);

                  return (
                    <Link
                      className={`flex items-center justify-between rounded-[1rem] px-3.5 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? "bg-stone-950 text-white"
                          : "text-stone-700 hover:bg-white hover:text-stone-950"
                      }`}
                      href={section.href}
                      key={section.href}
                    >
                      <span>{section.label}</span>
                      {isActive ? <span className="text-[10px] tracking-[0.08em] text-white/75">Actual</span> : null}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 border-t border-stone-200 pt-5">
                <p className="section-label px-3">Proximamente</p>
                <div className="mt-2 space-y-1">
                  {futureSections.map((label) => (
                    <span className="flex cursor-not-allowed items-center justify-between rounded-[1rem] px-3.5 py-2.5 text-sm text-stone-400" key={label}>
                      {label}
                      <span className="text-[10px]">Pronto</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-4">
            <div className="sticky top-2 z-30 rounded-[1.2rem] border border-stone-200 bg-[#fbf7f2]/95 px-3 py-3 backdrop-blur sm:px-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="section-label xl:hidden">Skin Hearten Admin</p>
                  <p className="mt-1 truncate font-serif text-[1.55rem] text-stone-950 xl:hidden sm:text-2xl">SuperAdmin</p>
                </div>
                <div className="hidden flex-1 justify-center xl:flex"><AdminGlobalSearch /></div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <button
                    className="btn-secondary px-3 py-2 text-xs"
                    onClick={() => {
                      setIsNavOpen(true);
                    }}
                    type="button"
                  >
                    Menu
                  </button>
                  <button
                    className="btn-ghost border border-stone-300 px-3 py-2 text-xs"
                    disabled={isSigningOut}
                    onClick={() => {
                      void handleSignOut();
                    }}
                    type="button"
                  >
                    Salir
                  </button>
                </div>
              </div>
              <div className="mt-3 xl:hidden"><AdminGlobalSearch /></div>
            </div>

            {children}
          </div>
        </div>
      </div>

      {isNavOpen ? (
        <div className="fixed inset-0 z-50 flex bg-stone-950/35 backdrop-blur-[2px] xl:hidden">
          <div className="h-full w-full max-w-[85vw] border-r border-stone-200 bg-[#fbf7f2] px-4 py-4 shadow-2xl sm:max-w-[320px]">
            <div className="flex items-start justify-between gap-3 border-b border-stone-200 pb-4">
              <div>
                <p className="section-label">Skin Hearten Admin</p>
                <p className="mt-2 font-serif text-[1.9rem] leading-none text-stone-950">SuperAdmin</p>
              </div>
              <button
                className="btn-secondary px-3 py-2 text-xs"
                onClick={() => {
                  setIsNavOpen(false);
                }}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <nav className="mt-5 space-y-1">
              {sections.map((section) => {
                const isActive = isSectionActive(section);

                return (
                  <Link
                    className={`block rounded-[1rem] px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? "bg-stone-950 text-white"
                        : "bg-white text-stone-700 hover:bg-stone-100 hover:text-stone-950"
                    }`}
                    href={section.href}
                    key={section.href}
                  >
                    {section.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <button
            aria-label="Cerrar menu"
            className="flex-1"
            onClick={() => {
              setIsNavOpen(false);
            }}
            type="button"
          />
        </div>
      ) : null}
    </>
  );
}
