// src/components/departments/DeptCard.jsx
import React from 'react';
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";

export default function DeptCard({ dept, onOpenDetail, onOpenSchedule, pulse = false }) {
  const room = dept.room || { number: "—", status: false };
  const isActive = !!room.status;
  const waiting = dept.waitingPatients || 0;
  const done = dept.examinedPatients || 0;
  const total = waiting + done;

  return (
    <motion.article
      data-room-id={dept.id}   // NEW: để scrollIntoView
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.005 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className={[
        "relative group rounded-2xl bg-white/95 ring-1 ring-slate-200 shadow-sm",
        "hover:shadow-xl hover:ring-indigo-300 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50/70",
        "p-3",
        pulse ? "flash-once ring-2 ring-indigo-400" : "" // NEW visual pulse
      ].join(" ")}
    >
      {/* Badge trạng thái góc phải */}
      <span
        className={`absolute top-3 right-3 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 transition-colors
        ${isActive ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}
        aria-label={isActive ? "Đang hoạt động" : "Không hoạt động"}
        title={isActive ? "Phòng đang hoạt động" : "Phòng tạm dừng"}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`} />
        {isActive ? "Đang hoạt động" : "Không hoạt động"}
      </span>

      {/* Header */}
      <header className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center font-extrabold bg-indigo-50 text-slate-800 ring-1 ring-indigo-100">
          {dept.short || "P"}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <b className="leading-5 text-[15px] text-slate-900">Phòng {room.number}</b>
          </div>
          <div className="text-slate-500 text-xs mt-0.5">
            Thuộc khoa: <span className="font-medium text-slate-700">{dept.name}</span>
          </div>
        </div>
      </header>

      {/* Body tổng quan */}
      <div className="mt-3 space-y-2">
        <div className="rounded-xl ring-1 ring-indigo-100/40 bg-white p-3 transition-colors
                        group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-indigo-50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-[11px] text-indigo-700/80">BS phụ trách</div>
              <b className="block truncate text-slate-900" title={dept.doctorInCharge || ""}>
                {dept.doctorInCharge || "—"}
              </b>
            </div>
            <div>
              <div className="text-[11px] text-indigo-700/80">ĐD phụ trách</div>
              <b className="block truncate text-slate-900" title={dept.nurseInCharge || ""}>
                {dept.nurseInCharge || "—"}
              </b>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2 ring-1 ring-indigo-100/40 bg-indigo-50 text-center">
            <div className="text-[11px] text-indigo-700/80">Đang chờ</div>
            <div className="text-[18px] leading-5 font-extrabold text-indigo-800">{waiting}</div>
          </div>
          <div className="rounded-xl p-2 ring-1 ring-indigo-100/40 bg-indigo-50 text-center">
            <div className="text-[11px] text-indigo-700/80">Đã hoàn thành</div>
            <div className="text-[18px] leading-5 font-extrabold text-indigo-800">{done}</div>
          </div>
          <div className="rounded-xl p-2 ring-1 ring-indigo-100/40 bg-indigo-50 text-center">
            <div className="text-[11px] text-indigo-700/80">Tổng</div>
            <div className="text-[18px] leading-5 font-extrabold text-indigo-800">{total}</div>
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <footer className="mt-3 flex items-center justify-between">
        <Button
          className="bg-gradient-to-tr from-indigo-100 via-indigo-100 to-indigo-200 hover:from-indigo-200 hover:to-indigo-100
                     !py-1.5 !px-3 text-sm rounded-xl text-slate-900"
          onClick={() => onOpenDetail?.(dept)}
          title="Xem chi tiết phòng"
        >
          Chi tiết
        </Button>
        <Button
          className="btn-outline !py-1.5 !px-3 rounded-xl hover:ring-indigo-300 hover:bg-indigo-50/60 transition-all"
          onClick={() => onOpenSchedule?.(dept)}
          title="Xem lịch trực"
        >
          📅 Xem lịch
        </Button>
      </footer>
    </motion.article>
  );
}
