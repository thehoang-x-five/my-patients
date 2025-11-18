import React from "react";
import Chip from "../ui/Chip.jsx";
import {motion} from "framer-motion";
export default function ExamToolbar({
  todayCount = 0,
  waitingCount = 0,
  q,
  onSearch,
  hideSearch = false,
  onOpenFilter, // mở popover
  onReset,      // reset bộ lọc + search
}) {
  return (
    <div className="mt-0 mb-1 flex flex-wrap items-center gap-2">
      {/* Chips tổng quan bên trái */}
      <Chip dot="teal">
        Hôm nay <b className="ml-1">{todayCount}</b>
      </Chip>
      <Chip dot="amber">
        Đang chờ <b className="ml-1">{waitingCount}</b>
      </Chip>

      {/* Phần bên phải: search + Reset + Lọc giống Patients */}
      {!hideSearch && (
        <div className="ml-auto flex items-center gap-2">
          {/* Ô search đồng bộ style với Patients */}
          <div className="relative">
            <input
              value={q}
              aria-label="Tìm kiếm bệnh nhân"
              onChange={(e) => onSearch?.(e.target.value)}
              placeholder="Tìm theo tên / mã BN / SĐT…"
              className="rounded-2xl border border-slate-200 bg-white/90 px-3 py-2 pl-9 pr-9 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-transparent focus:ring-2 focus:ring-teal-500"
            />
            <span className="pointer-events-none absolute left-2.5 top-2.5 text-slate-400 text-sm">
              🔍
            </span>
            {q && (
              <button
                type="button"
                onClick={() => onSearch?.("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Nút Reset giống trang bệnh nhân */}
          <motion.button
            type="button"
            onClick={onReset}
            whileHover={{ scale: 1.05}}
        whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-gradient-to-tr from-cyan-100 via-white to-cyan-100 px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:bg-sky-100/60"
          >
            <span className="text-black-400 text-sm">⟲</span>
            
          </motion.button>

          {/* Nút Lọc mở popover */}
          <motion.button
            type="button"
            data-queue-filter="btn"
            onClick={onOpenFilter}
            whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-gradient-to-tr from-white via-cyan-100/40 to-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-sky-100/60"
          >
            <span className="text-sky-500">⚗️</span>
            Lọc
          </motion.button>
        </div>
      )}
    </div>
  );
}
