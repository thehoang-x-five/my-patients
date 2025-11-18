// src/api/queue.js
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";
import { mockEnabled, mockQueueApi } from "./mockData";

/* ========= Helpers: chọn nguồn thật / mock ========= */

function useQueueImpl() {
  return {
    async getQueueToday() {
      if (mockEnabled) return mockQueueApi.listQueueToday();
      return (await http.get("/queue")).data;
    },

    async enqueueWalkin(payload) {
      if (mockEnabled) return mockQueueApi.enqueueWalkin(payload);
      return (await http.post("/queue/walkin", payload)).data;
    },

    async enqueueFromAppointment(payload) {
      if (mockEnabled) return mockQueueApi.enqueueFromAppointment(payload);
      return (await http.post("/queue/from-appointment", payload)).data;
    },

    async enqueueService(payload) {
      if (mockEnabled) return mockQueueApi.enqueueService(payload);
      return (await http.post("/queue/service", payload)).data;
    },

    async enqueueReturnToDoctor(payload) {
      if (mockEnabled) return mockQueueApi.enqueueReturnToDoctor(payload);
      return (await http.post("/queue/return-to-doctor", payload)).data;
    },

    async startExam(id) {
      if (mockEnabled) return mockQueueApi.startExam(id);
      return (await http.patch(`/queue/${id}/start-exam`)).data;
    },

    async markEmergency({ id, flag }) {
      if (mockEnabled) return mockQueueApi.markEmergency({ id, flag });
      return (await http.patch(`/queue/${id}/mark-emergency`, { flag })).data;
    },

    async skipOnce(id) {
      if (mockEnabled) return mockQueueApi.skipOnce(id);
      return (await http.patch(`/queue/${id}/skip-once`)).data;
    },

    async markNoShow(id) {
      if (mockEnabled) return mockQueueApi.markNoShow(id);
      return (await http.patch(`/queue/${id}/no-show`)).data;
    },

    async finishAndRemove(id) {
      if (mockEnabled) return mockQueueApi.finishAndRemove(id);
      return (await http.delete(`/queue/${id}`)).data;
    },
  };
}

const impl = useQueueImpl();

/* ========= Core REST ========= */

// alias để khớp các trang: hiện tại dùng chung /queue cho "today"
export const getQueue = () => impl.getQueueToday();
export const getQueueToday = getQueue;

export const enqueueWalkin = (payload) => impl.enqueueWalkin(payload);
export const enqueueFromAppointment = (payload) => impl.enqueueFromAppointment(payload);
export const enqueueService = (payload) => impl.enqueueService(payload);
export const enqueueReturnToDoctor = (payload) => impl.enqueueReturnToDoctor(payload);

export const startExam = (id) => impl.startExam(id);
export const markEmergency = (args) => impl.markEmergency(args);
export const skipOnce = (id) => impl.skipOnce(id);
export const markNoShow = (id) => impl.markNoShow(id);
export const finishAndRemove = (id) => impl.finishAndRemove(id);

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
