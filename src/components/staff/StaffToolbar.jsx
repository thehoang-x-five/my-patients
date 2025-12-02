// src/components/staff/StaffToolbar.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

export default function StaffToolbar({
  role,
  setRole,
  stats,
  onOpenFilter,
  onResetFilters,
  filterBtnRef,
}) {
  const total = stats?.total ?? 0;
  const online = stats?.online ?? 0;
  const pause = stats?.pause ?? 0;
  const offline = stats?.offline ?? 0;
  const depts = stats?.depts ?? 0;

  const tabs = [
    { key: "doctor", label: "Bác sĩ" },
    { key: "nurse", label: "Y tá" },
  ];

  return (
    <div className="mt-0  flex flex-wrap items-center gap-2">
      {/* Chip thống kê bên trái */}
      <Chip dot="teal">
        Tổng nhân sự:&nbsp;<b>{total}</b>
      </Chip>
      <Chip dot="emerald">
        Online:&nbsp;<b>{online}</b>
      </Chip>
      <Chip dot="amber">
        Pause:&nbsp;<b>{pause}</b>
      </Chip>
      <Chip dot="slate">
        Offline:&nbsp;<b>{offline}</b>
      </Chip>
      <Chip dot="cyan">
        Khoa:&nbsp;<b>{depts}</b>
      </Chip>

      {/* Bên phải: Reset + Filter + Tabs */}
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {/* Reset filter */}
        <button
          type="button"
          onClick={onResetFilters}
          title="Làm mới bộ lọc"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 text-slate-500 hover:bg-emerald-50 hover:ring-emerald-400 shadow-sm text-sm"
        >
          ⟲
        </button>

        {/* Nút mở popover filter */}
        <button
          type="button"
          ref={filterBtnRef}
          data-popover-anchor="staff-filter"
          onClick={onOpenFilter}
          className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-[13px] shadow-sm ring-1 ring-emerald-200 hover:ring-emerald-400 hover:bg-emerald-50 text-slate-700"
        >
          <span className="text-emerald-600">🔍</span>
          Bộ lọc
        </button>

        {/* Tabs Bác sĩ / Y tá */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-emerald-200/80 bg-white"
          role="tablist"
          aria-label="Loại nhân sự"
        >
          {tabs.map((t) => {
            const active = role === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setRole(t.key)}
                className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-emerald-800"
                    : "text-slate-700 hover:text-emerald-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="staffRoleTabPill"
                    className="absolute inset-0 rounded-lg bg-emerald-50"
                    transition={{ type: "spring", stiffness: 420, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
