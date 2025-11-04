import React, { useState } from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

function TimeRange({ start = "08:00", duration = 30 }) {
  const [h, m] = start.split(":").map(Number);
  const from = new Date(0, 0, 0, h, m);
  const to = new Date(from.getTime() + duration * 60000);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    <>
      {pad(from.getHours())}:{pad(from.getMinutes())}–{pad(to.getHours())}:{pad(to.getMinutes())}
    </>
  );
}

export default function ApptList({
  items = [],
  loading = false,
  error = null,
  onDetail,
  onCheckIn,
  stretch = false,
}) {





  if (loading) {
    return (
      <section className={`p-4 rounded-2xl bg-white ring-1 ring-violet-200/60 shadow-sm ${stretch ? "h-full flex flex-col min-h-0" : ""}`}>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-violet-50 animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <div role="alert" className={`p-6 rounded-2xl ring-1 ring-red-200 bg-red-50 ${stretch ? "h-full flex flex-col min-h-0" : ""}`}>
        <b className="text-red-700">Không tải được dữ liệu.</b>
        <div className="mt-1 text-red-700/80 text-sm">{String(error)}</div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <section className={`p-6 rounded-2xl text-slate-500 ring-1 ring-violet-200/60 bg-white ${stretch ? "h-full flex flex-col min-h-0" : ""}`}>
        Chưa có lịch hẹn.
      </section>
    );
  }

  return (
    <section className={`pt-2 bg-white rounded-2xl overflow-hidden shadow-soft ${stretch ? "h-full flex flex-col min-h-0" : "mt-3"}`}>
      <div className={`${stretch ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"} p-4 pt-1`}>
        <div className="flex flex-col gap-2">
        {items.map((a, i) => {
            const id = a.id ?? a.code ?? a.pid ?? a.patient;
            // Disallow check-in for canceled, no-show, or completed
            const blocked = ["Đã hủy", "Không đến", "Đã hoàn thành"];
            const canCheckIn = !blocked.includes(a.status) && !a.checkedIn;

            return (
              <motion.article
                key={id}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={[
                  "group relative grid grid-cols-[140px_1fr] gap-4 items-start p-4 rounded-xl",
                  "bg-gradient-to-br from-white to-violet-50/40 ring-1 ring-violet-200/60",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-0.5 hover:ring-violet-300 hover:shadow-lg hover:shadow-violet-200/40",
                  "hover:from-white hover:to-violet-100/80",
                  "before:absolute before:inset-y-2 before:left-1 before:w-0.5 before:rounded-full before:bg-violet-200",
                  "hover:before:bg-violet-400",
                ].join(" ")}
              >
                <div className="relative pr-2">
                  <div className="font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-violet-700">
                    <TimeRange start={a.time} duration={a.duration} />
                  </div>
                  <span
                    className={`absolute top-1 right-0 w-2 h-2 rounded-full transition-transform duration-300 group-hover:scale-110 ${
                      a.checkedIn
                        ? "bg-sky-500"
                        : a.status === "Đã xác nhận"
                        ? "bg-emerald-500"
                        : a.status === "Đang chờ"
                        ? "bg-amber-500"
                        : "bg-slate-400"
                    }`}
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{a.patient}</span>

                      {a.code && (
                        <Chip tone="slate" className="text-[11px] px-2 py-0.5">
                          Mã: {a.code}
                        </Chip>
                      )}

                      <Chip tone={a.type === "Tái khám" ? "violet" : "slate"} className="text-[11px] px-2 py-0.5">
                        {a.type}
                      </Chip>

                      <Chip tone="slate" className="text-[11px] px-2 py-0.5">{a.doctor}</Chip>
                      <Chip tone="slate" className="text-[11px] px-2 py-0.5">{a.dept}</Chip>
                    </div>

                    <div className="flex items-center gap-2">
                      {a.checkedIn && <Chip tone="sky" dot="sky" className="text-xs">Đã check-in</Chip>}

                      {!a.checkedIn && (
                        <Chip
                          tone={a.status === "Đã xác nhận" ? "emerald" : a.status === "Đang chờ" ? "amber" : "slate"}
                          dot={a.status === "Đã xác nhận" ? "emerald" : a.status === "Đang chờ" ? "amber" : "slate"}
                          className="text-xs"
                        >
                          {a.status}
                        </Chip>
                      )}

                      <motion.button
                       type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onDetail?.(a)}
                        className="px-3 py-1.5 rounded-lg border border-violet-200 text-violet-700 hover:bg-violet-50 hover:border-violet-300 font-semibold transition text-sm"
                      >
                        Chi tiết
                      </motion.button>

                      {onCheckIn && canCheckIn && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          
                          onClick={() => onCheckIn(a)}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-sm hover:shadow-md hover:brightness-105 transition text-sm"
                        >
                           Check-in
                        </motion.button>
                      )}
                    </div>
                  </div>

                  {a.note && (
                    <div className="text-xs text-slate-600 line-clamp-1 group-hover:text-slate-700 transition-colors duration-300">
                      {a.note}
                    </div>
                  )}
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
