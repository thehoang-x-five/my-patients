// src/api/realtime.js
import * as signalR from "@microsoft/signalr";

const BASE =
  import.meta?.env?.VITE_SIGNALR_BASE ||
  import.meta?.env?.VITE_API_BASE ||

  "";

const BASE_NORM = BASE?.endsWith("/") ? BASE.slice(0, -1) : BASE;
// App Hub endpoint: /hubs/app
const HUB_URL = `${BASE_NORM}/hubs/app`;

let _conn = null;

export function getConnection() {
  return _conn;
}

export function createConnection(options = {}) {
  if (_conn) return _conn;

  _conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      withCredentials: true,
      accessTokenFactory: () =>
        (typeof window !== "undefined" && localStorage.getItem("access_token")) ||
        null,
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
