// src/components/appointments/ApptList.jsx
// [FIXED 2025-11-22] Map normalized fields & check-in state with BE. UI unchanged.
import React, { useState } from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import { APPT_STATUS, APPT_STATUS_LABEL } from "../../api/appointments.js";
import { formatVietnameseText } from "../../utils/textFormatters.js";

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

const colors=(cl)=>{`border-${cl}-200` } 


function ApptList({
  items = [],
  loading = false,
  error = null,
  onDetail,
  onCheckIn,
  stretch = true,
  onCreate,
  highlightId,
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (loading) {
    return (
      <section
      className={[
        " card h-full p-6 rounded-2xl text-slate-500  bg-white",
        stretch ? "min-h-[320px] flex items-center justify-center" : "",
      ].join(" ")}
    >
     Đang tải dữ liệu lịch hẹn.
    </section>

    );
  }

  if (error) {
    return (
      <section
      className={[
        " card h-full p-6 rounded-2xl text-slate-500  bg-white",
        stretch ? "min-h-[320px] flex items-center justify-center" : "",
      ].join(" ")}
    >
     Không có bản ghi phù hợp.
    </section>
    );
  }

  if (!items.length) {
    return (
      <section
      className={[
        " card h-full p-6 rounded-2xl text-slate-500  bg-white",
        stretch ? "min-h-[320px] flex items-center justify-center" : "",
      ].join(" ")}
    >
     Không có bản ghi phù hợp.
    </section>
    );
  }

  return (
    
      <section className={`pt-2 pb-1 bg-white rounded-2xl overflow-hidden shadow-soft ${stretch ? "h-full flex flex-col min-h-0" : "mt-3"}`}>
      <div className={`${stretch ? "flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none" : "overflow-x-auto scrollbar-none"} p-4 py-1`}>
        <div className="flex flex-col gap-2">

          {items.map((a, i) => {
            const id = a.id ?? a.code ?? a.pid ?? a.patient;

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

            const isExpanded = expandedId === id;
            const isHighlight =
              highlightId && (highlightId === id || highlightId === a._aid);

            return (
              <motion.article
                key={id}
                initial={{ y: 6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={[
                  "group relative grid grid-cols-[140px_1fr] gap-4 items-start p-2 rounded-xl",
                  "bg-gradient-to-br from-white to-violet-50/40 ring-1 ring-violet-200/60",
                  "transition-all duration-300 ease-out",
                  "hover:-translate-y-0.5 hover:ring-violet-300 hover:shadow-lg hover:shadow-violet-200/40",
                  "hover:from-white hover:to-violet-100/80",
                  "before:absolute before:inset-y-2 before:left-1 before:w-0.5 before:rounded-full",
                  isHighlight
                    ? "before:bg-emerald-400 shadow-md shadow-emerald-100"
                    : "before:bg-violet-300/60",
                ].join(" ")}
              >
                {/* Time block */}
                <div className="flex flex-col items-center justify-center gap-1 px-2">
                  <div className="text-xs font-medium text-slate-500">
                    Giờ hẹn
                  </div>
                  <div className="text-lg font-semibold text-slate-900 tracking-tight">
                    {a.time || "--:--"}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {a.duration ? `${a.duration} phút` : ""}
                  </div>
                </div>

                {/* Content block */}
          
                 
                    

                <div className="min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                        
                        <span className="text-sm font-semibold text-slate-900">
                          {patientName}
                        </span>

                        {patientCode && (
                          <Chip
                            tone="slate"
                            className="text-[11px] px-2 py-0.5"
                          >
                            Mã: {patientCode}
                          </Chip>
                        )}

                        <Chip
                          tone={
                            apptType === "Tái khám" ? "violet" : "slate"
                          }
                          className="text-[11px] px-2 py-0.5"
                        >
                          {formatVietnameseText(apptType)}
                        </Chip>
                        {a.phone && (
                          <div className="text-xs text-slate-600">
                            📞 {a.phone}
                          </div>
                        )}
                        <Chip
                          tone="slate"
                          className="text-[11px] px-2 py-0.5"
                        >
                          {doctorName}
                        </Chip>
                        <Chip
                          tone="slate"
                          className="text-[11px] px-2 py-0.5"
                        >
                          {deptName}
                        </Chip>
                      </div>

                      <div className="flex justify-end  items-center gap-2">
                        {checkedIn && (
                          <Chip
                            tone="sky"
                            dot="sky"
                            className="text-xs border-sky-200"
                          >
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

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onDetail?.(a)}
                          className="px-3 py-1.5 rounded-lg border border-sky-300 bg-cyan/80 text-slate-700 hover:text-violet-700 hover:border-violet-300 font-semibold transition text-sm"
                        >
                          Chi tiết
                        </motion.button>

                        {onCheckIn && canCheckIn && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onCheckIn(a)}
                            className="px-4 py-1.5 rounded-lg bg-violet-500 hover:bg-emerald-500 text-white font-semibold shadow-sm hover:shadow-md hover:brightness-105 transition text-sm"
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

export default ApptList;
