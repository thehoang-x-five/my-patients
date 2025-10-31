import React from 'react';
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import NotificationsToolbar from "../components/notifications/NotificationsToolbar.jsx";
import NotificationList from "../components/notifications/NotificationList.jsx";
import NotificationDetailModal from "../components/notifications/NotificationDetailModal.jsx";
import {
  loadNotifications,
  saveNotifications,
  markAllRead,
  todayStats,
} from "../data/notifications.js";
import { useSearchParams } from "react-router-dom";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function Notifications() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [all, setAll] = useState([]);
  const [filter, setFilter] = useState(searchParams.get("filter") || "all");
  const [q, setQ] = useState(searchParams.get("q") || "");
  const qDef = useDeferredValue(q);
  const [detail, setDetail] = useState({ open: false, data: null });

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      setAll(loadNotifications());
      setLoading(false);
    }, 250);
    return () => clearTimeout(t);
  }, []);

  // deep-link mở chi tiết ?open=id
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || !all.length) return;
    const found = all.find((x) => x.id === openId);
    if (found) setDetail({ open: true, data: found });
  }, [all, searchParams]);

  // đồng bộ URL khi đổi filter/search
  useEffect(() => {
    const sp = new URLSearchParams(searchParams);
    filter ? sp.set("filter", filter) : sp.delete("filter");
    q ? sp.set("q", q) : sp.delete("q");
    sp.delete("open");
    setSearchParams(sp, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, q]);

  const stats = todayStats(all);

  const items = useMemo(() => {
    const kw = qDef.trim().toLowerCase();
    return all
      .filter((n) => {
        if (filter === "all") return true;
        if (filter === "unread") return n.unread;
        return n.type === filter;
      })
      .filter((n) =>
        !kw
          ? true
          : [
              n.title,
              n.body,
              n.patientId,
              n.patientName,
              n.rxId,
              n.invoiceId,
              n.drugCode,
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase()
              .includes(kw)
      )
      .sort((a, b) => new Date(b.ts) - new Date(a.ts));
  }, [all, filter, qDef]);

  function toggleRead(id) {
    setAll((prev) => {
      const next = prev.map((n) =>
        n.id === id ? { ...n, unread: !n.unread } : n
      );
      saveNotifications(next);
      return next;
    });
  }
  function markAll() {
    setAll(markAllRead());
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Thông báo"
    >
      <div
        className="mt-2 flex flex-col min-h-0
                   h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* Toolbar chiếm tự nhiên, không kéo giãn */}
        <NotificationsToolbar
          filter={filter}
          setFilter={setFilter}
          stats={stats}
          q={q}
          setQ={setQ}
          onMarkAll={markAll}
        />

        {/* List fill phần còn lại */}
        <div className="mt-3 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.section
              key={filter + "|" + (qDef ? "q" : "")}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="h-full min-h-0"
            >
              <NotificationList
                items={items}
                loading={loading}
                onToggleRead={toggleRead}
                onOpen={(data) => {
                  setDetail({ open: true, data });
                  if (data.unread) toggleRead(data.id);
                }}
                stretch
              />
            </motion.section>
          </AnimatePresence>
        </div>
      </div>

      <NotificationDetailModal
        open={detail.open}
        data={detail.data}
        onClose={() => setDetail({ open: false, data: null })}
      />
    </motion.main>
  );
}
