import { useState } from "react";
import { MdSearch, MdNotifications, MdLogout, MdMenu } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Navbar = ({ onMenuClick }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-100 px-3 sm:px-4 md:px-6 py-3 flex items-center justify-between gap-2">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-50 shrink-0"
      >
        <MdMenu size={22} />
      </button>

      <div className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 w-full max-w-xs md:w-72 border border-slate-100">
        <MdSearch className="text-slate-400 shrink-0" size={18} />
        <input
          type="text"
          placeholder="Search students, seats, payments..."
          className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400"
        />
      </div>

      <p className="hidden lg:block text-sm text-slate-500">{today}</p>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto">
        <button className="relative p-2 rounded-lg hover:bg-slate-50 text-slate-500">
          <MdNotifications size={20} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2"
          >
            <div className="h-9 w-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm shrink-0">
              {admin?.name?.charAt(0) || "A"}
            </div>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-card border border-slate-100 py-1 z-30">
              <div className="px-4 py-2 border-b border-slate-100">
                <p className="text-sm font-medium text-slate-800">{admin?.name}</p>
                <p className="text-xs text-slate-400 truncate">{admin?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <MdLogout size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
