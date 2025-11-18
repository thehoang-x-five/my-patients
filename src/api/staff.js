// src/api/staff.js
import { http } from "./http.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime.js";
import { mockEnabled, mockStaffApi } from "./mockData.js";

/* ============ Core REST ============ */
// GET /staff?role=&q=&status=&nurseKind=&dept=
export const listStaff = async (params = {}) =>
  mockEnabled
    ? mockStaffApi.list(params)
    : (await http.get("/staff", { params })).data;

// GET /staff/:id
export const getStaff = async (id) =>
  mockEnabled ? mockStaffApi.get(id) : (await http.get(`/staff/${id}`)).data;

// GET /staff/:id/schedule -> { Mon: "08:00-16:00", ... }
export const getStaffSchedule = async (id) =>
  mockEnabled
    ? mockStaffApi.schedule(id)
    : (await http.get(`/staff/${id}/schedule`)).data;

// GET /staff/:id/duty-room?date=YYYY-MM-DD -> { today, week }
export const getDutyRoom = async (id, date) =>
  mockEnabled
    ? mockStaffApi.dutyRoom(id, date)
    : (await http.get(`/staff/${id}/duty-room`, { params: { date } })).data;

// GET /staff/stats -> { online, idle, depts }
export const getStaffStats = async (params = {}) =>
  mockEnabled
    ? mockStaffApi.stats(params)
    : (await http.get("/staff/stats", { params })).data;

// PATCH /staff/:id/status  body: { id, status: "online" | "offline" }
export const updateStaffStatus = async ({ id, status }) =>
  mockEnabled
    ? mockStaffApi.updateStatus({ id, status })
    : (await http.patch(`/staff/${id}/status`, { status })).data;

/* ============ React Query Hooks ============ */
export function useStaff(params) {
  // params: { role, q, status, nurseKind, dept }
  return useQuery({
    queryKey: ["staff", params],
    queryFn: () => listStaff(params),
    staleTime: 10_000,
  });
}

export function useStaffDetail(id) {
  return useQuery({
    queryKey: ["staff-detail", id],
    queryFn: () => getStaff(id),
    enabled: !!id,
  });
}

export function useStaffSchedule(id) {
  return useQuery({
    queryKey: ["staff-schedule", id],
    queryFn: () => getStaffSchedule(id),
    enabled: !!id,
  });
}

export function useDutyRoom(id, dateISO) {
  return useQuery({
    queryKey: ["staff-duty-room", id, dateISO],
    queryFn: () => getDutyRoom(id, dateISO),
    enabled: !!id,
  });
}

export function useStaffStats(params = {}) {
  return useQuery({
    queryKey: ["staff-stats", params],
    queryFn: () => getStaffStats(params),
    staleTime: 10_000,
  });
}

export function useUpdateStaffStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateStaffStatus,
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      if (vars?.id) {
        qc.invalidateQueries({ queryKey: ["staff-detail", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-schedule", vars.id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", vars.id] });
      }
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
    },
  });
}

/* ============ Realtime (SignalR) ============ */
// server needs to broadcast: "staff.updated", "staff.status.changed", "staff.schedule.updated"
export async function subscribeStaff(qc) {
  await ensureStarted();
  const offs = [];
  offs.push(
    on("staff.updated", ({ id }) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      if (id) qc.invalidateQueries({ queryKey: ["staff-detail", id] });
    })
  );
  offs.push(
    on("staff.status.changed", ({ id }) => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      if (id) qc.invalidateQueries({ queryKey: ["staff-detail", id] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
    })
  );
  offs.push(
    on("staff.schedule.updated", ({ id }) => {
      if (id) {
        qc.invalidateQueries({ queryKey: ["staff-schedule", id] });
        qc.invalidateQueries({ queryKey: ["staff-duty-room", id] });
      }
    })
  );
  return () => offs.forEach((off) => off && off());
}
