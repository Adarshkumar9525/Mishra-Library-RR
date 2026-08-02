const StatCard = ({ icon: Icon, label, value, accent = "primary", suffix = "" }) => {
  const accentMap = {
    primary: "bg-primary-50 text-primary-600",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
  };

  return (
    <div className="card p-5 flex items-center justify-between hover:shadow-card transition-shadow duration-200">
      <div>
        <p className="text-xs text-slate-400 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-800">
          {suffix}
          {value}
        </p>
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${accentMap[accent]}`}>
        <Icon size={22} />
      </div>
    </div>
  );
};

export default StatCard;
