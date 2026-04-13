// src/api/queue.js
// Minimal client for QueueController endpoints described in API doc

import { useMemo } from "react";
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

// Lưu mã hàng đợi đã chuyển đi CLS, chỉ hiển thị lại khi nguồn = service_return
const RETURN_QUEUE_STORAGE_KEY = "queue-awaiting-service-return";

function loadReturnQueueIds() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(RETURN_QUEUE_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return new Set(parsed.map((x) => String(x)));
    }
  } catch (err) {
    console.warn("Không thể đọc danh sách mã hàng đợi chờ trả kết quả:", err);
  }
  return new Set();
}

function persistReturnQueueIds(set) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      RETURN_QUEUE_STORAGE_KEY,
      JSON.stringify(Array.from(set))
    );
  } catch (err) {
    console.warn("Không thể lưu danh sách mã hàng đợi chờ trả kết quả:", err);
  }
}

// Ghi nhận một mã hàng đợi đã được chuyển đi CLS
export function rememberQueueAwaitingReturn(maHangDoi) {
  if (!maHangDoi) return;
  const ids = loadReturnQueueIds();
  const key = String(maHangDoi);
  if (!ids.has(key)) {
    ids.add(key);
    persistReturnQueueIds(ids);
  }
}

// Ẩn các mã hàng đợi đã chuyển CLS cho tới khi nguồn = service_return
function filterReturnQueues(items = []) {
  const ids = loadReturnQueueIds();
  if (!ids.size) return { filtered: items, changed: false };

  let changed = false;
  const filtered = [];

  for (const item of items) {
    const id =
      item?.MaHangDoi ??
      item?.maHangDoi ??
      item?.queueId ??
      item?.id ??
      null;

    if (!id) {
      filtered.push(item);
      continue;
    }

    const key = String(id);
    const source = item?.Nguon ?? item?.nguon ?? item?.source ?? null;

    if (!ids.has(key)) {
      filtered.push(item);
      continue;
    }

    // Nếu quay lại với nguồn service_return => hiển thị và xóa khỏi danh sách ẩn
    if (source === "service_return") {
      ids.delete(key);
      filtered.push(item);
      changed = true;
    } else {
      // vẫn ẩn, giữ trong localStorage
      changed = true;
    }
  }

  if (changed) {
    persistReturnQueueIds(ids);
  }

  return { filtered, changed };
}

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
  
  // Map các field từ API response (PascalCase) sang cả PascalCase và camelCase để tương thích
  const normalized = {
        // giữ nguyên toàn bộ field gốc từ BE (bao gồm các object lồng như PhieuKhamLs, PhieuKhamCls, PhieuKhamLsFull, PhieuKhamClsFull, ...)
        ...raw,
    
        _raw: raw,
        // Queue fields (PascalCase - giữ nguyên từ API)
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
    HasPendingCls: Boolean(raw.HasPendingCls ?? raw.hasPendingCls ?? false),
    
    // Alias fields cho tương thích với code hiện tại (camelCase)
    id: raw.MaHangDoi ?? raw.maHangDoi ?? raw.id ?? null,
    queueId: raw.MaHangDoi ?? raw.maHangDoi ?? raw.id ?? null,
    pid: raw.MaBenhNhan ?? raw.maBenhNhan ?? raw.pid ?? null,
    maPhong: raw.MaPhong ?? raw.maPhong ?? raw.ma_phong ?? null,
    loaiHangDoi: raw.LoaiHangDoi ?? raw.loaiHangDoi ?? null,
    queueType: raw.LoaiHangDoi ?? raw.loaiHangDoi ?? null,
    visitType: raw.LoaiHangDoi ?? raw.loaiHangDoi ?? null,
    nguon: raw.Nguon ?? raw.nguon ?? null,
    source: raw.Nguon ?? raw.nguon ?? null,
    nhan: raw.Nhan ?? raw.nhan ?? null,
    capCuu: raw.CapCuu ?? raw.capCuu ?? !!raw.emergency ?? false,
    emergency: raw.CapCuu ?? raw.capCuu ?? !!raw.emergency ?? false,
    phanLoaiDen: raw.PhanLoaiDen ?? raw.phanLoaiDen ?? null,
    thoiGianCheckin: raw.ThoiGianCheckin ?? raw.thoiGianCheckin ?? null,
    checkIn: raw.ThoiGianCheckin ?? raw.thoiGianCheckin ?? null,
    thoiGianLichHen: raw.ThoiGianLichHen ?? raw.thoiGianLichHen ?? null,
    time: raw.ThoiGianLichHen ? new Date(raw.ThoiGianLichHen).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null,
    doUuTien: Number(raw.DoUuTien ?? raw.doUuTien ?? 0) || 0,
    priority: Number(raw.DoUuTien ?? raw.doUuTien ?? 0) || 0,
    trangThai: raw.TrangThai ?? raw.trangThai ?? raw.status ?? null,
    status: raw.TrangThai ?? raw.trangThai ?? raw.status ?? null,
    maPhieuKham: raw.MaPhieuKham ?? raw.maPhieuKham ?? null,
    maChiTietDv: raw.MaChiTietDv ?? raw.maChiTietDv ?? null,
    hasPendingCls: Boolean(raw.HasPendingCls ?? raw.hasPendingCls ?? false),
    
   // Patient info từ nested object hoặc từ API khác (nếu có)
    name:
      raw.TenBenhNhan ??
      raw.HoTen ??
      raw.hoTen ??
      raw.name ??
      raw.BenhNhan?.HoTen ??
      raw.benhNhan?.hoTen ??
      null,
    hoTen:
      raw.TenBenhNhan ??
      raw.HoTen ??
      raw.hoTen ??
      raw.name ??
      raw.BenhNhan?.HoTen ??
      raw.benhNhan?.hoTen ??
      null,
    dept:
      raw.TenKhoa ??
      raw.tenKhoa ??
      raw.Khoa?.TenKhoa ??
      raw.khoa?.tenKhoa ??
      raw.dept ??
      raw.department ??
      null,
    department:
      raw.TenKhoa ??
      raw.tenKhoa ??
      raw.Khoa?.TenKhoa ??
      raw.khoa?.tenKhoa ??
      raw.dept ??
      raw.department ??
      null,
    doctor:
      raw.TenBacSiKham ??
      raw.TenBacSi ??
      raw.tenBacSi ??
      raw.doctor ??
      raw.BacSi?.TenBacSi ??
      raw.bacSi?.tenBacSi ??
      null,
    note: raw.GhiChu ?? raw.ghiChu ?? raw.note ?? raw.symptoms ?? null,
    symptoms: raw.GhiChu ?? raw.ghiChu ?? raw.note ?? raw.symptoms ?? null,
    age: raw.Tuoi ?? raw.tuoi ?? raw.age ?? null,
    gender: raw.GioiTinh ?? raw.gioiTinh ?? raw.gender ?? null,
    room: raw.MaPhong ?? raw.maPhong ?? raw.room ?? null,
  };
  
  return normalized;
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

// Helper để lấy MaNhanSu từ auth store
function getCurrentUserMaNhanSu() {
  if (typeof window === "undefined") return null;
  
  try {
    // Thử lấy từ localStorage
    const authData = localStorage.getItem("his-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const user = parsed?.user;
      if (user) {
        // Thử các field có thể chứa MaNhanSu
        return user.MaNhanSu || user.maNhanSu || user.id || user.userId || null;
      }
    }
    // Thử lấy từ window.APP_USER
    if (window.APP_USER) {
      return window.APP_USER.MaNhanSu || window.APP_USER.maNhanSu || window.APP_USER.id || window.APP_USER.userId || null;
    }
  } catch (err) {
    console.warn("Không thể lấy MaNhanSu:", err);
  }
  return null;
}

// Helper để lấy VaiTro từ auth store
function getCurrentUserVaiTro() {
  if (typeof window === "undefined") return null;
  
  try {
    const authData = localStorage.getItem("his-auth");
    if (authData) {
      const parsed = JSON.parse(authData);
      const user = parsed?.user;
      if (user) {
        return user.VaiTro || user.vaiTro || user.role || null;
      }
    }
    if (window.APP_USER) {
      return window.APP_USER.VaiTro || window.APP_USER.vaiTro || window.APP_USER.role || null;
    }
  } catch (err) {
    console.warn("Không thể lấy VaiTro:", err);
  }
  return null;
}

// Search: POST /api/queue/search
export async function search(filter = {}) {
  // Lấy MaNhanSu và VaiTro từ user hiện tại nếu không được truyền vào
  const maNhanSu = filter.MaNhanSu ?? filter.maNhanSu ?? getCurrentUserMaNhanSu();
  const vaiTro = filter.VaiTro ?? filter.vaiTro ?? getCurrentUserVaiTro();
  
  const body = cleanup({
    MaPhong: filter.MaPhong ?? filter.maPhong ?? filter.roomId ?? null,
    VaiTro: vaiTro,
    MaNhanSu: maNhanSu,
    LoaiHangDoi: filter.LoaiHangDoi ?? filter.loaiHangDoi ?? null,
    TrangThai: filter.TrangThai ?? filter.trangThai ?? null,
    Nguon: filter.Nguon ?? filter.nguon ?? filter.source ?? null,
    Keyword: filter.Keyword ?? filter.keyword ?? filter.search ?? null,
    FromTime: filter.FromTime ?? filter.fromTime ?? null,
    ToTime: filter.ToTime ?? filter.toTime ?? null,
    SortBy: filter.SortBy ?? filter.sortBy ?? null,
    SortDirection: filter.SortDirection ?? filter.sortDirection ?? null,
    Page: filter.Page ?? filter.page ?? 1,
    PageSize: filter.PageSize ?? filter.pageSize ?? 50, // ✅ Chuẩn hóa: 50 items mặc định
  });
  const res = await http.post(`/queue/search`, body);
  const data = res?.data ?? res;
  const items = data?.items ?? data?.Items ?? [];

  // ✅ Trả về PagedResult chuẩn
  return {
    Items: Array.isArray(items) ? items.map((x) => normalizeQueueItem(x)) : [],
    items: Array.isArray(items) ? items.map((x) => normalizeQueueItem(x)) : [], // Giữ alias cho tương thích
    TotalItems: data?.TotalItems ?? data?.totalItems ?? data?.total ?? (Array.isArray(items) ? items.length : 0) ?? 0,
    totalItems: data?.TotalItems ?? data?.totalItems ?? data?.total ?? (Array.isArray(items) ? items.length : 0) ?? 0, // Giữ alias
    Page: data?.Page ?? data?.page ?? body.Page ?? 1,
    page: data?.Page ?? data?.page ?? body.Page ?? 1, // Giữ alias
    PageSize: data?.PageSize ?? data?.pageSize ?? body.PageSize ?? 50,
    pageSize: data?.PageSize ?? data?.pageSize ?? body.PageSize ?? 50, // Giữ alias
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
  // Normalize params để query key ổn định (tránh gọi API lặp do object reference thay đổi)
  const normalizedParams = useMemo(() => {
    // Chuyển đổi Date objects thành ISO strings để so sánh ổn định
    const fromTime = params.FromTime ?? params.fromTime;
    const toTime = params.ToTime ?? params.toTime;
    const fromTimeStr = fromTime ? (typeof fromTime === 'string' ? fromTime : fromTime.toISOString()) : null;
    const toTimeStr = toTime ? (typeof toTime === 'string' ? toTime : toTime.toISOString()) : null;
    
    return {
      MaPhong: params.MaPhong ?? params.maPhong ?? null,
      VaiTro: params.VaiTro ?? params.vaiTro ?? null,
      MaNhanSu: params.MaNhanSu ?? params.maNhanSu ?? null,
      LoaiHangDoi: params.LoaiHangDoi ?? params.loaiHangDoi ?? null,
      TrangThai: params.TrangThai ?? params.trangThai ?? null,
      Nguon: params.Nguon ?? params.nguon ?? params.source ?? null,
      Keyword: params.Keyword ?? params.keyword ?? params.search ?? null,
      FromTime: fromTimeStr,
      ToTime: toTimeStr,
      SortBy: params.SortBy ?? params.sortBy ?? null,
      SortDirection: params.SortDirection ?? params.sortDirection ?? null,
      Page: params.Page ?? params.page ?? 1,
      PageSize: params.PageSize ?? params.pageSize ?? 50, // ✅ Chuẩn hóa: 50 items mặc định
    };
  }, [
    params.MaPhong,
    params.maPhong,
    params.VaiTro,
    params.vaiTro,
    params.MaNhanSu,
    params.maNhanSu,
    params.LoaiHangDoi,
    params.loaiHangDoi,
    params.TrangThai,
    params.trangThai,
    params.Nguon,
    params.nguon,
    params.source,
    params.Keyword,
    params.keyword,
    params.search,
    params.FromTime,
    params.fromTime,
    params.ToTime,
    params.toTime,
    params.SortBy,
    params.sortBy,
    params.SortDirection,
    params.sortDirection,
    params.Page,
    params.page,
    params.PageSize,
    params.pageSize,
  ]);
  
  // Tạo query key ổn định từ normalizedParams (serialize thành string để đảm bảo ổn định)
  const queryKey = useMemo(() => {
    return ["queue", "search", JSON.stringify(normalizedParams)];
  }, [normalizedParams]);
  
  return useQuery({ 
    queryKey, 
    queryFn: () => search(normalizedParams), 
    select: (res) => {
      // ✅ Chuẩn hóa về format PagedResult chung
      if (res && typeof res === "object") {
        return {
          Items: res.items || res.Items || [],
          TotalItems: res.TotalItems ?? res.totalItems ?? (res.items?.length ?? 0),
          Page: res.Page ?? res.page ?? (normalizedParams?.Page ?? 1),
          PageSize: res.PageSize ?? res.pageSize ?? (normalizedParams?.PageSize ?? 50),
        };
      }
      // Fallback
      const items = Array.isArray(res) ? res : [];
      return {
        Items: items,
        TotalItems: items.length,
        Page: normalizedParams?.Page ?? 1,
        PageSize: normalizedParams?.PageSize ?? 50,
      };
    },
    keepPreviousData: true, 
    staleTime: 60000, // Tăng staleTime lên 60s
    gcTime: 300000, // Cache 5 phút
    refetchOnWindowFocus: false, // Tắt refetch khi focus window
    refetchOnMount: false, // Tắt refetch khi mount lại
    refetchOnReconnect: false, // Tắt refetch khi reconnect
    refetchInterval: false, // Tắt auto refetch để tránh gọi lặp
    retry: 1, // Chỉ retry 1 lần nếu lỗi
    ...options 
  });
}

export { normalizeQueueItem };

/* ==================================================================
 * Compatibility wrappers for older callers in the codebase
 * (keeps previous names but forwards to the new minimal API)
 * ==================================================================*/

// useQueueToday: convenience hook that searches today's range
export function useQueueToday(options = {}) {
  // Memoize params để tránh tạo object mới mỗi lần render
  // Chỉ tính toán một lần khi mount, không phụ thuộc vào thời gian thực
  const params = useMemo(() => {
    // Lấy thời gian hiện tại (JavaScript Date tự động dùng timezone của máy)
    // Nếu cần đảm bảo múi giờ +7, tạo Date với timezone UTC+7
    const now = new Date();
    
    // Tính toán thời gian UTC+7 (giờ Việt Nam)
    // Lấy UTC time và cộng thêm 7 giờ
    const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000); // Chuyển sang UTC
    const vietnamOffset = 7 * 60 * 60 * 1000; // +7 giờ tính bằng milliseconds
    const vietnamTime = new Date(utcNow + vietnamOffset);
    
    // fromTime = 00:00 hôm nay (UTC+7)
    const from = new Date(vietnamTime);
    from.setHours(0, 0, 0, 0);
    // toTime = 23:59:59.999 hôm nay (UTC+7)
    const to = new Date(vietnamTime);
    to.setHours(23, 59, 59, 999);
    
    return { 
      FromTime: from.toISOString(), 
      ToTime: to.toISOString(), 
      Page: 1, 
      PageSize: 50 // ✅ Chuẩn hóa: 50 items mặc định 
    };
  }, []); // Empty deps - chỉ tính toán một lần khi mount
  
  // Merge options với các settings mặc định để đảm bảo chỉ gọi một lần
  const mergedOptions = {
    staleTime: 60000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: 1,
    ...options,
  };
  
  return useQueueSearch(params, mergedOptions);
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
