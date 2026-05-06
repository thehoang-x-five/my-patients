import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router-dom";

import HistoryToolbar from "../components/history/HistoryToolbar.jsx";
import HistoryTable from "../components/history/HistoryTable.jsx";
import HistoryDetailModal from "../components/history/HistoryDetailModal.jsx";
import HistoryFilterPopover from "../components/history/HistoryFilterPopover.jsx";
import Pagination from "../components/ui/Pagination.jsx";

import { useHistoryVisits, useHistoryTransactions, subscribeHistory } from "../api/history.js";
import { useUIStore } from "../components/stores/appStore.js";

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
function startOfLocalDayIso(ymd) {
  return ymd ? `${ymd}T00:00:00` : null;
}
function endOfLocalDayIso(ymd) {
  return ymd ? `${ymd}T23:59:59.999` : null;
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
    raw.includes("can_lam_sang") ||
    raw.includes("cls") ||
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

function mapTxnTypeToBackend(value) {
  switch (value) {
    case "exam":
      return "kham_lam_sang";
    case "cls":
      return "can_lam_sang";
    case "drug":
      return "thuoc";
    default:
      return null;
  }
}

function readVisitStatusScopeParam(searchParams) {
  const value = String(
    searchParams.get("statusScope") || searchParams.get("visitStatusScope") || ""
  )
    .trim()
    .toLowerCase();

  return ["medical", "cancelled", "all"].includes(value) ? value : "";
}

/* ====== main page ====== */
export default function History() {
  const { search } = useLocation();
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const sp = useMemo(() => new URLSearchParams(search), [search]);
  const initTab = sp.get("tab") || "visits";
  const initPid = sp.get("pid") || "";
  const initHighlight = sp.get("highlight") || null;
  const initVisitStatusScope = readVisitStatusScopeParam(sp);

  const [tab, setTab] = useState(initTab); // visits | transactions
  const [scope, setScope] = useState(initPid ? "all" : "all"); // all | today

  // filter state
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [kw, setKw] = useState(initPid);
  const [visitType, setVisitType] = useState("all"); // all | clinic | service
  const [visitStatusScope, setVisitStatusScope] = useState(initVisitStatusScope || "medical"); // medical | cancelled | all
  const [txnType, setTxnType] = useState("all"); // all | exam | cls | drug | other
  
  // ✅ Use UIStore for highlight (like Patients page)
  const highlightHistoryId = useUIStore((s) => s.highlightHistoryId);
  const setHighlightHistoryId = useUIStore((s) => s.setHighlightHistoryId);
  const clearHighlightHistory = useUIStore((s) => s.clearHighlightHistory);
  const highlightScrolledRef = useRef(false);

  // ✅ Track when highlight was first shown
  const highlightTimestampRef = useRef(null);

  // Record timestamp when highlight appears
  useEffect(() => {
    if (highlightHistoryId && !highlightTimestampRef.current) {
      highlightTimestampRef.current = Date.now();
    }
  }, [highlightHistoryId]);

  // Clear highlight on unmount (only if shown for at least 1 second)
  useEffect(() => {
    return () => {
      if (highlightTimestampRef.current) {
        const elapsed = Date.now() - highlightTimestampRef.current;
        // Chỉ clear nếu đã hiển thị ít nhất 1 giây (user đã thấy)
        if (elapsed >= 1000) {
          clearHighlightHistory();
        }
      }
    };
  }, [clearHighlightHistory]);

  // Sync highlight from URL on mount
  useEffect(() => {
    if (initHighlight && !highlightHistoryId) {
      setHighlightHistoryId(initHighlight);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync state when URL search changes externally (e.g. deep-link from Đơn thuốc)
  useEffect(() => {
    const s = new URLSearchParams(search);
    const h = s.get("highlight");
    const p = s.get("pid");
    const t = s.get("tab");
    const statusScopeParam = readVisitStatusScopeParam(s);
    
    if (h && h !== highlightHistoryId) {
      setHighlightHistoryId(h);
      highlightScrolledRef.current = false;
    }
    if (p && p !== kw) { setKw(p); setScope("all"); }
    if (t && t !== tab) setTab(t);
    if (statusScopeParam && statusScopeParam !== visitStatusScope) {
      setVisitStatusScope(statusScopeParam);
      setVisitPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Auto clear highlight after 10 seconds
  useEffect(() => {
    if (!highlightHistoryId) return;
    const timer = setTimeout(() => {
      clearHighlightHistory();
      highlightScrolledRef.current = false;
    }, 10000);
    return () => clearTimeout(timer);
  }, [highlightHistoryId, clearHighlightHistory]);

  // ✅ Pagination
  const [visitPage, setVisitPage] = useState(1);
  const [txnPage, setTxnPage] = useState(1);

  const [detail, setDetail] = useState({
    open: false,
    type: null,
    row: null,
  });

  const [openFilter, setOpenFilter] = useState(false);
  const filterBtnRef = useRef(null);

  // ✅ Map frontend filter → backend filter params
  const visitFilterParams = useMemo(() => {
    const params = {
      page: visitPage,
      pageSize: 50,
    };

    // Scope: today
    if (scope === "today") {
      params.onlyToday = true;
    } else {
      // Date range: giữ local day, không dùng toISOString để tránh lệch ngày do timezone.
      if (from) {
        params.fromTime = startOfLocalDayIso(from);
      }
      if (to) {
        params.toTime = endOfLocalDayIso(to);
      }
    }

    // Keyword
    if (kw && kw.trim()) {
      params.keyword = kw.trim();
    }

    // Visit type: map frontend → backend
    if (visitType === "clinic") {
      params.loaiLuot = "kham_lam_sang";
    } else if (visitType === "service") {
      params.loaiLuot = "can_lam_sang";
    }
    // "all" → không set loaiLuot

    params.statusScope = visitStatusScope;

    return params;
  }, [from, to, scope, kw, visitType, visitStatusScope, visitPage]);

  const txnFilterParams = useMemo(() => {
    const params = {
      page: txnPage,
      pageSize: 50,
    };

    if (scope === "today") {
      const today = toYmd(new Date());
      params.fromTime = startOfLocalDayIso(today);
      params.toTime = endOfLocalDayIso(today);
    } else {
      if (from) {
        params.fromTime = startOfLocalDayIso(from);
      }
      if (to) {
        params.toTime = endOfLocalDayIso(to);
      }
    }
    if (kw && kw.trim()) {
      params.keyword = kw.trim();
    }
    if (txnType !== "all") {
      params.loaiDotThu = mapTxnTypeToBackend(txnType);
    }

    return params;
  }, [from, to, scope, kw, txnType, txnPage]);

  const {
        data: visitResult = { Items: [], TotalItems: 0, Page: 1, PageSize: 50 },
        refetch: refetchVisits,
      } = useHistoryVisits(visitFilterParams);
      const {
        data: txnResult = { Items: [], TotalItems: 0, Page: 1, PageSize: 50 },
        refetch: refetchTxns,
      } = useHistoryTransactions(txnFilterParams);

      // ✅ Lấy Items từ PagedResult
      const visitRows = visitResult.Items || [];
      const txnRows = txnResult.Items || [];
      const visitTotalItems = visitResult.TotalItems || 0;
      const txnTotalItems = txnResult.TotalItems || 0;
      const visitTotalPages = Math.ceil(visitTotalItems / 50);
      const txnTotalPages = Math.ceil(txnTotalItems / 50);
      // realtime: lắng nghe "history.updated" từ SignalR và refetch
      useEffect(() => {
     
        const off = subscribeHistory?.(() => {
          // refetch cả 2 danh sách, đơn giản & an toàn
          refetchVisits();
          refetchTxns();
        });
        return () => off && off();
      }, [refetchVisits, refetchTxns]);

  // ✅ Reset page khi filter thay đổi
  useEffect(() => {
    if (visitPage > 1) setVisitPage(1);
  }, [from, to, scope, kw, visitType, visitStatusScope]);

  useEffect(() => {
    if (txnPage > 1) setTxnPage(1);
  }, [from, to, kw, txnType]);

  // ✅ Filter và sort đã được làm ở backend
  const rows = tab === "visits" ? visitRows : txnRows;

  // Scroll to highlighted row when data loads
  useEffect(() => {
    if (!highlightHistoryId || highlightScrolledRef.current) return;
    // Wait a tick for the DOM to render
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(`[data-highlight-id="${highlightHistoryId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        highlightScrolledRef.current = true;
      }
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightHistoryId, visitRows.length, txnRows.length]);

  /* ====== stats dựa trên dữ liệu đang lọc ====== */
  // ⚠️ Lưu ý: Stats chỉ tính trên 1 page (50 items), không phải toàn bộ dataset
  // Để có stats chính xác, cần call API riêng hoặc load tất cả data (không scalable)
  const stats = useMemo(() => {
    // visits
    let vClinic = 0;
    let vService = 0;
    visitRows.forEach((v) => {
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

    txnRows.forEach((t) => {
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
      vCount: visitRows.length,
      vClinic,
      vService,
      tCount: txnRows.length,
      tSum,
      tExam,
      tCls,
      tDrug,
      tOther,
    };
  }, [visitRows, txnRows, scope]);

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setKw("");
    setVisitType("all");
    setVisitStatusScope("medical");
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
            className="card mt-0 flex-1 min-h-0 flex flex-col overflow-hidden"
          >
            <HistoryTable
              tab={tab}
              rows={rows}
              highlightId={highlightHistoryId}
              onEye={(row, type) =>
                setDetail({ open: true, type, row })
              }
              stretch
            />
            {tab === "visits" && visitTotalItems > 0 && (
              <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
                <Pagination
                  currentPage={visitPage}
                  totalPages={visitTotalPages}
                  totalItems={visitTotalItems}
                  pageSize={50}
                  onPageChange={setVisitPage}
                  showWhenSinglePage
                  className="px-4 py-3"
                />
              </div>
            )}
            {tab === "transactions" && txnTotalItems > 0 && (
              <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-lg">
                <Pagination
                  currentPage={txnPage}
                  totalPages={txnTotalPages}
                  totalItems={txnTotalItems}
                  pageSize={50}
                  onPageChange={setTxnPage}
                  showWhenSinglePage
                  className="px-4 py-3"
                />
              </div>
            )}
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
          visitStatusScope,
          txnType,
        }}
        setValues={({
          dateFrom,
          dateTo,
          keyword,
          visitType,
          visitStatusScope,
          txnType,
        }) => {
          if (dateFrom !== undefined) setFrom(dateFrom);
          if (dateTo !== undefined) setTo(dateTo);
          if (keyword !== undefined) setKw(keyword);
          if (visitType !== undefined) setVisitType(visitType);
          if (visitStatusScope !== undefined) setVisitStatusScope(visitStatusScope);
          if (txnType !== undefined) setTxnType(txnType);
        }}
        onReset={resetFilters}
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
