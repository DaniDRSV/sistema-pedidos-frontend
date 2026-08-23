import { useState } from "react";
import api from "../services/api";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);


  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    // Validar contraseñas
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    // Validar longitud
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/auth/register", {
        fullName,
        email,
        phone,
        password,
      });

     setRegistered(true);

    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Error de conexión con el servidor."
      )
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">

        <div className="w-full max-w-md">

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">

            {/* Icono */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg
                className="h-8 w-8 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="mt-6 text-3xl font-bold text-white">
              ¡Registro exitoso!
            </h2>

            <p className="mt-3 text-slate-400">
              Tu cuenta ha sido creada correctamente.
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Ahora puedes iniciar sesión con tus credenciales.
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.hash = "#/login";
              }}
              className="mt-8 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98]"
            >
              Ir a iniciar sesión
            </button>

          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Odyssey · Sistema de Ventas
          </p>

        </div>

      </div>
    );
  }

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
            Crea tu cuenta y comienza a utilizar nuestra
            plataforma para administrar tus ventas,
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
          <div className="mb-8 text-center lg:hidden">

            <h1 className="text-4xl font-black text-emerald-500">
              Odyssey
            </h1>

            <p className="mt-2 text-slate-400">
              Sistema de Ventas
            </p>

          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">

            <h2 className="text-3xl font-bold text-white">
              Crear cuenta
            </h2>

            <p className="mt-2 text-slate-400">
              Regístrate para comenzar.
            </p>

            {/* Error */}
            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Nombre */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Nombre completo
                </label>

                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juan Pérez"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />

              </div>

              {/* Correo */}
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

              {/* Teléfono */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Teléfono
                </label>

                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="7777-7777"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />

              </div>

              {/* Contraseña */}
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

              {/* Confirmar contraseña */}
              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirmar contraseña
                </label>

                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />

              </div>

              {/* Botón */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting
                  ? "Registrando..."
                  : "Crear cuenta"}
              </button>

            </form>

            {/* Login */}
            <div className="mt-6 text-center text-sm text-slate-400">

              ¿Ya tienes una cuenta?{" "}

            <button
            type="button"
            onClick={() => {
                window.location.hash = "#/login";
            }}
            className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
            >
            Inicia sesión
            </button>

            </div>

          </div>

          <p className="mt-8 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} Odyssey · Sistema de Ventas
          </p>

        </div>

      </div>

    </div>
  );
}