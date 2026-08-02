import { useEffect, useState } from "react";
import { MdGridView, MdViewList } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import { TableSkeleton } from "../components/LoadingSkeleton";

const STATUS_STYLES = {
  available: "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100",
  occupied: "bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100",
  reserved: "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100",
  maintenance: "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200",
};

const TIMINGS = [
  { key: "morning", label: "Morning" },
  { key: "afternoon", label: "Afternoon" },
  { key: "evening", label: "Evening" },
  { key: "night", label: "Night" },
];

const Seats = () => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [activeTiming, setActiveTiming] = useState("morning");
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedSeat, setSelectedSeat] = useState(null);

  const fetchSeats = async () => {
    setLoading(true);
    try {
      const res = await api.get("/seats");
      setSeats(res.data.data);
    } catch {
      toast.error("Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const loadSeats = async () => {
    await fetchSeats();
  };

  loadSeats();
}, []);

  // Status shown for a seat depends on the shift tab currently selected —
  // a seat booked for "morning" will correctly show "available" under "evening".
  const statusFor = (seat, timing) => seat.slots?.[timing]?.status || "available";
  const studentFor = (seat, timing) => seat.slots?.[timing]?.student;

  const visibleSeats = filterStatus
    ? seats.filter((s) => statusFor(s, activeTiming) === filterStatus)
    : seats;

  const counts = seats.reduce(
    (acc, s) => {
      const st = statusFor(s, activeTiming);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    { available: 0, occupied: 0, reserved: 0, maintenance: 0 }
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Seats</h1>
          <p className="text-sm text-slate-400">
            100 seats · each shift books independently — a morning admission leaves the same
            seat open for evening
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
  aria-label="grid-view"
  onClick={() => setView("grid")}
  className={`p-2 rounded-lg ${
    view === "grid"
      ? "bg-primary-100 text-primary-700"
      : "bg-white text-slate-400 border border-slate-200"
  }`}
>
            <MdGridView size={18} />
          </button>
          <button
  aria-label="table-view"
  onClick={() => setView("table")}
  className={`p-2 rounded-lg ${
    view === "table"
      ? "bg-primary-100 text-primary-700"
      : "bg-white text-slate-400 border border-slate-200"
  }`}
>
            <MdViewList size={18} />
          </button>
        </div>
      </div>

      {/* Shift tabs - this is the "timing wise seats" view */}
      <div className="flex gap-2 border-b border-slate-100">
        {TIMINGS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTiming(t.key);
              setFilterStatus("");
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
              activeTiming === t.key
                ? "border-primary-600 text-primary-700"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        {["available", "occupied", "reserved", "maintenance"].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border capitalize transition ${
              filterStatus === s ? "border-primary-400 bg-primary-50 text-primary-700" : "border-slate-200 bg-white text-slate-500"
            }`}
          >
            {s} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="card p-5">
        {loading ? (
          <TableSkeleton rows={8} cols={10} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
            {visibleSeats.map((seat) => {
              const status = statusFor(seat, activeTiming);
              return (
                <button
                  key={seat._id}
                  onClick={() => setSelectedSeat(seat)}
                  className={`aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-semibold transition-colors ${STATUS_STYLES[status]}`}
                >
                  <span className="text-sm">{seat.seatNumber}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-medium">Seat</th>
                  <th className="pb-3 font-medium">Status ({activeTiming})</th>
                  <th className="pb-3 font-medium">Student ({activeTiming})</th>
                  <th className="pb-3 font-medium">Other shifts on this seat</th>
                </tr>
              </thead>
              <tbody>
                {visibleSeats.map((seat) => {
                  const student = studentFor(seat, activeTiming);
                  const others = TIMINGS.filter((t) => t.key !== activeTiming)
                    .map((t) => `${t.label}: ${statusFor(seat, t.key)}`)
                    .join(" · ");
                  return (
                    <tr key={seat._id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-medium text-slate-700">#{seat.seatNumber}</td>
                      <td className="py-2.5 capitalize text-slate-500">{statusFor(seat, activeTiming)}</td>
                      <td className="py-2.5 text-slate-500">{student?.name || "—"}</td>
                      <td className="py-2.5 text-slate-400 text-xs">{others}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedSeat && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
          onClick={() => setSelectedSeat(null)}
        >
          <div className="bg-white rounded-xl2 shadow-card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-slate-800 mb-1">Seat #{selectedSeat.seatNumber}</h3>
            <p className="text-xs text-slate-400 mb-4">Shift-wise breakdown for this seat</p>
            <div className="space-y-3 text-sm">
              {TIMINGS.map((t) => {
                const status = statusFor(selectedSeat, t.key);
                const student = studentFor(selectedSeat, t.key);
                return (
                  <div key={t.key} className="flex items-center justify-between border-b border-slate-50 pb-2 last:border-0">
                    <div>
                      <p className="font-medium text-slate-700">{t.label}</p>
                      <p className="text-xs text-slate-400">{student?.name || "Vacant"}</p>
                    </div>
                    <span className={`badge ${
                      status === "available" ? "badge-success" : status === "occupied" ? "badge-danger" : "badge-warning"
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSelectedSeat(null)} className="btn-secondary w-full mt-5">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seats;
