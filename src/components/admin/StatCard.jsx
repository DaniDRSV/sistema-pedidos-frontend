const colors = {
  emerald: "bg-emerald-400 text-emerald-300",
  sky: "bg-sky-400 text-sky-300",
  violet: "bg-violet-400 text-violet-300",
  amber: "bg-amber-400 text-amber-300",
  blue: "bg-blue-400 text-blue-300",
};

export default function StatCard({ label, value, detail, color = "emerald" }) {
  const [bar, text] = colors[color].split(" ");
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <div className={`h-1.5 w-11 rounded-full ${bar}`} />
      <p className="mt-4 text-sm font-medium text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-black ${text}`}>{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-500">{detail}</p>}
    </article>
  );
}
