import type { LucideIcon } from "lucide-react";
import {
  CalendarIcon,
  ChevronRightIcon,
  IndianRupee,
  FileTextIcon,
  LayoutGridIcon,
  MenuIcon,
  SettingsIcon,
  UserIcon,
  XIcon,
  LogOutIcon,
  Loader2,
  Award,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../api/axios";

type NavItem = {
  name: string;
  href: string;
  icon: LucideIcon;
};

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [fetchedName, setFetchedName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    api.get("/profile")
      .then(({ data }) => {
        if (data && data.firstName) {
          setFetchedName(`${data.firstName} ${data.lastName || ""}`.trim());
        }
      })
      .catch(() => { });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const role = user?.role;
  const isAdmin = role === "ADMIN";
  const formattedEmailName = user?.email ? user.email.split("@")[0] : "";
  const userName =
    fetchedName || user?.name || formattedEmailName;

  const navItems: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutGridIcon },
    ...(isAdmin
      ? [{ name: "Employees", href: "/employees", icon: UserIcon }]
      : [{ name: "Attendance", href: "/attendance", icon: CalendarIcon }]),
    { name: "Leave", href: "/leave", icon: FileTextIcon },
    { name: "Payslips", href: "/payslips", icon: IndianRupee },
    {
      name: isAdmin ? "KPA & Appraisal" : "My KPA Scorecard",
      href: isAdmin ? "/kpa" : "/kpa/scorecard",
      icon: Award,
    },
    { name: "Settings", href: "/settings", icon: SettingsIcon },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const sidebarContent = (
    <>
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <UserIcon className="text-white size-7 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-[13px] text-white tracking-wide">
                DS Nexus
              </p>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                Employee Management System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1 transition-colors"
            aria-label="Close sidebar"
          >
            <XIcon size={20} />
          </button>
        </div>
      </div>

      {userName && (
        <div className="mx-3 mt-4 mb-1 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center ring-1 ring-white/10 shrink-0">
              <span className="text-slate-400 text-xs font-semibold">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-medium text-slate-200 truncate">
                {userName}
              </p>
              <p className="text-[11px] text-slate-500 truncate">
                {isAdmin ? "Administrator" : "Employee"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 pt-5 pb-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
          Navigation
        </p>
      </div>

      <nav
        className="flex-1 px-3 space-y-0.5 overflow-y-auto"
        aria-label="Main navigation"
      >
        {loading ? (
          <div>
            <Loader2 className="animate-spin w-4 h-4" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : (
          navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/dashboard"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-all duration-150 relative ${isActive
                  ? "bg-indigo-500/15 text-indigo-300"
                  : "text-slate-300 hover:text-white hover:bg-white/5"
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-indigo-500" />
                )}
                <Icon
                  className={`size-4 shrink-0 ${isActive
                    ? "text-indigo-400"
                    : "text-slate-400 group-hover:text-slate-300"
                    }`}
                />
                <span className="flex-1">{item.name}</span>
                {isActive && (
                  <ChevronRightIcon className="size-4 text-indigo-400" />
                )}
              </Link>
            );
          })
        )}
      </nav>

      <div className="p-3 border-t border-white/60">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-[13px] font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/8 transition-all duration-150">
          <LogOutIcon className="w-4.25 h-4.25" />
          <span className="ml-2 text-sm font-medium">Log Out</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-slate-900 text-white rounded-lg shadow-lg border border-white/10"
        aria-label="Open sidebar"
      >
        <MenuIcon size={20} />
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className="hidden lg:flex flex-col h-full w-65 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white shrink-0 border-r border-white/10">
        {sidebarContent}
      </aside>

      <aside
        className={`lg:hidden fixed inset-y-0 left-0 w-72 bg-linear-to-b from-slate-900 via-slate-900 to-slate-950 text-white z-50 flex flex-col transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
