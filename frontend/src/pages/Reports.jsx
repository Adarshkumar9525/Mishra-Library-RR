import { useState, useEffect } from "react";
import { MdDescription, MdDownload, MdPrint, MdRefresh } from "react-icons/md";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import toast from "react-hot-toast";
import api from "../api/axios";

const REPORT_TYPES = [
  { key: "students", label: "Student Report", desc: "Full list of students with membership details" },
  { key: "payments", label: "Payment Report", desc: "All recorded payments with receipts" },
  { key: "seats", label: "Seat Report", desc: "Seat-wise occupancy and status" },
  { key: "collection", label: "Collection Report", desc: "Monthly and yearly collection summary" },
];

const Reports = () => {
  const [activeReportKey, setActiveReportKey] = useState("students");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchReportData = async (type) => {
    setLoading(true);
    try {
      if (type === "students") {
        const res = await api.get("/students", { params: { limit: 1000 } });
        setReportData(res.data.data || []);
      } else if (type === "payments") {
        const res = await api.get("/payments", { params: { limit: 1000 } });
        setReportData(res.data.data || []);
      } else if (type === "seats") {
        const res = await api.get("/seats");
        const seatSlots = (res.data.data || []).flatMap((s) =>
          ["morning", "afternoon", "evening", "night"].map((t) => ({
            _id: `${s._id}-${t}`,
            seatNumber: s.seatNumber,
            shift: t,
            status: s.slots?.[t]?.status || "available",
            studentName: s.slots?.[t]?.student?.name || "Vacant",
          }))
        );
        setReportData(seatSlots);
      } else if (type === "collection") {
        const res = await api.get("/payments/summary");
        const summary = res.data.data || {};
        setReportData([
          { period: "Today", amount: summary.today || 0 },
          { period: "This Month", amount: summary.month || 0 },
          { period: "This Year", amount: summary.year || 0 },
          { period: "All Time", amount: summary.total || 0 },
        ]);
      }
    } catch {
      toast.error("Failed to fetch report data");
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(activeReportKey);
  }, [activeReportKey]);

  const handleSelectReport = (type) => {
    setActiveReportKey(type);
  };

  const handlePrint = async (type) => {
    if (activeReportKey !== type) {
      setActiveReportKey(type);
      await fetchReportData(type);
    }
    // Small delay to allow DOM render before calling browser native print dialog
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportExcel = async (type) => {
    try {
      let rows = [];
      if (type === "students") {
        const res = await api.get("/students", { params: { limit: 1000 } });
        rows = (res.data.data || []).map((s) => ({
          Name: s.name,
          Mobile: s.mobile,
          Seat: s.seatNumber || "N/A",
          Timing: s.timing,
          "Monthly Fee": s.monthlyFee,
          "Joining Date": s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : "-",
          "Expiry Date": s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : "-",
          "Fee Status": s.feeStatus,
          Status: s.status,
        }));
      } else if (type === "payments") {
        const res = await api.get("/payments", { params: { limit: 1000 } });
        rows = (res.data.data || []).map((p) => ({
          Receipt: p.receiptNumber,
          Student: p.student?.name || "N/A",
          Amount: p.amount,
          Mode: p.mode,
          "For Month": p.forMonth,
          Date: p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-",
        }));
      } else if (type === "seats") {
        const res = await api.get("/seats");
        rows = (res.data.data || []).flatMap((s) =>
          ["morning", "afternoon", "evening", "night"].map((t) => ({
            Seat: s.seatNumber,
            Shift: t,
            Status: s.slots?.[t]?.status || "available",
            Student: s.slots?.[t]?.student?.name || "Vacant",
          }))
        );
      } else if (type === "collection") {
        const res = await api.get("/payments/summary");
        rows = [
          { Period: "Today", Amount: res.data.data?.today || 0 },
          { Period: "This Month", Amount: res.data.data?.month || 0 },
          { Period: "This Year", Amount: res.data.data?.year || 0 },
          { Period: "All Time", Amount: res.data.data?.total || 0 },
        ];
      }

      if (rows.length === 0) {
        toast.error("No data to export");
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, type);
      const buffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });

      const fileName = `${type}-report-${new Date().getTime()}.xlsx`;

      saveAs(
        new Blob([buffer], {
          type: "application/octet-stream",
        }),
        fileName
      );
      toast.success("Report downloaded");
    } catch {
      toast.error("Failed to generate report");
    }
  };

  const activeReport = REPORT_TYPES.find((r) => r.key === activeReportKey) || REPORT_TYPES[0];

  return (
    <div className="space-y-6">
      {/* On-screen Header & Controls (Hidden during print) */}
      <div className="no-print space-y-5">
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Analytics</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">Reports &amp; Downloads</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Generate, preview, print, and export ERP reports
          </p>
        </div>

        {/* Report Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {REPORT_TYPES.map((r) => {
            const isSelected = activeReportKey === r.key;
            return (
              <div
                key={r.key}
                className={`card p-4 flex flex-col justify-between transition-all cursor-pointer border-2 ${
                  isSelected
                    ? "border-primary-500 dark:border-primary-400 ring-4 ring-primary-500/10 dark:ring-primary-400/20 bg-white dark:bg-slate-800 shadow-card"
                    : "border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600"
                }`}
                onClick={() => handleSelectReport(r.key)}
              >
                <div>
                  <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-3">
                    <MdDescription size={20} />
                  </div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-sm font-heading">{r.label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-3 leading-relaxed">{r.desc}</p>
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportExcel(r.key);
                    }}
                    className="btn-secondary py-1.5 px-2 flex items-center gap-1 text-xs flex-1 justify-center"
                  >
                    <MdDownload size={14} /> Excel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrint(r.key);
                    }}
                    className="btn-primary py-1.5 px-2 flex items-center gap-1 text-xs flex-1 justify-center"
                  >
                    <MdPrint size={14} /> Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Printable & On-screen Report Document Area */}
      <div className="printable-area bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none border border-slate-100 dark:border-slate-700 p-6 space-y-5">
        {/* Printable Document Header */}
        <div className="border-b-2 border-slate-800 dark:border-slate-600 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-wide uppercase font-heading">
              Mishra Library Study Centre
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Reading Room &amp; Study Centre Management System
            </p>
          </div>

          <div className="text-left sm:text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
            <p className="font-bold text-slate-900 dark:text-slate-100 uppercase text-sm">{activeReport.label}</p>
            <p>Generated: {new Date().toLocaleString()}</p>
            <p className="text-slate-400 dark:text-slate-500">Confidential ERP Document</p>
          </div>
        </div>

        {/* On-Screen Action Bar (No Print) */}
        <div className="no-print flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Showing <span className="font-bold text-slate-800 dark:text-slate-100">{activeReport.label}</span> ({reportData.length} entries)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchReportData(activeReportKey)}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
            >
              <MdRefresh size={15} /> Refresh
            </button>
            <button
              onClick={() => handlePrint(activeReportKey)}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1"
            >
              <MdPrint size={15} /> Print Report
            </button>
          </div>
        </div>

        {/* Report Content Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm flex items-center justify-center gap-2">
            <div className="w-5 h-5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
            Loading report data...
          </div>
        ) : reportData.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            No report data available. Select a report or click Refresh.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="print-table w-full text-sm">
              <thead>
                {activeReportKey === "students" && (
                  <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Student Name</th>
                    <th className="py-2.5 px-3 font-semibold">Mobile</th>
                    <th className="py-2.5 px-3 font-semibold">Seat</th>
                    <th className="py-2.5 px-3 font-semibold">Shift</th>
                    <th className="py-2.5 px-3 font-semibold">Monthly Fee</th>
                    <th className="py-2.5 px-3 font-semibold">Joining Date</th>
                    <th className="py-2.5 px-3 font-semibold">Expiry Date</th>
                    <th className="py-2.5 px-3 font-semibold">Fee Status</th>
                  </tr>
                )}

                {activeReportKey === "payments" && (
                  <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Receipt No.</th>
                    <th className="py-2.5 px-3 font-semibold">Student Name</th>
                    <th className="py-2.5 px-3 font-semibold">For Month</th>
                    <th className="py-2.5 px-3 font-semibold">Payment Mode</th>
                    <th className="py-2.5 px-3 font-semibold">Date</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Amount (₹)</th>
                  </tr>
                )}

                {activeReportKey === "seats" && (
                  <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Seat No.</th>
                    <th className="py-2.5 px-3 font-semibold">Shift</th>
                    <th className="py-2.5 px-3 font-semibold">Occupancy Status</th>
                    <th className="py-2.5 px-3 font-semibold">Occupied By</th>
                  </tr>
                )}

                {activeReportKey === "collection" && (
                  <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2.5 px-3 font-semibold">#</th>
                    <th className="py-2.5 px-3 font-semibold">Collection Period</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Total Amount (₹)</th>
                  </tr>
                )}
              </thead>

              <tbody>
                {activeReportKey === "students" &&
                  reportData.map((s, idx) => (
                    <tr key={s._id || idx} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">{s.name}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 font-mono text-xs">{s.mobile}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{s.seatNumber ? `#${s.seatNumber}` : "N/A"}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-400">{s.timing}</td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">₹{s.monthlyFee}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs">
                        {s.joiningDate ? new Date(s.joiningDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs">
                        {s.expiryDate ? new Date(s.expiryDate).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2.5 px-3 capitalize">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            s.feeStatus === "paid"
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                          }`}
                        >
                          {s.feeStatus}
                        </span>
                      </td>
                    </tr>
                  ))}

                {activeReportKey === "payments" &&
                  reportData.map((p, idx) => (
                    <tr key={p._id || idx} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-700 dark:text-slate-300">{p.receiptNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">{p.student?.name || "—"}</td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">{p.forMonth}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-400">{p.mode?.replace("-", " ")}</td>
                      <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 text-xs">
                        {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount}</td>
                    </tr>
                  ))}

                {activeReportKey === "seats" &&
                  reportData.map((seat, idx) => (
                    <tr key={seat._id || idx} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">Seat #{seat.seatNumber}</td>
                      <td className="py-2.5 px-3 capitalize text-slate-600 dark:text-slate-400">{seat.shift}</td>
                      <td className="py-2.5 px-3 capitalize">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                            seat.status === "occupied"
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {seat.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">{seat.studentName}</td>
                    </tr>
                  ))}

                {activeReportKey === "collection" &&
                  reportData.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/40">
                      <td className="py-2.5 px-3 text-slate-400 dark:text-slate-500 font-mono text-xs">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-100">{row.period}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{row.amount}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Printable Summary Footer & Sign-off Block */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">Mishra Library ERP Management System</p>
            <p>This report is computer-generated and requires no physical signature.</p>
          </div>
          <div className="text-right border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto">
            <p className="text-slate-400 dark:text-slate-500 mb-6">Authorized Signatory</p>
            <div className="border-b border-slate-400 dark:border-slate-500 w-40 ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
