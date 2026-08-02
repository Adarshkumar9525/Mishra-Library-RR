export const CardSkeleton = () => (
  <div className="card p-5 space-y-3">
    <div className="skeleton h-4 w-24" />
    <div className="skeleton h-8 w-32" />
  </div>
);

export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-3">
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    {Icon && <Icon size={48} className="text-slate-300 mb-3" />}
    <p className="text-slate-600 font-medium">{title}</p>
    {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
  </div>
);
