"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { AdminCustomerSummary } from "@/lib/admin-customers";
import { getAdminOrderStatusLabel, getAdminPaymentStatusLabel, type AdminOrderSummary } from "@/lib/admin-orders";
import type { AdminProduct } from "@/lib/admin-products";
import { formatCurrency, formatDateTime } from "@/lib/format";

type DashboardData = {
  customers: AdminCustomerSummary[];
  orders: AdminOrderSummary[];
  products: AdminProduct[];
};

const emptyDashboard: DashboardData = { customers: [], orders: [], products: [] };

function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData>(emptyDashboard);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        const [ordersResponse, customersResponse, productsResponse] = await Promise.all([
          fetch("/api/admin/orders", { cache: "no-store" }),
          fetch("/api/admin/customers?pageSize=100", { cache: "no-store" }),
          fetch("/api/admin/products", { cache: "no-store" }),
        ]);
        const ordersPayload = (await ordersResponse.json()) as { ok: boolean; data?: AdminOrderSummary[] };
        const customersPayload = (await customersResponse.json()) as { ok: boolean; data?: { items: AdminCustomerSummary[] } };
        const productsPayload = (await productsResponse.json()) as { ok: boolean; data?: AdminProduct[] };
        if (cancelled) return;
        if (!ordersPayload.ok || !customersPayload.ok || !productsPayload.ok) {
          setHasError(true);
          return;
        }
        setData({ orders: ordersPayload.data ?? [], customers: customersPayload.data?.items ?? [], products: productsPayload.data ?? [] });
        setHasError(false);
      } catch {
        if (!cancelled) setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const metrics = useMemo(() => {
    const ordersToday = data.orders.filter((order) => isToday(order.createdAt));
    const paidOrders = data.orders.filter((order) => order.paymentStatus === "paid");
    const salesToday = ordersToday.reduce((total, order) => total + order.total, 0);
    const averageTicket = paidOrders.length > 0 ? paidOrders.reduce((total, order) => total + order.total, 0) / paidOrders.length : 0;
    return {
      averageTicket,
      lowStock: data.products.filter((product) => product.stock > 0 && product.stock <= 5),
      newCustomers: data.customers.filter((customer) => isToday(customer.createdAt)).length,
      ordersToday,
      pendingOrders: data.orders.filter((order) => order.status === "pending" || order.status === "preparing"),
      salesToday,
    };
  }, [data]);

  const cards = [
    { label: "Ventas hoy", value: formatCurrency(metrics.salesToday) },
    { label: "Pedidos hoy", value: String(metrics.ordersToday.length) },
    { label: "Ticket promedio", value: formatCurrency(metrics.averageTicket) },
    { label: "Clientes nuevos", value: String(metrics.newCustomers) },
  ];

  return (
    <div className="admin-workspace space-y-5">
      <section className="admin-panel px-5 py-6 sm:px-6">
        <p className="section-label">INICIO</p>
        <h1 className="mt-3 text-[2.5rem] font-semibold leading-[0.94] tracking-[-0.06em] text-stone-950 sm:text-[3.2rem]">Operacion de hoy.</h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">Un resumen de ventas, pedidos y clientes con datos reales del ecommerce.</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <MetricCard key={card.label} {...card} isLoading={isLoading} />)}
        </div>
      </section>

      {hasError ? <div className="rounded-[1.2rem] border border-[#ead0c7] bg-[#fff6f2] px-5 py-4 text-sm text-[#8a4d3b]">No fue posible consultar la API administrativa. Revisa la sesion o la conexion del backend.</div> : null}

      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <section className="admin-panel px-5 py-6 sm:px-6">
          <div className="flex items-end justify-between gap-4 border-b border-stone-200 pb-4">
            <div><p className="section-label">PEDIDOS</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-stone-950">Pedidos recientes</h2></div>
            <Link className="text-sm font-semibold underline underline-offset-4" href="/admin/pedidos">Ver todos</Link>
          </div>
          {isLoading ? <p className="py-8 text-sm text-stone-500">Cargando pedidos...</p> : data.orders.length === 0 ? <EmptyState message="Aun no hay pedidos. Cuando haya una compra aparecerá aqui." /> : (
            <div className="mt-4 overflow-x-auto"><table className="min-w-[620px] w-full text-left text-sm"><thead className="text-xs text-stone-500"><tr><th className="py-3">Pedido</th><th>Cliente</th><th>Pago</th><th>Estado</th><th className="text-right">Total</th></tr></thead><tbody className="divide-y divide-stone-100">{data.orders.slice(0, 7).map((order) => <tr key={order.id}><td className="py-3"><Link className="font-semibold text-stone-950 hover:underline" href={`/admin/pedidos/${order.id}`}>{order.orderNumber}</Link><p className="mt-1 text-xs text-stone-500">{formatDateTime(order.createdAt)}</p></td><td>{order.customerName}</td><td>{getAdminPaymentStatusLabel(order.paymentStatus)}</td><td>{getAdminOrderStatusLabel(order.status)}</td><td className="text-right font-semibold">{formatCurrency(order.total)}</td></tr>)}</tbody></table></div>
          )}
        </section>
        <section className="admin-panel px-5 py-6 sm:px-6">
          <p className="section-label">REQUIERE ATENCION</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.05em] text-stone-950">Para revisar</h2>
          <div className="mt-5 space-y-3">
            {isLoading ? <p className="text-sm text-stone-500">Cargando estados...</p> : <>
              <AttentionItem href="/admin/pedidos?order_status=pending" label="Pedidos pendientes" value={metrics.pendingOrders.length} />
              <AttentionItem href="/admin/productos" label="Stock bajo" value={metrics.lowStock.length} />
              {metrics.pendingOrders.length === 0 && metrics.lowStock.length === 0 ? <EmptyState message="Todo esta al dia." /> : null}
            </>}
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, isLoading }: { label: string; value: string; isLoading: boolean }) { return <div className="rounded-[1.25rem] border border-stone-200 bg-white px-4 py-4"><p className="text-sm text-stone-500">{label}</p><p className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-stone-950">{isLoading ? "-" : value}</p></div>; }
function AttentionItem({ href, label, value }: { href: string; label: string; value: number }) { return <Link className="flex items-center justify-between rounded-[1.1rem] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-400" href={href}><span className="text-sm font-medium text-stone-800">{label}</span><span className="rounded-full bg-[#f6eee7] px-3 py-1 text-sm font-semibold text-stone-900">{value}</span></Link>; }
function EmptyState({ message }: { message: string }) { return <p className="rounded-[1.1rem] border border-dashed border-stone-300 bg-white px-4 py-5 text-sm leading-6 text-stone-600">{message}</p>; }
