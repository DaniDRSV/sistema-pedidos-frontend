import { useState } from "react";
import api from "../services/api";

const COUNTRY_CODES = [
  { code: "+503", flag: "🇸🇻", name: "El Salvador", digits: 8, format: "####-####" },
  { code: "+502", flag: "🇬🇹", name: "Guatemala", digits: 8, format: "####-####" },
  { code: "+504", flag: "🇭🇳", name: "Honduras", digits: 8, format: "####-####" },
  { code: "+505", flag: "🇳🇮", name: "Nicaragua", digits: 8, format: "####-####" },
  { code: "+506", flag: "🇨🇷", name: "Costa Rica", digits: 8, format: "####-####" },
  { code: "+1",   flag: "🇺🇸", name: "Estados Unidos", digits: 10, format: "(###) ###-####" },
];

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+503");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
    const maxDigits = selectedCountry ? selectedCountry.digits : 10;
    const truncated = raw.slice(0, maxDigits);

    if (maxDigits === 8) {
      if (truncated.length > 4) {
        setPhone(`${truncated.slice(0, 4)}-${truncated.slice(4)}`);
      } else {
        setPhone(truncated);
      }
    } 
    else if (maxDigits === 10) {
      if (truncated.length > 6) {
        setPhone(`(${truncated.slice(0, 3)}) ${truncated.slice(3, 6)}-${truncated.slice(6)}`);
      } else if (truncated.length > 3) {
        setPhone(`(${truncated.slice(0, 3)}) ${truncated.slice(3)}`);
      } else if (truncated.length > 0) {
        setPhone(`(${truncated}`);
      } else {
        setPhone("");
      }
    } else {
      setPhone(truncated);
    }
  };

  const validateForm = () => {
    if (fullName.trim().length < 3) {
      setError("El nombre completo debe tener al menos 3 caracteres.");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Ingresa un correo electrónico válido.");
      return false;
    }

    const rawPhone = phone.replace(/\D/g, "");
    const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode);
    if (rawPhone.length !== selectedCountry.digits) {
      setError(`El teléfono debe contener exactamente ${selectedCountry.digits} dígitos.`);
      return false;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return false;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(password)) {
      setError("La contraseña debe incluir al menos una letra mayúscula y un número.");
      return false;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setSubmitting(true);

    const fullPhoneNumber = `${countryCode} ${phone}`;

    try {
      const response = await api.post("/auth/register", {
        fullName,
        email,
        phone: fullPhoneNumber,
        password,
      });

      if (response.data?.success) {
        setRegistered(true);
      } else {
        setError(response.data?.message || "Ocurrió un problema al registrar la cuenta.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Error de conexión con el servidor."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (registered) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-white">¡Registro exitoso!</h2>
            <p className="mt-3 text-slate-400">Tu cuenta ha sido creada correctamente.</p>
            <button
              type="button"
              onClick={() => { window.location.hash = "#/login"; }}
              className="mt-8 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98]"
            >
              Ir a iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Panel izquierdo */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-slate-900">
        <div className="relative z-10 flex flex-col justify-center px-20 text-white">
          <h1 className="text-6xl font-black tracking-tight">Odyssey</h1>
          <p className="mt-6 text-xl text-emerald-100 leading-relaxed">
            Crea tu cuenta y comienza a utilizar nuestra plataforma para administrar tus ventas, inventario y clientes.
          </p>
        </div>
      </div>

      {/* Panel derecho */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white">Crear cuenta</h2>
            <p className="mt-2 text-slate-400">Regístrate para comenzar.</p>

            {error && (
              <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Nombre */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Nombre completo</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-300">Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                />
              </div>

              {/* Teléfono con Select de País */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Teléfono</label>
                <div className="flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => {
                      setCountryCode(e.target.value);
                      setPhone(""); // Resetea teléfono al cambiar país
                    }}
                    className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white outline-none transition-colors duration-200 focus:border-emerald-500 cursor-pointer"
                  >
                    {COUNTRY_CODES.map((c) => (
                      <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>

                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder={COUNTRY_CODES.find((c) => c.code === countryCode)?.format || "7777-7777"}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 outline-none transition-colors duration-200 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Contraseña</label>
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
                <label className="mb-2 block text-sm font-medium text-slate-300">Confirmar contraseña</label>
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
                {submitting ? "Registrando..." : "Crear cuenta"}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              ¿Ya tienes una cuenta?{" "}
              <button
                type="button"
                onClick={() => { window.location.hash = "#/login"; }}
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Inicia sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}