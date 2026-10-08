import { formatDate, money, statusLabels, statusStyles } from "../../utils/orderStatus";

export default function OrderHistory({ orders, loading, emptyText = "Sin pedidos registrados." }) {
  if (loading) return <p className="py-8 text-center text-sm text-slate-400">Cargando pedidos…</p>;
  if (orders.length === 0) return <p className="py-8 text-center text-sm text-slate-500">{emptyText}</p>;

  return (
    <ul className="divide-y divide-slate-800 rounded-xl border border-slate-800">
      {orders.map((order) => (
        <li key={order.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-black text-cyan-300">{order.orderNumber}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusStyles[order.status] || ""}`}>
                {statusLabels[order.status] || order.status}
              </span>
            </div>
            <p className="mt-1 truncate text-xs text-slate-400">
              {order.items.map((item) => `${item.quantity}× ${item.productName}`).join(", ")}
            </p>
            <p className="mt-1 text-xs text-slate-500">{formatDate(order.createdAt)}</p>
          </div>
          <span className="shrink-0 font-bold text-emerald-300">{money(order.total)}</span>
        </li>
      ))}
    </ul>
  );
}
