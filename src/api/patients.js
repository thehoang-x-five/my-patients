// src/api/patients.js
// Chuẩn hóa layer API cho Patients page & PatientModal theo API_Health_full_with_tables_updated_full.docx

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "./http.js";

/** ===== Constants: trạng thái trong ngày & trạng thái tài khoản ===== */

// Mã trạng thái khám trong ngày (PatientStatusUpdateRequest.TrangThaiHomNay)
export const STATUSES = {
  WAIT_INTAKE: "cho_tiep_nhan",
  WAIT_INTAKE_SVC: "cho_tiep_nhan_dv",
  WAIT_EXAM: "cho_kham",
  WAIT_EXAM_SVC: "cho_kham_dv",
  WAIT_CLS: "cho_cls",
  IN_EXAM: "dang_kham",
  IN_EXAM_SVC: "dang_kham_dv",
  WAIT_PROC: "cho_xu_ly",
  WAIT_PROC_SVC: "cho_xu_ly_dv",
  SCHEDULED_APPT: "hen_kham",
  SCHEDULED_FUP: "hen_tai_kham",
  DONE_EXAM: "da_kham",
  DONE: "hoan_tat",
  CANCELLED: "da_huy",
};

export const ACCOUNT_STATUSES = ["hoat_dong", "khong_hoat_dong", "da_xoa"];

export const TODAY_STATUS_MAP = {
  cho_tiep_nhan: "Chờ tiếp nhận",
  cho_tiep_nhan_dv: "Chờ tiếp nhận (dịch vụ)",
  cho_kham: "Chờ khám",
  cho_kham_dv: "Chờ khám (dịch vụ)",
  cho_cls: "Chờ CLS",
  dang_kham: "Đang khám",
  dang_kham_dv: "Đang khám (dịch vụ)",
  cho_xu_ly: "Chờ xử lý",
  cho_xu_ly_dv: "Chờ xử lý (dịch vụ)",
  da_kham: "Đã khám",
  hen_kham: "Hẹn khám",
  hen_tai_kham: "Hẹn tái khám",
  da_huy: "Đã hủy",
  hoan_tat: "Hoàn thành",
};

export function mapTodayStatusLabel(codeOrLabel) {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).toLowerCase();
  return TODAY_STATUS_MAP[low] || codeOrLabel;
}

/* ===== Helpers: build filter & normalize DTOs ===== */

function buildPatientSearchFilter(params = {}) {
  const {
    keyword,
    maBenhNhan,
    dienThoai,
    gioiTinh,
    status,
    accountStatus,
    todayOnly,
    page,
    pageSize,
    sortBy,
    sortDirection,
  } = params || {};

  const filter = {
    Keyword: keyword,
    MaBenhNhan: maBenhNhan,
    DienThoai: dienThoai,
    GioiTinh: gioiTinh,
    TrangThaiHomNay: status,
    TrangThaiTaiKhoan: accountStatus,
    OnlyToday: todayOnly,
    Page: page ?? 1,
    PageSize: pageSize ?? 50,
    SortBy: sortBy,
    SortDirection: sortDirection,
  };

  Object.keys(filter).forEach((k) => {
    const v = filter[k];
    if (v === undefined || v === null || v === "") {
      delete filter[k];
    }
  });

  return filter;
}

// Chuẩn hóa PatientDto (summary) dùng cho bảng PatientsTable
function normalizePatientFields(dto = {}) {
  const id = dto.MaBenhNhan || dto.maBenhNhan || "";
  const name = dto.HoTen || dto.hoTen || "";
  const dob = dto.NgaySinh || dto.ngaySinh || null;
  const gender = dto.GioiTinh || dto.gioiTinh || "";
  const phone = dto.DienThoai || dto.dienThoai || "";
  const email = dto.Email || dto.email || "";
  const address = dto.DiaChi || dto.diaChi || "";

  const statusCode = dto.TrangThaiHomNay || dto.trangThaiHomNay || "";
  const statusDate = dto.NgayTrangThai || dto.ngayTrangThai || null;

  // Detail DTO có TrangThaiTaiKhoan, summary có thể không → default "hoat_dong"
  const accountStatus =
    dto.TrangThaiTaiKhoan ||
    dto.trangThaiTaiKhoan ||
    dto.AccountStatus ||
    dto.accountStatus ||
    "hoat_dong";

  return {
    _raw: dto,

    // ID
    id,
    pid: id,
    ma_benh_nhan: id,
    maBenhNhan: id,

    // Thông tin cơ bản
    name,
    hoTen: name,
    dob,
    ngaySinh: dob,
    gioi_tinh: gender,
    gioiTinh: gender,
    gender,
    phone,
    dien_thoai: phone,
    dienThoai: phone,
    email,
    address,
    dia_chi: address,
    diaChi: address,

    // Trạng thái tài khoản & trong ngày
    accountStatus,
    trang_thai_tai_khoan: accountStatus,
    trangThaiTaiKhoan: accountStatus,

    statusCode,
    status: mapTodayStatusLabel(statusCode),
    trang_thai_hom_nay: mapTodayStatusLabel(statusCode),
    trang_thai_hom_nay_code: statusCode,
    trangThaiHomNay: statusCode,
    ngay_trang_thai: statusDate,
    statusDate,
  };
}

// Chuẩn hóa PatientDetailDto cho PatientModal (bao gồm lịch sử khám & giao dịch)
function normalizePatientDetail(dto) {
  if (!dto) return null;

  const base = normalizePatientFields(dto);

  const visitsRaw = Array.isArray(dto.LichSuKham)
    ? dto.LichSuKham
    : Array.isArray(dto.lichSuKham)
    ? dto.lichSuKham
    : [];

  const transactionsRaw = Array.isArray(dto.LichSuGiaoDich)
    ? dto.LichSuGiaoDich
    : Array.isArray(dto.lichSuGiaoDich)
    ? dto.lichSuGiaoDich
    : [];

  const visits = visitsRaw.map((v) => ({
    _raw: v,
    date: v.Date || v.date || null,
    dept: v.Dept || v.dept || "",
    doctor: v.Doctor || v.doctor || "",
    note: v.Note || v.note || "",
    type: v.Type || v.type || "",
    by: v.By || v.by || "",
    ref: v.Ref || v.ref || "",
    maLuotKham: v.MaLuotKham || v.maLuotKham || "",
    maPhieuKham: v.MaPhieuKham || v.maPhieuKham || "",
  }));

  const transactions = transactionsRaw.map((t) => ({
    _raw: t,
    date: t.Date || t.date || null,
    item: t.Item || t.item || "",
    amount: t.Amount || t.amount || 0,
    status: t.Status || t.status || "",
    ref: t.Ref || t.ref || "",
    maHoaDon: t.MaHoaDon || t.maHoaDon || "",
    loaiDotThu: t.LoaiDotThu || t.loaiDotThu || "",
    phuongThucThanhToan:
      t.PhuongThucThanhToan || t.phuongThucThanhToan || "",
  }));

  // Bệnh sử (chỉ chắc chắn có trong detail)
  const di_ung = dto.DiUng || dto.diUng || "";
  const chong_chi_dinh = dto.ChongChiDinh || dto.chongChiDinh || "";
  const thuoc_dang_dung = dto.ThuocDangDung || dto.thuocDangDung || "";
  const tieu_su_benh = dto.TieuSuBenh || dto.tieuSuBenh || "";
  const tien_su_phau_thuat = dto.TienSuPhauThuat || dto.tienSuPhauThuat || "";
  const nhom_mau = dto.NhomMau || dto.nhomMau || "";
  const benh_man_tinh = dto.BenhManTinh || dto.benhManTinh || "";
  const sinh_hieu = dto.SinhHieu || dto.sinhHieu || "";

  return {
    ...base,
    di_ung,
    chong_chi_dinh,
    thuoc_dang_dung,
    tieu_su_benh,
    tien_su_phau_thuat,
    nhom_mau,
    benh_man_tinh,
    sinh_hieu,

    visits,
    lich_su_kham: visits,

    transactions,
    lich_su_giao_dich: transactions,
  };
}

// Map payload FE → PatientCreateUpdateRequest (UpsertPatient)
function buildPatientPayload(input = {}) {
  const isNew = !(
    input?.MaBenhNhan ||
    input?.maBenhNhan ||
    input?.id ||
    input?.pid ||
    input?.pid
  );

  const payload = {
    // API UpsertPatient: PatientCreateUpdateRequest
    HoTen:
      input.HoTen ?? input.name ?? input.hoTen ?? input.ho_ten ?? "",
    NgaySinh: input.NgaySinh ?? input.dob ?? input.ngaySinh ?? null,
    GioiTinh:
      input.GioiTinh ??
      input.gioi_tinh ??
      input.gioiTinh ??
      input.gender ??
      "Khác",
    DienThoai: input.DienThoai ?? input.phone ?? input.dienThoai ?? "",
    Email: input.Email ?? input.email ?? "",
    DiaChi: input.DiaChi ?? input.address ?? input.diaChi ?? "",

    // Bệnh sử (chấp nhận cả PascalCase, camelCase và snake_case)
    DiUng: input.DiUng ?? input.di_ung ?? input.diUng ?? "",
    ChongChiDinh:
      input.ChongChiDinh ?? input.chong_chi_dinh ?? input.chongChiDinh ?? "",
    ThuocDangDung:
      input.ThuocDangDung ?? input.thuoc_dang_dung ?? input.thuocDangDung ?? "",
    TieuSuBenh:
      input.TieuSuBenh ?? input.tieu_su_benh ?? input.tieuSuBenh ?? "",
    TienSuPhauThuat:
      input.TienSuPhauThuat ??
      input.tien_su_phau_thuat ??
      input.tienSuPhauThuat ??
      "",
    NhomMau: input.NhomMau ?? input.nhom_mau ?? input.nhomMau ?? "",
    BenhManTinh:
      input.BenhManTinh ?? input.benh_man_tinh ?? input.benhManTinh ?? "",
    SinhHieu: input.SinhHieu ?? input.sinh_hieu ?? input.sinhHieu ?? "",
    // Trạng thái tài khoản (BE field: TrangThaiTaiKhoan)
    TrangThaiTaiKhoan:
      input.TrangThaiTaiKhoan ??
      input.trangThaiTaiKhoan ??
      input.accountStatus ??
      (isNew ? "hoat_dong" : undefined),

    // Trạng thái trong ngày (BE field: TrangThaiHomNay)
    TrangThaiHomNay:
      input.TrangThaiHomNay ??
      input.trangThaiHomNay ??
      input.status ??
      (isNew ? STATUSES.WAIT_INTAKE : undefined),
  };

  // Remove any undefined values so BE receives only intended fields
  Object.keys(payload).forEach((k) => {
    if (payload[k] === undefined) delete payload[k];
  });

  return payload;
}

/* ===== Core REST theo API doc ===== */

/**
 * SearchPatients
 * GET /api/patient
 * Input: PatientSearchFilter (query string)
 * Output: PagedResult<PatientDto>
 */
export const listPatients = async (params = {}) => {
  const filter = buildPatientSearchFilter(params);
  const res = await http.get("/patient", { params: filter });
  return res.data || res;
};

/**
 * GetPatientDetail
 * GET /api/patient/{maBenhNhan}
 * Output: PatientDetailDto
 */
export const getPatientDetail = async (id) => {
  const pid = id ?? null;
  if (!pid) throw new Error("Missing patient id for getPatientDetail");
  const res = await http.get(`/patient/${pid}`);
  return res.data || res;
};

/**
 * UpsertPatient
 * POST /api/patient
 * Input: PatientCreateUpdateRequest
 * (BE xử lý tạo mới hoặc cập nhật dựa trên logic riêng)
 */
export const upsertPatient = async (payload = {}) => {
  const body = buildPatientPayload(payload);
  console.log("[Patient API] Upsert payload:", body);
  try {
    const res = await http.post("/patient", body);
    console.log("[Patient API] Upsert response:", res.data || res);
    return res.data || res;
  } catch (err) {
    console.error("[Patient API] Upsert error:", err);
    throw err;
  }
};


/**
 * UpdateDailyStatus
 * PUT /api/patient/{maBenhNhan}/status
 * Input: PatientStatusUpdateRequest { TrangThaiHomNay }
 * Output: PatientDto
 */
export const updatePatientStatus = async ({ id, status } = {}) => {
  const pid = id ?? null;
  if (!pid) throw new Error("Missing patient id for updatePatientStatus");
  if (!status) throw new Error("Missing status for updatePatientStatus");

  const body = {
    TrangThaiHomNay: status,
  };

  const res = await http.put(`/patient/${pid}/status`, body);
  return res.data || res;
};




/* ===== React Query hooks ===== */

// Danh sách bệnh nhân cho Patients.jsx
export function usePatientsList(params = {}, options) {
  const filter = buildPatientSearchFilter(params);

  return useQuery({
    queryKey: ["patients", filter],
    queryFn: () => listPatients(params),
    select: (res) => {
      const itemsRaw = res?.items ?? res?.Items ?? res ?? [];
      const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
      return arr.map((x) => normalizePatientFields(x));
    },
    keepPreviousData: true,
    staleTime: 10_000,
    ...(options || {}),
  });
}

// Tạo mới bệnh nhân
export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => upsertPatient(payload),
    onSuccess: async () => {
      try {
        await qc.invalidateQueries({ queryKey: ["patients"], exact: false });
        await qc.refetchQueries({ queryKey: ["patients"], exact: false });
      } catch {}
    },
  });
}

// Cập nhật bệnh nhân (alias cho useCreatePatient vì API upsertPatient xử lý cả create và update)
export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => {
      // Nếu có id và patch, merge chúng lại
      const payload = id ? { ...patch, id } : patch;
      return upsertPatient(payload);
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ["patients"], exact: false });
      // Invalidate detail nếu có id
      const pid = vars?.id ?? vars?.patch?.id ?? vars?.patch?.pid;
      if (pid) {
        qc.invalidateQueries({ queryKey: ["patient", pid] });
      }
    },
  });
}




// Cập nhật trạng thái trong ngày
export function useUpdatePatientStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }) => updatePatientStatus({ id, status }),
    onSuccess: (_res, vars) => {
      const key = vars?.id ?? vars?.pid ?? vars?.code;
      if (key) {
        qc.invalidateQueries({ queryKey: ["patients"] });
        qc.invalidateQueries({ queryKey: ["visits", key] });
      } else {
        qc.invalidateQueries({ queryKey: ["patients"] });
      }
    },
  });
}

// Detail cho PatientModal / trang chi tiết bệnh nhân bao gồm lịch sử khám +giao dịch
export function usePatientDetail(id, options = {}) {
  const enabled = (options.enabled ?? true) && !!id;

  return useQuery({
    queryKey: ["patient", id],
    queryFn: () => getPatientDetail(id),
    enabled,
    select: (dto) => normalizePatientDetail(dto),
    staleTime: options.staleTime ?? 30_000,
    ...options,
  });
}




// Cho phép import normalizePatientFields từ bên ngoài nếu cần
export { normalizePatientFields };
