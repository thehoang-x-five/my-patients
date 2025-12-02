// src/api/otp.js
import { post } from "./http";

/**
 * Request OTP: POST /api/otp/request
 * Body chuẩn: { Email, IntentId }
 * BE hiện có thể không trả body -> FE tự giữ intentId local.
 */
export async function requestOtp({ email, intentId,purpose }) {
  const payload = {
    Email: email,
    IntentId: intentId,
  };

  const data = await post("/otp/request", payload);

  return {
    // BE không trả IntentId, nên luôn dùng local
    intentId,
    otpIntentId: null,
    message: data?.message || "Đã gửi mã OTP.",
    expiresLeft:
      typeof data?.expiresLeft === "number" ? data.expiresLeft : null,
    cooldownLeft:
      typeof data?.cooldownLeft === "number" ? data.cooldownLeft : null,
  };
}

/**
 * Verify OTP: POST /api/otp/verify
 * Body chuẩn: { IntentId, Code }
 * 2xx = OTP hợp lệ; 4xx = sai/hết hạn.
 */
export async function verifyOtp({ intentId, code ,purpose }) {
  const payload = {
    IntentId: intentId,
    Code: code,
  };

  const data = await post("/otp/verify", payload);

  return {
    intentId,
    otpIntentId: null,
    message: data?.message || "",
  };
}
