// src/components/reports/ReportToolbar.jsx
import { motion } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import ReportFilterPopover from "./ReportFilterPopover.jsx";

export default function ReportToolbar({
  period,
  setPeriod,
  from,
  setFrom,
  to,
  setTo,
  tab, // để dành nếu sau này cần tab
  setTab,
  view,
  setView,
  onExport,
  onReset,
}) {
  const [openFilter, setOpenFilter] = useState(false);
  const popoverRef = useRef(null);
  const filterBtnRef = useRef(null);
  const justOpenedRef = useRef(false);

  const closeFilter = () => setOpenFilter(false);
  const handleReset = () => {
    onReset?.();
    closeFilter();
  };

  useEffect(() => {
    if (!openFilter) return;
    justOpenedRef.current = true;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeFilter();
    };

    const onClickOutside = (event) => {
      if (justOpenedRef.current) return;

      const target = event.target;
      const clickedAnchor = !!target?.closest?.(
        '[data-popover-anchor="report-filter"]'
      );
      if (clickedAnchor) return;

      const insidePopover = popoverRef.current?.contains(target);
      const insideAnchor = filterBtnRef.current?.contains(target);
      if (!insidePopover && !insideAnchor) {
        closeFilter();
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    const timer = setTimeout(() => {
      justOpenedRef.current = false;
      document.addEventListener("click", onClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("click", onClickOutside, true);
      clearTimeout(timer);
    };
  }, [openFilter]);

  return (
    <header className="flex top-0 z-9 -mx-4 px-4">
      <div className="relative flex w-full items-center gap-3 justify-between">
        {/* LÊN ĐẦU: Tab switcher (Tổng quan | Phân tích Y khoa) */}
        <div className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white">
          {[
            { key: "overview", label: "📊 Tổng quan" },
            { key: "analytics", label: "🔬 Phân tích Y khoa" },
          ].map(({ key, label }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`relative z-10 px-3 py-1.5 text-xs sm:text-sm font-semibold transition ${
                  active ? "text-cyan-700" : "text-slate-600 hover:text-slate-800"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="reportsTabPill"
                    className="absolute inset-0 rounded-lg bg-cyan-50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* View switch: Chart / Table */}
          {tab === "overview" && (
            <div
              className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white"
              role="tablist"
              aria-label="Chế độ xem"
            >
          {["chart", "table"].map((mode) => {
            const label =
              mode === "chart" ? "Xem biểu đồ" : "Xem bảng số liệu";
            const active = view === mode;
            return (
              <button
                key={mode}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setView(mode)}
                className={`relative z-10 px-2 py-1.5 text-xs sm:text-sm font-semibold ${
                  active ? "text-cyan-700" : "text-slate-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="reportsViewPill"
                    className="absolute inset-0 rounded-lg bg-cyan-50"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
        )}

        {/* Reset – ngoài popover */}
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full px-3 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 hover:bg-slate-50 hover:ring-cyan-300 text-slate-700 inline-flex items-center gap-1"
        >
          ↻ 
        </button>

        {/* Filter popover trigger */}
        <button
          ref={filterBtnRef}
          type="button"
          onClick={() => setOpenFilter((v) => !v)}
          data-popover-anchor="report-filter"
          aria-expanded={openFilter}
          aria-haspopup="dialog"
          className="rounded-xl px-3 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 hover:bg-cyan-50 hover:ring-cyan-300 text-slate-700 inline-flex items-center gap-1"
        >
          ⚙️ <span className="hidden sm:inline">Bộ lọc</span>
        </button>
        {/* Export */}
        <button
          type="button"
          className="rounded-xl px-3 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 hover:bg-slate-50 hover:ring-cyan-300 text-slate-700 inline-flex items-center gap-1"
          onClick={onExport}
          aria-label="Xuất báo cáo"
          title="Xuất báo cáo"
        >
          ⬇️ <span className="hidden sm:inline">Xuất</span>
        </button>

        {openFilter && (
          <ReportFilterPopover
            popoverRef={popoverRef}
            period={period}
            from={from}
            to={to}
            setPeriod={setPeriod}
            setFrom={setFrom}
            setTo={setTo}
            onReset={onReset}
            onClose={closeFilter}
          />
        )}
        </div>
      </div>
    </header>
  );
}
