import React from 'react';
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Avatar from "../ui/Avatar.jsx";
import { getDemoPublicImage } from "../../utils/demoPublicImages.js";
function isClsType(type) {
  const v = String(type || "").toLowerCase();
  return (
    v.includes("cls") ||
    v.includes("cận lâm sàng") ||
    v.includes("can_lam_sang") ||
    v.includes("dv") ||
    v.includes("dich_vu") ||
    v.includes("dịch vụ")
  );
}

// --- Hàm tiện ích (không đổi) ---
function kindBadge(type) {
  const v = type;
  if (isClsType(v)) {
    return {
      text: "Phòng CLS",
      cls: "bg-violet-50 text-violet-700 ring-violet-200",
    };
  }
  return {
    text: "Phòng khám LS",
    cls: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };
}
function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1
        ${active ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}
      aria-label={active ? "Hoạt động" : "Tạm dừng"}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Hoạt động" : "Tạm dừng"}
    </span>
  );
}

// --- Biến thể cho Framer Motion ---
const cardVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { 
      duration: 0.18, 
      ease: "easeOut",
      // Hiệu ứng "stagger" (xuất hiện lần lượt) cho các thành phần con
      staggerChildren: 0.05 
    }
  },
  hover: { y: -2, scale: 1.005 }
};

// Biến thể cho các chi tiết bên trong thẻ (header, stats, etc.)
const detailVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" } }
};


export default function DeptCard({ dept, onOpenDetail, onOpenSchedule, pulse = false }) {
  const room = dept.room || { number: "—", status: false };
  const deptImage = getDemoPublicImage(dept, room.number || dept.name);
  const isActive = !!room.status;
 
  const waiting = dept.waitingPatients || 0;
  const done = dept.examinedPatients || 0;
  const total = waiting + done;
  const kb = kindBadge(
    room.type || dept.roomType || dept.loaiPhong || dept.loai_phong
  );
  const isCls = isClsType(
    room.type || dept.roomType || dept.loaiPhong || dept.loai_phong
  );
  const fixedStaffLabel = isCls
    ? "KTV phụ trách (cố định)"
    : "Bác sĩ phụ trách (cố định)";
  const fixedStaffName = isCls
    ? dept.technicianInCharge || dept.nurseInCharge || "—"
    : dept.doctorInCharge || "—";
  const hasNurse = !isCls && !!(dept.nurseInCharge && String(dept.nurseInCharge).trim());

  return (
    <motion.article
      data-room-id={dept.id}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      // Xóa transition, initial, animate prop cũ vì đã dùng variants
      className={[
        "relative group rounded-2xl bg-white/95 ring-1 ring-slate-200 shadow-sm",
        "hover:shadow-xl hover:ring-indigo-100 hover:bg-gradient-to-b hover:from-white hover:to-indigo-50/70",
        "p-3",
        pulse ? "flash-once ring-2 ring-indigo-50" : ""
      ].join(" ")}
    >
      {/* Header */}
      <motion.header variants={detailVariants} className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
        <Avatar src={deptImage} item={dept} size={40} />
          <div className="flex-1">
            <b className="leading-5 text-[15px] text-slate-900 block">Phòng {room.number}</b>
            <div className="text-slate-500 text-xs mt-0.5">
              Thuộc khoa: <span className="font-medium text-slate-700">{dept.name || "—"}</span>
            </div>
            {/* SĐT và Email đã được di chuyển */}
          </div>
        </div>
        <div className=" top-3 right-3 z-10  absolute flex flex-col items-end gap-1.5  shrink-0
                        origin-top-right">
          <StatusBadge active={isActive} />
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ring-1 ${kb.cls}`}>{kb.text}</span>
        </div>
      </motion.header>

      {/* Thân thẻ (Nhân sự & Stats) */}
      <div className="mt-3 space-y-2">
        {/* Nhân sự */}
        <motion.div
          variants={detailVariants}
          className="rounded-xl ring-1 ring-indigo-100/40 bg-white p-3 transition-colors
                        group-hover:bg-gradient-to-b group-hover:from-white group-hover:to-indigo-50"
        >
          <div className={`grid ${hasNurse ? "grid-cols-2" : "grid-cols-1"} gap-2 text-sm`}>
            <div>
              <div className="text-[11px] text-indigo-700/80">{fixedStaffLabel}</div>
              <b className="block truncate text-slate-900 group-hover:text-indigo-900 transition-colors">
                {fixedStaffName}
              </b>
            </div>
            {hasNurse && (
              <div>
                <div className="text-[11px] text-indigo-700/80">Điều dưỡng phụ trách</div>
                <b className="block truncate text-slate-900 group-hover:text-indigo-900 transition-colors">
                  {dept.nurseInCharge}
                </b>
              </div>
            )}
          </div>

          {/* === THAY ĐỔI: SĐT & Email === */}
          {/* Thêm đường kẻ và lồng vào box nhân sự */}
          <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-indigo-100/60 flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1 group-hover:text-slate-700 transition-colors">
              <span>☎</span>{room.phone || "—"}
            </span>
            <span className="inline-flex items-center gap-1 group-hover:text-slate-700 transition-colors">
              <span>✉</span>{room.email || "—"}
            </span>
          </div>
          {/* === KẾT THÚC THAY ĐỔI === */}

        </motion.div>

        {/* Stats */}
        <motion.div variants={detailVariants} className="grid grid-cols-3 gap-2">
          {[
            { t: "Đang chờ", v: waiting },
            { t: "Đã hoàn thành", v: done },
            { t: "Tổng", v: total },
          ].map(({ t, v }) => (
            <div
              key={t}
              className="rounded-xl p-2 ring-1 ring-indigo-100/40 bg-indigo-50 text-center
                         hover:ring-indigo-200 hover:bg-indigo-50/80 transition"
            >
              <div className="text-[11px] text-indigo-700/80">{t}</div>
              <div className="text-[18px] leading-5 font-extrabold text-indigo-800">{v}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Actions */}
      <motion.footer variants={detailVariants} className="mt-3 flex items-center justify-between">
        <Button
          className="bg-gradient-to-tr from-indigo-100 via-indigo-100 to-indigo-200 hover:from-indigo-200 hover:to-indigo-100
                     !py-1.5 !px-3 text-sm rounded-xl text-slate-900"
          onClick={() => onOpenDetail?.(dept)}
        >
          Chi tiết
        </Button>
        <Button
          className="btn-outline !py-1.5 !px-3 rounded-xl hover:ring-indigo-300 hover:bg-indigo-50/60 transition-all"
          onClick={() => onOpenSchedule?.(dept)}
        >
          📅 Xem lịch
        </Button>
      </motion.footer>
    </motion.article>
  );
}
