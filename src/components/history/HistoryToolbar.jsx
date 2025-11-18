import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

export default function HistoryToolbar({
  tab,
  setTab,
  stats,
  scope,
  onScopeChange,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const tabs = [
    { key: "visits", label: "Khám bệnh" },
    { key: "transactions", label: "Giao dịch" },
  ];

  const {
    vCount = 0,
    tCount = 0,
    tSum = 0,
    vClinic = 0,
    vService = 0,
    tExam = 0,
    tCls = 0,
    tDrug = 0,
    tOther = 0,
  } = stats || {};
  const isVisits = tab === "visits";

  const scopeOptions = [
    { code: "all", label: "Tất cả" },
    { code: "today", label: "Hôm nay" },
  ];

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {/* CHIP THỐNG KÊ BÊN TRÁI */}
      <div className="flex flex-wrap items-center gap-2">
        {isVisits ? (
          <>
            <Chip dot="sky">
              Lượt khám {scope === "today" ? "hôm nay" : ""}:{" "}
              <b>{vCount}</b>
            </Chip>
            <Chip dot="sky">
              Khám thường:&nbsp;<b>{vClinic}</b>
            </Chip>
            <Chip dot="amber">
              Khám dịch vụ:&nbsp;<b>{vService}</b>
            </Chip>
          </>
        ) : (
          <>
            <Chip dot="emerald">
              Giao dịch {scope === "today" ? "hôm nay" : ""}:{" "}
              <b>{tCount}</b>
            </Chip>
            <Chip dot="sky">
              Tổng thu:&nbsp;
              <b>{tSum.toLocaleString("vi-VN")} đ</b>
            </Chip>
            <Chip dot="sky">
              Thu khám:&nbsp;<b>{tExam}</b>
            </Chip>
            <Chip dot="cyan">
              Thu CLS:&nbsp;<b>{tCls}</b>
            </Chip>
            <Chip dot="teal">
              Thu thuốc:&nbsp;<b>{tDrug}</b>
            </Chip>
            {tOther > 0 && (
              <Chip dot="slate">
                Khác:&nbsp;<b>{tOther}</b>
              </Chip>
            )}
          </>
        )}
      </div>

      {/* BÊN PHẢI: RESET + NÚT LỌC + CÔNG TẮC SCOPE + TAB */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-sky-400 text-xs px-3 py-2 shadow-sm"
          title="Làm mới bộ lọc"
        >
          ⟲
        </button>

        <button
          type="button"
          ref={filterBtnRef}
          onClick={onOpenFilter}
          className="
            inline-flex items-center gap-1 px-3 py-1.5 rounded-xl
            bg-white ring-1 ring-sky-200 hover:ring-sky-400
            text-[13px] text-sky-700 shadow-sm
          "
          title="Chọn khoảng ngày & bộ lọc"
        >
          <span>📅</span>
          <span>Bộ lọc</span>
        </button>

        {/* CÔNG TẮC TẤT CẢ / HÔM NAY */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white"
          role="group"
          aria-label="Phạm vi dữ liệu"
        >
          {scopeOptions.map((opt) => {
            const active = scope === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => onScopeChange(opt.code)}
                className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-slate-900"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                aria-pressed={active}
              >
                {active && (
                  <motion.span
                    layoutId="historyScopePill"
                    className="absolute inset-0 rounded-lg bg-slate-100"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative">{opt.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB SWITCH */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-sky-200/70 bg-white"
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
                    ? "text-sky-700"
                    : "text-slate-700 hover:text-sky-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="historyTabPill"
                    className="absolute inset-0 rounded-lg bg-sky-50"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
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