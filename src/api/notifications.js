// /src/api/notifications.js
import { get, post, patch } from "../api/http"; // from http.js in project
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "../api/realtime"; // from realtime.js in project

const NS = "notifications";

// ===== REST =====
export async function fetchNotifications(params = {}) {
  // server should support pagination/filter/query; fallback to static list if needed
  return get("/notifications", { params });
}

export async function markRead(id) {
  return patch(`/notifications/${id}/read`, {});
}

export async function markAllRead() {
  return post(`/notifications/mark-all-read`, {});
}

export async function fetchTodayStats() {
  return get(`/notifications/stats/today`);
}

// ===== React Query Hooks =====
export function useNotifications(options = {}) {
  const { params = {}, ...rest } = options;
  return useQuery({
    queryKey: [NS, "list", params],
    queryFn: () => fetchNotifications(params),
    staleTime: 15_000,
    ...rest,
  });
}

export function useTodayStatsQuery(options = {}) {
  return useQuery({
    queryKey: [NS, "todayStats"],
    queryFn: fetchTodayStats,
    staleTime: 15_000,
    ...options,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => markRead(id),
    onSuccess: (_res, id, ctx) => {
      // optimistic refresh: update item in cache
      qc.setQueriesData({ queryKey: [NS, "list"] }, (old) => {
        if (!old) return old;
        const data = Array.isArray(old?.data) ? old.data : old; // allow both {data: []} or []
        const mapped = (data || []).map((n) => (n.id === id ? { ...n, read: true } : n));
        return old?.data ? { ...old, data: mapped } : mapped;
      });
      qc.invalidateQueries({ queryKey: [NS, "todayStats"] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => markAllRead(),
    onSuccess: () => {
      qc.setQueriesData({ queryKey: [NS, "list"] }, (old) => {
        if (!old) return old;
        const data = Array.isArray(old?.data) ? old.data : old;
        const mapped = (data || []).map((n) => ({ ...n, read: true }));
        return old?.data ? { ...old, data: mapped } : mapped;
      });
      qc.invalidateQueries({ queryKey: [NS, "todayStats"] });
    },
  });
}

// ===== Realtime Subscribe =====
export async function subscribeNotifications(qc) {
  await ensureStarted();
  // server pushes event: "notification.new" with payload { notification }
  const offNew = on("notifications", "notification.new", (payload) => {
    const notif = payload?.notification || payload;
    // prepend to cache list
    qc.setQueriesData({ queryKey: [NS, "list"] }, (old) => {
      if (!old) return old;
      const data = Array.isArray(old?.data) ? old.data : old;
      const next = [notif, ...(data || [])];
      return old?.data ? { ...old, data: next } : next;
    });
    qc.invalidateQueries({ queryKey: [NS, "todayStats"] });
    // Bubble to UI (NotifBell peek)
    window.dispatchEvent(new CustomEvent("app:new-notification", { detail: notif }));
  });

  // server may push read-all or read-one events
  const offRead = on("notifications", "notification.read", ({ id }) => {
    qc.setQueriesData({ queryKey: [NS, "list"] }, (old) => {
      if (!old) return old;
      const data = Array.isArray(old?.data) ? old.data : old;
      const mapped = (data || []).map((n) => (n.id === id ? { ...n, read: true } : n));
      return old?.data ? { ...old, data: mapped } : mapped;
    });
    qc.invalidateQueries({ queryKey: [NS, "todayStats"] });
  });

  const offReadAll = on("notifications", "notification.readAll", () => {
    qc.setQueriesData({ queryKey: [NS, "list"] }, (old) => {
      if (!old) return old;
      const data = Array.isArray(old?.data) ? old.data : old;
      const mapped = (data || []).map((n) => ({ ...n, read: true }));
      return old?.data ? { ...old, data: mapped } : mapped;
    });
    qc.invalidateQueries({ queryKey: [NS, "todayStats"] });
  });

  return () => {
    try { offNew?.(); offRead?.(); offReadAll?.(); } catch {}
  };
}