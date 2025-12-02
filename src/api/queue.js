// src/api/queue.js
import { http } from "./http";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ensureStarted, on } from "./realtime";

/* =========================================================
 * 1. CONSTANTS (TYPE / SOURCE / STATUS)
 * =======================================================*/

// Trùng với LoaiHangDoi trên BE
export const QUEUE_TYPES = {
  CLINICAL: "lam_sang", // hàng đợi khám LS
  CLS: "can_lam_sang", // hàng đợi CLS
};

// Trùng với Nguon mà BE dùng trong TinhDoUuTien
export const QUEUE_SOURCES = {
  WALKIN: "walkin", // walk-in / tiếp nhận trực tiếp
  APPOINTMENT: "appointment", // từ lịch hẹn
  SERVICE: "service", // chỉ định dịch vụ (CLS)
  RETURN_SERVICE: "service_return", // trả kết quả dịch vụ về LS
};

// Trùng với TrangThai trên HangDoi.TrangThai
export const QUEUE_STATUS = {
  WAITING: "cho_goi", // đang chờ được gọi
  IN_PROGRESS: "dang_kham", // đang khám / đang xử lý
  DONE: "da_xu_ly", // đã xử lý xong
  SKIPPED: "bo_qua", // bỏ qua 1 lần
  NO_SHOW: "khong_den", // không đến khám
};

/* =========================================================
 * 2. NORMALIZE DTO: BE -> FE
 *    QueueItemDto -> queue item dùng trong Examination
 * =======================================================*/

function normalizeQueueItem(raw = {}) {
  if (!raw) return null;

  // IDs
  const id =
    raw.MaHangDoi ??
    raw.maHangDoi ??
    raw.ma_hang_doi ??
    raw.id ??
    raw.queueId ??
    null;

  const pid =
    raw.MaBenhNhan ??
    raw.maBenhNhan ??
    raw.ma_benh_nhan ??
    raw.pid ??
    null;

  const roomId =
    raw.MaPhong ??
    raw.maPhong ??
    raw.ma_phong ??
    raw.roomId ??
    raw.room ??
    null;

  const queueType =
    raw.LoaiHangDoi ??
    raw.loaiHangDoi ??
    raw.loai_hang_doi ??
    raw.queueType ??
    raw.visitType ??
    null;

  const source =
    raw.Nguon ??
    raw.nguon ??
    raw.source ??
    null;

  const label =
    raw.Nhan ??
    raw.nhan ??
    raw.label ??
    raw.note ??
    null;

  const emergency =
    raw.CapCuu ??
    raw.capCuu ??
    raw.emergency ??
    raw.IsEmergency ??
    false;

  const arrivalClass =
    raw.PhanLoaiDen ??
    raw.phanLoaiDen ??
    raw.phan_loai_den ??
    null; // den_som, dung_gio, den_muon ...

  const checkinTime =
    raw.ThoiGianCheckin ??
    raw.thoiGianCheckin ??
    raw.thoi_gian_checkin ??
    raw.checkinTime ??
    null;

  const apptTime =
    raw.ThoiGianLichHen ??
    raw.thoiGianLichHen ??
    raw.thoi_gian_lich_hen ??
    raw.apptTime ??
    null;

  const priority =
    raw.DoUuTien ??
    raw.doUuTien ??
    raw.do_uu_tien ??
    raw.priority ??
    0;

  const status =
    raw.TrangThai ??
    raw.trangThai ??
    raw.trang_thai ??
    raw.status ??
    null;

  const maPhieuKham =
    raw.MaPhieuKham ??
    raw.maPhieuKham ??
    raw.ma_phieu_kham ??
    raw.clinicalExamId ??
    null;

  const maChiTietDv =
    raw.MaChiTietDv ??
    raw.maChiTietDv ??
    raw.ma_chi_tiet_dv ??
    raw.serviceItemId ??
    null;

  // ===== Thông tin bệnh nhân (nếu BE trả kèm) =====
  let name =
    raw.TenBenhNhan ??
    raw.tenBenhNhan ??
    raw.ten_benh_nhan ??
    raw.HoTen ??
    raw.hoTen ??
    raw.name ??
    null;

  let phone =
    raw.DienThoai ??
    raw.dienThoai ??
    raw.dien_thoai ??
    raw.phone ??
    null;

  let dob =
    raw.NgaySinh ??
    raw.ngaySinh ??
    raw.ngay_sinh ??
    null;

  let gender =
    raw.GioiTinh ??
    raw.gioiTinh ??
    raw.gioi_tinh ??
    null;

  let dept =
    raw.TenKhoa ??
    raw.tenKhoa ??
    raw.deptName ??
    raw.dept ??
    null;

  let doctor =
    raw.TenBacSi ??
    raw.tenBacSi ??
    raw.tenBS ??
    raw.tenBs ??
    raw.doctor ??
    null;

  const bn = raw.BenhNhan ?? raw.benhNhan ?? raw.patient;
  if (bn) {
    if (!name)
      name =
        bn.HoTen ??
        bn.hoTen ??
        bn.tenBenhNhan ??
        bn.ten_benh_nhan ??
        bn.name ??
        null;

    if (!phone)
      phone =
        bn.DienThoai ??
        bn.dienThoai ??
        bn.phone ??
        null;

    if (!dob)
      dob = bn.NgaySinh ?? bn.ngaySinh ?? null;

    if (!gender)
      gender = bn.GioiTinh ?? bn.gioiTinh ?? null;
  }

  return {
    _raw: raw,

    // Core IDs
    id,
    queueId: id,
    pid,
    ma_benh_nhan: pid,
    maBenhNhan: pid,

    roomId,
    ma_phong: roomId,
    maPhong: roomId,

    // Queue type & source
    queueType,
    loai_hang_doi: queueType,
    loaiHangDoi: queueType,

    source,
    nguon: source,

    label,
    nhan: label,

    emergency: !!emergency,
    cap_cuu: !!emergency,

    arrivalClass,
    phan_loai_den: arrivalClass,

    // Time
    checkinTime,
    thoi_gian_checkin: checkinTime,
    apptTime,
    thoi_gian_lich_hen: apptTime,

    // Priority & status
    priority,
    do_uu_tien: priority,

    status,
    trang_thai: status,

    maPhieuKham,
    ma_phieu_kham: maPhieuKham,

    maChiTietDv,
    ma_chi_tiet_dv: maChiTietDv,

    // Patient info (dùng cho UI Examination)
    name,
    ten_benh_nhan: name,
    phone,
    dien_thoai: phone,
    dob,
    ngay_sinh: dob,
    gender,
    gioi_tinh: gender,
    dept,
    doctor,
  };
}

/* =========================================================
 * 3. HELPERS: BUILD REQUEST BODY
 * =======================================================*/

function buildTodayRange() {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return {
      FromTime: start.toISOString(),
      ToTime: now.toISOString(),
    };
  } catch {
    return { FromTime: null, ToTime: null };
  }
}

function cleanup(obj) {
  const copy = { ...obj };
  Object.keys(copy).forEach((k) => {
    const v = copy[k];
    if (v === undefined || v === null || v === "") {
      delete copy[k];
    }
  });
  return copy;
}

// Mapping FE -> QueueEnqueueRequest
function mapEnqueuePayload(payload = {}, defaults = {}) {
  let apptTime =
    payload.apptTime ??
    payload.ThoiGianLichHen ??
    null;

  if (apptTime instanceof Date) {
    apptTime = apptTime.toISOString();
  }

  return {
    MaBenhNhan:
      payload.MaBenhNhan ??
      payload.maBenhNhan ??
      payload.pid ??
      payload.patientId,
    MaPhong:
      payload.MaPhong ??
      payload.maPhong ??
      payload.room ??
      payload.roomId,
    LoaiHangDoi:
      payload.LoaiHangDoi ??
      payload.loaiHangDoi ??
      payload.queueType ??
      defaults.defaultQueueType ??
      QUEUE_TYPES.CLINICAL,
    Nguon:
      payload.Nguon ??
      payload.nguon ??
      payload.source ??
      defaults.defaultSource ??
      QUEUE_SOURCES.WALKIN,
    Nhan: payload.Nhan ?? payload.nhan ?? payload.label ?? payload.note ?? null,
    CapCuu: !!(
      payload.CapCuu ??
      payload.capCuu ??
      payload.emergency
    ),
    // DoUuTien BE tự tính, mình không cần gửi nhưng để 0 cũng không sao
    DoUuTien: 0,
    ThoiGianLichHen: apptTime,
    MaPhieuKham:
      payload.MaPhieuKham ??
      payload.maPhieuKham ??
      payload.clinicalExamId ??
      null,
    MaChiTietDv:
      payload.MaChiTietDv ??
      payload.maChiTietDv ??
      payload.serviceItemId ??
      null,
    // PhanLoaiDen: để null để BE tự tính theo giờ hẹn
    PhanLoaiDen:
      payload.PhanLoaiDen ??
      payload.phanLoaiDen ??
      payload.phan_loai_den ??
      null,
  };
}

async function updateQueueStatus(id, trangThai) {
  if (!id) throw new Error("updateQueueStatus: missing queue id");
  const body = { TrangThai: trangThai };
  const res = await http.put(`/queue/${id}/status`, body);
  return normalizeQueueItem(res.data ?? res);
}

/* =========================================================
 * 4. CORE IMPLEMENTATION (KHÔNG DÙNG HOOK)
 * =======================================================*/

function useQueueImpl() {
  return {
    // Danh sách hàng đợi hôm nay (theo Search /api/queue/search)
    async getQueueToday(filter = {}) {
      const { FromTime, ToTime } = buildTodayRange();
      const body = cleanup({
        MaPhong: filter.MaPhong ?? filter.maPhong ?? filter.roomId ?? null,
        LoaiHangDoi:
          filter.LoaiHangDoi ??
          filter.loaiHangDoi ??
          filter.queueType ??
          null,
        TrangThai:
          filter.TrangThai ??
          filter.trangThai ??
          filter.status ??
          null,
        FromTime,
        ToTime,
        SortBy: filter.SortBy ?? filter.sortBy ?? "DoUuTien",
        SortDirection:
          filter.SortDirection ?? filter.sortDirection ?? "asc",
        Page: filter.Page ?? filter.page ?? 1,
        PageSize: filter.PageSize ?? filter.pageSize ?? 200,
      });

      const res = await http.post("/queue/search", body);
      const data = res.data ?? res;

      const rawItems =
        data.items ??
        data.Items ??
        [];

      const items = Array.isArray(rawItems)
        ? rawItems.map((x) => normalizeQueueItem(x)).filter(Boolean)
        : [];

      return {
        items,
        totalItems:
          data.TotalItems ??
          data.totalItems ??
          data.total ??
          items.length,
        page: data.Page ?? data.page ?? body.Page ?? 1,
        pageSize:
          data.PageSize ??
          data.pageSize ??
          body.PageSize ??
          items.length,
      };
    },

    // Flow 1: enqueue hàng đợi LS từ tiếp nhận (walkin)
    async enqueueWalkin(payload) {
      const body = mapEnqueuePayload(payload, {
        defaultQueueType: QUEUE_TYPES.CLINICAL,
        defaultSource: QUEUE_SOURCES.WALKIN,
      });
      const res = await http.post("/queue", body);
      return normalizeQueueItem(res.data ?? res);
    },

    // Flow 2: enqueue từ lịch hẹn (appointment)
    async enqueueFromAppointment(payload) {
      const body = mapEnqueuePayload(payload, {
        defaultQueueType: QUEUE_TYPES.CLINICAL,
        defaultSource: QUEUE_SOURCES.APPOINTMENT,
      });
      const res = await http.post("/queue", body);
      return normalizeQueueItem(res.data ?? res);
    },

    // Flow 3: từ màn LS chỉ định CLS → tạo queue CLS cho từng dịch vụ
    async enqueueService(payload) {
      const body = mapEnqueuePayload(payload, {
        defaultQueueType: QUEUE_TYPES.CLS,
        defaultSource: QUEUE_SOURCES.SERVICE,
      });
      const res = await http.post("/queue", body);
      return normalizeQueueItem(res.data ?? res);
    },

    // Flow 4: CLS xong → trả kết quả về LS (queue LS service_return)
    async enqueueReturnToDoctor(payload) {
      const body = mapEnqueuePayload(payload, {
        defaultQueueType: QUEUE_TYPES.CLINICAL,
        defaultSource: QUEUE_SOURCES.RETURN_SERVICE,
      });
      const res = await http.post("/queue", body);
      return normalizeQueueItem(res.data ?? res);
    },

    // Bác sĩ bắt đầu khám → trạng thái đang khám
    async startExam(id) {
      return updateQueueStatus(id, QUEUE_STATUS.IN_PROGRESS);
    },

    // Đánh dấu / bỏ đánh dấu cấp cứu
    // Nếu BE có endpoint: PATCH /api/queue/{id}/mark-emergency { flag }
    async markEmergency({ id, flag }) {
      const res = await http.patch(`/queue/${id}/mark-emergency`, {
        flag,
      });
      return normalizeQueueItem(res.data ?? res);
    },

    // Bỏ qua 1 lần (đổi trạng thái sang "bo_qua")
    async skipOnce(id) {
      return updateQueueStatus(id, QUEUE_STATUS.SKIPPED);
    },

    // Không đến khám (no-show)
    async markNoShow(id) {
      return updateQueueStatus(id, QUEUE_STATUS.NO_SHOW);
    },

    // Khám xong / xử lý xong → đánh dấu DONE (không xoá cứng để còn history)
    async finishAndRemove(id) {
      return updateQueueStatus(id, QUEUE_STATUS.DONE);
    },
  };
}

const impl = useQueueImpl();

/* =========================================================
 * 5. CORE REST EXPORTS (GIỮ TÊN CŨ CHO FE)
 * =======================================================*/

export const getQueue = () => impl.getQueueToday();
export const getQueueToday = getQueue;

export const enqueueWalkin = (payload) => impl.enqueueWalkin(payload);
export const enqueueFromAppointment = (payload) =>
  impl.enqueueFromAppointment(payload);
export const enqueueService = (payload) => impl.enqueueService(payload);
export const enqueueReturnToDoctor = (payload) =>
  impl.enqueueReturnToDoctor(payload);

export const startExam = (id) => impl.startExam(id);
export const markEmergency = (args) => impl.markEmergency(args);
export const skipOnce = (id) => impl.skipOnce(id);
export const markNoShow = (id) => impl.markNoShow(id);
export const finishAndRemove = (id) => impl.finishAndRemove(id);

// alias để khớp hook ở trang
export const finishRemove = finishAndRemove;

/* =========================================================
 * 6. REACT-QUERY HOOKS
 * =======================================================*/

export function useQueue() {
  return useQuery({ queryKey: ["queue"], queryFn: getQueue });
}

export function useQueueToday() {
  return useQuery({ queryKey: ["queue"], queryFn: getQueueToday });
}

export function useEnqueueFromAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueFromAppointment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useEnqueueWalkin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueWalkin,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useEnqueueService() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useReturnToDoctor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: enqueueReturnToDoctor,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useStartExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: startExam,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

export function useFinishRemove() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: finishRemove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["queue"] }),
  });
}

/* =========================================================
 * 7. REALTIME (SIGNALR)
 * =======================================================*/

export async function subscribeQueue(qc) {
  await ensureStarted();

  if (!qc || typeof qc.invalidateQueries !== "function") {
    return () => {};
  }

  const off = on("queue.updated", () => {
    qc.invalidateQueries({ queryKey: ["queue"] });
  });

  return off;
}
