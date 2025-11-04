import React, { createContext, useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ensureStarted, getConnection } from "../api/realtime";
import { queryClient } from "../components/lib/queryClient.js";

// Context (nếu nơi khác cần dùng connection)
export const RealtimeContext = createContext({ connection: null });

export default function AppProviders({ children }) {
  useEffect(() => {
    // Khởi tạo SignalR khi app mount (không chặn UI nếu lỗi)
    ensureStarted().catch(() => {});
    return () => {
      // tuỳ dự án có thể stop(); giữ nguyên để thân thiện HMR
    };
  }, []);

  const value = useMemo(() => ({ connection: getConnection() }), []);

  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
