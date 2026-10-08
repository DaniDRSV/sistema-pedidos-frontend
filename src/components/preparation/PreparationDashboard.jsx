import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import {
  OrderStatus,
  PaymentMethod,
  isCashOnDelivery,
  isFinalStatus,
  money,
  statusLabels,
} from "../../utils/orderStatus";

const statusStyles = {
  [OrderStatus.CREATED]: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  [OrderStatus.PAID]: "bg-violet-500/15 text-violet-300 border-violet-400/30",
  [OrderStatus.PREPARING]: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  [OrderStatus.ON_THE_WAY]: "bg-blue-500/15 text-blue-300 border-blue-400/30",
  [OrderStatus.DELIVERED]: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  [OrderStatus.CANCELLED]: "bg-rose-500/15 text-rose-300 border-rose-400/30",
};

const filterOptions = ["ALL", ...Object.values(OrderStatus)];

const canAssignCourier = (order) =>
  !order.deliveryId &&
  [OrderStatus.CREATED, OrderStatus.PAID, OrderStatus.PREPARING].includes(order.status);

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[status] || statusStyles[OrderStatus.CREATED]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabels[status] || status}
    </span>
  );
}

function PaymentBadge({ method }) {
  const isCash = method !== PaymentMethod.CARD;
  return (
    <span className={`rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${isCash ? "bg-amber-400/10 text-amber-300" : "bg-violet-400/10 text-violet-300"}`}>
      {isCash ? "Contra entrega" : "Pago digital"}
    </span>
  );
}

export default function PreparationDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [ordersResponse, couriersResponse] = await Promise.all([
        api.get("/orders/preparation"),
        api.get("/deliveries/couriers"),
      ]);
      setOrders(ordersResponse.data);
      setCouriers(couriersResponse.data);
      setError("");
      setLastUpdated(new Date());
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los pedidos."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadData, 0);
    const interval = window.setInterval(loadData, 15000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(interval);
    };
  }, [loadData]);

  const runAction = async (order, request) => {
    setBusyId(order.id);
    setError("");
    try {
      await request();
      await loadData();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar el pedido."));
    } finally {
      setBusyId(null);
    }
  };

  const changeStatus = (order, status) =>
    runAction(order, () => api.patch(`/orders/${order.id}/status`, { status }));

  const cancelOrder = (order) => {
    const reason = window.prompt(`Motivo de cancelación de ${order.orderNumber} (opcional):`);
    if (reason === null) return;
    runAction(order, () =>
      api.patch(`/orders/${order.id}/status`, { status: OrderStatus.CANCELLED, reason: reason.trim() || undefined })
    );
  };

  const assignCourier = (order, deliveryId) =>
    runAction(order, () => api.put(`/deliveries/orders/${order.id}/assignment`, { deliveryId: Number(deliveryId) }));

  const unassignCourier = (order) =>
    runAction(order, () => api.delete(`/deliveries/orders/${order.id}/assignment`));

  const filteredOrders = useMemo(() => {
    const text = query.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = filter === "ALL" || order.status === filter;
      const searchText = [order.orderNumber, order.clientName, order.addressSnapshot, order.delivery?.fullName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return matchesStatus && (!text || searchText.includes(text));
    });
  }, [orders, filter, query]);

  const counters = useMemo(
    () => orders.reduce((total, order) => ({ ...total, [order.status]: (total[order.status] || 0) + 1 }), {}),
    [orders]
  );

  const availableCouriers = couriers.filter((courier) => courier.available);
  const selectedOrder = orders.find((order) => order.id === selectedId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400" />
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button type="button" onClick={onBack} className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700">
                ←
              </button>
            )}
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 text-xl shadow-lg shadow-cyan-950/40">🚚</div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Centro de entregas</h1>
              <p className="text-xs text-slate-400">
                Gestiona el estado de los pedidos{lastUpdated ? ` · ${lastUpdated.toLocaleTimeString()}` : ""}
              </p>
            </div>
          </div>
          <button type="button" onClick={loadData} className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/20">
            ↻ Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Pendientes" value={(counters[OrderStatus.CREATED] || 0) + (counters[OrderStatus.PAID] || 0)} color="text-sky-300" />
          <Metric label="En preparación" value={counters[OrderStatus.PREPARING] || 0} color="text-amber-300" />
          <Metric label="En camino" value={counters[OrderStatus.ON_THE_WAY] || 0} color="text-blue-300" />
          <Metric label="Repartidores disponibles" value={availableCouriers.length} color="text-emerald-300" />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterOptions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${filter === value ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400 hover:text-white"}`}
                >
                  {value === "ALL" ? "Todos" : statusLabels[value]}
                  {value !== "ALL" && <span className="ml-1.5 opacity-70">{counters[value] || 0}</span>}
                </button>
              ))}
            </div>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar pedido, cliente o repartidor"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-400 lg:w-72"
            />
          </div>
        </section>

        {error && <div className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">{error}</div>}

        {loading ? (
          <p className="py-16 text-center text-slate-400">Cargando pedidos…</p>
        ) : filteredOrders.length === 0 ? (
          <p className="py-16 text-center text-slate-500">No hay pedidos en este estado.</p>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                busy={busyId === order.id}
                onOpen={() => setSelectedId(order.id)}
                onChangeStatus={(status) => changeStatus(order, status)}
                onCancel={() => cancelOrder(order)}
              />
            ))}
          </section>
        )}
      </main>

      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          couriers={couriers}
          busy={busyId === selectedOrder.id}
          onClose={() => setSelectedId(null)}
          onChangeStatus={(status) => changeStatus(selectedOrder, status)}
          onAssign={(deliveryId) => assignCourier(selectedOrder, deliveryId)}
          onUnassign={() => unassignCourier(selectedOrder)}
          onCancel={() => cancelOrder(selectedOrder)}
        />
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="text-xs font-semibold text-slate-400">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </article>
  );
}

function StatusActions({ order, busy, onChangeStatus }) {
  const allowed = order.allowedTransitions || [];
  const canConfirmPayment = allowed.includes(OrderStatus.PAID) && !isCashOnDelivery(order);
  const canPrepare = allowed.includes(OrderStatus.PREPARING);

  return (
    <>
      {canConfirmPayment && (
        <button type="button" disabled={busy} onClick={() => onChangeStatus(OrderStatus.PAID)} className="rounded-lg bg-violet-500 px-3 py-2 text-xs font-bold text-white hover:bg-violet-400 disabled:opacity-50">
          Confirmar pago
        </button>
      )}
      {canPrepare && (
        <button type="button" disabled={busy} onClick={() => onChangeStatus(OrderStatus.PREPARING)} className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-300 disabled:opacity-50">
          Enviar a preparación
        </button>
      )}
    </>
  );
}

function OrderCard({ order, busy, onOpen, onChangeStatus, onCancel }) {
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl shadow-slate-950/20 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-sm font-black text-cyan-300">{order.orderNumber}</p>
          <h2 className="mt-1 font-bold text-white">{order.clientName || "Cliente"}</h2>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <PaymentBadge method={order.paymentMethod} />
        <span className="font-bold text-emerald-300">{money(order.total)}</span>
      </div>
      <p className="mt-3 truncate text-sm text-slate-400">📍 {order.addressSnapshot}</p>
      {order.delivery && <p className="mt-2 text-xs font-semibold text-cyan-200">🚴 {order.delivery.fullName}</p>}
      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <StatusActions order={order} busy={busy} onChangeStatus={onChangeStatus} />
        {canAssignCourier(order) && (
          <button type="button" onClick={onOpen} className="rounded-lg bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-300">
            Asignar repartidor
          </button>
        )}
        <button type="button" onClick={onOpen} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800">
          Ver detalle
        </button>
        {!isFinalStatus(order.status) && (
          <button type="button" disabled={busy} onClick={onCancel} className="ml-auto rounded-lg px-2 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/10 disabled:opacity-50">
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

function OrderModal({ order, couriers, busy, onClose, onChangeStatus, onAssign, onUnassign, onCancel }) {
  const [courierId, setCourierId] = useState("");
  const canUnassign = order.deliveryId && order.status === OrderStatus.PREPARING;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
      <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="flex justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <p className="font-mono font-black text-cyan-300">{order.orderNumber}</p>
            <h2 className="mt-1 text-xl font-black text-white">Entrega para {order.clientName || "Cliente"}</h2>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800">×</button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={order.status} />
          <PaymentBadge method={order.paymentMethod} />
        </div>

        <div className="mt-5 grid gap-3 rounded-2xl bg-slate-950/60 p-4 text-sm sm:grid-cols-2">
          <Info label="Dirección" value={`📍 ${order.addressSnapshot}`} />
          <Info label="Contacto" value={order.phoneSnapshot || "Sin teléfono"} />
          {order.delivery && <Info label="Repartidor" value={`🚴 ${order.delivery.fullName}`} />}
          <Info label="Total" value={money(order.total)} />
        </div>

        <div className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Productos</p>
          <ul className="mt-2 divide-y divide-slate-800 rounded-xl border border-slate-800">
            {(order.items || []).map((item) => (
              <li key={item.productId} className="flex justify-between gap-4 p-3 text-sm">
                <span><strong className="text-cyan-300">{item.quantity}×</strong> {item.productName}</span>
                <span className="text-slate-400">{money(item.total)}</span>
              </li>
            ))}
          </ul>
        </div>

        {order.notes && <p className="mt-4 rounded-xl bg-amber-400/10 p-3 text-sm text-amber-200">Nota: {order.notes}</p>}

        <div className="mt-6 flex flex-wrap gap-2">
          <StatusActions order={order} busy={busy} onChangeStatus={onChangeStatus} />
        </div>

        {canAssignCourier(order) && (
          <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
            <p className="font-bold text-cyan-100">Asignar repartidor</p>
            <p className="mt-1 text-xs text-slate-400">El pedido pasa a preparación y aparece en el panel del repartidor.</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select value={courierId} onChange={(event) => setCourierId(event.target.value)} className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
                <option value="">Selecciona un repartidor</option>
                {couriers.map((courier) => (
                  <option key={courier.id} value={courier.id}>
                    {courier.fullName} · {courier.available ? "disponible" : `${courier.activeOrders} pedido(s) activos`}
                  </option>
                ))}
              </select>
              <button type="button" disabled={!courierId || busy} onClick={() => onAssign(courierId)} className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-40">
                Asignar
              </button>
            </div>
            {couriers.length === 0 && <p className="mt-3 text-xs text-amber-300">No hay repartidores registrados.</p>}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {canUnassign && (
            <button type="button" disabled={busy} onClick={onUnassign} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              Quitar repartidor
            </button>
          )}
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300">
            Cerrar
          </button>
          {!isFinalStatus(order.status) && (
            <button type="button" disabled={busy} onClick={onCancel} className="rounded-xl bg-rose-500/15 px-4 py-2 text-sm font-bold text-rose-300 hover:bg-rose-500 hover:text-white disabled:opacity-50">
              Cancelar pedido
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-slate-200">{value}</p>
    </div>
  );
}
