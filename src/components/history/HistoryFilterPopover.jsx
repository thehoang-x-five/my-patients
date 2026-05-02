// src/components/history/HistoryFilterPopover.jsx
import React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";

/* ---------- date utils ---------- */
const pad2 = (n) => String(n).padStart(2, "0");
const toYmd = (d) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parseYmd = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return isNaN(dt) ? null : dt;
};
const addMonths = (d, n) => new Date(d.getFullYear(), d.getMonth() + n, 1);
const isSameDay = (a, b) =>
  a &&
  b &&
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();
const isBetween = (day, start, end) =>
  start && end && day >= start && day <= end;

function buildMonthGrid(year, month) {
  // monday-first calendar, 7*6 grid
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7; // 0 for Monday
  const daysInM = new Date(year, month + 1, 0).getDate();
  const daysPrev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    let dNum,
      out = false,
      dateObj;
    if (i < startOffset) {
      dNum = daysPrev - startOffset + i + 1;
      out = true;
      dateObj = new Date(year, month - 1, dNum);
    } else if (i >= startOffset + daysInM) {
      dNum = i - (startOffset + daysInM) + 1;
      out = true;
      dateObj = new Date(year, month + 1, dNum);
    } else {
      dNum = i - startOffset + 1;
      dateObj = new Date(year, month, dNum);
    }
    cells.push({
      key: toYmd(dateObj),
      d: dNum,
      out,
      date: dateObj,
      today: isSameDay(dateObj, new Date()),
    });
  }
  return cells;
}

/* ---------- main ---------- */
export default function HistoryFilterPopover({
  open,
  onClose,
  values, // { dateFrom, dateTo, keyword, visitType, txnType }
  setValues, // function to mutate parent state
  anchorEl, // anchor element (Filter button)
  tab = "visits",
  onReset,
}) {
  const ref = useRef(null);
  const [kw, setKw] = useState(values?.keyword || "");
  const [start, setStart] = useState(() => parseYmd(values?.dateFrom));
  const [end, setEnd] = useState(() => parseYmd(values?.dateTo));
  const [visitType, setVisitType] = useState(values?.visitType || "all"); // all | clinic | service
  const [visitStatusScope, setVisitStatusScope] = useState(values?.visitStatusScope || "medical");
  const [txnType, setTxnType] = useState(values?.txnType || "all");       // all | exam | cls | drug | other

  // months shown
  const initialLeft = useMemo(() => {
    const base = start || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  }, [start]);
  const [leftMonth, setLeftMonth] = useState(initialLeft);
  const [rightMonth, setRightMonth] = useState(addMonths(initialLeft, 1));

  // reset temp when open
  useEffect(() => {
    if (!open) return;
    setKw(values?.keyword || "");
    const s = parseYmd(values?.dateFrom);
    const e = parseYmd(values?.dateTo);
    setStart(s);
    setEnd(e);
    setVisitType(values?.visitType || "all");
    setVisitStatusScope(values?.visitStatusScope || "medical");
    setTxnType(values?.txnType || "all");
    const base = s || new Date();
    const L = new Date(base.getFullYear(), base.getMonth(), 1);
    setLeftMonth(L);
    setRightMonth(addMonths(L, 1));
  }, [open, values]);

  // outside close + ESC
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose?.();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  // anchor positioning
  const [pos, setPos] = useState({ top: 72, left: 0 });
  useLayoutEffect(() => {
    if (!open) return;
    const r = anchorEl?.getBoundingClientRect?.();
    const gap = 8;
    const maxW = 560; // compact width
    const left = Math.min(r ? r.left : 16, window.innerWidth - maxW - 12);
    const top = (r ? r.bottom : 64) + gap;
    setPos({ top, left });
  }, [open, anchorEl]);

  // month grids
  const gLeft = useMemo(
    () => buildMonthGrid(leftMonth.getFullYear(), leftMonth.getMonth()),
    [leftMonth]
  );
  const gRight = useMemo(
    () => buildMonthGrid(rightMonth.getFullYear(), rightMonth.getMonth()),
    [rightMonth]
  );

  // --- auto-apply handlers ---
  function sync(valuesOverride) {
    // helper to push instantly to parent
    const next = {
      dateFrom: start ? toYmd(start) : "",
      dateTo: end ? toYmd(end) : "",
      keyword: kw,
      visitType,
      visitStatusScope,
      txnType,
      ...valuesOverride,
    };
    setValues(next);
  }

  function pickDate(d) {
    if (!start || (start && end)) {
      const s = d;
      setStart(s);
      setEnd(null);
      // move view & sync
      const L = new Date(d.getFullYear(), d.getMonth(), 1);
      setLeftMonth(L);
      setRightMonth(addMonths(L, 1));
      sync({ dateFrom: toYmd(s), dateTo: "" });
    } else if (start && !end) {
      let s = start,
        e = d;
      if (d < start) {
        e = start;
        s = d;
      }
      setStart(s);
      setEnd(e);
      sync({ dateFrom: toYmd(s), dateTo: toYmd(e) });
    }
  }

  function clearRange() {
    setStart(null);
    setEnd(null);
    sync({ dateFrom: "", dateTo: "" });
  }

  const visitTypeOptions = [
    { code: "all", label: "Tất cả" },
    { code: "clinic", label: "Khám thường" },
    { code: "service", label: "Khám dịch vụ" },
  ];

  const visitStatusOptions = [
    { code: "medical", label: "Hoàn tất / có kết quả" },
    { code: "cancelled", label: "Đã hủy / quá hạn" },
    { code: "all", label: "Tất cả lượt khám" },
  ];

  const incomeTypeOptions = [
    { code: "all", label: "Tất cả" },
    { code: "exam", label: "Thu khám" },
    { code: "cls", label: "Thu CLS" },
    { code: "drug", label: "Thu thuốc" },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed z-50"
          style={{ top: pos.top, left: pos.left }}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <div
            ref={ref}
            className="w-[min(560px,calc(100vw-24px))] rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc"
          >
            <div className="p-3 grid gap-3">
              {/* keyword – auto apply on type */}
              <label className="text-sm">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    value={kw}
                    onChange={(e) => {
                      const v = e.target.value;
                      setKw(v);
                      sync({ keyword: v });
                    }}
                    placeholder="Mã BN / Họ tên / khoa / bác sĩ / nội dung…"
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-sky-500 outline-none"
                  />
                  <span className="absolute left-2 top-2.5 text-slate-500">
                    🔎
                  </span>
                  {kw && (
                    <button
                      type="button"
                      onClick={() => {
                        setKw("");
                        sync({ keyword: "" });
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              {/* range calendars */}
              <div className="rounded-2xl p-1 ring-1 ring-slate-200/80">
                <div className="grid md:grid-cols-2 gap-1">
                  <Month
                    titleDate={leftMonth}
                    grid={gLeft}
                    start={start}
                    end={end}
                    pickDate={pickDate}
                  />
                  <Month
                    titleDate={rightMonth}
                    grid={gRight}
                    start={start}
                    end={end}
                    pickDate={pickDate}
                  />
                </div>

                {/* current selection / nav */}
                <div className="mt-3 text-sm text-slate-600 flex items-center justify-between px-1">
                  <button
                    className="btn !px-2 py-1"
                    onClick={() => {
                      setLeftMonth((m) => addMonths(m, -1));
                      setRightMonth((m) => addMonths(m, -1));
                    }}
                    aria-label="Tháng trước"
                  >
                    ‹
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    Khoảng đã chọn:
                    <b>{start ? toYmd(start) : "—"}</b> đến{" "}
                    <b>{end ? toYmd(end) : "—"}</b>
                    {(start || end) && (
                      <button
                        className="btn !px-2 py-1"
                        onClick={clearRange}
                        title="Xóa khoảng ngày"
                      >
                        Xóa
                      </button>
                    )}
                  </div>
                  <button
                    className="btn !px-2 py-1"
                    onClick={() => {
                      setLeftMonth((m) => addMonths(m, 1));
                      setRightMonth((m) => addMonths(m, 1));
                    }}
                    aria-label="Tháng sau"
                  >
                    ›
                  </button>
                </div>
              </div>

              {/* Lọc loại lượt – chỉ áp dụng khi tab là visits */}
              {tab === "visits" && (
                <div className="mt-1">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Loại lượt khám
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visitTypeOptions.map((opt) => {
                      const active = visitType === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setVisitType(opt.code);
                            sync({ visitType: opt.code });
                          }}
                          className={[
                            "px-3 py-1 rounded-full text-xs font-semibold border transition",
                            active
                              ? opt.code === "service"
                                ? "bg-amber-50 border-amber-300 text-amber-700"
                                : opt.code === "clinic"
                                  ? "bg-sky-50 border-sky-300 text-sky-700"
                                  : "bg-slate-900 text-white border-slate-900"
                              : "bg-white border-slate-200 text-slate-600 hover:border-sky-300",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lọc loại thu – chỉ áp dụng khi tab là transactions */}
              {tab === "visits" && (
                <div className="mt-1">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Trạng thái lượt khám
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {visitStatusOptions.map((opt) => {
                      const active = visitStatusScope === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setVisitStatusScope(opt.code);
                            sync({ visitStatusScope: opt.code });
                          }}
                          className={[
                            "px-3 py-1 rounded-full text-xs font-semibold border transition",
                            active
                              ? opt.code === "cancelled"
                                ? "bg-rose-50 border-rose-300 text-rose-700"
                                : opt.code === "medical"
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                  : "bg-slate-900 text-white border-slate-900"
                              : "bg-white border-slate-200 text-slate-600 hover:border-emerald-300",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === "transactions" && (
                <div className="mt-1">
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    Loại thu
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {incomeTypeOptions.map((opt) => {
                      const active = txnType === opt.code;
                      return (
                        <button
                          key={opt.code}
                          type="button"
                          onClick={() => {
                            setTxnType(opt.code);
                            sync({ txnType: opt.code });
                          }}
                          className={[
                            "px-3 py-1 rounded-full text-xs font-semibold border transition",
                            active
                              ? opt.code === "exam"
                                ? "bg-sky-50 border-sky-300 text-sky-700"
                                : opt.code === "cls"
                                  ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                                  : opt.code === "drug"
                                    ? "bg-teal-50 border-teal-300 text-teal-700"
                                    : "bg-slate-900 text-white border-slate-900"
                              : "bg-white border-slate-200 text-slate-600 hover:border-sky-300",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <FilterPopoverFooter
              onReset={() => {
                setKw("");
                setStart(null);
                setEnd(null);
                setVisitType("all");
                setVisitStatusScope("medical");
                setTxnType("all");
                onReset?.();
              }}
              onClose={onClose}
              resetLabel="Reset bộ lọc"
              closeLabel="Đóng"
              accent="cyan"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* inline sub-component */
function Month({ titleDate, grid, start, end, pickDate }) {
  const monthLabel = titleDate.toLocaleDateString("vi-VN", {
    year: "numeric",
    month: "long",
  });
  const week = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
  return (
    <div className="rounded-2xl ring-1 ring-slate-200/80 bg-white p-3">
      <div className="text-center font-extrabold mb-2">
        {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-slate-500 mb-1">
        {week.map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {grid.map((c) => {
          const selectedStart = start && isSameDay(c.date, start);
          const selectedEnd = end && isSameDay(c.date, end);
          const inRange = isBetween(c.date, start, end);
          return (
            <button
              key={c.key}
              onClick={() => pickDate(c.date)}
              className={[
                "relative h-9 rounded-lg text-sm",
                "transition focus:outline-none focus:ring-2 focus:ring-sky-400",
                c.out ? "text-slate-400" : "text-slate-700",
                inRange && "!bg-sky-50 !ring-1 !ring-sky-200",
                (selectedStart || selectedEnd) &&
                "!bg-sky-600 !text-white !ring-0 shadow",
                !inRange && !selectedStart && !selectedEnd
                  ? "hover:bg-slate-50"
                  : "",
              ].join(" ")}
              title={c.key}
              aria-pressed={selectedStart || selectedEnd}
            >
              {c.today && (
                <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-sky-500" />
              )}
              {c.d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
