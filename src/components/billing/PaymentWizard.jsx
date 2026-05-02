// src/components/billing/PaymentWizard.jsx
// Wizard thanh toán inline — tích hợp trong flow khám bệnh
// Flow: Tìm hóa đơn đã tạo sẵn (chua_thu) → Hiện chi tiết → Chọn phương thức → Xác nhận → Hoàn tất

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  searchInvoices,
  updateInvoiceStatus,
  useConfirmInvoice,
  useCreateInvoice,
  useGenerateVietQR,
} from "../../api/billing.js";
import { useAuthStore } from "../stores/appStore.js";
import { canManageReception } from "../../utils/permissions.js";
import {
  PHUONG_THUC_THANH_TOAN,
  PHUONG_THUC_THANH_TOAN_LABEL,
} from "../../constants/enums.js";
import VietQRDisplay from "./VietQRDisplay.jsx";

// ==================== STEPS ====================
const STEPS = {
  LOADING: "loading",
  REVIEW: "review",
  METHOD: "method",
  CONFIRM: "confirm",
  DONE: "done",
};

const STEP_LABELS = {
  [STEPS.LOADING]: "Đang tải...",
  [STEPS.REVIEW]: "Chi tiết phí",
  [STEPS.METHOD]: "Phương thức",
  [STEPS.CONFIRM]: "Xác nhận",
  [STEPS.DONE]: "Hoàn tất",
};

const DEFERRED_METHOD = "__thu_sau__";
const VND = (n) => `${Number(n || 0).toLocaleString("vi-VN")} ₫`;
const METHOD_OPTIONS = [
  ...Object.values(PHUONG_THUC_THANH_TOAN).map((value) => ({
    value,
    label: PHUONG_THUC_THANH_TOAN_LABEL[value],
  })),
  { value: DEFERRED_METHOD, label: "Thu sau" },
];

// ==================== MAIN COMPONENT ====================

/**
 * PaymentWizard — Wizard thanh toán inline
 * @param {boolean} open - Hiển thị wizard
 * @param {object} patient - Thông tin bệnh nhân (MaBenhNhan, HoTen)
 * @param {Array} items - Danh sách dịch vụ hiển thị [{name, amount}] (fallback display)
 * @param {string} [examId] - MaPhieuKham để tìm hóa đơn auto-created
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
  initialInvoice = null,
  allowDeferred = true,
  onClose,
  onComplete,
}) {
  const user = useAuthStore((s) => s.user);
  const canPay = canManageReception(user);

  const [step, setStep] = useState(STEPS.LOADING);
  const [method, setMethod] = useState(PHUONG_THUC_THANH_TOAN.TIEN_MAT);
  const [error, setError] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [completionMode, setCompletionMode] = useState("paid");
  const [isPreparingStep, setIsPreparingStep] = useState(false);

  // Hóa đơn tìm được từ BE
  const [invoice, setInvoice] = useState(null);

  const confirmInvoice = useConfirmInvoice();
  const createInvoice = useCreateInvoice();
  const generateVietQR = useGenerateVietQR();

  const patientId =
    patient?.MaBenhNhan ??
    patient?.maBenhNhan ??
    patient?.pid ??
    patient?.id ??
    initialInvoice?.MaBenhNhan ??
    initialInvoice?.maBenhNhan ??
    null;

  const patientName =
    patient?.HoTen ??
    patient?.hoTen ??
    patient?.name ??
    initialInvoice?.TenBenhNhan ??
    initialInvoice?.tenBenhNhan ??
    "—";

  const billingType = String(
    initialInvoice?.LoaiDotThu ??
      initialInvoice?.loaiDotThu ??
      (clsId ? "can_lam_sang" : rxId ? "thuoc" : "kham_lam_sang")
  ).toLowerCase();

  const methodOptions = useMemo(
    () =>
      allowDeferred
        ? METHOD_OPTIONS
        : METHOD_OPTIONS.filter((option) => option.value !== DEFERRED_METHOD),
    [allowDeferred]
  );

  // ==================== TÌM HÓA ĐƠN KHI MỞ ====================
  useEffect(() => {
    if (!open) return;

    setStep(STEPS.LOADING);
    setInvoice(null);
    setError(null);
    setMethod(PHUONG_THUC_THANH_TOAN.TIEN_MAT);
    setQrData(null);
    setCompletionMode("paid");

    let cancelled = false;

    async function findInvoice() {
      if (initialInvoice) {
        setInvoice(initialInvoice);
        setStep(STEPS.REVIEW);
        return;
      }

      try {
        // Tìm hóa đơn "chua_thu" cho bệnh nhân này
        const result = await searchInvoices({
          MaBenhNhan: patientId,
          LoaiDotThu: billingType,
          TrangThai: "chua_thu",
          Page: 1,
          PageSize: 10,
        });

        if (cancelled) return;

        const invoices =
          result?.Items ?? result?.items ?? result?.data ?? [];

        let matched = null;
        if (examId || clsId || rxId) {
          matched = invoices.find(
            (inv) =>
              (examId &&
                (inv.MaPhieuKham ?? inv.maPhieuKham) === examId) ||
              (clsId &&
                (inv.MaPhieuKhamCls ?? inv.maPhieuKhamCls) === clsId) ||
              (rxId &&
                (inv.MaDonThuoc ?? inv.maDonThuoc) === rxId)
          );
        }

        if (matched) {
          setInvoice(matched);
          setStep(STEPS.REVIEW);
        } else {
          // Không tìm được hóa đơn — cho phép tạo mới
          setInvoice(null);
          setStep(STEPS.REVIEW);
        }
      } catch (err) {
        if (cancelled) return;
        console.warn("Không thể tìm hóa đơn:", err);
        setInvoice(null);
        setStep(STEPS.REVIEW);
      }
    }

    findInvoice();
    return () => {
      cancelled = true;
    };
  }, [open, patientId, examId, clsId, rxId, billingType, initialInvoice]);

  // Tổng tiền — ưu tiên từ invoice BE
  const total = useMemo(() => {
    if (invoice) {
      return Number(invoice.SoTien ?? invoice.soTien ?? 0);
    }
    return items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
  }, [invoice, items]);

  // Nội dung hóa đơn
  const content = useMemo(() => {
    if (invoice) {
      return invoice.NoiDung ?? invoice.noiDung ?? "Thanh toán dịch vụ";
    }
    return items
      .map((it) => it.name || it.serviceName || "Dịch vụ")
      .join(", ");
  }, [invoice, items]);

  // Mã hóa đơn
  const invoiceId = invoice?.MaHoaDon ?? invoice?.maHoaDon ?? null;

  const ensureInvoiceExists = useCallback(async () => {
    if (invoice) {
      return invoice;
    }

    const fallbackTotal =
      items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0) || 0;

    const createdInvoice = await createInvoice.mutateAsync({
      MaBenhNhan: patientId,
      MaNhanSuThu:
        user?.maNhanSu || user?.staffCode || user?.id || "admin",
      LoaiDotThu: billingType,
      SoTien: fallbackTotal > 0 ? fallbackTotal : 1,
      PhuongThucThanhToan:
        method === DEFERRED_METHOD
          ? PHUONG_THUC_THANH_TOAN.TIEN_MAT
          : method,
      NoiDung: content,
      MaPhieuKham: examId || null,
      MaPhieuKhamCls: clsId || null,
      MaDonThuoc: rxId || null,
    });

    setInvoice(createdInvoice);
    return createdInvoice;
  }, [invoice, items, createInvoice, patientId, user, method, content, examId, clsId, rxId, billingType]);

  // Reset khi đóng
  const handleClose = useCallback(() => {
    setStep(STEPS.LOADING);
    setMethod(PHUONG_THUC_THANH_TOAN.TIEN_MAT);
    setError(null);
    setInvoice(null);
    setQrData(null);
    setCompletionMode("paid");
    onClose?.();
  }, [onClose]);

  const handleAdvance = useCallback(async () => {
    if (step === STEPS.REVIEW) {
      setStep(STEPS.METHOD);
      return;
    }

    if (step !== STEPS.METHOD) {
      setStep(STEPS.CONFIRM);
      return;
    }

    setError(null);

    if (method === PHUONG_THUC_THANH_TOAN.VIETQR) {
      try {
        setIsPreparingStep(true);
        const activeInvoice = await ensureInvoiceExists();
        const activeInvoiceId =
          activeInvoice?.MaHoaDon ?? activeInvoice?.maHoaDon ?? null;

        if (activeInvoiceId) {
          const qr = await generateVietQR.mutateAsync({
            maHoaDon: activeInvoiceId,
            SoTien: Number(activeInvoice.SoTien ?? activeInvoice.soTien ?? total),
            NoiDung: activeInvoice.NoiDung ?? activeInvoice.noiDung ?? content,
          });
          setQrData(qr);
        }
      } catch (err) {
        setError(
          err?.response?.data?.Message ||
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tạo mã VietQR. Vui lòng thử lại."
        );
        return;
      } finally {
        setIsPreparingStep(false);
      }
    } else {
      setQrData(null);
    }

    setStep(STEPS.CONFIRM);
  }, [step, method, ensureInvoiceExists, generateVietQR, total, content]);

  // Xác nhận thanh toán
  const handleConfirm = useCallback(async () => {
    if (!canPay) return;
    setError(null);

    try {
      const activeInvoice = invoice ?? (await ensureInvoiceExists());
      const activeInvoiceId =
        activeInvoice?.MaHoaDon ?? activeInvoice?.maHoaDon ?? null;

      if (method === DEFERRED_METHOD) {
        if (activeInvoiceId) {
          const deferredInvoice = await updateInvoiceStatus({
            id: activeInvoiceId,
            status: "bao_luu",
          });
          setInvoice(deferredInvoice || activeInvoice);
        }

        setCompletionMode("deferred");
        setStep(STEPS.DONE);
        onComplete?.({
          status: "deferred",
          invoiceId: activeInvoiceId,
        });
        return;
      }

      if (!activeInvoiceId) {
        throw new Error("Không tìm thấy mã hóa đơn để xác nhận thanh toán.");
      }

      await confirmInvoice.mutateAsync({
        maHoaDon: activeInvoiceId,
        PhuongThucThanhToan: method,
      });

      setCompletionMode("paid");
      setStep(STEPS.DONE);
      onComplete?.({
        status: "paid",
        method,
        invoiceId: activeInvoiceId,
      });
    } catch (err) {
      setError(
        err?.response?.data?.Message ||
          err?.response?.data?.message ||
          err?.message ||
          "Không thể thanh toán. Vui lòng thử lại."
      );
    }
  }, [
    canPay,
    invoice,
    confirmInvoice,
    method,
    ensureInvoiceExists,
    onComplete,
  ]);

  useEffect(() => {
    if (method !== PHUONG_THUC_THANH_TOAN.VIETQR) {
      setQrData(null);
    }
  }, [method]);

  if (!open) return null;

  const isLoading =
    confirmInvoice.isPending ||
    createInvoice.isPending ||
    generateVietQR.isPending ||
    isPreparingStep;

  const confirmActionLabel =
    method === DEFERRED_METHOD
      ? "Lưu thu sau"
      : method === PHUONG_THUC_THANH_TOAN.VIETQR
      ? "Xác nhận đã nhận chuyển khoản"
      : "Xác nhận thanh toán";

  // Steps for the progress bar (exclude LOADING)
  const visibleSteps = [STEPS.REVIEW, STEPS.METHOD, STEPS.CONFIRM, STEPS.DONE];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
            {step !== STEPS.LOADING && (
              <div className="flex gap-2 mt-3">
                {visibleSteps.map((s, i) => (
                  <div key={s} className="flex items-center gap-1 flex-1">
                    <div
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        visibleSteps.indexOf(step) >= i
                          ? "bg-white"
                          : "bg-white/30"
                      }`}
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="text-sm mt-1 text-emerald-100">
              {STEP_LABELS[step]}
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {/* STEP: LOADING */}
              {step === STEPS.LOADING && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-10"
                >
                  <svg
                    className="w-8 h-8 animate-spin text-emerald-500"
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
                  <div className="text-sm text-slate-500 mt-3">
                    Đang tìm hóa đơn...
                  </div>
                </motion.div>
              )}

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

                  {/* Nguồn hóa đơn */}
                  {invoice && (
                    <div className="mb-3 p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700">
                      ✅ Hóa đơn #{invoiceId} —{" "}
                      {invoice.NoiDung ?? invoice.noiDung ?? "Dịch vụ khám"}
                    </div>
                  )}

                  {!invoice && items.length > 0 && (
                    <div className="mb-3 p-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
                      ⚠ Không tìm được hóa đơn tự tạo. Sẽ tạo hóa đơn mới khi
                      xác nhận.
                    </div>
                  )}

                  <div className="space-y-2">
                    {invoice ? (
                      // Hiện info từ invoice thực
                      <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                        <span className="text-sm text-slate-700">
                          {invoice.NoiDung ?? invoice.noiDung ?? "Dịch vụ khám"}
                        </span>
                        <span className="text-sm font-semibold text-slate-800">
                          {VND(total)}
                        </span>
                      </div>
                    ) : items.length === 0 ? (
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
                    {methodOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMethod(option.value)}
                          className={`p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                            method === option.value
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20"
                              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="text-center">
                            {option.label}
                          </div>
                        </button>
                      ))}
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
                    <div className="text-sm text-slate-500">
                      Xác nhận thanh toán
                    </div>
                    <div className="text-2xl font-bold text-emerald-600 mt-1">
                      {VND(total)}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      Phương thức:{" "}
                      <span className="font-medium text-slate-700">
                        {methodOptions.find((option) => option.value === method)
                          ?.label || "—"}
                      </span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {patientName}
                    </div>
                  </div>

                  {method === PHUONG_THUC_THANH_TOAN.VIETQR && (
                    <div className="mt-4">
                      {generateVietQR.isPending || isPreparingStep ? (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-sm text-emerald-700">
                          Đang tạo mã VietQR...
                        </div>
                      ) : (
                        <VietQRDisplay qr={qrData} />
                      )}
                    </div>
                  )}

                  {method === DEFERRED_METHOD && (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
                      Hóa đơn sẽ được giữ ở trạng thái chưa thu để thanh toán sau.
                    </div>
                  )}

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
                    {completionMode === "deferred"
                      ? "Đã lưu hóa đơn chưa thu"
                      : "Thanh toán thành công"}
                  </div>
                  <div className="text-sm text-slate-500 mt-1">
                    {completionMode === "deferred"
                      ? `${VND(total)} — Chưa thu`
                      : `${VND(total)} — ${
                          methodOptions.find((option) => option.value === method)
                            ?.label || "—"
                        }`}
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
            ) : step === STEPS.LOADING ? (
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
              >
                Hủy
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
                      confirmActionLabel
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAdvance}
                    disabled={!invoice && items.length === 0}
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
