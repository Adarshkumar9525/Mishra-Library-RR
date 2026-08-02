import { useEffect, useState, useCallback } from "react";
import { MdAdd, MdClose, MdReceiptLong } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import {
  TableSkeleton,
  EmptyState,
} from "../components/LoadingSkeleton";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    student: "",
    amount: "",
    mode: "cash",
    forMonth: new Date().toISOString().slice(0, 7),
    remarks: "",
  });

  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const [paymentsRes, summaryRes] = await Promise.all([
        api.get("/payments", {
          params: { limit: 20 },
        }),
        api.get("/payments/summary"),
      ]);

      setPayments(paymentsRes.data.data || []);
      setSummary(summaryRes.data.data || {});
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, []);

  const openModal = async () => {
    setModalOpen(true);

    try {
      const res = await api.get("/students", {
        params: { limit: 100 },
      });

      setStudents(res.data.data || []);
    } catch {
      toast.error("Failed to load students");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      await api.post("/payments", form);

      toast.success("Payment recorded");

      setModalOpen(false);

      setForm({
        student: "",
        amount: "",
        mode: "cash",
        forMonth: new Date().toISOString().slice(0, 7),
        remarks: "",
      });

      fetchData();
          } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Failed to record payment"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Payments
          </h1>
          <p className="text-sm text-slate-400">
            Collection history and receipts
          </p>
        </div>

        <button
          onClick={openModal}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <MdAdd size={18} />
          Add Payment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today", value: summary?.today },
          { label: "This Month", value: summary?.month },
          { label: "This Year", value: summary?.year },
          { label: "All Time", value: summary?.total },
        ].map((s) => (
          <div
            key={s.label}
            className="card p-4"
          >
            <p className="text-xs text-slate-400 mb-1">
              {s.label}
            </p>

            <p className="text-lg font-bold text-slate-800">
              ₹{s.value ?? 0}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-5">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={MdReceiptLong}
            title="No payments yet"
            subtitle="Record your first payment to see it here"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100">
                  <th className="pb-3 font-medium">
                    Receipt
                  </th>
                  <th className="pb-3 font-medium">
                    Student
                  </th>
                  <th className="pb-3 font-medium">
                    Month
                  </th>
                  <th className="pb-3 font-medium">
                    Mode
                  </th>
                  <th className="pb-3 font-medium">
                    Date
                  </th>
                  <th className="pb-3 font-medium text-right">
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {payments.map((p) => (
                  <tr
                    key={p._id}
                    className="border-b border-slate-50 last:border-0"
                  >
                    <td className="py-2.5 text-slate-500 font-mono text-xs">
                      {p.receiptNumber}
                    </td>

                    <td className="py-2.5 font-medium text-slate-700">
                      {p.student?.name || "—"}
                    </td>

                    <td className="py-2.5 text-slate-500">
                      {p.forMonth}
                    </td>

                    <td className="py-2.5 capitalize text-slate-500">
                      {p.mode.replace("-", " ")}
                    </td>

                    <td className="py-2.5 text-slate-500">
                      {new Date(
                        p.paidAt
                      ).toLocaleDateString()}
                    </td>

                    <td className="py-2.5 text-right font-semibold text-emerald-600">
                      ₹{p.amount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
            {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl2 shadow-card w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">
                Add Payment
              </h2>

              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4"
            >
              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">
                  Student
                </label>

                <select
                  required
                  value={form.student}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      student: e.target.value,
                    })
                  }
                  className="input-field"
                >
                  <option value="">
                    Select student
                  </option>

                  {students.map((s) => (
                    <option
                      key={s._id}
                      value={s._id}
                    >
                      {s.name} — Seat #{s.seatNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">
                    Amount (₹)
                  </label>

                  <input
                    type="number"
                    required
                    min="0"
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 mb-1 block">
                    Mode
                  </label>

                  <select
                    value={form.mode}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        mode: e.target.value,
                      })
                    }
                    className="input-field"
                  >
                    <option value="cash">Cash</option>
                    <option value="upi">UPI</option>
                    <option value="card">Card</option>
                    <option value="bank-transfer">
                      Bank Transfer
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">
                  For Month
                </label>

                <input
                  type="month"
                  required
                  value={form.forMonth}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      forMonth: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 mb-1 block">
                  Remarks
                </label>

                <input
                  value={form.remarks}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      remarks: e.target.value,
                    })
                  }
                  className="input-field"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1"
                >
                  {saving
                    ? "Saving..."
                    : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;