import React from 'react';
import { NavLink, useLocation } from "react-router-dom";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { useUI } from "../../context/UIContext.jsx";

const links = [
  ["/", "Tổng quan", "index"],
  ["/appointments", "Lịch hẹn", "appointments"],
  ["/patients", "Bệnh nhân", "patients"],
  ["/examination", "Khám bệnh", "examinations"],
  ["/departments", "Khoa phòng", "departments"],
  ["/staff", "Nhân sự", "staff"],
  ["/prescriptions", "Đơn thuốc", "prescriptions"],
  ["/history", "Lịch sử", "history"],
  ["/notifications", "Thông báo", "notifications"],
  ["/chat", "Live chat", "live chat"],
  ["/reports", "Báo cáo", "reports"],
];

export default function Sidebar() {
  const { collapsed, setCollapsed, t, lang, setLang, theme, setTheme } =
    useUI();
  const { pathname } = useLocation();
  const [hovered, setHovered] = useState(null);

  // tab đang active (để render blob active)
  const activeKey = useMemo(
    () => links.find(([to]) => to === pathname)?.[0] || null,
    [pathname]
  );

  return (
    <aside
   
      className="fixed inset-y-0 left-0 bg-white dark:bg-slate-900 
              border-r border-slate-200 dark:border-slate-800 z-10 transition-[width] duration-200 sidebar-w"
      aria-label="Thanh điều hướng"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2">
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <div className="w-6 h-6 text-brand-500" aria-hidden>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1 5h-2v4H7v2h4v4h2v-4h4v-2h-4V7Z" />
              </svg>
            </div>
            <div>
              <b>HealthCare</b>
              <div className="text-xs text-slate-500">{t.brandSub}</div>
            </div>
          </div>
        )}

        <Button
          aria-label={collapsed ? "Mở menu" : "Thu gọn menu"}
          title={collapsed ? "Mở menu" : "Thu gọn menu"}
          variant="ghost"
          className="!p-1"
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
        <div className="text-xs text-slate-500 px-2 py-1 mb-2">{t.menu}</div>
      )}

      {/* Nav */}
      {!collapsed && (
        <nav
          className="overflow-y-auto scrollbar-none h-[calc(100%-145px)] px-2 pt-1"
          role="navigation"
          aria-label={t.menu}
        >
          <ul className="flex flex-col gap-2 relative">
            {links.map(([to, label, key]) => {
              const isActive = activeKey === to;
              const isHover = hovered === to;

              return (
                <li
                  key={to}
                  className="relative"
                  onMouseEnter={() => setHovered(to)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* ACTIVE blob: gradient đậm, nằm dưới (z-0) */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-active" // <- hiệu ứng riêng cho active
                      className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-tr from-sky-300 via-brand-400 to-brand-400 shadow-soft z-0"
                      transition={{
                        type: "spring",
                        stiffness: 520,
                        damping: 36,
                        mass: 0.6,
                      }}
                    />
                  )}

                  {/* HOVER film: lớp mỏng sáng hơn, nằm trên (z-10) */}
                  {isHover && (
                    <motion.span
                      layoutId="nav-hover" // <- hiệu ứng riêng cho hover
                      className="pointer-events-none absolute inset-0 rounded-xl bg-brand-50/70 ring-1 ring-brand-200 dark:bg-slate-700/40 dark:ring-slate-600 z-10"
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
                        "relative z-20 btn w-full justify-start",
                        // để overlay nhìn thấy: nền & viền trong suốt khi active/hover
                        active || isHover
                          ? "!bg-transparent !border-transparent"
                          : "",
                        // màu chữ: active trắng, hover đậm brand
                        active ? "text-white" : isHover ? "text-brand-700" : "",
                        // “nhẹ nhàng” khi không có overlay
                        !active && !isHover ? "hover:-translate-y-0.5" : "",
                      ].join(" ")
                    }
                  >
                    <span className={isActive ? "text-white" : ""}>
                      {t[key] || label}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      {/* Footer: ngôn ngữ + theme */}
      {!collapsed && (
        <div className="absolute left-2 right-2 bottom-2 flex items-center justify-between gap-2">
          <div className="flex gap-2" role="group" aria-label="Chọn ngôn ngữ">
            <Button
              className={`px-2 ${lang === "vi" ? "btn-primary" : ""}`}
              onClick={() => setLang("vi")}
            >
              VI
            </Button>
            <Button
              className={`px-2 ${lang === "en" ? "btn-primary" : ""}`}
              onClick={() => setLang("en")}
            >
              EN
            </Button>
          </div>
          <Button
            aria-label="Đổi giao diện sáng/tối"
            title="Chuyển giao diện"
            variant="ghost"
            className="!px-2"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            🌓
          </Button>
        </div>
      )}
    </aside>
  );
}
