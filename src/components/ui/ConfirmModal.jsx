// src/components/ui/ConfirmModal.jsx
// Modal xác nhận thay thế window.confirm — animation mượt, hỗ trợ tone nguy hiểm
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

const backdrop = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modal = {
  hidden: { opacity: 0, scale: 0.9, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 28 } },
  exit: { opacity: 0, scale: 0.92, y: 16, transition: { duration: 0.15 } },
};

/**
 * @param {Object} props
 * @param {boolean}  props.open       — hiện / ẩn modal
 * @param {Function} props.onClose    — đóng (= Không)
 * @param {Function} props.onConfirm  — xác nhận (= Có)
 * @param {string}   [props.title]    — tiêu đề (VD: "Xác nhận hủy")
 * @param {string}   [props.message]  — nội dung mô tả
 * @param {string}   [props.confirmText] — nhãn nút xác nhận ("Xác nhận")
 * @param {string}   [props.cancelText]  — nhãn nút hủy ("Không")
 * @param {"danger"|"warning"|"info"} [props.tone] — theme màu
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Xác nhận",
  message = "Bạn có chắc chắn muốn thực hiện?",
  confirmText = "Xác nhận",
  cancelText = "Không",
  tone = "danger",
}) {
  const toneMap = {
    danger: {
      icon: "⚠️",
      iconBg: "bg-rose-100",
      confirmBtn: "bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white shadow-rose-200",
      ring: "ring-rose-200",
    },
    warning: {
      icon: "⚡",
      iconBg: "bg-amber-100",
      confirmBtn: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-200",
      ring: "ring-amber-200",
    },
    info: {
      icon: "ℹ️",
      iconBg: "bg-sky-100",
      confirmBtn: "bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-sky-200",
      ring: "ring-sky-200",
    },
  };

  const t = toneMap[tone] || toneMap.danger;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            variants={modal}
            initial="hidden"
            animate="visible"
            exit="exit"
            className={`relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ${t.ring}`}
          >
            {/* Icon + Title */}
            <div className="flex items-start gap-4">
              <div className={`w-11 h-11 rounded-2xl ${t.iconBg} grid place-items-center text-xl shrink-0`}>
                {t.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-slate-900 leading-tight">{title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{message}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.97]"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm?.();
                  onClose?.();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold shadow-sm hover:shadow-md transition-all active:scale-[0.97] ${t.confirmBtn}`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
