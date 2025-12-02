// [AUTH FLOW FIX - 2025-11-22]
// - Giữ nguyên UI SettingsScreen & layout (topbar, motion, container).
// - Bổ sung OTP cho đổi mật khẩu: mở OtpVerificationModal (purpose="change"), gửi OTP về email user.
// - Sau khi verify OTP: gọi changePasswordApi(currentPassword, newPassword, confirmPassword, otpIntentId) -> toast -> logout() -> điều hướng /login.
// - Vẫn dùng bootstrapped từ useAuthStore để tránh flicker và bảo vệ route.

// src/routes/Settings.jsx

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Navigate, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import useViewportVH from "../hooks/useViewportVH.js";
import useMediaQuery from "../hooks/useMediaQuery.js";

import { useAuthStore } from "../components/stores/appStore.js";
import SettingsScreen from "../components/settings/SettingsScreen.jsx";
import { changePasswordApi } from "../api/auth.js";
import OtpVerificationModal from "../components/auth/OtpVerificationModal.jsx";

export default function Settings() {
  useViewportVH();

  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const navigate = useNavigate();

  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);

  const [otpOpen, setOtpOpen] = useState(false);
  const [pendingPw, setPendingPw] = useState(null);

  // Đảm bảo luôn bootstrap auth 1 lần
  useEffect(() => {
    if (!bootstrapped) {
      bootstrap();
    }
  }, [bootstrapped, bootstrap]);

  if (!bootstrapped) {
    return (
      <main className="px-4 pb-3 pt-1 flex items-center justify-center min-h-[60vh] text-sm text-slate-500">
        Đang kiểm tra phiên đăng nhập...
      </main>
    );
  }

  // Đã bootstrap nhưng không có token => quay về login
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  // Đổi mật khẩu -> mở OTP modal, sau khi verify mới gọi BE
  const handleChangePassword = ({
    currentPassword,
    newPassword,
    confirmPassword,
  }) => {
    if (!user?.email) {
      toast.error(
        "Tài khoản chưa có email để gửi OTP đổi mật khẩu. Vui lòng liên hệ quản trị."
      );
      return;
    }
    setPendingPw({ currentPassword, newPassword, confirmPassword });
    setOtpOpen(true);
  };

  // Logout: gọi oustore logt + điều hướng login
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Cài đặt"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <section className="p-1 flex-1 mb-0 min-h-0">
          <SettingsScreen
            user={user}
            onChangePassword={handleChangePassword}
            onLogout={handleLogout}
          />
        </section>
      </div>

      <OtpVerificationModal
        open={otpOpen}
        email={user?.email || ""}
        purpose="change"
        onClose={() => setOtpOpen(false)}
        onVerified={async (intentId) => {
          if (!pendingPw) return;
          try {
            await changePasswordApi({
              currentPassword: pendingPw.currentPassword,
              newPassword: pendingPw.newPassword,
              confirmPassword: pendingPw.confirmPassword,
              otpIntentId: intentId,
            });
            toast.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
            await logout();
            navigate("/login", { replace: true });
          } catch (err) {
            const msg =
              err?.response?.data?.message ||
              err?.message ||
              "Đổi mật khẩu thất bại. Vui lòng thử lại.";
            toast.error(msg);
          } finally {
            setPendingPw(null);
            setOtpOpen(false);
          }
        }}
      />
    </motion.main>
  );
}
