import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { MdBusiness, MdLock, MdPerson, MdSave, MdPalette, MdLightMode, MdDarkMode } from "react-icons/md";

const SettingsSection = ({ icon: Icon, title, subtitle, children }) => (
  <div className="card p-6 border border-slate-100 dark:border-slate-700 space-y-5">
    <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-700">
      <div className="h-10 w-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div>
        <p className="font-semibold text-slate-800 dark:text-slate-100">{title}</p>
        {subtitle && <p className="text-sm text-slate-400 dark:text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </div>
);

const Settings = () => {
  const { admin } = useAuth();
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const [form, setForm] = useState(null);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await api.get("/settings");
      return res.data.data;
    },
    staleTime: 60 * 1000,
  });

  useEffect(() => {
    if (settingsData) {
      setForm(settingsData);
    }
  }, [settingsData]);

  const saveMutation = useMutation({
    mutationFn: (updatedSettings) => api.put("/settings", updatedSettings),
    onSuccess: (res) => {
      queryClient.setQueryData(["settings"], res.data.data);
      toast.success("Settings updated");
    },
    onError: () => {
      toast.error("Failed to update settings");
    },
  });

  const pwMutation = useMutation({
    mutationFn: (passwords) => api.put("/auth/change-password", passwords),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "" });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to change password");
    },
  });

  const handleSave = (e) => {
    e.preventDefault();
    if (form) {
      saveMutation.mutate(form);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    if (form) {
      const updated = { ...form, theme: newTheme };
      setForm(updated);
      saveMutation.mutate(updated);
    }
  };

  const handlePasswordChange = (e) => {
    e.preventDefault();
    pwMutation.mutate(pwForm);
  };

  if (isLoading || !form) {
    return (
      <div className="space-y-4 max-w-2xl">
        <div className="skeleton h-7 w-40 rounded" />
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="skeleton h-40 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      {/* Page Header */}
      <div>
        <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1">Configuration</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-heading">Settings</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500">Library configuration and admin profile</p>
      </div>

      {/* Theme / Appearance Section */}
      <SettingsSection icon={MdPalette} title="Theme & Appearance" subtitle="Choose your preferred interface theme">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all text-center ${
              theme === "light"
                ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 font-bold"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
            }`}
          >
            <MdLightMode size={24} className={theme === "light" ? "text-amber-500" : "text-slate-400"} />
            <span className="text-sm">Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2.5 transition-all text-center ${
              theme === "dark"
                ? "border-primary-500 bg-primary-50/50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 font-bold"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400"
            }`}
          >
            <MdDarkMode size={24} className={theme === "dark" ? "text-primary-400" : "text-slate-400"} />
            <span className="text-sm">Dark Mode</span>
          </button>
        </div>
      </SettingsSection>

      {/* Library Details */}
      <SettingsSection icon={MdBusiness} title="Library Details" subtitle="Update your library's public information">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Library Name</label>
              <input
                value={form.libraryName}
                onChange={(e) => setForm({ ...form, libraryName: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Tagline</label>
              <input
                value={form.tagline}
                onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                className="input-field"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Contact Phone</label>
              <input
                value={form.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Contact Email</label>
              <input
                value={form.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Default Monthly Fee (₹)</label>
              <input
                type="number"
                value={form.defaultMonthlyFee}
                onChange={(e) =>
                  setForm({ ...form, defaultMonthlyFee: Number(e.target.value) })
                }
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Max Seats</label>
              <input
                type="number"
                disabled
                value={form.maxSeats}
                className="input-field disabled:bg-slate-50 dark:disabled:bg-slate-900 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Opening Time</label>
              <input
                type="time"
                value={form.openTime}
                onChange={(e) => setForm({ ...form, openTime: e.target.value })}
                className="input-field"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Closing Time</label>
              <input
                type="time"
                value={form.closeTime}
                onChange={(e) => setForm({ ...form, closeTime: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
          <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
            <MdSave size={17} />
            {saveMutation.isPending ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </SettingsSection>

      {/* Admin Profile */}
      <SettingsSection icon={MdPerson} title="Admin Profile" subtitle="Your account information">
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-xl shadow-sm shadow-primary-500/20">
            {admin?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100 text-base">{admin?.name}</p>
            <p className="text-sm text-slate-400 dark:text-slate-500">{admin?.email}</p>
            <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900">
              Administrator
            </span>
          </div>
        </div>
      </SettingsSection>

      {/* Change Password */}
      <SettingsSection icon={MdLock} title="Change Password" subtitle="Update your admin account password">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">Current Password</label>
            <input
              type="password"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="input-field"
              placeholder="Enter current password"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1.5 block">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              className="input-field"
              placeholder="Minimum 6 characters"
            />
          </div>
          <button type="submit" disabled={pwMutation.isPending} className="btn-primary flex items-center gap-2">
            <MdLock size={17} />
            {pwMutation.isPending ? "Updating..." : "Update Password"}
          </button>
        </form>
      </SettingsSection>
    </div>
  );
};

export default Settings;
