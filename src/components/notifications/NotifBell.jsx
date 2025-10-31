// src/components/notifications/NotifBell.jsx
import React from 'react';
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button.jsx";

export default function NotifBell() {
  const [open, setOpen] = useState(false);
  const [peek, setPeek] = useState(null); // preview nổi vài giây
  const [items, setItems] = useState([
    {
      id: "n1",
      type: "alert",
      title: "2 thuốc gần hết hạn",
      at: Date.now() - 3600e3,
      unread: true,
    },
    {
      id: "n2",
      type: "message",
      title: "Tin nhắn từ điều dưỡng",
      at: Date.now() - 2 * 3600e3,
      unread: false,
    },
  ]);
  const ref = useRef(null);

  // click ngoài để đóng
  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // sự kiện bên ngoài bắn vào để push thông báo mới
  useEffect(() => {
    const onNew = (e) => {
      const n = e.detail;
      setItems((prev) => [{ ...n, unread: true }, ...prev]);
      // preview trong 3s
      setPeek(n);
      const t = setTimeout(() => setPeek(null), 3000);
      return () => clearTimeout(t);
    };
    window.addEventListener("app:new-notification", onNew);
    return () => window.removeEventListener("app:new-notification", onNew);
  }, []);

  const unread = items.filter((x) => x.unread).length;
  const last5 = items.slice(0, 5);

  function markAllRead() {
    setItems((prev) => prev.map((x) => ({ ...x, unread: false })));
  }
  function clearAll() {
    setItems([]);
  }

  return (
    <div className="relative" ref={ref}>
      <Button
        className="px-1 relative"
        aria-label="Thông báo"
        title="Thông báo"
        onClick={() => setOpen((v) => !v)}
      >
        🔔
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] grid place-items-center">
            {unread}
          </span>
        )}
      </Button>

      {/* Dropdown danh sách nhanh */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="absolute right-0 mt-2 w-[320px] rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-2xl p-2 z-40"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <b>Thông báo</b>
              <div className="flex gap-2">
                <button
                  className="text-sm text-sky-700 hover:underline"
                  onClick={markAllRead}
                >
                  Đọc hết
                </button>
                <button
                  className="text-sm text-rose-700 hover:underline"
                  onClick={clearAll}
                >
                  Xóa hết
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] p-1 overflow-auto scrollbar-none">
              {last5.length ? (
                last5.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-xl p-2 mb-1 ring-1 hover:bg-violet-50 ${
                      n.type === "alert"
                        ? "bg-rose-50 ring-rose-200 text-rose-800"
                        : "bg-sky-50 ring-sky-200 text-sky-800"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <b className="truncate">{n.title}</b>
                      {n.unread && (
                        <span className="badge bg-amber-50 text-amber-700 border-amber-200">
                          Mới
                        </span>
                      )}
                    </div>
                    <div className="text-[12px] text-slate-600 mt-0.5">
                      {new Date(n.at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-sm text-slate-500">
                  Chưa có thông báo.
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Peek nổi 3s khi có thông báo mới */}
      <AnimatePresence>
        {peek && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            className={`fixed right-4 bottom-4 z-50 rounded-xl px-3 py-2 ring-1 shadow-lg ${
              peek.type === "alert"
                ? "bg-rose-50 ring-rose-200 text-rose-800"
                : "bg-emerald-50 ring-emerald-200 text-emerald-800"
            }`}
          >
            <b className="mr-1">Thông báo:</b> {peek.title}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Ở bất kỳ nơi nào, có thể bắn sự kiện:
window.dispatchEvent(new CustomEvent("app:new-notification", {
  detail: { id: crypto.randomUUID(), type: "message", title: "Cập nhật mới", at: Date.now() }
}));
*/
