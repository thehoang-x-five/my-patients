// [AUTH FLOW FIX - 2025-11-22]
// - Đồng bộ storage token: ưu tiên localStorage["his-auth"].accessToken, fallback "access_token" (legacy).
// - Gắn Authorization header từ helper getStoredAccessToken() cho mọi request.
// - Interceptor response: emit sự kiện "auth:unauthorized" cho 401 nhưng bỏ qua 401 của /auth/refresh.

// src/api/http.js
import axios from "axios";
const AUTH_STORAGE_KEY = "his-auth";

// Lấy accessToken từ localStorage (chuẩn + legacy)
export function getStoredAccessToken() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.accessToken) return parsed.accessToken;
    }
  } catch {
    // ignore
  }

  try {
    const legacy = window.localStorage.getItem("access_token");
    if (legacy) return legacy;
  } catch {
    // ignore
  }

  return null;
}

/** Axios singleton */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: true,
  timeout: 20000,
});

// Attach bearer token if present
http.interceptors.request.use((cfg) => {
  try {
    const token = getStoredAccessToken();
    if (token) {
      cfg.headers = cfg.headers || {};
      cfg.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // ignore
  }
  return cfg;
});

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const { response } = err || {};
    if (response?.status === 401) {
      const url = response?.config?.url || "";
      const isRefreshCall =
        typeof url === "string" && url.includes("/auth/refresh");

      // notify app shell để xử lý 401, bỏ qua 401 của /auth/refresh
      if (!isRefreshCall && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
      
    }

    if (!response) {
      return Promise.reject(err);
    }

    const message =
      response?.data?.message ||
      response?.data?.error ||
      response?.data?.errorMessage ||
      response?.data?.title ||
      response?.statusText ||
      "Network error";
    return Promise.reject(new Error(message));
  }
);

// Small helpers (return .data)
export const get = (url, config) => http.get(url, config).then((r) => r.data);
export const post = (url, data, config) =>
  http.post(url, data, config).then((r) => r.data);
export const patch = (url, data, config) =>
  http.patch(url, data, config).then((r) => r.data);
export const put =(url, data, config) =>
  http.put(url, data, config).then((r) => r.data);
export const del = (url, config) =>
  http.delete(url, config).then((r) => r.data);

export default http;
