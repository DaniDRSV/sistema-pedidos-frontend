export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirmar",
  variant = "danger", // 'danger' | 'success'
  loading = false,
}) {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      icon: (
        <svg
          className="h-6 w-6 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 8v4m0 4h.01M10.3 3.8 2.6 17a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3l-7.7-13.2a2 2 0 0 0-3.4 0Z" />
        </svg>
      ),
      iconBg: "bg-red-500/10 border-red-500/20",
      button: "bg-red-600 hover:bg-red-500 text-white",
    },
    success: {
      icon: (
        <svg
          className="h-6 w-6 text-emerald-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m5 12 4 4L19 6" />
        </svg>
      ),
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      button: "bg-emerald-600 hover:bg-emerald-500 text-white",
    },
  };

  const style = variantStyles[variant] || variantStyles.danger;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay con blur */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={loading ? undefined : onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md animate-fade-in rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-slate-950/50">
        <div className="flex items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${style.iconBg}`}
          >
            {style.icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-white">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold transition disabled:opacity-50 ${style.button}`}
          >
            {loading ? "Procesando..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
