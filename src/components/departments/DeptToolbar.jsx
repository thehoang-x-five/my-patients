import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import React from 'react';

export default function DeptToolbar({ tab, setTab, total, activeCount = 0, query, setQuery }) {
  const tabs = [
    { key: "all", label: "Tất cả" },
    { key: "active", label: "On" },
    { key: "inactive", label: "Off" }
  ];

  return (
    <div className="mt-0 flex flex-wrap items-center gap-2 mb-0">
      <div className="flex items-center gap-2">
        <Chip dot="indigo">Tổng phòng: <b className="ml-1">{total}</b></Chip>
        <Chip dot="emerald">Đang hoạt động: <b className="ml-1">{activeCount}</b></Chip>
      </div>

      {/* Search */}
      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo số phòng, khoa, BS/ĐD phụ trách…"
            className=" rounded-xl pl-9 pr-8 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-indigo-400 outline-none bg-white"
            aria-label="Tìm kiếm phòng"
          />
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">🔎</span>
          {query && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              onClick={() => setQuery("")}
              aria-label="Xoá tìm kiếm"
              title="Xoá"
            >
              ✕
            </button>
          )}
        </div>

        <div className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200 bg-white" role="tablist" aria-label="Bộ lọc phòng">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`relative z-10 px-3 py-1.5 text-xs sm:text-sm font-semibold transition-colors rounded-lg ${
                  active ? "text-indigo-700" : "text-slate-700 hover:text-indigo-700"
                }`}
              
                title={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="deptTabPill"
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
