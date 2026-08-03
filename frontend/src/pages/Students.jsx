import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdPeopleOutline, MdPhone } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import StudentModal from "../components/StudentModal";
import { TableSkeleton, EmptyState } from "../components/LoadingSkeleton";

const Students = () => {
  const [searchParams] = useSearchParams();
  const initialUrlQuery = searchParams.get("search") || "";

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialUrlQuery);
  const [feeStatus, setFeeStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // Sync state if URL search param changes (e.g. user submits a new search from Navbar)
  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearch(query);
      setPage(1);
    }
  }, [searchParams]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/students", {
        params: { search, feeStatus, page, limit: 10 },
      });
      setStudents(res.data.data);
      setTotalPages(res.data.meta.totalPages || 1);
    } catch {
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [search, feeStatus, page]);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this student? This will also free up their seat.")) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted");
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Delete failed");
    }
  };

  const handleRenew = async (id) => {
    try {
      await api.put(`/students/${id}/renew`);
      toast.success("Membership renewed for 30 days");
      fetchStudents();
    } catch (err) {
      toast.error(err.response?.data?.message || "Renewal failed");
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Management</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">Students</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500">Manage memberships, seats &amp; fee status</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 w-full sm:w-fit justify-center"
        >
          <MdAdd size={18} /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="Search by name, mobile, or email..."
            className="input-field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={feeStatus}
            onChange={(e) => {
              setPage(1);
              setFeeStatus(e.target.value);
            }}
            className="input-field flex-1 sm:w-48"
          >
            <option value="">All Fee Status</option>
            <option value="paid">Paid</option>
            <option value="due">Due</option>
            <option value="partial">Partial</option>
          </select>
          <button
            onClick={fetchStudents}
            className="btn-secondary flex items-center gap-2 justify-center px-3.5 shrink-0"
            title="Refresh"
          >
            <MdRefresh size={18} />
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div className="card p-4 sm:p-5 border border-slate-100 dark:border-slate-700">
        {loading ? (
          <TableSkeleton rows={7} cols={6} />
        ) : students.length === 0 ? (
          <EmptyState
            icon={MdPeopleOutline}
            title="No students found"
            subtitle="Try adjusting your search or add a new student"
          />
        ) : (
          <>
            {/* Mobile Card View (< sm) */}
            <div className="block sm:hidden space-y-3">
              {students.map((s) => (
                <div
                  key={s._id}
                  className="bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center font-bold text-sm shrink-0">
                        {s.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-100 text-base leading-tight">{s.name}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-1">
                          <MdPhone size={12} /> {s.mobile}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold shrink-0">
                      Seat #{s.seatNumber}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                    <div>
                      <span className="text-slate-400 dark:text-slate-500 block">Fee Status</span>
                      <StatusBadge status={s.feeStatus} />
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 dark:text-slate-500 block">Expiry</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {new Date(s.expiryDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <button
                      onClick={() => handleRenew(s._id)}
                      className="text-xs px-3 py-2 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 font-bold transition-colors min-h-[38px] flex items-center"
                    >
                      Renew 30d
                    </button>
                    <button
                      onClick={() => {
                        setEditingStudent(s);
                        setModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Edit"
                    >
                      <MdEdit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 min-h-[38px] min-w-[38px] flex items-center justify-center"
                      title="Delete"
                    >
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= sm) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                    <th className="pb-3 font-medium">Student</th>
                    <th className="pb-3 font-medium">Mobile</th>
                    <th className="pb-3 font-medium">Seat</th>
                    <th className="pb-3 font-medium">Expiry</th>
                    <th className="pb-3 font-medium">Fee</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr
                      key={s._id}
                      className="border-b border-slate-50 dark:border-slate-700/60 last:border-0 hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors group"
                    >
                      <td className="py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                            {s.name?.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800 dark:text-slate-100">{s.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">{s.mobile}</td>
                      <td className="py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                          #{s.seatNumber}
                        </span>
                      </td>
                      <td className="py-3.5 text-slate-500 dark:text-slate-400">
                        {new Date(s.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={s.feeStatus} />
                      </td>
                      <td className="py-3.5">
                        <StatusBadge status={s.membershipStatus} />
                      </td>
                      <td className="py-3.5">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleRenew(s._id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 font-semibold transition-colors min-h-[36px] flex items-center"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Edit"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                            title="Delete"
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-5 border-t border-slate-50 dark:border-slate-700 mt-4">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary px-4 py-1.5 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary px-4 py-1.5 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {modalOpen && (
        <StudentModal
          student={editingStudent}
          onClose={() => setModalOpen(false)}
          onSaved={fetchStudents}
        />
      )}
    </div>
  );
};

export default Students;
