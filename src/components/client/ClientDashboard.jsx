import { useContext, useState } from "react";
import { AuthContext } from "../../context/AuthContext";

const categorias = ["Todos", "Periféricos", "Componentes", "Laptops", "Monitores", "Accesorios"];

// Reemplaza esto luego por datos reales de tu API de productos
const productosDestacados = [
  { id: 1, nombre: "Mouse Gamer RGB", precio: 24.99, categoria: "Periféricos" },
  { id: 2, nombre: "Teclado Mecánico", precio: 39.99, categoria: "Periféricos" },
  { id: 3, nombre: "Memoria RAM 16GB DDR4", precio: 45.5, categoria: "Componentes" },
  { id: 4, nombre: "Tarjeta Gráfica RTX 4060", precio: 349.99, categoria: "Componentes" },
  { id: 5, nombre: "Monitor 27'' 144Hz", precio: 219.99, categoria: "Monitores" },
  { id: 6, nombre: "Laptop Gamer 16GB/512GB", precio: 899.99, categoria: "Laptops" },
  { id: 7, nombre: "Audífonos Gamer", precio: 29.99, categoria: "Accesorios" },
  { id: 8, nombre: "SSD NVMe 1TB", precio: 65.0, categoria: "Componentes" },
];

export default function ClientDashboard({ onBack }) {
  const { user, logout } = useContext(AuthContext);
  const [busqueda, setBusqueda] = useState("");
  const [categoriaActiva, setCategoriaActiva] = useState("Todos");

  const productosFiltrados = productosDestacados.filter((p) => {
    const coincideCategoria =
      categoriaActiva === "Todos" || p.categoria === categoriaActiva;
    const coincideBusqueda = p.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Franja superior */}
      <div className="h-2 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700" />

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
          <h1 className="order-1 text-2xl font-black text-emerald-500">
            Odyssey
          </h1>

          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="order-2 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white md:order-1"
            >
              ← Panel administrativo
            </button>
          )}

          <div className="order-3 w-full md:order-2 md:flex-1">
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 transition-colors focus:border-emerald-500"
            />
          </div>

          <div className="order-2 ml-auto flex items-center gap-3 md:order-3">
            <span className="hidden text-sm text-slate-400 sm:block">
              Hola, {user?.fullName?.split(" ")[0]}
            </span>
            <button
              className="relative rounded-lg p-2 text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              aria-label="Carrito"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold">
                0
              </span>
            </button>
            <button
              onClick={logout}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-400 transition-colors hover:bg-red-500 hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>

        {/* Categorías */}
        <nav className="border-t border-slate-800 bg-slate-900/60">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 py-3">
            {categorias.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoriaActiva(cat)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                  categoriaActiva === cat
                    ? "bg-emerald-600 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-slate-900 p-10 md:p-16">
          <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-black/20 blur-3xl" />
          <div className="relative z-10 max-w-xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-emerald-200">
              Oferta del día
            </p>
            <h2 className="mt-3 text-4xl font-black leading-tight md:text-5xl">
              Haz tu pedido en minutos
            </h2>
            <p className="mt-4 text-emerald-100">
              Descubre los productos más pedidos y arma tu pedido con Odyssey.
            </p>
            <button className="mt-6 rounded-xl bg-white px-6 py-3 font-semibold text-emerald-700 transition-transform duration-200 hover:scale-105">
              Ver ofertas
            </button>
          </div>
        </div>

        {/* Banners secundarios */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {["Combos", "Bebidas", "Postres", "Novedades"].map((titulo) => (
            <button
              key={titulo}
              onClick={() =>
                setCategoriaActiva(titulo === "Novedades" ? "Todos" : titulo)
              }
              className="flex h-28 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-sm font-bold text-slate-300 transition-all duration-300 hover:border-emerald-500/40 hover:text-white"
            >
              {titulo}
            </button>
          ))}
        </div>

        {/* Productos */}
        <section className="mt-10">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-xl font-bold">Productos destacados</h3>
            <span className="text-sm text-slate-500">
              {productosFiltrados.length} resultados
            </span>
          </div>

          {productosFiltrados.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No encontramos productos con ese criterio.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {productosFiltrados.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-2xl border border-slate-800 bg-slate-900 p-4 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5"
                >
                  <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-slate-950 text-xs text-slate-600">
                    Imagen
                  </div>
                  <h4 className="font-semibold">{p.nombre}</h4>
                  <p className="mt-1 text-xs text-slate-500">{p.categoria}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold text-emerald-500">
                      ${p.precio.toFixed(2)}
                    </span>
                    <button className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-emerald-500">
                      Agregar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
