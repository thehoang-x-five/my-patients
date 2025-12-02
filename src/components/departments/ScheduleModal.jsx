import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// === THAY ĐỔI: Tinh chỉnh hiệu ứng (nhẹ & mượt) ===
const modalContentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.05, // Bắt đầu nhanh hơn một chút
      staggerChildren: 0.06 // Các item xuất hiện cách nhau 0.06s
    }
  }
};

// Hiệu ứng cho từng item bên trong
const itemVariants = {
  hidden: { opacity: 0, y: 8 }, // Giảm độ cao trượt (từ 15 xuống 8)
  visible: {
    opacity: 1,
    y: 0,
    // Bỏ hiệu ứng "spring", thay bằng "ease" mượt mà
    transition: { duration: 0.3, ease: "easeOut" } 
  }
};
// === KẾT THÚC THAY ĐỔI ===

export default function ScheduleModal({ open, dept, todayDuty, weekDays, todayKey, onClose }) {
  if (!dept) return null;

  const fixedDoctor = (weekDays && weekDays.fixedDoctor)
    ? weekDays.fixedDoctor
    : (dept.doctorInCharge || "—");

  const slotsOf = (d) => {
    const v = weekDays?.[d];
    return Array.isArray(v)
      ? v
      : (v ? [{ nurse: v.nurse || "—", ca_truc: "—", gio_bat_dau: "—", gio_ket_thuc: "—" }] : []);
  };

  // === THAY ĐỔI: Giảm hiệu ứng hover trên Tile ===
  const Tile = ({ active, children, className = "" }) => (
    <motion.div
      // Bỏ 'scale' khi hover, chỉ giữ 'y'
      whileHover={{ y: -2 }} 
      transition={{ duration: 0.15, ease: "easeOut" }} // Nhanh hơn
      className={[
        "rounded-xl border p-3 bg-white h-full",
        active ? "border-indigo-300 bg-indigo-50/70" : "border-slate-200",
        // Bỏ 'hover:shadow-lg', chỉ dùng 'hover:border-indigo-300'
        "hover:border-indigo-300 hover:bg-indigo-50",
        "transition-colors duration-200", // Chỉ dùng transition màu sắc
        className,
      ].join(" ")}
    >
      {children}
    </motion.div>
  );

  // === THAY ĐỔI: Giảm hiệu ứng hover trên NurseCard ===
  const NurseCard = ({ slot, index }) => (
    <motion.div
      key={index}
      // Giảm 'scale' (từ 1.03) và 'y' (từ -3)
      whileHover={{ scale: 1.01, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className="rounded-xl ring-1 ring-slate-200 bg-gradient-to-b from-white to-slate-50 p-3 
                 hover:shadow-md cursor-default"
    >
      <div className="text-sm"> <b>{slot.nurse || "—"}</b></div>
      <div className="text-xs text-slate-600">Ca: <b>{slot.ca_truc || "—"}</b> • {slot.gio_bat_dau || "—"}–{slot.gio_ket_thuc || "—"}</div>
    </motion.div>
  );

  // Component con cho thẻ nurse (cả tuần)
  const WeekSlot = ({ slot, index }) => (
    <li
      key={index}
      // Hiệu ứng này đã nhẹ sẵn (chỉ đổi màu nền)
      className="text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-default"
    >
      <div className="text-sm"> <b>{slot.nurse}</b></div>
      <div className="text-xs text-slate-600">Ca: <b>{slot.ca_truc}</b> • {slot.gio_bat_dau}–{slot.gio_ket_thuc}</div>
    </li>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop (Không đổi) */}
          <motion.div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={onClose} />
          
          {/* Wrapper (Không đổi) */}
          <motion.div className="fixed inset-0 z-50 p-4 grid place-items-center"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            
            {/* Modal Content (Hiệu ứng vào 'spring' vẫn giữ, tạo cảm giác 'nảy' khi mở) */}
            <motion.section
              initial={{ y: 14, scale: 0.985, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 14, scale: 0.985, opacity: 0 }}
              transition={{ type: "spring", stiffness: 360, damping: 26 }}
              className="w-[min(1080px,100%)] max-h-[86vh] overflow-auto scrollbar-none 
                         bg-slate-50 rounded-2xl ring-1 ring-slate-200 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              role="dialog" aria-modal="true" aria-label="Lịch trực phòng"
            >
              {/* Header (Không đổi) */}
              <div className="p-4 rounded-t-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-emerald-50 
                            border-b border-slate-100 sticky top-0 z-10">
                {/* ... (nội dung header giữ nguyên) ... */}
                 <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-extrabold">Lịch trực — Phòng {dept.room?.number || "—"}</h3>
                    <div className="text-slate-600 text-sm">Thuộc khoa: <b>{dept.name || "—"}</b></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-lg bg-indigo-100 ring-1 ring-indigo-200 text-indigo-700 text-xs">
                      Hôm nay: <b>{todayKey}</b>
                    </span>
                    <Button onClick={onClose} aria-label="Đóng" className="rounded-xl">✕</Button>
                  </div>
                </div>
              </div>

              {/* Bọc nội dung (ĐÃ ÁP DỤNG VARIANTS MỚI) */}
              <motion.div
                className="p-4 space-y-4"
                variants={modalContentVariants} // Áp dụng variants đã sửa
                initial="hidden"
                animate="visible"
              >
                
                {/* Bố cục 2 cột (ĐÃ ÁP DỤNG VARIANTS MỚI) */}
                <motion.div
                  variants={itemVariants} // Áp dụng variants đã sửa
                  className="grid grid-cols-1 lg:grid-cols-3 gap-4"
                >
                  {/* BS cố định (1/3) */}
                  <div className="lg:col-span-1">
                    <Tile className="flex items-center gap-2">
                      <b className="text-slate-800">Bác sĩ phụ trách (cố định):</b>
                      <span className="text-sm font-semibold text-indigo-800">{fixedDoctor}</span>
                    </Tile>
                  </div>

                  {/* Điều dưỡng trực hôm nay (2/3) */}
                  <div className="lg:col-span-2">
                    <Tile>
                      <b className="block mb-2 text-slate-800">Điều dưỡng trực hôm nay</b>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {(Array.isArray(todayDuty) ? todayDuty : slotsOf(todayKey)).map((s, i) => (
                          <NurseCard slot={s} index={i} key={i} />
                        ))}
                      </div>
                    </Tile>
                  </div>
                </motion.div>
                
                {/* Bố cục Cả tuần (ĐÃ ÁP DỤNG VARIANTS MỚI) */}
                <motion.div variants={itemVariants}>
                  <Tile>
                    <b className="block mb-3 text-slate-800">Lịch điều dưỡng cả tuần</b>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                      {DAYS.map((d) => {
                        const daySlots = slotsOf(d);
                        return (
                          <Tile key={d} active={d === todayKey}>
                            <div className={`font-semibold ${d === todayKey ? "text-indigo-700" : "text-slate-800"}`}>{d}</div>
                            <ul className="mt-1 space-y-1 text-sm">
                              
                              {daySlots.length > 0 ? (
                                daySlots.map((s, i) => (
                                  <WeekSlot slot={s} index={i} key={i} />
                                ))
                              ) : (
                                <li className="text-xs text-slate-400 italic p-1.5">Không có ca trực</li>
                              )}
                              
                            </ul>
                          </Tile>
                        );
                      })}
                    </div>
                  </Tile>
                </motion.div>
                
              </motion.div>
              
            </motion.section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}