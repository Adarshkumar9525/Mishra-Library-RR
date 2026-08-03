const StatCard = ({ icon: Icon, label, value, accent = "primary", suffix = "", trend = null }) => {
  const accentMap = {
    primary: {
      icon: "bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-primary-500/25",
      glow: "group-hover:shadow-primary-500/10",
      border: "hover:border-primary-100 dark:hover:border-primary-800",
    },
    emerald: {
      icon: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/25",
      glow: "group-hover:shadow-emerald-500/10",
      border: "hover:border-emerald-100 dark:hover:border-emerald-800",
    },
    amber: {
      icon: "bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-amber-500/25",
      glow: "group-hover:shadow-amber-500/10",
      border: "hover:border-amber-100 dark:hover:border-amber-800",
    },
    rose: {
      icon: "bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-500/25",
      glow: "group-hover:shadow-rose-500/10",
      border: "hover:border-rose-100 dark:hover:border-rose-800",
    },
  };

  const a = accentMap[accent] || accentMap.primary;

  return (
    <div
      className={`group card p-5 flex items-center justify-between hover:-translate-y-0.5 hover:shadow-elevated dark:hover:shadow-none cursor-default border border-slate-100 dark:border-slate-700 ${a.border}`}
    >
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-slate-400 font-medium mb-1 tracking-wide uppercase">{label}</p>
        <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight font-heading">
          {suffix}
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {trend !== null && (
          <p className={`text-xs mt-1 font-medium ${trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last month
          </p>
        )}
      </div>
      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${a.icon}`}>
        <Icon size={22} />
      </div>
    </div>
  );
};

export default StatCard;
