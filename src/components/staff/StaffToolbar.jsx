// src/components/staff/StaffToolbar.jsx
import React from "react";
import Chip from "../ui/Chip.jsx";

export default function StaffToolbar({
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const total = stats?.total ?? 0;
  const online = stats?.online ?? 0;
  const pause = stats?.pause ?? 0;
  const offline = stats?.offline ?? 0;
  const depts = stats?.depts ?? 0;

  return (
    <div className="mt-0  flex flex-wrap items-center gap-2">
      {/* Chip thống kê bên trái */}
      <Chip dot="teal">
        Tổng nhân sự:&nbsp;<b>{total}</b>
      </Chip>
      <Chip dot="emerald">
        Online:&nbsp;<b>{online}</b>
      </Chip>
      <Chip dot="amber">
        Pause:&nbsp;<b>{pause}</b>
      </Chip>
      <Chip dot="slate">
        Offline:&nbsp;<b>{offline}</b>
      </Chip>
      <Chip dot="cyan">
        Khoa:&nbsp;<b>{depts}</b>
      </Chip>

      {/* Bên phải: Reset + Filter */}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onResetFilters}
          title="Làm mới bộ lọc"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-400"
        >
          ⟲
        </button>

        {/* Nút mở popover filter */}
        <button
          type="button"
          ref={filterBtnRef}
          data-popover-anchor="staff-filter"
          onClick={onOpenFilter}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[13px] shadow-sm ring-1 ring-emerald-200 hover:ring-emerald-400 hover:bg-emerald-50 text-slate-700"
        >
          <span className="text-emerald-600">🔍</span>
          Bộ lọc
        </button>
      </div>
    </div>
  );
}
