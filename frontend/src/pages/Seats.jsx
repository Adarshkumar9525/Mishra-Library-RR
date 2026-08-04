import { useEffect, useState, useMemo, useCallback } from "react";
import { MdGridView, MdViewList, MdEventSeat } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import { TableSkeleton } from "../components/LoadingSkeleton";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const STATUS_STYLES = {
  available: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 hover:border-emerald-300 dark:hover:border-emerald-700",
  occupied: "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 hover:border-rose-300 dark:hover:border-rose-700",
  reserved: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/60 hover:border-amber-300 dark:hover:border-amber-700",
  maintenance: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
};

const STATUS_BADGE = {
  available: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  occupied: "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  reserved: "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  maintenance: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700",
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
  useBodyScrollLock(Boolean(selectedSeat));

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
    fetchSeats();
  }, []);

  const statusFor = useCallback((seat, timing) => seat.slots?.[timing]?.status || "available", []);
  const studentFor = useCallback((seat, timing) => seat.slots?.[timing]?.student, []);

  const visibleSeats = useMemo(
    () => (filterStatus ? seats.filter((s) => statusFor(s, activeTiming) === filterStatus) : seats),
    [filterStatus, seats, activeTiming, statusFor]
  );

  const counts = useMemo(
    () =>
      seats.reduce(
        (acc, s) => {
          const st = statusFor(s, activeTiming);
          acc[st] = (acc[st] || 0) + 1;
          return acc;
        },
        { available: 0, occupied: 0, reserved: 0, maintenance: 0 }
      ),
    [seats, activeTiming, statusFor]
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Facility</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">Seats</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            100 seats · each shift books independently
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="grid-view"
            onClick={() => setView("grid")}
            className={`p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
              view === "grid"
                ? "bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <MdGridView size={18} />
          </button>
          <button
            aria-label="table-view"
            onClick={() => setView("table")}
            className={`p-2.5 rounded-xl transition-all min-h-[44px] min-w-[44px] flex items-center justify-center ${
              view === "table"
                ? "bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800"
                : "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <MdViewList size={18} />
          </button>
        </div>
      </div>

      {/* Shift Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl w-full sm:w-fit overflow-x-auto">
        {TIMINGS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTiming(t.key);
              setFilterStatus("");
            }}
            className={`px-4 py-2.5 text-sm font-semibold rounded-lg transition-all flex-1 sm:flex-none text-center min-h-[40px] ${
              activeTiming === t.key
                ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "available", color: "emerald" },
          { key: "occupied", color: "rose" },
          { key: "reserved", color: "amber" },
          { key: "maintenance", color: "slate" },
        ].map(({ key }) => (
          <button
            key={key}
            onClick={() => setFilterStatus(filterStatus === key ? "" : key)}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold border capitalize transition-all min-h-[40px] ${
              filterStatus === key
                ? `${STATUS_BADGE[key]} border`
                : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${
              key === "available" ? "bg-emerald-500" :
              key === "occupied" ? "bg-rose-500" :
              key === "reserved" ? "bg-amber-500" : "bg-slate-400"
            }`} />
            {key}
            <span className="font-bold">{counts[key] || 0}</span>
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="card p-4 sm:p-5 border border-slate-100 dark:border-slate-700">
        {loading ? (
          <TableSkeleton rows={8} cols={10} />
        ) : view === "grid" ? (
          <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 gap-2 sm:gap-2.5">
            {visibleSeats.map((seat) => {
              const status = statusFor(seat, activeTiming);
              return (
                <button
                  key={seat._id}
                  onClick={() => setSelectedSeat(seat)}
                  className={`aspect-square min-h-[44px] min-w-[44px] rounded-xl border-2 flex flex-col items-center justify-center text-xs font-bold transition-all duration-150 active:scale-95 ${STATUS_STYLES[status]}`}
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
                <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                  <th className="pb-3 font-medium">Seat</th>
                  <th className="pb-3 font-medium">Status ({activeTiming})</th>
                  <th className="pb-3 font-medium">Student ({activeTiming})</th>
                  <th className="pb-3 font-medium hidden md:table-cell">Other shifts</th>
                </tr>
              </thead>
              <tbody>
                {visibleSeats.map((seat) => {
                  const status = statusFor(seat, activeTiming);
                  const student = studentFor(seat, activeTiming);
                  const others = TIMINGS.filter((t) => t.key !== activeTiming)
                    .map((t) => `${t.label}: ${statusFor(seat, t.key)}`)
                    .join(" · ");
                  return (
                    <tr key={seat._id} className="border-b border-slate-50 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50">
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-200">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold">
                          #{seat.seatNumber}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[status]}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300 font-medium">{student?.name || "—"}</td>
                      <td className="py-3 text-slate-400 dark:text-slate-500 text-xs hidden md:table-cell">{others}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Seat Detail Modal */}
      {selectedSeat && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-sm z-40 flex items-center justify-center p-3 sm:p-4 overflow-hidden"
          onClick={() => setSelectedSeat(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none w-full max-w-sm overflow-y-auto border border-slate-100 dark:border-slate-700"
            style={{ maxHeight: "min(90vh, 90dvh)", WebkitOverflowScrolling: "touch" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center shrink-0">
                <MdEventSeat size={22} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 font-heading text-base">Seat #{selectedSeat.seatNumber}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">Shift-wise occupancy</p>
              </div>
            </div>
            <div className="p-5 space-y-2.5 text-sm">
              {TIMINGS.map((t) => {
                const status = statusFor(selectedSeat, t.key);
                const student = studentFor(selectedSeat, t.key);
                return (
                  <div key={t.key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 rounded-xl px-3.5 py-2.5">
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">{t.label}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{student?.name || "Vacant"}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${STATUS_BADGE[status]}`}>
                      {status}
                    </span>
                  </div>
                );
              })}

              <div className="pt-4 -mx-5 -mb-5 px-5 pb-5 sticky bottom-0 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 mt-5 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)] z-10">
                <button
                  onClick={() => setSelectedSeat(null)}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Seats;
