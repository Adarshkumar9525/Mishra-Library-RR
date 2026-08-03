import { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { MdMenuBook, MdEmail, MdArrowBack, MdCheckCircleOutline } from "react-icons/md";
import api from "../api/axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSubmitted(true);
      toast.success("Reset link sent if account exists");
    } catch {
      // Security: always present same generic success state
      setSubmitted(true);
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
            Reading Room ERP — Account Recovery
          </p>
        </div>

        {/* Card */}
        <div className="card border border-slate-100 dark:border-slate-700 p-8 space-y-6">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <MdCheckCircleOutline size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Check your email</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                If an account exists for <span className="font-semibold text-slate-700 dark:text-slate-200">{email}</span>, you will receive a password reset link shortly.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                >
                  <MdArrowBack size={18} />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Forgot Password?</h2>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">
                  Enter your registered admin email address to receive a password reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={17} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@mishralibrary.com"
                      className="input-field pl-10"
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
                      Sending reset link...
                    </>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="text-center pt-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  >
                    <MdArrowBack size={16} />
                    Back to Login
                  </Link>
                </div>
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

export default ForgotPassword;
