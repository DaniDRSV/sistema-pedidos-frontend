import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";

const pedidosIniciales = [
  {
    id: "#OD-1048",
    cliente: "Mariana Lopez",
    direccion: "Av. Belgrano 1840, Palermo",
    hora: "12:30 - 13:00",
    estado: "En camino",
    color: "text-amber-300 bg-amber-400/10 border-amber-400/20",
  },
  {
    id: "#OD-1047",
    cliente: "Tomas Herrera",
    direccion: "Malabia 921, Villa Crespo",
    hora: "13:00 - 13:30",
    estado: "Pendiente",
    color: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  },
  {
    id: "#OD-1046",
    cliente: "Sofia Mendez",
    direccion: "Juncal 2248, Recoleta",
    hora: "14:00 - 14:30",
    estado: "Pendiente",
    color: "text-sky-300 bg-sky-400/10 border-sky-400/20",
  },
];

function Icon({ children, className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export default function DeliveryDashboard({ onBack }) {
  const { user, logout } = useContext(AuthContext);
  const [turnoActivo, setTurnoActivo] = useState(true);
  const [pedidos, setPedidos] = useState(pedidosIniciales);
  const nombre = user?.fullName?.split(" ")[0] || "repartidor";

  const marcarEntregado = (id) => {
    setPedidos((actuales) =>
      actuales.map((pedido) =>
        pedido.id === id
          ? {
              ...pedido,
              estado: "Entregado",
              color: "text-emerald-300 bg-emerald-400/10 border-emerald-400/20",
            }
          : pedido
      )
    );
  };

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex lg:fixed lg:inset-y-0">
        <div className="border-b border-slate-100 px-7 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <Icon><path d="M5 17h14M7 17V9l5-4 5 4v8M9 17v-4h6v4" /></Icon>
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-slate-900">Odyssey</p>
              <p className="text-xs font-medium text-slate-400">Panel de entregas</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-2 px-4 py-7">
          <button className="flex w-full items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-left text-sm font-bold text-emerald-700">
            <Icon><path d="m3 11 9-8 9 8M5 10v10h14V10M9 20v-6h6v6" /></Icon>
            Resumen
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
            <Icon><path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" /></Icon>
            Mis pedidos
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-slate-50 hover:text-slate-900">
            <Icon><circle cx="12" cy="12" r="8" /><path d="M12 8v4l2.5 2.5" /></Icon>
            Historial
          </button>
        </nav>
        <div className="m-4 rounded-2xl bg-slate-900 p-4 text-white">
          <p className="text-xs font-semibold text-slate-400">Tu jornada</p>
          <p className="mt-1 text-sm font-bold">Buen ritmo, {nombre}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-700"><div className="h-full w-3/4 rounded-full bg-emerald-400" /></div>
          <p className="mt-2 text-xs text-slate-400">75% de objetivo diario</p>
        </div>
        <button onClick={logout} className="m-4 mt-0 flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600">
          <Icon><path d="M10 17l5-5-5-5M15 12H3M21 19V5" /></Icon>
          Cerrar sesión
        </button>
      </aside>

      <main className="lg:ml-64">
        <header className="border-b border-slate-200 bg-white/90 px-5 py-5 backdrop-blur md:px-10">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="mb-2 text-xs font-bold text-emerald-700 transition-colors hover:text-emerald-500"
                >
                  ← Panel administrativo
                </button>
              )}
              <p className="text-sm font-semibold text-emerald-600">Lunes, 14 de octubre</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">Hola, {nombre} <span aria-hidden="true">👋</span></h1>
              <p className="mt-1 text-sm text-slate-500">Todo listo para una nueva jornada.</p>
            </div>
            <button onClick={() => setTurnoActivo(!turnoActivo)} className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${turnoActivo ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
              <span className={`h-2 w-2 rounded-full ${turnoActivo ? "bg-emerald-500" : "bg-slate-400"}`} />
              {turnoActivo ? "Turno activo" : "Turno pausado"}
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-5 py-7 md:px-10 md:py-10">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-emerald-600 p-5 text-white shadow-xl shadow-emerald-600/15"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-emerald-100">Entregas hoy</p><Icon className="h-5 w-5 text-emerald-200"><path d="M5 12h14M13 6l6 6-6 6" /></Icon></div><p className="mt-4 text-3xl font-black">12</p><p className="mt-1 text-xs text-emerald-100">+3 frente a ayer</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">Completadas</p><Icon className="h-5 w-5 text-emerald-500"><path d="m5 12 4 4L19 6" /></Icon></div><p className="mt-4 text-3xl font-black text-slate-900">8</p><p className="mt-1 text-xs text-emerald-600">66% de tu ruta</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">En camino</p><Icon className="h-5 w-5 text-amber-500"><path d="M3 17h2m14 0h2M5 17V7h10l4 4v6M15 17V7M7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /></Icon></div><p className="mt-4 text-3xl font-black text-slate-900">1</p><p className="mt-1 text-xs text-slate-500">Próxima parada en 12 min</p></div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-slate-500">Calificación</p><Icon className="h-5 w-5 text-orange-400"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" /></Icon></div><p className="mt-4 text-3xl font-black text-slate-900">4.9 <span className="text-base font-semibold text-slate-400">/ 5</span></p><p className="mt-1 text-xs text-slate-500">Excelente trabajo</p></div>
          </section>

          <section className="mt-7 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7">
              <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-black text-slate-900">Ruta de hoy</h2><p className="mt-1 text-sm text-slate-500">Tus próximas entregas en orden</p></div><button className="rounded-lg px-2 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Ver mapa</button></div>
              <div className="mt-6 space-y-4">
                {pedidos.map((pedido, index) => (
                  <div key={pedido.id} className="flex gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30">
                    <div className="flex flex-col items-center"><div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${index === 0 ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"}`}>{index + 1}</div>{index < pedidos.length - 1 && <div className="mt-2 h-full w-px bg-slate-200" />}</div>
                    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-bold text-slate-900">{pedido.cliente}</p><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${pedido.color}`}>{pedido.estado}</span></div><p className="mt-1 text-sm text-slate-500">{pedido.direccion}</p><p className="mt-2 text-xs font-semibold text-slate-400">{pedido.id} · {pedido.hora}</p></div>
                    {pedido.estado !== "Entregado" && <button onClick={() => marcarEntregado(pedido.id)} className="self-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700">Entregar</button>}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-7"><div className="flex items-center justify-between"><div><h2 className="text-xl font-black text-slate-900">Tu progreso</h2><p className="mt-1 text-sm text-slate-500">Objetivo de la jornada</p></div><span className="text-2xl font-black text-emerald-600">75%</span></div><div className="mt-7 h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full w-3/4 rounded-full bg-emerald-500" /></div><div className="mt-7 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-400">Distancia</p><p className="mt-1 text-lg font-black text-slate-900">18.4 km</p></div><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-400">Tiempo activo</p><p className="mt-1 text-lg font-black text-slate-900">4h 20m</p></div></div><div className="mt-6 flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-orange-500"><path d="M12 8v4m0 4h.01M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3l-7.7-13.2a2 2 0 0 0-3.4 0Z" /></Icon><p className="text-xs leading-relaxed"><strong>Recordatorio:</strong> revisa que cada pedido esté completo antes de salir.</p></div></div>
          </section>
        </div>
      </main>
    </div>
  );
}
