// /src/components/notifications/NotificationsToolbar.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
export default function NotificationsToolbar({
  tab,
  setTab,
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const total = stats?.total ?? 0;
  const unread = stats?.unread ?? 0;
  const today = stats?.today ?? 0;
  const priority = stats?.priorityHigh ?? stats?.priority ?? 0;

  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "unread", label: "Chưa đọc" },
    { key: "today", label: "Hôm nay" },
  ];

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Left: stats chips */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip dot="violet">
          Tổng:&nbsp;<b>{total}</b>
        </Chip>
        <Chip dot="rose">
          Chưa đọc:&nbsp;<b>{unread}</b>
        </Chip>
        <Chip dot="emerald">
          Ưu tiên:&nbsp;<b>{priority}</b>
        </Chip>
        <Chip dot="sky">
          Hôm nay:&nbsp;<b>{today}</b>
        </Chip>
      </div>

      {/* Right: filter + tabs */}
      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={onResetFilters}
          title="Làm mới bộ lọc"
          className="inline-flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 px-3 py-1.5 text-[12px] text-slate-600 hover:ring-violet-400 hover:text-violet-700 transition"
        >
          ⟲
        </button>

        <button
          ref={filterBtnRef}
          type="button"
          onClick={onOpenFilter}
          data-popover-anchor="notif-filter"
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl
            bg-white ring-1 ring-violet-200 hover:ring-violet-400
            text-[13px] shadow-sm
          "
        >
          <span className="text-violet-600">🔍</span>
          <span>Bộ lọc</span>
        </button>

        {/* Segmented tabs */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-violet-200/70 bg-white"
          role="tablist"
          aria-label="Chọn chế độ hiển thị"
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
                    ? "text-violet-700"
                    : "text-slate-700 hover:text-violet-700"
                }`}
                title={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="notifTabPill"
                    className="absolute inset-0 rounded-lg bg-violet-50"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}


