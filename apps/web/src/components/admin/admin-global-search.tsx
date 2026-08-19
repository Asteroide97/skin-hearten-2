"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";

import { SearchIcon } from "@/components/shared/icons";
import type { AdminCustomerSummary } from "@/lib/admin-customers";
import type { AdminOrderSummary } from "@/lib/admin-orders";
import type { AdminProduct } from "@/lib/admin-products";

type SearchState = {
  customers: AdminCustomerSummary[];
  orders: AdminOrderSummary[];
  products: AdminProduct[];
};

const emptyResults: SearchState = { customers: [], orders: [], products: [] };

export function AdminGlobalSearch() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());
  const [results, setResults] = useState<SearchState>(emptyResults);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (deferredQuery.length < 2) {
      setResults(emptyResults);
      return;
    }

    let cancelled = false;
    const encodedQuery = encodeURIComponent(deferredQuery);

    async function search() {
      setIsLoading(true);
      try {
        const [ordersResponse, customersResponse, productsResponse] = await Promise.all([
          fetch(`/api/admin/orders?search=${encodedQuery}`, { cache: "no-store" }),
          fetch(`/api/admin/customers?search=${encodedQuery}&pageSize=5`, { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
        ]);
        const ordersPayload = (await ordersResponse.json()) as { ok: boolean; data?: AdminOrderSummary[] };
        const customersPayload = (await customersResponse.json()) as {
          ok: boolean;
          data?: { items: AdminCustomerSummary[] };
        };
        const productsPayload = (await productsResponse.json()) as { ok: boolean; data?: AdminProduct[] };

        if (cancelled) return;

        const normalizedQuery = deferredQuery.toLocaleLowerCase("es-MX");
        setResults({
          orders: ordersPayload.ok ? (ordersPayload.data ?? []).slice(0, 5) : [],
          customers: customersPayload.ok ? (customersPayload.data?.items ?? []).slice(0, 5) : [],
          products: productsPayload.ok
            ? (productsPayload.data ?? [])
                .filter((product) => `${product.name} ${product.sku} ${product.category}`.toLocaleLowerCase("es-MX").includes(normalizedQuery))
                .slice(0, 5)
            : [],
        });
      } catch {
        if (!cancelled) setResults(emptyResults);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void search();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery]);

  const hasResults = results.orders.length + results.customers.length + results.products.length > 0;

  return (
    <div className="relative w-full max-w-xl">
      <label className="flex min-h-11 items-center gap-3 rounded-full border border-stone-200 bg-white px-4">
        <SearchIcon className="h-4 w-4 shrink-0 text-stone-500" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-stone-900 outline-none placeholder:text-stone-400"
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar pedidos, clientes o productos"
          value={query}
        />
        {isLoading ? <span className="text-xs text-stone-400">Buscando</span> : null}
      </label>

      {deferredQuery.length >= 2 ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-[1.3rem] border border-stone-200 bg-[#fffdfa] p-2 shadow-[0_20px_50px_rgba(31,24,19,0.12)]">
          {hasResults ? (
            <div className="max-h-[min(60vh,460px)] overflow-y-auto">
              <SearchGroup label="Pedidos" items={results.orders.map((order) => ({ href: `/admin/pedidos/${order.id}`, label: order.orderNumber, meta: order.customerName }))} />
              <SearchGroup label="Clientes" items={results.customers.map((customer) => ({ href: `/admin/clientes/${customer.id}`, label: customer.name, meta: customer.email ?? "Sin email" }))} />
              <SearchGroup label="Productos" items={results.products.map((product) => ({ href: `/admin/productos/${product.id}`, label: product.name, meta: `${product.sku} · ${product.category}` }))} />
            </div>
          ) : (
            <p className="px-4 py-5 text-sm text-stone-500">No encontramos resultados para “{deferredQuery}”.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SearchGroup({ label, items }: { label: string; items: Array<{ href: string; label: string; meta: string }> }) {
  if (items.length === 0) return null;

  return (
    <section className="px-2 py-2">
      <p className="px-2 pb-1 text-[0.68rem] font-semibold tracking-[0.14em] text-stone-500">{label}</p>
      {items.map((item) => (
        <Link className="block rounded-xl px-3 py-2.5 transition hover:bg-[#f7f0e9]" href={item.href} key={item.href}>
          <p className="text-sm font-semibold text-stone-900">{item.label}</p>
          <p className="mt-0.5 truncate text-xs text-stone-500">{item.meta}</p>
        </Link>
      ))}
    </section>
  );
}
