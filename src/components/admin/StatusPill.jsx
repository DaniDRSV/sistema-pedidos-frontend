export default function StatusPill({ active, activeText = "Activo", inactiveText = "Inactivo" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
          : "border-red-500/20 bg-red-500/10 text-red-400"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? activeText : inactiveText}
    </span>
  );
}
