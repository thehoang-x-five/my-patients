// [AUTH FLOW FIX - 2025-11-22]
// - Giữ nguyên UI providers (React Query, RealtimeContext, Devtools).
// - Thêm listener global cho event 'auth:unauthorized' từ http interceptor:
//   + Gọi useAuthStore.handleUnauthorized() để tự refresh hoặc logout khi 401.

import React, { createContext, useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ensureStarted, getConnection } from "../api/realtime";
import { queryClient } from "../components/lib/queryClient.js";
import { useAuthStore } from "../components/stores/appStore.js";
import { subscribeNotifications } from "../api/notifications.js";
// Context (nếu nơi khác cần dùng connection)
export const RealtimeContext = createContext({ connection: null });

export default function AppProviders({ children }) {

  const auth = useAuthStore();
  useEffect(() => {
    // Khởi tạo SignalR khi app mount (không chặn UI nếu lỗi)
    ensureStarted().catch(() => {});
    return () => {
      // tuỳ dự án có thể stop(); giữ nguyên để thân thiện HMR
    };
  }, []);

  // Lắng nghe 401 từ http (event 'auth:unauthorized') để tự xử lý refresh/logout
  useEffect(() => {
    const onUnauthorized = () => {
      const state = useAuthStore.getState();
      if (typeof state.handleUnauthorized === "function") {
        state.handleUnauthorized();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("auth:unauthorized", onUnauthorized);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("auth:unauthorized", onUnauthorized);
      }
    };
  }, []);
  useEffect(() => {
        if (!auth?.user) return;
        const off = subscribeNotifications(queryClient);
        return () => off?.();
      }, [auth?.user]);
  const value = useMemo(() => ({ connection: getConnection() }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeContext.Provider value={value}>
        {children}
      </RealtimeContext.Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
