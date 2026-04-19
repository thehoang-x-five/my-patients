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

const configuredBaseUrl = import.meta.env.VITE_API_BASE || "/api";

/** Axios singleton */
export const http = axios.create({
  baseURL: configuredBaseUrl,
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

    // Try to extract a useful error message from common BE shapes.
    let message = "Network error";
    try {
      const data = response.data;
      if (data != null) {
        if (typeof data === "string") {
          const t = data.trim();
          if (t) message = t;
        } else if (typeof data === "object") {
          // Common .NET shapes: message/Message, title, detail, errors
          if (data.message) message = data.message;
          else if (data.Message) message = data.Message;
          else if (data.error) message = data.error;
          else if (data.errorMessage) message = data.errorMessage;
          else if (data.title) message = data.title;
          else if (data.detail) message = data.detail;
          else if (data.errors) {
            // errors can be an object or array
            try {
              if (Array.isArray(data.errors)) message = data.errors.join("; ");
              else message = Object.values(data.errors).flat().join("; ");
            } catch (e) {
              // fallback
            }
          }
        }
      }
    } catch (e) {
      // ignore extraction errors
    }

    if (!message || message === "") message = response.statusText || `HTTP ${response.status}`;
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
