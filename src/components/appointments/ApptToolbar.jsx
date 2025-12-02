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
      Đã xác nhận <b className="ml-1">{counts?.confirmed ?? 0}</b>
    </Chip>
    <Chip dot="sky" tone="white">
      Đã check-in <b className="ml-1">{counts?.checkedIn ?? 0}</b>
    </Chip>
    <Chip dot="amber" tone="white">
      Đang chờ <b className="ml-1">{counts?.pending ?? 0}</b>
    </Chip>
    <Chip dot="red" tone="white">
      Ca hủy <b className="ml-1">{counts?.cancel ?? 0}</b>
    </Chip>
  
    {/* Chip giờ tiếp nhận như cũ */}
    <Chip
      dot={withinReception ? "emerald" : "slate"}
      tone="white"
      className="ml-2"
    >
      Giờ tiếp nhận:{" "}
      <b className="ml-1">
        {receptionHours?.start}h–{receptionHours?.end}h
      </b>
      <span className="ml-2 text-xs text-slate-500">
        (hiện tại {timeLabel})
      </span>
    </Chip>
      {/* Switch view */}
      <div
        role="toolbar"
        className="ml-auto relative inline-flex p-0.5 rounded-xl overflow-hidden ring-1 ring-slate-200 bg-white"
      >
        <button
          type="button"
          className={`relative z-10 px-3 py-1 font-semibold transition ${
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
          className={`relative z-10 px-3 py-1 font-semibold transition ${
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
        id="appt-create-btn"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenCreate}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-md hover:shadow-lg transition"
      >
        + Tạo lịch hẹn
      </motion.button>
    </div>
  );
}
