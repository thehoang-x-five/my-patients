// src/api/analytics.js
// API & hooks cho MongoDB Aggregation Analytics
// Endpoints chuẩn theo AnalyticsController.cs

import { useQuery } from "@tanstack/react-query";
import { get } from "./http.js";
import { toLocalYmd } from "../utils/dateLocal.js";

/** ===== API CALLS ===== */

function formatDate(value) {
  if (!value) return undefined;

  if (typeof value === "string") {
    return value;
  }

  try {
    return toLocalYmd(value);
  } catch {
    return undefined;
  }
}

function resolveRangeFromPeriod(period) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let from = null;
  switch (period) {
    case "90d":
      from = new Date(today);
      from.setDate(from.getDate() - 89);
      break;
    case "30d":
      from = new Date(today);
      from.setDate(from.getDate() - 29);
      break;
    case "ytd":
      from = new Date(today.getFullYear(), 0, 1);
      break;
    case "mtd":
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    default:
      return {};
  }

  return {
    fromDate: formatDate(from),
    toDate: formatDate(today),
  };
}

function buildAnalyticsParams(params = {}) {
  const fromDate = formatDate(params.fromDate ?? params.from);
  const toDate = formatDate(params.toDate ?? params.to);
  const fallbackRange =
    !fromDate && !toDate ? resolveRangeFromPeriod(params.period) : {};

  return {
    fromDate: fromDate ?? fallbackRange.fromDate,
    toDate: toDate ?? fallbackRange.toDate,
    topN: params.topN,
  };
}

function normalizeDiseaseTrends(data = {}) {
  const source = data?.TopDiseases ?? data?.topDiseases ?? [];
  const items = Array.isArray(source)
    ? source.map((item) => ({
        name: item.DiseaseName ?? item.diseaseName ?? "Chua_xac_dinh",
        count: Number(item.Count ?? item.count ?? 0) || 0,
        percentage: Number(item.Percentage ?? item.percentage ?? 0) || 0,
        icd10Code: item.ICD10Code ?? item.icd10Code ?? "",
      }))
    : [];

  return {
    ...data,
    TopDiseases: source,
    items,
  };
}

function normalizePopularDrugs(data = {}) {
  const source = data?.TopDrugs ?? data?.topDrugs ?? [];
  const items = Array.isArray(source)
    ? source.map((item) => ({
        name: item.TenThuoc ?? item.tenThuoc ?? item.MaThuoc ?? item.maThuoc ?? "Thuoc",
        count: Number(item.PrescriptionCount ?? item.prescriptionCount ?? 0) || 0,
        totalQuantity: Number(item.TotalQuantity ?? item.totalQuantity ?? 0) || 0,
        totalRevenue: Number(item.TotalRevenue ?? item.totalRevenue ?? 0) || 0,
        maThuoc: item.MaThuoc ?? item.maThuoc ?? "",
      }))
    : [];

  return {
    ...data,
    TopDrugs: source,
    items,
  };
}

function normalizeAbnormalStats(data = {}) {
  const source = data?.ByTestType ?? data?.byTestType ?? [];
  const items = Array.isArray(source)
    ? source.map((item) => {
        const name = item.TestType ?? item.testType ?? "khong_xac_dinh";
        const count = Number(item.Count ?? item.count ?? 0) || 0;
        const details = item.Details ?? item.details ?? [];

        return {
          name,
          date: name,
          count,
          percentage: Number(item.Percentage ?? item.percentage ?? 0) || 0,
          details: Array.isArray(details) ? details : [],
        };
      })
    : [];

  return {
    ...data,
    ByTestType: source,
    items,
  };
}

// Thống kê tần suất chỉ số bất thường
// BE: GET /api/analytics/abnormal-stats?fromDate=&toDate=
export const fetchAbnormalStats = (params = {}) =>
  get("/analytics/abnormal-stats", { params: buildAnalyticsParams(params) }).then(
    normalizeAbnormalStats
  );

// Sinh hiệu bất thường theo ngày
// BE: GET /api/analytics/vital-anomalies?fromDate=&toDate=
export const fetchVitalAnomalies = (params = {}) =>
  get("/analytics/vital-anomalies", { params: buildAnalyticsParams(params) }).then(
    normalizeAbnormalStats
  );

// Xu hướng bệnh tật theo ICD-10
// BE: GET /api/analytics/disease-trends?fromDate=&toDate=&topN=10
export const fetchDiseaseTrends = (params = {}) =>
  get("/analytics/disease-trends", { params: buildAnalyticsParams(params) }).then(
    normalizeDiseaseTrends
  );

// Top thuốc tiêu thụ nhiều nhất
// BE: GET /api/analytics/popular-drugs?fromDate=&toDate=&topN=10
export const fetchPopularDrugs = (params = {}) =>
  get("/analytics/popular-drugs", { params: buildAnalyticsParams(params) }).then(
    normalizePopularDrugs
  );

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

export function useVitalAnomalies(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "vital-anomalies", params],
    queryFn: () => fetchVitalAnomalies(params),
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
