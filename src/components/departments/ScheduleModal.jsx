import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function ScheduleModal({ open, dept, todayDuty, weekDays, todayKey, onClose }) {
  if (!dept) return null;

  const slot = todayDuty || { doc: "—", nurse: "—" };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 p-4 grid place-items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.section
              initial={{ y: 14, scale: 0.985, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.985, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-[min(1080px,100%)] max-h-[86vh] overflow-auto scrollbar-none bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Lịch trực phòng"
            >
              {/* Header gradient – tone indigo */}
              <div className="p-4 rounded-t-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-emerald-50 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold">Lịch trực — Phòng {dept.room?.number || "—"}</h3>
                    <div className="text-slate-600 text-sm">Thuộc khoa: <b>{dept.name}</b></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-100 ring-1 ring-indigo-200 text-indigo-700 text-xs">
                      Hôm nay: <b>{todayKey}</b>
                    </span>
                    <Button onClick={onClose} aria-label="Đóng" className="rounded-xl">✕</Button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Hôm nay */}
                <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-3">
                  <b className="block mb-2">Trực hôm nay</b>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="rounded-xl ring-1 ring-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 hover:ring-indigo-200 hover:shadow-sm transition">
                      <div className="text-sm">Bác sĩ trực: <b>{slot.doc}</b></div>
                      <div className="text-sm">Điều dưỡng trực: <b>{slot.nurse}</b></div>
                    </div>
                  </div>
                </section>

                {/* Cả tuần */}
                <section className="rounded-2xl ring-1 ring-slate-200 bg-white p-3">
                  <b className="block mb-3">Lịch cả tuần</b>
                  <div className="overflow-auto">
                    <table className="min-w-[720px] w-full text-sm border-collapse">
                      <thead>
                        <tr className="text-left">
                          {DAYS.map(d => (
                            <th key={d}
                                className={`px-2 py-2 border-b border-slate-200 font-semibold ${d===todayKey ? "bg-indigo-50 text-indigo-800 rounded-t-md" : ""}`}>
                              {d}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {DAYS.map(d => (
                            <td key={d}
                                className={`px-2 py-3 align-top border-b border-slate-100 transition-colors
                                  ${d===todayKey ? "bg-indigo-50/70" : "hover:bg-slate-50"}`}>
                              <div>BS: <b>{weekDays?.[d]?.doc || "—"}</b></div>
                              <div>ĐD: <b>{weekDays?.[d]?.nurse || "—"}</b></div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
