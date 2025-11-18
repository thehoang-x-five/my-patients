import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

export default function StaffToolbar({
  role,
  setRole,
  q,
  setQ,
  statusFilter,
  setStatusFilter,
  nurseKind,
  setNurseKind,
  dept,
  setDept,
  onReset,
  filterOpen,
  setFilterOpen,
  online,
  idle,
  deptsCount,
  filterBtnRef,
}) {
  const tabs = [
    { key: "doctor", label: "Bác sĩ" },
    { key: "nurse", label: "Y tá" },
  ];

  return (
    <div className="mt-0 flex flex-wrap items-center gap-2 mb-0">
      {/* Counters */}
      <div className="flex items-center gap-2">
        {/* Đổi dot="indigo" thành "teal" cho đồng bộ theme */}
        <Chip dot="teal">
          Tổng nhân sự:
          <b className="ml-1 text-teal-900">{online + idle}</b>
        </Chip>
        <Chip dot="emerald">
          Online:
          <b className="ml-1 text-emerald-900">{online}</b>
        </Chip>
        <Chip dot="amber">
          Đang rảnh:
          <b className="ml-1 text-amber-900">{idle}</b>
        </Chip>
        <Chip dot="slate">
          Khoa:
          <b className="ml-1 text-slate-900">{deptsCount}</b>
        </Chip>
      </div>

      {/* Search + tabs + filter */}
      <div className="ml-auto flex items-center gap-2">
        

        <button
          type="button"
          onClick={onReset}
          className="btn text-xs text-slate-500 hover:text-teal-700 ml-1 transition-colors"
          title="Làm mới"
        >
          ↻
        </button>

        <motion.button
          ref={filterBtnRef}
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          title="Bộ lọc nâng cao"
          aria-label="Bộ lọc nâng cao"
          onClick={() =>
            setFilterOpen((prev) => (typeof prev === "boolean" ? !prev : true))
          }
          // THÊM 'relative' VÀO ĐÂY 👇
          className={`relative inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold shadow-sm transition-colors
            ${
              filterOpen
                ? "bg-teal-50 text-teal-800 border-teal-200 ring-1 ring-teal-200"
                : "bg-gradient-to-tr from-white via-teal-50/50 to-white text-slate-700 hover:bg-teal-50"
            }`}
        >
          <span className="text-teal-600">⚗️</span>
          Lọc
          {filterOpen && (
            // Dấu chấm sẽ nằm chính xác ở góc trên bên phải của nút
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-teal-500 ring-2 ring-white" />
          )}
        </motion.button>

        {/* Role tabs */}
        <div
          className="relative inline-flex p-1 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-slate-50/50"
          role="tablist"
          aria-label="Nhóm nhân sự"
        >
          {tabs.map((t) => {
            const active = role === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setRole(t.key)}
                // Thay text-indigo thành text-teal
                className={`relative z-10 px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors rounded-lg ${
                  active
                    ? "text-teal-700"
                    : "text-slate-600 hover:text-teal-600"
                }`}
                title={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="staffRoleTabPill"
                    // Thay bg-indigo-50 thành bg-white + shadow (hoặc bg-teal-100)
                    className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200/50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
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