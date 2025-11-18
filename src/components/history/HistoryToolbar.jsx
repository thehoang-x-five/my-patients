// src/components/history/HistoryToolbar.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

export default function HistoryToolbar({
  tab,
  setTab,
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const tabs = [
    { key: "visits", label: "Khám bệnh" },
    { key: "transactions", label: "Giao dịch" },
  ];

  const { vCount = 0, tCount = 0, tSum = 0 } = stats || {};

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      {/* CHIP THỐNG KÊ BÊN TRÁI */}
      <div className="flex flex-wrap items-center gap-2">
        <Chip dot="sky">
          Lượt khám hôm nay:&nbsp;<b>{vCount}</b>
        </Chip>
        <Chip dot="emerald">
          Giao dịch hôm nay:&nbsp;<b>{tCount}</b>
        </Chip>
        <Chip dot="indigo">
          Tổng thu hôm nay:&nbsp;
          <b>{tSum.toLocaleString("vi-VN")} đ</b>
        </Chip>
      </div>

      {/* BÊN PHẢI: RESET + NÚT NGÀY + TAB */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        {/* Nút reset bộ lọc (ngày + search) */}
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 hover:ring-indigo-400 text-xs px-2 py-1 shadow-sm"
          title="Làm mới bộ lọc"
        >
          ⟲
        </button>

        {/* Nút mở popover chọn khoảng ngày (anchor cho RangeCalendar) */}
        <button
          type="button"
          ref={filterBtnRef}
          onClick={onOpenFilter}
          className="
            hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl
            bg-white ring-1 ring-indigo-200 hover:ring-indigo-400
            text-[13px] text-indigo-700 shadow-sm
          "
          title="Chọn khoảng ngày"
        >
          <span>📅</span>
          <span>Khoảng ngày</span>
        </button>

        {/* Segmented tabs */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-indigo-200/70 bg-white"
          role="tablist"
          aria-label="Chọn loại lịch sử"
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-indigo-700"
                    : "text-slate-700 hover:text-indigo-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="historyTabPill"
                    className="absolute inset-0 rounded-lg bg-indigo-50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}