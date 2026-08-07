import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function DashboardTemplate() {
  const { user, logout } = useContext(AuthContext);

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "DELIVERY":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
  };

  const menu = [
    "Dashboard",
    "Productos",
    "Ventas",
    "Clientes",
    "Usuarios",
    "Configuración",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">

      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r border-slate-800 bg-slate-900">

        <div className="px-8 py-7 border-b border-slate-800">

          <h1 className="text-3xl font-black text-emerald-500">
            Odyssey
          </h1>

          <p className="mt-1 text-sm text-slate-400">
            Sistema Administrativo
          </p>

        </div>

        <nav className="flex-1 px-5 py-6">

          <ul className="space-y-2">

            {menu.map((item, index) => (
              <li key={index}>

                <button
                  className={`w-full rounded-xl px-4 py-3 text-left transition-all duration-200
                  ${
                    index === 0
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item}
                </button>

              </li>
            ))}

          </ul>

        </nav>

        <div className="border-t border-slate-800 p-5">

          <button
            onClick={logout}
            className="w-full rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-red-400 transition-colors duration-200 hover:bg-red-500 hover:text-white"
          >
            Cerrar sesión
          </button>

        </div>

      </aside>

      {/* Contenido */}
      <div className="flex flex-1 flex-col">

        {/* Topbar */}
        <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md">

          <div className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">

            <div>

              <h2 className="text-3xl font-bold">
                Dashboard
              </h2>

              <p className="mt-1 text-slate-400">
                Bienvenido nuevamente, {user.fullName}
              </p>

            </div>

            <span
              className={`w-fit rounded-full border px-4 py-1 text-sm font-semibold ${getRoleBadgeColor(
                user.role
              )}`}
            >
              {user.role}
            </span>

          </div>

        </header>

        {/* Main */}
        <main className="flex-1 p-6">

          {/* Tarjetas */}
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">

              <p className="text-sm text-slate-400">
                Usuario
              </p>

              <h3 className="mt-3 text-2xl font-bold break-words">
                {user.fullName}
              </h3>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-500/5">

              <p className="text-sm text-slate-400">
                Correo
              </p>

              <h3 className="mt-3 break-all text-lg font-medium">
                {user.email}
              </h3>

            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/5">

              <p className="text-sm text-slate-400">
                Teléfono
              </p>

              <h3 className="mt-3 text-2xl font-bold">
                {user.phone}
              </h3>

            </div>

          </div>

          {/* Panel Principal */}
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-8">

            <h2 className="text-2xl font-bold">
              Panel Principal
            </h2>

            <p className="mt-2 text-slate-400">
              Este espacio está preparado para mostrar estadísticas,
              gráficos, ventas recientes, productos y cualquier otro
              módulo que agregues posteriormente.
            </p>

            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 transition-all duration-300 hover:border-emerald-500/40">
                <h4 className="font-bold">
                  Productos
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Aquí podrás administrar el catálogo.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 transition-all duration-300 hover:border-blue-500/40">
                <h4 className="font-bold">
                  Ventas
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Consulta las ventas realizadas.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 transition-all duration-300 hover:border-purple-500/40">
                <h4 className="font-bold">
                  Clientes
                </h4>

                <p className="mt-2 text-sm text-slate-400">
                  Gestiona la información de los clientes.
                </p>
              </div>

            </div>

          </div>

        </main>

      </div>

    </div>
  );
}