// src/components/appointments/ApptCalendar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* utils giữ nguyên */
const pad2 = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export default function ApptCalendar({
  month,
  itemsByDate,
  onPrev,
  onNext,
  onPickDay,
}) {
  /* hướng trượt khi đổi tháng (mượt nhưng không đổi UI) */
  const idx = month.getFullYear() * 12 + month.getMonth();
  const prevIdxRef = useRef(idx);
  const [dir, setDir] = useState(0);

  useEffect(() => {
    const p = prevIdxRef.current;
    setDir(idx > p ? 1 : idx < p ? -1 : 0);
    prevIdxRef.current = idx;
  }, [idx]);

  const todayKey = ymd(new Date());

  const grid = useMemo(() => {
    const y = month.getFullYear(),
      m = month.getMonth();
    const first = new Date(y, m, 1);
    const startOffset = (first.getDay() + 6) % 7; // Mon-first
    const daysInM = new Date(y, m + 1, 0).getDate();
    const daysPrev = new Date(y, m, 0).getDate();

    const cells = [];
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach((w) =>
      cells.push({ type: "wd", w })
    );

    for (let i = 0; i < 42; i++) {
      let dNum,
        out = false,
        dateObj;
      if (i < startOffset) {
        dNum = daysPrev - startOffset + i + 1;
        out = true;
        dateObj = new Date(y, m - 1, dNum);
      } else if (i >= startOffset + daysInM) {
        dNum = i - (startOffset + daysInM) + 1;
        out = true;
        dateObj = new Date(y, m + 1, dNum);
      } else {
        dNum = i - startOffset + 1;
        dateObj = new Date(y, m, dNum);
      }
      const key = ymd(dateObj);
      cells.push({
        type: "day",
        d: dNum,
        out,
        key,
        size: itemsByDate[key]?.length || 0,
        isToday: key === todayKey,
      });
    }
    return cells;
  }, [month, itemsByDate, todayKey]);

  const title = month.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
  const titleText = title.charAt(0).toUpperCase() + title.slice(1);

  // max số lịch trong tháng -> heatmap/độ đậm
  const maxSize = useMemo(
    () => Math.max(0, ...Object.values(itemsByDate).map((v) => v.length || 0)),
    [itemsByDate]
  );

  return (
    <section className="p-4 rounded-2xl bg-white ring-1 ring-slate-200/80 dark:ring-slate-700/60">
      {/* header */}
      <div className="flex items-center justify-between mb-2">
        <motion.button
          whileTap={{ scale: 0.96 }}
          className="px-2 h-9 w-9 grid place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50"
          onClick={onPrev}
          aria-label="Tháng trước"
          type="button"
        >
          ‹
        </motion.button>

        <motion.div
          key={titleText}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-extrabold text-lg"
          aria-live="polite"
        >
          {titleText}
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          className="px-2 h-9 w-9 grid place-items-center rounded-xl ring-1 ring-slate-200 hover:bg-slate-50"
          onClick={onNext}
          aria-label="Tháng sau"
          type="button"
        >
          ›
        </motion.button>
      </div>

      {/* grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -dir * 24 }}
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
          className="grid grid-cols-7 gap-2"
        >
          {grid.map((c, i) =>
            c.type === "wd" ? (
              <div key={`wd-${i}`} className="text-center font-bold text-slate-500">
                {c.w}
              </div>
            ) : (
              <motion.button
                key={c.key}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickDay?.(c.key)}
                className={[
                  "relative text-left min-h-24 p-2 rounded-xl bg-white",
                  "ring-1 ring-slate-200/80 dark:ring-slate-700/60",
                  "focus:outline-none focus:ring-2 focus:ring-violet-200 hover:bg-gradient-to-b hover:from-white hover:bg-violet-100/55 hover:-translate-y-0.5",
                  c.out ? "opacity-50" : "",
                ].join(" ")}
                aria-label={`Ngày ${c.d}`}
                type="button"
              >
                {/* góc hôm nay */}
                {c.isToday && (
                  <span
                    className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-violet-400 to-emerald-400 shadow-[0_0_0_3px_rgba(139,92,246,.25)]"
                    title="Hôm nay"
                  />
                )}

                <div className="flex items-center justify-between">
                  <b>{c.d}</b>
                  {c.size > 0 && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(3, c.size) }).map((_, j) => (
                        <span
                          key={j}
                          className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-[pulse_2s_ease-in-out_infinite]"
                          style={{ animationDelay: `${j * 150}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* chips giờ nhanh */}
                {c.size > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {itemsByDate[c.key].slice(0, 2).map((a) => (
                      <span
                        key={a.id}
                        className="text-[11px] rounded-full px-2 py-0.5 bg-slate-50 ring-1 ring-slate-200/80"
                      >
                        {a.time}
                      </span>
                    ))}
                    {itemsByDate[c.key].length > 2 && (
                      <span className="text-[11px] font-bold text-sky-700">
                        +{itemsByDate[c.key].length - 2}
                      </span>
                    )}
                  </div>
                )}

                {/* thanh heat dưới đáy: tỷ lệ lấp lịch */}
                {maxSize > 0 && (
                  <div className="absolute left-2 right-2 bottom-2 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400"
                      style={{
                        width: `${Math.min(100, (c.size / maxSize) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </motion.button>
            )
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
