// src/api/queue.js
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

/* ========= Core REST ========= */
export const getQueue = async () => (await http.get("/queue")).data;
// alias để khớp các trang: hiện tại dùng chung /queue cho "today"
export const getQueueToday = getQueue;

export const enqueueWalkin = async (payload) =>
  (await http.post("/queue/walkin", payload)).data;

export const enqueueFromAppointment = async (payload) =>
  (await http.post("/queue/from-appointment", payload)).data;

export const enqueueService = async (payload) =>
  (await http.post("/queue/service", payload)).data;

export const enqueueReturnToDoctor = async (payload) =>
  (await http.post("/queue/return-to-doctor", payload)).data;

export const startExam = async (id) =>
  (await http.patch(`/queue/${id}/start-exam`)).data;

export const markEmergency = async ({ id, flag }) =>
  (await http.patch(`/queue/${id}/mark-emergency`, { flag })).data;

export const skipOnce = async (id) =>
  (await http.patch(`/queue/${id}/skip-once`)).data;

export const markNoShow = async (id) =>
  (await http.patch(`/queue/${id}/no-show`)).data;

export const finishAndRemove = async (id) =>
  (await http.delete(`/queue/${id}`)).data;

// alias để khớp hook ở trang
export const finishRemove = finishAndRemove;

/* ========= Hooks (Queries) ========= */
export function useQueue() {
  return useQuery({ queryKey: ["queue"], queryFn: getQueue });
}

export function useQueueToday() {
  return useQuery({ queryKey: ["queue"], queryFn: getQueueToday });
}

/* ========= Hooks (Mutations) ========= */
export function useEnqueueFromAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueFromAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useEnqueueWalkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueWalkin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useEnqueueService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useReturnToDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueReturnToDoctor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useStartExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startExam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useFinishRemove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: finishRemove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

/* ========= Realtime (SignalR) ========= */
export async function subscribeQueue(qc) {
  await ensureStarted();
  const off = on("queue.updated", () => {
    qc.invalidateQueries({ queryKey: ["queue"] });
  });
  return off;
}
