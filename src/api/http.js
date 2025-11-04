// src/api/http.js
import axios from "axios";

/** Axios singleton */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "/api",
  withCredentials: true,
  timeout: 20000,
});

// Attach bearer token if present
http.interceptors.request.use((cfg) => {
  try {
    const token = localStorage.getItem("access_token");
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return cfg;
});

// Normalize errors + emit unauthorized
http.interceptors.response.use(
  (res) => res,
  (err) => {
    const { response } = err || {};
    if (response?.status === 401) {
      // notify app shell to logout
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    const message =
      response?.data?.error?.message ||
      response?.data?.message ||
      err.message ||
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
export const del = (url, config) => http.delete(url, config).then((r) => r.data);

export default http;
