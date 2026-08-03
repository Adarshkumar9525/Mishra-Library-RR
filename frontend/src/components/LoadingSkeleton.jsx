export const CardSkeleton = () => (
  <div className="card p-5 space-y-3 border border-slate-100 dark:border-slate-700">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <div className="skeleton h-3 w-20 rounded" />
        <div className="skeleton h-7 w-28 rounded" />
      </div>
      <div className="skeleton h-12 w-12 rounded-2xl" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-3">
    {/* Header row */}
    <div className="flex gap-4 pb-2 border-b border-slate-100 dark:border-slate-700">
      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} className="skeleton h-3 flex-1 rounded" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 py-1">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className={`skeleton h-4 flex-1 rounded ${c === 0 ? "max-w-[180px]" : ""}`} />
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    {Icon && (
      <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
        <Icon size={32} className="text-slate-400 dark:text-slate-500" />
      </div>
    )}
    <p className="text-slate-700 dark:text-slate-200 font-semibold text-base">{title}</p>
    {subtitle && <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5 max-w-xs">{subtitle}</p>}
  </div>
);
