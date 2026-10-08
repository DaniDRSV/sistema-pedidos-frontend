import { useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../../services/api";

function CourierIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="6.5" cy="17.5" r="3" />
      <circle cx="17.5" cy="17.5" r="3" />
      <path d="M6.5 17.5 10 10h4l3.5 7.5M10 10l2.5 7.5M9 6.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="m11 10-2-2.5H6.5" />
    </svg>
  );
}

export default function AdminCouriers() {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshCouriers = useCallback(async () => {
    try {
      const response = await api.get("/deliveries/couriers");
      setCouriers(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los repartidores."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(refreshCouriers, 0);
    return () => window.clearTimeout(firstLoad);
  }, [refreshCouriers]);

  const availableCouriers = couriers.filter((courier) => courier.available);

  return (
    <div className="-mx-5 -my-7 min-h-[calc(100vh-65px)] bg-slate-950 text-slate-100 md:-mx-8 md:-my-10 lg:-mx-10">
      <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500" />

      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-emerald-50 shadow-lg shadow-emerald-950/40">
              <CourierIcon />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">Repartidores</h1>
              <p className="text-xs text-slate-400">Repartidores registrados y su carga de trabajo actual.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshCouriers}
            className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-200 transition hover:bg-emerald-400/20"
          >
            ↻ Actualizar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-7 md:px-8 lg:px-10">
        <section className="max-w-sm rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
          <p className="text-sm font-semibold text-emerald-100">Repartidores disponibles</p>
          <p className="mt-2 text-4xl font-black text-emerald-300">{availableCouriers.length}</p>
          <p className="mt-1 text-xs text-emerald-100/70">Sin pedidos en preparación ni en camino.</p>
        </section>

        <section className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20 md:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">Equipo de reparto</h2>
              <p className="mt-1 text-sm text-slate-400">Para registrar un repartidor, asigna el rol DELIVERY a su usuario.</p>
            </div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
              {couriers.length}
            </span>
          </div>

          {error && <p className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-200">{error}</p>}

          {loading ? (
            <p className="py-16 text-center text-slate-400">Cargando repartidores…</p>
          ) : couriers.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800 text-slate-500">
                <CourierIcon className="h-7 w-7" />
              </div>
              <p className="mt-4 font-bold text-slate-300">No hay repartidores registrados.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {couriers.map((courier) => (
                <article
                  key={courier.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 transition hover:border-emerald-400/35"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-lg font-black text-emerald-300">
                      {courier.fullName?.charAt(0)?.toUpperCase() || "R"}
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${courier.available ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300" : "border-amber-400/20 bg-amber-400/10 text-amber-300"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${courier.available ? "bg-emerald-400" : "bg-amber-400"}`} />
                      {courier.available ? "Disponible" : `${courier.activeOrders} pedido(s) activos`}
                    </span>
                  </div>
                  <h3 className="mt-4 truncate text-base font-black text-white">{courier.fullName || "Repartidor"}</h3>
                  <p className="mt-1 truncate text-sm text-slate-400">{courier.email || "Sin correo registrado"}</p>
                  <p className="mt-3 text-sm font-semibold text-cyan-200">{courier.phone || "Sin teléfono registrado"}</p>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
