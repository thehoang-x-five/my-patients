// src/api/appointments.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";
import { ensureStarted, on } from "./realtime.js";
import { apiLogger } from "../utils/apiLogger.js";
import { withDeduplication } from "../utils/requestDeduplication.js";
/** ===== Trạng thái lịch hẹn theo ERD ===== */
export const APPT_STATUS = {
  DANG_CHO: "dang_cho",
  DA_XAC_NHAN: "da_xac_nhan",
  DA_CHECKIN: "da_checkin",
  DA_HUY: "da_huy",
};

export const APPT_STATUS_LABEL = {
  [APPT_STATUS.DANG_CHO]: "Đang chờ",
  [APPT_STATUS.DA_XAC_NHAN]: "Đã xác nhận",
  [APPT_STATUS.DA_CHECKIN]: "Đã check-in",
  [APPT_STATUS.DA_HUY]: "Đã hủy",
};


// helper: mọi kiểu date -> 'YYYY-MM-DD'
const toYMD = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    // '2025-11-23T00:00:00' -> '2025-11-23'
    return value.slice(0, 10);
  }
  return null;
};

// helper: mọi kiểu time -> 'HH:MM'
const toHM = (value) => {
  if (!value) return "08:00";
  if (typeof value === "string") {
    // '07:00:00' -> '07:00'
    return value.slice(0, 5);
  }
  return "08:00";
};

function normalizeAppt(raw) {
  if (!raw) return null;

  const id = raw.ma_lich_hen || raw.MaLichHen || raw.id;

  const date = toYMD(raw.ngay_hen || raw.NgayHen || raw.date);
  const time = toHM(raw.gio_hen || raw.GioHen || raw.time || raw.gio);

  return {
    id,
    // Ngày & giờ (đã chuẩn hoá)
    date,
    time,

    // Thời lượng chỉ dùng ở FE
    duration:
      raw.thoi_luong_phut != null
        ? Number(raw.thoi_luong_phut)
        : raw.duration != null
        ? Number(raw.duration)
        : 30,

    // Bệnh nhân
    patientCode:
      raw.ma_benh_nhan ||
      raw.MaBenhNhan ||
      raw.patientCode ||
      raw.code ||
      raw.patient_code ||
      null,
    patientName:
      raw.ten_benh_nhan ||
      raw.TenBenhNhan ||
      raw.patientName ||
      raw.patient ||
      raw.patient_name ||
      "",
    phone: raw.so_dien_thoai || raw.SoDienThoai || raw.phone || "",

    // Loại hẹn
    apptType: raw.loai_hen || raw.LoaiHen || raw.apptType || raw.type || "Khám mới",

    // Trạng thái & hiệu lực
    status: raw.trang_thai || raw.TrangThai || raw.status || APPT_STATUS.DANG_CHO,
    effective:
      typeof raw.co_hieu_luc === "boolean"
        ? raw.co_hieu_luc
        : raw.effective ?? true,

    // Lịch trực / ghi chú
    scheduleId: raw.ma_lich_truc || raw.MaLichTruc || raw.scheduleId || null,
    note: raw.ghi_chu || raw.GhiChu || raw.note || "",

    // Thông tin hiển thị thêm
    doctorName:
      raw.doctorName ||
      raw.doctor ||
      raw.ten_bac_si_kham ||
      raw.TenBacSiKham ||
      null,
    deptName: raw.deptName || raw.dept || raw.khoa_kham || raw.KhoaKham || null,
    roomName: raw.roomName || raw.phong || raw.ten_phong || raw.TenPhong || null,
  };
}

/** Map DTO FE -> payload BE (AppointmentReadAndCreateRequestDto) */
function toPayload(input) {
  if (!input) return {};

  const base = input;

  let loaiHen = base.apptType || null;
  if (loaiHen) {
    const s = String(loaiHen).toLowerCase();
    if (/tái\s*kha|khám\s*lại|follow/.test(s)) {
      loaiHen = "tai_kham";
    } else if (/mới|new/.test(s)) {
      loaiHen = "kham_moi";
    }
  }
 // Chuẩn hoá trạng thái thành code trước khi gửi lên BE
   let status = base.status || APPT_STATUS.DANG_CHO;
   if (status) {
     const s = String(status).toLowerCase();
     if (s.includes("đang chờ") || s.includes("dang cho")) {
       status = APPT_STATUS.DANG_CHO;
     } else if (s.includes("xác nhận") || s.includes("xac nhan")) {
       status = APPT_STATUS.DA_XAC_NHAN;
     } else if (s.includes("check")) {
       status = APPT_STATUS.DA_CHECKIN;
     } else if (s.includes("huỷ") || s.includes("huy")) {
       status = APPT_STATUS.DA_HUY;
     }
   }
 
   const body = {
    NgayHen: base.date,
    GioHen: base.time,
    MaBenhNhan: base.patientCode || null,
    LoaiHen: loaiHen,
    TenBenhNhan: base.patientName,
    SoDienThoai: base.phone,
    TenBacSiKham: base.doctorName || "",
    KhoaKham: base.deptName || "",
    MaLichTruc:  null,
    GhiChu: base.note,
    TrangThai: status,
  };

  // MaLichHen chỉ dùng khi BE trả về; FE không gửi khi tạo
  if (base.id) {
    body.MaLichHen = base.id;
  }

  return body;
}

// Map patch FE -> AppointmentUpdateRequest (PUT /appointments/{maLichHen})
function toUpdatePayload(patch) {
  if (!patch) return {};
  const body = {};
  if (patch.date != null) body.NgayHen = patch.date;
  if (patch.time != null) body.GioHen = patch.time;
  if (patch.note != null) body.GhiChu = patch.note;
  return body;
}


/** ===== RAW API layer (dùng http với baseURL = VITE_API_BASE = ".../api") ===== */
const api = {
  /** Lịch hẹn theo 1 ngày (dùng POST /appointments/search) */
  async listByDate(date) {
    if (!date) return [];

    const filter = {
      FromDate: date,
      ToDate: date,
      Page: 1,
      PageSize: 50, // ✅ Chuẩn hóa: 50 items mặc định
    };

    const startTime = Date.now();
    apiLogger.log({
      endpoint: '/appointments/search',
      params: filter,
      source: 'api.listByDate',
      fromCache: false,
    });

    const res = await http.post("/appointments/search", filter);
    
    apiLogger.log({
      endpoint: '/appointments/search',
      params: filter,
      source: 'api.listByDate',
      fromCache: false,
      duration: Date.now() - startTime,
    });


    // Lấy đúng root thực sự chứa Items
    const root =
      res?.data?.data      // trường hợp backend bọc trong { data: { Items, ... } }
      ?? res?.data?.Data   // hoặc { Data: { Items, ... } }
      ?? res?.data         // hoặc trả thẳng { Items, ... }
      ?? {};

    const arr =
      Array.isArray(root)
        ? root
        : Array.isArray(root.items)
        ? root.items
        : Array.isArray(root.Items)
        ? root.Items
        : Array.isArray(root.result)
        ? root.result
        : Array.isArray(root.Result)
        ? root.Result
        : [];


    return arr.map(normalizeAppt);
  },
  /** Tạo lịch hẹn (POST /appointments) */
  async create(payload) {
    // payload là object FE chuẩn (addApptFromForm) → map thẳng sang DTO BE
    const body = toPayload(payload);

    const res = await http.post("/appointments", body);
    
    return normalizeAppt(res.data);
  },

  /** Cập nhật lịch hẹn (PUT /appointments/{maLichHen}) */
  async update({ id, patch }) {
    const body = toUpdatePayload(patch || {});
    const res = await http.put(`/appointments/${id}`, body);

    return normalizeAppt(res.data);
  },
 /** Cập nhật trạng thái lịch hẹn (PUT /appointments/{maLichHen}/status) */
   async updateStatus(id, status) {
      const res = await http.put(`/appointments/${id}/status`, {
        TrangThai: status,
      });
 
      return normalizeAppt(res.data);
    },
  /** Check-in: PUT /appointments/{maLichHen}/status với TrangThai = "da_checkin" */
  async checkIn(id) {
    const res = await http.put(`/appointments/${id}/status`, {
      TrangThai: APPT_STATUS.DA_CHECKIN,
    });
    return normalizeAppt(res.data);
  },

  /**
   * Tìm lịch khám gần nhất của bệnh nhân
   * - Ưu tiên lọc theo MaBenhNhan (code)
   * - Dùng POST /appointments/search, sau đó sort & chọn bản ghi mới nhất ở FE
   */
  async findLast({ code, name, cutoff }) {
    if (!code && !name) return null;

    const filter = {
      MaBenhNhan: code || null,
      Page: 1,
      PageSize: 50, // ✅ Chuẩn hóa: 50 items mặc định
    };

    const res = await http.post("/appointments/search", filter);
    const data = res.data;
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.Items)
      ? data.Items
      : [];

    let list = arr.map(normalizeAppt);

    if (name) {
      const keyword = name.toLowerCase();
      list = list.filter((x) =>
        (x.patientName || "").toLowerCase().includes(keyword)
      );
    }

    if (cutoff) {
      const cutoffDate = new Date(cutoff);
      if (!Number.isNaN(cutoffDate.getTime())) {
        list = list.filter((x) => {
          if (!x.date) return false;
          const d = new Date(x.date);
          return d >= cutoffDate;
        });
      }
    }

    if (!list.length) return null;

    // sort DESC by datetime
    list.sort((a, b) => {
      const ad = new Date(`${a.date}T${a.time || "00:00"}`);
      const bd = new Date(`${b.date}T${b.time || "00:00"}`);
      return bd - ad;
    });

    return list[0];
  },

   /** Lịch hẹn trong khoảng ngày [fromDate, toDate] – POST /appointments/search */
   async listRange(fromDate, toDate) {
    if (!fromDate || !toDate) return [];

    const filter = {
      FromDate: fromDate,
      ToDate: toDate,
      Page: 1,
      PageSize: 50, // ✅ Chuẩn hóa: 50 items mặc định
    };

    const startTime = Date.now();
    apiLogger.log({
      endpoint: '/appointments/search',
      params: filter,
      source: 'api.listRange',
      fromCache: false,
    });

    const res = await http.post("/appointments/search", filter);
    
    apiLogger.log({
      endpoint: '/appointments/search',
      params: filter,
      source: 'api.listRange',
      fromCache: false,
      duration: Date.now() - startTime,
    });


    const root =
      res?.data?.data
      ?? res?.data?.Data
      ?? res?.data
      ?? {};

    const arr =
      Array.isArray(root)
        ? root
        : Array.isArray(root.items)
        ? root.items
        : Array.isArray(root.Items)
        ? root.Items
        : Array.isArray(root.result)
        ? root.result
        : Array.isArray(root.Result)
        ? root.Result
        : [];


    return arr.map(normalizeAppt);
  },
};

/** ===== Hooks ===== */

export function useAppointmentsByDate(date, options = {}) {
  const enabled = (options.enabled ?? true) && !!date;

  return useQuery({
    queryKey: ["appointments", "byDate", date || "none"],
    queryFn: () => {
      apiLogger.log({
        endpoint: '/appointments/search',
        params: { date },
        source: 'useAppointmentsByDate',
        fromCache: false,
      });
      return api.listByDate(date);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // ✅ 5 phút
    cacheTime: 10 * 60 * 1000, // ✅ 10 phút
    refetchOnWindowFocus: false, // ✅ Không refetch khi focus window
    refetchOnMount: false, // ✅ Không refetch khi mount nếu có cache
    refetchOnReconnect: false, // ✅ Không refetch khi reconnect
    ...options,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload) => api.create(payload),
    onSuccess: (res) => {
        // ✅ Chỉ invalidate, KHÔNG tự động refetch để tránh duplicate API calls
        // Component sẽ tự refetch khi cần (ví dụ: khi user quay lại trang)
      qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "appointments" &&
            q.queryKey[1] === "byDate",
          refetchType: 'none', // ✅ Không tự động refetch
        });
  
        // Cập nhật calendar / khoảng ngày
        qc.invalidateQueries({ 
          queryKey: ["appointments", "range"],
          refetchType: 'none', // ✅ Không tự động refetch
        });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => api.update({ id, patch }),
    onSuccess: (res) => {
    // Có thể đổi ngày → xoá cache của TẤT CẢ ngày
      qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "appointments" &&
            q.queryKey[1] === "byDate",
          refetchType: 'none', // ✅ Không tự động refetch
        });
        qc.invalidateQueries({ 
          queryKey: ["appointments", "range"],
          refetchType: 'none', // ✅ Không tự động refetch
        });
    },
  });
}

export function useCheckInAppointment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id) => api.checkIn(id),
    onSuccess: (res) => {
     // Check-in: đổi trạng thái (và có thể đổi ngày nếu BE cho phép)
      qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "appointments" &&
            q.queryKey[1] === "byDate",
          refetchType: 'none', // ✅ Không tự động refetch
        });
        qc.invalidateQueries({ 
          queryKey: ["appointments", "range"],
          refetchType: 'none', // ✅ Không tự động refetch
        });
    },
  });
}

// Dùng trong CreateDrawer để lấy "lịch khám gần nhất"
export function useFindLastAppointment(params, options = {}) {
  const { code, name, cutoff } = params || {};
  const enabled =
    (options.enabled ?? true) && (!!code || !!name) && !!(cutoff || true);

  return useQuery({
    queryKey: ["appointments", "last", { code, name, cutoff }],
    queryFn: () => api.findLast({ code, name, cutoff }),
    enabled,
    staleTime: 30_000,
    ...options,
  });
}

export function useAppointmentsRange(fromDate, toDate, options = {}) {
  const enabled = (options.enabled ?? true) && !!fromDate && !!toDate;

  return useQuery({
    queryKey: ["appointments", "range", { fromDate, toDate }],
    queryFn: () => {
      apiLogger.log({
        endpoint: '/appointments/search',
        params: { fromDate, toDate },
        source: 'useAppointmentsRange',
        fromCache: false,
      });
      return api.listRange(fromDate, toDate);
    },
    enabled,
    staleTime: 5 * 60 * 1000, // ✅ 5 phút
    cacheTime: 10 * 60 * 1000, // ✅ 10 phút
    refetchOnWindowFocus: false, // ✅ Không refetch khi focus window
    refetchOnMount: false, // ✅ Không refetch khi mount nếu có cache
    refetchOnReconnect: false, // ✅ Không refetch khi reconnect
    ...options,
  });
}
export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  
    return useMutation({
      mutationFn: ({ id, status }) => api.updateStatus(id, status),
      onSuccess: (res) => {
        qc.invalidateQueries({
          predicate: (q) =>
            Array.isArray(q.queryKey) &&
            q.queryKey[0] === "appointments" &&
            q.queryKey[1] === "byDate",
          refetchType: 'none', // ✅ Không tự động refetch
        });
        qc.invalidateQueries({ 
          queryKey: ["appointments", "range"],
          refetchType: 'none', // ✅ Không tự động refetch
        });
      },
    });
  }


  // === Search lịch hẹn (POST /api/appointments/search) ===
// Trả về raw list (chưa normalize) để các màn khác tự xử lý
// ✅ Wrapped with deduplication to prevent duplicate simultaneous calls
async function searchAppointmentsRawImpl(filter = {}) {
  const startTime = Date.now();
  apiLogger.log({
    endpoint: '/appointments/search',
    params: filter,
    source: 'searchAppointmentsRaw',
    fromCache: false,
  });

  const res = await http.post("/appointments/search", filter);
  
  apiLogger.log({
    endpoint: '/appointments/search',
    params: filter,
    source: 'searchAppointmentsRaw',
    fromCache: false,
    duration: Date.now() - startTime,
  });

  const data = res?.data;

  if (!data) return [];

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

// Export deduplicated version
export const searchAppointmentsRaw = withDeduplication(
  searchAppointmentsRawImpl,
  '/appointments/search'
);

  // Đăng ký realtime cho lịch hẹn
export async function subscribeAppointments(queryClient) {
  if (!queryClient) return () => {};

  // Đảm bảo connection đã start
  await ensureStarted();

  const handler = (dto) => {
    const appt = normalizeAppt(dto);
    if (!appt) return;

    // Bất kỳ thay đổi nào (kể cả đổi ngày) → làm tươi TẤT CẢ cache "byDate"
    queryClient.invalidateQueries({
        predicate: (q) =>
          Array.isArray(q.queryKey) &&
          q.queryKey[0] === "appointments" &&
          q.queryKey[1] === "byDate",
      });
  
      // Và cập nhật luôn calendar / range
      queryClient.invalidateQueries({ queryKey: ["appointments", "range"] });
  };

  const off = on("AppointmentChanged", handler);
  return () => {
    if (typeof off === "function") off();
  };
}
