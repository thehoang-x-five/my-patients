import React from 'react';
import Chip from "../ui/Chip.jsx";

export default function ExamToolbar({ q, onSearch, todayCount = 0, waitingCount = 0, hideSearch = false }) {
  return (
    <div className="mt-0 flex flex-wrap items-center gap-2">
      <Chip dot="teal">Hôm nay <b className="ml-1">{todayCount}</b></Chip>
      <Chip dot="amber">Đang chờ <b className="ml-1">{waitingCount ?? todayCount}</b></Chip>

      {!hideSearch && (
        <div className="relative ml-auto">
          <input
            value={q}
            aria-label="Tìm kiếm bệnh nhân"
            onChange={(e) => onSearch?.(e.target.value)}
            placeholder="Tìm theo tên hoặc mã BN…"
            className="rounded-xl px-3 py-2 pl-9 pr-8 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-teal-500"
          />
          <span className="absolute left-2 top-2.5">🔎</span>
          {onSearch && q && (
            <button
              type="button"
              onClick={() => onSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Xóa tìm kiếm"
            >
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
}
