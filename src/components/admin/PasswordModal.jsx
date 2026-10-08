import { useState } from "react";
import api, { getErrorMessage } from "../../services/api";
import AdminModal from "./AdminModal";

export default function PasswordModal({ user, onClose, onSaved }) {
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await api.patch(`/users/${user.id}/password`, { password });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cambiar la contraseña."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminModal title="Restablecer contraseña" subtitle={user.fullName} onClose={onClose} size="max-w-md">
      <form onSubmit={handleSubmit} className="grid gap-4">
        <label className="grid gap-1.5 text-xs font-bold text-slate-400">
          Nueva contraseña
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
          />
          <span className="font-normal text-slate-500">Mínimo 6 caracteres, una mayúscula y un número.</span>
        </label>
        {error && <p className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800">
            Cancelar
          </button>
          <button type="submit" disabled={saving} className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </form>
    </AdminModal>
  );
}
