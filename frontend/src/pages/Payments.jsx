import { useEffect, useState, useCallback, useRef } from "react";
import { MdAdd, MdClose, MdReceiptLong, MdSearch, MdCalendarToday, MdPayment, MdEdit, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import { TableSkeleton, EmptyState } from "../components/LoadingSkeleton";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  useBodyScrollLock(modalOpen);
  const [editingPayment, setEditingPayment] = useState(null);

  // Student search & autocomplete state for Add Payment form
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const [form, setForm] = useState({
    student: "",
    amount: "",
    mode: "cash",
    forMonth: new Date().toISOString().slice(0, 7),
    paidAt: new Date().toISOString().slice(0, 10),
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

  const openModal = async (paymentToEdit = null) => {
    if (paymentToEdit) {
      setEditingPayment(paymentToEdit);
      const initialDate = paymentToEdit.paidAt ? new Date(paymentToEdit.paidAt) : new Date();
      setForm({
        student: paymentToEdit.student?._id || paymentToEdit.student || "",
        amount: paymentToEdit.amount !== undefined ? String(paymentToEdit.amount) : "",
        mode: paymentToEdit.mode || "cash",
        forMonth: paymentToEdit.forMonth || new Date().toISOString().slice(0, 7),
        paidAt: !isNaN(initialDate.getTime()) ? initialDate.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        remarks: paymentToEdit.remarks || "",
      });
      setSelectedStudent(paymentToEdit.student || null);
      setStudentSearch(paymentToEdit.student?.name || "");
      setStudentResults([]);
      setDropdownOpen(false);
      setHighlightedIndex(-1);
      setModalOpen(true);
    } else {
      setEditingPayment(null);
      setForm({
        student: "",
        amount: "",
        mode: "cash",
        forMonth: new Date().toISOString().slice(0, 7),
        paidAt: new Date().toISOString().slice(0, 10),
        remarks: "",
      });
      setStudentSearch("");
      setStudentResults([]);
      setSelectedStudent(null);
      setDropdownOpen(false);
      setHighlightedIndex(-1);
      setModalOpen(true);

      // Load initial student recommendations for instant autocomplete dropdown on focus
      try {
        setSearching(true);
        const res = await api.get("/students", {
          params: { limit: 10 },
        });
        setStudentResults(res.data.data || []);
      } catch {
        // ignore initial fetch failure silently
      } finally {
        setSearching(false);
      }
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;

    try {
      await api.delete(`/payments/${id}`);
      toast.success("Payment deleted successfully");
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete payment");
    }
  };

  // Debounced search effect for student name input
  useEffect(() => {
    if (!modalOpen || editingPayment) return;

    if (selectedStudent && studentSearch === selectedStudent.name) {
      return;
    }

    setSearching(true);
    setHighlightedIndex(-1);

    const timer = setTimeout(async () => {
      try {
        const params = { limit: 10 };
        if (studentSearch.trim()) {
          params.name = studentSearch.trim();
        }
        const res = await api.get("/students", { params });
        setStudentResults(res.data.data || []);
        setDropdownOpen(true);
      } catch {
        toast.error("Failed to search students");
        setStudentResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [studentSearch, modalOpen, selectedStudent, editingPayment]);

  // Close autocomplete dropdown when clicking/tapping outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleSelectStudent = (s) => {
    setSelectedStudent(s);
    setStudentSearch(s.name);
    setForm((prev) => ({
      ...prev,
      student: s._id,
      amount: prev.amount !== "" ? prev.amount : (s.monthlyFee ? String(s.monthlyFee) : ""),
    }));
    setDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentSearch("");
    setStudentResults([]);
    setForm((prev) => ({
      ...prev,
      student: "",
    }));
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (!dropdownOpen || studentResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < studentResults.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : studentResults.length - 1
      );
    } else if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < studentResults.length) {
        e.preventDefault();
        handleSelectStudent(studentResults[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.student) {
      toast.error("Please select a student");
      return;
    }

    setSaving(true);

    try {
      if (editingPayment) {
        await api.put(`/payments/${editingPayment._id}`, {
          amount: Number(form.amount),
          mode: form.mode,
          forMonth: form.forMonth,
          paidAt: form.paidAt,
          remarks: form.remarks,
        });
        toast.success("Payment updated successfully");
      } else {
        await api.post("/payments", form);
        toast.success("Payment recorded");
      }

      setModalOpen(false);
      setEditingPayment(null);

      setForm({
        student: "",
        amount: "",
        mode: "cash",
        forMonth: new Date().toISOString().slice(0, 7),
        paidAt: new Date().toISOString().slice(0, 10),
        remarks: "",
      });
      setSelectedStudent(null);
      setStudentSearch("");

      fetchData();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          (editingPayment ? "Failed to update payment" : "Failed to record payment")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Finance</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">Payments</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">Collection history and fee receipts</p>
        </div>
        <button onClick={() => openModal()} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-fit">
          <MdAdd size={18} />
          Add Payment
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Today", value: summary?.today, color: "text-primary-600 dark:text-primary-400" },
          { label: "This Month", value: summary?.month, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "This Year", value: summary?.year, color: "text-violet-600 dark:text-violet-400" },
          { label: "All Time", value: summary?.total, color: "text-amber-600 dark:text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="card border border-slate-100 dark:border-slate-700 p-3.5 sm:p-4 hover:-translate-y-0.5 transition-transform">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mb-1 uppercase tracking-wide">{s.label}</p>
            <p className={`text-lg sm:text-xl font-bold font-heading ${s.color}`}>
              ₹{(s.value ?? 0).toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="card p-4 sm:p-5 border border-slate-100 dark:border-slate-700">
        {loading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : payments.length === 0 ? (
          <EmptyState
            icon={MdReceiptLong}
            title="No payments yet"
            subtitle="Record your first payment to see it here"
          />
        ) : (
          <>
            {/* Mobile Card List View (< sm) */}
            <div className="block sm:hidden space-y-3">
              {payments.map((p) => (
                <div key={p._id} className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500 font-semibold">{p.receiptNumber}</span>
                      {p.editedAt && (
                        <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-medium" title={`Last edited: ${new Date(p.editedAt).toLocaleString()}`}>
                          · edited
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                        ₹{p.amount}
                      </span>
                      <button
                        onClick={() => openModal(p)}
                        className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 transition-colors"
                        title="Edit payment"
                      >
                        <MdEdit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeletePayment(p._id)}
                        className="p-1 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                        title="Delete payment"
                      >
                        <MdDelete size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {p.student?.name?.charAt(0) || "?"}
                    </div>
                    <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{p.student?.name || "—"}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="flex items-center gap-1"><MdCalendarToday size={12} /> {p.forMonth}</span>
                    <span className="capitalize flex items-center gap-1"><MdPayment size={12} /> {p.mode.replace("-", " ")}</span>
                    <span>{new Date(p.paidAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-3 font-medium">Receipt</th>
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Month</th>
                    <th className="pb-3 font-medium">Mode</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Amount</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p._id} className="border-b border-slate-50 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 text-slate-400 dark:text-slate-500 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span>{p.receiptNumber}</span>
                          {p.editedAt && (
                            <span className="text-[10px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 font-medium" title={`Last edited: ${new Date(p.editedAt).toLocaleString()}`}>
                              · edited
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {p.student?.name?.charAt(0) || "?"}
                          </div>
                          <span className="font-medium text-slate-700 dark:text-slate-200">{p.student?.name || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{p.forMonth}</td>
                      <td className="py-3 capitalize">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium">{p.mode.replace("-", " ")}</span>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">₹{p.amount}</td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openModal(p)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Edit Payment"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeletePayment(p._id)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Delete Payment"
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-40 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-3 sm:p-4 text-center sm:text-left">
            <div
              className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-700 my-auto sm:my-8 text-left transition-all transform"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading text-lg">
                  {editingPayment ? "Edit Payment" : "Add Payment"}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {editingPayment ? "Update payment details" : "Record a fee collection"}
                </p>
              </div>
              <button
                onClick={() => {
                  setModalOpen(false);
                  setEditingPayment(null);
                }}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <MdClose size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                  Student Name {!editingPayment && <span className="text-red-500">*</span>}
                </label>

                {editingPayment ? (
                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center justify-between">
                    <span>Editing payment for {selectedStudent?.name || "Student"}</span>
                    <span className="text-xs bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-normal">Read-only</span>
                  </div>
                ) : (
                  <div ref={dropdownRef} className="relative">
                    <div className="relative flex items-center">
                      <input
                        ref={searchInputRef}
                        type="text"
                        required
                        placeholder="Type student name to search..."
                        value={studentSearch}
                        onChange={(e) => {
                          setStudentSearch(e.target.value);
                          if (selectedStudent && e.target.value !== selectedStudent.name) {
                            setSelectedStudent(null);
                            setForm((prev) => ({ ...prev, student: "" }));
                          }
                        }}
                        onFocus={() => {
                          if (!selectedStudent) {
                            setDropdownOpen(true);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        aria-expanded={dropdownOpen}
                        aria-autocomplete="list"
                        className="input-field pr-10"
                      />

                      {searching ? (
                        <div className="absolute right-3 flex items-center justify-center pointer-events-none">
                          <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : selectedStudent ? (
                        <button
                          type="button"
                          onClick={handleClearStudent}
                          className="absolute right-3 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-full transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                          title="Clear student selection"
                        >
                          <MdClose size={16} />
                        </button>
                      ) : (
                        <div className="absolute right-3 text-slate-400 dark:text-slate-500 pointer-events-none">
                          <MdSearch size={18} />
                        </div>
                      )}
                    </div>

                    {/* Autocomplete Dropdown */}
                    {dropdownOpen && (
                      <div
                        role="listbox"
                        className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg dark:shadow-none py-1 text-sm divide-y divide-slate-50 dark:divide-slate-700/60"
                      >
                        {searching ? (
                          <div className="py-3 px-4 text-slate-400 dark:text-slate-500 text-center flex items-center justify-center gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                            Searching students...
                          </div>
                        ) : studentResults.length === 0 ? (
                          <div className="py-3 px-4 text-slate-400 dark:text-slate-500 text-center font-medium">
                            No student found
                          </div>
                        ) : (
                          studentResults.map((s, index) => (
                            <div
                              key={s._id}
                              role="option"
                              aria-selected={highlightedIndex === index}
                              onClick={() => handleSelectStudent(s)}
                              onMouseEnter={() => setHighlightedIndex(index)}
                              className={`px-4 py-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-1 transition-colors touch-manipulation min-h-[44px] ${
                                highlightedIndex === index
                                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 font-medium"
                                  : "hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200"
                              }`}
                            >
                              <div>
                                <span className="font-semibold text-slate-800 dark:text-slate-100">
                                  {s.name}
                                </span>
                                {s.mobile && (
                                  <span className="text-xs text-slate-400 dark:text-slate-500 ml-2 font-normal">
                                    📱 {s.mobile}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                {s.seatNumber && (
                                  <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-medium">
                                    Seat #{s.seatNumber}
                                  </span>
                                )}
                                {s.timing && (
                                  <span className="capitalize bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded font-medium">
                                    {s.timing}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Student Details Card */}
              {selectedStudent && (
                <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center justify-between font-medium text-slate-700 dark:text-slate-200">
                    <span>Student Information</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      Selected
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block">Name:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {selectedStudent.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block">Phone / Mobile:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {selectedStudent.mobile || "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block">Seat Number:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100">
                        {selectedStudent.seatNumber
                          ? `#${selectedStudent.seatNumber}`
                          : "Unassigned"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block">Shift / Timing:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-100 capitalize">
                        {selectedStudent.timing || "N/A"}
                      </span>
                    </div>
                    {selectedStudent.monthlyFee && (
                      <div className="col-span-2 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5 flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Standard Monthly Fee:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">
                          ₹{selectedStudent.monthlyFee}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
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
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Payment Date (Date/Month/Year)
                  </label>

                  <input
                    type="date"
                    required
                    value={form.paidAt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        paidAt: val,
                        forMonth: val ? val.slice(0, 7) : prev.forMonth,
                      }));
                    }}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    For Month (Cycle)
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
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
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
                  placeholder="Optional note"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingPayment(null);
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> {editingPayment ? "Updating..." : "Saving..."}</>
                  ) : (
                    editingPayment ? "Update Payment" : "Record Payment"
                  )}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;