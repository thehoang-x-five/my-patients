import { motion } from "framer-motion";
import React from 'react';
import { PERIODS } from "../../data/reports.js";

export default function ReportToolbar({
  period,
  setPeriod,
  from,
  setFrom,
  to,
  setTo,
  tab, // (giữ cho tương lai nếu cần tabs)
  setTab,
  view, // <- NEW
  setView, // <- NEW
  onExport,
  onReset,
}) {
  return (
    <header className="flex top-0 z-9 -mx-4 px-4 ">
      <div className="flex w-full items-center gap-3 justify-end">
        {/* View switch: Chart / Table */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white ml-0 mr-auto mr-a"
          role="tablist"
          aria-label="Chế độ xem"
        >
          {["chart", "table"].map((mode) => {
            const label = mode === "chart" ? "Xem biểu đồ" : "Xem bảng số liệu";
            const active = view === mode;
            return (
              <button
                key={mode}
                role="tab"
                aria-selected={active}
                onClick={() => setView(mode)}
                className={`relative z-9 px-3 py-1.5 font-semibold ${
                  active ? "text-sky-700" : "text-slate-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="reportsViewPill"
                    className="absolute inset-0 rounded-lg bg-sky-50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Export | Date range | Period combobox */}
        <button
          className="btn"
          onClick={onExport}
          aria-label="Xuất báo cáo"
          title="Xuất báo cáo"
        >
          ⬇️ Xuất
        </button>

        <label className="relative">
          <span className="sr-only">Từ ngày</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-xl px-3 py-2 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
          />
        </label>
        <span aria-hidden className="text-slate-400">
          –
        </span>
        <label className="relative">
          <span className="sr-only">Đến ngày</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-xl px-3 py-2 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
          />
        </label>

        <select
          aria-label="Khoảng thời gian"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-xl px-3 py-2 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
        >
          {PERIODS.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
        </select>

        <button className="btn" onClick={onReset} title="Làm mới">
          ↻
        </button>
      </div>
    </header>
  );
}
