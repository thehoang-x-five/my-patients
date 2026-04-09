import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import { useUI } from "../../context/UIContext.jsx";

export default function NotificationsToolbar({
  tab,
  setTab,
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
  hideTabs = false,
}) {
  const { lang } = useUI();
  const total = stats?.total ?? 0;
  const unread = stats?.unread ?? 0;
  const today = stats?.today ?? 0;
  const priority = stats?.priorityHigh ?? stats?.priority ?? 0;

  const t =
    lang === "en"
      ? {
          total: "Total",
          unread: "Unread",
          priority: "Priority",
          today: "Today",
          reset: "Reset filters",
          filter: "Filters",
          tabsLabel: "Select display mode",
          all: "All",
          unreadTab: "Unread",
          todayTab: "Today",
        }
      : {
          total: "Tổng",
          unread: "Chưa đọc",
          priority: "Ưu tiên",
          today: "Hôm nay",
          reset: "Làm mới bộ lọc",
          filter: "Bộ lọc",
          tabsLabel: "Chọn chế độ hiển thị",
          all: "Tất cả",
          unreadTab: "Chưa đọc",
          todayTab: "Hôm nay",
        };

  const tabs = [
    { key: "all", label: t.all },
    { key: "unread", label: t.unreadTab },
    { key: "today", label: t.todayTab },
  ];

  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip dot="violet">
          {t.total}:&nbsp;<b>{total}</b>
        </Chip>
        <Chip dot="rose">
          {t.unread}:&nbsp;<b>{unread}</b>
        </Chip>
        <Chip dot="emerald">
          {t.priority}:&nbsp;<b>{priority}</b>
        </Chip>
        <Chip dot="sky">
          {t.today}:&nbsp;<b>{today}</b>
        </Chip>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <button
          type="button"
          onClick={onResetFilters}
          title={t.reset}
          className="inline-flex items-center justify-center rounded-2xl bg-white px-3 py-1.5 text-[12px] text-slate-600 ring-1 ring-slate-200 transition hover:text-violet-700 hover:ring-violet-400"
        >
          ⟲
        </button>

        <button
          ref={filterBtnRef}
          type="button"
          onClick={onOpenFilter}
          data-popover-anchor="notif-filter"
          className="flex items-center gap-1.5 rounded-xl bg-white px-3 py-1.5 text-[13px] shadow-sm ring-1 ring-violet-200 hover:ring-violet-400"
        >
          <span className="text-violet-600">🔍</span>
          <span>{t.filter}</span>
        </button>

        {!hideTabs && (
          <div
            className="relative inline-flex overflow-hidden rounded-xl bg-white p-0.5 ring-1 ring-violet-200/70"
            role="tablist"
            aria-label={t.tabsLabel}
          >
            {tabs.map((item) => {
              const active = tab === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.key)}
                  className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                    active
                      ? "text-violet-700"
                      : "text-slate-700 hover:text-violet-700"
                  }`}
                  title={item.label}
                >
                  {active && (
                    <motion.span
                      layoutId="notifTabPill"
                      className="absolute inset-0 rounded-lg bg-violet-50"
                      transition={{ type: "spring", stiffness: 420, damping: 30 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
