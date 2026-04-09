import React from "react";
import Chip from "../ui/Chip.jsx";
import { useUI } from "../../context/UIContext.jsx";

export default function PatientsToolbar({
  counts = {},
  onAdd,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
  viewMode = "today",
  onChangeViewMode,
  flashAddAt = 0,
}) {
  const { lang } = useUI();
  const {
    done = 0,
    waitExam = 0,
    waitProc = 0,
    waitIntake = 0,
    cancelled = 0,
    inExam = 0,
  } = counts;

  const t =
    lang === "en"
      ? {
          done: "Completed",
          waitExam: "Waiting exam",
          waitProc: "Waiting processing",
          waitIntake: "Waiting intake",
          inExam: "In exam",
          cancelled: "Cancelled",
          today: "Today",
          all: "All",
          todayTitle: "Show only patients that require handling today",
          allTitle: "Show the full patient list",
          reset: "Reset filters",
          filter: "Filters",
          add: "Add",
          filterTitle: "Filter and search patients",
        }
      : {
          done: "Hoàn thành",
          waitExam: "Chờ khám",
          waitProc: "Chờ xử lý",
          waitIntake: "Chờ tiếp nhận",
          inExam: "Đang khám",
          cancelled: "Hủy",
          today: "Hôm nay",
          all: "Tất cả",
          todayTitle: "Chỉ hiển thị bệnh nhân cần xử lý hôm nay",
          allTitle: "Xem toàn bộ danh sách bệnh nhân",
          reset: "Làm mới bộ lọc",
          filter: "Lọc",
          add: "Thêm",
          filterTitle: "Lọc và tìm kiếm bệnh nhân",
        };

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <Chip dot="emerald">
        {t.done} <b className="ml-1">{done}</b>
      </Chip>
      <Chip dot="sky">
        {t.waitExam} <b className="ml-1">{waitExam}</b>
      </Chip>
      <Chip dot="amber">
        {t.waitProc} <b className="ml-1">{waitProc}</b>
      </Chip>
      <Chip dot="red">
        {t.waitIntake} <b className="ml-1">{waitIntake}</b>
      </Chip>
      <Chip dot="cyan">
        {t.inExam} <b className="ml-1">{inExam}</b>
      </Chip>
      <Chip dot="rose">
        {t.cancelled} <b className="ml-1">{cancelled}</b>
      </Chip>

      <div className="ml-auto flex items-center gap-2">
        <div className="inline-flex overflow-hidden rounded-xl bg-white ring-1 ring-emerald-200">
          <button
            type="button"
            onClick={() => onChangeViewMode?.("today")}
            className={`px-3 py-1.5 text-sm font-semibold ${
              viewMode === "today"
                ? "bg-emerald-100 text-emerald-900"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title={t.todayTitle}
          >
            {t.today}
          </button>
          <button
            type="button"
            onClick={() => onChangeViewMode?.("all")}
            className={`border-l border-emerald-200/60 px-3 py-1.5 text-sm font-semibold ${
              viewMode === "all"
                ? "bg-emerald-100 text-emerald-900"
                : "text-slate-700 hover:bg-slate-50"
            }`}
            title={t.allTitle}
          >
            {t.all}
          </button>
        </div>

        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-1.5 text-[12px] text-slate-600 ring-1 ring-slate-200 transition hover:text-green-700 hover:ring-green-400"
          title={t.reset}
          aria-label={t.reset}
        >
          ⟳
        </button>

        <button
          ref={filterBtnRef}
          type="button"
          aria-haspopup="dialog"
          title={t.filterTitle}
          onClick={onOpenFilter}
          data-popover-anchor="patients-filter"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-tr from-teal-50 to-emerald-100 px-3 py-1.5 text-sm font-semibold text-slate-700 shadow-soft transition hover:-translate-y-px active:translate-y-0"
        >
          <img src="/loc.png" alt={t.filter} className="h-5 w-5" />
          {t.filter}
        </button>

        {onAdd && (
          <button
            id="patients-add-btn"
            onClick={onAdd}
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl border border-transparent bg-gradient-to-tr from-teal-600 to-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-px ${
              flashAddAt > 0 ? "flash-once" : ""
            }`}
          >
            + {t.add}
          </button>
        )}
      </div>
    </div>
  );
}
