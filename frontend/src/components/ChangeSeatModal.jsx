import { useState, useEffect, useCallback } from "react";
import { MdClose, MdCheckCircle, MdError, MdSwapHoriz } from "react-icons/md";
import api from "../api/axios";
import toast from "react-hot-toast";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";

const ChangeSeatModal = ({ student, onClose, onTransferred }) => {
  useBodyScrollLock(true);
  const [newSeatNumber, setNewSeatNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [checking, setChecking] = useState(false);
  const [isSameSeat, setIsSameSeat] = useState(false);

  const checkAvailability = useCallback(async () => {
    const num = Number(newSeatNumber);
    if (!newSeatNumber || isNaN(num) || num < 1 || num > 100) {
      setAvailability(null);
      setIsSameSeat(false);
      return;
    }

    if (num === student.seatNumber) {
      setIsSameSeat(true);
      setAvailability(null);
      setChecking(false);
      return;
    }

    setIsSameSeat(false);
    setChecking(true);
    try {
      const res = await api.get(`/seats/${num}/availability`, {
        params: { timing: student.timing },
      });
      setAvailability(res.data.data);
    } catch {
      setAvailability(null);
    } finally {
      setChecking(false);
    }
  }, [newSeatNumber, student?.seatNumber, student?.timing]);

  useEffect(() => {
    const t = setTimeout(checkAvailability, 350);
    return () => clearTimeout(t);
  }, [checkAvailability]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetSeatNumber = Number(newSeatNumber);
    if (!targetSeatNumber || targetSeatNumber === student.seatNumber) return;

    setSaving(true);
    try {
      // Resolve entered seat number to its MongoDB _id
      const seatsRes = await api.get("/seats");
      const seats = seatsRes.data?.data || [];
      const targetSeat = seats.find((s) => s.seatNumber === targetSeatNumber);

      if (!targetSeat) {
        toast.error(`Seat #${targetSeatNumber} not found`);
        setSaving(false);
        return;
      }

      await api.put("/seats/transfer", {
        studentId: student._id,
        newSeatId: targetSeat._id,
      });

      toast.success("Seat transferred successfully");
      if (onTransferred) onTransferred();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Seat transfer failed");
    } finally {
      setSaving(false);
    }
  };

  const isFormInvalid =
    !newSeatNumber ||
    isSameSeat ||
    checking ||
    (availability && !availability.available) ||
    Number(newSeatNumber) < 1 ||
    Number(newSeatNumber) > 100;

  return (
    <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-3 pt-6 pb-6 sm:p-4 touch-none">
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none w-full max-w-md flex flex-col overflow-hidden border border-slate-100 dark:border-slate-700 max-h-[82dvh] sm:max-h-[90vh] transition-all transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 shrink-0 bg-white dark:bg-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center shrink-0">
              <MdSwapHoriz size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-slate-100 font-heading text-base sm:text-lg">Change Seat</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Transfer student to another seat</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Form Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 touch-pan-y">
            {/* Student Current Info Card */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700/60 space-y-1">
              <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">Student Details</p>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student?.name}</p>
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-0.5">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 font-semibold">
                  Currently: Seat #{student?.seatNumber}
                </span>
                <span className="capitalize text-slate-500 dark:text-slate-400">
                  • Shift: {student?.timing}
                </span>
              </div>
            </div>

            {/* New Seat Input */}
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block" htmlFor="newSeatNumber">
                New Seat Number *
              </label>
              <input
                id="newSeatNumber"
                type="number"
                min="1"
                max="100"
                required
                value={newSeatNumber}
                onChange={(e) => setNewSeatNumber(e.target.value)}
                className="input-field"
                placeholder="Enter new seat number (1-100)"
              />
            </div>

            {/* Live Availability Feedback Banner */}
            {isSameSeat && (
              <div className="flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <MdError size={17} /> This is already their current seat
              </div>
            )}

            {!isSameSeat && newSeatNumber && (checking || availability !== null) && (
              <div
                className={`flex items-center gap-2 text-sm px-3.5 py-2.5 rounded-xl border ${
                  checking
                    ? "bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-700"
                    : availability?.available
                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                    : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800"
                }`}
              >
                {checking ? (
                  "Checking availability..."
                ) : availability?.available ? (
                  <>
                    <MdCheckCircle size={17} /> Seat #{newSeatNumber} is free for the {student?.timing} shift
                  </>
                ) : (
                  <>
                    <MdError size={17} /> Seat #{newSeatNumber} is already booked for an overlapping shift
                  </>
                )}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0 flex gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isFormInvalid}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Transferring...
                </>
              ) : (
                "Transfer Seat"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangeSeatModal;
