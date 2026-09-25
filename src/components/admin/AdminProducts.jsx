import { useState, useEffect, useMemo } from "react";
import api from "../../services/api";
import AdminCategories from "./AdminCategories";
import ImageInput from "./ImageInput";
import ImageThumbnail from "./ImageThumbnail";
import ConfirmModal from "./ConfirmModal";

export default function AdminProducts() {
    const [activeTab, setActiveTab] = useState("products");

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        categoryId: "",
        sku: "",
        name: "",
        description: "",
        price: "",
        stock: "",
        imageUrl: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Estados para filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("all"); // 'all' | 'active' | 'inactive'

    // Estados para el modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        product: null,
        action: null,
        loading: false,
    });

    // Carga inicial y cambio de pestaña de forma limpia
    useEffect(() => {
        let isMounted = true;

        if (activeTab === "products") {
            const loadInitialData = async () => {
                try {
                    const [productsRes, categoriesRes] = await Promise.all([
                        api.get("/products?isActive=all"),
                        api.get("/categories?isActive=all"),
                    ]);

                    if (isMounted) {
                        setProducts(productsRes.data);
                        setCategories(categoriesRes.data);
                    }
                } catch (err) {
                    if (isMounted) {
                        console.error(err);
                        setError("Error al cargar la información.");
                    }
                } finally {
                    if (isMounted) {
                        setLoading(false);
                    }
                }
            };

            loadInitialData();
        }

        return () => {
            isMounted = false;
        };
    }, [activeTab]);

    // Función reutilizable para refrescar productos en submits / toggles
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get("/products?isActive=all");
            setProducts(response.data);
        } catch (err) {
            setError("Error al cargar productos.", err);
        } finally {
            setLoading(false);
        }
    };

    // ==========================================
    // FILTRADO DE PRODUCTOS (Client-side)
    // ==========================================
    const filteredProducts = useMemo(() => {
        return products.filter((prod) => {
            // 1. Filtro por término de búsqueda (nombre o SKU)
            const term = searchTerm.trim().toLowerCase();
            const matchesSearch =
                term === "" ||
                prod.name?.toLowerCase().includes(term) ||
                prod.sku?.toLowerCase().includes(term) ||
                prod.description?.toLowerCase().includes(term);

            // 2. Filtro por categoría
            const matchesCategory =
                filterCategory === "" || prod.categoryId === parseInt(filterCategory);

            // 3. Filtro por estado
            let matchesStatus = true;
            if (filterStatus === "active") matchesStatus = prod.isActive === true;
            if (filterStatus === "inactive") matchesStatus = prod.isActive === false;

            return matchesSearch && matchesCategory && matchesStatus;
        });
    }, [products, searchTerm, filterCategory, filterStatus]);

    // ==========================================
    // HANDLERS
    // ==========================================
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            const payload = {
                ...formData,
                categoryId: parseInt(formData.categoryId),
                price: parseFloat(formData.price),
                stock: parseInt(formData.stock) || 0,
            };

            if (editingId) {
                await api.put(`/products/${editingId}`, payload);
            } else {
                await api.post("/products", payload);
            }

            setFormData({
                categoryId: "",
                sku: "",
                name: "",
                description: "",
                price: "",
                stock: "",
                imageUrl: "",
            });
            setEditingId(null);
            fetchProducts();
        } catch (err) {
            setError(err.response?.data?.error || "Error al guardar el producto.");
        }
    };

    const handleEdit = (product) => {
        setFormData({
            categoryId: product.categoryId,
            sku: product.sku,
            name: product.name,
            description: product.description || "",
            price: product.price,
            stock: product.stock,
            imageUrl: product.imageUrl || "",
        });
        setEditingId(product.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openConfirmModal = (product) => {
        setConfirmModal({
            isOpen: true,
            product,
            action: product.isActive ? "deactivate" : "activate",
            loading: false,
        });
    };

    const handleConfirmToggle = async () => {
        const { product, action } = confirmModal;
        if (!product) return;

        try {
            setConfirmModal((prev) => ({ ...prev, loading: true }));
            const newStatus = action === "activate";
            await api.put(`/products/${product.id}`, { isActive: newStatus });
            setConfirmModal({
                isOpen: false,
                product: null,
                action: null,
                loading: false,
            });
            fetchProducts();
        } catch (err) {
            setConfirmModal((prev) => ({ ...prev, loading: false }));
            alert(
                "Error al cambiar el estado del producto",
                err.response?.data?.error || "",
            );
        }
    };

    const closeConfirmModal = () => {
        if (confirmModal.loading) return;
        setConfirmModal({
            isOpen: false,
            product: null,
            action: null,
            loading: false,
        });
    };

    const clearFilters = () => {
        setSearchTerm("");
        setFilterCategory("");
        setFilterStatus("all");
    };

    const hasActiveFilters =
        searchTerm !== "" || filterCategory !== "" || filterStatus !== "all";

    const getModalConfig = () => {
        const { product, action } = confirmModal;
        if (!product)
            return { title: "", message: "", confirmText: "", variant: "danger" };

        if (action === "activate") {
            return {
                title: "¿Activar producto?",
                message: `El producto "${product.name}" volverá a estar visible en el catálogo y disponible para la venta.`,
                confirmText: "Sí, activar",
                variant: "success",
            };
        }
        return {
            title: "¿Desactivar producto?",
            message: `El producto "${product.name}" dejará de mostrarse en el catálogo. Los clientes no podrán verlo ni agregarlo a sus pedidos. Podrás reactivarlo cuando quieras.`,
            confirmText: "Sí, desactivar",
            variant: "danger",
        };
    };

    const modalConfig = getModalConfig();

    return (
        <div className="animate-fade-in">
            {/* Submenú */}
            <div className="mb-8 flex gap-6 border-b border-slate-800">
                <button
                    onClick={() => setActiveTab("products")}
                    className={`pb-4 text-sm font-bold transition-colors ${activeTab === "products"
                            ? "border-b-2 border-emerald-500 text-emerald-400"
                            : "text-slate-400 hover:text-white"
                        }`}
                >
                    Productos
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={`pb-4 text-sm font-bold transition-colors ${activeTab === "categories"
                            ? "border-b-2 border-emerald-500 text-emerald-400"
                            : "text-slate-400 hover:text-white"
                        }`}
                >
                    Categorías
                </button>
            </div>

            {activeTab === "products" ? (
                <>
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-white">
                            Gestión de Productos
                        </h2>
                        <p className="text-sm text-slate-400">
                            Administra el catálogo y el inventario
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Formulario */}
                    <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">
                        <h3 className="mb-4 text-lg font-bold">
                            {editingId ? "Editar Producto" : "Nuevo Producto"}
                        </h3>
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        >
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                required
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            >
                                <option value="">Seleccione Categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                name="sku"
                                placeholder="SKU"
                                value={formData.sku}
                                onChange={handleChange}
                                required
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            />
                            <input
                                type="text"
                                name="name"
                                placeholder="Nombre del producto"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            />
                            <input
                                type="number"
                                step="0.01"
                                name="price"
                                placeholder="Precio"
                                value={formData.price}
                                onChange={handleChange}
                                required
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            />
                            <input
                                type="number"
                                name="stock"
                                placeholder="Stock"
                                value={formData.stock}
                                onChange={handleChange}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            />

                            <div className="sm:col-span-2 lg:col-span-3">
                                <ImageInput
                                    name="imageUrl"
                                    value={formData.imageUrl}
                                    onChange={handleChange}
                                />
                            </div>

                            <input
                                type="text"
                                name="description"
                                placeholder="Descripción"
                                value={formData.description}
                                onChange={handleChange}
                                className="sm:col-span-2 lg:col-span-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            />

                            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
                                <button
                                    type="submit"
                                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
                                >
                                    {editingId ? "Actualizar Producto" : "Crear Producto"}
                                </button>
                                {editingId && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditingId(null);
                                            setFormData({
                                                categoryId: "",
                                                sku: "",
                                                name: "",
                                                description: "",
                                                price: "",
                                                stock: "",
                                                imageUrl: "",
                                            });
                                        }}
                                        className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
                                    >
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* ========================================== */}
                    {/* BARRA DE BÚSQUEDA Y FILTROS                 */}
                    {/* ========================================== */}
                    <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            {/* Buscador */}
                            <div className="relative sm:col-span-2">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <svg
                                        className="h-4 w-4 text-slate-500"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <circle cx="11" cy="11" r="8" />
                                        <path d="m21 21-4.35-4.35" />
                                    </svg>
                                </div>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por nombre, SKU o descripción..."
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                                />
                            </div>

                            {/* Filtro por Categoría */}
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            >
                                <option value="">Todas las categorías</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            {/* Filtro por Estado */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                            >
                                <option value="all">Todos los estados</option>
                                <option value="active">Solo activos</option>
                                <option value="inactive">Solo inactivos</option>
                            </select>
                        </div>

                        {/* Info de resultados y botón de limpiar */}
                        <div className="mt-3 flex items-center justify-between">
                            <p className="text-xs text-slate-400">
                                Mostrando{" "}
                                <span className="font-bold text-emerald-400">
                                    {filteredProducts.length}
                                </span>{" "}
                                de{" "}
                                <span className="font-bold text-white">{products.length}</span>{" "}
                                productos
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-slate-400 transition hover:bg-slate-800 hover:text-white"
                                >
                                    <svg
                                        className="h-3.5 w-3.5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M18 6 6 18M6 6l12 12" />
                                    </svg>
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                        {loading ? (
                            <p className="p-8 text-center text-slate-400">
                                Cargando productos...
                            </p>
                        ) : products.length === 0 ? (
                            <p className="p-8 text-center text-slate-400">
                                No hay productos registrados.
                            </p>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-12 text-center">
                                <svg
                                    className="mx-auto h-12 w-12 text-slate-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.35-4.35" />
                                </svg>
                                <p className="mt-4 font-bold text-slate-400">Sin resultados</p>
                                <p className="mt-1 text-sm text-slate-500">
                                    No se encontraron productos con esos criterios de búsqueda.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-emerald-500"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-400">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Imagen</th>
                                            <th className="px-6 py-4 font-bold">SKU</th>
                                            <th className="px-6 py-4 font-bold">Nombre</th>
                                            <th className="px-6 py-4 font-bold">Descripción</th>
                                            <th className="px-6 py-4 font-bold">Precio</th>
                                            <th className="px-6 py-4 font-bold">Stock</th>
                                            <th className="px-6 py-4 font-bold">Estado</th>
                                            <th className="px-6 py-4 font-bold text-right">
                                                Acciones
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {filteredProducts.map((prod) => (
                                            <tr
                                                key={prod.id}
                                                className="transition hover:bg-slate-800/50"
                                            >
                                                <td className="px-6 py-4">
                                                    <ImageThumbnail src={prod.imageUrl} alt={prod.name} />
                                                </td>
                                                <td className="px-6 py-4 font-mono text-slate-400">
                                                    {prod.sku}
                                                </td>
                                                <td className="px-6 py-4 font-bold text-white">
                                                    {prod.name}
                                                </td>
                                                <td className="px-6 py-4 max-w-xs">
                                                    <p
                                                        className="truncate text-sm text-slate-400"
                                                        title={prod.description || "Sin descripción"}
                                                    >
                                                        {prod.description || "—"}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-emerald-400 font-bold">
                                                    ${prod.price.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-slate-300">
                                                    {prod.stock}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${prod.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                                                    >
                                                        {prod.isActive ? "Activo" : "Inactivo"}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleEdit(prod)}
                                                        className="mr-3 text-xs font-bold text-sky-400 hover:text-sky-300"
                                                    >
                                                        Editar
                                                    </button>

                                                    {prod.isActive ? (
                                                        <button
                                                            onClick={() => openConfirmModal(prod)}
                                                            className="text-xs font-bold text-red-400 hover:text-red-300"
                                                        >
                                                            Desactivar
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => openConfirmModal(prod)}
                                                            className="text-xs font-bold text-emerald-400 hover:text-emerald-300"
                                                        >
                                                            Activar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <AdminCategories />
            )}

            {/* Modal de Confirmación */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={handleConfirmToggle}
                title={modalConfig.title}
                message={modalConfig.message}
                confirmText={modalConfig.confirmText}
                variant={modalConfig.variant}
                loading={confirmModal.loading}
            />
        </div>
    );
}
