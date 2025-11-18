// /src/components/notifications/NotifBell.jsx
import React, { useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "../../api/notifications";
import { useNotificationsStore } from "../stores/notificationsStore";

export default function NotifBell() {
  const { data } = useNotifications({ params: { take: 5 } });
  const items = useMemo(() => Array.isArray(data?.data) ? data.data : (data || []), [data]);
  const unread = items.filter((n) => !n.read).length;

  const open = useNotificationsStore((s) => s.dropdownOpen);
  const setOpen = useNotificationsStore((s) => s.setDropdownOpen);

  const peek = useNotificationsStore((s) => s.peekItem);
  const setPeek = useNotificationsStore((s) => s.setPeek);
  const clearPeek = useNotificationsStore((s) => s.clearPeek);

  // handle global event from subscribeNotifications
  useEffect(() => {
    function onNew(e) {
      const item = e.detail;
      setPeek(item);
      const t = setTimeout(() => clearPeek(), 3000);
      return () => clearTimeout(t);
    }
    window.addEventListener("app:new-notification", onNew);
    return () => window.removeEventListener("app:new-notification", onNew);
  }, [setPeek, clearPeek]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-label="Thông báo"
        className="btn-icon relative"
      >
        <span className="i-bell text-xl" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] px-1 rounded">{unread}</span>
        )}
      </button>

      {/* dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 mt-2 w-80 card p-2 shadow-xl z-50"
          >
            <div className="text-sm font-medium px-2 pt-1 pb-2">Thông báo gần đây</div>
            <div className="divide-y">
              {(items || []).slice(0, 5).map((n) => (
                <div key={n.id} className="p-2 text-sm">
                  <div className="font-medium line-clamp-1">{n.title || n.message}</div>
                  <div className="text-gray-500 text-xs line-clamp-1">{n.type} • {new Date(n.createdAt || n.time).toLocaleString()}</div>
                </div>
              ))}
              {items?.length === 0 && <div className="p-3 text-sm text-gray-500">Chưa có thông báo</div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* peek toast */}
      <AnimatePresence>
        {peek && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-4 right-4 card p-3 shadow-lg z-[60] max-w-sm"
          >
            <div className="text-sm font-medium">{peek.title || peek.message}</div>
            <div className="text-xs text-gray-500">{peek.type}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}