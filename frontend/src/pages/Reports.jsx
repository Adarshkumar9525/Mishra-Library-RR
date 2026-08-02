import { MdDescription, MdDownload, MdPrint } from "react-icons/md";
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
  const handleExportExcel = async (type) => {
    try {
      let rows = [];
      if (type === "students") {
        const res = await api.get("/students", { params: { limit: 1000 } });
        rows = res.data.data.map((s) => ({
          Name: s.name,
          Mobile: s.mobile,
          Seat: s.seatNumber,
          Timing: s.timing,
          "Monthly Fee": s.monthlyFee,
          "Joining Date": new Date(s.joiningDate).toLocaleDateString(),
          "Expiry Date": new Date(s.expiryDate).toLocaleDateString(),
          "Fee Status": s.feeStatus,
          Status: s.status,
        }));
      } else if (type === "payments") {
        const res = await api.get("/payments", { params: { limit: 1000 } });
        rows = res.data.data.map((p) => ({
          Receipt: p.receiptNumber,
          Student: p.student?.name,
          Amount: p.amount,
          Mode: p.mode,
          "For Month": p.forMonth,
          Date: new Date(p.paidAt).toLocaleDateString(),
        }));
      } else if (type === "seats") {
        const res = await api.get("/seats");
        rows = res.data.data.flatMap((s) =>
          ["morning", "afternoon", "evening", "night"].map((t) => ({
            Seat: s.seatNumber,
            Shift: t,
            Status: s.slots?.[t]?.status || "available",
            Student: s.slots?.[t]?.student?.name || "Vacant",
          }))
        );
      } else if (type === "collection") {
        const res = await api.get("/payments/summary");
        rows = [{ Period: "Today", Amount: res.data.data.today }, { Period: "This Month", Amount: res.data.data.month }, { Period: "This Year", Amount: res.data.data.year }, { Period: "All Time", Amount: res.data.data.total }];
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

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Reports</h1>
        <p className="text-sm text-slate-400">Export data for record-keeping and analysis</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {REPORT_TYPES.map((r) => (
          <div key={r.key} className="card p-5 flex flex-col">
            <div className="h-10 w-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-3">
              <MdDescription size={20} />
            </div>
            <p className="font-semibold text-slate-800">{r.label}</p>
            <p className="text-sm text-slate-400 mb-4 flex-1">{r.desc}</p>
            <div className="flex gap-2">
              <button onClick={() => handleExportExcel(r.key)} className="btn-secondary flex items-center gap-1.5 text-sm flex-1 justify-center">
                <MdDownload size={16} /> Excel
              </button>
              <button onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5 text-sm flex-1 justify-center">
                <MdPrint size={16} /> Print
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card p-5">
        <p className="text-sm text-slate-400">
          PDF export is available via the print dialog for now (choose &quot;Save as PDF&quot; as the destination). A dedicated
          PDF export button can be added next once report templates/layouts are finalized.
        </p>
      </div>
    </div>
  );
};

export default Reports;
