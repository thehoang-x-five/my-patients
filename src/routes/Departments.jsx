// src/pages/Departments.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import DeptToolbar from "../components/departments/DeptToolbar.jsx";
import DeptGrid from "../components/departments/DeptGrid.jsx";
import DeptModal from "../components/departments/DeptModal.jsx";
import ScheduleModal from "../components/departments/ScheduleModal.jsx";
import DeptFilterPopover from "../components/departments/DeptFilterPopover.jsx";
import Pagination from "../components/ui/Pagination.jsx";

import {
  useDepartmentRooms,
  useDutyByRoom,
} from "../api/departments.js";
import { useUIStore } from "../components/stores/appStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

// Không dùng data/departments.js nữa, define local
const WEEK_TEMPLATE = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const dayKeyToday = () => {
  const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const k = map[new Date().getDay()];
  return WEEK_TEMPLATE.includes(k) ? k : "Mon";
};

function decorateRow(d) {
  const status = d.status ?? (d.room?.status ? "active" : "inactive");
  const raw = d._raw || {};

  const waitingPatients =
    status === "inactive"
      ? 0
      : d.waitingPatients ??
        raw.DangCho ??
        raw.dangCho ??
        raw.SoBenhNhanDangCho ??
        raw.soBenhNhanDangCho ??
        0;

  const examinedPatients =
    d.examinedPatients ??
    d.doneToday ??
    raw.DaHoanThanh ??
    raw.daHoanThanh ??
    raw.SoBenhNhanDaKhamHomNay ??
    raw.soBenhNhanDaKhamHomNay ??
    0;

  const totalToday =
    d.totalToday ??
    raw.TongHomNay ??
    raw.tongHomNay ??
    waitingPatients + examinedPatients;

  const deptName =
    d.deptName ||
    (d.dept && (d.dept.name || d.dept.tenKhoa || d.dept.ten_khoa)) ||
    d.khoaName ||
    d.name ||
    "";

  const short =
    (deptName || "").trim().charAt(0).toUpperCase() || "P";

  return {
    ...d,
    status,
    waitingPatients,
    examinedPatients,
    totalToday,
    short,
  };
}



// helper để escape CSS attribute selector
function safeCssEscape(v) {
  const s = String(v ?? "");
  // @ts-ignore
  if (typeof CSS !== "undefined" && CSS.escape) return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_\-]/g, "\\$&");
}
function buildWeekDaysFromDuty(list) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const toDayKey = (value) => {
    if (!value) return null;

    if (value instanceof Date) {
      const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      return map[value.getDay()];
    }

    const s = String(value).trim().toLowerCase();
    if (!s) return null;

    // Vietnamese "Thứ 2..7", "CN" or english day names
    if (/^mon/.test(s) || /^th(?:ứ|u)\s*2/.test(s)) return "Mon";
    if (/^tue/.test(s) || /^th(?:ứ|u)\s*3/.test(s)) return "Tue";
    if (/^wed/.test(s) || /^th(?:ứ|u)\s*4/.test(s)) return "Wed";
    if (/^thu(?!r)/.test(s) || /^th(?:ứ|u)\s*5/.test(s)) return "Thu";
    if (/^fri/.test(s) || /^th(?:ứ|u)\s*6/.test(s)) return "Fri";
    if (/^sat/.test(s) || /^th(?:ứ|u)\s*7/.test(s)) return "Sat";
    if (/^sun/.test(s) || /^cn/.test(s)) return "Sun";

    // yyyy-MM-dd
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      const dt = new Date(s);
      if (!Number.isNaN(dt.getTime())) {
        const map = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        return map[dt.getDay()];
      }
    }

    return null;
  };

  const result = { fixedDoctor: null };

  for (const raw of list) {
    const dto = raw || {};

    const dayRaw =
      dto.DayOfWeek ||
      dto.dayOfWeek ||
      dto.Thu ||
      dto.thu ||
      dto.Day ||
      dto.day ||
      dto.NgayTruc ||
      dto.ngayTruc ||
      dto.date ||
      dto.ngay;

    const key = toDayKey(dayRaw) || "Mon";

    const nurse =
      dto.NurseName ||
      dto.nurseName ||
      dto.TenDieuDuong ||
      dto.tenDieuDuong ||
      dto.DieuDuongTruc ||
      dto.dieuDuongTruc ||
      dto.DieuDuong ||
      dto.dieuDuong ||
      dto.nurse ||
      "";

    const shift =
      dto.CaTruc ||
      dto.caTruc ||
      dto.ca_truc ||
      dto.Shift ||
      dto.shift ||
      "";

    const start =
      dto.GioBatDau ||
      dto.gioBatDau ||
      dto.gio_bat_dau ||
      dto.StartTime ||
      dto.startTime ||
      "";

    const end =
      dto.GioKetThuc ||
      dto.gioKetThuc ||
      dto.gio_ket_thuc ||
      dto.EndTime ||
      dto.endTime ||
      "";

    const doctor =
      dto.BacSi ||
      dto.bacSi ||
      dto.TenBacSi ||
      dto.tenBacSi ||
      dto.DoctorName ||
      dto.doctorName ||
      dto.doctor ||
      "";

    if (doctor && !result.fixedDoctor) {
      result.fixedDoctor = doctor;
    }

    const slot = {
      nurse: nurse || "—",
      ca_truc: shift || "—",
      gio_bat_dau: start || "—",
      gio_ket_thuc: end || "—",
    };

    if (!Array.isArray(result[key])) result[key] = [];
    result[key].push(slot);
  }

  return result;
}

// xác định phòng CLS / DV
function isClsRoom(r) {
  const raw =
    (r.room && (r.room.type || r.room.loaiPhong || r.room.loai_phong)) ||
    r.roomType ||
    r.loaiPhong ||
    r.loai_phong ||
    "";
  const v = String(raw).toLowerCase();
  return (
    v.includes("cls") ||
    v.includes("cận lâm sàng") ||
    v.includes("can_lam_sang") ||
    v.includes("dịch vụ") ||
    v.includes("dich_vu") ||
    v.includes("dv")
  );
}

export default function Departments() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const todayKey = dayKeyToday();

  // ===== Bộ lọc (popover) =====
  const [filters, setFilters] = useState({
    keyword: "",
    status: "all", // all | online | offline
    roomType: "all", // all | ls | cls
    sort: "none", // none | capacity_asc | capacity_desc
  });
  const [page, setPage] = useState(1);

  // Map frontend filters sang backend filters
  const mapStatusToBackend = (status) => {
    if (status === "online") return "hoat_dong";
    if (status === "offline") return "tam_dung";
    return null;
  };

  const mapRoomTypeToBackend = (roomType) => {
    if (roomType === "ls") return "phong_kham_ls";
    if (roomType === "cls") return "phong_cls";
    return null;
  };

  // Reset page khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [filters.keyword, filters.status, filters.roomType]);

  // Query với filters từ backend
  const { data: depRoomsData, isLoading: depRoomsLoading } = useDepartmentRooms({
    keyword: filters.keyword || undefined,
    status: mapStatusToBackend(filters.status) || undefined,
    roomType: mapRoomTypeToBackend(filters.roomType) || undefined,
    page,
    pageSize: 50,
  }, { enabled: true });

  const depRoomsResult = depRoomsData || { Items: [], TotalItems: 0, Page: 1, PageSize: 50 };
  const depItems = depRoomsResult.Items || [];
  const totalItems = depRoomsResult.TotalItems || 0;
  const totalPages = Math.ceil(totalItems / 50);

  // chuẩn hóa từng phòng cho UI
  const all = useMemo(
    () => (depItems || []).map((d) => decorateRow(d)),
    [depItems]
  );

  const filterBtnRef = useRef(null);
  const [filterOpen, setFilterOpen] = useState(false);

  // stats cho toolbar (tính từ all đã được filter ở backend)
  const { totalRooms, onlineCount, offlineCount, clinicCount, clsCount } =
    useMemo(() => {
      const total = totalItems; // Dùng totalItems từ backend
      // Tính stats từ items hiện tại (1 page)
      const online = all.filter((d) => d.status === "active").length;
      const offline = all.filter((d) => d.status === "inactive").length;
      const clinic = all.filter((d) => !isClsRoom(d)).length;
      const cls = all.filter((d) => isClsRoom(d)).length;
      return {
        totalRooms: total,
        onlineCount: online,
        offlineCount: offline,
        clinicCount: clinic,
        clsCount: cls,
      };
    }, [all, totalItems]);



  // ===== Highlight room by URL =====
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const focusRoomId = sp.get("room");
  const focus = sp.get("focus") === "true";

  const highlightRoomId = useUIStore((s) => s.highlightRoomId);
  const setHighlightRoomId = useUIStore((s) => s.setHighlightRoomId);
  const clearHighlightRoom = useUIStore((s) => s.clearHighlightRoom);

  useEffect(() => {
    if (focus && focusRoomId) {
      setHighlightRoomId(focusRoomId);
    }
  }, [focus, focusRoomId, setHighlightRoomId]);

  useEffect(() => {
    if (!highlightRoomId) return;
    const sel = `[data-room-id="${safeCssEscape(highlightRoomId)}"]`;
    const el = document.querySelector(sel);
    if (el && el.scrollIntoView) {
      try {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } catch {}
      const t = setTimeout(() => clearHighlightRoom(), 5000);
      return () => clearTimeout(t);
    }
  }, [highlightRoomId, clearHighlightRoom, all]);

  // duty when schedule modal opens
  const [schedule, setSchedule] = useState({ open: false, dept: null });
  const dutyRoomId = schedule.open && schedule.dept ? schedule.dept.id : null;
  const { data: dutyRaw = [] } = useDutyByRoom(dutyRoomId, {
    enabled: !!dutyRoomId,
  });
  
  const weekDays = useMemo(
    () => buildWeekDaysFromDuty(dutyRaw),
    [dutyRaw]
  );

  // modal chi tiết
  const [detail, setDetail] = useState({ open: false, dept: null });

  // Đã được filter ở backend, chỉ cần sort capacity ở FE (backend chưa hỗ trợ)
  const filtered = useMemo(() => {
    let arr = [...all];

    // sort "sức chứa" = tải phòng trong ngày (chỉ sort ở FE vì backend chưa hỗ trợ)
    if (
      filters.sort === "capacity_asc" ||
      filters.sort === "capacity_desc"
    ) {
      const getCap = (x) =>
        Number(
          // Nếu sau này detail có sức chứa/ngày thì ưu tiên
          x.capacityPerDay ??
            // còn hiện tại dùng tổng lượt hôm nay trên card
            x.totalToday ??
            (x.waitingPatients ?? 0) + (x.examinedPatients ?? 0)
        );

      arr = [...arr].sort((a, b) => {
        const da = getCap(a);
        const db = getCap(b);
        return filters.sort === "capacity_asc" ? da - db : db - da;
      });
    }

    return arr;
  }, [all, filters.sort]);

  function openDetail(dept) {
    setDetail({ open: true, dept });
  }

  function openSchedule(dept) {
    setSchedule({ open: true, dept });
  }

  const handleResetFilters = () => {
    setFilters({
      keyword: "",
      status: "all", // all | online | offline
      roomType: "all", // all | ls | cls
      sort: "none", // none | capacity_asc | capacity_desc
    });
  };

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
        {/* Toolbar mới: chip Online / Offline / loại phòng + nút Lọc */}
        <DeptToolbar
          totalRooms={totalRooms}
          onlineCount={onlineCount}
          offlineCount={offlineCount}
          clinicCount={clinicCount}
          clsCount={clsCount}
          onOpenFilter={() => setFilterOpen(true)}
          onResetFilters={handleResetFilters}
          filterBtnRef={filterBtnRef}
        />

        {depRoomsLoading ? (
          <section className="card mt-3 p-4 h-full  rounded-2xl bg-white ring-1 ring-slate-200/60 text-sm text-slate-500 min-h-[320px] flex items-center justify-center">
            Đang tải dữ liệu phòng khoa.
          </section>
        ) : (
          <div className="mt-2.5 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-auto scrollbar-none">
              <DeptGrid
                items={filtered}
                onOpenDetail={openDetail}
                onOpenSchedule={openSchedule}
                highlightId={highlightRoomId}
              />
            </div>
            {totalPages > 1 && (
              <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-lg">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={50}
                  onPageChange={setPage}
                  className="px-4 py-3"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Popover lọc */}
      <DeptFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        anchorEl={filterBtnRef}
        values={filters}
        setValues={setFilters}
      />

      {/* Modal chi tiết phòng */}
      <DeptModal
        open={detail.open}
        dept={detail.dept}
        onClose={() => setDetail({ open: false, dept: null })}
      />

      {/* Modal lịch trực theo phòng */}
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
