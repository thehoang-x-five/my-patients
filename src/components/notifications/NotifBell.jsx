// /src/components/notifications/NotifBell.jsx
import React, { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useNotificationsStore } from "../stores/appStore";
import {
    useNotifications,
    subscribeNotifications,
  } from "../../api/notifications.js";
/* ---------- Icon chuông ---------- */
function BellIcon({ className = "", filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3a5 5 0 0 0-5 5v2.764c0 .52-.18 1.025-.509 1.431L5.3 13.9C4.44 14.97 5.2 16.6 6.6 16.6H17.4c1.4 0 2.16-1.63 1.3-2.7l-1.191-1.705A2.3 2.3 0 0 1 17 10.764V8a5 5 0 0 0-5-5Z"
        className={filled ? "fill-sky-500" : "fill-none"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 18.5a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Nút chuông thông báo ở topbar.
 * - Hiển thị badge số chưa đọc.
 * - Dropdown xem nhanh 5 thông báo mới nhất.
 * - Toast nhỏ mỗi khi có thông báo realtime (event app:new-notification).
 */
export default function NotifBell() {
  const rootRef = useRef(null);

  const qc = useQueryClient();
  const { data } = useNotifications({ params: { take: 5 } });
    // Đăng ký realtime notification (global) – dùng cho cả bell + trang Notifications
    useEffect(() => {
      const off = subscribeNotifications(qc);
      return () => {
        if (typeof off === "function") off();
      };
    }, [qc]);
  const items = useMemo(
    () => {
            if (!data) return [];
            if (Array.isArray(data.items)) return data.items; // PagedResult
            if (Array.isArray(data.data)) return data.data;   // fallback cũ
            if (Array.isArray(data)) return data;            // array trần
            return [];
          },
    [data]
  );
  const unread = items.filter((n) => !n.read).length;

  const open = useNotificationsStore((s) => s.dropdownOpen);
  const setOpen = useNotificationsStore((s) => s.setDropdownOpen);

  const peek = useNotificationsStore((s) => s.peekItem);
  const setPeek = useNotificationsStore((s) => s.setPeekItem);
  const clearPeek = useNotificationsStore((s) => s.clearPeek);
  
  // Lắng nghe event từ subscribeNotifications để hiện "peek" toast
  useEffect(() => {
    function handleNew(evt) {
      const item = evt.detail;
      if (!item) return;
      setPeek(item);
      qc.invalidateQueries({ queryKey: ["notifications"] });

      const t = setTimeout(() => {
        clearPeek();
      }, 3500);
      return () => clearTimeout(t);
    }

    window.addEventListener("app:new-notification", handleNew);
    return () =>
      window.removeEventListener("app:new-notification", handleNew);
  }, [setPeek, clearPeek, qc]);
  
  // Click ra ngoài / Esc để đóng dropdown
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e) {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target)) {
        setOpen(false);
      }
    }

    function handleKey(e) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("touchstart", handleClickOutside, true);
    document.addEventListener("keydown", handleKey, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("touchstart", handleClickOutside, true);
      document.removeEventListener("keydown", handleKey, true);
    };
  }, [open, setOpen]);

  return (
    <div className="relative" ref={rootRef}>
      {/* Nút chuông */}
      <motion.button
        type="button"
        whileHover={{ y: -1, boxShadow: "0 8px 18px rgba(56,189,248,0.25)" }}
        whileTap={{ scale: 0.96, y: 0 }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 ring-1 ring-slate-200 hover:bg-sky-50/10 hover:ring-slate-200 text-sky-600 shadow-sm transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-[11px] text-white flex items-center justify-center shadow-md">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      {/* Dropdown list nhỏ */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 max-w-[85vw] rounded-2xl bg-white shadow-2xl ring-1 ring-sky-200/90 z-[55] overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-sky-100 flex items-center justify-between bg-sky-50/40">
              <span className="text-[13px] font-semibold text-slate-700 flex items-center gap-1.5">
                <BellIcon className="w-4 h-4 text-sky-500" />
                Thông báo gần đây
              </span>
              <a
                href="/notifications"
                className="text-[12px] text-sky-600 hover:text-sky-700"
              >
                Xem tất cả
              </a>
            </div>
            <div className="max-h-80 overflow-y-auto scrollbar-none">
              {items.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  Không có thông báo.
                </div>
              ) : (
                <ul className="flex flex-col gap-1 px-2 py-2">
                  {items.map((n) => (
                    <motion.li
                      key={n.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        y: -1,
                        boxShadow:
                          "0 10px 22px rgba(56,189,248,0.22)",
                      }}
                      className={[
                        "px-3 py-2.5 rounded-xl cursor-pointer",
                        "bg-gradient-to-r from-white to-sky-50/40",
                        n.read ? "opacity-80" : "bg-sky-50/70",
                        "hover:from-white hover:to-sky-100/90",
                        "ring-1 ring-sky-100",
                        "transition-all duration-200",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <BellIcon className="w-4 h-4 text-sky-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-slate-800 line-clamp-2">
                            {n.title || n.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                          {n.type==="lich_hen"?"Lịch hẹn": n.type==="reminder"?"Nhắc nhở":n.type==="result"?"Kết quả":"Thông báo"}
                            •{" "}
                            {n.createdAt &&
                              new Date(n.createdAt).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                          </p>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast peek notification */}
      <AnimatePresence>
        {peek && (
          <motion.div
            initial={{ opacity: 0, x: 20, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 z-[60] max-w-sm rounded-2xl bg-white shadow-xl ring-1 ring-sky-200/90 p-3"
          >
            <div className="flex items-start gap-2">
              <div className="mt-0.5 w-8 h-8 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-cyan-500 grid place-items-center text-white shadow-md">
                <BellIcon className="w-4 h-4" filled />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 line-clamp-2">
                  {peek.title || peek.message}
                </div>
                <div className="mt-0.5 text-xs text-slate-500">
                  {peek.type || "Thông báo mới"}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
