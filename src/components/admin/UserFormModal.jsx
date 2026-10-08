import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import { Role, roleLabels, vehicleLabels } from "../../utils/users";
import AdminModal from "./AdminModal";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500";

const buildForm = (user, defaultRole) => ({
  fullName: user?.fullName || "",
  email: user?.email || "",
  phone: user?.phone || "",
  password: "",
  role: user?.role || defaultRole,
  vehicleType: user?.deliveryProfile?.vehicleType || "MOTORCYCLE",
  licensePlate: user?.deliveryProfile?.licensePlate || "",
  driverLicense: user?.deliveryProfile?.driverLicense || "",
});

export default function UserFormModal({ user, defaultRole = Role.CLIENT, lockRole = false, onClose, onSaved }) {
  const isEditing = Boolean(user);
  const [form, setForm] = useState(() => buildForm(user, defaultRole));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      role: form.role,
    };
    if (form.role === Role.DELIVERY) {
      payload.deliveryProfile = {
        vehicleType: form.vehicleType,
        licensePlate: form.licensePlate,
        driverLicense: form.driverLicense,
      };
    }

    try {
      const response = isEditing
        ? await api.put(`/users/${user.id}`, payload)
        : await api.post("/users", { ...payload, password: form.password });
      onSaved(response.data);
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo guardar el usuario."));
    } finally {
      setSaving(false);
    }
  };

  const title = isEditing ? `Editar ${roleLabels[form.role]?.toLowerCase() || "usuario"}` : `Nuevo ${roleLabels[form.role]?.toLowerCase() || "usuario"}`;

  return (
    <AdminModal title={title} subtitle={isEditing ? user.email : "Completa los datos de acceso."} onClose={onClose}>
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-xs font-bold text-slate-400">
          Nombre completo
          <input name="fullName" value={form.fullName} onChange={handleChange} required minLength={3} className={inputClass} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-xs font-bold text-slate-400">
            Correo
            <input type="email" name="email" value={form.email} onChange={handleChange} required className={inputClass} />
          </label>
          <label className="grid gap-1.5 text-xs font-bold text-slate-400">
            Teléfono
            <input name="phone" value={form.phone} onChange={handleChange} required className={inputClass} />
          </label>
        </div>

        {!isEditing && (
          <label className="grid gap-1.5 text-xs font-bold text-slate-400">
            Contraseña
            <input type="password" name="password" value={form.password} onChange={handleChange} required minLength={6} className={inputClass} />
            <span className="font-normal text-slate-500">Mínimo 6 caracteres, una mayúscula y un número.</span>
          </label>
        )}

        {!lockRole && (
          <label className="grid gap-1.5 text-xs font-bold text-slate-400">
            Rol
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>{roleLabels[role]}</option>
              ))}
            </select>
          </label>
        )}

        {form.role === Role.DELIVERY && (
          <div className="grid gap-4 rounded-xl border border-amber-400/15 bg-amber-400/5 p-4 sm:grid-cols-3">
            <label className="grid gap-1.5 text-xs font-bold text-slate-400">
              Vehículo
              <select name="vehicleType" value={form.vehicleType} onChange={handleChange} className={inputClass}>
                {Object.entries(vehicleLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-slate-400">
              Placa
              <input name="licensePlate" value={form.licensePlate} onChange={handleChange} className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-xs font-bold text-slate-400">
              Licencia
              <input name="driverLicense" value={form.driverLicense} onChange={handleChange} className={inputClass} />
            </label>
          </div>
        )}

        {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:opacity-50">
            {saving ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
