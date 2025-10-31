import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import Button from "../ui/Button.jsx";

export default function NotificationDetailModal({ open, data, onClose }) {
  if (!data) return null;

  const rows = [
    ["Loại", mapType(data.type)],
    ["Tiêu đề", data.title],
    ["Nội dung", data.body],
    ["Thời gian", new Date(data.ts).toLocaleString("vi-VN")],
    data.patientId && ["Bệnh nhân", `${data.patientName} (${data.patientId})`],
    data.rxId && ["Mã đơn thuốc", data.rxId],
    data.invoiceId && ["Mã hoá đơn", data.invoiceId],
    data.drugCode && ["Mã thuốc", data.drugCode],
  ].filter(Boolean);

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
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="font-extrabold">Chi tiết thông báo</h3>
              <Button onClick={onClose} aria-label="Đóng">
                ✕
              </Button>
            </header>

            <div className="p-4 grid gap-3 text-sm max-h-[65vh] overflow-auto">
              <div className="grid gap-2">
                {rows.map(([l, v], i) => (
                  <div key={i} className="grid grid-cols-[140px,1fr] gap-2">
                    <div className="text-slate-500">{l}:</div>
                    <div className="font-medium">{v}</div>
                  </div>
                ))}
              </div>

              {!!(data.links || []).length && (
                <div className="rounded-xl p-3 bg-slate-50 ring-1 ring-slate-200/80">
                  <b className="block mb-1">Liên kết nhanh</b>
                  <div className="flex flex-wrap gap-3">
                    {data.patientId && (
                      <Link
                        to={`/patients?pid=${data.patientId}`}
                        className="underline underline-offset-2 text-sky-700 hover:text-sky-800 focus:outline-none focus:ring-2 ring-sky-300 rounded"
                      >
                        Hồ sơ bệnh nhân
                      </Link>
                    )}
                    {data.rxId && (
                      <Link
                        to={`/prescriptions?view=${data.rxId}`}
                        className="underline underline-offset-2 text-sky-700 hover:text-sky-800 focus:outline-none focus:ring-2 ring-sky-300 rounded"
                      >
                        Xem đơn thuốc
                      </Link>
                    )}
                    {(data.links || []).map((l, i) => (
                      <Link
                        key={i}
                        to={l.to}
                        className="underline underline-offset-2 text-sky-700 hover:text-sky-800 focus:outline-none focus:ring-2 ring-sky-300 rounded"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200">
              <Button onClick={onClose}>Đóng</Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function mapType(t) {
  const m = {
    appointment: "Lịch hẹn",
    stock: "Kho thuốc",
    billing: "Thanh toán",
    lab: "Cận lâm sàng",
    rx: "Đơn thuốc",
    message: "Tin nhắn",
    system: "Hệ thống",
    staff: "Nhân sự",
  };
  return m[t] || t;
}
