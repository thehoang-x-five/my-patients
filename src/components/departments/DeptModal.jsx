// src/components/departments/DeptModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React from 'react';

function Progress({ value = 0, max = 100 }) {
  const pct = Math.min(100, Math.round((value / (max || 1)) * 100));
  return (
    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200">
      <div className="h-full bg-indigo-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function DeptModal({ open, dept, onClose }) {
  if (!dept) return null;

  const waiting = dept.waitingPatients || 0;
  const done = dept.examinedPatients || 0;
  const totalToday = waiting + done;
  const capacity = dept.capacityPerDay || 0;
  const avgWait = dept.avgWaitMin || 0;

  const statusBadge = (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border 
      ${dept.room?.status ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
      {dept.room?.status ? "Đang hoạt động" : "Không hoạt động"}
    </span>
  );

  // style thống nhất
  const card = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-indigo-200 transition";
  const pill = "inline-flex items-center h-8 px-3 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm";

  // tách ghi chú thành các dòng ngắn (nếu có)
  const noteLines = (dept.notes || "")
    .split(/[\.;]\s*/g)
    .map(s => s.trim())
    .filter(Boolean);

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
              className="w-[min(1120px,100%)] max-h-[86vh] overflow-auto scrollbar-none bg-white rounded-2xl border border-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* HEADER STICKY */}
              <div className="sticky top-0 z-10 backdrop-blur-sm bg-gradient-to-r from-emerald-50/80 via-indigo-50/80 to-violet-50/80 border-b border-slate-200 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl grid place-items-center font-extrabold bg-indigo-50 text-slate-800 border border-indigo-200">
                      {dept.short || "P"}
                    </div>
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900">Phòng {dept.room?.number || "—"}</h3>
                      <div className="text-slate-600 text-sm">Thuộc khoa: <b>{dept.name}</b></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {statusBadge}
                    <Button onClick={onClose} aria-label="Đóng" className="rounded-xl">✕</Button>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="p-4 pt-2 space-y-2">
                {/* 4 Ô trên: 2 cột × 2 hàng */}
                <div className="grid md:grid-cols-2 gap-2 auto-rows-fr">
                  {/* Tổng quan */}
                  <section className={`${card} h-full`}>
                    <b className="block mb-2">Tổng quan</b>
                    <div className="text-sm space-y-1">
                      <div>Khu vực: <b>{dept.room?.area || "—"}</b></div>
                      <div>Số điện thoại phòng: <b>{dept.room?.phone || "—"}</b></div>
                      <div>Trưởng khoa: <b>{dept.head || "—"}</b></div>
                      <div className="mt-2 text-slate-600">Giờ làm việc: <span className="font-medium">T2–6 07:30–16:30 • T7 07:30–11:30</span></div>
                    </div>
                  </section>

                  {/* Nhân sự phụ trách */}
                  <section className={`${card} h-full`}>
                    <b className="block mb-2">Nhân sự phụ trách (quản lý phòng)</b>
                    <div className="text-sm space-y-1">
                      <div>Bác sĩ phụ trách: <b>{dept.doctorInCharge || "—"}</b></div>
                      <div>Điều dưỡng phụ trách: <b>{dept.nurseInCharge || "—"}</b></div>
                    </div>
                  </section>

                  {/* Ghi chú */}
                  <section className={`${card} h-full`}>
                    <b className="block mb-2">Ghi chú</b>
                    {noteLines.length ? (
                      <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
                        {noteLines.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500">—</p>
                    )}
                  </section>

                  {/* Liên hệ */}
                  <section className={`${card} h-full`}>
                    <b className="block mb-2">Liên hệ</b>
                    <div className="text-sm text-slate-700 space-y-1">
                      <div>Email: <b>phong{dept.room?.number || "x"}@hospital.example</b></div>
                      <div>Điện thoại: <b>{dept.room?.phone || "—"}</b></div>
                    </div>
                  </section>
                </div>

                {/* Khối dưới: vận hành + thiết bị + dịch vụ */}
                <section className={`${card}`}>
                  <b className="block mb-2">Vận hành</b>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <div className="rounded-lg p-3 border border-indigo-200 bg-indigo-50">
                      <div className="text-indigo-700 text-xs">Đang chờ</div>
                      <div className="text-2xl font-extrabold text-indigo-800">{waiting}</div>
                    </div>
                    <div className="rounded-lg p-3 border border-indigo-200 bg-indigo-50">
                      <div className="text-indigo-700 text-xs">Đã hoàn thành</div>
                      <div className="text-2xl font-extrabold text-indigo-800">{done}</div>
                    </div>
                    <div className="rounded-lg p-3 border border-indigo-200 bg-indigo-50">
                      <div className="text-indigo-700 text-xs">Tổng hôm nay</div>
                      <div className="text-2xl font-extrabold text-indigo-800">{totalToday}</div>
                    </div>
                  </div>

                  <div className="mt-3 grid md:grid-cols-3 gap-3 items-end">
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Sức chứa/ngày</div>
                      <div className="text-sm font-bold">{capacity}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Công suất đã dùng</div>
                      <Progress value={totalToday} max={capacity || 1} />
                      <div className="text-xs text-slate-500 mt-1">
                        {capacity ? Math.min(100, Math.round((totalToday / capacity) * 100)) : 0}% ( {totalToday}/{capacity || 1} )
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 mb-1">Thời gian chờ TB</div>
                      <div className="text-sm font-bold">{avgWait} phút</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Cập nhật lần cuối: <b>{new Date(dept.lastUpdated || Date.now()).toLocaleString()}</b>
                  </div>
                </section>

                <section className={`${card}`}>
                  <b className="block mb-2">Trang thiết bị</b>
                  <div className="flex flex-wrap gap-2">
                    {(dept.equipments || []).map((eq, i) => (
                      <span key={i} className={pill}>{eq}</span>
                    ))}
                    {(!dept.equipments || dept.equipments.length === 0) && (
                      <span className="text-sm text-slate-500">—</span>
                    )}
                  </div>
                </section>

                <section className={`${card}`}>
                  <b className="block mb-2">Dịch vụ tại phòng</b>
                  <div className="flex flex-wrap gap-2">
                    {(dept.room?.services || ["Khám tổng quát", "Tư vấn"]).map((service, idx) => (
                      <span key={idx} className={pill}>{service}</span>
                    ))}
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
