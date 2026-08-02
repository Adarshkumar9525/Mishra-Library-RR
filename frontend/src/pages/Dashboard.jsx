import { useEffect, useState } from "react";
import {
  MdPeople,
  MdEventSeat,
  MdCurrencyRupee,
  MdWarningAmber,
  MdPersonAdd,
  MdTrendingUp,
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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PIE_COLORS = ["#2563eb", "#93c5fd", "#f59e0b", "#e2e8f0"];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/dashboard/stats"), api.get("/dashboard/charts")])
      .then(([statsRes, chartsRes]) => {
        setStats(statsRes.data.data);
        setCharts(chartsRes.data.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const revenueData = (charts?.revenueByMonth || []).map((r) => ({
    month: `${MONTH_NAMES[r._id.month - 1]}`,
    revenue: r.total,
  }));

  const admissionData = (charts?.admissionsByMonth || []).map((r) => ({
    month: `${MONTH_NAMES[r._id.month - 1]}`,
    admissions: r.count,
  }));

  const seatPieData = (charts?.seatsByStatus || []).map((s) => ({
    name: s._id,
    value: s.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-sm text-slate-400">Overview of your reading room operations</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MdPeople} label="Total Students" value={stats?.totalStudents ?? 0} accent="primary" />
            <StatCard icon={MdEventSeat} label="Occupied Seats" value={`${stats?.occupiedSeats ?? 0}/${stats?.totalSeats ?? 100}`} accent="emerald" />
            <StatCard icon={MdWarningAmber} label="Pending Fees" value={stats?.pendingFeeCount ?? 0} accent="amber" />
            <StatCard icon={MdPersonAdd} label="Today's Admissions" value={stats?.todayAdmissions ?? 0} accent="primary" />
            <StatCard icon={MdCurrencyRupee} label="Today's Collection" value={stats?.todayCollection ?? 0} suffix="₹" accent="emerald" />
            <StatCard icon={MdCurrencyRupee} label="Monthly Collection" value={stats?.monthlyCollection ?? 0} suffix="₹" accent="emerald" />
            <StatCard icon={MdTrendingUp} label="Total Collection" value={stats?.totalCollection ?? 0} suffix="₹" accent="primary" />
            <StatCard icon={MdWarningAmber} label="Expiring in 7 Days" value={stats?.expiringSoon ?? 0} accent="rose" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="card p-5 lg:col-span-2">
              <p className="font-semibold text-slate-700 mb-4">Monthly Revenue</p>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <p className="font-semibold text-slate-700 mb-4">Seat Occupancy</p>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={seatPieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {seatPieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 lg:col-span-2">
              <p className="font-semibold text-slate-700 mb-4">Admissions Trend</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={admissionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="admissions" fill="#60a5fa" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5">
              <p className="font-semibold text-slate-700 mb-4">Recent Payments</p>
              <div className="space-y-3">
                {(stats?.recentPayments || []).slice(0, 5).map((p) => (
                  <div key={p._id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{p.student?.name || "—"}</p>
                      <p className="text-xs text-slate-400">Seat {p.student?.seatNumber || "—"}</p>
                    </div>
                    <p className="font-semibold text-emerald-600">₹{p.amount}</p>
                  </div>
                ))}
                {(!stats?.recentPayments || stats.recentPayments.length === 0) && (
                  <p className="text-sm text-slate-400">No payments yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-5">
            <p className="font-semibold text-slate-700 mb-4">Recent Students</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Mobile</th>
                    <th className="pb-2 font-medium">Seat</th>
                    <th className="pb-2 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats?.recentStudents || []).map((s) => (
                    <tr key={s._id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-medium text-slate-700">{s.name}</td>
                      <td className="py-2.5 text-slate-500">{s.mobile}</td>
                      <td className="py-2.5 text-slate-500">{s.seatNumber}</td>
                      <td className="py-2.5 text-slate-500">{new Date(s.joiningDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!stats?.recentStudents || stats.recentStudents.length === 0) && (
                <p className="text-sm text-slate-400 py-6 text-center">No students yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
