import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../services/api";
import {
  DELIVERY_WORKFLOW_EVENT,
  DeliveryStatus,
  PaymentMethod,
  getCouriers,
  mergeOrdersWithSnapshots,
  saveOrderWorkflow,
  setCourierBusy,
} from "../../services/deliveryWorkflow";

const money = (value) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
    Number(value) || 0
  );

const statusMeta = {
  [DeliveryStatus.CREATED]: { label: "Creado", style: "bg-sky-500/15 text-sky-300 border-sky-400/30" },
  [DeliveryStatus.PAID]: { label: "Pagado", style: "bg-violet-500/15 text-violet-300 border-violet-400/30" },
  [DeliveryStatus.CASH_ON_DELIVERY]: { label: "Pago contra entrega", style: "bg-amber-500/15 text-amber-300 border-amber-400/30" },
  [DeliveryStatus.REQUESTED]: { label: "Solicitud enviada", style: "bg-cyan-500/15 text-cyan-300 border-cyan-400/30" },
  [DeliveryStatus.ASSIGNED]: { label: "Asignado", style: "bg-indigo-500/15 text-indigo-300 border-indigo-400/30" },
  [DeliveryStatus.ON_THE_WAY]: { label: "En camino", style: "bg-blue-500/15 text-blue-300 border-blue-400/30" },
  [DeliveryStatus.DELIVERED]: { label: "Entregado", style: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30" },
  [DeliveryStatus.CANCELLED]: { label: "Cancelado", style: "bg-rose-500/15 text-rose-300 border-rose-400/30" },
};

const filterOptions = [
  ["ALL", "Todos"],
  [DeliveryStatus.CREATED, "Creados"],
  [DeliveryStatus.PAID, "Pagados"],
  [DeliveryStatus.CASH_ON_DELIVERY, "Contra entrega"],
  [DeliveryStatus.REQUESTED, "Por aceptar"],
  [DeliveryStatus.ASSIGNED, "Asignados"],
  [DeliveryStatus.ON_THE_WAY, "En camino"],
  [DeliveryStatus.DELIVERED, "Entregados"],
];

function StatusBadge({ status }) {
  const meta = statusMeta[status] || statusMeta[DeliveryStatus.CREATED];
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${meta.style}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{meta.label}</span>;
}

function PaymentBadge({ method }) {
  const isCash = method === PaymentMethod.CASH_ON_DELIVERY;
  return <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isCash ? "bg-amber-400/10 text-amber-300" : "bg-violet-400/10 text-violet-300"}`}>{isCash ? "Contra entrega" : "Pago digital"}</span>;
}

function getOrderAddress(order) {
  return order.addressSnapshot || order.address || "Dirección no registrada";
}

export default function PreparationDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [couriers, setCouriers] = useState(getCouriers());
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await api.get("/orders/preparation");
      setOrders(mergeOrdersWithSnapshots(Array.isArray(response.data) ? response.data : []));
      setError("");
      setLastUpdated(new Date());
    } catch (requestError) {
      setOrders(mergeOrdersWithSnapshots([]));
      setError(requestError.response?.data?.error || "No se pudieron cargar los pedidos del servidor. Se muestran los pedidos guardados en este navegador.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialFetch = window.setTimeout(() => loadOrders(), 0);
    const interval = window.setInterval(() => loadOrders(true), 15000);
    const sync = () => {
      setCouriers(getCouriers());
      setOrders((current) => mergeOrdersWithSnapshots(current));
    };
    window.addEventListener("storage", sync);
    window.addEventListener(DELIVERY_WORKFLOW_EVENT, sync);
    return () => {
      window.clearTimeout(initialFetch);
      window.clearInterval(interval);
      window.removeEventListener("storage", sync);
      window.removeEventListener(DELIVERY_WORKFLOW_EVENT, sync);
    };
  }, [loadOrders]);

  const updateWorkflow = (order, patch) => {
    const workflow = saveOrderWorkflow(order, patch);
    setOrders((current) => mergeOrdersWithSnapshots(current));
    setSelectedOrder((current) => current?.id === order.id ? { ...order, workflow } : current);
  };

  const availableCouriers = couriers.filter((courier) => courier.available);
  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === "ALL" || order.workflow.status === filter;
      const searchText = [order.orderNumber, order.clientName, getOrderAddress(order), order.courier?.fullName]
        .filter(Boolean).join(" ").toLowerCase();
      return matchesStatus && (!normalized || searchText.includes(normalized));
    });
  }, [orders, filter, query]);

  const counters = useMemo(() => orders.reduce((all, order) => {
    all[order.workflow.status] = (all[order.workflow.status] || 0) + 1;
    return all;
  }, {}), [orders]);

  const confirmPayment = (order) => updateWorkflow(order, {
    status: order.workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY
      ? DeliveryStatus.CASH_ON_DELIVERY
      : DeliveryStatus.PAID,
  });

  const assignCourier = (order, courierId) => {
    const courier = couriers.find((item) => String(item.id) === String(courierId));
    if (!courier) return;
    setCourierBusy(courierId, true);
    updateWorkflow(order, {
      status: DeliveryStatus.REQUESTED,
      courierId: courier.id,
      requestedAt: new Date().toISOString(),
    });
    setSelectedOrder(null);
  };

  const cancelOrder = (order) => {
    if (order.workflow.courierId) setCourierBusy(order.workflow.courierId, false);
    updateWorkflow(order, { status: DeliveryStatus.CANCELLED, cancelledAt: new Date().toISOString() });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {onBack && <button type="button" onClick={onBack} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">←</button>}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl shadow-lg shadow-cyan-950/40">🚚</div>
            <div><h1 className="text-xl font-black tracking-tight text-white">Centro de entregas</h1><p className="text-xs text-slate-400">Asigna pedidos y da seguimiento en tiempo real{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ""}</p></div>
          </div>
          <button type="button" onClick={() => loadOrders()} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20">↻ Actualizar</button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pendientes de pago" value={(counters[DeliveryStatus.CREATED] || 0) + (counters[DeliveryStatus.PAID] || 0) + (counters[DeliveryStatus.CASH_ON_DELIVERY] || 0)} color="sky" />
          <Metric label="Solicitudes por aceptar" value={counters[DeliveryStatus.REQUESTED] || 0} color="cyan" />
          <Metric label="Entregas en camino" value={counters[DeliveryStatus.ON_THE_WAY] || 0} color="indigo" />
          <Metric label="Repartidores disponibles" value={availableCouriers.length} color="emerald" />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map(([value, label]) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === value ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}>{label}{value !== "ALL" && <span className="ml-1.5 opacity-70">{counters[value] || 0}</span>}</button>)}
            </div>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar pedido, cliente o repartidor" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 lg:w-72" />
          </div>
        </section>

        {error && <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}
        {loading ? <p className="py-16 text-center text-slate-400">Cargando pedidos…</p> : filteredOrders.length === 0 ? <p className="py-16 text-center text-slate-500">No hay pedidos en este estado.</p> : <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => <OrderCard key={order.id} order={order} onOpen={() => setSelectedOrder(order)} onConfirm={() => confirmPayment(order)} onCancel={() => cancelOrder(order)} />)}
        </section>}
      </main>

      {selectedOrder && <OrderModal order={orders.find((order) => order.id === selectedOrder.id) || selectedOrder} availableCouriers={availableCouriers} onClose={() => setSelectedOrder(null)} onConfirm={() => confirmPayment(selectedOrder)} onAssign={assignCourier} onCancel={() => { cancelOrder(selectedOrder); setSelectedOrder(null); }} />}
    </div>
  );
}

function Metric({ label, value, color }) {
  const colors = { sky: "text-sky-300", cyan: "text-cyan-300", indigo: "text-indigo-300", emerald: "text-emerald-300" };
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4"><p className="text-xs font-semibold text-slate-400">{label}</p><p className={`mt-2 text-3xl font-black ${colors[color]}`}>{value}</p></article>;
}

function OrderCard({ order, onOpen, onConfirm, onCancel }) {
  const { workflow } = order;
  const isCreated = workflow.status === DeliveryStatus.CREATED;
  const isReadyToAssign = [DeliveryStatus.PAID, DeliveryStatus.CASH_ON_DELIVERY].includes(workflow.status);
  return <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-slate-950/20 transition hover:border-slate-700"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-sm font-black text-cyan-300">{order.orderNumber || `ORD-${order.id}`}</p><h2 className="mt-1 font-bold text-white">{order.clientName || "Cliente"}</h2></div><StatusBadge status={workflow.status} /></div><div className="mt-4 flex items-center justify-between gap-2"><PaymentBadge method={workflow.paymentMethod} /><span className="font-bold text-emerald-300">{money(order.total)}</span></div><p className="mt-3 truncate text-sm text-slate-400">📍 {getOrderAddress(order)}</p>{order.courier && <p className="mt-2 text-xs font-semibold text-cyan-200">🚴 {order.courier.fullName}</p>}<div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">{isCreated && <button type="button" onClick={onConfirm} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white hover:bg-violet-400">Confirmar {workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? "contra entrega" : "pago"}</button>}{isReadyToAssign && <button type="button" onClick={onOpen} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300">Asignar repartidor</button>}<button type="button" onClick={onOpen} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">Ver detalle</button>{![DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED].includes(workflow.status) && <button type="button" onClick={onCancel} className="ml-auto rounded-lg px-2 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10">Cancelar</button>}</div></article>;
}

function OrderModal({ order, availableCouriers, onClose, onConfirm, onAssign, onCancel }) {
  const [courierId, setCourierId] = useState("");
  const { workflow } = order;
  const canAssign = [DeliveryStatus.PAID, DeliveryStatus.CASH_ON_DELIVERY].includes(workflow.status);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"><section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"><div className="flex justify-between gap-4 border-b border-slate-800 pb-4"><div><p className="font-mono font-black text-cyan-300">{order.orderNumber || `ORD-${order.id}`}</p><h2 className="mt-1 text-xl font-black text-white">Entrega para {order.clientName || "Cliente"}</h2></div><button type="button" onClick={onClose} className="h-9 w-9 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800">×</button></div><div className="mt-4 flex flex-wrap items-center gap-2"><StatusBadge status={workflow.status} /><PaymentBadge method={workflow.paymentMethod} /></div><div className="mt-5 grid gap-3 rounded-2xl bg-slate-950/60 p-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Dirección</p><p className="mt-1 text-slate-200">📍 {getOrderAddress(order)}</p></div><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contacto</p><p className="mt-1 text-slate-200">{order.phoneSnapshot || "Sin teléfono"}</p></div>{order.courier && <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Repartidor</p><p className="mt-1 font-bold text-cyan-200">🚴 {order.courier.fullName}</p></div>}<div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Total</p><p className="mt-1 font-black text-emerald-300">{money(order.total)}</p></div></div><div className="mt-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Productos</p><ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">{(order.items || []).map((item, index) => <li key={`${item.productId}-${index}`} className="flex justify-between gap-4 p-3 text-sm"><span><strong className="text-cyan-300">{item.quantity}×</strong> {item.productName}</span><span className="text-slate-400">{money((item.unitPrice || 0) * item.quantity)}</span></li>)}</ul></div>{order.notes && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">Nota: {order.notes}</p>}{workflow.status === DeliveryStatus.CREATED && <button type="button" onClick={onConfirm} className="mt-6 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white hover:bg-violet-400">Confirmar {workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY ? "pago contra entrega" : "pago"}</button>}{canAssign && <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4"><p className="font-bold text-cyan-100">Enviar solicitud de entrega</p><p className="mt-1 text-xs text-slate-400">El repartidor debe aceptar la solicitud antes de iniciar la ruta.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row"><select value={courierId} onChange={(event) => setCourierId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"><option value="">Selecciona un repartidor disponible</option>{availableCouriers.map((courier) => <option key={courier.id} value={courier.id}>{courier.fullName}{courier.phone ? ` · ${courier.phone}` : ""}</option>)}</select><button type="button" disabled={!courierId} onClick={() => onAssign(order, courierId)} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">Enviar solicitud</button></div>{availableCouriers.length === 0 && <p className="mt-3 text-xs text-amber-300">No hay repartidores disponibles en este momento.</p>}</div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">Cerrar</button>{![DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED].includes(workflow.status) && <button type="button" onClick={onCancel} className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-300 hover:bg-rose-500 hover:text-white">Cancelar pedido</button>}</div></section></div>;
}
