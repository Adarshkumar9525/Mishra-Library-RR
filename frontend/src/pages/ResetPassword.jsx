import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdMenuBook, MdLock, MdErrorOutline, MdArrowForward } from "react-icons/md";
import api from "../api/axios";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (form.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.post(`/auth/reset-password/${token}`, {
        newPassword: form.newPassword,
      });
      toast.success(res.data.message || "Password reset successfully!");
      navigate("/login");
    } catch (err) {
      const message = err.response?.data?.message || "Failed to reset password. Link may be invalid or expired.";
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 dark:bg-slate-900 transition-colors duration-200 px-4">
      {/* Ambient background blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-100/60 dark:bg-primary-950/40 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-indigo-100/50 dark:bg-indigo-950/40 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-[22px] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-xl shadow-primary-500/30 mb-5">
            <MdMenuBook size={34} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 font-heading tracking-tight">
            Mishra Library
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
            Reading Room ERP — Set New Password
          </p>
        </div>

        {/* Card */}
        <div className="card border border-slate-100 dark:border-slate-700 p-8 space-y-6">
          {errorMsg ? (
            <div className="text-center space-y-4 py-2">
              <div className="h-14 w-14 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <MdErrorOutline size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Reset Failed</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{errorMsg}</p>
              <div className="pt-2">
                <Link
                  to="/forgot-password"
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                >
                  Request New Reset Link
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reset your password</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  Enter your new password below.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={form.newPassword}
                      onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                      placeholder="Minimum 6 characters"
                      className="input-field pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors text-xs font-medium"
                    >
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                      placeholder="Repeat new password"
                      className="input-field pl-10 pr-10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-3 flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Resetting password...
                    </>
                  ) : (
                    <>
                      Reset Password
                      <MdArrowForward size={18} />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            © {new Date().getFullYear()} Mishra Library. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
