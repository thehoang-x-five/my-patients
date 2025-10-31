import React from "react";
import Chip from "../ui/Chip.jsx";

export default function PatientsToolbar({ counts = {}, onAdd, onOpenFilter, onResetFilters, filterBtnRef }) {
  const { done = 0, waitExam = 0, waitProc = 0, waitIntake = 0 } = counts;

  return (
    <div className="mt-0 flex flex-wrap items-center gap-2">
      <Chip dot="emerald">Hoàn thành <b className="ml-1">{done}</b></Chip>
      <Chip dot="sky">Chờ khám <b className="ml-1">{waitExam}</b></Chip>
      <Chip dot="amber">Chờ xử lý <b className="ml-1">{waitProc}</b></Chip>
      <Chip dot="red">Chờ tiếp nhận <b className="ml-1">{waitIntake}</b></Chip>

      <div className="ml-auto flex items-center gap-2">
        <button type="button" onClick={onResetFilters} className="btn" title="Làm mới bộ lọc">⟲</button>

        <button
          ref={filterBtnRef}
          type="button"
          aria-haspopup="dialog"
          title="Lọc & Tìm kiếm"
          onClick={onOpenFilter}
          data-popover-anchor="patients-filter"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-tr from-teal-50 to-emerald-100 px-2.5 py-2 text-sm font-semibold text-slate-700 shadow-soft hover:-translate-y-px active:translate-y-0 transition"
        >
          <img src="/loc.png" alt="Lọc" className="w-5 h-5" />
          Lọc
        </button>

        <button
          id="patients-add-btn"
          onClick={onAdd}
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-transparent px-4 py-2 text-sm font-semibold text-white shadow-soft hover:-translate-y-px transition bg-gradient-to-tr from-teal-600 to-emerald-500"
        >
          + Thêm
        </button>
      </div>
    </div>
  );
}
