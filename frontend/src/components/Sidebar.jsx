import { NavLink } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdEventSeat,
  MdPayments,
  MdAssessment,
  MdVideocam,
  MdSettings,
  MdMenuBook,
  MdClose,
} from "react-icons/md";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: MdDashboard },
  { to: "/students", label: "Students", icon: MdPeople },
  { to: "/seats", label: "Seats", icon: MdEventSeat },
  { to: "/payments", label: "Payments", icon: MdPayments },
  { to: "/reports", label: "Reports", icon: MdAssessment },
  { to: "/cctv", label: "CCTV", icon: MdVideocam },
  { to: "/settings", label: "Settings", icon: MdSettings },
];

const Sidebar = ({ collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  return (
    <>
      {/* Backdrop - only visible on mobile when the drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 shadow-soft transition-all duration-300 z-40 flex flex-col
          w-64 ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-soft shrink-0">
            <MdMenuBook size={22} />
          </div>
          {!collapsed && (
            <div className="flex-1">
              <p className="font-bold text-slate-800 leading-tight">Mishra Library</p>
              <p className="text-xs text-slate-400">Reading Room ERP</p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <MdClose size={20} />
          </button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <p className="px-5 pb-1 text-[11px] text-slate-300">Developed by Adarsh Kumar</p>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-3 py-2 text-xs text-slate-400 hover:text-slate-600 border-t border-slate-100 pt-3 hidden md:block"
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
