import React from 'react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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
  values, // { dateFrom, dateTo, keyword }
  setValues, // function to mutate parent state
  anchorEl, // anchor element (Filter button)
}) {
  const ref = useRef(null);
  const [kw, setKw] = useState(values?.keyword || "");
  const [start, setStart] = useState(() => parseYmd(values?.dateFrom));
  const [end, setEnd] = useState(() => parseYmd(values?.dateTo));

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
    const r = anchorEl?.getBoundingClientRect();
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
                  <div className="flex items-center gap-2">
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
              {/* Không còn nút Làm mới / Áp dụng trong popover */}
            </div>
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
