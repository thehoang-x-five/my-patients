// [AUTH FLOW FIX - 2025-11-22]
// - Thêm cờ bootstrapped từ useAuthStore để chỉ redirect sau khi bootstrap xong.
// - Ngăn flash/double navigation: không redirect về /login nếu đang ở /login.
// - Giữ nguyên UI (Sidebar, Topbar, ErrorBoundary, AnimatePresence).

import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Sidebar from "./components/ui/Sidebar.jsx";
import Topbar from "./components/ui/Topbar.jsx";
import { ErrorBoundary } from "./components/ui/ErrorBoundary.jsx";
import {
  subscribeNotifications,
  inferRecipientFromToken,
} from "./api/notifications.js";
import { useAuthStore } from "./components/stores/appStore.js";
import { queryClient } from "./components/lib/queryClient.js";
import { initStaffRealtime } from "./api/realtime.js";

export default function App() {
  const { LoaiNguoiNhan, MaNguoiNhan, TenNguoiNhan, VaiTro } =
  inferRecipientFromToken() || {};

  const location = useLocation();
  const navigate = useNavigate();
  const handleUnauthorized = useAuthStore((s) => s.handleUnauthorized);
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const accessToken = useAuthStore((s) => s.accessToken);
  const accessTokenExpiresAt = useAuthStore((s) => s.accessTokenExpiresAt);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  // 1. Bootstrap auth store một lần khi mount
  useEffect(() => {
    bootstrap();
  }, [bootstrap]);
  // 1.b Lắng nghe event 401 toàn app và gọi handleUnauthorized()
    useEffect(() => {
        if (typeof window === "undefined") return;
    
        const onUnauthorized = () => {
          // handleUnauthorized có nhiệm vụ:
          // - thử refresh token
          // - nếu fail => logout()
          handleUnauthorized();
        };
    
        window.addEventListener("auth:unauthorized", onUnauthorized);
        return () => {
          window.removeEventListener("auth:unauthorized", onUnauthorized);
        };
      }, [handleUnauthorized]);
       // 1.c Auto xử lý khi token hết hạn (theo accessTokenExpiresAt)
  useEffect(() => {
      if (!accessToken || !accessTokenExpiresAt) return;
  
      const expMs = new Date(accessTokenExpiresAt).getTime();
      if (Number.isNaN(expMs)) return;
  
      const now = Date.now();
      const delay = expMs - now;
  
      // Nếu đã hết hạn rồi thì xử lý ngay
      if (delay <= 0) {
        handleUnauthorized();
        return;
      }
  
      // Đặt timer đến lúc hết hạn
      const id = setTimeout(() => {
        handleUnauthorized();
      }, delay);
  
      // Cleanup khi accessToken/accessTokenExpiresAt thay đổi hoặc unmount
      return () => {
        clearTimeout(id);
      };
    }, [accessToken, accessTokenExpiresAt, handleUnauthorized]);
  // 2. Sau khi bootstrap xong, quyết định redirect
  useEffect(() => {
    // Chưa bootstrap xong thì chưa quyết định redirect
    if (!bootstrapped) return;

    // Không có token và KHÔNG nằm trong nhánh /login => đẩy về /login
    if (!accessToken && !location.pathname.startsWith("/login")) {
      navigate("/login", { replace: true, state: { from: location } });
    }

    // (Optional) Nếu đã có token mà đang ở /login, có thể redirect về dashboard:
    // if (accessToken && location.pathname.startsWith("/login")) {
    //   navigate("/", { replace: true });
    // }
  }, [bootstrapped, accessToken, navigate, location]);

  // 3. Đăng ký realtime notification CHỈ KHI đã đăng nhập
  useEffect(() => {
    // Nếu chưa login thì khỏi subscribe
    if (!MaNguoiNhan || !accessToken) return;

    // 1) Khởi tạo SignalR staff (join group role:staff + nhan_vien_y_te)
    initStaffRealtime({ staffId: MaNguoiNhan }).catch(console.error);

    // 2) Đăng ký nhận NotificationCreated/NotificationUpdated
    const unsubscribe = subscribeNotifications(queryClient);

    // 3) Cleanup khi unmount / logout
    return () => {
      unsubscribe?.();
    };
  }, [MaNguoiNhan, accessToken]);

  // ========== RENDER GUARD ==========

  // 3.1 Chưa bootstrap xong -> show màn hình kiểm tra phiên
  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-slate-500">
          Đang kiểm tra phiên đăng nhập...
        </p>
      </div>
    );
  }

  // 3.2 ĐÃ bootstrap xong nhưng CHƯA có token
  if (!accessToken) {
    // Render layout trần (Login Layout) không có Sidebar/Topbar
    return (
        <div className="min-h-screen bg-slate-50">
          <ErrorBoundary>
              <Outlet />
          </ErrorBoundary>
        </div>
      );
  }

  // 3.3 Đã có token => render layout đầy đủ như cũ
  
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-[var(--sbw)]">
        <Topbar />
        <main className="overflow-auto scrollbar-none">
          <ErrorBoundary>
            <AnimatePresence mode="wait">
              <Outlet key={location.pathname} />
            </AnimatePresence>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
