import { useState, useEffect, useCallback } from "react";
import { MdClose, MdCheckCircle, MdError } from "react-icons/md";
import api from "../api/axios";
import toast from "react-hot-toast";

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const StudentModal = ({ student, onClose, onSaved }) => {
  const isEdit = Boolean(student);
  const [form, setForm] = useState({
    name: student?.name || "",
    fatherName: student?.fatherName || "",
    mobile: student?.mobile || "",
    email: student?.email || "",
    address: student?.address || "",
    seatNumber: student?.seatNumber || "",
    timing: student?.timing || "full-day",
    monthlyFee: student?.monthlyFee || 800,
    joiningDate: student?.joiningDate
      ? new Date(student.joiningDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    expiryDate: student?.expiryDate
      ? new Date(student.expiryDate).toISOString().slice(0, 10)
      : addDays(new Date().toISOString().slice(0, 10), 30),
  });
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState(null); // null | { available: bool }
  const [checking, setChecking] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // When joining date changes, auto-shift expiry to +30 days from it, since that's
  // the membership cycle. Admin can still overwrite the expiry field manually after.
  const handleJoiningDateChange = (e) => {
    const newJoiningDate = e.target.value;
    setForm((f) => ({ ...f, joiningDate: newJoiningDate, expiryDate: addDays(newJoiningDate, 30) }));
  };

  // Live-check whether the chosen seat is free for the chosen shift, so the admin
  // finds out about a shift conflict before submitting (not just on error toast).
  const checkAvailability = useCallback(async () => {
    if (isEdit || !form.seatNumber) {
      setAvailability(null);
      return;
    }
    setChecking(true);
    try {
      const res = await api.get(`/seats/${form.seatNumber}/availability`, {
        params: { timing: form.timing },
      });
      setAvailability(res.data.data);
    } catch {
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, [form.seatNumber, form.timing, isEdit]);

  useEffect(() => {
    const t = setTimeout(checkAvailability, 350);
    return () => clearTimeout(t);
  }, [checkAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/students/${student._id}`, form);
        toast.success("Student updated");
      } else {
        await api.post("/students", form);
        toast.success("Student added");
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl2 shadow-card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">{isEdit ? "Edit Student" : "Add Student"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <MdClose size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="name">Full Name</label>

<input
  id="name"
  name="name"
/>
              <input name="name" required value={form.name} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="fatherName">Father&apos;s Name</label>
              <input id="fatherName" name="fatherName" value={form.fatherName} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="mobile">Mobile</label>
              <input id="mobile" name="mobile" required value={form.mobile} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" value={form.email} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label htmlFor="seatNumber">Seat Number</label>
              <input
                id="seatNumber"
                name="seatNumber"
                type="number"
                min="1"
                max="100"
                required
                disabled={isEdit}
                value={form.seatNumber}
                onChange={handleChange}
                className="input-field disabled:bg-slate-50"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">Address</label>
              <textarea name="address" value={form.address} onChange={handleChange} className="input-field" rows={2} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Timing / Shift</label>
              <select name="timing" value={form.timing} onChange={handleChange} className="input-field">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="full-day">Full Day</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Monthly Fee (₹)</label>
              <input
                name="monthlyFee"
                type="number"
                min="0"
                value={form.monthlyFee}
                onChange={handleChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Joining Date</label>
              <input
                name="joiningDate"
                type="date"
                required
                value={form.joiningDate}
                onChange={handleJoiningDateChange}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Expiry Date</label>
              <input
                name="expiryDate"
                type="date"
                required
                value={form.expiryDate}
                onChange={handleChange}
                className="input-field"
              />
              <p className="text-xs text-slate-400 mt-1">Auto-set to +30 days; edit manually if needed</p>
            </div>
          </div>

          {/* Live availability feedback - a seat taken for "morning" shows AVAILABLE
              here the moment "evening" is picked, since shifts don't overlap. */}
          {!isEdit && form.seatNumber && (
            <div
              className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                checking
                  ? "bg-slate-50 text-slate-400"
                  : availability?.available
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {checking ? (
                "Checking availability..."
              ) : availability?.available ? (
                <>
                  <MdCheckCircle size={16} /> Seat {form.seatNumber} is free for the {form.timing} shift
                </>
              ) : (
                <>
                  <MdError size={16} /> Seat {form.seatNumber} is already booked for an overlapping shift
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!isEdit && availability && !availability.available)}
              className="btn-primary flex-1"
            >
              {saving ? "Saving..." : isEdit ? "Update Student" : "Add Student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentModal;
