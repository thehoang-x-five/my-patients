// src/components/staff/StaffFilterPopover.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const ROLES = [
  { value: "doctor", label: "Bác sĩ" },
  { value: "nurse", label: "Y tá" },
];

const STATUS_OPTS = [
  { value: "all", label: "Tất cả" },
  { value: "online", label: "Online" },
  { value: "offline", label: "Offline" },
];

const NURSE_KIND_OPTS = [
  { value: "all", label: "Tất cả" },
  { value: "clinical", label: "Lâm sàng" },
  {value: "paraclinical", label: "Cận lâm sàng" },
  { value: "administrative", label: "Hành chính" },
];

export default function StaffFilterPopover({
  open,
  onClose,
  values,
  setValues,
  anchorEl,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode = anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  const {
    q = "",
    role = "doctor",
    statusFilter = "all",
    nurseKind = "all",
    dept = "",
  } = values || {};

  // --- Logic đóng mở & vị trí (Giữ nguyên như cũ) ---
  useEffect(() => {
    if (!open) return;
    justOpenedRef.current = true;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    const onClickOutside = (e) => {
      if (justOpenedRef.current) return;
      const target = e.target;
      const onAnchorBtn = !!target?.closest?.('[data-popover-anchor="staff-filter"]');
      if (onAnchorBtn) return;
      const inside = boxRef.current?.contains(target);
      const insideAnchor = anchorNode?.contains?.(target);
      if (!inside && !insideAnchor) onClose?.();
    };
    document.addEventListener("keydown", onKey, true);
    const t = setTimeout(() => {
      justOpenedRef.current = false;
      document.addEventListener("click", onClickOutside, true);
    }, 0);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", onClickOutside, true);
      clearTimeout(t);
    };
  }, [open, onClose, anchorNode]);

  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [widthPx, setWidthPx] = useState(380);

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const W = Math.min(400, vw - 24);
    const el = anchorNode?.getBoundingClientRect?.();
    const r = el || null;
    
    let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;
    const estH = 450;
    if (top + estH > vh - 12 && r) {
      top = Math.max(12, r.top - gap - estH);
    }
    setWidthPx(W);
    setPos({ top, left });
  }

  useLayoutEffect(() => { if (open) computePosition(); }, [open, anchorNode]);
  useEffect(() => {
    if (!open) return;
    const handler = () => computePosition();
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler);
    setTimeout(() => kwRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler);
    };
  }, [open]);

  const handleChange = (patch) => {
    if (!setValues) return;
    setValues({ ...(values || {}), ...patch });
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed z-[9999]"
          style={{ top: pos.top, left: pos.left, width: widthPx }}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
        >
          <div
            ref={boxRef}
            role="dialog"
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-teal-900/5 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-r from-teal-50 via-white to-teal-50 border-b border-teal-100 flex justify-between items-center">
              <div className="text-sm font-bold text-teal-900 flex items-center gap-2">
                <span className="inline-flex w-6 h-6 rounded-lg bg-teal-100 text-teal-700 items-center justify-center text-xs">
                  ⚗️
                </span>
                Lọc nhân sự
              </div>
             
            </div>

            <div className="p-3 space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
              
              {/* 1. Tìm kiếm */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">
                  Từ khóa
                </label>
                <div className="relative">
                  <input
                    ref={kwRef}
                    value={q}
                    onChange={(e) => handleChange({ q: e.target.value })}
                    placeholder="Tên, chuyên khoa, kỹ năng..."
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-teal-500 focus:bg-white outline-none text-sm transition-all placeholder:text-slate-400"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
                  {q && (
                    <button type="button" onClick={() => handleChange({ q: "" })} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-teal-600">✕</button>
                  )}
                </div>
              </div>

             

              {/* 3. Loại điều dưỡng (Chỉ hiện khi chọn Y tá - Có hiệu ứng chạy) */}
              <AnimatePresence>
                {role === 'nurse' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, overflow: "hidden" }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <div className="p-1">
                      <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">
                        Phân loại
                      </label>
                      <div className="relative flex p-1 rounded-xl bg-slate-100 ring-1 ring-slate-200">
                        {NURSE_KIND_OPTS.map((nk) => {
                          const active = nurseKind === nk.value;
                          return (
                            <button
                              key={nk.value}
                              onClick={() => handleChange({ nurseKind: nk.value })}
                              className={`relative flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-colors z-10 ${
                                active ? "text-teal-800" : "text-slate-500 hover:text-slate-700"
                              }`}
                            >
                              {active && (
                                <motion.div
                                  layoutId="staffFilterNurseSeg" // ID riêng khác với Role
                                  className="absolute inset-0 bg-white shadow-sm rounded-lg ring-1 ring-black/5"
                                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                              )}
                              <span className="relative z-20">{nk.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 4. Trạng thái (Có hiệu ứng chạy) */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">
                  Trạng thái
                </label>
                <div className="relative flex p-1 rounded-xl bg-slate-100 ring-1 ring-slate-200">
                  {STATUS_OPTS.map((s) => {
                    const active = statusFilter === s.value;
                    return (
                      <button
                        key={s.value}
                        onClick={() => handleChange({ statusFilter: s.value })}
                        className={`relative flex-1 py-1.5 text-[12px] font-semibold rounded-lg transition-colors z-10 flex items-center justify-center gap-1.5 ${
                          active ? "text-teal-800" : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="staffFilterStatusSeg" // ID riêng khác với 2 nhóm trên
                            className="absolute inset-0 bg-white shadow-sm rounded-lg ring-1 ring-black/5"
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                          />
                        )}
                        <span className={`relative z-20 w-1.5 h-1.5 rounded-full ${
                          s.value === 'online' ? 'bg-emerald-500' : s.value === 'offline' ? 'bg-slate-300' : 'bg-teal-500'
                        }`} />
                        <span className="relative z-20">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Khoa phòng */}
              <div>
                <label className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-2 block">
                  Khoa / Phòng ban
                </label>
                <select 
                  value={dept}
                  onChange={(e) => handleChange({ dept: e.target.value })}
                  className="w-full text-[13px] rounded-xl border border-slate-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 outline-none bg-slate-50 focus:bg-white transition-all"
                >
                  <option value="">Tất cả các khoa</option>
                  <option value="noikhoa">Nội khoa tổng quát</option>
                  <option value="ngoaikhoa">Ngoại khoa</option>
                  <option value="nhikhoa">Nhi khoa</option>
                  <option value="san">Sản khoa</option>
                </select>
              </div>

            </div>
            
            

          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}