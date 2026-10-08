import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import {
  DELIVERY_WORKFLOW_EVENT,
  DeliveryStatus,
  PaymentMethod,
  getBasePaymentStatus,
  getCouriers,
  getCourierOrders,
  mergeOrdersWithSnapshots,
  registerCourier,
  saveOrderWorkflow,
  setCourierAvailability,
} from "../services/deliveryWorkflow";

const money = (value) => new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(Number(value) || 0);
const addressOf = (order) => order.addressSnapshot || order.address || "Dirección no registrada";

const statusStyle = {
  [DeliveryStatus.REQUESTED]: "bg-cyan-100 text-cyan-700 border-cyan-200",
  [DeliveryStatus.ASSIGNED]: "bg-indigo-100 text-indigo-700 border-indigo-200",
  [DeliveryStatus.ON_THE_WAY]: "bg-blue-100 text-blue-700 border-blue-200",
  [DeliveryStatus.DELIVERED]: "bg-emerald-100 text-emerald-700 border-emerald-200",
  [DeliveryStatus.CANCELLED]: "bg-rose-100 text-rose-700 border-rose-200",
};
const statusLabel = { [DeliveryStatus.REQUESTED]: "Solicitud pendiente", [DeliveryStatus.ASSIGNED]: "Asignado", [DeliveryStatus.ON_THE_WAY]: "En camino", [DeliveryStatus.DELIVERED]: "Entregado", [DeliveryStatus.CANCELLED]: "Cancelado" };

export default function DeliveryDashboard({ onBack }) {
  const { user, logout } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    try {
      const response = await api.get("/orders/preparation");
      setOrders(mergeOrdersWithSnapshots(Array.isArray(response.data) ? response.data : []));
      setError("");
    } catch (requestError) {
      setOrders(mergeOrdersWithSnapshots([]));
      setError(requestError.response?.data?.error || "Sin conexión con el servidor. Se muestran las solicitudes guardadas en este navegador.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    registerCourier(user);
    const syncAvailability = () => {
      const courier = getCouriers().find((item) => String(item.id) === String(user?.id || "delivery-demo"));
      setAvailable(courier?.available ?? true);
    };
    syncAvailability();
    const initialFetch = window.setTimeout(() => loadOrders(), 0);
    const sync = () => { syncAvailability(); loadOrders(); };
    window.addEventListener("storage", sync);
    window.addEventListener(DELIVERY_WORKFLOW_EVENT, sync);
    const interval = window.setInterval(loadOrders, 15000);
    return () => { window.clearTimeout(initialFetch); window.removeEventListener("storage", sync); window.removeEventListener(DELIVERY_WORKFLOW_EVENT, sync); window.clearInterval(interval); };
  }, [loadOrders, user]);

  const assignedOrders = useMemo(() => getCourierOrders(orders, user?.id || "delivery-demo"), [orders, user?.id]);
  const activeOrders = assignedOrders.filter((order) => ![DeliveryStatus.DELIVERED, DeliveryStatus.CANCELLED].includes(order.workflow.status));
  const delivered = assignedOrders.filter((order) => order.workflow.status === DeliveryStatus.DELIVERED).length;

  const update = (order, patch) => {
    saveOrderWorkflow(order, patch);
    loadOrders();
  };
  const accept = (order) => update(order, { status: DeliveryStatus.ASSIGNED, acceptedAt: new Date().toISOString() });
  const reject = (order) => {
    update(order, { status: getBasePaymentStatus(order.workflow), courierId: null, rejectedAt: new Date().toISOString() });
    setCourierAvailability(user?.id || "delivery-demo", true);
  };
  const startDelivery = (order) => update(order, { status: DeliveryStatus.ON_THE_WAY, startedAt: new Date().toISOString() });
  const deliver = (order) => {
    update(order, { status: DeliveryStatus.DELIVERED, deliveredAt: new Date().toISOString(), paidAtDelivery: order.workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY });
    setCourierAvailability(user?.id || "delivery-demo", true);
  };
  const toggleAvailable = () => { const next = !available; setAvailable(next); setCourierAvailability(user?.id || "delivery-demo", next); };
  const name = user?.fullName?.split(" ")[0] || "Repartidor";

  return <div className="min-h-screen bg-[#f4f7f5] text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8"><div>{onBack && <button type="button" onClick={onBack} className="mb-2 text-xs font-bold text-emerald-700">← Panel administrativo</button>}<p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-600">Panel de entregas</p><h1 className="mt-1 text-2xl font-black">Hola, {name} 👋</h1><p className="mt-1 text-sm text-slate-500">Acepta solicitudes y mantén informado al equipo.</p></div><div className="flex items-center gap-2"><button type="button" onClick={loadOrders} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">↻ Actualizar</button><button type="button" onClick={toggleAvailable} className={`rounded-full border px-3 py-2 text-xs font-bold ${available ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-100 text-slate-500"}`}><span className={`mr-1.5 inline-block h-2 w-2 rounded-full ${available ? "bg-emerald-500" : "bg-slate-400"}`} />{available ? "Disponible" : "No disponible"}</button><button type="button" onClick={logout} className="rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">Salir</button></div></div></header><main className="mx-auto max-w-6xl px-5 py-7 md:px-8"><section className="grid gap-4 sm:grid-cols-3"><Stat label="Solicitudes activas" value={activeOrders.length} color="text-cyan-600" /><Stat label="En camino" value={assignedOrders.filter((o) => o.workflow.status === DeliveryStatus.ON_THE_WAY).length} color="text-blue-600" /><Stat label="Entregas completadas" value={delivered} color="text-emerald-600" /></section>{error && <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p>}<section className="mt-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black">Mis entregas</h2><p className="mt-1 text-sm text-slate-500">Las solicitudes llegan aquí cuando el administrador te selecciona.</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{assignedOrders.length}</span></div>{loading ? <p className="py-12 text-center text-slate-400">Cargando…</p> : assignedOrders.length === 0 ? <div className="py-14 text-center"><p className="text-3xl">📭</p><p className="mt-3 font-bold text-slate-700">No tienes entregas asignadas.</p><p className="mt-1 text-sm text-slate-400">Mantente disponible para recibir una solicitud.</p></div> : <div className="mt-6 space-y-4">{assignedOrders.map((order) => <DeliveryCard key={order.id} order={order} onAccept={() => accept(order)} onReject={() => reject(order)} onStart={() => startDelivery(order)} onDeliver={() => deliver(order)} />)}</div>}</section></main></div>;
}

function Stat({ label, value, color }) { return <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-semibold text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{value}</p></article>; }
function DeliveryCard({ order, onAccept, onReject, onStart, onDeliver }) { const { workflow } = order; const isCash = workflow.paymentMethod === PaymentMethod.CASH_ON_DELIVERY; return <article className="rounded-2xl border border-slate-200 p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex flex-wrap items-center gap-2"><p className="font-mono text-sm font-black text-emerald-700">{order.orderNumber || `ORD-${order.id}`}</p><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyle[workflow.status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>{statusLabel[workflow.status] || workflow.status}</span>{isCash && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">Cobrar contra entrega</span>}</div><h3 className="mt-2 text-lg font-black">{order.clientName || "Cliente"}</h3><p className="mt-1 text-sm text-slate-500">📍 {addressOf(order)}</p>{order.phoneSnapshot && <p className="mt-1 text-sm text-slate-500">☎ {order.phoneSnapshot}</p>}<p className="mt-3 text-sm font-black text-emerald-600">{money(order.total)} {isCash ? "por cobrar" : "pagado"}</p></div><div className="flex shrink-0 flex-wrap content-start gap-2">{workflow.status === DeliveryStatus.REQUESTED && <><button type="button" onClick={onAccept} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Aceptar</button><button type="button" onClick={onReject} className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50">Cancelar</button></>}{workflow.status === DeliveryStatus.ASSIGNED && <button type="button" onClick={onStart} className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500">Iniciar entrega</button>}{workflow.status === DeliveryStatus.ON_THE_WAY && <button type="button" onClick={onDeliver} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Confirmar entrega</button>}</div></div></article>; }
