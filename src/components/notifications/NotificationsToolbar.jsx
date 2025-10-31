// src/components/notifications/NotificationsToolbar.jsx
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import React from 'react';
const FILTERS = [
  { key: "all", label: "Tất cả" },
  { key: "system", label: "Hệ thống" },
  { key: "appointment", label: "Lịch hẹn" },
  { key: "lab", label: "Xét nghiệm" },
  { key: "rx", label: "Đơn thuốc" },
  { key: "billing", label: "Thanh toán" },
  { key: "task", label: "Công việc" },
  { key: "message", label: "Tin nhắn" },
  { key: "warning", label: "Cảnh báo" },
  { key: "other", label: "Khác" },
];

export default function NotificationsToolbar({
  filter,
  setFilter,
  stats,
  q,
  setQ,
  onMarkAll,
}) {
  return (
    <div className="mt-0 flex flex-wrap items-center gap-2">
      <Chip dot="emerald">
        Hôm nay: <b className="mx-1">{stats.todayTotal}</b> bản ghi
      </Chip>
      <Chip dot="sky">
        Chưa đọc: <b className="mx-1">{stats.unreadToday}</b>
      </Chip>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <select
            id="notiFilter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="appearance-none rounded-xl px-4 py-1.5 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
            aria-label="Lọc thông báo theo loại"
          >
            {FILTERS.map((f) => (
              <option key={f.key} value={f.key}>
                {f.label}
              </option>
            ))}
          </select>
          <motion.span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
            ▾
          </motion.span>
        </div>

        <label className="relative">
          <span className="sr-only">Tìm thông báo</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tiêu đề / nội dung / BN / mã…"
            className="rounded-xl px-3 py-2 pl-9 pr-7 bg-white focus:ring-2 ring-1 ring-slate-200/80 dark:ring-slate-700/60 outline-none focus:ring-brand-500"
          />
          <span className="absolute left-2 top-2.5" aria-hidden>
            🔎
          </span>
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </label>

        <button
          className="btn-primary ml-auto inline-flex items-center gap-2 rounded-xl border border-transparent  px-4 py-2 text-sm font-semibold text-white shadow-soft hover:-translate-y-px transition"
          onClick={onMarkAll}
          aria-label="Đánh dấu tất cả đã đọc"
          title="Đánh dấu tất cả đã đọc"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>
    </div>
  );
}
