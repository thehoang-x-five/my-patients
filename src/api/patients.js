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
  IN_EXAM: "dang_kham",
  IN_EXAM_SVC: "dang_kham_dv",
  WAIT_PROC: "cho_xu_ly",
  WAIT_PROC_SVC: "cho_xu_ly_dv",
  DONE: "hoan_tat",
  CANCELLED: "da_huy",
};

export const ACCOUNT_STATUSES = ["hoat_dong", "khong_hoat_dong", "da_xoa"];

export const TODAY_STATUS_LABELS = {
  cho_tiep_nhan: { vi: "Chờ tiếp nhận", en: "Waiting intake" },
  cho_tiep_nhan_dv: { vi: "Chờ tiếp nhận (dịch vụ)", en: "Waiting intake (service)" },
  cho_kham: { vi: "Chờ khám", en: "Waiting examination" },
  cho_kham_dv: { vi: "Chờ khám (dịch vụ)", en: "Waiting examination (service)" },
  dang_kham: { vi: "Đang khám", en: "In examination" },
  dang_kham_dv: { vi: "Đang khám (dịch vụ)", en: "In examination (service)" },
  cho_xu_ly: { vi: "Chờ xử lý", en: "Waiting processing" },
  cho_xu_ly_dv: { vi: "Chờ xử lý (dịch vụ)", en: "Waiting processing (service)" },
  da_huy: { vi: "Đã hủy", en: "Cancelled" },
  huy: { vi: "Đã hủy", en: "Cancelled" },
  hoan_tat: { vi: "Hoàn thành", en: "Completed" },
  hoan_thanh: { vi: "Hoàn thành", en: "Completed" },
  da_hoan_tat: { vi: "Hoàn thành", en: "Completed" },
};

export const TODAY_STATUS_MAP = Object.fromEntries(
  Object.entries(TODAY_STATUS_LABELS).map(([key, label]) => [key, label.vi])
);

const TODAY_STATUS_ALIASES = {
  huy: "da_huy",
  cancelled: "da_huy",
  cancel: "da_huy",
  hoan_thanh: "hoan_tat",
  da_hoan_tat: "hoan_tat",
  completed: "hoan_tat",
};

const EXPIRING_TODAY_STATUSES = new Set([
  STATUSES.WAIT_INTAKE,
  STATUSES.WAIT_INTAKE_SVC,
  STATUSES.WAIT_EXAM,
  STATUSES.WAIT_EXAM_SVC,
  STATUSES.IN_EXAM,
  STATUSES.IN_EXAM_SVC,
  STATUSES.WAIT_PROC,
  STATUSES.WAIT_PROC_SVC,
]);

export function normalizeTodayStatusCode(codeOrLabel) {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).trim().toLowerCase();
  return TODAY_STATUS_ALIASES[low] || low;
}

function toLocalDateKey(value) {
  if (!value) return "";
  const text = String(value).trim();
  const isoDate = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayLocalDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function isCurrentTodayStatus(statusDate) {
  const key = toLocalDateKey(statusDate);
  return !!key && key === todayLocalDateKey();
}

export function getEffectiveTodayStatusCode(codeOrLabel, statusDate) {
  const status = normalizeTodayStatusCode(codeOrLabel);
  if (!status) return "";

  const statusDateKey = toLocalDateKey(statusDate);
  if (
    statusDateKey &&
    statusDateKey < todayLocalDateKey() &&
    EXPIRING_TODAY_STATUSES.has(status)
  ) {
    return STATUSES.CANCELLED;
  }

  return status;
}

export function getTodayStatusLabel(codeOrLabel, lang = "vi") {
  if (!codeOrLabel) return "";
  const low = normalizeTodayStatusCode(codeOrLabel);
  const entry = TODAY_STATUS_LABELS[low];
  if (!entry) return codeOrLabel;
  return lang === "en" ? entry.en : entry.vi;
}

export function mapTodayStatusLabel(codeOrLabel) {
  return getTodayStatusLabel(codeOrLabel, "vi");
}

const GENDER_LABELS = {
  nam: { vi: "Nam", en: "Male" },
  male: { vi: "Nam", en: "Male" },
  nu: { vi: "Nữ", en: "Female" },
  nữ: { vi: "Nữ", en: "Female" },
  female: { vi: "Nữ", en: "Female" },
  khac: { vi: "Khác", en: "Other" },
  khác: { vi: "Khác", en: "Other" },
  other: { vi: "Khác", en: "Other" },
};

export function getGenderLabel(value, lang = "vi") {
  if (!value && value !== 0) return "";
  const key = String(value).trim().toLowerCase();
  const entry = GENDER_LABELS[key];
  if (!entry) {
    return key ? key[0].toUpperCase() + key.slice(1) : "";
  }
  return lang === "en" ? entry.en : entry.vi;
}

export function mapGenderLabel(value) {
  return getGenderLabel(value, "vi");
}

const ACCOUNT_STATUS_LABELS = {
  hoat_dong: { vi: "Hoạt động", en: "Active" },
  khong_hoat_dong: { vi: "Không hoạt động", en: "Inactive" },
  da_xoa: { vi: "Đã xóa", en: "Deleted" },
  active: { vi: "Hoạt động", en: "Active" },
  inactive: { vi: "Không hoạt động", en: "Inactive" },
  deleted: { vi: "Đã xóa", en: "Deleted" },
};

// Chuẩn hóa mã trạng thái tài khoản về canonical code
function mapAccountStatusCode(codeOrLabel) {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).toLowerCase();
  if (["hoat_dong", "active", "1"].includes(low)) return "hoat_dong";
  if (["khong_hoat_dong", "inactive", "0"].includes(low)) return "khong_hoat_dong";
  if (["da_xoa", "deleted", "xoa"].includes(low)) return "da_xoa";
  return low;
}

export function mapAccountStatusLabel(codeOrLabel) {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).toLowerCase();
  const entry = ACCOUNT_STATUS_LABELS[low];
  return entry?.vi || codeOrLabel;
}

export function getAccountStatusLabel(codeOrLabel, lang = "vi") {
  if (!codeOrLabel) return "";
  const low = String(codeOrLabel).trim().toLowerCase();
  const entry = ACCOUNT_STATUS_LABELS[low];
  if (!entry) return codeOrLabel;
  return lang === "en" ? entry.en : entry.vi;
}

// Visit type map (history)
const VISIT_TYPE_MAP = {
  clinic: "Khám lâm sàng",
  service: "Dịch vụ/CLS",
  walkin: "Tiếp nhận trực tiếp",
  followup: "Tái khám",
};

export function mapVisitTypeLabel(t) {
  if (!t) return "";
  const low = String(t).toLowerCase();
  return VISIT_TYPE_MAP[low] || t;
}

function capitalizeWords(s = "") {
  return String(s || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function normalizePhone(p = "") {
  if (!p) return "";
  const s = String(p).trim();
  // remove non-digits except +
  const cleaned = s.replace(/[^+0-9]/g, "");
  return cleaned;
}

// Transaction status labels
const TRANSACTION_STATUS_MAP = {
  paid: "Đã thanh toán",
  da_thu: "Đã thanh toán",
  pending: "Đang chờ",
  cancelled: "Đã hủy",
  refund: "Hoàn tiền",
  da_thanh_toan: "Đã thanh toán",
  cho_thanh_toan: "Đang chờ",
  da_huy: "Đã hủy",
  huy: "Đã hủy",
  bao_luu: "Bảo lưu",
};

export function mapTransactionStatusLabel(s) {
  if (!s && s !== 0) return "";
  const low = String(s).toLowerCase();
  return TRANSACTION_STATUS_MAP[low] || s;
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
    TrangThaiHomNay: normalizeTodayStatusCode(status),
    TrangThaiTaiKhoan: accountStatus,
    OnlyToday: todayOnly,
    Page: page ?? 1,
    PageSize: pageSize ?? 50, // ✅ Chuẩn hóa: 50 items mặc định
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
  const normalizedStatusCode = getEffectiveTodayStatusCode(statusCode, statusDate);

  // Detail DTO có TrangThaiTaiKhoan, summary có thể không → default "hoat_dong"
  const accountStatusRaw =
    dto.TrangThaiTaiKhoan ||
    dto.trangThaiTaiKhoan ||
    dto.AccountStatus ||
    dto.accountStatus ||
    "hoat_dong";
  const accountStatus = mapAccountStatusCode(accountStatusRaw);

  // formatted values for UI
  const nameFormatted = capitalizeWords(name || "");
  const genderLabel = mapGenderLabel(gender);
  const accountStatusLabel = mapAccountStatusLabel(accountStatus);
  const phoneNormalized = normalizePhone(phone);

  return {
    _raw: dto,

    // ID
    id,
    pid: id,
    ma_benh_nhan: id,
    maBenhNhan: id,

    // Thông tin cơ bản
    name,
    nameFormatted,
    hoTen: name,
    dob,
    ngaySinh: dob,
    gioi_tinh: genderLabel,
    gioiTinh: genderLabel,
    gender: genderLabel,
    phone,
    dien_thoai: phoneNormalized,
    dienThoai: phoneNormalized,
    email,
    address,
    dia_chi: address,
    diaChi: address,

    // Trạng thái tài khoản & trong ngày
    accountStatus, // canonical code: hoat_dong | khong_hoat_dong | da_xoa
    accountStatusLabel,
    trang_thai_tai_khoan: accountStatus, // keep code for filters
    trangThaiTaiKhoan: accountStatus, // keep code for filters
    trangThaiTaiKhoanLabel: accountStatusLabel,

    statusCode: normalizedStatusCode,
    status: mapTodayStatusLabel(normalizedStatusCode),
    statusLabel: mapTodayStatusLabel(normalizedStatusCode),
    trang_thai_hom_nay: mapTodayStatusLabel(normalizedStatusCode),
    trang_thai_hom_nay_code: normalizedStatusCode,
    trangThaiHomNay: normalizedStatusCode,
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
    dateLabel: v.Date || v.date || null,
    dept: capitalizeWords(v.Dept || v.dept || ""),
    doctor: capitalizeWords(v.Doctor || v.doctor || ""),
    note: v.Note || v.note || "",
    type: v.Type || v.type || "",
    status: v.TrangThai || v.trangThai || "",
    typeLabel: mapVisitTypeLabel(v.Type || v.type || v.TypeName || v.typeName),
    by: v.By || v.by || "",
    ref: v.Ref || v.ref || "",
    maLuotKham: v.MaLuotKham || v.maLuotKham || "",
    maPhieuKham: v.MaPhieuKham || v.maPhieuKham || "",
  }));

  const transactions = transactionsRaw.map((t) => ({
    _raw: t,
    date: t.Date || t.date || null,
    dateLabel: t.Date || t.date || null,
    item: t.Item || t.item || "",
    amount: t.Amount || t.amount || 0,
    status: t.Status || t.status || "",
    statusLabel: mapTransactionStatusLabel(t.Status || t.status || ""),
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
    input?.pid ||null
  );

  const payload = {
    // API UpsertPatient: PatientCreateUpdateRequest
    MaBenhNhan:  input?.MaBenhNhan ||
    input?.maBenhNhan ||
    input?.id ||
    input?.pid ||null,
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
      input.accountStatus,

    // Trạng thái trong ngày (BE field: TrangThaiHomNay)
    TrangThaiHomNay:
      input.TrangThaiHomNay ??
      input.trangThaiHomNay ??
      input.status,
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
      // ✅ Trả về PagedResult đầy đủ
      const itemsRaw = res?.Items ?? res?.items ?? [];
      const arr = Array.isArray(itemsRaw) ? itemsRaw : [];
      return {
        Items: arr.map((x) => normalizePatientFields(x)),
        TotalItems: res?.TotalItems ?? res?.totalItems ?? arr.length,
        Page: res?.Page ?? res?.page ?? (params.page ?? 1),
        PageSize: res?.PageSize ?? res?.pageSize ?? (params.pageSize ?? 50),
      };
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
      qc.invalidateQueries({ queryKey: ["invoices"], exact: false });
      qc.invalidateQueries({ queryKey: ["queue"], exact: false });
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
