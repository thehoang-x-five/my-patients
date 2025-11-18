// src/pages/Staff.jsx (hoặc src/Staff.jsx tùy cấu trúc dự án)
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import StaffToolbar from "../components/staff/StaffToolbar.jsx";
import StaffFilterPopover from "../components/staff/StaffFilterPopover.jsx";
import StaffGrid from "../components/staff/StaffGrid.jsx";
import StaffDetail from "../components/staff/StaffDetail.jsx";
import StaffSchedule from "../components/staff/StaffSchedule.jsx";

import useMediaQuery from "../hooks/useMediaQuery.js";
import useViewportVH from "../hooks/useViewportVH.js";

import {
  useStaff,
  useStaffStats,
  useDutyRoom,
  useStaffSchedule,
  subscribeStaff,
} from "../api/staff.js";

export default function Staff() {
 useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();

  // ===== Filters =====
  const [role, setRole] = useState("doctor"); // "doctor" | "nurse"
  const [q, setQ] = useState("");
  const qDeferred = useDeferredValue(q);

  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "online" | "offline"
  const [nurseKind, setNurseKind] = useState("all"); // "all" | "clinical" | "administrative"
  const [dept, setDept] = useState(""); // mã khoa

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const setFilters = (patch) => {
    if (!patch || typeof patch !== "object") return;
    if ("q" in patch) setQ(patch.q ?? "");
    if ("role" in patch) setRole(patch.role ?? "doctor");
    if ("statusFilter" in patch) setStatusFilter(patch.statusFilter ?? "all");
    if ("nurseKind" in patch) setNurseKind(patch.nurseKind ?? "all");
    if ("dept" in patch) setDept(patch.dept ?? "");
  };

  const reset = () => {
    setRole("doctor");
    setQ("");
    setStatusFilter("all");
    setNurseKind("all");
    setDept("");
  };

  // ===== Modal state =====
  const [active, setActive] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);

  const openDetail = (item) => {
    setActive(item);
    setShowDetail(true);
  };
  const closeDetail = () => setShowDetail(false);

  const openSchedule = (item) => {
    setActive(item);
    setShowSchedule(true);
  };
  const closeSchedule = () => setShowSchedule(false);

  // ===== Data =====
  const apiRole = role === "doctor" ? "bac_si" : role === "nurse" ? "y_ta" : "";

  const { data, isLoading } = useStaff({
    role: apiRole,
    q: qDeferred,
    status: statusFilter,
    nurseKind,
    dept,
  });

  const { data: stats } = useStaffStats({});
  const items = data?.items ?? [];
  const online = stats?.online ?? 0;
  const idle = stats?.idle ?? 0;
  const deptsCount = stats?.depts ?? 0;

  const activeId = active?.id ?? null;
  const todayStr = useMemo(
    () => new Date().toISOString().slice(0, 10),
    []
  );

  const { data: duty } = useDutyRoom(activeId, todayStr);
  const { data: sched } = useStaffSchedule(activeId);

  const scheduleMap = useMemo(() => {
    if (!sched?.week) return null;
    const map = {};
    for (const row of sched.week) {
      map[row.day] = row.shift;
    }
    return map;
  }, [sched]);

  // ===== Realtime subscribe =====
  useEffect(() => {
    let off;
    subscribeStaff(qc).then((unsub) => {
      off = unsub;
    });
    return () => {
      if (off) off();
    };
  }, [qc]);

  
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
    >
      {/* Khối chính: toolbar + grid trong cùng 1 flex column */}
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <StaffToolbar
          role={role}
          setRole={setRole}
          q={q}
          setQ={setQ}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          nurseKind={nurseKind}
          setNurseKind={setNurseKind}
          dept={dept}
          setDept={setDept}
          onReset={reset}
          filterOpen={filterOpen}
          setFilterOpen={(v) => {
            const next = typeof v === "function" ? v(filterOpen) : v;
            setFilterOpen(!!next);
          }}
          online={online}
          idle={idle}
          deptsCount={deptsCount}
          filterBtnRef={filterBtnRef}
        />

        <div
          className="mt-2.5 flex-1 min-h-0"
          
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={role + (qDeferred || "") + statusFilter + nurseKind + dept}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-0"
            ><div className="h-full min-h-0 overflow-auto scrollbar-none">
              <StaffGrid
               
                items={items}
                role={role}
                loading={isLoading}
                onDetail={openDetail}
                onSchedule={openSchedule}
              />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Popover + modal tách riêng để không bị clip */}
      <StaffFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={{ q, role, statusFilter, nurseKind, dept }}
        setValues={setFilters}
        anchorEl={filterBtnRef.current}
      />

      <StaffDetail
        open={showDetail}
        item={active}
        role={role}
        schedule={scheduleMap || null}
        roomToday={duty?.today || null}
        weekRoom={duty?.week || null}
        onClose={closeDetail}
      />

      <StaffSchedule
        open={showSchedule}
        item={active}
        schedule={scheduleMap || null}
        dutyRooms={duty?.week || null}
        onClose={closeSchedule}
      />
    </motion.main>
  );
}
