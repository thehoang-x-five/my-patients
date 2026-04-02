// src/api/analytics.js
// API & hooks cho MongoDB Aggregation Analytics
// Endpoints chuẩn theo AnalyticsController.cs

import { useQuery } from "@tanstack/react-query";
import { get } from "./http.js";

/** ===== API CALLS ===== */

// Thống kê tần suất chỉ số bất thường
// BE: GET /api/analytics/abnormal-stats?fromDate=&toDate=
export const fetchAbnormalStats = (params = {}) =>
  get("/analytics/abnormal-stats", { params });

// Xu hướng bệnh tật theo ICD-10
// BE: GET /api/analytics/disease-trends?fromDate=&toDate=&topN=10
export const fetchDiseaseTrends = (params = {}) =>
  get("/analytics/disease-trends", { params });

// Top thuốc tiêu thụ nhiều nhất
// BE: GET /api/analytics/popular-drugs?fromDate=&toDate=&topN=10
export const fetchPopularDrugs = (params = {}) =>
  get("/analytics/popular-drugs", { params });

/** ===== HOOKS ===== */

export function useAbnormalStats(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "abnormal-stats", params],
    queryFn: () => fetchAbnormalStats(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function useDiseaseTrends(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "disease-trends", params],
    queryFn: () => fetchDiseaseTrends(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

export function usePopularDrugs(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "popular-drugs", params],
    queryFn: () => fetchPopularDrugs(params),
    staleTime: 5 * 60_000,
    retry: 1,
    ...options,
  });
}

/** ===== BACKWARD-COMPATIBLE ALIASES ===== */
// ClinicalAnalytics.jsx imports these old names — map to correct new hooks

export const useTopDiseases = useDiseaseTrends;
export const useTopDrugs = usePopularDrugs;
export const useVitalAnomalies = useAbnormalStats;

