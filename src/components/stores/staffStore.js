// src/stores/staffStore.js
import { create } from "zustand";

export const useStaffStore = create((set) => ({
  filters: { search: "", vai_tro: "all", ma_khoa: "all", trang_thai_cong_tac: "all" },
  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  modals: { detailId: null, scheduleId: null },
  openDetail: (id) => set((s) => ({ modals: { ...s.modals, detailId: id } })),
  openSchedule: (id) => set((s) => ({ modals: { ...s.modals, scheduleId: id } })),
  closeModals: () => set({ modals: { detailId: null, scheduleId: null } }),
}));
