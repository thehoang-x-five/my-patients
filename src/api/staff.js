// src/api/staff.js
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

/* ===================== Core REST ===================== */
// GET /staff?role=&q=&status=&nurseKind=&page=&pageSize=
export const listStaff = async (params = {}) => {
  const { data } = await http.get("/staff", { params });
  // Expect server to return { items: [], total: n }
  return data;
};

// GET /staff/:id
export const getStaff = async (id) => (await http.get(`/staff/${id}`)).data;

// GET /staff/:id/schedule   -> { Mon: "...", Tue: "...", ... }
export const getStaffSchedule = async (id) =>
  (await http.get(`/staff/${id}/schedule`)).data;

// GET /staff/:id/duty-room?date=YYYY-MM-DD -> { today: "R305", week: { Mon: "...", ... } }
export const getDutyRoom = async (id, date) =>
  (await http.get(`/staff/${id}/duty-room`, { params: { date } })).data;

// GET /staff/stats -> { online, idle, depts }
export const getStaffStats = async (params = {}) =>
  (await http.get("/staff/stats", { params })).data;

// PATCH /staff/:id/status  body: { status: "online" | "offline" }
export const updateStaffStatus = async ({ id, status }) =>
  (await http.patch(`/staff/${id}/status`, { status })).data;

/* ===================== React Query Hooks ===================== */
export function useStaff(params) {
  // params: { role, q, status, nurseKind, page, pageSize }
  return useQuery({
    queryKey: ["staff", params],
    queryFn: () => listStaff(params),
    keepPreviousData: true,
  });
}

export function useStaffStats(params) {
  return useQuery({
    queryKey: ["staff-stats", params],
    queryFn: () => getStaffStats(params),
    staleTime: 15_000,
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

/* ===================== Realtime (SignalR) ===================== */
// Server nên phát các event: "staff.updated", "staff.status.changed", "staff.schedule.updated"
export async function subscribeStaff(qc) {
  await ensureStarted();
  const offs = [];
  offs.push(
    on("staff.updated", () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      qc.invalidateQueries({ queryKey: ["staff-stats"] });
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
