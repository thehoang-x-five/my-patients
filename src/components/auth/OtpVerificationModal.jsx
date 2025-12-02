// [AUTH FLOW FIX + UI POLISH - 2025-11-22]
// - Thêm tham số purpose khi gửi/verify OTP (forgot/change) để BE phân biệt luồng.
// - Ưu tiên dùng otpIntentId/intentId do BE trả về; intentId local chỉ là fallback.
// - Giữ UI 6 ô nhập OTP, chỉnh lại copy + spacing + fallback khi thiếu email.
// - Bổ sung thuộc tính a11y (role="dialog", aria-modal, heading id).
// - Chỉnh lại footer: nút Hủy căn trái, nút Gửi lại OTP ở giữa, nút Xác nhận OTP căn phải (cùng 1 hàng).

// src/components/auth/OtpVerificationModal.jsx
// Modal OTP dùng chung cho quên mật khẩu & đổi mật khẩu.

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { requestOtp, verifyOtp } from "../../api/otp.js";
const OTP_INTENT_REUSE_WINDOW_MS = 150 * 1000; // 2 phút 30 giây
const OTP_SESSION_KEY_PREFIX = "his-otp-session";
function createIntentId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `otp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function makeOtpSessionKey(email, purpose) {
    const normEmail =
      (email && email.trim().toLowerCase()) || "unknown";
    const normPurpose = purpose || "default";
    return `${OTP_SESSION_KEY_PREFIX}:${normPurpose}:${normEmail}`;
  }
/**
 * props:
 *  - open: boolean
 *  - email: string (email hoặc username đang dùng cho OTP)
 *  - purpose: "forgot" | "change"
 *  - onVerified: (intentId: string) => void
 *  - onClose: () => void
 */
export default function OtpVerificationModal({
  open,
  email,
  purpose = "forgot",
  onVerified,
  onClose,
}) {
  const [intentId, setIntentId] = useState(null);
  const [digits, setDigits] = useState(Array(6).fill(""));
  const inputsRef = useRef([]);
  const [requesting, setRequesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [expiresLeft, setExpiresLeft] = useState(null);
  const [cooldownLeft, setCooldownLeft] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const displayEmail =
    email && email.trim().length > 0 ? email.trim() : "email tài khoản của bạn";

  // Khi mở modal → tạo intentId & gửi OTP
   // Khi mở modal → lấy intentId cũ trong 2p30 (nếu có) hoặc tạo mới, rồi gửi OTP
  useEffect(() => {
    if (!open) {
      setIntentId(null);
      setDigits(Array(6).fill(""));
      setExpiresLeft(null);
      setCooldownLeft(null);
      setMessage("");
      setError("");
      return;
    }
    const sessionKey = makeOtpSessionKey(email, purpose);
        const now = Date.now();
        let id = null;
    let requestedAt = now;

    // Thử lấy intentId cũ nếu còn trong cửa sổ 2p30
    try {
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem(sessionKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (
            parsed &&
            parsed.intentId &&
            typeof parsed.requestedAt === "number"
          ) {
            const diff = now - parsed.requestedAt;
            if (diff < OTP_INTENT_REUSE_WINDOW_MS) {
              id = parsed.intentId;
              requestedAt = parsed.requestedAt;
            }
          }
        }
      }
    } catch {
      // bỏ qua lỗi localStorage
    }

    if (!id) {
      id = createIntentId();
      requestedAt = now;
    }

    setIntentId(id);
    setRequesting(true);
    setMessage("");
    setError("");

    requestOtp({ email, intentId: id, purpose })
   
      .then((res) => {
        const serverIntentId = res?.otpIntentId || res?.intentId;
        const finalIntentId = serverIntentId || id;
                setIntentId(finalIntentId);
        
                // Lưu session: giữ nguyên requestedAt gốc để đo 2p30
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      sessionKey,
                      JSON.stringify({
                        intentId: finalIntentId,
                        requestedAt,
                      })
                    );
                  }
                } catch {
                  // ignore
                }
        setMessage(res?.message || "Đã gửi mã OTP.");
        if (typeof res?.expiresLeft === "number") {
          setExpiresLeft(res.expiresLeft);
        }
        if (typeof res?.cooldownLeft === "number") {
          setCooldownLeft(res.cooldownLeft);
        }
        setTimeout(() => {
          inputsRef.current?.[0]?.focus();
        }, 200);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể gửi OTP. Vui lòng thử lại.";
        setError(msg);
      })
      .finally(() => setRequesting(false));
  }, [open, email, purpose]);

  // Đếm ngược hết hạn & cooldown
  useEffect(() => {
    if (!open) return;
    if (expiresLeft == null && cooldownLeft == null) return;

    const timer = setInterval(() => {
      setExpiresLeft((prev) =>
        typeof prev === "number" && prev > 0 ? prev - 1 : prev
      );
      setCooldownLeft((prev) =>
        typeof prev === "number" && prev > 0 ? prev - 1 : prev
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [open, expiresLeft, cooldownLeft]);

  const handleChangeDigit = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    setDigits((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    if (value && index < digits.length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < digits.length - 1) {
      e.preventDefault();
      inputsRef.current[index + 1]?.focus();
    }
  };

  const code = digits.join("");

 
   
 
  const handleVerify = async () => {
    if (!intentId) return;
    if (code.length !== digits.length) {
      setError(`Vui lòng nhập đủ ${digits.length} số OTP.`);
      return;
    }

    setVerifying(true);
    setError("");
    setMessage("");

    try {
      const res = await verifyOtp({ intentId, code, purpose });
     
        setMessage(res?.message || "Xác thực OTP thành công.");
        onVerified?.(intentId);
        setTimeout(() => {
          onClose?.();
        }, 500);

    
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể xác thực OTP. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = () => {
    if (!intentId || requesting) return;
    setRequesting(true);
    setError("");
    setMessage("");

    requestOtp({ email, intentId, purpose })
      .then((res) => {
        const serverIntentId = res?.otpIntentId || res?.intentId;
        if (serverIntentId) {
          setIntentId(serverIntentId);
        }
        setMessage(res?.message || "Đã gửi lại mã OTP.");
        if (typeof res?.expiresLeft === "number") {
          setExpiresLeft(res.expiresLeft);
        }
        if (typeof res?.cooldownLeft === "number") {
          setCooldownLeft(res.cooldownLeft);
        }
        setDigits(Array(6).fill(""));
        setTimeout(() => {
          inputsRef.current?.[0]?.focus();
        }, 200);
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Không thể gửi lại OTP. Vui lòng thử lại.";
        setError(msg);
      })
      .finally(() => setRequesting(false));
  };

  const disabled = verifying || requesting;
  const titleId = "otp-modal-title";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
        >
          <motion.div
            className="w-full max-w-md mx-3 rounded-xl bg-slate-900/95 border border-slate-700/70 shadow-xl overflow-hidden"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="px-5 pt-4 pb-3 border-b border-slate-800/80 flex items-center justify-between">
              <div>
                <p
                  id={titleId}
                  className="text-[13px] uppercase tracking-wide text-slate-300 font-semibold"
                >
                  {purpose === "change"
                    ? "Xác thực đổi mật khẩu"
                    : "Xác thực đặt lại mật khẩu"}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Vui lòng nhập mã OTP được gửi tới email của bạn để tiếp tục.
                </p>
              </div>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-100 text-xs px-2 py-1 rounded-md hover:bg-slate-800/80"
                onClick={onClose}
              >
                Đóng
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-center">
              <div className="space-y-2">
                <p className="text-xs text-slate-300">
                  Mã OTP đã được gửi tới{" "}
                  <span className="font-semibold text-cyan-200">
                    {displayEmail}
                  </span>
                  .
                </p>
                <p className="text-[11px] text-slate-400">
                  Nhập{" "}
                  <span className="font-semibold text-cyan-200">
                    6 chữ số
                  </span>{" "}
                  trong email/SMS để tiếp tục.
                </p>

                <div className="flex gap-2 mt-2 justify-center">
                  {digits.map((d, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputsRef.current[idx] = el)}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      className="w-10 h-10 rounded-md bg-slate-900 border border-slate-700/80 text-center text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400"
                      value={d}
                      onChange={(e) =>
                        handleChangeDigit(idx, e.target.value)
                      }
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                    />
                  ))}
                </div>
              </div>

              {(expiresLeft != null || cooldownLeft != null) && (
                <div className="text-[11px] text-slate-400">
                  {expiresLeft != null && expiresLeft > 0 && (
                    <p>
                      Mã OTP sẽ hết hạn sau{" "}
                      <span className="font-semibold">
                        {expiresLeft}s
                      </span>
                      .
                    </p>
                  )}
                  {message && (
                    <p className="text-emerald-300 mt-0.5">{message}</p>
                  )}
                  {error && (
                    <p className="text-rose-300 mt-0.5">{error}</p>
                  )}
                </div>
              )}

              {!expiresLeft && !cooldownLeft && (message || error) && (
                <div className="text-[11px] text-slate-400">
                  {message && (
                    <p className="text-emerald-300 mt-0.5">{message}</p>
                  )}
                  {error && (
                    <p className="text-rose-300 mt-0.5">{error}</p>
                  )}
                </div>
              )}

              {/* Footer: Hủy (trái) - Gửi lại (giữa) - Xác nhận (phải) */}
              <div className="pt-2 flex items-center gap-2">
                {/* Trái: Hủy */}
                <div className="flex-1 flex justify-start">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onClose}
                    disabled={disabled}
                     className="bg-gradient-to-r from-cyan-200 to-red-300 text-sky-800 ring ring-cyan-100 hover:from-cyan-300 hover:to-red-400"
                  >
                    Hủy
                  </Button>
                </div>

                
                {/* Phải: Xác nhận */}
                <div className="flex gap-2 ">
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleResend}
                    disabled={
                      disabled ||
                      (typeof cooldownLeft === "number" &&
                        cooldownLeft > 0)
                    }
                     className="bg-gradient-to-r from-cyan-200 to-violet-300 text-sky-800 ring ring-cyan-100 hover:from-cyan-300 hover:to-violet-400"
                  >
                    {typeof cooldownLeft === "number" && cooldownLeft > 0
                      ? `Gửi lại OTP (${cooldownLeft}s)`
                      : "Gửi lại OTP"}
                  </Button>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleVerify}
                    disabled={disabled}
                  >
                    {verifying ? "Đang xác thực..." : "Xác nhận OTP"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
