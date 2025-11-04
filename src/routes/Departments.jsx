// src/pages/Departments.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import DeptToolbar from "../components/departments/DeptToolbar.jsx";
import DeptGrid from "../components/departments/DeptGrid.jsx";
import DeptModal from "../components/departments/DeptModal.jsx";
import ScheduleModal from "../components/departments/ScheduleModal.jsx";
import { WEEK_TEMPLATE } from "../data/departments.js";
import { useDepartments, useDutyByRoom, subscribeDepartments } from "../api/departments.js";
import { useUIStore } from "../components/stores/uiStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const dayKeyToday = () => {
  const map = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const k = map[new Date().getDay()];
  return WEEK_TEMPLATE.includes(k) ? k : "Mon";
};

function decorateRow(d) {
  const status = d.status ?? (d.room?.status ? "active" : "inactive");
  const waitingPatients = status === "inactive" ? 0 : (d.waitingPatients || 0);
  return { ...d, status, waitingPatients };
}

// helper để escape CSS attribute selector
function safeCssEscape(v) {
  const s = String(v ?? "");
  // @ts-ignore
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
}

export default function Departments() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const todayKey = dayKeyToday();

  // Load departments
  const { data: depItems = [], isLoading, error } = useDepartments();
  const all = useMemo(() => (depItems || []).map(decorateRow), [depItems]);

  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");

  const [detail, setDetail] = useState({ open: false, dept: null });
  const [schedule, setSchedule] = useState({ open: false, dept: null });

  // realtime
  const qc = useQueryClient();
  useEffect(() => {
    let off;
    (async () => { off = await subscribeDepartments(qc); })();
    return () => { if (typeof off === "function") off(); };
  }, [qc]);

  // ===== Highlight room by URL =====
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const focusRoomId = sp.get("room");
  const focus = sp.get("focus") === "true";

  const highlightRoomId = useUIStore((s) => s.highlightRoomId);
  const setHighlightRoomId = useUIStore((s) => s.setHighlightRoomId);
  const clearHighlightRoom = useUIStore((s) => s.clearHighlightRoom);

  // set highlight when URL asks
  useEffect(() => {
    if (focus && focusRoomId) {
      setHighlightRoomId(focusRoomId);
    }
  }, [focus, focusRoomId, setHighlightRoomId]);

  // scroll into view when highlighted appears in DOM
  useEffect(() => {
    if (!highlightRoomId) return;
    const sel = `[data-room-id="${safeCssEscape(highlightRoomId)}"]`;
    const el = document.querySelector(sel);
    if (el && el.scrollIntoView) {
      try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch {}
      // auto-clear after 5s
      const t = setTimeout(() => clearHighlightRoom(), 5000);
      return () => clearTimeout(t);
    }
  }, [highlightRoomId, clearHighlightRoom, all]); // re-run after data render

  // duty when schedule modal opens
  const dutyRoomId = schedule.open && schedule.dept ? schedule.dept.id : null;
  const { data: weekDays } = useDutyByRoom(dutyRoomId, { enabled: !!dutyRoomId });

  const activeCount = useMemo(() => all.filter((d) => d.status === "active").length, [all]);

  const searchMatch = (d, q) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return (
      (d.room?.number || "").toLowerCase().includes(s) ||
      (d.name || "").toLowerCase().includes(s) ||
      (d.doctorInCharge || "").toLowerCase().includes(s) ||
      (d.nurseInCharge || "").toLowerCase().includes(s)
    );
  };

  const filtered = useMemo(() => {
    let arr = all;
    if (tab === "active") arr = arr.filter((d) => d.status === "active");
    if (tab === "inactive") arr = arr.filter((d) => d.status === "inactive");
    if (query) arr = arr.filter((d) => searchMatch(d, query));
    return arr;
  }, [all, tab, query]);

  function openDetail(dept) { setDetail({ open: true, dept }); }
  function openSchedule(dept) { setSchedule({ open: true, dept }); }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Quản lý phòng khám"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <DeptToolbar
          tab={tab}
          setTab={setTab}
          total={all.length}
          activeCount={activeCount}
          query={query}
          setQuery={setQuery}
        />

        {isLoading ? (
          <section className="card mt-3 p-4 h-full">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-24" />)}
            </div>
          </section>
        ) : error ? (
          <section role="alert" className="card mt-3 p-4 ring-1 ring-red-200 bg-red-50 text-red-700">
            Không tải được danh sách phòng. <span className="text-red-600/80 text-sm">{String(error)}</span>
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
                  <DeptGrid
                    items={filtered}
                    onOpenDetail={openDetail}
                    onOpenSchedule={openSchedule}
                    highlightId={highlightRoomId}   // NEW
                  />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      <DeptModal
        open={detail.open}
        dept={detail.dept}
        onClose={() => setDetail({ open: false, dept: null })}
      />

      <ScheduleModal
        open={schedule.open}
        dept={schedule.dept}
        todayDuty={weekDays ? weekDays[todayKey] : null}
        weekDays={weekDays}
        todayKey={todayKey}
        onClose={() => setSchedule({ open: false, dept: null })}
      />
    </motion.main>
  );
}
