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
  MdChevronLeft,
  MdChevronRight,
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
      {/* Backdrop - visible on mobile when drawer is open */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-30 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`no-print fixed left-0 top-0 h-screen bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800 shadow-card dark:shadow-none transition-all duration-300 z-40 flex flex-col
          w-64 ${collapsed ? "md:w-20" : "md:w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo & Brand */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100/90 dark:border-slate-800">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-primary-500/20 shrink-0">
            <MdMenuBook size={22} />
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="font-bold text-slate-800 dark:text-slate-100 leading-tight font-heading truncate">
                Mishra Library
              </p>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium tracking-wide">
                Reading Room ERP
              </p>
            </div>
          )}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "bg-gradient-to-r from-primary-50 to-primary-100/60 dark:from-primary-950/60 dark:to-primary-900/40 text-primary-700 dark:text-primary-400 font-semibold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary-600 dark:bg-primary-400 rounded-r-full" />
                  )}
                  <Icon
                    size={20}
                    className={`shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-primary-600 dark:text-primary-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer & Collapse Toggle */}
        {!collapsed && (
          <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Developed by <span className="text-slate-600 dark:text-slate-300 font-semibold">Adarsh Kumar</span>
            </p>
          </div>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="m-3 p-2.5 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-800 transition-colors hidden md:flex items-center justify-center gap-1 font-medium"
        >
          {collapsed ? (
            <MdChevronRight size={18} />
          ) : (
            <>
              <MdChevronLeft size={18} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
