// /src/pages/Notifications.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import NotificationsToolbar from "../components/notifications/NotificationsToolbar.jsx";
import NotificationList from "../components/notifications/NotificationList.jsx";
import NotificationDetailModal from "../components/notifications/NotificationDetailModal.jsx";
import { useMarkAllRead, useNotifications, useTodayStatsQuery, subscribeNotifications } from "../api/notifications.js";
import useMediaQuery from "../hooks/useMediaQuery";

export default function NotificationsPage() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  // URL ←→ state
  const { search } = useLocation();
  const nav = useNavigate();
  const sp = new URLSearchParams(search);
  const tabInit = sp.get("tab") || "all";
  const qInit = sp.get("q") || "";

  const [tab, setTab] = useState(tabInit);
  const [query, setQuery] = useState(qInit);

  // data
  const { data: listResp, isLoading, error } = useNotifications({ params: { tab, q: query } });
  const items = useMemo(() => Array.isArray(listResp?.data) ? listResp.data : (listResp || []), [listResp]);
  const { data: todayStats } = useTodayStatsQuery();

  const [detail, setDetail] = useState({ open: false, item: null });
  function openDetail(item) { setDetail({ open: true, item }); }

  // mark all
  const markAll = useMarkAllRead();

  // sync URL when tab/query changed
  useEffect(() => {
    const p = new URLSearchParams();
    if (tab && tab !== "all") p.set("tab", tab);
    if (query) p.set("q", query);
    nav({ search: p.toString() }, { replace: true });
  }, [tab, query, nav]);

  // realtime subscribe
  const qc = useQueryClient();
  useEffect(() => {
    let off;
    (async () => { off = await subscribeNotifications(qc); })();
    return () => { try { off?.(); } catch {} };
  }, [qc]);

  // filter client-side fallback (if server not filtering)
  const filtered = useMemo(() => {
    let arr = items || [];
    if (tab === "unread") arr = arr.filter((n) => !n.read);
    if (tab === "today") arr = arr.filter((n) => {
      const d = new Date(n.createdAt || n.time || n.date);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    });
    if (query) {
      const s = query.toLowerCase();
      arr = arr.filter((n) => `${n.title || n.message || ""} ${n.type || ""}`.toLowerCase().includes(s));
    }
    return arr;
  }, [items, tab, query]);

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
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <NotificationsToolbar
          tab={tab}
          setTab={setTab}
          query={query}
          setQuery={setQuery}
          todayStats={todayStats}
          onMarkAll={() => markAll.mutate()}
          isMarkingAll={markAll.isPending}
        />

        {isLoading ? (
          <section className="card mt-3 p-4 h-full">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-20" />)}
            </div>
          </section>
        ) : error ? (
          <section role="alert" className="card mt-3 p-4 ring-1 ring-red-200 bg-red-50 text-red-700">
            Không tải được danh sách thông báo. <span className="text-red-600/80 text-sm">{String(error)}</span>
          </section>
        ) : (
          <div className="mt-2.5 flex-1 min-h-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${tab}-${query}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="h-full min-h-0"
              >
                <div className="h-full min-h-0 overflow-auto scrollbar-none">
                  <NotificationList items={filtered} onOpenDetail={openDetail} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <NotificationDetailModal
        open={detail.open}
        item={detail.item}
        onClose={() => setDetail({ open: false, item: null })}
      />
    </motion.main>
  );
}