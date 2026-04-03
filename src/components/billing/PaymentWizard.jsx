// src/components/billing/PaymentWizard.jsx
// Wizard thanh toán inline — tích hợp trong flow khám bệnh
// Flow: Dịch vụ chờ thanh toán → Chọn phương thức → Xác nhận → Hoàn tất
// Chờ Dev1 endpoints: POST /api/billing/invoices/confirm, PUT .../cancel

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCreateInvoice, useCancelInvoice } from "../../api/billing.js";
import { useAuthStore } from "../stores/appStore.js";
import { canManageReception } from "../../utils/permissions.js";
import {
  PHUONG_THUC_THANH_TOAN,
  PHUONG_THUC_THANH_TOAN_LABEL,
  TRANG_THAI_HOA_DON,
} from "../../constants/enums.js";

// ==================== STEPS ====================
const STEPS = {
  REVIEW: "review",
  METHOD: "method",
  CONFIRM: "confirm",
  DONE: "done",
};

const STEP_LABELS = {
  [STEPS.REVIEW]: "Chi tiết phí",
  [STEPS.METHOD]: "Phương thức",
  [STEPS.CONFIRM]: "Xác nhận",
  [STEPS.DONE]: "Hoàn tất",
};

const VND = (n) =>
  `${Number(n || 0).toLocaleString("vi-VN")} ₫`;

// ==================== MAIN COMPONENT ====================

/**
 * PaymentWizard — Wizard thanh toán inline
 * @param {boolean} open - Hiển thị wizard
 * @param {object} patient - Thông tin bệnh nhân (MaBenhNhan, HoTen)
 * @param {Array} items - Danh sách dịch vụ chờ thanh toán [{name, amount, type}]
 * @param {string} [examId] - MaPhieuKham đang liên kết
 * @param {string} [clsId] - MaPhieuKhamCls
 * @param {string} [rxId] - MaDonThuoc
 * @param {function} onClose - Đóng wizard
 * @param {function} [onComplete] - Callback khi thanh toán thành công
 */
export default function PaymentWizard({
  open,
  patient,
  items = [],
  examId,
  clsId,
  rxId,
  onClose,
  onComplete,
}) {
  const user = useAuthStore((s) => s.user);
  const canPay = canManageReception(user);

  const [step, setStep] = useState(STEPS.REVIEW);
  const [method, setMethod] = useState(PHUONG_THUC_THANH_TOAN.TIEN_MAT);
  const [error, setError] = useState(null);

  const createInvoice = useCreateInvoice();
  const cancelInvoice = useCancelInvoice();

  // Tổng tiền
  const total = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  // Nội dung hóa đơn
  const content = useMemo(
    () => items.map((it) => it.name || it.serviceName || "Dịch vụ").join(", "),
    [items]
  );

  const patientId =
    patient?.MaBenhNhan ??
    patient?.maBenhNhan ??
    patient?.pid ??
    patient?.id ??
    null;

  const patientName =
    patient?.HoTen ?? patient?.hoTen ?? patient?.name ?? "—";

  // Reset khi đóng
  const handleClose = useCallback(() => {
    setStep(STEPS.REVIEW);
    setMethod(PHUONG_THUC_THANH_TOAN.TIEN_MAT);
    setError(null);
    onClose?.();
  }, [onClose]);

  // Xác nhận thanh toán
  const handleConfirm = useCallback(async () => {
    if (!canPay) return;
    setError(null);

    try {
      const result = await createInvoice.mutateAsync({
        MaBenhNhan: patientId,
        MaNhanSuThu: user?.maNhanSu || user?.staffCode || user?.id || "admin",
        LoaiDotThu: "kham_lam_sang",
        SoTien: total,
        PhuongThucThanhToan: method,
        NoiDung: content,
        MaPhieuKham: examId || null,
        MaPhieuKhamCls: clsId || null,
        MaDonThuoc: rxId || null,
      });

      setStep(STEPS.DONE);
      onComplete?.(result);
    } catch (err) {
      setError(
        err?.response?.data?.Message ||
          err?.message ||
          "Không thể tạo hóa đơn. Vui lòng thử lại."
      );
    }
  }, [
    canPay,
    createInvoice,
    patientId,
    user,
    total,
    method,
    content,
    examId,
    clsId,
    rxId,
    onComplete,
  ]);

  if (!open) return null;

  const isLoading = createInvoice.isPending;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && step !== STEPS.CONFIRM)
            handleClose();
        }}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Thanh toán</h2>
              <button
                onClick={handleClose}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors"
                disabled={isLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
            {/* Step indicator */}
            <div className="flex gap-2 mt-3">
              {Object.values(STEPS).map((s, i) => (
                <div key={s} className="flex items-center gap-1 flex-1">
                  <div
                    className={`h-1.5 flex-1 rounded-full transition-colors ${
                      Object.values(STEPS).indexOf(step) >= i
                        ? "bg-white"
                        : "bg-white/30"
                    }`}
                  />
                </div>
              ))}
            </div>
            <div className="text-sm mt-1 text-emerald-100">
              {STEP_LABELS[step]}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* STEP: REVIEW */}
              {step === STEPS.REVIEW && (
                <motion.div
                  key="review"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <div className="mb-4">
                    <div className="text-sm text-slate-500">Bệnh nhân</div>
                    <div className="font-medium text-slate-800">
                      {patientName}
                      <span className="ml-2 text-xs text-slate-400">
                        ({patientId || "—"})
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {items.length === 0 ? (
                      <div className="text-center text-slate-400 py-6">
                        Không có dịch vụ nào cần thanh toán
                      </div>
                    ) : (
                      items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60"
                        >
                          <span className="text-sm text-slate-700">
                            {it.name || it.serviceName || `Dịch vụ ${idx + 1}`}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {VND(it.amount)}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <span className="font-medium text-slate-600">
                      Tổng cộng
                    </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {VND(total)}
                    </span>
                  </div>
                </motion.div>
              )}

              {/* STEP: METHOD */}
              {step === STEPS.METHOD && (
                <motion.div
                  key="method"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <div className="text-sm text-slate-500 mb-3">
                    Chọn phương thức thanh toán
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(PHUONG_THUC_THANH_TOAN).map(
                      ([, value]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setMethod(value)}
                          className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                            method === value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-center">
                            {PHUONG_THUC_THANH_TOAN_LABEL[value]}
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}

              {/* STEP: CONFIRM */}
              {step === STEPS.CONFIRM && (
                <motion.div
                  key="confirm"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                >
                  <div className="text-center py-2">
                    <div className="text-4xl mb-3">💳</div>
                    <div className="text-sm text-slate-500">Xác nhận thanh toán</div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      {VND(total)}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Phương thức:{" "}
                      <span className="font-medium text-slate-700">
                        {PHUONG_THUC_THANH_TOAN_LABEL[method]}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {patientName}
                    </div>
                  </div>

                  {error && (
                    <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}

              {/* STEP: DONE */}
              {step === STEPS.DONE && (
                <motion.div
                  key="done"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <svg
                      className="w-8 h-8 text-emerald-600"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <path
                        d="M20 6L9 17l-5-5"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="text-lg font-semibold text-slate-800">
                    Thanh toán thành công
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {VND(total)} — {PHUONG_THUC_THANH_TOAN_LABEL[method]}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 p-4 flex items-center justify-between gap-3">
            {step === STEPS.DONE ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors"
              >
                Đóng
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={
                    step === STEPS.REVIEW
                      ? handleClose
                      : () =>
                          setStep(
                            step === STEPS.METHOD
                              ? STEPS.REVIEW
                              : step === STEPS.CONFIRM
                                ? STEPS.METHOD
                                : STEPS.REVIEW
                          )
                  }
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {step === STEPS.REVIEW ? "Hủy" : "Quay lại"}
                </button>

                {step === STEPS.CONFIRM ? (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={isLoading || !canPay}
                    className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      canPay
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : "bg-slate-200 text-slate-400 cursor-not-allowed"
                    } disabled:opacity-50`}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeDasharray="31.4"
                            strokeDashoffset="10"
                            strokeLinecap="round"
                          />
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      "Xác nhận thanh toán"
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setStep(
                        step === STEPS.REVIEW ? STEPS.METHOD : STEPS.CONFIRM
                      )
                    }
                    disabled={items.length === 0}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Tiếp tục
                  </button>
                )}
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
