export const MetricCard = ({ label, value, icon: Icon, accent = 'text-blue-300' }) => (
  <div className="glass-panel p-5">
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-2 truncate text-3xl font-bold tracking-normal text-white">{value}</p>
      </div>
      {Icon ? (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/[0.08] ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
      ) : null}
    </div>
  </div>
);
