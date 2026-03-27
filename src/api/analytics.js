// src/api/analytics.js
// API & hooks cho MongoDB Aggregation Analytics (Dev 1 cung cấp endpoints)
// Các endpoint dưới đây là stub — sẽ hoạt động khi Dev 1 hoàn thành BE.

import { useQuery } from "@tanstack/react-query";
import { get } from "./http.js";

/** ===== API CALLS ===== */

// Top bệnh lý phổ biến (ICD10 codes, từ medical_histories collection)
export const fetchTopDiseases = (params = {}) =>
  get("/analytics/top-diseases", { params });

// Top thuốc được kê nhiều nhất
export const fetchTopDrugs = (params = {}) =>
  get("/analytics/top-drugs", { params });

// Tần suất sinh hiệu bất thường
export const fetchVitalAnomalies = (params = {}) =>
  get("/analytics/vital-anomalies", { params });

// Thống kê tổng quát (overview cho analytics tab)
export const fetchAnalyticsOverview = (params = {}) =>
  get("/analytics/overview", { params });

/** ===== HOOKS ===== */

export function useTopDiseases(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "top-diseases", params],
    queryFn: () => fetchTopDiseases(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function useTopDrugs(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "top-drugs", params],
    queryFn: () => fetchTopDrugs(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function useVitalAnomalies(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "vital-anomalies", params],
    queryFn: () => fetchVitalAnomalies(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function useAnalyticsOverview(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "overview", params],
    queryFn: () => fetchAnalyticsOverview(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}
