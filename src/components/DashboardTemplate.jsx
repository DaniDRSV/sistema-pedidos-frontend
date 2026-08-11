import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const routes = {
  dashboard: "#/dashboard",
  clients: "#/clientes",
  delivery: "#/repartidores",
};

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    dashboard: <path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" />,
    products: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v9m8-4.5-8 4.5-8-4.5M8 5.25l8 4.5" />,
    sales: <path d="M5 3h14v18H5V3Zm3 4h8M8 11h8M8 15h4" />,
    clients: <><circle cx="9" cy="8" r="3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 1 0-1.1-5.8M17 14.5a4.8 4.8 0 0 1 3.5 4.5" /></>,
    delivery: <><path d="M3 7h11v10H3V7Zm11 4h3l3 3v3h-6v-6Z" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
    users: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.08A1.7 1.7 0 0 0 10.66 18.66a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.04h-.08v-3h.08A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34 1.7 1.7 0 0 0 1.04-1.56v-.08h3v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9.92c.2.65.8 1.04 1.48 1.04h.08v3h-.08c-.68 0-1.28.4-1.48 1.04Z" /></>,
  };

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
      {paths[name]}
    </svg>
  );
}

export default function DashboardTemplate({ currentRoute, onNavigate }) {
  const { user, logout } = useContext(AuthContext);
  const role = (user.role || user.rol || "ADMIN").toUpperCase();
  const firstName = user.fullName?.split(" ")[0] || "Administrador";

  const menu = [
    { label: "Dashboard", icon: "dashboard", route: routes.dashboard },
    { label: "Productos", icon: "products" },
    { label: "Ventas", icon: "sales" },
    { label: "Clientes", icon: "clients", route: routes.clients },
    { label: "Repartidores", icon: "delivery", route: routes.delivery },
    { label: "Usuarios", icon: "users" },
    { label: "Configuración", icon: "settings" },
  ];

  const modules = [
    {
      title: "Productos",
      description: "Administra el catálogo y la disponibilidad de tus productos.",
      icon: "products",
      accent: "text-emerald-300 bg-emerald-400/10 border-emerald-400/15",
    },
    {
      title: "Ventas",
      description: "Revisa las ventas realizadas y el rendimiento del negocio.",
      icon: "sales",
      accent: "text-sky-300 bg-sky-400/10 border-sky-400/15",
    },
    {
      title: "Clientes",
      description: "Consulta la experiencia disponible para tus clientes.",
      icon: "clients",
      route: routes.clients,
      accent: "text-violet-300 bg-violet-400/10 border-violet-400/15",
    },
    {
      title: "Repartidores",
      description: "Consulta la jornada y las entregas de los repartidores.",
      icon: "delivery",
      route: routes.delivery,
      accent: "text-amber-300 bg-amber-400/10 border-amber-400/15",
    },
  ];

  const goTo = (route) => {
    if (route) onNavigate(route);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />
        <div className="absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-teal-500/5 blur-3xl" />
      </div>

      <aside className="fixed inset-y-0 left-0 z-20 hidden h-screen w-72 flex-col overflow-hidden border-r border-white/10 bg-slate-900/90 lg:flex">
        <div className="border-b border-white/10 px-7 py-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-lg font-black text-white shadow-lg shadow-emerald-900/40">
              O
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Odyssey</h1>
              <p className="text-xs font-medium text-emerald-300">Sistema administrativo</p>
            </div>
          </div>
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-4 py-6" aria-label="Menú principal">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Navegación
          </p>
          <ul className="space-y-1.5">
            {menu.map((item) => {
              const isActive = currentRoute === item.route;

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => goTo(item.route)}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40"
                        : "text-slate-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon name={item.icon} className="h-[18px] w-[18px] shrink-0" />
                    {item.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center justify-center rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="lg:ml-72">
        <header className="border-b border-white/10 bg-slate-950/70 px-5 py-4 backdrop-blur-xl md:px-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="flex items-center gap-3 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-black text-white">O</div>
              <p className="text-lg font-black">Odyssey</p>
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-medium text-slate-400">Panel administrativo</p>
              <p className="mt-0.5 text-xs text-emerald-400">Todo el control, en un solo lugar.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-white">{user.fullName}</p>
                <p className="text-xs text-slate-500">{user.email}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-sm font-black text-emerald-300">
                {firstName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-5 py-7 md:px-8 md:py-10 lg:px-10">
          <nav className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden" aria-label="Accesos rápidos">
            {menu.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => goTo(item.route)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  currentRoute === item.route
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 text-slate-400 hover:text-white"
                }`}
              >
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <section className="relative overflow-hidden rounded-3xl border border-emerald-400/20 bg-gradient-to-br from-emerald-700 via-emerald-600 to-slate-900 p-7 shadow-2xl shadow-emerald-950/30 md:p-10">
            <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-slate-950/25 blur-3xl" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-100">Resumen general</p>
                <h2 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
                  Hola, {firstName} <span aria-hidden="true">👋</span>
                </h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50 md:text-base">
                  Bienvenido al centro de control de Odyssey. Gestiona tus operaciones desde un espacio claro y organizado.
                </p>
              </div>
              <div className="w-fit rounded-2xl border border-white/20 bg-slate-950/20 px-5 py-4 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Rol actual</p>
                <p className="mt-1 text-lg font-black text-white">{role}</p>
              </div>
            </div>
          </section>

          <section className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Usuario", value: user.fullName, detail: "Sesión actualmente activa", color: "emerald" },
              { label: "Correo", value: user.email, detail: "Cuenta de acceso", color: "sky" },
              { label: "Teléfono", value: user.phone || "No registrado", detail: "Información de contacto", color: "violet" },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 shadow-lg shadow-slate-950/20 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
                <div className={`h-1.5 w-11 rounded-full ${item.color === "emerald" ? "bg-emerald-400" : item.color === "sky" ? "bg-sky-400" : "bg-violet-400"}`} />
                <p className="mt-4 text-sm font-medium text-slate-400">{item.label}</p>
                <p className="mt-1 truncate text-lg font-bold text-white">{item.value}</p>
                <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
              </article>
            ))}
          </section>

          <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-slate-950/20 backdrop-blur-sm md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-400">Módulos</p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-white">Accesos rápidos</h3>
                <p className="mt-2 text-sm text-slate-400">Elige el área que deseas consultar o administrar.</p>
              </div>
            </div>

            <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {modules.map((module) => (
                <button
                  key={module.title}
                  type="button"
                  onClick={() => goTo(module.route)}
                  className="group rounded-2xl border border-white/10 bg-slate-950/60 p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${module.accent}`}>
                    <Icon name={module.icon} />
                  </div>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <h4 className="font-bold text-white">{module.title}</h4>
                    <span className="text-lg text-slate-500 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-emerald-300">→</span>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-400">{module.description}</p>
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
