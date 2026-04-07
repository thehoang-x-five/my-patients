import React, { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotificationsStore } from "../stores/appStore";
import { useNotifications } from "../../api/notifications.js";

function BellIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 3a5 5 0 0 0-5 5v2.764c0 .52-.18 1.025-.509 1.431L5.3 13.9C4.44 14.97 5.2 16.6 6.6 16.6H17.4c1.4 0 2.16-1.63 1.3-2.7l-1.191-1.705A2.3 2.3 0 0 1 17 10.764V8a5 5 0 0 0-5-5Z"
        fill="none"
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

function getTypeLabel(type) {
  if (type === "lich_hen") return "Lich hen";
  if (type === "reminder") return "Nhac nho";
  if (type === "result") return "Ket qua";
  return "Thong bao";
}

export default function NotifBell() {
  const rootRef = useRef(null);
  const { data } = useNotifications({ params: { take: 5 } });

  const items = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }, [data]);

  const unread = items.filter((item) => !item.read).length;
  const open = useNotificationsStore((state) => state.dropdownOpen);
  const setOpen = useNotificationsStore((state) => state.setDropdownOpen);

  useEffect(() => {
    if (!open) return undefined;

    function handleClickOutside(event) {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKey(event) {
      if (event.key === "Escape") {
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
      <motion.button
        type="button"
        whileHover={{ y: -1, boxShadow: "0 8px 18px rgba(56,189,248,0.25)" }}
        whileTap={{ scale: 0.96, y: 0 }}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-sky-600 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-sky-50/40 hover:ring-sky-200"
        onClick={() => setOpen(!open)}
        aria-label="Thong bao"
      >
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] text-white shadow-md">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 z-[55] mt-2 w-80 max-w-[85vw] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-sky-200/90"
          >
            <div className="flex items-center justify-between border-b border-sky-100 bg-sky-50/40 px-3 py-2">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                <BellIcon className="h-4 w-4 text-sky-500" />
                Thong bao gan day
              </span>
              <a
                href="/notifications"
                className="text-[12px] text-sky-600 hover:text-sky-700"
              >
                Xem tat ca
              </a>
            </div>

            <div className="max-h-80 overflow-y-auto scrollbar-none">
              {items.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-slate-500">
                  Khong co thong bao.
                </div>
              ) : (
                <ul className="flex flex-col gap-1 px-2 py-2">
                  {items.map((item) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{
                        y: -1,
                        boxShadow: "0 10px 22px rgba(56,189,248,0.22)",
                      }}
                      className={[
                        "cursor-pointer rounded-xl px-3 py-2.5 transition-all duration-200",
                        "bg-gradient-to-r from-white to-sky-50/40",
                        item.read ? "opacity-80" : "bg-sky-50/70",
                        "ring-1 ring-sky-100 hover:from-white hover:to-sky-100/90",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5">
                          <BellIcon className="h-4 w-4 text-sky-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-[13px] font-medium text-slate-800">
                            {item.title || item.message}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            {getTypeLabel(item.type)}
                            {" • "}
                            {item.createdAt
                              ? new Date(item.createdAt).toLocaleTimeString("vi-VN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
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
    </div>
  );
}
