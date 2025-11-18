// /src/components/stores/notificationsStore.js
import {create} from "zustand";

export const useNotificationsStore = create((set, get) => ({
  dropdownOpen: false,
  setDropdownOpen: (v) => set({ dropdownOpen: !!v }),

  // lightweight peek queue for the bell toast/peek
  peekItem: null,
  setPeek: (item) => set({ peekItem: item }),
  clearPeek: () => set({ peekItem: null }),
}));