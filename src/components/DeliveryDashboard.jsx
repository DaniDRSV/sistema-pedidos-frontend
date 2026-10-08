import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api, { getErrorMessage } from "../services/api";
import { OrderStatus, isCashOnDelivery, isFinalStatus, money, statusLabels } from "../utils/orderStatus";

const statusStyles = {
  [OrderStatus.PREPARING]: "bg-amber-100 text-amber-700 border-amber-200",
  [OrderStatus.ON_THE_WAY]: "bg-blue-100 text-blue-700 border-blue-200",
  [OrderStatus.DELIVERED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [OrderStatus.CANCELLED]: "bg-rose-100 text-rose-700 border-rose-200",
};

export default function DeliveryDashboard({ onBack }) {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const response = await api.get("/deliveries/orders/me");
      setOrders(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar tus entregas."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadOrders, 0);
    const interval = window.setInterval(loadOrders, 15000);
    return () => {
      window.clearTimeout(firstLoad);
      window.clearInterval(interval);
    };
  }, [loadOrders]);

  const runAction = async (order, request) => {
    setBusyId(order.id);
    setError("");
    try {
      await request();
      await loadOrders();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar la entrega."));
    } finally {
      setBusyId(null);
    }
  };

  const startDelivery = (order) => runAction(order, () => api.patch(`/deliveries/orders/${order.id}/start`));
  const completeDelivery = (order) => runAction(order, () => api.patch(`/deliveries/orders/${order.id}/complete`));
  const rejectDelivery = (order) => {
    if (!window.confirm(`¿Rechazar la entrega ${order.orderNumber}?`)) return;
    runAction(order, () => api.delete(`/deliveries/orders/${order.id}/assignment`));
  };

  const activeOrders = orders.filter((order) => !isFinalStatus(order.status));
  const onTheWay = orders.filter((order) => order.status === OrderStatus.ON_THE_WAY).length;
  const delivered = orders.filter((order) => order.status === OrderStatus.DELIVERED).length;
  const available = activeOrders.length === 0;
  const name = user?.fullName?.split(" ")[0] || "Repartidor";

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            {onBack && (
              <button type="button" onClick={onBack} className="mb-2 text-xs font-bold text-emerald-700">
                ← Panel administrativo
              </button>
            )}
            <p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Panel de entregas</p>
            <h1 className="mt-1 text-2xl font-black">Hola, {name} 👋</h1>
            <p className="mt-1 text-sm text-slate-500">Aquí aparecen los pedidos que el administrador te asigna.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={loadOrders} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
              ↻ Actualizar
            </button>
            <span className={`rounded-full border px-3 py-2 text-xs font-bold ${available ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}`}>
              <span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${available ? "bg-emerald-500" : "bg-amber-500"}`} />
              {available ? "Disponible" : "Con entregas activas"}
            </span>
            <button type="button" onClick={logout} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-7 md:px-8">
        <section className="grid gap-4 sm:grid-cols-3">
          <Stat label="Entregas activas" value={activeOrders.length} color="text-cyan-600" />
          <Stat label="En camino" value={onTheWay} color="text-blue-600" />
          <Stat label="Entregas completadas" value={delivered} color="text-emerald-600" />
        </section>

        {error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}

        <section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black">Mis entregas</h2>
              <p className="mt-1 text-sm text-slate-500">Inicia la ruta cuando salgas y confirma al entregar.</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{orders.length}</span>
          </div>

          {loading ? (
            <p className="py-12 text-center text-slate-400">Cargando…</p>
          ) : orders.length === 0 ? (
            <div className="py-14 text-center">
              <p className="text-3xl">📭</p>
              <p className="mt-3 font-bold text-slate-700">No tienes entregas asignadas.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {orders.map((order) => (
                <DeliveryCard
                  key={order.id}
                  order={order}
                  busy={busyId === order.id}
                  onStart={() => startDelivery(order)}
                  onComplete={() => completeDelivery(order)}
                  onReject={() => rejectDelivery(order)}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black ${color}`}>{value}</p>
    </article>
  );
}

function DeliveryCard({ order, busy, onStart, onComplete, onReject }) {
  const isCash = isCashOnDelivery(order);
  const pendingPayment = isCash && order.paymentStatus !== "PAID";

  return (
    <article className="rounded-2xl border border-slate-200 p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-mono text-sm font-black text-emerald-700">{order.orderNumber}</p>
            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[order.status] || "border-slate-200 bg-slate-100 text-slate-600"}`}>
              {statusLabels[order.status] || order.status}
            </span>
            {pendingPayment && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">Cobrar en efectivo</span>}
          </div>
          <h3 className="mt-2 text-lg font-black">{order.clientName || "Cliente"}</h3>
          <p className="mt-1 text-sm text-slate-500">📍 {order.addressSnapshot}</p>
          {order.phoneSnapshot && <p className="mt-1 text-sm text-slate-500">☎ {order.phoneSnapshot}</p>}
          <ul className="mt-3 text-sm text-slate-600">
            {(order.items || []).map((item) => (
              <li key={item.productId}>{item.quantity}× {item.productName}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-black text-emerald-600">
            {money(order.total)} {pendingPayment ? "por cobrar" : "pagado"}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap content-start gap-2">
          {order.status === OrderStatus.PREPARING && (
            <>
              <button type="button" disabled={busy} onClick={onStart} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                Iniciar ruta
              </button>
              <button type="button" disabled={busy} onClick={onReject} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50">
                Rechazar
              </button>
            </>
          )}
          {order.status === OrderStatus.ON_THE_WAY && (
            <button type="button" disabled={busy} onClick={onComplete} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
              Confirmar entrega
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
