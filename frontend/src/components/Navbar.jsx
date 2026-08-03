import { useState, useEffect, useRef } from "react";
import { MdSearch, MdNotifications, MdLogout, MdMenu, MdClose, MdLightMode, MdDarkMode } from "react-icons/md";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const Navbar = ({ onMenuClick }) => {
  const { admin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // Search state
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef(null);

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

  const initials = admin?.name
    ? admin.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "A";

  // Debounced student search effect (300ms)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setDropdownOpen(false);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/students", {
          params: { search: query.trim(), limit: 5 },
        });
        setResults(res.data.data || []);
        setDropdownOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click/tap
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleNavigateToStudents = (searchTerm) => {
    setDropdownOpen(false);
    const term = searchTerm || query.trim();
    if (term) {
      navigate(`/students?search=${encodeURIComponent(term)}`);
    } else {
      navigate("/students");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault();
      handleNavigateToStudents(query.trim());
    } else if (e.key === "Escape") {
      setDropdownOpen(false);
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setDropdownOpen(false);
  };

  return (
    <header className="no-print sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-3 sm:px-5 py-3 flex items-center justify-between gap-3 transition-colors duration-200">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-1 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
        aria-label="Open sidebar"
      >
        <MdMenu size={22} />
      </button>

      {/* Search bar container */}
      <div ref={searchRef} className="relative hidden sm:block w-full max-w-xs md:w-80">
        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:border-primary-500 dark:focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/20 rounded-xl px-3.5 py-2 border border-slate-200 dark:border-slate-700 transition-all duration-200">
          <MdSearch className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setDropdownOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search students (name, phone)..."
            className="bg-transparent outline-none text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-700 dark:text-slate-100"
          />
          {searching ? (
            <div className="w-4 h-4 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors shrink-0"
              title="Clear search"
            >
              <MdClose size={16} />
            </button>
          ) : null}
        </div>

        {/* Live Autocomplete Dropdown */}
        {dropdownOpen && query.trim() && (
          <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none border border-slate-100 dark:border-slate-700 py-2 z-30 animate-in fade-in slide-in-from-top-1 duration-150 overflow-hidden">
            <div className="px-3.5 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Matching Students
            </div>
            {searching ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-primary-600 dark:border-primary-400 border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            ) : results.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No matching students found
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700/60">
                {results.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => handleNavigateToStudents(student.name)}
                    className="px-3.5 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {student.name?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">{student.name}</p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">{student.mobile || "No phone"}</p>
                      </div>
                    </div>
                    {student.seatNumber && (
                      <span className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md shrink-0">
                        Seat #{student.seatNumber}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div
              onClick={() => handleNavigateToStudents(query.trim())}
              className="px-3.5 py-2 mt-1 bg-slate-50 dark:bg-slate-900/60 hover:bg-primary-50 dark:hover:bg-primary-950/50 text-primary-700 dark:text-primary-400 text-xs font-semibold text-center cursor-pointer transition-colors border-t border-slate-100 dark:border-slate-700"
            >
              View all results for &quot;{query.trim()}&quot; →
            </div>
          </div>
        )}
      </div>

      {/* Date */}
      <p className="hidden xl:block text-xs text-slate-400 dark:text-slate-500 font-medium whitespace-nowrap ml-2">{today}</p>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2 ml-auto">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 active:scale-90"
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
        >
          {theme === "dark" ? (
            <MdLightMode size={20} className="text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
          ) : (
            <MdDarkMode size={20} className="text-slate-600 transition-transform duration-300 rotate-0 hover:-rotate-12" />
          )}
        </button>

        {/* Notification bell */}
        <button className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors" aria-label="Notifications">
          <MdNotifications size={20} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm shadow-primary-500/30">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-none">{admin?.name}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">Admin</p>
            </div>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-20" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-elevated dark:shadow-none border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{admin?.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{admin?.email}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-medium"
                >
                  <MdLogout size={16} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
