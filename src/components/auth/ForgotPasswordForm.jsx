// src/components/auth/ForgotPasswordForm.jsx
// Thêm nút ẩn/hiện cho mật khẩu mới & xác nhận.

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function ForgotPasswordForm({
  username,
  email,
  resetPassword,
  resetConfirm,
  onChangeUsername,
  onChangeEmail,
  onChangeResetPassword,
  onChangeResetConfirm,
  onSubmit,
  onBackToLogin,
  loading,
  forgotLoading,
}) {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="space-y-1">
        <h2 className="text-base sm:text-lg font-semibold text-slate-900">
          Đặt lại mật khẩu
        </h2>
        <p className="text-xs text-slate-500">
          Nhập tài khoản và mật khẩu mới. 
        </p>
      </div>

      {/* Username */}
      <div className="space-y-1.5">
        <label
          htmlFor="username-forgot"
          className="text-[13px] font-medium text-slate-800"
        >
          Tài khoản
        </label>
        <div className="relative">
          <input
            id="username-forgot"
            autoComplete="username"
            value={username}
            onChange={(e) => onChangeUsername(e.target.value)}
            className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white"
            placeholder="Tài khoản đã được cấp"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">👤</span>
        </div>
      </div>
{/* Email đăng ký */}
     <div className="space-y-1.5">
       <label
         htmlFor="email-forgot"
         className="text-[13px] font-medium text-slate-800"
       >
         Email đăng ký
       </label>
       <div className="relative">
         <input
           id="email-forgot"
           type="email"
           autoComplete="email"
           value={email}
           onChange={(e) => onChangeEmail(e.target.value)}
           className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white"
           placeholder="Email đã đăng ký tài khoản"
         />
         <span className="absolute left-3.5 top-2.5 text-slate-400">✉️</span>
       </div>
     </div>
      {/* New password */}
      <div className="space-y-1.5">
        <label
          htmlFor="reset-password"
          className="text-[13px] font-medium text-slate-800"
        >
          Mật khẩu mới
        </label>
        <div className="relative">
          <input
            id="reset-password"
            type={showNewPassword ? "text" : "password"}
            autoComplete="new-password"
            value={resetPassword}
            onChange={(e) => onChangeResetPassword(e.target.value)}
            className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            placeholder="Mật khẩu mới"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">🔒</span>

          <button
            type="button"
            onClick={() => setShowNewPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors"
            aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showNewPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      {/* Confirm new password */}
      <div className="space-y-1.5">
        <label
          htmlFor="reset-confirm"
          className="text-[13px] font-medium text-slate-800"
        >
          Xác nhận mật khẩu mới
        </label>
        <div className="relative">
          <input
            id="reset-confirm"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            value={resetConfirm}
            onChange={(e) => onChangeResetConfirm(e.target.value)}
            className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            placeholder="Nhập lại mật khẩu mới"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">✅</span>

          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors"
            aria-label={
              showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
            }
          >
            {showConfirmPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 gap-3">
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[12px] text-slate-500 hover:text-slate-700 hover:underline underline-offset-2 transition-colors"
        >
          ← Quay lại đăng nhập
        </button>
        <motion.button
          type="submit"
          whileHover={{
            y: -1,
            boxShadow: "0 16px 32px rgba(248,113,113,0.35)",
          }}
          whileTap={{ scale: 0.97, y: 0 }}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-400 via-amber-400 to-cyan-500 px-4 py-2 text-[13px] font-semibold text-white shadow-md disabled:opacity-70 disabled:cursor-not-allowed transition-all"
        >
          {forgotLoading ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
              Đang đổi mật khẩu...
            </>
          ) : (
            <>Xác nhận đổi mật khẩu</>
          )}
        </motion.button>
      </div>
    </motion.form>
  );
}
