// src/components/Topbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import NotifBell from "../notifications/NotifBell.jsx";
import { inferRecipientFromToken } from "../../api/notifications.js";
import { useAuthStore } from "../stores/appStore.js";
import {
  canCreateAppointment,
  canViewAppointment,
  formatDepartmentLabel,
  hasGlobalScope,
} from "../../utils/permissions.js";

function formatNow(d = new Date()) {
  const fmtDate = d.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const fmtTime = d.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${fmtDate} • ${fmtTime}`;
}

export default function Topbar() {
  const [now, setNow] = useState(() => formatNow());
  const [qaOpen, setQaOpen] = useState(false);
  const qaRef = useRef(null);
  const loc = useLocation();
  const user = useAuthStore((s) => s.user);
  const { TenNguoiNhan } = inferRecipientFromToken() || {};
  const scopeLabel = !hasGlobalScope(user)
    ? formatDepartmentLabel(
        user?.TenKhoa || user?.tenKhoa || user?.MaKhoa || user?.maKhoa || null
      )
    : null;
  const canViewAppt = canViewAppointment(user);
  const canCreateAppt = canCreateAppointment(user);

  useEffect(() => {
    const t = setInterval(() => setNow(formatNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setQaOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    if (!qaOpen) return;
    const onDown = (e) => {
      if (qaRef.current && !qaRef.current.contains(e.target)) setQaOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setQaOpen(false);
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [qaOpen]);

  const actions = [
    canViewAppt
      ? {
          to: "/appointments",
          icon: "📅",
          title: canCreateAppt ? "Tạo lịch hẹn" : "Xem lịch hẹn",
          desc: canCreateAppt
            ? "Chuyển tới trang Lịch hẹn"
            : "Xem danh sách lịch hẹn",
        }
      : null,
    {
      to: "/patients",
      icon: "➕",
      title: "Thêm bệnh nhân",
      desc: "Mở trang Bệnh nhân",
    },
    {
      to: "/notifications",
      icon: "🔔",
      title: "Xem thông báo",
      desc: "Xem danh sách thông báo",
    },
  ].filter(Boolean);

  const MotionLink = motion(Link);

  return (
    <header
      className="card sticky top-0 z-20 mx-4 mt-4 flex items-center justify-between gap-3 bg-white/90 px-4 py-2 backdrop-blur"
      role="banner"
      aria-label="Thanh trên"
    >
      <div className="flex items-center gap-2">
        <img
          src="/avata.png"
          alt="Admin User"
          className="h-10 w-10 rounded-full"
          onError={({ currentTarget: t }) => (t.style.display = "none")}
        />
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500">
              Xin chào,{" "}
              <b>{TenNguoiNhan || user?.TenNhanSu || user?.tenNhanSu || "User"}</b>
            </span>
            {scopeLabel && (
              <span className="inline-flex max-w-[14rem] items-center rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200/80">
                <span className="truncate">{scopeLabel}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 items-center gap-2 rounded-full bg-slate-100 px-2 py-2 text-xs text-slate-600 ring-1 ring-slate-200">
          <i className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {now}
        </span>

        <div className="relative" ref={qaRef}>
          <motion.button
            type="button"
            whileHover={{
              y: -1,
              boxShadow: "0 10px 20px rgba(16,185,129,0.28)",
            }}
            whileTap={{ scale: 0.95, y: 0 }}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 text-emerald-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-emerald-50/10 hover:ring-slate-200"
            aria-haspopup="menu"
            aria-expanded={qaOpen}
            onClick={() => setQaOpen((v) => !v)}
            title="Hành động nhanh"
          >
            <span className="text-lg">✨</span>
          </motion.button>

          <AnimatePresence>
            {qaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="absolute right-0 mt-2 w-72"
                role="menu"
                aria-label="Hành động nhanh"
              >
                <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70">
                  <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/40 px-4 py-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-100 text-sm text-emerald-700">
                      ⚡
                    </span>
                    <div className="text-[13px] font-semibold text-slate-700">
                      Hành động nhanh
                    </div>
                  </div>

                  <ul className="space-y-1 p-2">
                    {actions.map((item, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        whileHover={{
                          y: -1,
                          scale: 1.01,
                          boxShadow: "0 12px 26px rgba(16,185,129,0.25)",
                        }}
                      >
                        <Link
                          to={item.to}
                          className={[
                            "flex items-start gap-3 rounded-xl px-4 py-3",
                            "bg-gradient-to-r from-white to-emerald-50/40",
                            "hover:from-white hover:to-emerald-100/90",
                            "ring-1 ring-emerald-100",
                            "transition-all duration-200",
                          ].join(" ")}
                          role="menuitem"
                          onClick={() => setQaOpen(false)}
                        >
                          <span className="mt-0.5 text-lg">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-700">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <NotifBell />

        <MotionLink
          type="button"
          whileHover={{
            y: -1,
            boxShadow: "0 8px 18px rgba(250, 109, 205, 0.3)",
          }}
          whileTap={{ scale: 0.96, y: 0 }}
          as={Link}
          to="/settings"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 px-1 text-slate-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-pink-50/10 hover:ring-slate-200"
          title="Cài đặt"
        >
          ⚙️
        </MotionLink>
      </div>
    </header>
  );
}
