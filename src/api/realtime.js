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
let _startPromise = null;
const _eventHandlers = new Map();
const _joinedRoles = new Set();
const _joinedUsers = new Set();
const _joinedRooms = new Set();

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

  for (const [event, handlers] of _eventHandlers.entries()) {
    for (const handler of handlers) {
      _conn.on(event, handler);
    }
  }

  _conn.onreconnected(() => {
    rejoinKnownGroups().catch((err) => {
      console.error("SignalR rejoin groups error", err);
    });
  });
  _conn.onclose(() => {
    // console.info("SignalR closed");
  });

  return _conn;
}

async function rejoinKnownGroups() {
  const conn = getConnection();
  if (!conn || conn.state !== signalR.HubConnectionState.Connected) return;

  for (const role of _joinedRoles) {
    await conn.invoke("JoinRoleAsync", role);
  }

  for (const userKey of _joinedUsers) {
    const [loaiNguoiNhan, maNguoiNhan] = userKey.split("::");
    if (loaiNguoiNhan && maNguoiNhan) {
      await conn.invoke("JoinUserAsync", loaiNguoiNhan, maNguoiNhan);
    }
  }

  for (const maPhong of _joinedRooms) {
    if (maPhong) {
      await conn.invoke("JoinRoomAsync", maPhong);
    }
  }
}

async function waitForConnectionState(conn, allowedStates, timeoutMs = 5000) {
  if (allowedStates.includes(conn.state)) return;

  await new Promise((resolve) => {
    const start = Date.now();
    const id = setInterval(() => {
      if (
        allowedStates.includes(conn.state) ||
        Date.now() - start > timeoutMs
      ) {
        clearInterval(id);
        resolve();
      }
    }, 100);
  });
}

function shouldRetryStart(err) {
  const message = String(err?.message || "").toLowerCase();
  return (
    message.includes("stopped during negotiation") ||
    message.includes("connection was stopped") ||
    message.includes("failed to start the connection")
  );
}

async function startConnectionSafely(conn) {
  if (conn.state === signalR.HubConnectionState.Connected) {
    return conn;
  }

  if (_startPromise) {
    await _startPromise;
    return getConnection();
  }

  _startPromise = (async () => {
    let current = conn;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (current.state === signalR.HubConnectionState.Disconnecting) {
        await waitForConnectionState(
          current,
          [signalR.HubConnectionState.Disconnected],
          5000
        );
        _conn = null;
        current = createConnection();
      }

      if (
        current.state === signalR.HubConnectionState.Connecting ||
        current.state === signalR.HubConnectionState.Reconnecting
      ) {
        await waitForConnectionState(
          current,
          [
            signalR.HubConnectionState.Connected,
            signalR.HubConnectionState.Disconnected,
          ],
          5000
        );
      }

      if (current.state === signalR.HubConnectionState.Connected) {
        return current;
      }

      try {
        await current.start();
        return current;
      } catch (err) {
        if (!shouldRetryStart(err) || attempt === 1) {
          throw err;
        }

        try {
          await current.stop();
        } catch {
          // ignore
        }

        _conn = null;
        current = createConnection();
      }
    }

    return current;
  })();

  try {
    await _startPromise;
    return getConnection();
  } finally {
    _startPromise = null;
  }
}

export async function ensureStarted() {
  let conn = createConnection();

  // Handle Disconnecting state (React StrictMode triggers cleanup → stop() mid-connect)
  if (conn.state === signalR.HubConnectionState.Disconnecting) {
    await waitForConnectionState(
      conn,
      [signalR.HubConnectionState.Disconnected],
      5000
    );
    // Connection object is stale after stop(), create fresh
    _conn = null;
    conn = createConnection();
  }

  // Start if disconnected
  if (conn.state === signalR.HubConnectionState.Disconnected) {
    conn = await startConnectionSafely(conn);
  } else if (
    conn.state === signalR.HubConnectionState.Connecting ||
    conn.state === signalR.HubConnectionState.Reconnecting
  ) {
    // Wait for connecting/reconnecting to settle
    await waitForConnectionState(
      conn,
      [
        signalR.HubConnectionState.Connected,
        signalR.HubConnectionState.Disconnected,
      ],
      5000
    );
    if (conn.state === signalR.HubConnectionState.Disconnected) {
      conn = await startConnectionSafely(conn);
    }
  }
  return conn;
}

async function restartConnection(conn) {
  try {
    if (
      conn.state === signalR.HubConnectionState.Connected ||
      conn.state === signalR.HubConnectionState.Connecting ||
      conn.state === signalR.HubConnectionState.Reconnecting
    ) {
      await conn.stop();
    }
  } catch {
    // ignore and try a clean start below
  }

  // After stop, the old connection object may be unusable — reset and create fresh
  _conn = null;
  const freshConn = createConnection();
  if (freshConn.state === signalR.HubConnectionState.Disconnected) {
    await freshConn.start();
    await rejoinKnownGroups();
  }
}

async function invokeSafe(method, ...args) {
  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const conn = await ensureStarted();

    try {
      if (conn.state !== signalR.HubConnectionState.Connected) {
        throw new Error(
          `SignalR connection is not ready (${conn.state}) for ${method}.`
        );
      }

      return await conn.invoke(method, ...args);
    } catch (err) {
      lastError = err;
      const message = String(err?.message || "");
      const isConnectionStateError =
        message.includes("Cannot send data if the connection is not in the 'Connected' State") ||
        message.includes("SignalR connection is not ready");

      if (!isConnectionStateError || attempt === 1) {
        throw err;
      }

      await restartConnection(conn);
    }
  }

  throw lastError;
}

export async function stop() {
  _startPromise = null;
  _joinedRoles.clear();
  _joinedUsers.clear();
  _joinedRooms.clear();
  if (_conn) await _conn.stop();
  _conn = null;
}

export function on(event, handler) {
  const conn = createConnection();
  if (!_eventHandlers.has(event)) {
    _eventHandlers.set(event, new Set());
  }
  _eventHandlers.get(event).add(handler);
  conn.on(event, handler);
  return () => off(event, handler);
}
export function off(event, handler) {
  const handlers = _eventHandlers.get(event);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      _eventHandlers.delete(event);
    }
  }

  const conn = getConnection();
  if (conn) conn.off(event, handler);
}

export async function invoke(method, ...args) {
  return invokeSafe(method, ...args);
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
//   - NurseType: "hanhchinh" | "phong_kham" | "can_lam_sang" (chỉ y tá)
function normalizeStaffRole(value) {
  const role =
    value == null
      ? ""
      : String(value)
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/đ/g, "d")
          .replace(/[\s-]+/g, "_");

  if (["ky_thuat_vien", "kythuatvien", "ktv", "technician"].includes(role)) {
    return "ky_thuat_vien";
  }
  if (["bac_si", "bacsi", "doctor"].includes(role)) {
    return "bac_si";
  }
  if (["y_ta", "yta", "nurse"].includes(role)) {
    return "y_ta";
  }
  if (["admin", "quan_tri_vien", "quantrivien"].includes(role)) {
    return "admin";
  }

  return role;
}

export async function initStaffRealtime({
    staffId,
    rooms = [],
    staffRole, // "bac_si" | "y_ta" | undefined (fallback: join cả hai)
    nurseType, // "hanhchinh" | "phong_kham" | "can_lam_sang" (chỉ y tá)
  } = {}) {
  try {
    const normalizedStaffRole = normalizeStaffRole(staffRole);

      // ===== JOIN ROLE GROUPS =====
    // Dashboard / KPI & nhiều realtime khác đang bắn cho:
    //   - role:bac_si
    //   - role:y_ta
    if (normalizedStaffRole === "bac_si") {
      _joinedRoles.add("bac_si");
      await invokeSafe("JoinRoleAsync", "bac_si");
    } else if (normalizedStaffRole === "ky_thuat_vien") {
      _joinedRoles.add("ky_thuat_vien");
      await invokeSafe("JoinRoleAsync", "ky_thuat_vien");
    } else if (normalizedStaffRole === "admin") {
      _joinedRoles.add("admin");
      await invokeSafe("JoinRoleAsync", "admin");
    } else if (normalizedStaffRole === "y_ta") {
      _joinedRoles.add("y_ta");
      await invokeSafe("JoinRoleAsync", "y_ta");

      // ===== JOIN NURSE TYPE GROUP (CHỈ Y TÁ) =====
      // Y tá hành chính: nhận invoices, prescriptions, appointments
      // Y tá LS: nhận clinical exams trong phòng
      // Y tá CLS: nhận CLS orders trong phòng
      if (nurseType) {
        await invokeSafe("JoinNurseTypeAsync", nurseType);
      }
    } else {
      // Nếu FE chưa phân loại được nhân sự, join cả hai để đảm bảo nhận đủ realtime
      await invokeSafe("JoinRoleAsync", "bac_si");
      await invokeSafe("JoinRoleAsync", "y_ta");
      await invokeSafe("JoinRoleAsync", "ky_thuat_vien");
      await invokeSafe("JoinRoleAsync", "admin");
      _joinedRoles.add("bac_si");
      _joinedRoles.add("y_ta");
      _joinedRoles.add("ky_thuat_vien");
      _joinedRoles.add("admin");
    }

    // ===== JOIN USER GROUPS =====
    // NotificationService dùng loaiNguoiNhan "nhan_vien_y_te"  (tuỳ lúc) "bac_si"
    if (staffId) {
      _joinedUsers.add(`nhan_vien_y_te::${staffId}`);
      _joinedUsers.add(`bac_si::${staffId}`);
      _joinedUsers.add(`y_ta::${staffId}`);
      _joinedUsers.add(`ky_thuat_vien::${staffId}`);
      _joinedUsers.add(`admin::${staffId}`);
      await invokeSafe("JoinUserAsync", "nhan_vien_y_te", staffId);
      await invokeSafe("JoinUserAsync", "bac_si", staffId);
      await invokeSafe("JoinUserAsync", "y_ta", staffId);
      await invokeSafe("JoinUserAsync", "ky_thuat_vien", staffId);
      await invokeSafe("JoinUserAsync", "admin", staffId);
    }

    // nếu truyền kèm danh sách phòng, join luôn hàng đợi các phòng đó
    for (const maPhong of rooms) {
      if (maPhong) {
        _joinedRooms.add(maPhong);
        await invokeSafe("JoinRoomAsync", maPhong);
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
  _joinedRooms.add(maPhong);
  return invokeSafe("JoinRoomAsync", maPhong);
}

export async function leaveRoom(maPhong) {
  if (!maPhong) return;
  _joinedRooms.delete(maPhong);
  return invokeSafe("LeaveRoomAsync", maPhong);
}

// Join / Leave group user (có thể dùng cho bệnh nhân nếu sau này có app BN)
export async function joinUser(loaiNguoiNhan, maNguoiNhan) {
  if (!loaiNguoiNhan || !maNguoiNhan) return;
  return invokeSafe("JoinUserAsync", loaiNguoiNhan, maNguoiNhan);
}

export async function leaveUser(loaiNguoiNhan, maNguoiNhan) {
  if (!loaiNguoiNhan || !maNguoiNhan) return;
  return invokeSafe("LeaveUserAsync", loaiNguoiNhan, maNguoiNhan);
}
