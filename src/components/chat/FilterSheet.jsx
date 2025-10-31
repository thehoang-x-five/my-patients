// src/components/chat/FilterSheet.jsx
import React from 'react';
import { motion, AnimatePresence } from "framer-motion";

export default function FilterSheet({
  open,
  onClose,
  values,
  setValues,
  anchorEl,
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          aria-hidden
        >
          {/* panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            // vị trí neo theo phần thanh công cụ ở trên
            className="absolute z-[70] rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-2xl p-3"
            style={{
              minWidth: 320,
              width: "min(92vw, 360px)",
              top: (anchorEl?.getBoundingClientRect().bottom || 64) + 8,
              left:
                (anchorEl?.getBoundingClientRect().right || 360) -
                Math.min(360, window.innerWidth * 0.92),
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="grid grid-cols-2 mb-2">
              <b className="block ">Lọc nhanh</b>
              <button className="ml-auto " onClick={onClose}>
                ✕
              </button>
            </div>
            <label className="text-sm block mb-2 mt-0">
              Trạng thái
              <select
                className="input mt-1 w-full"
                value={values.status}
                onChange={(e) =>
                  setValues((v) => ({ ...v, status: e.target.value }))
                }
              >
                {["Tất cả", "Chưa đọc", "Đã lưu trữ", "Ghim"].map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>

            <label className="text-sm block">
              Kênh
              <select
                className="input mt-1 w-full"
                value={values.channel}
                onChange={(e) =>
                  setValues((v) => ({ ...v, channel: e.target.value }))
                }
              >
                {["Tất cả", "Facebook", "Zalo", "Website", "Hotline"].map(
                  (k) => (
                    <option key={k}>{k}</option>
                  )
                )}
              </select>
            </label>

            <div className="flex justify-end gap-2 mt-3">
              <button
                className="btn"
                onClick={() =>
                  setValues({ status: "Tất cả", channel: "Tất cả" })
                }
              >
                Làm mới
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
