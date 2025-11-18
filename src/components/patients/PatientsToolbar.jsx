import React from "react";
import Chip from "../ui/Chip.jsx";

export default function PatientsToolbar({
  counts = {},
  onAdd,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
  viewMode = "today",
  onChangeViewMode,
  sort = "priority",
  onChangeSort,
}) {
  const {
    done = 0,
    waitExam = 0,
    waitProc = 0,
    waitIntake = 0,
    cancelled = 0,
    inExam = 0,
  } = counts;
  

  return (
    <div className=" mb-3 flex flex-wrap items-center gap-2">
      <Chip dot="emerald">Hoàn thành <b className="ml-1">{done}</b></Chip>
      <Chip dot="sky">Chờ khám <b className="ml-1">{waitExam}</b></Chip>
      <Chip dot="amber">Chờ xử lý <b className="ml-1">{waitProc}</b></Chip>
      <Chip dot="red">Chờ tiếp nhận <b className="ml-1">{waitIntake}</b></Chip>
      
<Chip dot="cyan">Đang khám <b className="ml-1">{inExam}</b></Chip>
<Chip dot="rose">Hủy <b className="ml-1">{cancelled}</b></Chip>
      <div className="ml-auto flex items-center gap-2">
      <div className="inline-flex rounded-xl ring-1 ring-emerald-200 bg-white overflow-hidden">
  <button
    type="button"
    onClick={() => onChangeViewMode?.("today")}
    className={`px-3 py-1.5 text-sm font-semibold ${viewMode === "today" ? "bg-emerald-100 text-emerald-900" : "text-slate-700 hover:bg-slate-50"}`}
    title="Chỉ hiển thị bệnh nhân cần xử lý hôm nay"
  >Hôm nay</button>
  <button
    type="button"
    onClick={() => onChangeViewMode?.("all")}
    className={`px-3 py-1.5 text-sm font-semibold border-l border-emerald-200/60 ${viewMode === "all" ? "bg-emerald-100 text-emerald-900" : "text-slate-700 hover:bg-slate-50"}`}
    title="Xem toàn bộ danh sách"
  >Tất cả</button>
</div>


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
