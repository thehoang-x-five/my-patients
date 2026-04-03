import React, { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { useUI } from "../../context/UIContext.jsx";
import { useAuthStore } from "../stores/appStore.js";
import { TAB_VISIBILITY } from "../../utils/permissions.js";

// Định nghĩa tất cả links + key phân quyền theo TAB_VISIBILITY (Week 4 RBAC)
const allLinks = [
  ["/", "Tổng quan", "index", "overview"],
  ["/appointments", "Lịch hẹn", "appointments", "appointments"],
  ["/patients", "Bệnh nhân", "patients", "patients"],
  ["/examination", "Khám bệnh", "examinations", "examination"],
  ["/departments", "Khoa phòng", "departments", "departments"],
  ["/staff", "Nhân sự", "staff", "staff"],
  ["/admin/users", "QL Nhân viên", "admin_users", "userManagement"],
  ["/prescriptions", "Đơn thuốc", "prescriptions", "prescriptions"],
  ["/history", "Lịch sử", "history", "history"],
  ["/notifications", "Thông báo", "notifications", "notifications"],
  ["/reports", "Báo cáo", "reports", "reports"],
];

const iconMap = {
  index: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path
        d="M4 11h16M4 17h10M10 5h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  appointments: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <rect
        x="3"
        y="4"
        width="18"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 3v4M16 3v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  patients: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M5 19.5c.9-2.6 3.5-4.5 7-4.5s6.1 1.9 7 4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  examinations: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 12h6M12 9v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  ),
  departments: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path
        d="M4 11h6V4H4v7Zm10 9h6v-7h-6v7Zm0-9h6V4h-6v7Zm-10 9h6v-7H4v7Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  staff: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="17"
        cy="8"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M3.5 18c.7-2.2 2.3-3.5 4.5-3.5S11.8 15.8 12.5 18M14.5 17.5c.5-1.3 1.7-2.2 3-2.2 1.3 0 2.4.8 3 2.1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  admin_users: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <circle cx="12" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19c1-3 3.5-5 7-5s6 2 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M19 14l1.5 1.5L19 17"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  prescriptions: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <rect
        x="5"
        y="3"
        width="14"
        height="18"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 8h6M9 12h4M9 16h3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  history: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <circle
        cx="12"
        cy="12"
        r="7"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8v4l2.5 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  notifications: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <path
        d="M6 10a6 6 0 0 1 12 0v4.5l1.5 2.5H4.5L6 14.5V10Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 19.5c.5.6 1.2 1 2 1s1.5-.4 2-1"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  reports: () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8 14.5 10.5 11l2.5 3 3.5-5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};


export default function Sidebar() {
  const { collapsed, setCollapsed, t, lang, setLang, theme, setTheme } =
    useUI();
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(null);
  const user = useAuthStore((s) => s.user);

  // Lọc menu theo vai trò user đang đăng nhập (TAB_VISIBILITY)
  const links = useMemo(
    () => allLinks.filter(([, , , permKey]) => {
      const checker = TAB_VISIBILITY[permKey];
      return checker ? checker(user) : true;
    }),
    [user]
  );

  const activeKey = useMemo(
    () => links.find(([to]) => to === pathname)?.[0] || null,
    [pathname, links]
  );

  return (
    <aside
      className="fixed inset-y-0 left-0 bg-white/90 dark:bg-slate-950/95 
                 border-r border-slate-200/80 dark:border-slate-800/80 
                 shadow-xl shadow-sky-100/60 dark:shadow-black/40
                 backdrop-blur-xl z-10 transition-[width] duration-200 sidebar-w"
      aria-label="Thanh điều hướng"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        {!collapsed && (
          <div className="flex items-center gap-3 px-1">
            <div className="relative">
              <div className="absolute inset-0 blur-md bg-gradient-to-tr from-cyan-400 via-sky-500 to-rose-300 opacity-70" />
              <div className="relative w-8 h-8 rounded-2xl bg-slate-950/90 flex items-center justify-center text-sky-100">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none">
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path
                    d="M8 12h8M12 8v8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <b className="text-sm tracking-tight">HealthCare</b>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 text-[10px] font-medium px-2 py-0.5 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/40 dark:text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.brandSub}
              </div>
            </div>
          </div>
        )}

        <Button
          aria-label={collapsed ? "Mở menu" : "Thu gọn menu"}
          title={collapsed ? "Mở menu" : "Thu gọn menu"}
          variant="ghost"
          className="!p-1.5 rounded-xl hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
          onClick={() => setCollapsed((v) => !v)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            className={`${collapsed ? "" : "rotate-180"} transition`}
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </Button>
      </div>

      {!collapsed && (
        <div className="flex items-center justify-between px-3 pb-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
          <span>{t.menu}</span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200 border border-sky-100 dark:border-sky-600/40">
            <span className="h-1 w-1 rounded-full bg-sky-400" />
            Today flow
          </span>
        </div>
      )}

      {/* Nav */}
      {!collapsed && (
        <nav
          className="overflow-y-auto scrollbar-none h-[calc(100%-190px)] px-2 pt-1"
          role="navigation"
          aria-label={t.menu}
        >
          <ul className="flex flex-col gap-2 relative">
            {links.map(([to, label, key]) => {
              const isActive = activeKey === to;
              const isHover = hovered === to;
              const Icon = iconMap[key];

              return (
                <li
                  key={to}
                  className="relative"
                  onMouseEnter={() => setHovered(to)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* ACTIVE blob */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active"
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-tr from-cyan-400/95 via-sky-300/100 to-cyan-100 shadow-[0_18px_45px_rgba(56,189,248,0.45)] z-0"
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 36,
                        mass: 0.6,
                      }}
                    />
                  )}

                  {/* HOVER film */}
                  {isHover && !isActive && (
                    <motion.span
                      layoutId="nav-hover"
                      className="pointer-events-none absolute inset-0 rounded-2xl bg-sky-50/80 ring-1 ring-sky-100 dark:bg-slate-800/50 dark:ring-slate-600/60 z-10"
                      transition={{
                        type: "spring",
                        stiffness: 640,
                        damping: 28,
                        mass: 0.5,
                      }}
                    />
                  )}

                  <NavLink
                    to={to}
                    end
                    className={({ isActive: active }) =>
                      [
                        "relative z-20 btn w-full justify-start px-3 py-2.5 rounded-2xl border border-slate-100/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60",
                        active || isHover
                          ? "!border-transparent !bg-transparent"
                          : "hover:bg-slate-100/90 dark:hover:bg-slate-800/80",
                        active
                          ? "text-white"
                          : isHover
                            ? "text-brand-700"
                            : "text-slate-700 dark:text-slate-100",
                        !active && !isHover ? "hover:-translate-y-0.5" : "",
                        "transition-all duration-150",
                      ].join(" ")
                    }
                  >
                    <div className="flex items-center gap-3 w-full">
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-xl text-xs transition-all",
                          isActive
                            ? "bg-white/95 text-sky-500 shadow-md shadow-sky-200/80"
                            : isHover
                              ? "bg-white text-sky-500 shadow-sm"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                        ].join(" ")}
                      >
                        {Icon && <Icon />}
                      </span>

                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          className={[
                            "text-sm font-medium truncate",
                            isActive ? "text-white" : "",
                          ].join(" ")}
                        >
                          {t[key] || label}
                        </span>

                      </div>

                      <motion.span
                        initial={{ opacity: 0, x: -4 }}
                        animate={{
                          opacity: isActive || isHover ? 1 : 0,
                          x: isActive || isHover ? 0 : -4,
                        }}
                        transition={{ duration: 0.18 }}
                        className="flex-shrink-0"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="w-3.5 h-3.5"
                          fill="none"
                        >
                          <path
                            d="M9 6l6 6-6 6"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </motion.span>
                    </div>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Footer: ngôn ngữ + theme + trạng thái nhỏ */}
      {!collapsed && (
        <div className="absolute left-2 right-2 bottom-2">


          <div className="flex items-center justify-between gap-2 rounded-2xl  px-3 py-2.5 shadow-sm">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Ngôn ngữ
              </span>
              <div className="flex gap-1.5" role="group" aria-label="Chọn ngôn ngữ">
                <Button
                  className={`px-2.5 py-1 text-[11px] rounded-xl border ${lang === "vi"
                      ? "btn-primary bg-sky-500 text-white font-bold border-sky-500 shadow-sm shadow-sky-300/70"
                      : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-600"
                    }`}
                  onClick={() => setLang("vi")}
                >
                  VI
                </Button>
                <Button
                  className={`px-2.5 py-1 text-[11px] rounded-xl border ${lang === "en"
                      ? "btn-primary bg-sky-500 text-white font-bold border-sky-500 shadow-sm shadow-sky-300/70"
                      : "bg-white/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-600"
                    }`}
                  onClick={() => setLang("en")}
                >
                  EN
                </Button>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Giao diện
              </span>
              <Button
                aria-label="Đổi giao diện sáng/tối"
                title="Chuyển giao diện"
                variant="ghost"
                className="!px-2.5 !py-1 rounded-xl border border-slate-200 dark:border-slate-600 bg-white/90 dark:bg-slate-800/90 text-xs flex items-center gap-1.5"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                <span>{theme === "dark" ? "🌙" : "☀️"}</span>
                <span className="text-[11px]">
                  {theme === "dark" ? "Dark" : "Light"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
