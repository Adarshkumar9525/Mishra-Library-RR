import { useEffect, useState, useMemo } from "react";
import {
  MdPeople,
  MdEventSeat,
  MdCurrencyRupee,
  MdWarningAmber,
  MdPersonAdd,
  MdTrendingUp,
  MdWbSunny,
  MdNightlightRound,
  MdAccessTime,
  MdBrightness5,
} from "react-icons/md";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import api from "../api/axios";
import StatCard from "../components/StatCard";
import { CardSkeleton } from "../components/LoadingSkeleton";
import { useTheme } from "../context/ThemeContext";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#94a3b8"];

const SHIFT_ICONS = {
  Morning: MdWbSunny,
  Afternoon: MdBrightness5,
  Evening: MdAccessTime,
  Night: MdNightlightRound,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-elevated dark:shadow-none px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
        {payload.map((p) => (
          <p key={p.name} style={{ color: p.color || "#4f46e5" }} className="font-medium">
            {p.name === "revenue" ? `₹${p.value?.toLocaleString()}` : `${p.name}: ${p.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  const gridColor = theme === "dark" ? "#334155" : "#f1f5f9";
  const axisColor = theme === "dark" ? "#64748b" : "#94a3b8";

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/dashboard/charts")])
      .then(([statsRes, chartsRes]) => {
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revenueData = useMemo(
    () =>
      (charts?.revenueByMonth || []).map((r) => ({
        month: `${MONTH_NAMES[r._id.month - 1]}`,
        revenue: r.total,
      })),
    [charts?.revenueByMonth]
  );

  const admissionData = useMemo(
    () =>
      (charts?.admissionsByMonth || []).map((r) => ({
        month: `${MONTH_NAMES[r._id.month - 1]}`,
        admissions: r.count,
      })),
    [charts?.admissionsByMonth]
  );

  const seatPieData = useMemo(
    () =>
      (charts?.seatsByStatus || []).map((s) => ({
        name: s._id,
        value: s.count,
      })),
    [charts?.seatsByStatus]
  );

  const shiftOccupancyData = useMemo(
    () =>
      (charts?.occupancyByShift || []).map((s) => {
        const name = s.shift || s._id;
        const formattedName = name ? name.charAt(0).toUpperCase() + name.slice(1) : "Shift";
        return {
          shift: formattedName,
          occupied: s.count || 0,
        };
      }),
    [charts?.occupancyByShift]
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">{greeting()}, Admin 👋</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MdPeople} label="Total Students" value={stats?.totalStudents ?? 0} accent="primary" />
            <StatCard icon={MdEventSeat} label="Fully Occupied Seats" value={`${stats?.fullyOccupiedSeats ?? stats?.occupiedSeats ?? 0}/${stats?.totalSeats ?? 100}`} accent="rose" />
            <StatCard icon={MdEventSeat} label="Partially Occupied Seats" value={`${stats?.partiallyOccupiedSeats ?? 0}/${stats?.totalSeats ?? 100}`} accent="amber" />
            <StatCard icon={MdEventSeat} label="Fully Available Seats" value={`${stats?.fullyAvailableSeats ?? stats?.availableSeats ?? 100}/${stats?.totalSeats ?? 100}`} accent="emerald" />
            <StatCard icon={MdWarningAmber} label="Pending Fees" value={stats?.pendingFeeCount ?? 0} accent="amber" />
            <StatCard icon={MdPersonAdd} label="Today's Admissions" value={stats?.todayAdmissions ?? 0} accent="primary" />
            <StatCard icon={MdCurrencyRupee} label="Today's Collection" value={stats?.todayCollection ?? 0} suffix="₹" accent="emerald" />
            <StatCard icon={MdCurrencyRupee} label="Monthly Collection" value={stats?.monthlyCollection ?? 0} suffix="₹" accent="emerald" />
            <StatCard icon={MdTrendingUp} label="Total Collection" value={stats?.totalCollection ?? 0} suffix="₹" accent="primary" />
            <StatCard icon={MdWarningAmber} label="Expiring in 7 Days" value={stats?.expiringSoon ?? 0} accent="rose" />
          </div>

          {/* Shift-Wise Occupancy Breakdown Cards */}
          <div className="card p-5 border border-slate-100 dark:border-slate-700 space-y-4">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-base font-heading">Shift-Wise Seat Occupancy</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Live occupied seats breakdown for each individual shift</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {shiftOccupancyData.map((s) => {
                const IconComponent = SHIFT_ICONS[s.shift] || MdEventSeat;
                return (
                  <div key={s.shift} className="bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-xl p-3.5 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center shrink-0">
                      <IconComponent size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{s.shift}</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100 font-heading mt-0.5">
                        {s.occupied} <span className="text-xs font-normal text-slate-400 dark:text-slate-500">/ {stats?.totalSeats || 100}</span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Revenue line chart */}
            <div className="card p-5 lg:col-span-2 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Monthly Revenue</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Fee collections per month</p>
                </div>
                <span className="text-xs font-medium bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 px-2.5 py-1 rounded-full border border-primary-100 dark:border-primary-900">
                  This Year
                </span>
              </div>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#3b82f6", strokeWidth: 2, stroke: theme === "dark" ? "#1e293b" : "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Seat Pie */}
            <div className="card p-5 border border-slate-100 dark:border-slate-700">
              <div className="mb-5">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Overall Slot Status</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Slot-level status across all 4 shifts</p>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={seatPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={78}
                    paddingAngle={4}
                    strokeWidth={2}
                    stroke={theme === "dark" ? "#1e293b" : "#fff"}
                  >
                    {seatPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {seatPieData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="capitalize text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Admissions Bar Chart */}
            <div className="card p-5 lg:col-span-2 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">Admissions Trend</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">New students per month</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={admissionData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="admissions" fill="#818cf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Shift Occupancy Bar Chart */}
            <div className="card p-5 border border-slate-100 dark:border-slate-700">
              <div className="mb-4">
                <p className="font-semibold text-slate-800 dark:text-slate-100">Shift Occupancy Chart</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Occupied seats per shift</p>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={shiftOccupancyData} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="shift" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} width={25} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="occupied" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Payments & Students */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Payments */}
            <div className="card p-5 border border-slate-100 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Recent Payments</p>
              <div className="space-y-3">
                {(stats?.recentPayments || []).slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {p.student?.name?.charAt(0) || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{p.student?.name || "—"}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">Seat #{p.student?.seatNumber || "—"}</p>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">₹{p.amount}</p>
                  </div>
                ))}
                {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">No payments yet</p>
                )}
              </div>
            </div>

            {/* Recent Students Table */}
            <div className="card p-5 border border-slate-100 dark:border-slate-700">
              <p className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Recently Joined Students</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Mobile</th>
                      <th className="pb-3 font-medium">Seat</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats?.recentStudents || []).map((s) => (
                      <tr key={s._id} className="border-b border-slate-50 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                        <td className="py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="h-7 w-7 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                              {s.name?.charAt(0)}
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">{s.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{s.mobile}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium">
                            #{s.seatNumber}
                          </span>
                        </td>
                        <td className="py-3 text-slate-500 dark:text-slate-400">{new Date(s.joiningDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {(!stats?.recentStudents || stats.recentStudents.length === 0) && (
                  <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No students yet</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
