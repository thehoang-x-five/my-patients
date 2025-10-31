import React from 'react';
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card } from "../ui/Supports.jsx";

/* Chip nhỏ đẹp gọn */
function Pill({ children, tone = "slate" }) {
  const map = {
    slate: "bg-slate-50 text-slate-700 ring-1 ring-slate-200/80",
    sky: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center h-7 rounded-full px-2 text-sm font-semibold ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/* 1 item trong timeline bên trái */
function TimelineItem({ t, i }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      className="relative pl-6"
    >
      {/* dot */}
      <span
        className="absolute left-0 top-2 w-3 h-3 rounded-full 
                   bg-gradient-to-br from-sky-400 to-emerald-400
                   shadow-[0_0_0_3px_rgba(56,189,248,.2)]"
        aria-hidden
      />
      <div
        className="rounded-xl p-2 ring-1 ring-slate-200/70 bg-white
                   hover:ring-sky-200 hover:bg-sky-50/50
                   transition hover:-translate-y-0.5"
      >
        <div className="flex items-center gap-2">
          <Pill>{t.at}</Pill>
          <div className="min-w-0">
            <div className="font-medium leading-tight truncate">{t.title}</div>
            {t.dept && (
              <div className="text-slate-500 text-sm truncate">{t.dept}</div>
            )}
          </div>
        </div>
      </div>
    </motion.li>
  );
}

/* 1 việc bên phải */
function TodoItem({ text, i }) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + i * 0.03 }}
      className="rounded-xl p-2 ring-1 ring-slate-200/70 bg-white
                 hover:ring-emerald-200 hover:bg-emerald-50/60
                 transition flex items-center gap-2"
    >
      <input type="checkbox" aria-label={text} />
      <span className="truncate">{text}</span>
    </motion.li>
  );
}

export default function WorkBoardCard({
  upcoming = [], // [{at:'09:30', title:'…', dept:'…'}]
  todos = [], // ["…", "…"]
  minH = "min-h-[340px]",
}) {
  // thanh tiến độ trong ngày
  const { nowStr, nowPct } = useMemo(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const pct = Math.min(100, Math.max(0, (minutes / 1440) * 100));
    const label = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return { nowStr: label, nowPct: pct };
  }, []);

  return (
    <Card title="Bảng công việc trong ngày" className={`${minH} flex flex-col`}>
      {/* Lưới 2 cột: Timeline trái + Việc phải */}
      <div className="grid md:grid-cols-2 gap-2 flex-1 min-h-0 ">
        {/* Timeline */}
        <section className="min-w-0 flex flex-col ring-1 ring-gray-100  p-1 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <b className="text-slate-700">Sắp diễn ra</b>
            <Pill tone="sky">{upcoming.length}</Pill>
          </div>

          <ol
            className="relative p-1 space-y-2 max-h-[300px] overflow-y-auto scrollbar-none flex-1
                       before:absolute before:left-[5px] before:top-0 before:bottom-0 
                       before:w-px before:bg-gradient-to-b before:from-sky-200 before:via-slate-200 before:to-emerald-200"
          >
            {upcoming.length ? (
              upcoming.map((t, i) => (
                <TimelineItem key={t.at + t.title + i} t={t} i={i} />
              ))
            ) : (
              <li className="text-sm text-slate-500 px-1">
                Không có mốc thời gian.
              </li>
            )}
          </ol>
        </section>

        {/* Todos */}
        <section className="min-w-0 flex flex-col ring-1 ring-gray-100  p-1 rounded-2xl">
          <div className="flex items-center justify-between mb-1">
            <b className="text-slate-700">Việc cần làm</b>
            <Pill tone="emerald">{todos.length}</Pill>
          </div>

          <ul className="space-y-2 p-1 max-h-[300px] overflow-y-auto scrollbar-none flex-1">
            {todos.length ? (
              todos.map((t, i) => <TodoItem key={t + i} text={t} i={i} />)
            ) : (
              <li className="text-sm text-slate-500 px-1">
                Không có công việc.
              </li>
            )}
          </ul>
        </section>
      </div>
    </Card>
  );
}
