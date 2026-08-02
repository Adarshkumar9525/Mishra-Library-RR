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

const StatusBadge = ({ status }) => {
  const className = STYLE_MAP[status] || "badge-neutral";
  return <span className={className}>{status?.replace("-", " ")}</span>;
};

export default StatusBadge;
