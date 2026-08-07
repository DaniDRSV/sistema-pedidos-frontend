import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      const { user, token } = response.data.data;

      login(user, token);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error de conexión con el servidor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-slate-900">

        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-black/20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <h1 className="text-6xl font-black tracking-tight">
            Odyssey
          </h1>

          <p className="mt-6 text-xl text-emerald-100 leading-relaxed">
            Plataforma moderna para la administración de ventas,
            inventario y clientes.
          </p>

          <div className="mt-14 space-y-5">

            <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-white"></div>
              <span>Control total de inventario</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-white"></div>
              <span>Gestión de usuarios</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-white"></div>
              <span>Ventas en tiempo real</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-3 w-3 rounded-full bg-white"></div>
              <span>Panel administrativo intuitivo</span>
            </div>

          </div>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">

        <div className="w-full max-w-md">

          {/* Logo para móvil */}
          <div className="mb-10 text-center lg:hidden">

            <h1 className="text-4xl font-black text-emerald-500">
              Odyssey
            </h1>

            <p className="mt-2 text-slate-400">
              Sistema de Ventas
            </p>

          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl transition-shadow duration-300 hover:shadow-emerald-900/20">

            <h2 className="text-3xl font-bold text-white">
              Bienvenido
            </h2>

            <p className="mt-2 text-slate-400">
              Inicia sesión para continuar.
            </p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-6"
            >
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />

              </div>

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Contraseña
                </label>

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />

              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Verificando..."
                  : "Iniciar Sesión"}
              </button>

            </form>

          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Odyssey · Sistema de Ventas
          </p>

        </div>

      </div>
    </div>
  );
}