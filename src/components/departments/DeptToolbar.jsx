// src/components/departments/DeptToolbar.jsx
import React from "react";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";

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
  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 px-1"
      aria-label="Thanh công cụ phòng khám"
    >
     <div className="mt-0  flex flex-wrap items-center gap-2">
     <Chip dot="teal">
     Tổng phòng:&nbsp;<b>{totalRooms}</b>
      </Chip>
      <Chip dot="emerald">
        Online:&nbsp;<b>{onlineCount}</b>
      </Chip>
      
      <Chip dot="slate">
        Offline:&nbsp;<b>{offlineCount}</b>
      </Chip>
      <Chip dot="cyan">
      Phòng khám LS:&nbsp;<b>{clinicCount}</b>
      </Chip>
      <Chip dot="indigo">
      Phòng CLS / DV:&nbsp;<b>{clsCount}</b>
      </Chip>
          
        </div>

      {/* Phải: nút lọc + hành động nhanh */}
      <div className="flex items-center gap-2">
    {actions}
    <button
        type="button"
        onClick={onResetFilters}
        title="Làm mới bộ lọc"
        // Thay đổi:
        // hover:bg-emerald-50 -> hover:bg-indigo-50
        // hover:ring-emerald-400 -> hover:ring-indigo-400
        className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-indigo-50 hover:ring-indigo-400 shadow-sm text-sm"
    >
        ⟲
    </button>

    {/* Nút mở popover lọc */}
    <button
        type="button"
        ref={filterBtnRef}
        data-popover-anchor="dept-filter"
        onClick={onOpenFilter}
        className="inline-flex items-center gap-2  rounded-xl px-3 py-1.5 text-xs font-semibold
                  
                    bg-white/90 text-indigo-700 ring-1 ring-indigo-200 shadow-sm
                    hover:bg-indigo-50 hover:ring-indigo-400 hover:shadow-md transition"
    >
        <span className="text-sm">🔍</span>
        <span>Bộ lọc</span>
    </button>


        
      </div>
    </header>
  );
}
