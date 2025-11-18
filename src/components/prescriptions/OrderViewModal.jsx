// src/components/prescriptions/OrderViewModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React from "react";

// --- Các biến thể (variants) cho hiệu ứng animation ---

// Biến thể cho container (list)
const listVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
    },
  },
};

// Biến thể cho từng item (item)
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25,
    },
  },
};

// --- Icon component ---
const XIcon = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default function OrderViewModal({ open, order, onClose }) {
  const statusText =
    order?.statusLabel || order?.status || "";
  const total =
    order?.total != null
      ? Number(order.total) || 0
      : 0;

  const totalDisplay = total
    ? `${total.toLocaleString("vi-VN")} đ`
    : "—";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          // Lớp Overlay (backdrop)
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Chi tiết đơn thuốc"
        >
          <motion.div
            // Lớp Card Modal
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            initial={{ y: 20, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -12, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* --- Header --- */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800">
                  Đơn thuốc #{order?.id}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  Bệnh nhân:{" "}
                  <span className="font-medium text-slate-700">
                    {order?.ptName || "—"}
                  </span>
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                  {statusText && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 px-2 py-0.5 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      {statusText}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 text-slate-700 ring-1 ring-slate-200 px-2 py-0.5">
                    Tổng tiền:&nbsp;
                    <span className="font-semibold">
                      {totalDisplay}
                    </span>
                  </span>
                </div>
              </div>
              <Button
                onClick={onClose}
                aria-label="Đóng"
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </Button>
            </header>

            {/* --- Body --- */}
            <div className="p-6">
              <motion.div
                className="grid grid-cols-3 gap-4 mb-6"
                variants={listVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Box 1: Bác sĩ */}
                <motion.div
                  className="p-4 bg-indigo-50 rounded-xl border border-indigo-200/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  variants={itemVariants}
                >
                  <div className="text-sm font-medium text-indigo-700">
                    Bác sĩ kê đơn
                  </div>
                  <div className="font-bold text-indigo-900 mt-1 truncate">
                    {order?.doctor || "—"}
                  </div>
                </motion.div>

                {/* Box 2: Chẩn đoán */}
                <motion.div
                  className="p-4 bg-violet-50 rounded-xl border border-violet-200/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  variants={itemVariants}
                >
                  <div className="text-sm font-medium text-violet-700">
                    Chẩn đoán
                  </div>
                  <div className="font-bold text-violet-900 mt-1 truncate">
                    {order?.diag || "—"}
                  </div>
                </motion.div>

                {/* Box 3: Ngày kê đơn */}
                <motion.div
                  className="p-4 bg-sky-50 rounded-xl border border-sky-200/80 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  variants={itemVariants}
                >
                  <div className="text-sm font-medium text-sky-700">
                    Ngày kê đơn
                  </div>
                  <div className="font-bold text-sky-900 mt-1">
                    {order?.at
                      ? new Date(order.at).toLocaleString("vi-VN")
                      : "—"}
                  </div>
                </motion.div>
              </motion.div>

              {/* --- Table --- */}
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 w-12 font-medium">#</th>
                      <th className="px-4 py-3 font-medium">Thuốc</th>
                      <th className="px-4 py-3 font-medium">Liều dùng</th>
                      <th className="px-4 py-3 w-24 font-medium">
                        Số lượng
                      </th>
                    </tr>
                  </thead>

                  <motion.tbody
                    className="divide-y divide-slate-200"
                    variants={listVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {(order?.items || []).map((r, i) => (
                      <motion.tr
                        key={i}
                        className="hover:bg-indigo-50/60"
                        variants={itemVariants}
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {r.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.dose || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {r.qty || "—"}
                        </td>
                      </motion.tr>
                    ))}
                    {!order?.items?.length && (
                      <motion.tr variants={itemVariants}>
                        <td
                          colSpan="4"
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          Không có mục thuốc.
                        </td>
                      </motion.tr>
                    )}
                  </motion.tbody>
                </table>
              </div>
            </div>

            {/* --- Footer --- */}
            <footer className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl">
              <Button
                onClick={onClose}
                className="font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-colors px-6"
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