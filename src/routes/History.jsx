import React, {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import HistoryToolbar from "../components/history/HistoryToolbar.jsx";
import HistoryTable from "../components/history/HistoryTable.jsx";
import HistoryFilters from "../components/history/HistoryFilterPopover.jsx";
import HistoryDetailModal from "../components/history/HistoryDetailModal.jsx";

import {
  useHistoryVisits,
  useHistoryTransactions,
  todayStats,
} from "../api/history.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

export default function History() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [tab, setTab] = useState("visits");

  // filter state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kw, setKw] = useState("");
  const kwDef = useDeferredValue(kw);

  const [detail, setDetail] = useState({
    open: false,
    type: null,
    row: null,
  });

  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  // load data
  const { data: visitRows = [] } = useHistoryVisits();
  const { data: txnRows = [] } = useHistoryTransactions();

  const rows = useMemo(() => {
    const data = tab === "visits" ? visitRows : txnRows;

    const inRange = (d) => {
      if (!d) return true;
      const dt = new Date(d);
      if (from && dt < new Date(from)) return false;
      if (to && dt > new Date(to)) return false;
      return true;
    };

    const matchKw = (r) =>
      !kwDef ||
      JSON.stringify(r)
        .toLowerCase()
        .includes(kwDef.trim().toLowerCase());

    return data
      .filter((r) => inRange(r.date) && matchKw(r))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [tab, visitRows, txnRows, from, to, kwDef]);

  const stats = useMemo(
    () => todayStats(visitRows, txnRows),
    [visitRows, txnRows]
  );

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setKw("");
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
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
            <HistoryTable
              tab={tab}
              rows={rows}
              onEye={(row, type) =>
                setDetail({ open: true, type, row })
              }
              stretch
            />
          </motion.section>
        </AnimatePresence>
      </div>

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
        onClose={() =>
          setDetail({ open: false, type: null, row: null })
        }
      />
    </motion.main>
  );
}
