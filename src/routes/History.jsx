import React, {
  useDeferredValue,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

import HistoryToolbar from "../components/history/HistoryToolbar.jsx";
import HistoryTable from "../components/history/HistoryTable.jsx";
import HistoryDetailModal from "../components/history/HistoryDetailModal.jsx";
import HistoryFilterPopover from "../components/history/HistoryFilterPopover.jsx";

import {
  useHistoryVisits,
  useHistoryTransactions,
} from "../api/history.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

/* ====== utils ====== */
function pad2(n) {
  return String(n).padStart(2, "0");
}
function toYmd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(
    d.getDate()
  )}`;
}
function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getVisitKind(row) {
  const raw = (
    row.type ||
    row.loaiLuot ||
    row.LoaiLuot ||
    ""
  ).toLowerCase();

  if (
    raw.includes("dv") ||
    raw.includes("service") ||
    raw.includes("dich_vu")
  ) {
    return "service";
  }
  return "clinic";
}

function getTxnKind(row) {
  const raw = (
    row.loaiDotThu ||
    row.LoaiDotThu ||
    row.kind ||
    row.type ||
    ""
  ).toLowerCase();

  if (!raw) return "other";
  if (
    raw.includes("kham") ||
    raw.includes("exam") ||
    raw.includes("kham_lam_sang")
  ) {
    return "exam";
  }
  if (
    raw.includes("cls") ||
    raw.includes("can_lam_sang") ||
    raw.includes("xet_nghiem") ||
    raw.includes("cdha")
  ) {
    return "cls";
  }
  if (raw.includes("thuoc") || raw.includes("drug")) {
    return "drug";
  }
  return "other";
}

/* ====== main page ====== */
export default function History() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [tab, setTab] = useState("visits"); // visits | transactions
  const [scope, setScope] = useState("all"); // all | today

  // filter state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kw, setKw] = useState("");
  const [visitType, setVisitType] = useState("all"); // all | clinic | service
  const [txnType, setTxnType] = useState("all"); // all | exam | cls | drug | other
  const kwDef = useDeferredValue(kw);

  const [detail, setDetail] = useState({
    open: false,
    type: null,
    row: null,
  });

  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  const { data: visitRows = [] } = useHistoryVisits();
  const { data: txnRows = [] } = useHistoryTransactions();

  /* ====== common filter helpers ====== */
  const inRange = (date) => {
    if (!date) return true;
    const d = new Date(date);
    if (from && d < new Date(from)) return false;
    if (to && d > new Date(to)) return false;
    return true;
  };

  const matchKw = (row) =>
    !kwDef ||
    JSON.stringify(row)
      .toLowerCase()
      .includes(kwDef.trim().toLowerCase());

  const matchScope = (row) =>
    scope === "all" ? true : isToday(row.date || row.thoiGian);

  const matchVisitType = (row) =>
    visitType === "all" || getVisitKind(row) === visitType;

  const matchTxnType = (row) =>
    txnType === "all" || getTxnKind(row) === txnType;

  /* ====== filtered lists cho 2 tab ====== */
  const filteredVisits = useMemo(
    () =>
      visitRows
        .filter((r) => inRange(r.date))
        .filter(matchKw)
        .filter(matchScope)
        .filter(matchVisitType)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [visitRows, from, to, kwDef, scope, visitType]
  );

  const filteredTxns = useMemo(
    () =>
      txnRows
        .filter((r) => inRange(r.date))
        .filter(matchKw)
        .filter(matchScope)
        .filter(matchTxnType)
        .sort((a, b) => new Date(b.date) - new Date(a.date)),
    [txnRows, from, to, kwDef, scope, txnType]
  );

  const rows = tab === "visits" ? filteredVisits : filteredTxns;

  /* ====== stats dựa trên dữ liệu đang lọc ====== */
  const stats = useMemo(() => {
    // visits
    let vClinic = 0;
    let vService = 0;
    filteredVisits.forEach((v) => {
      const kind = getVisitKind(v);
      if (kind === "service") vService += 1;
      else vClinic += 1;
    });

    // transactions
    let tExam = 0;
    let tCls = 0;
    let tDrug = 0;
    let tOther = 0;
    let tSum = 0;

    filteredTxns.forEach((t) => {
      const kind = getTxnKind(t);
      if (kind === "exam") tExam += 1;
      else if (kind === "cls") tCls += 1;
      else if (kind === "drug") tDrug += 1;
      else tOther += 1;

      const amtRaw =
        t.amount ?? t.soTien ?? t.SoTien ?? t.tongTien ?? 0;
      const amt = Number(amtRaw) || 0;
      tSum += amt;
    });

    return {
      scope,
      vCount: filteredVisits.length,
      vClinic,
      vService,
      tCount: filteredTxns.length,
      tSum,
      tExam,
      tCls,
      tDrug,
      tOther,
    };
  }, [filteredVisits, filteredTxns, scope]);

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setKw("");
    setVisitType("all");
    setTxnType("all");
    setScope("all");
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
          scope={scope}
          onScopeChange={setScope}
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
            className="card p-4 pt-2 mt-0 flex-1 min-h-0 flex flex-col"
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

      {/* Popover filter (calendar + loại lượt / loại thu) */}
      <HistoryFilterPopover
        open={openFilter}
        onClose={() => setOpenFilter(false)}
        anchorEl={filterBtnRef.current}
        tab={tab}
        values={{
          dateFrom: from,
          dateTo: to,
          keyword: kw,
          visitType,
          txnType,
        }}
        setValues={({
          dateFrom,
          dateTo,
          keyword,
          visitType,
          txnType,
        }) => {
          if (dateFrom !== undefined) setFrom(dateFrom);
          if (dateTo !== undefined) setTo(dateTo);
          if (keyword !== undefined) setKw(keyword);
          if (visitType !== undefined) setVisitType(visitType);
          if (txnType !== undefined) setTxnType(txnType);
        }}
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
