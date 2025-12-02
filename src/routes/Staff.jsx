// src/pages/Staff.jsx
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
  subscribeStaff,useDepartments
} from "../api/staff.js";

export default function Staff() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();

  // ====== FILTER STATE (gom chung cho popover) ======
  const [role, setRole] = useState("doctor"); // doctor | nurse
  const [filters, setFilters] = useState({
    keyword: "",
    status: "all",   // all | online | pause | offline
    dept: "",        // mã khoa
    nurseType: "all" // all | hanh_chinh | can_lam_sang | lam_sang
  });

  const deferredKeyword = useDeferredValue(filters.keyword);

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);

  const handleResetFilters = () =>
    setFilters({
      keyword: "",
      status: "all",
      dept: "",
      nurseType: "all",
    });

  // ====== MODAL STATE ======
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

    // ====== DATA: STAFF LIST ======
    const apiRole =
      role === "doctor" ? "bac_si" : role === "nurse" ? "y_ta" : "";
  
    // Map filter UI (online / pause / offline) → domain TrangThaiCongTac
    const apiStatus =
      filters.status === "all"
        ? undefined
        : filters.status === "online"
        ? "dang_cong_tac"
        : filters.status === "pause"
        ? "tam_nghi"
        : filters.status === "offline"
        ? "nghi_viec"
        : undefined;
  
    const apiNurseKind =
      role === "nurse" && filters.nurseType !== "all"
        ? filters.nurseType
        : undefined;
  
    const apiDept = filters.dept || undefined;
  
    const { data, isLoading } = useStaff({
      role: apiRole,
      q: deferredKeyword || undefined,
      status: apiStatus,
      nurseKind: apiNurseKind,
      dept: apiDept,
    });
  
    const items = data?.items ?? [];
  
    // ====== STATS (online / pause / offline / depts) ======
    const { data: statsRes } = useStaffStats({
      role: apiRole,
      status: apiStatus,
      nurseKind: apiNurseKind,
      dept: apiDept,
    });
  const online = statsRes?.online ?? 0;
  const pause = statsRes?.idle ?? 0;
  const deptsCount = statsRes?.depts ?? 0;

  const offline = useMemo(() => {
    if (typeof statsRes?.offline === "number") return statsRes.offline;
    // fallback: đếm theo status trong list
    let count = 0;
    for (const s of items) {
      const v = (s.status || s.trangThai || "").toString().toLowerCase();
      if (v === "offline") count++;
    }
    return count;
  }, [statsRes, items]);

  const total = online + pause + offline;
  const stats = useMemo(
    () => ({
      total,
      online,
      pause,
      offline,
      depts: deptsCount,
    }),
    [total, online, pause, offline, deptsCount]
  );

  // ====== MASTER DATA: KHOA ======
  const { data: depsData } = useDepartments();
  const departments = useMemo(() => {
    if (Array.isArray(depsData)) return depsData;
    if (Array.isArray(depsData?.data)) return depsData.data;
    return [];
  }, [depsData]);

  // ====== LỊCH TRỰC + LỊCH LÀM VIỆC CHI TIẾT ======
  const activeId = active?.id ?? active?.maNhanSu?? active?.maNhanVien ?? null;
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
  const dutyRoomsMap = useMemo(() => {
    if (!duty?.week) return null;
    const map = {};
    for (const row of duty.week) {
      const key = row.day;
      if (!key) continue;
      map[key] = row.tenPhong || row.maPhong || "—";
    }
    return map;
  }, [duty]);
  // ====== REALTIME (SignalR) ======
  useEffect(() => {
    const off = subscribeStaff(qc); // subscribeStaff trả về hàm hủy
    return () => {
      if (typeof off === "function") off();
    };
  }, [qc]);

  // ====== RENDER ======
  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Nhân sự"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* Toolbar: chỉ stats + filter + tabs */}
        <StaffToolbar
          role={role}
          setRole={setRole}
          stats={stats}
          onOpenFilter={() => setFilterOpen(true)}
          onResetFilters={handleResetFilters}
          filterBtnRef={filterBtnRef}
        />

        {/* Grid nhân sự */}
        <div className=" card mt-2.5 p-1 pt-0 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                role +
                "|" +
                (filters.keyword || "") +
                "|" +
                filters.status +
                "|" +
                filters.dept +
                "|" +
                filters.nurseType
              }
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="h-full min-h-0 "
            >
              
              <div className="h-full min-h-0 overflow-auto scrollbar-none">
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

      {/* Popover filter (search + khoa + status + nurseType) */}
      <StaffFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterBtnRef}
        role={role}
        values={filters}
        setValues={setFilters}
        departments={departments}
      />

      {/* Modal chi tiết nhân sự */}
      <StaffDetail
        open={showDetail}
        item={active}
        role={role}
        schedule={scheduleMap || null}
        roomToday={
          duty?.today?.tenPhong ||
          duty?.today?.tenPhongHoacBanHomNay ||
          duty?.today?.maPhong ||
          null
        }
        weekRoom={dutyRoomsMap || null}
        onClose={closeDetail}
      />

      {/* Modal lịch trực */}
      <StaffSchedule
        open={showSchedule}
        item={active}
        schedule={scheduleMap || null}
        dutyRooms={dutyRoomsMap || null}
        onClose={closeSchedule}
      />
    </motion.main>
  );
}
