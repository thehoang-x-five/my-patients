// src/components/appointments/DayPanel.jsx
// [FIXED 2025-11-22] Map normalized fields & check-in state with BE. UI unchanged.
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import { APPT_STATUS, APPT_STATUS_LABEL } from "../../api/appointments.js";

function getApptChipColor(status) {
  switch (status) {
    case APPT_STATUS.DA_XAC_NHAN:
      return { tone: "white", dot: "emerald", border: "border-emerald-200" };
    case APPT_STATUS.DANG_CHO:
      return { tone: "white", dot: "amber", border: "border-amber-200" };
    case APPT_STATUS.DA_CHECKIN:
      return { tone: "white", dot: "sky", border: "border-sky-200" };
    case APPT_STATUS.DA_HUY:
      return { tone: "white", dot: "rose", border: "border-rose-200" };
    default:
      return { tone: "white", dot: "slate", border: "border-slate-200" };
  }
}
function DayPanel({
  open,
  dateLabel,
  items,
  onClose,
  onCreate,
  onOpenDetail,
  onCheckIn,
  highlightId,
}) {
  // busy map để tránh double check-in
  const [busy, setBusy] = useState(new Set());
  const setBusyFor = (id, flag) => {
    setBusy((prev) => {
      const next = new Set(prev);
      flag ? next.add(id) : next.delete(id);
      return next;
    });
  };

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // normalize id giống ApptList
  const normalized = useMemo(() => {
    return (items || []).map((a) => {
      const aid = a.id ?? a.code ?? a.pid ?? a.patient;
      return { ...a, _aid: aid };
    });
  }, [items]);

  async function handleCheckIn(a) {
    if (!onCheckIn) return;
    const id = a._aid || a.id;
    if (!id) return;
    setBusyFor(id, true);
    try {
      const maybe = onCheckIn?.(a);
      if (maybe?.then) await maybe;
    } finally {
      setBusyFor(id, false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
          className="fixed right-4 bottom-4 w-[400px] max-h-[70vh] overflow-hidden bg-white rounded-2xl shadow-2xl ring-1 ring-violet-200/50 z-50"
          role="dialog"
          aria-modal="true"
          aria-label={`Lịch hẹn • ${dateLabel}`}
        >
          <header className="sticky top-0 z-10 bg-gradient-to-r from-violet-50/80 to-purple-50/60 backdrop-blur-sm flex items-center justify-between px-4 py-3 border-b border-violet-100">
            <b className="text-slate-900 font-extrabold">Lịch hẹn • {dateLabel}</b>
            <div className="flex items-center gap-2">
              {onCreate && (
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-8 h-8 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-bold grid place-items-center transition"
                  onClick={onCreate}
                  title="Thêm lịch tại ngày này"
                >
                  ＋
                </motion.button>
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-8 h-8 rounded-lg bg-violet-50 hover:bg-red-200 flex items-center justify-center text-slate-600 hover:text-slate-900 transition"
                onClick={onClose}
                aria-label="Đóng"
              >
                ×
              </motion.button>
            </div>
          </header>

          <div className="p-3 overflow-y-auto max-h-[calc(70vh-73px)] scrollbar-none">
            {normalized?.length ? (
              <div className="flex flex-col gap-2">
                {normalized.map((a, i) => {
                  const isNew = highlightId && (a._aid === highlightId || a.id === highlightId);
                  const statusCode = a.status;
                  const patientName = a.patientName || a.patient || "";
                  const patientCode = a.patientCode || a.code || a.pid || "";
                  const doctorName = a.doctorName || a.doctor || "";
                  const deptName = a.deptName || a.dept || "";
                  const apptType = a.apptType || a.type || "";
                  const checkedIn =
                    a.checkedIn ?? (statusCode === APPT_STATUS.DA_CHECKIN);
                    const { tone, dot, border } = getApptChipColor(statusCode);
                  const statusLabel =
                    APPT_STATUS_LABEL[statusCode] || "—";
                  const canCheckIn =
                    statusCode === APPT_STATUS.DA_XAC_NHAN && !checkedIn;
                  const isBusy = busy.has(a._aid);
                  return (
                    <motion.div
                      key={a._aid}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={[
                        "rounded-xl p-3 bg-white ring-1 ring-slate-200 hover:ring-violet-300 hover:bg-violet-50/30 transition",
                        isNew ? "ring-2 !ring-violet-400 animate-pulse" : "",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold">
                            Giờ hẹn
                          </div>
                          <div className="font-extrabold text-slate-900 tabular-nums">{a.time}</div>
                          <div className="text-[11px] text-slate-400">
                            {a.duration ? `${a.duration} phút` : ""}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                       
                          <div className="flex items-center gap-2 mt-1">
                            {checkedIn && (
                              <Chip tone="sky" dot="sky" className="text-xs border-sky-200">
                                Đã check-in
                              </Chip>
                            )}

                            {!checkedIn && (
                              <Chip
                                tone={tone}
                                dot={dot}
                                className={`text-xs ${border}`}
                              >
                                {statusLabel}
                              </Chip>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-700 mb-1">
                        {patientName} • {doctorName || "—"} • {deptName || "—"}
                      </div>
                      {a.phone && (
                        <div className="text-xs text-slate-500 mb-2">
                          📞 {a.phone}
                        </div>
                      )}

                      <Chip tone="slate" className="text-xs mb-2">
                        {apptType}
                      </Chip>

                      {a.note && (
                        <div className="text-xs text-slate-600 mt-2 line-clamp-1">
                          {a.note}
                        </div>
                      )}

                      <div className="mt-3 flex justify-between gap-2">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="text-sm  px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold shadow-sm hover:shadow-md transition"
                         
                          onClick={() => onOpenDetail?.(a)}
                        >
                          Chi tiết
                        </motion.button>

                        {onCheckIn && canCheckIn && (
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold shadow-sm hover:shadow-md transition disabled:opacity-60 disabled:cursor-not-allowed"
                         
                            onClick={() => handleCheckIn(a)}
                            disabled={isBusy}
                          >
                            {isBusy ? "Đang check-in…" : "Check-in"}
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                Chưa có lịch cho ngày này.
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default DayPanel;
