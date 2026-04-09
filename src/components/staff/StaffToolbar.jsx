import React from "react";
import Chip from "../ui/Chip.jsx";
import { useUI } from "../../context/UIContext.jsx";

export default function StaffToolbar({
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const { lang } = useUI();
  const total = stats?.total ?? 0;
  const online = stats?.online ?? 0;
  const pause = stats?.pause ?? 0;
  const offline = stats?.offline ?? 0;
  const depts = stats?.depts ?? 0;

  const t =
    lang === "en"
      ? {
          total: "Total staff",
          online: "Online",
          pause: "Paused",
          offline: "Offline",
          departments: "Departments",
          reset: "Reset filters",
          filter: "Filters",
        }
      : {
          total: "Tổng nhân sự",
          online: "Online",
          pause: "Tạm nghỉ",
          offline: "Offline",
          departments: "Khoa",
          reset: "Làm mới bộ lọc",
          filter: "Bộ lọc",
        };

  return (
    <div className="mt-0 flex flex-wrap items-center gap-2">
      <Chip dot="teal">
        {t.total}:&nbsp;<b>{total}</b>
      </Chip>
      <Chip dot="emerald">
        {t.online}:&nbsp;<b>{online}</b>
      </Chip>
      <Chip dot="amber">
        {t.pause}:&nbsp;<b>{pause}</b>
      </Chip>
      <Chip dot="slate">
        {t.offline}:&nbsp;<b>{offline}</b>
      </Chip>
      <Chip dot="cyan">
        {t.departments}:&nbsp;<b>{depts}</b>
      </Chip>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onResetFilters}
          title={t.reset}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-400"
        >
          ⟲
        </button>

        <button
          type="button"
          ref={filterBtnRef}
          data-popover-anchor="staff-filter"
          onClick={onOpenFilter}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[13px] text-slate-700 shadow-sm ring-1 ring-emerald-200 hover:bg-emerald-50 hover:ring-emerald-400"
        >
          <span className="text-emerald-600">🔍</span>
          {t.filter}
        </button>
      </div>
    </div>
  );
}
