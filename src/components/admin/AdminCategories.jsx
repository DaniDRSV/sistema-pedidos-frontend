import { useState, useEffect } from "react";
import api from "../../services/api";
import ImageInput from "./ImageInput";
import ImageThumbnail from "./ImageThumbnail";
import ConfirmModal from "./ConfirmModal";

export default function AdminCategories() {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        imageUrl: "",
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Estados para el modal
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        category: null,
        action: null,
        loading: false,
    });

    // Función reutilizable para refrescar datos desde eventos/handlers
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get("/categories?isActive=all");
            setCategories(response.data);
        } catch (err) {
            console.error(err);
            setError("Error al cargar las categorías.");
        } finally {
            setLoading(false);
        }
    };

    // Carga inicial al montar el componente
    useEffect(() => {
        let isMounted = true;

        const loadInitialData = async () => {
            try {
                const response = await api.get("/categories?isActive=all");
                if (isMounted) {
                    setCategories(response.data);
                }
            } catch (err) {
                if (isMounted) {
                    console.error(err);
                    setError("Error al cargar las categorías.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            if (editingId) {
                await api.put(`/categories/${editingId}`, formData);
            } else {
                await api.post("/categories", formData);
            }
            setFormData({ name: "", description: "", imageUrl: "" });
            setEditingId(null);
            fetchCategories();
        } catch (err) {
            setError(err.response?.data?.error || "Error al guardar la categoría.");
        }
    };

    const handleEdit = (category) => {
        setFormData({
            name: category.name,
            description: category.description || "",
            imageUrl: category.imageUrl || "",
        });
        setEditingId(category.id);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const openConfirmModal = (category) => {
        setConfirmModal({
            isOpen: true,
            category,
            action: category.isActive ? "deactivate" : "activate",
            loading: false,
        });
    };

    const handleConfirmToggle = async () => {
        const { category, action } = confirmModal;
        if (!category) return;

        try {
            setConfirmModal((prev) => ({ ...prev, loading: true }));

            const newStatus = action === "activate";
            await api.put(`/categories/${category.id}`, { isActive: newStatus });

            setConfirmModal({
                isOpen: false,
                category: null,
                action: null,
                loading: false,
            });
            fetchCategories();
        } catch (err) {
            setConfirmModal((prev) => ({ ...prev, loading: false }));
            alert(
                "Error al cambiar el estado de la categoría",
                err.response?.data?.error || "",
            );
        }
    };

    const closeConfirmModal = () => {
        if (confirmModal.loading) return;
        setConfirmModal({
            isOpen: false,
            category: null,
            action: null,
            loading: false,
        });
    };

    const getModalConfig = () => {
        const { category, action } = confirmModal;
        if (!category)
            return { title: "", message: "", confirmText: "", variant: "danger" };

        if (action === "activate") {
            return {
                title: "¿Activar categoría?",
                message: `La categoría "${category.name}" volverá a estar visible y sus productos asociados podrán mostrarse nuevamente en el catálogo.`,
                confirmText: "Sí, activar",
                variant: "success",
            };
        }
        return {
            title: "¿Desactivar categoría?",
            message: `La categoría "${category.name}" dejará de mostrarse. Ten en cuenta que los productos asociados a esta categoría podrían no aparecer correctamente en el catálogo. Podrás reactivarla cuando quieras.`,
            confirmText: "Sí, desactivar",
            variant: "danger",
        };
    };

    const modalConfig = getModalConfig();

    return (
        <div className="animate-fade-in">
            <div className="mb-6">
                <h3 className="text-xl font-bold text-white">Gestión de Categorías</h3>
                <p className="text-sm text-slate-400">
                    Administra las categorías de tus productos
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
                    {editingId ? "Editar Categoría" : "Nueva Categoría"}
                </h3>
                <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
                    <input
                        type="text"
                        name="name"
                        placeholder="Nombre de la categoría"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Descripción"
                        value={formData.description}
                        onChange={handleChange}
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500"
                    />

                    <div className="sm:col-span-2">
                        <ImageInput
                            name="imageUrl"
                            value={formData.imageUrl}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="sm:col-span-2 flex gap-3">
                        <button
                            type="submit"
                            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500"
                        >
                            {editingId ? "Actualizar Categoría" : "Crear Categoría"}
                        </button>
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingId(null);
                                    setFormData({ name: "", description: "", imageUrl: "" });
                                }}
                                className="rounded-xl border border-slate-700 px-6 py-2.5 text-sm font-bold text-slate-300 hover:bg-slate-800"
                            >
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Tabla */}
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
                {loading ? (
                    <p className="p-8 text-center text-slate-400">
                        Cargando categorías...
                    </p>
                ) : categories.length === 0 ? (
                    <p className="p-8 text-center text-slate-400">
                        No hay categorías registradas.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b border-slate-800 bg-slate-950/50 text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Imagen</th>
                                    <th className="px-6 py-4 font-bold">ID</th>
                                    <th className="px-6 py-4 font-bold">Nombre</th>
                                    <th className="px-6 py-4 font-bold">Descripción</th>
                                    <th className="px-6 py-4 font-bold">Estado</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {categories.map((cat) => (
                                    <tr key={cat.id} className="transition hover:bg-slate-800/50">
                                        <td className="px-6 py-4">
                                            <ImageThumbnail src={cat.imageUrl} alt={cat.name} />
                                        </td>
                                        <td className="px-6 py-4 font-mono text-slate-400">
                                            {cat.id}
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {cat.name}
                                        </td>
                                        <td className="px-6 py-4 max-w-xs">
                                            <p
                                                className="truncate text-sm text-slate-400"
                                                title={cat.description || "Sin descripción"}
                                            >
                                                {cat.description || "—"}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cat.isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}
                                            >
                                                {cat.isActive ? "Activa" : "Inactiva"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right whitespace-nowrap">
                                            <button
                                                onClick={() => handleEdit(cat)}
                                                className="mr-3 text-xs font-bold text-sky-400 hover:text-sky-300"
                                            >
                                                Editar
                                            </button>

                                            {cat.isActive ? (
                                                <button
                                                    onClick={() => openConfirmModal(cat)}
                                                    className="text-xs font-bold text-red-400 hover:text-red-300"
                                                >
                                                    Desactivar
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => openConfirmModal(cat)}
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
