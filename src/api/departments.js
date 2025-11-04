import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

/* ========= Core REST ========= */
export const listDepartments = async (params) =>
  (await http.get("/departments", { params })).data;

export const getDepartment = async (id) =>
  (await http.get(`/departments/${id}`)).data;

export const updateDepartment = async ({ id, patch }) =>
  (await http.patch(`/departments/${id}`, patch)).data;

export const toggleRoomStatus = async ({ id, status }) =>
  (await http.patch(`/departments/${id}/toggle-room`, { status })).data;

export const getDutyByRoom = async (id) =>
  (await http.get(`/departments/${id}/duty`)).data; // { Mon:{doc,nurse}, ... }

/* ========= Hooks (Queries) ========= */
export function useDepartments(params) {
  return useQuery({
    queryKey: ["departments", params],
    queryFn: () => listDepartments(params),
  });
}

export function useDepartment(id) {
  return useQuery({
    queryKey: ["department", id],
    queryFn: () => getDepartment(id),
    enabled: !!id,
  });
}

export function useDutyByRoom(id, options = {}) {
  return useQuery({
    queryKey: ["duty", id],
    queryFn: () => getDutyByRoom(id),
    enabled: !!id && (options.enabled ?? true),
  });
}

/* ========= Hooks (Mutations) ========= */
export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      if (res?.id) qc.invalidateQueries({ queryKey: ["department", res.id] });
    },
  });
}

export function useToggleRoomStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: toggleRoomStatus,
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      if (res?.id) qc.invalidateQueries({ queryKey: ["department", res.id] });
    },
  });
}

/* ========= Realtime (SignalR) ========= */
export async function subscribeDepartments(qc) {
  await ensureStarted();
  const off = on("departments.updated", () => {
    qc.invalidateQueries({ queryKey: ["departments"] });
  });
  return off;
}
