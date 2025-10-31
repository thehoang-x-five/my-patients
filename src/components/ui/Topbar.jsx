// src/components/Topbar.jsx
import React from 'react';
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import Button from "../ui/Button.jsx";
import NotifBell from "../notifications/NotifBell.jsx"; // cần file này (đã gửi ở bước trước)

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

  return (
    <header
      className="card sticky top-0 z-20 mx-4 mt-4 flex items-center justify-between gap-3 px-4 py-2 bg-white/90 backdrop-blur-0 
+              "
      role="banner"
      aria-label="Thanh trên"
    >
      {/* Trái: chào user + chip thời gian */}
      <div className="flex items-center gap-2">
        <img
          src="/avata.png"
          alt="Admin User"
          className="w-10 h-10 rounded-full "
          onError={({ currentTarget: t }) => (t.style.display = "none")}
        />
        <div className="flex flex-col">
          <span className="text-slate-500">
            Xin chào, <b>Admin User</b>
          </span>
        </div>
      </div>

      {/* Phải: Quick Actions + Chuông + Cài đặt */}
      <div className="flex items-center gap-2">
        <span className="h-8 inline-flex items-center gap-2 text-xs rounded-full px-2 py-2 bg-slate-100 ring-1 ring-slate-200 text-slate-600">
          <i className=" w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {now}
        </span>
        {/* Quick Actions */}
        <div className="relative" ref={qaRef}>
          <Button
            className="!px-3"
            aria-haspopup="menu"
            aria-expanded={qaOpen}
            onClick={() => setQaOpen((v) => !v)}
            title="Hành động nhanh"
          >
            ✨
          </Button>

          <AnimatePresence>
            {qaOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ type: "spring", stiffness: 420, damping: 28 }}
                className="absolute right-0 mt-2 w-64 "
                role="menu"
                aria-label="Hành động nhanh"
              >
                <div className="rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-2xl overflow-hidden">
                  <ul className="p-1 space-y-1">
                    {[
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
                        icon: "💬",
                        title: "Tin nhắn / thông báo",
                        desc: "Xem nhánh thông báo",
                      },
                    ].map((item, idx) => (
                      <li key={idx}>
                        <Link
                          to={item.to}
                          className="flex items-start gap-3 rounded-xl px-4 py-3 bg-white hover:bg-sky-50 transition shadow-sm ring-1 ring-slate-200"
                          role="menuitem"
                          onClick={() => setQaOpen(false)}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-700">
                              {item.title}
                            </div>
                            <div className="text-xs text-slate-500">
                              {item.desc}
                            </div>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chuông thông báo (dropdown + badge + auto-peek) */}
        <NotifBell />

        <Button as={Link} to="/settings" className="px-1" title="Cài đặt">
          ⚙️
        </Button>
      </div>
    </header>
  );
}
