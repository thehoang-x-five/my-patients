// [AUTH FLOW FIX/NOTE - 2025-11-22]
// - Giữ nguyên UI AuthLayout/LoginCard/Forgot password.
// - Tích hợp OtpVerificationModal (purpose="forgot") + forgotPasswordApi với otpIntentId từ BE.
// - Lưu ý: có thể dùng tài khoản hoặc email để gửi OTP, tuỳ UI (ở đây form đã có cả tài khoản + email).

// src/routes/Login.jsx
// Login route chỉ giữ: bootstrap auth, redirect, mutation login/forgot,
// còn UI tách sang các component trong /components/auth.
import OtpVerificationModal from "../components/auth/OtpVerificationModal.jsx";

import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useAuthStore } from "../components/stores/appStore.js";
import { forgotPasswordApi } from "../api/auth.js";
import AuthLayout from "../components/auth/AuthLayout.jsx";
import LoginCard from "../components/auth/LoginCard.jsx";
import AuthShowcasePanel from "../components/auth/AuthShowcasePanel.jsx";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [pendingForgot, setPendingForgot] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  const login = useAuthStore((s) => s.login);
  const accessToken = useAuthStore((s) => s.accessToken);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  // Bootstrap auth state 1 lần
  useEffect(() => {
    if (!bootstrapped) {
      bootstrap();
    }
  }, [bootstrapped, bootstrap]);

  // Nếu đã có token thì redirect khỏi trang login
  useEffect(() => {
    if (accessToken) {
      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    }
  }, [accessToken, navigate, location]);

  const loginMutation = useMutation({
    mutationFn: login,
    onError: (err) => {
      const msg =
       
        err?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại.";
      toast.error(msg);
    },
    
  });

  // Quên mật khẩu: đổi mật khẩu mới sau khi verify OTP
  const forgotMutation = useMutation({
    mutationFn: ({ username, email, newPassword, otpIntentId }) =>
      forgotPasswordApi({ username, email, newPassword, otpIntentId }),
    onSuccess: () => {
      toast.success("Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
      setMode("login");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đặt lại mật khẩu thất bại. Vui lòng thử lại.";
      toast.error(msg);
    },
  });

  const handleForgot = ({ username, email, newPassword, confirmPassword }) => {
    if (!username) {
      toast.warning("Vui lòng nhập tài khoản.");
      return;
    }
    if (!email) {
      toast.warning("Vui lòng nhập email đăng ký.");
      return;
    }
    if (!newPassword || !confirmPassword) {
      toast.warning("Vui lòng nhập đầy đủ mật khẩu mới.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.warning("Mật khẩu xác nhận không khớp.");
      return;
    }

    // Lưu payload để dùng sau khi verify OTP
    setPendingForgot({ username, email, newPassword });

    // Email reset là email đăng ký người dùng nhập
    setOtpEmail(email);
    setOtpOpen(true);
  };

  const handleLogin = ({ username, password }) => {
    if (!username || !password) {
      toast.warning("Vui lòng nhập đầy đủ tài khoản và mật khẩu.");
      return;
    }
    loginMutation.mutate({ username, password });
  };

  const loading = loginMutation.isLoading || forgotMutation.isLoading;

  return (
    <>
      <AuthLayout
        left={
          <LoginCard
            mode={mode}
            onModeChange={setMode}
            onLogin={handleLogin}
            onForgot={handleForgot}
            loading={loading}
            loginLoading={loginMutation.isLoading}
            forgotLoading={forgotMutation.isLoading}
          />
        }
        right={<AuthShowcasePanel />}
      />

      {/* Modal OTP cho luồng quên mật khẩu */}
      <OtpVerificationModal
        open={otpOpen}
        email={otpEmail}
        purpose="forgot"
        onClose={() => setOtpOpen(false)}
        onVerified={(intentId) => {
          if (!pendingForgot) return;
          forgotMutation.mutate({
            username: pendingForgot.username,
            email: pendingForgot.email,
            newPassword: pendingForgot.newPassword,
            otpIntentId: intentId,
          });
          setPendingForgot(null);
          setOtpOpen(false);
        }}
      />
    </>
  );
}
