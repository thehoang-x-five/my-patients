import React from 'react';
import { useDeferredValue, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import HistoryToolbar from "../components/history/HistoryToolbar.jsx";
import HistoryTable from "../components/history/HistoryTable.jsx";
import HistoryFilters from "../components/history/HistoryFilterPopover.jsx";
import HistoryDetailModal from "../components/history/HistoryDetailModal.jsx";
import { VISITS, TRANSACTIONS, todayStats } from "../data/history.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function History() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [tab, setTab] = useState("visits");
  const stats = todayStats(VISITS, TRANSACTIONS);

  // filters (controlled at route)
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kw, setKw] = useState("");
  const kwDef = useDeferredValue(kw);

  const [detail, setDetail] = useState({ open: false, type: null, row: null });

  // popover control
  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  // rows
  const rows = useMemo(() => {
    const data = tab === "visits" ? VISITS : TRANSACTIONS;
    const inRange = (d) => {
      if (!d) return false;
      const dt = new Date(d);
      if (from && dt < new Date(from)) return false;
      if (to && dt > new Date(to)) return false;
      return true;
    };
    const match = (r) =>
      !kwDef ||
      JSON.stringify(r).toLowerCase().includes(kwDef.trim().toLowerCase());

    return data
      .filter((r) => inRange(r.date) && match(r))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tab, from, to, kwDef]);

  // helper to clear filters (topbar button)
  const resetFilters = () => {
    setFrom("");
    setTo("");
    setKw("");
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Lịch sử"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <HistoryToolbar
          tab={tab}
          setTab={setTab}
          stats={stats}
          onOpenFilter={() => setOpenFilter(true)}
          onResetFilters={resetFilters}
          filterBtnRef={filterBtnRef}
        />

        <AnimatePresence mode="wait">
          <motion.section
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="card p-4 pt-2 mt-3 flex-1 min-h-0 flex flex-col"
          >
            {/* Bảng giãn đầy phần còn lại và tự scroll */}
            <HistoryTable
              tab={tab}
              rows={rows}
              onEye={(row, type) => setDetail({ open: true, type, row })}
              stretch
            />
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Popover lọc (tự động áp dụng) */}
      <HistoryFilters
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        values={{ dateFrom: from, dateTo: to, keyword: kw }}
        setValues={({ dateFrom, dateTo, keyword }) => {
          if (dateFrom !== undefined) setFrom(dateFrom);
          if (dateTo !== undefined) setTo(dateTo);
          if (keyword !== undefined) setKw(keyword);
        }}
        anchorEl={filterBtnRef.current}
      />

      <HistoryDetailModal
        open={detail.open}
        type={detail.type}
        row={detail.row}
        onClose={() => setDetail({ open: false, type: null, row: null })}
      />
    </motion.main>
  );
}
