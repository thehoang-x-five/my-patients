// src/components/Topbar.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button.jsx";
import NotifBell from "../notifications/NotifBell.jsx";
import  {inferRecipientFromToken} from "../../api/notifications.js";
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
  const { LoaiNguoiNhan, MaNguoiNhan,TenNguoiNhan } = inferRecipientFromToken() || {};

  // cập nhật thời gian mỗi 30s (đủ mượt, ít re-render)
  useEffect(() => {
    const t = setInterval(() => setNow(formatNow()), 30_000);
    return () => clearInterval(t);
  }, []);

  // đóng Quick Actions khi đổi route
  useEffect(() => {
    setQaOpen(false);
  }, [loc.pathname]);

  // click ra ngoài / ESC để đóng
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
    {
      to: "/appointments",
      icon: "📅",
      title: "Tạo lịch hẹn",
      desc: "Chuyển tới trang Lịch hẹn",
    },
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
  ];
  const MotionLink = motion(Link);
  return (
    <header
      className="card sticky top-0 z-20 mx-4 mt-4 flex items-center justify-between gap-3 px-4 py-2 bg-white/90 backdrop-blur"
      role="banner"
      aria-label="Thanh trên"
    >
      {/* Trái: chào user + chip thời gian */}
      <div className="flex items-center gap-2">
        <img
          src="/avata.png"
          alt="Admin User"
          className="w-10 h-10 rounded-full"
          onError={({ currentTarget: t }) => (t.style.display = "none")}
        />
        <div className="flex flex-col">
          <span className="text-slate-500">
            Xin chào, <b>{TenNguoiNhan ||"User"}</b>
          </span>
        </div>
      </div>

      {/* Phải: Quick Actions + Chuông + Cài đặt */}
      <div className="flex items-center gap-2">
        <span className="h-8 inline-flex items-center gap-2 text-xs rounded-full px-2 py-2 bg-slate-100 ring-1 ring-slate-200 text-slate-600">
          <i className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {now}
        </span>

        {/* Quick Actions */}
        <div className="relative" ref={qaRef}>
          <motion.button
            type="button"
            whileHover={{
              y: -1,
              boxShadow: "0 10px 20px rgba(16,185,129,0.28)",
            }}
            whileTap={{ scale: 0.95, y: 0 }}
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/85 ring-1 ring-slate-200 hover:bg-emerald-50/10 hover:ring-slate-200 text-emerald-600 shadow-sm transition-colors"
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
                <div className="rounded-2xl bg-white ring-1 ring-emerald-200/70 shadow-2xl overflow-hidden">
                  <div className="px-4 py-2 border-b border-emerald-100 bg-emerald-50/40 flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 text-sm">
                      ⚡
                    </span>
                    <div className="text-[13px] font-semibold text-slate-700">
                      Hành động nhanh
                    </div>
                  </div>

                  <ul className="p-2 space-y-1">
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

        {/* Chuông thông báo (dropdown + badge + auto-peek) */}
        <NotifBell />

        {/* Cài đặt */}
        <MotionLink
          type="button"
          whileHover={{ y: -1, boxShadow: "0 8px 18px rgba(250, 109, 205, 0.3)" }}
          whileTap={{ scale: 0.96, y: 0 }}
          as={Link} to="/settings"
          className="px-1 relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 ring-1 ring-slate-200 hover:bg-pink-50/10 hover:ring-slate-200 text-slate-600 shadow-sm transition-colors"
          title="Cài đặt"
        >
          ⚙️
        </MotionLink>
      </div>
    </header>
  );
}
