// /src/components/notifications/NotificationDetailModal.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getNotificationTypeLabel } from "../../utils/notificationTypes.js";

export default function NotificationDetailModal({ open, item, onClose }) {
  if (!open || !item) return null;

  const created = item.createdAt || item.sentAt || item.time;
  const createdDate = created ? new Date(created) : null;
  const dateStr = createdDate
    ? createdDate.toLocaleDateString("vi-VN")
    : "—";
  const timeStr = createdDate
    ? createdDate.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // Sử dụng khai báo links từ File 1 để chuẩn hóa
  const links = Array.isArray(item.links) ? item.links : [];
  const typeLabel = getNotificationTypeLabel(item.type);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết thông báo"
        >
          <motion.div
            // Kết hợp CSS: ưu tiên thứ tự từ File 2 (rounded-2xl) nhưng thêm overflow-hidden
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-violet-200/80 overflow-hidden"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            {/* Header */}
            <header className="flex items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 px-5 py-3">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-violet-600">
                  Thông báo / {typeLabel}
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {item.title || "(Không có tiêu đề)"}
                </h2>
                <p className="text-xs text-slate-500">
                  Thời gian: {dateStr} • {timeStr}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                // Sử dụng CSS từ File 1 vì có vẻ là phiên bản mới hơn, rõ ràng và có màu sắc tốt hơn (bg-white text-sm font-semibold text-slate-800)
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-800 ring-1 ring-slate-200 shadow-sm hover:bg-rose-50"
                aria-label="Đóng"
              >
                ✕
              </button>
            </header>

            {/* Body */}
            <div className="max-h-[70vh] overflow-y-auto px-5 py-4 text-sm text-slate-700 scrollbar-none">
              {/* Logic hiển thị nội dung: Ưu tiên logic đơn giản của File 1 */}
              {item.description || item.message ? (
                <p className="whitespace-pre-line leading-relaxed">
                  {item.description || item.message}
                </p>
              ) : (
                <p className="italic text-slate-400">
                  Không có nội dung chi tiết.
                </p>
              )}

              {/* Khối thông tin bổ sung: Giữ lại từ File 1 */}
              <div className="mt-4 space-y-1 text-xs text-slate-500">
                {item.fromStaff && (
                  <p>
                    <span className="font-semibold">Người gửi: </span>
                    {item.fromStaff}
                    {item.fromDept ? ` • ${item.fromDept}` : ""}
                  </p>
                )}
                {item.patientName && (
                  <p>
                    <span className="font-semibold">Bệnh nhân: </span>
                    {item.patientName}
                    {item.patientId ? ` (${item.patientId})` : ""}
                  </p>
                )}
                {item.priority && (
                  <p>
                    <span className="font-semibold">Độ ưu tiên: </span>
                    {item.priority === "high" ? "Cao" : "Thường"}
                  </p>
                )}
              </div>

              {/* Khối Liên kết nhanh: Giữ lại cấu trúc và style của File 1 (vì có tiêu đề) */}
              {links.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Liên kết nhanh
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {links.map((l, idx) => (
                      <a
                        key={l.href || idx}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        // CSS File 1: Dùng màu nền nhẹ nhàng (violet-50) phù hợp làm liên kết phụ
                        className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100"
                      >
                        <span>{l.label || l.href}</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
