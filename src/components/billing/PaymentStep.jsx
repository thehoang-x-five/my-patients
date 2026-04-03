// src/components/billing/PaymentStep.jsx
// Compact inline payment step — nhúng trực tiếp trong ExamDetail flow
// Dùng khi bác sĩ hoàn tất khám → bước thanh toán inline (không cần wizard popup)

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../stores/appStore.js";
import { canManageReception, isAdmin } from "../../utils/permissions.js";
import {
  PHUONG_THUC_THANH_TOAN,
  PHUONG_THUC_THANH_TOAN_LABEL,
} from "../../constants/enums.js";

const VND = (n) => `${Number(n || 0).toLocaleString("vi-VN")} ₫`;

/**
 * PaymentStep — inline payment summary & action
 * Hiển thị tóm tắt phí + nút thanh toán.
 * Admin/Y tá HC: nút active. Còn lại: chỉ xem (read-only).
 *
 * @param {Array} items - [{name, amount}]
 * @param {boolean} [paid] - Đã thanh toán chưa?
 * @param {string} [paymentMethod] - Phương thức đã dùng (nếu paid=true)
 * @param {function} [onPay] - Click thanh toán → gọi PaymentWizard hoặc API trực tiếp
 * @param {boolean} [loading] - Đang xử lý
 * @param {string} [className]
 */
export default function PaymentStep({
  items = [],
  paid = false,
  paymentMethod,
  onPay,
  loading = false,
  className = "",
}) {
  const user = useAuthStore((s) => s.user);
  const canPay = canManageReception(user);

  const total = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0),
    [items]
  );

  if (items.length === 0 && !paid) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${
        paid
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-amber-200 bg-amber-50/30"
      } ${className}`}
    >
      {/* Header */}
      <div
        className={`px-4 py-2.5 flex items-center justify-between ${
          paid ? "bg-emerald-100/60" : "bg-amber-100/50"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">
            {paid ? "✅" : "💰"}
          </span>
          <span
            className={`text-sm font-semibold ${
              paid ? "text-emerald-700" : "text-amber-700"
            }`}
          >
            {paid ? "Đã thanh toán" : "Chờ thanh toán"}
          </span>
        </div>
        <span
          className={`text-sm font-bold ${
            paid ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {VND(total)}
        </span>
      </div>

      {/* Item list */}
      <div className="px-4 py-3 space-y-1.5">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-slate-600">
              {it.name || it.serviceName || `Dịch vụ ${idx + 1}`}
            </span>
            <span className="text-slate-700 font-medium tabular-nums">
              {VND(it.amount)}
            </span>
          </div>
        ))}
      </div>

      {/* Action */}
      {!paid && (
        <div className="px-4 pb-3">
          {canPay ? (
            <button
              type="button"
              onClick={onPay}
              disabled={loading || total <= 0}
              className="w-full py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
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
                "Thu phí"
              )}
            </button>
          ) : (
            <div className="text-center text-xs text-slate-400 py-1">
              Chỉ Y tá tiếp nhận / Admin mới có quyền thu phí
            </div>
          )}
        </div>
      )}

      {/* Payment method badge (if paid) */}
      {paid && paymentMethod && (
        <div className="px-4 pb-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            {PHUONG_THUC_THANH_TOAN_LABEL[paymentMethod] ||
              paymentMethod}
          </span>
        </div>
      )}
    </motion.section>
  );
}
