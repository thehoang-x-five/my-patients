// src/components/stores/prescriptionStore.js
import { create } from "zustand";

/**
 * UI store riêng cho trang Đơn thuốc / Nhà thuốc
 * Dùng để share state giữa Prescriptions.jsx + PrescToolbar + các modal.
 */
export const usePrescStore = create((set) => ({
  tab: "orders", // "orders" | "stock"

  qOrders: "",
  qStock: "",
  unit: "ALL",
  nearOnly: false,

  view: { open: false, order: null },
  edit: { open: false, item: null },

  setTab: (tab) => set({ tab }),
  setQOrders: (qOrders) => set({ qOrders }),
  setQStock: (qStock) => set({ qStock }),
  setUnit: (unit) => set({ unit }),
  setNearOnly: (nearOnly) => set({ nearOnly }),

  setView: (view) => set({ view }),
  setEdit: (edit) => set({ edit }),
}));
