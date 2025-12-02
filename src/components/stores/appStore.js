// src/components/stores/appStore.js
// Global stores gom tất cả Zustand store về 1 file:
// - useAuthStore      (đăng nhập, token)
// - useUiStore        (theme, lang, highlight BN/phòng, prefill, Patients prefs)
// - useExamStore      (trang Khám)
// - useHistoryStore   (trang Lịch sử)
// - useNotificationsStore (bell thông báo)
// - usePrescStore     (Đơn thuốc / Kho thuốc)
// - useStaffStore     (Nhân sự)
// - useDepartmentHighlightStore (highlight phòng Khoa/Phòng)
//
// Lưu ý:
// - Đường dẫn import thay vì "./components/stores/authStore.js" -> "./components/stores/appStore.js"
// - Tên hook giữ nguyên: useAuthStore, useUIStore, usePrescStore, useStaffStore, useNotificationsStore,...

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { loginApi, refreshApi, logoutApi } from "../../api/auth.js";
import {
  http
} from "../../api/http.js";
import { queryClient } from "../lib/queryClient.js";
import { stop as stopRealtime } from "../../api/realtime.js";

/* =========================================================
 * 1. AUTH STORE
 * =======================================================*/
// [AUTH FLOW FIX - 2025-11-22]
// - Chuẩn hóa lưu/trả token qua localStorage["his-auth"] (user, accessToken, accessTokenExpiresAt).
// - Thêm cờ bootstrapped để App.jsx chờ bootstrap xong mới redirect -> tránh flash.
// - Thêm cờ refreshing + handleUnauthorized() để xử lý event "auth:unauthorized":
//   + Thử refresh access token.
//   + Nếu refresh fail hoặc token trống -> logout().
// - Giữ nguyên API public: useAuthStore.bootstrap/login/refresh/logout, chỉ bổ sung handleUnauthorized.

const AUTH_STORAGE_KEY = "his-auth";

function loadStoredAuth() {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null, accessTokenExpiresAt: null ,refreshToken: null,
            refreshTokenExpiresAt: null,};
  }

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return { user: null, accessToken: null, accessTokenExpiresAt: null ,refreshToken: null,
              refreshTokenExpiresAt: null,};
    }
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user || null,
      accessToken: parsed.accessToken || null,
      accessTokenExpiresAt: parsed.accessTokenExpiresAt || null,
      refreshToken: parsed.refreshToken || null,
            refreshTokenExpiresAt: parsed.refreshTokenExpiresAt || null,
    };
  } catch {
    return { user: null, accessToken: null, accessTokenExpiresAt: null ,refreshToken: null,
            refreshTokenExpiresAt: null,};
  }
}

function saveStoredAuth(auth) {
  if (typeof window === "undefined") return;

  try {
    if (!auth || !auth.accessToken) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        user: auth.user || null,
        accessToken: auth.accessToken,
        accessTokenExpiresAt: auth.accessTokenExpiresAt || null,
        refreshToken: auth.refreshToken || null,
        refreshTokenExpiresAt: auth.refreshTokenExpiresAt || null,
      })
    );
  } catch {
    // ignore
  }
}

function applyHttpAuth(accessToken) {
  if (!http || !http.defaults) return;
  if (accessToken) {
    http.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
  } else {
    delete http.defaults.headers.common.Authorization;
  }
}

export const useAuthStore = create((set, get) => ({
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshToken: null,
   refreshTokenExpiresAt: null,
  bootstrapped: false,

  loading: false,
  error: null,
  refreshing: false,

  /** Bootstrap: đọc token từ localStorage + gắn header axios */
  bootstrap() {
    if (get().bootstrapped) return;
    const stored = loadStoredAuth();
     // Kiểm tra token đã hết hạn chưa (nếu có accessTokenExpiresAt)
    let isExpired = false;
    if (stored.accessToken && stored.accessTokenExpiresAt) {
      const expMs = new Date(stored.accessTokenExpiresAt).getTime();
      if (!Number.isNaN(expMs) && expMs <= Date.now()) {
        isExpired = true;
      }
    }

    if (isExpired) {
      // Token hết hạn: clear khỏi http  storage  state
      applyHttpAuth(null);
      saveStoredAuth(null);
      set({
        user: null,
        accessToken: null,
        accessTokenExpiresAt: null,
        refreshToken: null,
        refreshTokenExpiresAt: null,
        bootstrapped: true,
        loading: false,
        error: null,
        refreshing: false,
      });
      return;
    }

    // Token còn hạn hoặc không có thông tin hết hạn -> giữ nguyên
    applyHttpAuth(stored.accessToken);
    set({
      user: stored.user || null,
      accessToken: stored.accessToken || null,
      accessTokenExpiresAt: stored.accessTokenExpiresAt || null,
      refreshToken: stored.refreshToken || null,
      refreshTokenExpiresAt: stored.refreshTokenExpiresAt || null,
      bootstrapped: true,
    });
  },

  /** Đăng nhập */
  async login({ username, password }) {
    set({ loading: true, error: null });

    try {
      const result = await loginApi({ username, password });

      const authState = {
        user: result.user || result.staff || null,
        accessToken: result.accessToken,
        accessTokenExpiresAt: result.accessTokenExpiresAt || null,
        refreshToken: result.refreshToken || null,
               refreshTokenExpiresAt: result.refreshTokenExpiresAt || null,
      };

      applyHttpAuth(authState.accessToken);
      saveStoredAuth(authState);
      set({
                  user: authState.user || null,
                  accessToken: authState.accessToken || null,
                  accessTokenExpiresAt: authState.accessTokenExpiresAt || null,
                  refreshToken: authState.refreshToken || null,
        refreshTokenExpiresAt: authState.refreshTokenExpiresAt || null,
                  bootstrapped: true,
                  loading: false,
                  error: null,
                });
      

      return result;
    } catch (err) {
      // do interceptor trả về Error(message)
      const msg =
        err?.message || "Đăng nhập thất bại. Vui lòng thử lại.";
  
      set({ loading: false, error: msg });
      throw err; // để React Query onError bắt được
    }
  
  },

  /** Refresh access token */
  async refresh() {
    try {
      const result = await refreshApi();
      if (!result?.accessToken) return;

      const current = get();

      const authState = {
        user: current.user,
        accessToken: result.accessToken,
        accessTokenExpiresAt:
          result.accessTokenExpiresAt || current.accessTokenExpiresAt,
          refreshToken: result.refreshToken || current.refreshToken || null,
       refreshTokenExpiresAt: result.refreshTokenExpiresAt || current.refreshTokenExpiresAt || null,
      };

      applyHttpAuth(authState.accessToken);
      saveStoredAuth(authState);
      set(authState);
    } catch {
      // nếu lỗi refresh, lần sau call API sẽ 401 -> xử lý logout global
    }
  },
 
  /** Xử lý khi nhận 401 từ http (auth:unauthorized) */
  async handleUnauthorized() {
    const { bootstrapped, accessToken, refreshing } = get();

    // chưa bootstrap xong hoặc đã không có token thì bỏ qua
    if (!bootstrapped || !accessToken) return;
    if (refreshing) return;

    set({ refreshing: true });

    try {
      await get().refresh();
      const { accessToken: newToken } = get();
      if (!newToken) {
        await get().logout();
      }
    } catch {
      await get().logout();
    } finally {
      set({ refreshing: false });
    }
  },

  /** Logout: clear local + thông báo BE */
  async logout() {
    const { refreshToken } = get();

    try {
      await logoutApi(refreshToken);
    } catch {
      // ignore
    }

    applyHttpAuth(null);
    saveStoredAuth(null);

    // Clear cache query + đóng realtime
    try {
      queryClient.clear();
    } catch {
      // ignore
    }
    try {
      await stopRealtime();
    } catch {
      // ignore
    }

    set({
      user: null,
      accessToken: null,
      accessTokenExpiresAt: null,
      refreshToken: null,
      refreshTokenExpiresAt: null,
      loading: false,
      error: null,
      bootstrapped: true,
      refreshing: false,
    });
  },
}));
/* =========================================================
 * 2. UI STORE (GLOBAL UI + PATIENTS/APPOINTMENTS UX)
 * =======================================================*/

const createUiSlice = (set, get) => ({
  // ----- Global UI prefs -----
  theme: "light",          // "light" | "dark"
  lang: "vi",              // "vi" | "en"
  density: "comfortable",  // "comfortable" | "compact"
  accent: "sky",           // "sky" | "emerald" | "violet" | "amber" | "fuchsia"
  showTips: true,

  setTheme: (theme) => set({ theme }),
  setLang: (lang) => set({ lang }),
  setDensity: (density) => set({ density }),
  setAccent: (accent) => set({ accent }),
  setShowTips: (showTips) => set({ showTips }),

  resetUiPrefs: () =>
    set({
      theme: "light",
      lang: "vi",
      density: "comfortable",
      accent: "sky",
      showTips: true,
    }),

  // ----- Common highlights -----
  highlightPid: null,
  setHighlightPid: (pid) => set({ highlightPid: pid }),
  clearHighlight: () => set({ highlightPid: null }),

  flashAddAt: 0,
  flashAdd: () => set({ flashAddAt: Date.now() }),
  ackFlashAdd: () => set({ flashAddAt: 0 }),

  // highlight phòng (Khoa/Phòng)
  highlightRoomId: null,
  setHighlightRoomId: (roomId) => set({ highlightRoomId: roomId }),
  clearHighlightRoom: () => set({ highlightRoomId: null }),

  // ----- Prefill & UX cho trang Lịch hẹn -----
  // { patient_name, patient_code, note, type, dept, doctor, date, time }
  apptPrefill: null,
  setApptPrefill: (payload) => set({ apptPrefill: payload }),
  clearApptPrefill: () => set({ apptPrefill: null }),

  // timestamp để highlight nút “+ Tạo lịch hẹn”
  flashApptCreateAt: 0,
  flashApptCreate: () => set({ flashApptCreateAt: Date.now() }),
  ackFlashApptCreate: () => set({ flashApptCreateAt: 0 }),

  // ----- Prefill khi check-in để quay lại Patients (BN chưa có trong DS) -----
  // Dùng để auto-fill thông tin khi mở modal “+ Thêm” ở trang Patients
  // Cấu trúc: { name?, code?, latestAppointment? }
  patientPrefill: null,
  setPatientPrefill: (payload) => set({ patientPrefill: payload }),
  clearPatientPrefill: () => set({ patientPrefill: null }),


  // ----- Patients page prefs -----
  patientsViewMode: "today", // "today" | "all"
  setPatientsViewMode: (mode) => set({ patientsViewMode: mode }),

  patientsPage: 1,
  setPatientsPage: (page) => set({ patientsPage: page }),

  patientsPageSize: 50,
  setPatientsPageSize: (size) =>
    set({ patientsPageSize: size, patientsPage: 1 }),

  patientsSort: "priority", // "priority" | "name" | "date"
  setPatientsSort: (sort) => set({ patientsSort: sort }),
});

export const useUiStore = create(
  persist(createUiSlice, {
    name: "his-ui",
    partialize: (state) => ({
      theme: state.theme,
      lang: state.lang,
      density: state.density,
      accent: state.accent,
      showTips: state.showTips,
    }),
  })
);

// Alias để code cũ dùng useUIStore vẫn chạy
export const useUIStore = useUiStore;

/* =========================================================
 * 3. EXAM STORE (KHÁM)
 * =======================================================*/

export const useExamStore = create((set, get) => ({
  q: "",
  setQ: (q) => set({ q }),

  active: null, // current patient object in ExamDetail
  setActive: (p) => set({ active: p }),

  inProgress: new Set(), // keys in queue being examined
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

/* =========================================================
 * 4. HISTORY STORE (LỊCH SỬ)
 * =======================================================*/

const defaultHistoryRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 7);
  return { start, end };
};

export const useHistoryStore = create((set) => ({
  range: defaultHistoryRange(),
  filters: { keyword: "", doctorId: null, deptId: null, status: "all" },
  pagination: { pageIndex: 0, pageSize: 20 },
  selected: null,

  setRange: (range) => set({ range }),
  setFilters: (patch) =>
    set((s) => ({
      filters: { ...s.filters, ...patch },
      pagination: { ...s.pagination, pageIndex: 0 },
    })),
  setPagination: (pagination) => set({ pagination }),
  setSelected: (selected) => set({ selected }),
}));

/* =========================================================
 * 5. NOTIFICATIONS STORE (BELL DROPDOWN)
 * =======================================================*/

export const useNotificationsStore = create((set, get) => ({
  dropdownOpen: false,
  setDropdownOpen: (v) => set({ dropdownOpen: !!v }),

  // lightweight peek queue for the bell toast/peek
  peekItem: null,
  setPeek: (item) => set({ peekItem: item }),
  clearPeek: () => set({ peekItem: null }),
}));

/* =========================================================
 * 6. PRESCRIPTIONS / PHARMACY STORE
 * =======================================================*/

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

/* =========================================================
 * 7. STAFF STORE
 * =======================================================*/

export const useStaffStore = create((set) => ({
  filters: {
    search: "",
    vai_tro: "all",
    ma_khoa: "all",
    trang_thai_cong_tac: "all",
  },
  setFilters: (patch) =>
    set((s) => ({ filters: { ...s.filters, ...patch } })),

  modals: { detailId: null, scheduleId: null },
  openDetail: (id) =>
    set((s) => ({ modals: { ...s.modals, detailId: id } })),
  openSchedule: (id) =>
    set((s) => ({ modals: { ...s.modals, scheduleId: id } })),
  closeModals: () =>
    set({ modals: { detailId: null, scheduleId: null } }),
}));

/* =========================================================
 * 8. DEPARTMENT HIGHLIGHT STORE
 * =======================================================*/

export const useDepartmentHighlightStore = create((set) => ({
  highlightRoom: null, // ví dụ: "R305"
  flashAt: 0, // timestamp để trigger CSS pulse
  setHighlightRoom: (room) =>
    set({ highlightRoom: room, flashAt: Date.now() }),
  clearHighlight: () => set({ highlightRoom: null }),
}));
