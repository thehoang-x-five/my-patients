import React from "react";
import Chip from "../ui/Chip.jsx";
import { useUI } from "../../context/UIContext.jsx";

export default function DeptToolbar({
  totalRooms = 0,
  onlineCount = 0,
  offlineCount = 0,
  clinicCount = 0,
  clsCount = 0,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
  actions,
}) {
  const { lang } = useUI();
  const t =
    lang === "en"
      ? {
          aria: "Department toolbar",
          totalRooms: "Total rooms",
          online: "Active",
          offline: "Paused",
          clinicRooms: "Clinical rooms",
          clsRooms: "CLS rooms",
          reset: "Reset filters",
          filter: "Filters",
        }
      : {
          aria: "Thanh công cụ phòng khám",
          totalRooms: "Tổng phòng",
          online: "Hoạt động",
          offline: "Tạm dừng",
          clinicRooms: "Phòng khám LS",
          clsRooms: "Phòng CLS",
          reset: "Làm mới bộ lọc",
          filter: "Bộ lọc",
        };

  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-1"
      aria-label={t.aria}
    >
      <div className="mt-0 flex flex-wrap items-center gap-2">
        <Chip dot="teal">
          {t.totalRooms}:&nbsp;<b>{totalRooms}</b>
        </Chip>
        <Chip dot="emerald">
          {t.online}:&nbsp;<b>{onlineCount}</b>
        </Chip>
        <Chip dot="slate">
          {t.offline}:&nbsp;<b>{offlineCount}</b>
        </Chip>
        <Chip dot="cyan">
          {t.clinicRooms}:&nbsp;<b>{clinicCount}</b>
        </Chip>
        <Chip dot="indigo">
          {t.clsRooms}:&nbsp;<b>{clsCount}</b>
        </Chip>
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button
          type="button"
          onClick={onResetFilters}
          title={t.reset}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 hover:bg-indigo-50 hover:ring-indigo-400"
        >
          ⟲
        </button>

        <button
          type="button"
          ref={filterBtnRef}
          data-popover-anchor="dept-filter"
          onClick={onOpenFilter}
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-200 transition hover:bg-indigo-50 hover:ring-indigo-400 hover:shadow-md"
        >
          <span className="text-sm">🔍</span>
          <span>{t.filter}</span>
        </button>
      </div>
    </header>
  );
}
