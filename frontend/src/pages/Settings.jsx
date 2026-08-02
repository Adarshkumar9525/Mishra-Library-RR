import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const { admin } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    api
      .get("/settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => toast.error("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/settings", settings);
      setSettings(res.data.data);
      toast.success("Settings updated");
    } catch {
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", pwForm);
      toast.success("Password changed successfully");
      setPwForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setPwSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-slate-800">Settings</h1>
        <p className="text-sm text-slate-400">Library configuration and admin profile</p>
      </div>

      <form onSubmit={handleSave} className="card p-6 space-y-4">
        <p className="font-semibold text-slate-700">Library Details</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-600 mb-1 block">Library Name</label>
            <input
              value={settings.libraryName}
              onChange={(e) => setSettings({ ...settings, libraryName: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-600 mb-1 block">Tagline</label>
            <input
              value={settings.tagline}
              onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
              className="input-field"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-slate-600 mb-1 block">Address</label>
            <input
              value={settings.address}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Contact Phone</label>
            <input
              value={settings.contactPhone}
              onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Contact Email</label>
            <input
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Default Monthly Fee (₹)</label>
            <input
              type="number"
              value={settings.defaultMonthlyFee}
              onChange={(e) => setSettings({ ...settings, defaultMonthlyFee: Number(e.target.value) })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Max Seats</label>
            <input
              type="number"
              disabled
              value={settings.maxSeats}
              className="input-field disabled:bg-slate-50"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Opening Time</label>
            <input
              type="time"
              value={settings.openTime}
              onChange={(e) => setSettings({ ...settings, openTime: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600 mb-1 block">Closing Time</label>
            <input
              type="time"
              value={settings.closeTime}
              onChange={(e) => setSettings({ ...settings, closeTime: e.target.value })}
              className="input-field"
            />
          </div>
        </div>
        <button type="submit" disabled={saving} className="btn-primary">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>

      <div className="card p-6 space-y-4">
        <p className="font-semibold text-slate-700">Admin Profile</p>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold">
            {admin?.name?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-slate-700">{admin?.name}</p>
            <p className="text-sm text-slate-400">{admin?.email}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePasswordChange} className="card p-6 space-y-4">
        <p className="font-semibold text-slate-700">Change Password</p>
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">Current Password</label>
          <input
            type="password"
            required
            value={pwForm.currentPassword}
            onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            className="input-field"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 mb-1 block">New Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={pwForm.newPassword}
            onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            className="input-field"
          />
        </div>
        <button type="submit" disabled={pwSaving} className="btn-primary">
          {pwSaving ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
};

export default Settings;
