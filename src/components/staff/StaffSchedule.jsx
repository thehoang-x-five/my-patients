import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { WEEK, DUTY_ROOM } from "../../data/staff.js";

const dayKey = () => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date().getDay()];

export default function StaffSchedule({ open, item, schedule, onClose }) {
  if (!item) return null;
  const today = dayKey();
  const roomToday = DUTY_ROOM?.[item.id]?.[today] ?? "—";
  const shiftToday = schedule?.[today] ?? "—";

  function printSched() {
    const win = window.open("", "_blank");
    const trs = WEEK.map(
      (d) => `<tr><td>${d}</td><td>${schedule?.[d] || "-"}</td><td>${(DUTY_ROOM?.[item.id]?.[d]) || "-"}</td></tr>`
    ).join("");
    win.document.write(`
      <html><head><title>Lịch ${item.name}</title>
      <style>body{font-family:Arial;padding:24px;max-width:780px;margin:auto}table{width:100%;border-collapse:collapse}td,th{border:1px solid #d1d5db;padding:8px}thead th{background:#f3f4f6}</style>
      </head><body>
        <h2>Lịch làm việc • ${item.name} (${item.id})</h2>
        <p>Đơn vị: <b>${item.dept}</b></p>
        <p>Hôm nay: <b>${shiftToday}</b> • Bàn/Phòng <b>${roomToday}</b></p>
        <table><thead><tr><th>Ngày</th><th>Ca</th><th>Bàn/Phòng</th></tr></thead><tbody>${trs}</tbody></table>
        <button onclick="window.print()">In</button>
      </body></html>
    `);
    win.document.close();
  }

  const legend = (
    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-sky-100 ring-1 ring-sky-200 inline-block" /> Hôm nay</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-100 ring-1 ring-emerald-200 inline-block" /> Ca Sáng</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-100 ring-1 ring-amber-200 inline-block" /> Ca Chiều</span>
      <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-cyan-100 ring-1 ring-cyan-200 inline-block" /> Bàn/Phòng</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className="fixed inset-0 z-50 p-4 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.section
              initial={{ y: 14, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.98, opacity: 0 }}
              className="w-[min(820px,100%)] max-h-[86vh] overflow-auto bg-white rounded-2xl ring-1 ring-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Lịch nhân sự"
            >
              <div className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-sky-50">
                <header className="p-4 flex items-center justify-between">
                  <h3 className="text-lg font-extrabold">Lịch làm việc — {item.name}</h3>
                  <Button onClick={onClose} aria-label="Đóng">✕</Button>
                </header>
              </div>

              <div className="p-4 space-y-3">
                <div className="rounded-xl ring-1 ring-sky-200 bg-sky-50 px-3 py-2 flex items-center justify-between">
                  <div className="text-sm">
                    <b>Trực hôm nay:</b> {shiftToday} • <b>Bàn/Phòng:</b> {roomToday}
                  </div>
                  <div className="text-xs text-slate-600">({today})</div>
                </div>

                {legend}

                <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-500 bg-slate-50/60">
                      <tr>
                        <th className="px-3 py-2 w-28">Ngày</th>
                        <th className="px-3 py-2 w-28">Ca</th>
                        <th className="px-3 py-2">Bàn/Phòng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {WEEK.map((d) => {
                        const shift = schedule?.[d] || "—";
                        const room = DUTY_ROOM?.[item.id]?.[d] || "—";
                        const isToday = d === today;
                        const shiftBg =
                          shift === "Sáng" ? "bg-emerald-50 ring-emerald-100" :
                          shift === "Chiều" ? "bg-amber-50 ring-amber-100" : "";
                        return (
                          <tr key={d} className={isToday ? "bg-sky-50" : "odd:bg-white"}>
                            <td className={`px-3 py-2 ${isToday ? "font-semibold text-sky-700" : ""}`}>{d}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 ring-1 ${shiftBg}`}>{shift}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 ring-1 bg-cyan-50 ring-cyan-200">{room}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button onClick={printSched}>In</Button>
                  <Button variant="primary" onClick={onClose}>Đóng</Button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
