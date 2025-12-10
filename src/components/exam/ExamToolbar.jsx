import React from "react";
import Chip from "../ui/Chip.jsx";
import { motion } from "framer-motion";

export default function ExamToolbar({
  todayCount = 0,
  waitingCount = 0,
  inProgressCount = 0,
  doneCount = 0,
  onOpenFilter,
  onReset,
}) {
  return (
    <div className="mt-0 mb-1 flex flex-wrap items-center gap-2">
      <Chip dot="teal">
        Hôm nay <b className="ml-1">{todayCount}</b>
      </Chip>

      <Chip dot="amber">
        Đang chờ <b className="ml-1">{waitingCount}</b>
      </Chip>

      <Chip dot="emerald">
        Đang thực hiện <b className="ml-1">{inProgressCount}</b>
      </Chip>

      <Chip dot="cyan">
        Đã phục vụ <b className="ml-1">{doneCount}</b>
      </Chip>

      <div className="ml-auto flex items-center gap-2">
        <motion.button
          type="button"
          onClick={onReset}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-sky-50"
        >
          <span className="text-slate-500 text-sm">↺</span>
     
        </motion.button>

        <motion.button
          type="button"
          data-queue-filter="btn"
          onClick={onOpenFilter}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          className="inline-flex items-center gap-1 rounded-xl border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-sky-100"
        >
          <span className="text-sky-500">🔍</span>
          <span>Lọc</span>
        </motion.button>
      </div>
    </div>
  );
}
