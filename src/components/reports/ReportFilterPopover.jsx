// src/components/reports/ReportFilterPopover.jsx
import React from "react";
import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";
import { toLocalYmd } from "../../utils/dateLocal.js";

const PERIODS = [
  { value: "mtd", label: "Tháng này" },
  { value: "30d", label: "30 ngày gần nhất" },
  { value: "90d", label: "90 ngày gần nhất" },
  { value: "ytd", label: "Từ đầu năm" },
  { value: "custom", label: "Tùy chọn" },
];

function computeRangeForPeriod(value) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let from = new Date(today);

  switch (value) {
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "90d":
      from.setDate(from.getDate() - 89);
      break;
    case "ytd":
      from = new Date(today.getFullYear(), 0, 1);
      break;
    case "mtd":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "custom":
    default:
      from.setDate(from.getDate() - 29);
      break;
  }

  return {
    from: toLocalYmd(from),
    to: toLocalYmd(today),
  };
}

export default function ReportFilterPopover({
  popoverRef,
  period,
  from,
  to,
  setPeriod,
  setFrom,
  setTo,
  onReset,
  onClose,
}) {
  const handleQuick = (value) => {
    setPeriod(value);
    if (value !== "custom") {
      const range = computeRangeForPeriod(value);
      setFrom(range.from);
      setTo(range.to);
    }
  };

  return (
    <div
      ref={popoverRef}
      className="absolute right-0 top-11 z-30 w-[min(390px,90vw)] rounded-2xl bg-white shadow-xl ring-1 ring-slate-200/80 p-3"
      role="dialog"
      aria-label="Bộ lọc báo cáo"
    >
      {/* HEADER CÓ MÀU */}
      <div className="-mx-1 -mt-1 mb-3 rounded-xl bg-gradient-to-r from-cyan-100/50 via-cyan-50 to-cyan-100/50 px-3 py-2 flex items-center justify-between shadow-sm">
        <span className="text-sm font-semibold text-sky-700 flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/15 text-xs">
            ⚙️
          </span>
          Bộ lọc báo cáo
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-700 hover:text-cyan-400"
        >
          ✕
        </button>
      </div>

      {/* Quick period chips */}
      <div className="mb-3">
        <div className="text-xs font-medium text-slate-500 mb-1.5">
          Khoảng thời gian nhanh
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PERIODS.map((p) => {
            const active = period === p.value;
            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleQuick(p.value)}
                className={`px-2.5 py-1 rounded-full text-xs border transition
                  ${
                    active
                      ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date range – THIẾT KẾ LỊCH ĐẸP HƠN */}
      <div className="mb-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-500">
            Khoảng ngày cụ thể
          </span>
          <span className="text-[11px] text-cyan-700/80">
            Chọn nhanh bằng lịch ↓
          </span>
        </div>

        <div className="rounded-2xl bg-cyan-50/70 ring-1 ring-cyan-100 px-2.5 py-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <label className="flex-1 text-[11px] text-slate-500">
              Từ ngày
              <div className="mt-0.5 relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-cyan-500">
                  📅
                </span>
                <input
                  type="date"
                  value={from || ""}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPeriod("custom");
                  }}
                  className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </label>

            <span className="text-slate-400 text-xs mt-4">–</span>

            <label className="flex-1 text-[11px] text-slate-500">
              Đến ngày
              <div className="mt-0.5 relative">
                <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-cyan-500">
                  📅
                </span>
                <input
                  type="date"
                  value={to || ""}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPeriod("custom");
                  }}
                  className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-cyan-500 outline-none"
                />
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="mt-3 -mx-3 -mb-3">
        <FilterPopoverFooter
          onReset={() => onReset?.()}
          onClose={onClose}
          resetLabel="Reset bộ lọc"
          closeLabel="Đóng"
          accent="cyan"
        />
      </div>
    </div>
  );
}
