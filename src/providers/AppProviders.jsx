// [AUTH FLOW FIX - 2025-11-22]
// - Keep core providers unchanged (React Query, RealtimeContext, Devtools).
// - Listen globally for 'auth:unauthorized' from the http interceptor and
//   delegate refresh/logout handling to the auth store.

import React, { createContext, useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getConnection } from "../api/realtime";
import { queryClient } from "../components/lib/queryClient.js";
import { useAuthStore } from "../components/stores/appStore.js";

export const RealtimeContext = createContext({ connection: null });

export default function AppProviders({ children }) {
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
