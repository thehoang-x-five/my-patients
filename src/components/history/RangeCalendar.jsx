// src/components/history/RangeCalendar.jsx
import React from 'react';
import { useMemo, useState } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function ymd(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parse(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function sameDay(a, b) {
  return a && b && a.toDateString() === b.toDateString();
}
function isBetween(x, a, b) {
  if (!a || !b) return false;
  const t = x.getTime();
  return t >= a.getTime() && t <= b.getTime();
}

export default function RangeCalendar({ start, end, onChange }) {
  const today = new Date();
  const [base, setBase] = useState(() => {
    const d = today;
    d.setDate(1);
    return d;
  });

  function build(monthDate) {
    const y = monthDate.getFullYear(),
      m = monthDate.getMonth();
    const first = new Date(y, m, 1),
      startOff = (first.getDay() + 6) % 7;
    const daysIn = new Date(y, m + 1, 0).getDate(),
      daysPrev = new Date(y, m, 0).getDate();
    const cells = [];
    ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].forEach((w) =>
      cells.push({ t: "wd", w })
    );
    for (let i = 0; i < 42; i++) {
      let dNum,
        out = false,
        dateObj;
      if (i < startOff) {
        dNum = daysPrev - startOff + i + 1;
        out = true;
        dateObj = new Date(y, m - 1, dNum);
      } else if (i >= startOff + daysIn) {
        dNum = i - (startOff + daysIn) + 1;
        out = true;
        dateObj = new Date(y, m + 1, dNum);
      } else {
        dNum = i - startOff + 1;
        dateObj = new Date(y, m, dNum);
      }
      cells.push({ t: "day", d: dNum, out, dateObj });
    }
    return {
      title: monthDate.toLocaleDateString("vi-VN", {
        month: "long",
        year: "numeric",
      }),
      cells,
    };
  }
  const left = build(base);
  const right = build(new Date(base.getFullYear(), base.getMonth() + 1, 1));

  function pick(day) {
    const d = ymd(day);
    if (!start || (start && end)) {
      onChange(d, "");
    } else {
      if (parse(start) <= day) onChange(start, d);
      else onChange(d, start);
    }
  }

  const render = (m) => (
    <section className="p-2">
      <div className="font-extrabold mb-2">
        {m.title.charAt(0).toUpperCase() + m.title.slice(1)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {m.cells.map((c, i) =>
          c.t === "wd" ? (
            <div
              key={i}
              className="text-center text-slate-500 text-xs font-semibold py-1"
            >
              {c.w}
            </div>
          ) : (
            <button
              key={i}
              onClick={() => pick(c.dateObj)}
              className={`relative text-left h-9 rounded-lg px-2
                        ${c.out ? "opacity-50" : ""}
                        ${
                          sameDay(c.dateObj, parse(start)) ||
                          sameDay(c.dateObj, parse(end))
                            ? "bg-sky-600 text-white"
                            : isBetween(c.dateObj, parse(start), parse(end))
                            ? "bg-sky-50 ring-1 ring-sky-200"
                            : "bg-white ring-1 ring-slate-200/80 hover:bg-slate-50"
                        }`}
              aria-label={`Ngày ${c.d}`}
            >
              <span className="font-semibold">{c.d}</span>
            </button>
          )
        )}
      </div>
    </section>
  );

  return (
    <div className="p-2">
      <div className="flex items-center justify-between px-2">
        <button
          className="btn !px-2"
          onClick={() =>
            setBase((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
          }
        >
          ‹
        </button>
        <div className="text-sm text-slate-600">Chọn khoảng ngày</div>
        <button
          className="btn !px-2"
          onClick={() =>
            setBase((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
          }
        >
          ›
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {render(left)} {render(right)}
      </div>
      <div className="px-2 pb-2 text-sm text-slate-600">
        Từ: <b>{start || "—"}</b> • Đến: <b>{end || "—"}</b>
      </div>
    </div>
  );
}
