// src/store/examStore.js
import { create } from "zustand";

export const useExamStore = create((set, get) => ({
  q: "",
  setQ: (q) => set({ q }),

  active: null,             // current patient object in ExamDetail
  setActive: (p) => set({ active: p }),

  inProgress: new Set(),    // keys in queue being examined
  start: (key) => {
    const s = new Set(get().inProgress);
    s.add(key);
    set({ inProgress: s });
  },
  finish: (key) => {
    const s = new Set(get().inProgress);
    s.delete(key);
    set({ inProgress: s });
  },
  reset: () => set({ q: "", active: null, inProgress: new Set() }),
}));
