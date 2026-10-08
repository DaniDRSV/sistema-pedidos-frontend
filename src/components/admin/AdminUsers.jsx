import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import api, { getErrorMessage } from "../../services/api";
import { formatDate } from "../../utils/orderStatus";
import { Role, initials, roleLabels, roleStyles } from "../../utils/users";
import AdminPageHeader from "./AdminPageHeader";
import ConfirmModal from "./ConfirmModal";
import PasswordModal from "./PasswordModal";
import StatusPill from "./StatusPill";
import UserFormModal from "./UserFormModal";

const tabs = [
  { value: "ALL", label: "Todos" },
  { value: Role.ADMIN, label: "Administradores" },
  { value: Role.CLIENT, label: "Clientes" },
  { value: Role.DELIVERY, label: "Repartidores" },
];

export default function AdminUsers() {
  const { user: currentUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [formUser, setFormUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [toggleUser, setToggleUser] = useState(null);
  const [toggling, setToggling] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "No se pudieron cargar los usuarios."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const firstLoad = window.setTimeout(loadUsers, 0);
    return () => window.clearTimeout(firstLoad);
  }, [loadUsers]);

  const counts = useMemo(
    () =>
      users.reduce(
        (acc, item) => ({ ...acc, [item.role]: (acc[item.role] || 0) + 1 }),
        { ALL: users.length }
      ),
    [users]
  );

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    return users.filter((item) => {
      if (tab !== "ALL" && item.role !== tab) return false;
      if (!term) return true;
      return [item.fullName, item.email, item.phone].some((value) => value?.toLowerCase().includes(term));
    });
  }, [users, tab, search]);

  const handleSaved = () => {
    setFormUser(null);
    loadUsers();
  };

  const confirmToggle = async () => {
    setToggling(true);
    try {
      await api.patch(`/users/${toggleUser.id}/status`);
      loadUsers();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo actualizar el estado del usuario."));
    } finally {
      setToggleUser(null);
      setToggling(false);
    }
  };

  return (
    <div>
      <AdminPageHeader title="Usuarios" description="Administra las cuentas y los roles de acceso al sistema.">
        <button
          type="button"
          onClick={() => setFormUser({})}
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
        >
          + Nuevo usuario
        </button>
      </AdminPageHeader>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setTab(item.value)}
            className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
              tab === item.value ? "bg-emerald-600 text-white" : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            {item.label}
            <span className={`rounded-full px-2 py-0.5 text-[11px] ${tab === item.value ? "bg-white/20" : "bg-slate-800"}`}>
              {counts[item.value] || 0}
            </span>
          </button>
        ))}
      </div>

      {error && <p className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">{error}</p>}

      <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nombre, correo o teléfono"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
        />

        {loading ? (
          <p className="py-12 text-center text-slate-400">Cargando usuarios…</p>
        ) : filteredUsers.length === 0 ? (
          <p className="py-12 text-center text-slate-500">No hay usuarios que coincidan con la búsqueda.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr className="border-b border-slate-800">
                  <th className="pb-3 font-bold">Usuario</th>
                  <th className="pb-3 font-bold">Rol</th>
                  <th className="pb-3 font-bold">Teléfono</th>
                  <th className="pb-3 font-bold">Registrado</th>
                  <th className="pb-3 font-bold">Estado</th>
                  <th className="pb-3 text-right font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((item) => {
                  const isMe = item.id === currentUser?.id;
                  return (
                    <tr key={item.id} className="text-slate-300">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-black ${roleStyles[item.role]}`}>
                            {initials(item.fullName)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">
                              {item.fullName}
                              {isMe && <span className="ml-1.5 text-xs font-medium text-emerald-400">(tú)</span>}
                            </p>
                            <p className="truncate text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${roleStyles[item.role]}`}>
                          {roleLabels[item.role] || item.role}
                        </span>
                      </td>
                      <td className="py-3.5">{item.phone || "—"}</td>
                      <td className="py-3.5 text-xs text-slate-400">{formatDate(item.createdAt)}</td>
                      <td className="py-3.5"><StatusPill active={item.isActive} /></td>
                      <td className="py-3.5">
                        <div className="flex justify-end gap-1.5">
                          <TableButton onClick={() => setFormUser(item)}>Editar</TableButton>
                          <TableButton onClick={() => setPasswordUser(item)}>Contraseña</TableButton>
                          {!isMe && (
                            <TableButton danger={item.isActive} onClick={() => setToggleUser(item)}>
                              {item.isActive ? "Desactivar" : "Activar"}
                            </TableButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formUser && (
        <UserFormModal
          user={formUser.id ? formUser : null}
          defaultRole={tab === "ALL" ? Role.CLIENT : tab}
          lockRole={formUser.id === currentUser?.id}
          onClose={() => setFormUser(null)}
          onSaved={handleSaved}
        />
      )}

      {passwordUser && (
        <PasswordModal user={passwordUser} onClose={() => setPasswordUser(null)} onSaved={() => setPasswordUser(null)} />
      )}

      <ConfirmModal
        isOpen={Boolean(toggleUser)}
        onClose={() => setToggleUser(null)}
        onConfirm={confirmToggle}
        loading={toggling}
        variant={toggleUser?.isActive ? "danger" : "success"}
        title={toggleUser?.isActive ? "Desactivar usuario" : "Activar usuario"}
        message={
          toggleUser?.isActive
            ? `${toggleUser?.fullName} perderá el acceso al sistema.`
            : `${toggleUser?.fullName} podrá volver a iniciar sesión.`
        }
        confirmText={toggleUser?.isActive ? "Desactivar" : "Activar"}
      />
    </div>
  );
}

function TableButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
        danger ? "border-red-500/20 text-red-400 hover:bg-red-500/10" : "border-slate-700 text-slate-300 hover:bg-slate-800"
      }`}
    >
      {children}
    </button>
  );
}
