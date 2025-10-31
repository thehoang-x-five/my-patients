import React from 'react';
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import DeptToolbar from "../components/departments/DeptToolbar.jsx";
import DeptGrid from "../components/departments/DeptGrid.jsx";
import DeptModal from "../components/departments/DeptModal.jsx";
import ScheduleModal from "../components/departments/ScheduleModal.jsx";
import { DEPARTMENTS, DUTY, WEEK_TEMPLATE } from "../data/departments.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const dayKeyToday = () => {
  const map = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const k = map[new Date().getDay()];
  return WEEK_TEMPLATE.includes(k) ? k : "Mon";
};

function decorateRoom(dept, duty, todayKey) {
  const status = dept.status ?? (dept.room?.status ? "active" : "inactive");
  const waitingPatients = status === "inactive" ? 0 : (dept.waitingPatients || 0);
  const roomDuty = duty?.[dept.id] || {};
  const todayDuty = roomDuty?.[todayKey] || { doc: "—", nurse: "—" };
  const weekDays = {
    Mon: roomDuty.Mon || { doc: "—", nurse: "—" },
    Tue: roomDuty.Tue || { doc: "—", nurse: "—" },
    Wed: roomDuty.Wed || { doc: "—", nurse: "—" },
    Thu: roomDuty.Thu || { doc: "—", nurse: "—" },
    Fri: roomDuty.Fri || { doc: "—", nurse: "—" },
    Sat: roomDuty.Sat || { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: roomDuty.Sun || { doc: "Luân phiên", nurse: "Luân phiên" }
  };

  return {
    ...dept,
    status,
    waitingPatients,
    _todayDuty: todayDuty,
    _weekDays: weekDays
  };
}

export default function Departments() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all"); // all | active | inactive
  const [query, setQuery] = useState("");

  const [detail, setDetail] = useState({ open: false, dept: null });
  const [schedule, setSchedule] = useState({ open: false, dept: null, todayDuty: null, weekDays: null });

  const todayKey = dayKeyToday();

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => {
      const baked = DEPARTMENTS.map(d => decorateRoom(d, DUTY, todayKey));
      setAll(baked);
      setLoading(false);
    }, 120);
    return () => clearTimeout(t);
  }, [todayKey]);

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

  function openDetail(dept) {
    setDetail({ open: true, dept });
  }
  function openSchedule(dept) {
    setSchedule({
      open: true,
      dept,
      todayDuty: dept._todayDuty,
      weekDays: dept._weekDays
    });
  }

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

        {loading ? (
          <section className="card mt-3 p-4 h-full">
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skel h-24" />)}
            </div>
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
        todayDuty={schedule.todayDuty}
        weekDays={schedule.weekDays}
        todayKey={todayKey}
        onClose={() => setSchedule({ open: false, dept: null, todayDuty: null, weekDays: null })}
      />
    </motion.main>
  );
}
