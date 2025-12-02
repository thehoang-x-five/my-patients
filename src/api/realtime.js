// [AUTH FLOW FIX - 2025-11-22]
// - Đồng bộ token SignalR với http: dùng getStoredAccessToken() (his-auth/access_token).
// - Không thay đổi cấu trúc createConnection/ensureStarted/on/off/invoke, chỉ sửa accessTokenFactory.

// src/api/realtime.js

import * as signalR from "@microsoft/signalr";
import http, { getStoredAccessToken } from "./http.js";

// Xác định base cho SignalR:
// 1. Ưu tiên VITE_SIGNALR_BASE (nếu muốn cấu hình riêng).
// 2. Nếu không có, lấy http.defaults.baseURL (thường là "https://localhost:7146/api")
//    rồi bỏ đuôi "/api" để được "https://localhost:7146".
// 3. Fallback cuối: window.location.origin (trường hợp tất cả đều relative).

let base =
  (import.meta?.env?.VITE_SIGNALR_BASE ?? "") ||
  (import.meta?.env?.VITE_API_BASE ?? "");

if (!base) {
  const apiBase = http?.defaults?.baseURL;
  if (typeof apiBase === "string") {
    base = apiBase;
  }
}

if (typeof base === "string" && base.startsWith("http")) {
  // Bỏ đuôi "/api" hoặc "/api/"
  base = base.replace(/\/api\/?$/i, "");
} else if (!base && typeof window !== "undefined") {
  base = window.location.origin;
}

const BASE_NORM =
  typeof base === "string" && base.endsWith("/") ? base.slice(0, -1) : base;

// Kết quả kỳ vọng dev: https://localhost:7146/hubs/realtime
const HUB_URL = `${BASE_NORM}/hubs/realtime`;





let _conn = null;

export function getConnection() {
  return _conn;
}

export function createConnection(options = {}) {
  if (_conn) return _conn;

  _conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      withCredentials: true,
      // ❗ Quan trọng: dùng cùng access token với http (Bearer cho SignalR)
      accessTokenFactory: () => getStoredAccessToken(),
      ...options,
    })
    
    .withAutomaticReconnect([0, 2000, 5000, 10000, 20000])
    .configureLogging(signalR.LogLevel.Information)
    .build();

  _conn.onreconnected(() => {
    // console.info("SignalR reconnected");
  });
  _conn.onclose(() => {
    // console.info("SignalR closed");
  });

  return _conn;
}

export async function ensureStarted() {
  const conn = createConnection();
  // Start if disconnected; if connecting/reconnecting, wait briefly for a connected/terminal state.
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    await conn.start();
  } else if (
    conn.state === signalR.HubConnectionState.Connecting ||
    conn.state === signalR.HubConnectionState.Reconnecting
  ) {
    await new Promise((resolve) => {
      const start = Date.now();
      const id = setInterval(() => {
        if (
          conn.state === signalR.HubConnectionState.Connected ||
          conn.state === signalR.HubConnectionState.Disconnected ||
          Date.now() - start > 5000
        ) {
          clearInterval(id);
          resolve();
        }
      }, 100);
    });
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      await conn.start();
    }
  }
  return conn;
}

export async function stop() {
  if (_conn) await _conn.stop();
}

export function on(event, handler) {
  const conn = createConnection();
  conn.on(event, handler);
  return () => off(event, handler);
}
export function off(event, handler) {
  const conn = getConnection();
  if (conn) conn.off(event, handler);
}

export async function invoke(method, ...args) {
  const conn = await ensureStarted();
  return conn.invoke(method, ...args);
}

/* ------------------------------------------------------------------
 * HELPER CHO NHÂN SỰ (STAFF) + GROUPS
 * ------------------------------------------------------------------
 * BE đã có:
 *   - JoinRoleAsync(string role)
 *   - JoinUserAsync(string loaiNguoiNhan, string maNguoiNhan)
 *   - JoinRoomAsync(string maPhong)
 *
 * Ở FE, ta wrap lại cho dễ dùng.
 */

// Nhân sự join realtime chuẩn:
//   - Role: "bac_si" hoặc "y_ta" (tùy loại nhân sự)
//   - User: "nhan_vien_y_te:{maNhanVien}"  (nếu cần) "bac_si:{maNhanVien}"
export async function initStaffRealtime({
    staffId,
    rooms = [],
    staffRole, // "bac_si" | "y_ta" | undefined (fallback: join cả hai)
  } = {}) {
  const conn = await ensureStarted();
  try {
      // ===== JOIN ROLE GROUPS =====
    // Dashboard / KPI & nhiều realtime khác đang bắn cho:
    //   - role:bac_si
    //   - role:y_ta
    if (staffRole === "bac_si") {
      await conn.invoke("JoinRoleAsync", "bac_si");
    } else if (staffRole === "y_ta") {
      await conn.invoke("JoinRoleAsync", "y_ta");
    } else {
      // Nếu FE chưa phân loại được nhân sự, join cả hai để đảm bảo nhận đủ realtime
      await conn.invoke("JoinRoleAsync", "bac_si");
      await conn.invoke("JoinRoleAsync", "y_ta");
    }

    // ===== JOIN USER GROUPS =====
    // NotificationService dùng loaiNguoiNhan "nhan_vien_y_te"  (tuỳ lúc) "bac_si"
    if (staffId) {
      await conn.invoke("JoinUserAsync", "nhan_vien_y_te", staffId);
      await conn.invoke("JoinUserAsync", "bac_si", staffId);
    }

    // nếu truyền kèm danh sách phòng, join luôn hàng đợi các phòng đó
    for (const maPhong of rooms) {
      if (maPhong) {
        await conn.invoke("JoinRoomAsync", maPhong);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("initStaffRealtime error", err);
  }
}

// Join / Leave một phòng (Queue, Clinical, CLS...)
export async function joinRoom(maPhong) {
  if (!maPhong) return;
  const conn = await ensureStarted();
  return conn.invoke("JoinRoomAsync", maPhong);
}

export async function leaveRoom(maPhong) {
  if (!maPhong) return;
  const conn = await ensureStarted();
  return conn.invoke("LeaveRoomAsync", maPhong);
}

// Join / Leave group user (có thể dùng cho bệnh nhân nếu sau này có app BN)
export async function joinUser(loaiNguoiNhan, maNguoiNhan) {
  if (!loaiNguoiNhan || !maNguoiNhan) return;
  const conn = await ensureStarted();
  return conn.invoke("JoinUserAsync", loaiNguoiNhan, maNguoiNhan);
}

export async function leaveUser(loaiNguoiNhan, maNguoiNhan) {
  if (!loaiNguoiNhan || !maNguoiNhan) return;
  const conn = await ensureStarted();
  return conn.invoke("LeaveUserAsync", loaiNguoiNhan, maNguoiNhan);
}
