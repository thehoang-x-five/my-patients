// src/stores/departmentHighlight.js
import { create } from "zustand";

export const useDepartmentHighlightStore = create((set) => ({
  highlightRoom: null,      // ví dụ: "R305"
  flashAt: 0,               // timestamp để trigger CSS pulse
  setHighlightRoom: (room) => set({ highlightRoom: room, flashAt: Date.now() }),
  clearHighlight: () => set({ highlightRoom: null }),
}));
