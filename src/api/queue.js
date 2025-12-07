// src/api/queue.js
// Minimal client for QueueController endpoints described in API doc

import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

/* =========================================================
 * 1. CONSTANTS (TYPE / SOURCE / STATUS)
 * =======================================================*/

// Trùng với LoaiHangDoi trên BE
export const QUEUE_TYPES = {
  CLINICAL: "kham_lam_sang", // hàng đợi khám LS
  CLS: "can_lam_sang", // hàng đợi CLS
};

// Trùng với Nguon mà BE dùng trong TinhDoUuTien
export const QUEUE_SOURCES = {
  WALKIN: "walkin", // walk-in / tiếp nhận trực tiếp
  APPOINTMENT: "appointment", // từ lịch hẹn
  RETURN_SERVICE: "service_return", // trả kết quả dịch vụ về LS
};

// Trùng với TrangThai trên HangDoi.TrangThai
export const QUEUE_STATUS = {
  WAITING: "cho_goi", // đang chờ được gọi
  IN_PROGRESS: "dang_thuc_hien", // đang khám / đang xử lý
  DONE: "da_phuc_vu", // đã xử lý xong
  CANCEL: "huy", // đã hủy
};

/* =========================================================
 * 2. NORMALIZE DTO: BE -> FE
 *    QueueItemDto -> queue item dùng trong Examination
 * =======================================================*/

function normalizeQueueItem(raw = {}) {
  if (!raw) return null;
  return {
    _raw: raw,
    MaHangDoi: raw.MaHangDoi ?? raw.maHangDoi ?? raw.id ?? null,
    MaBenhNhan: raw.MaBenhNhan ?? raw.maBenhNhan ?? raw.pid ?? null,
    MaPhong: raw.MaPhong ?? raw.maPhong ?? raw.ma_phong ?? null,
    LoaiHangDoi: raw.LoaiHangDoi ?? raw.loaiHangDoi ?? null,
    Nguon: raw.Nguon ?? raw.nguon ?? null,
    Nhan: raw.Nhan ?? raw.nhan ?? null,
    CapCuu: raw.CapCuu ?? raw.capCuu ?? !!raw.emergency ?? false,
    PhanLoaiDen: raw.PhanLoaiDen ?? raw.phanLoaiDen ?? null,
    ThoiGianCheckin: raw.ThoiGianCheckin ?? raw.thoiGianCheckin ?? null,
    ThoiGianLichHen: raw.ThoiGianLichHen ?? raw.thoiGianLichHen ?? null,
    DoUuTien: Number(raw.DoUuTien ?? raw.doUuTien ?? 0) || 0,
    TrangThai: raw.TrangThai ?? raw.trangThai ?? raw.status ?? null,
    MaPhieuKham: raw.MaPhieuKham ?? raw.maPhieuKham ?? null,
    MaChiTietDv: raw.MaChiTietDv ?? raw.maChiTietDv ?? null,
  };
}

function cleanup(obj = {}) {
  const out = {};
  Object.keys(obj || {}).forEach((k) => {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  });
  return out;
}

function mapEnqueuePayload(payload = {}) {
  const ThoiGianLichHen = payload.ThoiGianLichHen ?? payload.thoiGianLichHen ?? payload.apptTime ?? null;
  return cleanup({
    MaBenhNhan: payload.MaBenhNhan ?? payload.maBenhNhan ?? payload.pid ?? payload.patientId ?? null,
    MaPhong: payload.MaPhong ?? payload.maPhong ?? payload.roomId ?? payload.room ?? null,
    LoaiHangDoi: payload.LoaiHangDoi ?? payload.loaiHangDoi ?? payload.queueType ?? null,
    Nguon: payload.Nguon ?? payload.nguon ?? payload.source ?? null,
    Nhan: payload.Nhan ?? payload.nhan ?? payload.label ?? null,
    CapCuu: payload.CapCuu ?? payload.capCuu ?? !!payload.emergency ?? false,
    DoUuTien: payload.DoUuTien ?? payload.doUuTien ?? 0,
    ThoiGianLichHen: ThoiGianLichHen instanceof Date ? ThoiGianLichHen.toISOString() : ThoiGianLichHen,
    MaPhieuKham: payload.MaPhieuKham ?? payload.maPhieuKham ?? payload.clinicalExamId ?? null,
    MaChiTietDv: payload.MaChiTietDv ?? payload.maChiTietDv ?? payload.serviceItemId ?? null,
  });
}

/* ===== API functions matching API doc ===== */

// Enqueue: POST /api/queue
export async function enqueue(payload = {}) {
  const body = mapEnqueuePayload(payload);
  const res = await http.post("/queue", body);
  return normalizeQueueItem(res?.data ?? res);
}

// GetById: GET /api/queue/{maHangDoi}
export async function getQueueById(maHangDoi) {
  if (!maHangDoi) throw new Error("Missing maHangDoi");
  const res = await http.get(`/queue/${encodeURIComponent(maHangDoi)}`);
  return normalizeQueueItem(res?.data ?? res);
}

// GetByRoom: GET /api/queue/rooms/{maPhong}?loaiHangDoi=...&trangThai=...
export async function getQueueByRoom(maPhong, params = {}) {
  if (!maPhong) throw new Error("Missing maPhong");
  const q = cleanup({ loaiHangDoi: params.loaiHangDoi ?? params.LoaiHangDoi, trangThai: params.trangThai ?? params.TrangThai });
  const res = await http.get(`/queue/rooms/${encodeURIComponent(maPhong)}`, { params: q });
  const arr = Array.isArray(res?.data) ? res.data : res?.data?.items ?? res?.data ?? [];
  return (arr || []).map((x) => normalizeQueueItem(x));
}

// UpdateStatus: PUT /api/queue/{maHangDoi}/status
export async function updateStatus(maHangDoi, trangThai) {
  if (!maHangDoi) throw new Error("Missing maHangDoi");
  if (!trangThai) throw new Error("Missing trangThai");
  const res = await http.put(`/queue/${encodeURIComponent(maHangDoi)}/status`, { TrangThai: trangThai });
  return normalizeQueueItem(res?.data ?? res);
}

// DequeueNext: POST /api/queue/rooms/{maPhong}/next
export async function dequeueNext(maPhong, loaiHangDoi = null) {
  if (!maPhong) throw new Error("Missing maPhong");
  const body = cleanup({ LoaiHangDoi: loaiHangDoi });
  const res = await http.post(`/queue/rooms/${encodeURIComponent(maPhong)}/next`, body);
  return normalizeQueueItem(res?.data ?? res);
}

// Search: POST /api/queue/search
export async function search(filter = {}) {
  const body = cleanup({
    MaPhong: filter.MaPhong ?? filter.maPhong ?? filter.roomId ?? null,
    LoaiHangDoi: filter.LoaiHangDoi ?? filter.loaiHangDoi ?? null,
    TrangThai: filter.TrangThai ?? filter.trangThai ?? null,
    FromTime: filter.FromTime ?? filter.fromTime ?? null,
    ToTime: filter.ToTime ?? filter.toTime ?? null,
    SortBy: filter.SortBy ?? filter.sortBy ?? null,
    SortDirection: filter.SortDirection ?? filter.sortDirection ?? null,
    Page: filter.Page ?? filter.page ?? 1,
    PageSize: filter.PageSize ?? filter.pageSize ?? 50,
  });
  const res = await http.post(`/queue/search`, body);
  const data = res?.data ?? res;
  const items = data?.items ?? data?.Items ?? [];
 
  return {
    items: Array.isArray(items) ? items.map((x) => normalizeQueueItem(x)) : [],
    totalItems: data?.TotalItems ?? data?.totalItems ?? data?.total ?? null,
    page: data?.Page ?? data?.page ?? body.Page ?? 1,
    pageSize: data?.PageSize ?? data?.pageSize ?? body.PageSize ?? 50,
  };
}

/* ===== React Query hooks ===== */

export function useEnqueue(options = {}) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p) => enqueue(p), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"], exact: false }), ...options });
}

export function useQueueById(maHangDoi, options = {}) {
  return useQuery({ queryKey: ["queue", maHangDoi], queryFn: () => getQueueById(maHangDoi), enabled: !!maHangDoi, ...options });
}

export function useQueueByRoom(maPhong, params = {}, options = {}) {
  return useQuery({ queryKey: ["queue", "rooms", maPhong, params], queryFn: () => getQueueByRoom(maPhong, params), enabled: !!maPhong, ...options });
}

export function useUpdateStatus(options = {}) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ maHangDoi, trangThai }) => updateStatus(maHangDoi, trangThai), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"], exact: false }), ...options });
}

export function useDequeueNext(options = {}) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ maPhong, loaiHangDoi }) => dequeueNext(maPhong, loaiHangDoi), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"], exact: false }), ...options });
}

export function useQueueSearch(params = {}, options = {}) {
  return useQuery({ queryKey: ["queue", "search", params], queryFn: () => search(params), keepPreviousData: true, staleTime: 10000, ...options });
}

export { normalizeQueueItem };

/* ==================================================================
 * Compatibility wrappers for older callers in the codebase
 * (keeps previous names but forwards to the new minimal API)
 * ==================================================================*/

// useQueueToday: convenience hook that searches today's range
export function useQueueToday(options = {}) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  const params = { FromTime: from.toISOString(), ToTime: to.toISOString(), Page: 1, PageSize: 500 };
  return useQueueSearch(params, options);
}

// Backwards-compatible enqueue flavors
export async function enqueueFromAppointment(payload, opts = {}) {
  return enqueue({ ...payload, Nguon: payload.Nguon ?? payload.source ?? "appointment", ...opts });
}

export async function enqueueService(payload, opts = {}) {
  return enqueue({ ...payload, LoaiHangDoi: payload.LoaiHangDoi ?? payload.queueType ?? "can_lam_sang", Nguon: payload.Nguon ?? payload.source ?? "service", ...opts });
}

export async function enqueueReturnToDoctor(payload, opts = {}) {
  return enqueue({ ...payload, Nguon: payload.Nguon ?? payload.source ?? "service_return", ...opts });
}

export async function enqueueWalkin(payload, opts = {}) {
  return enqueue({ ...payload, Nguon: payload.Nguon ?? payload.source ?? "walkin", ...opts });
}

// Hooks aliases
export function useEnqueueService(options = {}) {
  return useEnqueue(options);
}

export function useReturnToDoctor(options = {}) {
  return useEnqueue(options);
}

export function useEnqueueWalkin(options = {}) {
  return useEnqueue(options);
}

// Backwards-compatible start/finish hooks
export function useStartExam(options = {}) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (maHangDoi) => updateStatus(maHangDoi, "dang_kham"), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"], exact: false }), ...options });
}

export function useFinishRemove(options = {}) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (maHangDoi) => updateStatus(maHangDoi, "da_phuc_vu"), onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"], exact: false }), ...options });
}

// subscribeQueue: simple compatibility shim that returns a no-op unsub
export async function subscribeQueue(qc) {
  // If the project has a realtime implementation, it can override this.
  // For now return a noop unsubscribe function.
  return () => {};
}
