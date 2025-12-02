// src/components/auth/LoginForm.jsx
// Thêm nút ẩn/hiện mật khẩu (eye) custom, vẫn ẩn con mắt mặc định của browser.

import React, { useState } from "react";
import { motion } from "framer-motion";

export default function LoginForm({
  username,
  password,
  onChangeUsername,
  onChangePassword,
  onSubmit,
  onSwitchForgot,
  loading,
  loginLoading,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Username */}
      <div className="space-y-1.5">
        <label
          htmlFor="username"
          className="text-[13px] font-medium text-slate-800"
        >
          Tài khoản
        </label>
        <div className="relative">
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => onChangeUsername(e.target.value)}
            className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white"
            placeholder="VD: admin, bacsi.noi, yta.cls..."
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">👤</span>
        </div>
      </div>

      {/* Password + eye toggle */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="text-[13px] font-medium text-slate-800"
        >
          Mật khẩu
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => onChangePassword(e.target.value)}
            className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 px-3.5 py-2.5 pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/90 focus:border-cyan-400 transition-all hover:bg-white [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
            placeholder="••••••••"
          />
          <span className="absolute left-3.5 top-2.5 text-slate-400">🔒</span>

          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] px-2 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-200 transition-colors"
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {showPassword ? "Ẩn" : "Hiện"}
          </button>
        </div>
      </div>

      {/* Options */}
      <div className="flex items-center justify-between pt-1">
        <label className="inline-flex items-center gap-2 text-[12px] text-slate-500">
          <input
            type="checkbox"
            className="rounded border-slate-300 bg-white text-cyan-500 focus:ring-cyan-400/80"
            defaultChecked
          />
          Ghi nhớ trong phiên này
        </label>
        <button
          type="button"
          onClick={onSwitchForgot}
          className="text-[12px] text-cyan-600 hover:text-cyan-700 hover:underline underline-offset-2 transition-colors"
        >
          Quên mật khẩu?
        </button>
      </div>

      {/* Submit */}
      <motion.button
        type="submit"
        whileHover={{
          y: -1,
          boxShadow: "0 16px 32px rgba(34,211,238,0.5)",
        }}
        whileTap={{ scale: 0.97, y: 0 }}
        disabled={loading}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-rose-400 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all"
      >
        {loginLoading ? (
          <>
            <span className="h-4 w-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
            Đang đăng nhập...
          </>
        ) : (
          <>
            <span>Đăng nhập</span>
            <span className="text-base">↳</span>
          </>
        )}
      </motion.button>

      <p className="mt-3 text-[11px] text-slate-500">
      Quên mật khẩu → Nhấn {" "} 
        <span className="font-mono text-slate-800">Quên mật khẩu?</span> để xác thực + đổi mật khẩu.
      </p>
    </motion.form>
  );
}
