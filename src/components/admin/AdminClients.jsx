import { useCallback, useEffect, useMemo, useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { formatDate, money } from "../../utils/orderStatus";
import { Role, initials } from "../../utils/users";
import AdminModal from "./AdminModal";
import AdminPageHeader from "./AdminPageHeader";
import ConfirmModal from "./ConfirmModal";
import OrderHistory from "./OrderHistory";
import PasswordModal from "./PasswordModal";
import StatCard from "./StatCard";
import StatusPill from "./StatusPill";
import UserFormModal from "./UserFormModal";

const inputClass =
  "rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500";

export default function AdminClients({ onNavigate }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [formClient, setFormClient] = useState(null);
  const [detailClient, setDetailClient] = useState(null);
  const [passwordClient, setPasswordClient] = useState(null);
  const [toggleClient, setToggleClient] = useState(null);
  const [toggling, setToggling] = useState(false);

  const loadClients = useCallback(async () => {
    try {
      const response = await api.get("/users", { params: { role: Role.CLIENT } });
      setClients(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los clientes."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadClients, 0);
    return () => window.clearTimeout(firstLoad);
  }, [loadClients]);

  const filteredClients = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (statusFilter === "ACTIVE" && !client.isActive) return false;
      if (statusFilter === "INACTIVE" && client.isActive) return false;
      if (!term) return true;
      return [client.fullName, client.email, client.phone].some((value) => value?.toLowerCase().includes(term));
    });
  }, [clients, search, statusFilter]);

  const activeCount = clients.filter((client) => client.isActive).length;
  const withOrders = clients.filter((client) => client.ordersCount > 0).length;
  const totalSales = clients.reduce((sum, client) => sum + Number(client.totalSpent || 0), 0);

  const handleSaved = () => {
    setFormClient(null);
    loadClients();
  };

  const confirmToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/users/${toggleClient.id}/status`);
      setToggleClient(null);
      loadClients();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar el estado del cliente."));
      setToggleClient(null);
    } finally {
      setToggling(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Clientes" description="Consulta la actividad de tus clientes y administra sus cuentas.">
        <button
          type="button"
          onClick={() => onNavigate("#/vista/cliente")}
          className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-4 py-2.5 text-sm font-bold text-violet-300 transition hover:bg-violet-500/20"
        >
          Ver tienda como cliente
        </button>
        <button
          type="button"
          onClick={() => setFormClient({})}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          + Nuevo cliente
        </button>
      </AdminPageHeader>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clientes registrados" value={clients.length} color="violet" />
        <StatCard label="Cuentas activas" value={activeCount} detail={`${clients.length - activeCount} inactivas`} color="emerald" />
        <StatCard label="Con pedidos" value={withOrders} color="sky" />
        <StatCard label="Ventas totales" value={money(totalSales)} detail="Sin pedidos cancelados" color="amber" />
      </section>

      {error && <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className={`${inputClass} flex-1`}
          />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
            <option value="ALL">Todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        {loading ? (
          <p className="py-12 text-center text-slate-400">Cargando clientes…</p>
        ) : filteredClients.length === 0 ? (
          <p className="py-12 text-center text-slate-500">No hay clientes que coincidan con la búsqueda.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-800">
                  <th className="pb-3 font-bold">Cliente</th>
                  <th className="pb-3 font-bold">Teléfono</th>
                  <th className="pb-3 text-center font-bold">Pedidos</th>
                  <th className="pb-3 text-right font-bold">Total gastado</th>
                  <th className="pb-3 font-bold">Último pedido</th>
                  <th className="pb-3 font-bold">Estado</th>
                  <th className="pb-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="text-slate-300">
                    <td className="py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/10 text-xs font-black text-violet-300">
                          {initials(client.fullName)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{client.fullName}</p>
                          <p className="truncate text-xs text-slate-500">{client.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5">{client.phone || "—"}</td>
                    <td className="py-3.5 text-center font-bold">{client.ordersCount}</td>
                    <td className="py-3.5 text-right font-bold text-emerald-300">{money(client.totalSpent)}</td>
                    <td className="py-3.5 text-xs text-slate-400">{client.lastOrderAt ? formatDate(client.lastOrderAt) : "Sin pedidos"}</td>
                    <td className="py-3.5"><StatusPill active={client.isActive} /></td>
                    <td className="py-3.5">
                      <div className="flex justify-end gap-1.5">
                        <ActionButton onClick={() => setDetailClient(client)}>Ver</ActionButton>
                        <ActionButton onClick={() => setFormClient(client)}>Editar</ActionButton>
                        <ActionButton danger={client.isActive} onClick={() => setToggleClient(client)}>
                          {client.isActive ? "Desactivar" : "Activar"}
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formClient && (
        <UserFormModal
          user={formClient.id ? formClient : null}
          defaultRole={Role.CLIENT}
          lockRole
          onClose={() => setFormClient(null)}
          onSaved={handleSaved}
        />
      )}

      {detailClient && (
        <ClientDetail
          client={detailClient}
          onClose={() => setDetailClient(null)}
          onEdit={() => {
            setFormClient(detailClient);
            setDetailClient(null);
          }}
          onPassword={() => {
            setPasswordClient(detailClient);
            setDetailClient(null);
          }}
        />
      )}

      {passwordClient && (
        <PasswordModal user={passwordClient} onClose={() => setPasswordClient(null)} onSaved={() => setPasswordClient(null)} />
      )}

      <ConfirmModal
        isOpen={Boolean(toggleClient)}
        onClose={() => setToggleClient(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        variant={toggleClient?.isActive ? "danger" : "success"}
        title={toggleClient?.isActive ? "Desactivar cliente" : "Activar cliente"}
        message={
          toggleClient?.isActive
            ? `${toggleClient?.fullName} no podrá iniciar sesión ni realizar pedidos.`
            : `${toggleClient?.fullName} podrá volver a iniciar sesión.`
        }
        confirmText={toggleClient?.isActive ? "Desactivar" : "Activar"}
      />
    </div>
  );
}

function ActionButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
        danger
          ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
          : "border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}

function ClientDetail({ client, onClose, onEdit, onPassword }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    api
      .get(`/users/${client.id}/orders`)
      .then((response) => {
        if (!ignore) setOrders(response.data);
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err, "No se pudo cargar el historial."));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [client.id]);

  return (
    <AdminModal title={client.fullName} subtitle={client.email} onClose={onClose} size="max-w-2xl">
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="Teléfono" value={client.phone || "—"} />
        <Info label="Cliente desde" value={formatDate(client.createdAt)} />
        <Info label="Total gastado" value={money(client.totalSpent)} />
      </div>

      <div className="mt-5 flex items-center justify-between">
        <h4 className="font-bold text-white">Historial de pedidos</h4>
        <StatusPill active={client.isActive} />
      </div>
      <div className="mt-3">
        {error ? (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>
        ) : (
          <OrderHistory orders={orders} loading={loading} emptyText="Este cliente aún no tiene pedidos." />
        )}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onPassword} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800">
          Restablecer contraseña
        </button>
        <button type="button" onClick={onEdit} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-500">
          Editar datos
        </button>
      </div>
    </AdminModal>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-white">{value}</p>
    </div>
  );
}
