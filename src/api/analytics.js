import { useQuery } from "@tanstack/react-query";
import { get } from "./http.js";

export async function getAbnormalStats() {
  return await get("/analytics/abnormal-stats");
}

export async function getDiseaseTrends(params = {}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.append("fromDate", params.fromDate);
  if (params.toDate) query.append("toDate", params.toDate);
  if (params.top) query.append("top", params.top);
  return await get(`/analytics/disease-trends?${query.toString()}`);
}

export async function getPopularDrugs(params = {}) {
  const query = new URLSearchParams();
  if (params.fromDate) query.append("fromDate", params.fromDate);
  if (params.toDate) query.append("toDate", params.toDate);
  if (params.top) query.append("top", params.top);
  return await get(`/analytics/popular-drugs?${query.toString()}`);
}

export function useAbnormalStats(options = {}) {
  return useQuery({
    queryKey: ["analytics", "abnormal"],
    queryFn: getAbnormalStats,
    staleTime: 60_000,
    ...options,
  });
}

export function useDiseaseTrends(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "disease-trends", params],
    queryFn: () => getDiseaseTrends(params),
    staleTime: 60_000,
    ...options,
  });
}

export function usePopularDrugs(params = {}, options = {}) {
  return useQuery({
    queryKey: ["analytics", "popular-drugs", params],
    queryFn: () => getPopularDrugs(params),
    staleTime: 60_000,
    ...options,
  });
}
