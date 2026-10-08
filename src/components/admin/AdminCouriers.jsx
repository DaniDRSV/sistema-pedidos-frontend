import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { Role, initials, vehicleLabels } from "../../utils/users";
import AdminPageHeader from "./AdminPageHeader";
import ConfirmModal from "./ConfirmModal";
import PasswordModal from "./PasswordModal";
import StatCard from "./StatCard";
import StatusPill from "./StatusPill";
import UserFormModal from "./UserFormModal";

const isAvailable = (courier) => courier.deliveryProfile?.isAvailable ?? true;

export default function AdminCouriers({ onNavigate }) {
  const [couriers, setCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formCourier, setFormCourier] = useState(null);
  const [passwordCourier, setPasswordCourier] = useState(null);
  const [toggleCourier, setToggleCourier] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadCouriers = useCallback(async () => {
    try {
      const response = await api.get("/users", { params: { role: Role.DELIVERY } });
      setCouriers(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los repartidores."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadCouriers, 0);
    return () => window.clearTimeout(firstLoad);
  }, [loadCouriers]);

  const filteredCouriers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return couriers;
    return couriers.filter((courier) =>
      [courier.fullName, courier.email, courier.phone, courier.deliveryProfile?.licensePlate].some((value) =>
        value?.toLowerCase().includes(term)
      )
    );
  }, [couriers, search]);

  const availableCount = couriers.filter((courier) => courier.available).length;
  const activeDeliveries = couriers.reduce((sum, courier) => sum + Number(courier.activeOrders || 0), 0);
  const delivered = couriers.reduce((sum, courier) => sum + Number(courier.deliveredOrders || 0), 0);

  const runAction = async (courier, request, fallback) => {
    setBusyId(courier.id);
    setError("");
    try {
      await request();
      await loadCouriers();
    } catch (err) {
      setError(getErrorMessage(err, fallback));
    } finally {
      setBusyId(null);
    }
  };

  const toggleAvailability = (courier) =>
    runAction(courier, () => api.patch(`/users/${courier.id}/availability`), "No se pudo cambiar la disponibilidad.");

  const confirmToggle = async () => {
    const courier = toggleCourier;
    setToggleCourier(null);
    await runAction(courier, () => api.patch(`/users/${courier.id}/status`), "No se pudo actualizar el estado.");
  };

  const handleSaved = () => {
    setFormCourier(null);
    loadCouriers();
  };

  return (
    <div>
      <AdminPageHeader title="Repartidores" description="Registra repartidores, controla su disponibilidad y revisa su jornada.">
        <button
          type="button"
          onClick={loadCouriers}
          className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
        >
          ↻ Actualizar
        </button>
        <button
          type="button"
          onClick={() => setFormCourier({})}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          + Nuevo repartidor
        </button>
      </AdminPageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Repartidores registrados" value={couriers.length} color="amber" />
        <StatCard label="Disponibles ahora" value={availableCount} color="emerald" />
        <StatCard label="Entregas en curso" value={activeDeliveries} color="sky" />
        <StatCard label="Entregas completadas" value={delivered} color="violet" />
      </section>

      {error && <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, correo, teléfono o placa"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
        />

        {loading ? (
          <p className="py-12 text-center text-slate-400">Cargando repartidores…</p>
        ) : filteredCouriers.length === 0 ? (
          <p className="py-12 text-center text-slate-500">No hay repartidores registrados.</p>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredCouriers.map((courier) => (
              <CourierCard
                key={courier.id}
                courier={courier}
                busy={busyId === courier.id}
                onEdit={() => setFormCourier(courier)}
                onPassword={() => setPasswordCourier(courier)}
                onAvailability={() => toggleAvailability(courier)}
                onToggle={() => setToggleCourier(courier)}
                onView={() => onNavigate(`#/vista/repartidor/${courier.id}`)}
              />
            ))}
          </div>
        )}
      </section>

      {formCourier && (
        <UserFormModal
          user={formCourier.id ? formCourier : null}
          defaultRole={Role.DELIVERY}
          lockRole
          onClose={() => setFormCourier(null)}
          onSaved={handleSaved}
        />
      )}

      {passwordCourier && (
        <PasswordModal user={passwordCourier} onClose={() => setPasswordCourier(null)} onSaved={() => setPasswordCourier(null)} />
      )}

      <ConfirmModal
        isOpen={Boolean(toggleCourier)}
        onClose={() => setToggleCourier(null)}
        onConfirm={confirmToggle}
        variant={toggleCourier?.isActive ? "danger" : "success"}
        title={toggleCourier?.isActive ? "Desactivar repartidor" : "Activar repartidor"}
        message={
          toggleCourier?.isActive
            ? `${toggleCourier?.fullName} ya no podrá iniciar sesión ni recibir entregas.`
            : `${toggleCourier?.fullName} podrá volver a recibir entregas.`
        }
        confirmText={toggleCourier?.isActive ? "Desactivar" : "Activar"}
      />
    </div>
  );
}

function CourierCard({ courier, busy, onEdit, onPassword, onAvailability, onToggle, onView }) {
  const profile = courier.deliveryProfile || {};
  const available = isAvailable(courier);

  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-sm font-black text-amber-300">
            {initials(courier.fullName)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-bold text-white">{courier.fullName}</p>
            <p className="truncate text-xs text-slate-500">{courier.email}</p>
          </div>
        </div>
        <StatusPill active={courier.isActive} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <Detail label="Vehículo" value={vehicleLabels[profile.vehicleType] || "—"} />
        <Detail label="Placa" value={profile.licensePlate || "—"} />
        <Detail label="Teléfono" value={courier.phone || "—"} />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
        <StatusPill active={available} activeText="Disponible" inactiveText="No disponible" />
        <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 font-bold text-sky-300">
          {courier.activeOrders} en curso
        </span>
        <span className="rounded-full border border-slate-700 px-2.5 py-1 font-bold text-slate-400">
          {courier.deliveredOrders} entregadas
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          disabled={busy || !courier.isActive}
          onClick={onAvailability}
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
        >
          {available ? "Marcar no disponible" : "Marcar disponible"}
        </button>
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20"
        >
          Ver panel
        </button>
        <button type="button" onClick={onEdit} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800">
          Editar
        </button>
        <button type="button" onClick={onPassword} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800">
          Contraseña
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onToggle}
          className={`col-span-2 rounded-lg border px-3 py-2 text-xs font-bold transition disabled:opacity-40 ${
            courier.isActive
              ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          }`}
        >
          {courier.isActive ? "Desactivar repartidor" : "Activar repartidor"}
        </button>
      </div>
    </article>
  );
}

function Detail({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate font-bold text-white">{value}</dd>
    </div>
  );
}
