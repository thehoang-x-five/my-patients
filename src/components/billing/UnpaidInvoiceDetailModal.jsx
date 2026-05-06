import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

import { formatCurrency, formatDate, formatDateTime } from "../../utils/textFormatters.js";

function getInvoiceTypeLabel(kind) {
  const value = String(kind || "").toLowerCase();
  if (value === "kham_lam_sang") return "Khám lâm sàng";
  if (value === "can_lam_sang") return "Cận lâm sàng";
  if (value === "thuoc") return "Thuốc";
  return kind || "—";
}

export default function UnpaidInvoiceDetailModal({
  open,
  invoice,
  mode = "unpaid",
  onClose,
  onConfirm,
  onCancel,
  canProcess = false,
  canCancel = false,
  isPending = false,
}) {
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  useEffect(() => {
    if (!open) {
      setShowCancelForm(false);
      setCancelReason("");
    }
  }, [open, invoice?.MaHoaDon, invoice?.maHoaDon]);

  const isReserved = mode === "reserved";

  const invoiceMeta = useMemo(() => {
    if (!invoice) return null;

    const createdAt =
      invoice.NgayTao ??
      invoice.ngayTao ??
      invoice.ThoiGian ??
      invoice.thoiGian;
    const handledAt =
      invoice.ThoiGianXuLy ??
      invoice.thoiGianXuLy ??
      createdAt;
    const daysOverdue = Math.floor(
      (new Date() - new Date(handledAt)) / (1000 * 60 * 60 * 24)
    );

    return {
      createdAt,
      handledAt,
      daysOverdue,
      invoiceTypeLabel: getInvoiceTypeLabel(
        invoice.LoaiDotThu ?? invoice.loaiDotThu ?? ""
      ),
    };
  }, [invoice]);

  if (!open || !invoice || !invoiceMeta) return null;

  const { createdAt, handledAt, daysOverdue, invoiceTypeLabel } = invoiceMeta;

  const handleCancelInvoice = () => {
    if (!cancelReason.trim()) return;
    onCancel?.(invoice, cancelReason.trim());
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) onClose?.();
          }}
        >
          <motion.div
            initial={{ y: 18, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.98, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
          >
            <header
              className={`rounded-t-2xl border-b px-6 py-4 ${
                isReserved
                  ? "border-sky-100 bg-gradient-to-r from-sky-50 via-cyan-50 to-sky-50"
                  : "border-amber-100 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {isReserved ? "Chi tiết bảo lưu" : "Chi tiết hóa đơn"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Mã hóa đơn:{" "}
                    <span
                      className={`font-semibold ${
                        isReserved ? "text-sky-700" : "text-amber-700"
                      }`}
                    >
                      #{invoice.MaHoaDon ?? invoice.maHoaDon}
                    </span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </header>

            <div className="scrollbar-none max-h-[70vh] overflow-y-auto p-6">
              {isReserved ? (
                <div className="mb-4 rounded-xl border border-sky-200/80 bg-sky-50/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🧾</span>
                    <div>
                      <div className="text-sm font-semibold text-sky-700">
                        Đã chuyển sang bảo lưu
                      </div>
                      <div className="text-sm text-sky-600">
                        Ca đã thanh toán nhưng bệnh nhân bỏ về. Số tiền đang được giữ lại để xử lý ở lần tiếp theo.
                      </div>
                    </div>
                  </div>
                </div>
              ) : daysOverdue >= 7 ? (
                <div
                  className={`mb-4 rounded-xl border p-4 ${
                    daysOverdue > 30
                      ? "border-rose-200/80 bg-rose-50/70"
                      : "border-amber-200/80 bg-amber-50/70"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{daysOverdue > 30 ? "🔴" : "⚠️"}</span>
                    <div>
                      <div
                        className={`text-sm font-semibold ${
                          daysOverdue > 30 ? "text-rose-700" : "text-amber-700"
                        }`}
                      >
                        {daysOverdue > 30 ? "Khẩn cấp" : "Cần ưu tiên"}
                      </div>
                      <div
                        className={`text-sm ${
                          daysOverdue > 30 ? "text-rose-600" : "text-amber-600"
                        }`}
                      >
                        Hóa đơn chưa thu {daysOverdue} ngày
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <motion.div
                  className={`rounded-xl border p-4 ${
                    isReserved
                      ? "border-sky-200/70 bg-sky-50/45"
                      : "border-amber-200/70 bg-amber-50/45"
                  }`}
                  whileHover={{ scale: 1.01 }}
                >
                  <div
                    className={`text-sm font-medium ${
                      isReserved ? "text-sky-700" : "text-amber-700"
                    }`}
                  >
                    Bệnh nhân
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-800">
                    {invoice.TenBenhNhan ?? invoice.tenBenhNhan ?? "—"}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Mã BN: {invoice.MaBenhNhan ?? invoice.maBenhNhan ?? "—"}
                  </div>
                </motion.div>

                <motion.div
                  className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4"
                  whileHover={{ scale: 1.01 }}
                >
                  <div className="text-sm font-medium text-slate-600">
                    Tổng tiền
                  </div>
                  <div
                    className={`mt-1 text-3xl font-bold ${
                      isReserved ? "text-sky-600" : "text-amber-600"
                    }`}
                  >
                    {formatCurrency(invoice.SoTien ?? invoice.soTien ?? 0)}
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    {isReserved ? "Đang giữ lại" : "Chưa thanh toán"}
                  </div>
                </motion.div>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="min-w-full text-sm">
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white">
                      <td className="w-40 px-4 py-3 font-medium text-slate-500">
                        Ngày tạo
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {formatDate(createdAt)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/55">
                      <td className="px-4 py-3 font-medium text-slate-500">
                        Loại đợt thu
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {invoiceTypeLabel}
                      </td>
                    </tr>
                    {isReserved && (
                      <tr className="bg-white">
                        <td className="px-4 py-3 font-medium text-slate-500">
                          Thời gian bảo lưu
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {formatDateTime(handledAt)}
                        </td>
                      </tr>
                    )}
                    <tr className={isReserved ? "bg-slate-50/55" : "bg-white"}>
                      <td className="px-4 py-3 font-medium text-slate-500 align-top">
                        Nội dung
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {invoice.NoiDung ?? invoice.noiDung ?? "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {!isReserved && !showCancelForm && canProcess && (
                <div className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                  <div className="text-sm font-semibold text-emerald-800">
                    Xử lý thanh toán
                  </div>
                  <p className="mt-1 text-sm text-emerald-700">
                    Hệ thống sẽ mở wizard thanh toán để chọn phương thức, xác nhận và hỗ trợ VietQR nếu cần.
                  </p>
                </div>
              )}

              {!isReserved && !showCancelForm && !canProcess && (
                <div className="mt-6 rounded-xl border border-slate-200/80 bg-slate-50/70 p-4">
                  <div className="text-sm font-semibold text-slate-700">
                    Chỉ xem công nợ
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    Vai trò hiện tại không có quyền xử lý thanh toán hoặc hủy hóa đơn. Vui lòng chuyển cho y tá hành chính phụ trách thu ngân.
                  </p>
                </div>
              )}

              {showCancelForm && !isReserved && (
                <div className="mt-6 rounded-xl border border-rose-200/80 bg-rose-50/70 p-4">
                  <div className="mb-2 text-sm font-semibold text-rose-800">
                    Hủy hóa đơn
                  </div>
                  <label className="mb-1 block text-xs text-slate-600">
                    Lý do hủy
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder="Nhập lý do hủy hóa đơn..."
                    className="w-full resize-none rounded-xl border border-rose-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-400"
                    rows={3}
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleCancelInvoice}
                      disabled={isPending || !cancelReason.trim()}
                      className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
                    >
                      {isPending ? "Đang xử lý..." : "Xác nhận hủy"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCancelForm(false);
                        setCancelReason("");
                      }}
                      disabled={isPending}
                      className="rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!showCancelForm && (
              <footer className="flex items-center justify-end gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50/70 px-6 py-4">
                {!isReserved && canCancel ? (
                  <button
                    onClick={() => setShowCancelForm(true)}
                    disabled={isPending}
                    className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 disabled:opacity-50"
                  >
                    Hủy HĐ
                  </button>
                ) : null}
                {isReserved || !canProcess ? (
                  <button
                    onClick={onClose}
                    className="rounded-xl bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
                  >
                    Đóng
                  </button>
                ) : (
                  <button
                    onClick={() => onConfirm?.(invoice)}
                    disabled={isPending}
                    className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Tiếp tục thanh toán
                  </button>
                )}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
