// src/components/auth/LoginCard.jsx
// Card bên trái: logo + chuyển qua lại giữa form login / quên mật khẩu.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm.jsx";
import ForgotPasswordForm from "./ForgotPasswordForm.jsx";

export default function LoginCard({
  mode,
  onModeChange,
  onLogin,
  onForgot,
  loading,
  loginLoading,
  forgotLoading,
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");

  const handleLoginSubmit = () => {
    // FIX: không cho submit khi đang gọi API login
    if (loading || loginLoading) return;
    onLogin({ username, password });
  };

  const handleForgotSubmit = () => {
    // FIX: không cho submit khi đang gọi API forgot
    if (loading || forgotLoading) return;
    onForgot({
      username,
      email: resetEmail,
      newPassword: resetPassword,
      confirmPassword: resetConfirm,
    });
  };

  const switchToForgot = () => {
    // FIX: đang loading thì không cho nhảy form
    if (loading) return;
    onModeChange("forgot");
    setResetPassword("");
    setResetConfirm("");
    setResetEmail("");
  };

  const switchToLogin = () => {
    // FIX: đang loading thì không cho nhảy form
    if (loading) return;
    onModeChange("login");
    setPassword("");
    setResetPassword("");
    setResetConfirm("");
    setResetEmail("");
  };

  return (
    <section className="bg-white/95 border border-cyan-200/60 rounded-3xl px-6 sm:px-8 lg:px-10 py-8 sm:py-10 shadow-[0_20px_60px_rgba(148,163,184,0.45)] backdrop-blur">
      {/* Logo nhỏ */}
      <div className="flex items-center gap-3 mb-6">
        <motion.div
          initial={{ rotate: -8, scale: 0.9 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-sky-500 to-emerald-500 grid place-items-center shadow-lg shadow-cyan-400/60 text-white"
        >
          ✚
        </motion.div>
        <div>
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">
            Healthcare HIS
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cổng đăng nhập nhân sự
          </p>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mode === "login" ? (
          <LoginForm
            key="login-form"
            username={username}
            password={password}
            onChangeUsername={setUsername}
            onChangePassword={setPassword}
            onSubmit={handleLoginSubmit}
            onSwitchForgot={switchToForgot}
            loading={loading}
            loginLoading={loginLoading}
          />
        ) : (
          <ForgotPasswordForm
            key="forgot-form"
            username={username}
            email={resetEmail}
            resetPassword={resetPassword}
            resetConfirm={resetConfirm}
            onChangeUsername={setUsername}
            onChangeEmail={setResetEmail}
            onChangeResetPassword={setResetPassword}
            onChangeResetConfirm={setResetConfirm}
            onSubmit={handleForgotSubmit}
            onBackToLogin={switchToLogin}
            loading={loading}
            forgotLoading={forgotLoading}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
