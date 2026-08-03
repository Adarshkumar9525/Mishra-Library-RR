const STYLE_MAP = {
  active: "badge-success",
  paid: "badge-success",
  available: "badge-success",
  occupied: "badge-danger",
  expired: "badge-danger",
  due: "badge-warning",
  partial: "badge-warning",
  "expiring-soon": "badge-warning",
  reserved: "badge-neutral",
  maintenance: "badge-neutral",
  inactive: "badge-neutral",
};

const DOT_MAP = {
  active: "bg-emerald-500",
  paid: "bg-emerald-500",
  available: "bg-emerald-500",
  occupied: "bg-rose-500",
  expired: "bg-rose-500",
  due: "bg-amber-500",
  partial: "bg-amber-500",
  "expiring-soon": "bg-amber-500",
  reserved: "bg-slate-400",
  maintenance: "bg-slate-400",
  inactive: "bg-slate-400",
};

const StatusBadge = ({ status }) => {
  const className = STYLE_MAP[status] || "badge-neutral";
  const dotColor = DOT_MAP[status] || "bg-slate-400";
  return (
    <span className={`capitalize ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor} inline-block shrink-0`} />
      {status?.replace("-", " ")}
    </span>
  );
};

export default StatusBadge;
