import React from 'react';
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

export default function ApptToolbar({
  view,
  setView,
  onOpenCreate,
  counts,
  withinReception,          // boolean
  timeLabel,                // string hh:mm
  receptionHours            // { start, end }
}) {
  return (
    <div className="flex items-center gap-3 w-full">
      {/* Chips thống kê trong ngày */}
      <Chip dot="emerald" tone="white">
        Đã xác nhận <b className="ml-1">{counts?.done ?? 0}</b>
      </Chip>
      <Chip dot="amber" tone="white">
        Đang chờ <b className="ml-1">{counts?.pending ?? 0}</b>
      </Chip>
      <Chip dot="yellow" tone="white">
        Ca hủy <b className="ml-1">{counts?.cancel ?? 0}</b>
      </Chip>

      {/* Thay thế “Hôm nay” bằng chip Giờ tiếp nhận */}
      <Chip
        dot={withinReception ? "emerald" : "slate"}
        tone="white"
        className="hidden sm:inline-flex"
      >
        Giờ tiếp nhận: {timeLabel} ({receptionHours.start}h-{receptionHours.end}h)
      </Chip>

      {/* Switch view */}
      <div
        role="toolbar"
        className="ml-auto relative inline-flex p-0.5 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white"
      >
        <button
          type="button"
          className={`relative z-10 px-3 py-1.5 font-semibold transition ${
            view === "list" ? "text-violet-700" : "text-slate-700"
          }`}
          aria-pressed={view === "list"}
          onClick={() => setView("list")}
        >
          {view === "list" && (
            <motion.span
              layoutId="apptViewPill"
              className="absolute inset-0 rounded-lg bg-violet-50"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">Danh sách</span>
        </button>
        <button
          type="button"
          className={`relative z-10 px-3 py-1.5 font-semibold transition ${
            view === "cal" ? "text-violet-700" : "text-slate-700"
          }`}
          aria-pressed={view === "cal"}
          onClick={() => setView("cal")}
        >
          {view === "cal" && (
            <motion.span
              layoutId="apptViewPill"
              className="absolute inset-0 rounded-lg bg-violet-50"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative">Lịch</span>
        </button>
      </div>

      {/* CTA tạo lịch */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenCreate}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg transition"
      >
        + Tạo lịch hẹn
      </motion.button>
    </div>
  );
}
