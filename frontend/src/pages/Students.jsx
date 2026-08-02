import { useEffect, useState, useCallback } from "react";
import { MdAdd, MdSearch, MdEdit, MdDelete, MdRefresh, MdPeopleOutline } from "react-icons/md";
import toast from "react-hot-toast";
import api from "../api/axios";
import StatusBadge from "../components/StatusBadge";
import StudentModal from "../components/StudentModal";
import { TableSkeleton, EmptyState } from "../components/LoadingSkeleton";

const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feeStatus, setFeeStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

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
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Students</h1>
          <p className="text-sm text-slate-400">Manage student memberships and details</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <MdAdd size={18} /> Add Student
        </button>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
        <select
          value={feeStatus}
          onChange={(e) => {
            setPage(1);
            setFeeStatus(e.target.value);
          }}
          className="input-field sm:w-48"
        >
          <option value="">All Fee Status</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="partial">Partial</option>
        </select>
        <button onClick={fetchStudents} className="btn-secondary flex items-center gap-2 justify-center">
          <MdRefresh size={18} />
        </button>
      </div>

      <div className="card p-5">
        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : students.length === 0 ? (
          <EmptyState icon={MdPeopleOutline} title="No students found" subtitle="Try adjusting your search or add a new student" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Mobile</th>
                    <th className="pb-3 font-medium">Seat</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Expiry</th>
                    <th className="pb-3 font-medium">Fee Status</th>
                    <th className="pb-3 font-medium hidden sm:table-cell">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="py-3 font-medium text-slate-700">{s.name}</td>
                      <td className="py-3 text-slate-500">{s.mobile}</td>
                      <td className="py-3 text-slate-500">#{s.seatNumber}</td>
                      <td className="py-3 text-slate-500 hidden sm:table-cell">{new Date(s.expiryDate).toLocaleDateString()}</td>
                      <td className="py-3"><StatusBadge status={s.feeStatus} /></td>
                      <td className="py-3 hidden sm:table-cell"><StatusBadge status={s.membershipStatus} /></td>
                      <td className="py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRenew(s._id)}
                            className="text-xs px-2 py-1 rounded-md bg-primary-50 text-primary-600 hover:bg-primary-100"
                          >
                            Renew
                          </button>
                          <button
                            onClick={() => {
                              setEditingStudent(s);
                              setModalOpen(true);
                            }}
                            className="p-1.5 rounded-md text-slate-400 hover:text-primary-600 hover:bg-primary-50"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50"
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

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-5">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-sm text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
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
