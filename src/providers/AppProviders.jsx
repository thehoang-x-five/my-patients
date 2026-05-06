// [AUTH FLOW FIX - 2025-11-22]
// - Keep core providers unchanged (React Query, RealtimeContext, Devtools).
// - Listen globally for 'auth:unauthorized' from the http interceptor and
//   delegate refresh/logout handling to the auth store.

import React, { createContext, useEffect, useMemo } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getConnection, on } from "../api/realtime";
import { queryClient } from "../components/lib/queryClient.js";
import { useAuthStore } from "../components/stores/appStore.js";

export const RealtimeContext = createContext({ connection: null });

const GLOBAL_REALTIME_EVENTS = [
  "PatientCreated",
  "PatientUpdated",
  "PatientStatusUpdated",
  "QueueItemChanged",
  "QueueByRoomUpdated",
  "ClinicalExamCreated",
  "ClinicalExamUpdated",
  "FinalDiagnosisChanged",
  "ClsOrderCreated",
  "ClsOrderUpdated",
  "ClsOrderStatusUpdated",
  "ClsResultCreated",
  "ClsSummaryCreated",
  "ClsSummaryUpdated",
  "ClsItemUpdated",
  "VisitCreated",
  "VisitStatusUpdated",
  "AppointmentChanged",
  "InvoiceChanged",
  "PrescriptionCreated",
  "PrescriptionStatusUpdated",
  "NotificationCreated",
  "NotificationUpdated",
];

const GLOBAL_QUERY_KEYS = [
  ["patients"],
  ["patient"],
  ["queue"],
  ["examinations"],
  ["clinical"],
  ["appointments"],
  ["history"],
  ["visits"],
  ["medical-history"],
  ["invoices"],
  ["pharmacy", "rxOrders"],
  ["notifications"],
  ["notification-search"],
  ["departments"],
  ["department-rooms"],
  ["dashboard"],
];

function refreshRealtimeCaches() {
  for (const queryKey of GLOBAL_QUERY_KEYS) {
    queryClient.invalidateQueries({
      queryKey,
      exact: false,
      refetchType: "active",
    });
  }

  queryClient.refetchQueries({
    queryKey: ["queue"],
    exact: false,
    type: "active",
  });
  queryClient.refetchQueries({
    queryKey: ["patients"],
    exact: false,
    type: "active",
  });
  queryClient.refetchQueries({
    queryKey: ["patient"],
    exact: false,
    type: "active",
  });
}

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

  useEffect(() => {
    const unsubscribers = GLOBAL_REALTIME_EVENTS.map((eventName) =>
      on(eventName, refreshRealtimeCaches)
    );

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.());
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
