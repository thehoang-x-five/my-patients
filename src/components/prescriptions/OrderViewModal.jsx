import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React from 'react';
export default function OrderViewModal({ open, order, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết đơn thuốc"
        >
          <motion.div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Đơn thuốc #{order?.id}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bệnh nhân: {order?.ptName}
                </p>
              </div>
              <Button
                onClick={onClose}
                aria-label="Đóng"
                className="hover:bg-slate-100 rounded-full p-2"
              >
                ✕
              </Button>
            </header>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-sky-50 rounded-xl">
                  <div className="text-sm text-slate-500">Bác sĩ kê đơn</div>
                  <div className="font-semibold mt-1">
                    {order?.doctor || "—"}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl">
                  <div className="text-sm text-slate-500">Chẩn đoán</div>
                  <div className="font-semibold mt-1">{order?.diag || "—"}</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl">
                  <div className="text-sm text-slate-500">Ngày kê đơn</div>
                  <div className="font-semibold mt-1">
                    {order?.at
                      ? new Date(order.at).toLocaleString("vi-VN")
                      : "—"}
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 w-12 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Thuốc</th>
                      <th className="px-4 py-3 font-medium">Liều dùng</th>
                      <th className="px-4 py-3 w-24 font-medium">Số lượng</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(order?.items || []).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                        <td className="px-4 py-3 font-medium">{r.name}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.dose || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.qty || "—"}
                        </td>
                      </tr>
                    ))}
                    {!order?.items?.length && (
                      <tr>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Không có mục thuốc.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200">
              <Button
                onClick={onClose}
                className=" text-sky-800 hover:bg-sky-200 px-6"
              >
                Đóng
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
