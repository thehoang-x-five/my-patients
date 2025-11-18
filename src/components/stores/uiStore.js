import { create } from "zustand";

export const useUIStore = create((set) => ({
  // ===== Common highlights =====
  highlightPid: null,
  setHighlightPid: (pid) => set({ highlightPid: pid }),
  clearHighlight: () => set({ highlightPid: null }),

  flashAddAt: 0,
  flashAdd: () => set({ flashAddAt: Date.now() }),
  ackFlashAdd: () => set({ flashAddAt: 0 }),

  highlightRoomId: null,
  setHighlightRoomId: (roomId) => set({ highlightRoomId: roomId }),
  clearHighlightRoom: () => set({ highlightRoomId: null }),

  /** ===== Prefill & UX cho trang Lịch hẹn ===== */
  apptPrefill: null, // { patient_name, patient_code, note, type, dept, doctor, date, time }
  setApptPrefill: (payload) => set({ apptPrefill: payload }),
  clearApptPrefill: () => set({ apptPrefill: null }),

  flashApptCreateAt: 0, // timestamp để highlight nút “+ Tạo lịch hẹn”
  flashApptCreate: () => set({ flashApptCreateAt: Date.now() }),
  ackFlashApptCreate: () => set({ flashApptCreateAt: 0 }),

  /** ===== Prefill khi check-in để quay lại Patients (case BN CHƯA có trong DS) ===== */
  // Chỉ dùng để auto-fill tên khi mở modal “+ Thêm” ở trang Patients
  patientPrefill: null, // { name }
  setPatientPrefill: (payload) => set({ patientPrefill: payload }),
  clearPatientPrefill: () => set({ patientPrefill: null }),
  


  /** ===== Patients page prefs ===== */
  patientsViewMode: "today",                // "today" | "all"
  setPatientsViewMode: (mode) => set({ patientsViewMode: mode }),

  patientsPage: 1,
  setPatientsPage: (page) => set({ patientsPage: page }),

  patientsPageSize: 50,
  setPatientsPageSize: (size) => set({ patientsPageSize: size, patientsPage: 1 }),

  patientsSort: "priority",                 // "priority" | "name" | "date"
  setPatientsSort: (sort) => set({ patientsSort: sort }),
}));
