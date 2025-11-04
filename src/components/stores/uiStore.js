// src/stores/uiStore.js
import { create } from "zustand";

export const useUIStore = create((set) => ({
  highlightPid: null,
  flashAddAt: 0,
  setHighlightPid: (pid) => set({ highlightPid: pid }),
  clearHighlight: () => set({ highlightPid: null }),
  flashAdd: () => set({ flashAddAt: Date.now() }),
  ackFlashAdd: () => set({ flashAddAt: 0 }),
  highlightRoomId: null,
  setHighlightRoomId: (roomId) => set({ highlightRoomId: roomId }),
  clearHighlightRoom: () => set({ highlightRoomId: null }),
}));
