import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import api from "../../services/api";

// Sonido sintético para avisar sobre nuevos pedidos en cocina (Web Audio API)
function playKitchenNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primer tono (agudo y suave)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.4);

    // Segundo tono (armónico de confirmación)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
    gain2.gain.setValueAtTime(0.15, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.6);
  } catch {
    // Si el navegador bloquea audio sin interacción previa, ignorar silenciosamente
  }
}

// Formateador de moneda en USD
const formatMoney = (amount) =>
  new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" }).format(
    Number(amount) || 0
  );

// Cálculo de tiempo transcurrido
function useElapsedTime(startTime) {
  const [elapsed, setElapsed] = useState(() => calculateElapsed(startTime));

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      setElapsed(calculateElapsed(startTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

function calculateElapsed(startTime) {
  if (!startTime) return { minutes: 0, seconds: 0, formatted: "00:00", isUrgent: false };
  const diffMs = Math.max(0, Date.now() - new Date(startTime).getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, "0");

  return {
    minutes,
    seconds,
    formatted: `${pad(minutes)}:${pad(seconds)}`,
    isUrgent: minutes >= 20,
    isWarning: minutes >= 10 && minutes < 20,
  };
}

// Componente para reloj de ticket individual
function TicketTimer({ startTime, label = "Espera" }) {
  const { formatted, isUrgent, isWarning, minutes } = useElapsedTime(startTime);

  let badgeColor = "bg-slate-800 text-slate-300 border-slate-700";
  if (isUrgent) {
    badgeColor = "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse";
  } else if (isWarning) {
    badgeColor = "bg-amber-500/20 text-amber-300 border-amber-500/40";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-mono font-semibold ${badgeColor}`}
      title={`Tiempo transcurrido: ${minutes} minutos`}
    >
      <svg
        className="h-3 w-3 shrink-0"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span>
        {label}: {formatted}
      </span>
    </span>
  );
}

export default function PreparationDashboard({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState("");
  const [filterText, setFilterText] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [viewMode, setViewMode] = useState("board"); // 'board' o 'list'
  const [activeTab, setActiveTab] = useState("ALL"); // 'ALL', 'PENDING', 'PREPARING', 'READY'
  const [checkedItems, setCheckedItems] = useState({}); // { [orderId-productId]: boolean }
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const previousCountRef = useRef(0);

  // Carga inicial al montar el componente
  useEffect(() => {
    let isMounted = true;

    const fetchInitial = async () => {
      try {
        const response = await api.get("/orders/preparation");
        if (!isMounted) return;
        const data = Array.isArray(response.data) ? response.data : [];
        previousCountRef.current = data.filter((o) => o.status === "PENDING").length;
        setOrders(data);
        setLastUpdated(new Date());
        setError("");
      } catch (err) {
        if (!isMounted) return;
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "No se pudieron cargar los pedidos de preparación."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      isMounted = false;
    };
  }, []);

  // Función para refresco manual o automático
  const loadPreparationOrders = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const response = await api.get("/orders/preparation");
      const data = Array.isArray(response.data) ? response.data : [];

      // Detección de nuevos pedidos para reproducir sonido
      const pendingCount = data.filter((o) => o.status === "PENDING").length;
      if (
        soundEnabled &&
        pendingCount > previousCountRef.current &&
        previousCountRef.current > 0
      ) {
        playKitchenNotificationSound();
      }
      previousCountRef.current = pendingCount;

      setOrders(data);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      console.error("Error al cargar pedidos de preparación:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "No se pudieron cargar los pedidos de preparación."
      );
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [soundEnabled]);

  // Temporizador de actualización automática (cada 15s)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadPreparationOrders(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadPreparationOrders]);

  // Cambiar el estado de un pedido
  const handleUpdateStatus = async (orderId, targetStatus) => {
    setUpdatingId(orderId);
    setError("");
    try {
      const response = await api.patch(`/orders/${orderId}/status`, {
        status: targetStatus,
      });

      // Actualizar localmente el pedido
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...response.data } : o))
      );

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, ...response.data }));
      }
    } catch (err) {
      console.error("Error al actualizar estado del pedido:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        "No se pudo actualizar el estado del pedido.";
      setError(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  // Toggle checklist de ingredientes/productos
  const toggleItemCheck = (orderId, productId) => {
    const key = `${orderId}-${productId}`;
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Clasificación de pedidos por estado FSM
  const isCreatedOrPaid = (s) => s === "CREADO" || s === "PENDING" || s === "PAGADO";
  const isPreparing = (s) => s === "EN_PREPARACION" || s === "PREPARING";
  const isEnCaminoOrReady = (s) => s === "EN_CAMINO" || s === "IN_DELIVERY" || s === "READY";

  const pendingOrders = useMemo(
    () => orders.filter((o) => isCreatedOrPaid(o.status)),
    [orders]
  );
  const preparingOrders = useMemo(
    () => orders.filter((o) => isPreparing(o.status)),
    [orders]
  );
  const readyOrders = useMemo(
    () => orders.filter((o) => isEnCaminoOrReady(o.status)),
    [orders]
  );

  // Filtrado por texto (número de orden, cliente, productos)
  const matchesSearch = (order) => {
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    const num = (order.orderNumber || "").toLowerCase();
    const client = (order.clientName || "").toLowerCase();
    const notes = (order.notes || "").toLowerCase();
    const items = (order.items || [])
      .map((i) => i.productName || "")
      .join(" ")
      .toLowerCase();

    return (
      num.includes(q) ||
      client.includes(q) ||
      notes.includes(q) ||
      items.includes(q)
    );
  };

  const filteredPending = pendingOrders.filter(matchesSearch);
  const filteredPreparing = preparingOrders.filter(matchesSearch);
  const filteredReady = readyOrders.filter(matchesSearch);

  // Pantalla completa
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Barra superior con gradiente de cocina/preparación */}
      <div className="h-1.5 bg-gradient-to-r from-amber-500 via-emerald-500 to-teal-400" />

      {/* HEADER DE CONTROL */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo y Título */}
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="group flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 transition hover:border-slate-600 hover:bg-slate-700 hover:text-white"
                title="Volver al panel administrativo"
              >
                <svg
                  className="h-4 w-4 transition group-hover:-translate-x-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-emerald-600 text-white shadow-lg shadow-emerald-950/40">
              {/* Icono de Gorro de Chef / Sartén */}
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
                <line x1="6" y1="17" x2="18" y2="17" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white sm:text-xl">
                  Módulo de Preparación
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  KDS Cocina
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Última actualización:{" "}
                <span className="font-mono text-slate-300">
                  {lastUpdated.toLocaleTimeString()}
                </span>
              </p>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              <span className="text-xs text-slate-400">Pendientes:</span>
              <span className="text-sm font-black text-sky-400">
                {pendingOrders.length}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-xs text-slate-400">En Cocina:</span>
              <span className="text-sm font-black text-amber-400">
                {preparingOrders.length}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/60 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-slate-400">Listos:</span>
              <span className="text-sm font-black text-emerald-400">
                {readyOrders.length}
              </span>
            </div>
          </div>

          {/* Controles: Refresco, Sonido, Modo vista, Pantalla completa */}
          <div className="flex items-center gap-2">
            {/* Buscador */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar pedido o ítem..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-36 sm:w-52 rounded-xl border border-slate-700/80 bg-slate-950 px-3 py-1.5 pl-8 text-xs text-white placeholder-slate-500 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <svg
                className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              {filterText && (
                <button
                  type="button"
                  onClick={() => setFilterText("")}
                  className="absolute right-2 top-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Toggle Sonido */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playKitchenNotificationSound();
              }}
              title={soundEnabled ? "Silenciar alertas" : "Activar sonido"}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition ${
                soundEnabled
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                  : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-300"
              }`}
            >
              {soundEnabled ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              )}
            </button>

            {/* Auto-refresh toggle */}
            <button
              type="button"
              onClick={() => setAutoRefresh(!autoRefresh)}
              title={autoRefresh ? "Auto-recarga activa (15s)" : "Auto-recarga pausada"}
              className={`flex h-9 items-center gap-1.5 rounded-xl border px-2.5 text-xs font-semibold transition ${
                autoRefresh
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                  : "border-slate-800 bg-slate-950 text-slate-500"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
              <span className="hidden sm:inline">{autoRefresh ? "Auto (15s)" : "Pausa"}</span>
            </button>

            {/* Botón Refrescar Manual */}
            <button
              type="button"
              onClick={() => loadPreparationOrders(false)}
              disabled={loading}
              title="Refrescar lista ahora"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-200 transition hover:bg-slate-700 disabled:opacity-50"
            >
              <svg
                className={`h-4 w-4 ${loading ? "animate-spin text-emerald-400" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
            </button>

            {/* Alternador de Vista (Kanban / Lista) */}
            <div className="hidden sm:flex rounded-xl border border-slate-800 bg-slate-950 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  viewMode === "board"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Vista Tablero"
              >
                Tablero
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                  viewMode === "list"
                    ? "bg-emerald-600 text-white shadow"
                    : "text-slate-400 hover:text-white"
                }`}
                title="Vista Lista"
              >
                Lista
              </button>
            </div>

            {/* Pantalla completa */}
            <button
              type="button"
              onClick={toggleFullScreen}
              title="Alternar Pantalla Completa"
              className="hidden lg:flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-950 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs para móvil o filtrado rápido */}
        <div className="flex border-t border-slate-800/80 px-4 py-2 sm:hidden overflow-x-auto gap-2">
          {[
            { id: "ALL", label: `Todos (${orders.length})` },
            { id: "PENDING", label: `Pendientes (${pendingOrders.length})` },
            { id: "PREPARING", label: `En Cocina (${preparingOrders.length})` },
            { id: "READY", label: `Listos (${readyOrders.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 rounded-lg px-3 py-1 text-xs font-bold transition ${
                activeTab === tab.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 shrink-0 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => setError("")}
              className="text-xs text-rose-400 hover:underline"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {loading && orders.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-400">
            <svg
              className="h-10 w-10 animate-spin text-emerald-500"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-semibold tracking-wide">
              Cargando comandas y pedidos de cocina...
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/40 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-500">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-bold text-white">
              No hay pedidos en cola de preparación
            </h3>
            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Los nuevos pedidos confirmados por clientes aparecerán aquí automáticamente en tiempo real.
            </p>
            <button
              type="button"
              onClick={() => loadPreparationOrders(false)}
              className="mt-5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500"
            >
              Verificar ahora
            </button>
          </div>
        ) : viewMode === "board" ? (
          /* ======================================================== */
          /* VISTA TABLERO KANBAN                                    */
          /* ======================================================== */
          <div className="grid gap-6 md:grid-cols-3">
            {/* COLUMNA 1: PENDIENTES */}
            <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 14 14" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    Por Preparar
                  </h2>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sky-500/20 px-2 text-xs font-bold text-sky-300">
                  {filteredPending.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {filteredPending.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-500">
                    Sin pedidos pendientes de ingreso.
                  </p>
                ) : (
                  filteredPending.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      column="PENDING"
                      onUpdateStatus={handleUpdateStatus}
                      onSelect={() => setSelectedOrder(order)}
                      updatingId={updatingId}
                      checkedItems={checkedItems}
                      onToggleItemCheck={toggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMNA 2: EN PREPARACIÓN (EN COCINA) */}
            <div className="flex flex-col rounded-2xl border border-amber-500/20 bg-slate-900/50 p-4 relative shadow-lg shadow-amber-950/20">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3.5z" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-amber-300">
                    En Preparación
                  </h2>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/20 px-2 text-xs font-bold text-amber-300 animate-pulse">
                  {filteredPreparing.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {filteredPreparing.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-500">
                    No hay pedidos en preparación activa.
                  </p>
                ) : (
                  filteredPreparing.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      column="PREPARING"
                      onUpdateStatus={handleUpdateStatus}
                      onSelect={() => setSelectedOrder(order)}
                      updatingId={updatingId}
                      checkedItems={checkedItems}
                      onToggleItemCheck={toggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>

            {/* COLUMNA 3: LISTOS PARA ENTREGA */}
            <div className="flex flex-col rounded-2xl border border-emerald-500/20 bg-slate-900/50 p-4 shadow-lg shadow-emerald-950/20">
              <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-emerald-300">
                    Listos para Despacho
                  </h2>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-emerald-500/20 px-2 text-xs font-bold text-emerald-300">
                  {filteredReady.length}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                {filteredReady.length === 0 ? (
                  <p className="py-12 text-center text-xs text-slate-500">
                    Sin pedidos esperando recolecta.
                  </p>
                ) : (
                  filteredReady.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      column="READY"
                      onUpdateStatus={handleUpdateStatus}
                      onSelect={() => setSelectedOrder(order)}
                      updatingId={updatingId}
                      checkedItems={checkedItems}
                      onToggleItemCheck={toggleItemCheck}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* VISTA LISTA DETALLADA                                    */
          /* ======================================================== */
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/70 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3.5">Pedido</th>
                    <th className="px-4 py-3.5">Cliente</th>
                    <th className="px-4 py-3.5">Ítems & Cantidad</th>
                    <th className="px-4 py-3.5">Tiempo</th>
                    <th className="px-4 py-3.5">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orders.filter(matchesSearch).map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="cursor-pointer transition hover:bg-slate-800/40"
                    >
                      <td className="px-4 py-3 font-mono font-bold text-white">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">
                          {order.clientName || "Cliente"}
                        </p>
                        <p className="truncate text-xs text-slate-400 max-w-[200px]">
                          {order.addressSnapshot}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, i) => (
                            <p key={i} className="text-xs text-slate-300">
                              <span className="font-bold text-emerald-400">
                                {item.quantity}x
                              </span>{" "}
                              {item.productName}
                            </p>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-[11px] text-slate-500 font-semibold">
                              +{order.items.length - 2} ítem(s) más
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TicketTimer startTime={order.createdAt} label="Espera" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td
                        className="px-4 py-3 text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.status === "PENDING" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "PREPARING")}
                            disabled={updatingId === order.id}
                            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                          >
                            Iniciar
                          </button>
                        )}
                        {order.status === "PREPARING" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(order.id, "READY")}
                            disabled={updatingId === order.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                          >
                            Listo
                          </button>
                        )}
                        {order.status === "READY" && (
                          <span className="text-xs text-slate-500 italic">
                            Esperando entrega
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL DETALLES DEL PEDIDO                                */}
      {/* ======================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl rounded-3xl border border-slate-700/80 bg-slate-900 p-6 text-white shadow-2xl">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-mono text-2xl font-black text-white">
                    {selectedOrder.orderNumber}
                  </h3>
                  <StatusBadge status={selectedOrder.status} />
                </div>
                <p className="mt-1 text-xs text-slate-400">
                  Registrado: {new Date(selectedOrder.createdAt).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-700 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Info del Cliente */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
              <div>
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Cliente
                </p>
                <p className="mt-0.5 font-bold text-white text-sm">
                  {selectedOrder.clientName || "Cliente"}
                </p>
                {selectedOrder.phoneSnapshot && (
                  <p className="text-slate-400">📞 {selectedOrder.phoneSnapshot}</p>
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                  Dirección de Entrega
                </p>
                <p className="mt-0.5 text-slate-200">
                  📍 {selectedOrder.addressSnapshot || "En sucursal / No especificada"}
                </p>
              </div>
            </div>

            {/* Notas especiales del cliente */}
            {selectedOrder.notes && (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                <span className="font-bold">📝 Instrucciones de cocina: </span>
                {selectedOrder.notes}
              </div>
            )}

            {/* Lista detallada de ítems */}
            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Ítems de la orden ({selectedOrder.items.length})
              </h4>
              <div className="divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden">
                {selectedOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 text-sm hover:bg-slate-900/50"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-xs font-black text-emerald-400 border border-emerald-500/30">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="font-semibold text-white">{item.productName}</p>
                        <p className="text-xs text-slate-400">
                          {formatMoney(item.unitPrice)} c/u
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-slate-200">
                      {formatMoney(item.subtotal || item.total)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totales */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3 text-sm">
              <span className="text-slate-400">Total a cobrar en entrega:</span>
              <span className="text-lg font-black text-emerald-400">
                {formatMoney(selectedOrder.total)}
              </span>
            </div>

            {/* Botones de acción dentro del modal */}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-xl border border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
              >
                Cerrar
              </button>

              {isCreatedOrPaid(selectedOrder.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "EN_PREPARACION");
                    }}
                    disabled={updatingId === selectedOrder.id}
                    className="rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-50"
                  >
                    🔥 Iniciar Preparación
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "CANCELADO");
                    }}
                    disabled={updatingId === selectedOrder.id}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                  >
                    ✕ Cancelar
                  </button>
                </>
              )}

              {isPreparing(selectedOrder.status) && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "EN_CAMINO");
                    }}
                    disabled={updatingId === selectedOrder.id}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                  >
                    🚚 Despachar a Reparto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrder.id, "CANCELADO");
                    }}
                    disabled={updatingId === selectedOrder.id}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
                  >
                    ✕ Cancelar
                  </button>
                </>
              )}

              {isEnCaminoOrReady(selectedOrder.status) && (
                <button
                  type="button"
                  onClick={() => {
                    handleUpdateStatus(selectedOrder.id, "ENTREGADO");
                  }}
                  disabled={updatingId === selectedOrder.id}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50"
                >
                  ✅ Marcar como Entregado
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================================================
// COMPONENTE: TARJETA DE TICKET (KANBAN CARD)
// ========================================================
function OrderCard({
  order,
  column,
  onUpdateStatus,
  onSelect,
  updatingId,
  checkedItems,
  onToggleItemCheck,
}) {
  const isUpdating = updatingId === order.id;

  // Contador de ítems chequeados en esta orden
  const itemsCount = order.items.length;
  const readyCount = order.items.filter(
    (item) => checkedItems[`${order.id}-${item.productId}`]
  ).length;

  return (
    <article
      onClick={onSelect}
      className="group relative cursor-pointer rounded-2xl border border-slate-800 bg-slate-950/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-700 hover:shadow-xl hover:shadow-slate-950/50"
    >
      {/* Cabecera del ticket */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <span className="font-mono text-base font-black text-white group-hover:text-emerald-400 transition-colors">
            {order.orderNumber}
          </span>
          <p className="text-xs font-medium text-slate-300">
            {order.clientName || "Cliente"}
          </p>
        </div>

        {/* Temporizador */}
        <TicketTimer
          startTime={order.createdAt}
          label={column === "PREPARING" ? "Cocina" : "Espera"}
        />
      </div>

      {/* Notas del cliente (alerta) */}
      {order.notes && (
        <div className="mt-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200 font-medium">
          <span className="font-bold">Nota: </span>
          {order.notes}
        </div>
      )}

      {/* Checklist interactivo de productos */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
          <span>Productos</span>
          {column === "PREPARING" && (
            <span className="text-emerald-400">
              {readyCount}/{itemsCount} preparados
            </span>
          )}
        </div>

        <ul className="space-y-1.5 text-xs">
          {order.items.map((item, idx) => {
            const isChecked = !!checkedItems[`${order.id}-${item.productId}`];
            return (
              <li
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleItemCheck(order.id, item.productId);
                }}
                className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition-colors ${
                  isChecked
                    ? "bg-emerald-950/30 text-slate-500 line-through"
                    : "bg-slate-900/60 text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="h-3.5 w-3.5 rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="font-bold text-amber-400">
                    {item.quantity}x
                  </span>
                  <span className="truncate max-w-[170px]">{item.productName}</span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Barra de progreso de preparación si está en cocina */}
      {column === "PREPARING" && itemsCount > 0 && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(readyCount / itemsCount) * 100}%` }}
          />
        </div>
      )}

      {/* Acciones del ticket */}
      <div
        className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="font-mono text-xs text-slate-400">
          {formatMoney(order.total)}
        </span>

        {column === "PENDING" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "EN_PREPARACION")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-900/30 transition hover:bg-amber-400 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <span className="animate-spin">⏳</span> : <span>🔥 Preparar</span>}
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "CANCELADO")}
              disabled={isUpdating}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
              title="Cancelar pedido"
            >
              ✕
            </button>
          </div>
        )}

        {column === "PREPARING" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "EN_CAMINO")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <span className="animate-spin">⏳</span> : <span>🚚 Despachar</span>}
            </button>
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "CANCELADO")}
              disabled={isUpdating}
              className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-2 py-1.5 text-xs font-bold text-rose-300 transition hover:bg-rose-500 hover:text-white disabled:opacity-50"
              title="Cancelar comanda"
            >
              ✕
            </button>
          </div>
        )}

        {column === "READY" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "ENTREGADO")}
              disabled={isUpdating}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow transition hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
            >
              {isUpdating ? <span className="animate-spin">⏳</span> : <span>✅ Entregado</span>}
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// Badge de estado con estilo elegante
function StatusBadge({ status }) {
  const styles = {
    CREADO: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    PENDING: "bg-sky-500/10 text-sky-400 border-sky-500/20",
    PAGADO: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    PAID: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    EN_PREPARACION: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    PREPARING: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    READY: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    EN_CAMINO: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    IN_DELIVERY: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    ENTREGADO: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    DELIVERED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    CANCELADO: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };

  const labels = {
    CREADO: "Creado",
    PENDING: "Creado",
    PAGADO: "Pagado",
    PAID: "Pagado",
    EN_PREPARACION: "En Cocina",
    PREPARING: "En Cocina",
    READY: "Listo",
    EN_CAMINO: "En Camino",
    IN_DELIVERY: "En Camino",
    ENTREGADO: "Entregado",
    DELIVERED: "Entregado",
    CANCELADO: "Cancelado",
    CANCELLED: "Cancelado",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
        styles[status] || styles.CREADO
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {labels[status] || status}
    </span>
  );
}
