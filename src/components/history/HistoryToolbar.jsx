// src/components/history/HistoryToolbar.jsx
import React from 'react';
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

  return (
    <div className="mt-0 flex flex-wrap items-center gap-2">
      <Chip dot="emerald">
        Hôm nay <b className="mx-1">{stats.vCount + stats.tCount}</b> bản ghi
      </Chip>
      <Chip dot="sky">
        Giao dịch <b className="mx-1">{stats.tCount}</b> • Tổng{" "}
        <b>{(stats.tSum || 0).toLocaleString("vi-VN")}</b> đ
      </Chip>

      <div className="ml-auto flex items-center gap-2">
        <button onClick={onResetFilters} className="btn" title="Làm mới bộ lọc">
          ⟲
        </button>
        <button
          ref={filterBtnRef}
          onClick={onOpenFilter}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gradient-to-tr from-sky-50 to-sky-100 px-2.5 py-2 text-sm font-semibold text-white shadow-soft hover:-translate-y-px active:translate-y-0 transition"
          aria-haspopup="dialog"
          title="Lọc & Tìm kiếm"
        >
          <img src="/loc.png" alt="Lọc" className="w-5 h-5" />
        </button>

        <div role="tablist" aria-label="Chọn mục">
          <div className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white">
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={`relative z-9 px-3 py-1.5 font-semibold ${
                    active ? "text-sky-700" : "text-slate-700"
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
    </div>
  );
}
