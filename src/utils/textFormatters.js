import { getCurrentLanguage, pickLocalizedLabel } from "./i18n.js";

const LOCALIZED_LABELS = {
  admin: { vi: "Admin", en: "Admin" },
  quan_tri_vien: { vi: "Quản trị viên", en: "Administrator" },
  bac_si: { vi: "Bác sĩ", en: "Doctor" },
  y_ta: { vi: "Y tá", en: "Nurse" },
  ky_thuat_vien: { vi: "Kỹ thuật viên", en: "Technician" },

  hanhchinh: { vi: "Hành chính", en: "Administrative" },
  hanh_chinh: { vi: "Hành chính", en: "Administrative" },
  y_ta_hanh_chinh: { vi: "Y tá hành chính", en: "Administrative nurse" },
  lam_sang: { vi: "Lâm sàng", en: "Clinical" },
  y_ta_lam_sang: { vi: "Y tá lâm sàng", en: "Clinical nurse" },
  can_lam_sang: { vi: "Cận lâm sàng", en: "Paraclinical" },
  y_ta_can_lam_sang: { vi: "Y tá cận lâm sàng", en: "Paraclinical nurse" },

  kham_lam_sang: { vi: "Khám lâm sàng", en: "Clinical examination" },
  xet_nghiem: { vi: "Xét nghiệm", en: "Laboratory" },
  chan_doan_hinh_anh: { vi: "Chẩn đoán hình ảnh", en: "Imaging" },
  kham_benh: { vi: "Khám bệnh", en: "Examination" },
  kham_moi: { vi: "Khám mới", en: "New visit" },
  kham_theo_hen: { vi: "Khám theo hẹn", en: "Scheduled visit" },
  follow_up: { vi: "Tái khám", en: "Follow-up" },
  tai_kham: { vi: "Tái khám", en: "Follow-up" },
  don_thuoc: { vi: "Đơn thuốc", en: "Prescription" },
  thuoc: { vi: "Thuốc", en: "Medicine" },
  thanh_toan: { vi: "Thanh toán", en: "Payment" },
  dich_vu: { vi: "Dịch vụ", en: "Service" },

  cho_tiep_nhan: { vi: "Chờ tiếp nhận", en: "Waiting intake" },
  cho_kham: { vi: "Chờ khám", en: "Waiting examination" },
  cho_kham_dv: { vi: "Chờ khám dịch vụ", en: "Waiting service examination" },
  dang_cho: { vi: "Đang chờ", en: "Waiting" },
  dang_kham: { vi: "Đang khám", en: "In examination" },
  cho_xu_ly: { vi: "Chờ xử lý", en: "Pending" },
  cho_goi: { vi: "Chờ gọi", en: "Waiting call" },
  dang_goi: { vi: "Đang gọi", en: "Calling" },
  dang_thuc_hien: { vi: "Đang thực hiện", en: "In progress" },
  cho_ket_qua: { vi: "Chờ kết quả", en: "Waiting result" },
  da_phuc_vu: { vi: "Đã phục vụ", en: "Served" },
  hoan_thanh: { vi: "Hoàn thành", en: "Completed" },
  hoan_tat: { vi: "Hoàn tất", en: "Completed" },
  da_hoan_tat: { vi: "Đã hoàn tất", en: "Completed" },
  da_huy: { vi: "Đã hủy", en: "Cancelled" },
  da_lap: { vi: "Đã lập", en: "Created" },
  da_lap_chan_doan: { vi: "Đã lập chẩn đoán", en: "Diagnosed" },
  da_ke: { vi: "Đã kê", en: "Prescribed" },
  cho_phat: { vi: "Chờ phát", en: "Waiting dispense" },
  da_phat: { vi: "Đã phát", en: "Dispensed" },
  chua_thu: { vi: "Chưa thu", en: "Unpaid" },
  da_thu: { vi: "Đã thu", en: "Paid" },
  bao_luu: { vi: "Bảo lưu", en: "Reserved" },
  cho_ve: { vi: "Cho về", en: "Discharge home" },
  cho_thuoc_ve: { vi: "Cho thuốc về", en: "Home medication" },

  hoat_dong: { vi: "Hoạt động", en: "Active" },
  khong_hoat_dong: { vi: "Không hoạt động", en: "Inactive" },
  dang_cong_tac: { vi: "Đang công tác", en: "Working" },
  tam_nghi: { vi: "Tạm nghỉ", en: "On leave" },
  nghi_viec: { vi: "Nghỉ việc", en: "Inactive staff" },
  khoa: { vi: "Khóa", en: "Locked" },
  da_khoa: { vi: "Đã khóa", en: "Locked" },
  da_xoa: { vi: "Đã xóa", en: "Deleted" },
  tam_dung: { vi: "Tạm dừng", en: "Paused" },
  tam_ngung: { vi: "Tạm ngừng", en: "Paused" },
  het_han: { vi: "Hết hạn", en: "Expired" },
  sap_het_han: { vi: "Sắp hết hạn", en: "Near expiry" },
  sap_het_ton: { vi: "Sắp hết tồn", en: "Low stock" },

  online: { vi: "Online", en: "Online" },
  pause: { vi: "Tạm dừng", en: "Paused" },
  offline: { vi: "Offline", en: "Offline" },

  tien_mat: { vi: "Tiền mặt", en: "Cash" },
  chuyen_khoan: { vi: "Chuyển khoản", en: "Bank transfer" },
  the: { vi: "Thẻ", en: "Card" },
  vietqr: { vi: "VietQR", en: "VietQR" },

  phong_kham: { vi: "Phòng khám LS", en: "Clinical exam room" },
  phong_kham_ls: { vi: "Phòng khám LS", en: "Clinical exam room" },
  phong_dich_vu: { vi: "Phòng CLS", en: "Paraclinical room" },
  phong_cls: { vi: "Phòng CLS", en: "Paraclinical room" },
  khoa_tq: { vi: "Khoa tổng quát", en: "General department" },
  khoa_noi: { vi: "Khoa nội", en: "Internal medicine department" },
  khoa_ngoai: { vi: "Khoa ngoại", en: "Surgery department" },
  khoa_xn: { vi: "Khoa xét nghiệm", en: "Laboratory department" },
  khoa_cdha: { vi: "Khoa chẩn đoán hình ảnh", en: "Imaging department" },
  khoa_duoc: { vi: "Khoa dược", en: "Pharmacy department" },

  tong_quat: { vi: "Tổng quát", en: "General" },
  noi_tong_quat: { vi: "Nội tổng quát", en: "Internal medicine" },
  ngoai_tong_quat: { vi: "Ngoại tổng quát", en: "General surgery" },
  xet_nghiem_khoa: { vi: "Xét nghiệm", en: "Laboratory" },
  chan_doan_hinh_anh_khoa: { vi: "Chẩn đoán hình ảnh", en: "Imaging" },
  duoc: { vi: "Dược", en: "Pharmacy" },
  phong_kham_noi_01: { vi: "Phòng khám Nội 01", en: "Internal medicine room 01" },
  phong_kham_ngoai_01: { vi: "Phòng khám Ngoại 01", en: "Surgery room 01" },
  phong_xet_nghiem_01: { vi: "Phòng Xét nghiệm 01", en: "Laboratory room 01" },
  phong_chan_doan_hinh_anh_01: { vi: "Phòng Chẩn đoán hình ảnh 01", en: "Imaging room 01" },
  kham_noi_tong_quat: { vi: "Khám nội tổng quát", en: "Internal medicine visit" },
  kham_ngoai_tong_quat: { vi: "Khám ngoại tổng quát", en: "General surgery visit" },
  cong_thuc_mau: { vi: "Công thức máu", en: "Complete blood count" },
  x_quang_nguc: { vi: "X-quang ngực", en: "Chest X-ray" },
  sieu_am_bung: { vi: "Siêu âm bụng", en: "Abdominal ultrasound" },

  quan_tri_he_thong: { vi: "Quản trị hệ thống", en: "System administrator" },
  dieu_duong_hanh_chinh: { vi: "Điều dưỡng hành chính", en: "Administrative nurse" },
  dieu_duong_lam_sang_noi: { vi: "Điều dưỡng lâm sàng nội", en: "Clinical nurse - internal medicine" },
  dieu_duong_lam_sang_ngoai: { vi: "Điều dưỡng lâm sàng ngoại", en: "Clinical nurse - surgery" },
  dieu_duong_can_lam_sang: { vi: "Điều dưỡng cận lâm sàng", en: "Paraclinical nurse" },
  ky_thuat_vien_xet_nghiem: { vi: "Kỹ thuật viên xét nghiệm", en: "Lab technician" },
  ky_thuat_vien_chan_doan_hinh_anh: { vi: "Kỹ thuật viên chẩn đoán hình ảnh", en: "Imaging technician" },
  bs_noi_tong_quat: { vi: "BS Nội tổng quát", en: "Dr. Internal medicine" },
  bs_ngoai_tong_quat: { vi: "BS Ngoại tổng quát", en: "Dr. General surgery" },
};

function removeDiacritics(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function titleCaseWords(text) {
  return String(text)
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function hasVietnameseDiacritics(text) {
  return /[À-ỹ]/u.test(String(text || ""));
}

export function normalizeEnumKey(text) {
  return removeDiacritics(text)
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function resolveLabel(raw, lang) {
  const normalized = normalizeEnumKey(raw);
  if (!normalized) return "";

  if (LOCALIZED_LABELS[normalized]) {
    return pickLocalizedLabel(LOCALIZED_LABELS[normalized], lang);
  }

  if (normalized === "xet_nghiem") {
    return pickLocalizedLabel(LOCALIZED_LABELS.xet_nghiem, lang);
  }

  if (normalized === "chan_doan_hinh_anh") {
    return pickLocalizedLabel(LOCALIZED_LABELS.chan_doan_hinh_anh, lang);
  }

  if (normalized === "da_xac_nhan") {
    return pickLocalizedLabel({ vi: "Đã xác nhận", en: "Confirmed" }, lang);
  }

  if (normalized === "da_checkin") {
    return pickLocalizedLabel({ vi: "Đã check-in", en: "Checked in" }, lang);
  }

  return "";
}

export function formatLocalizedText(
  text,
  fallback = "",
  lang = getCurrentLanguage()
) {
  if (text == null || text === "") return fallback;

  if (typeof text === "object" && !Array.isArray(text)) {
    return pickLocalizedLabel(text, lang) || fallback;
  }

  const raw = String(text).trim();
  if (!raw) return fallback;

  const resolved = resolveLabel(raw, lang);
  if (resolved) return resolved;

  if (hasVietnameseDiacritics(raw)) return raw;

  if (/^[A-Z0-9_]+$/.test(raw)) {
    return titleCaseWords(normalizeEnumKey(raw).replace(/_/g, " "));
  }

  return raw;
}

export function formatVietnameseText(
  text,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(text, fallback, lang);
}

export function formatDisplayText(
  text,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(text, fallback, lang);
}

export function formatServiceType(
  serviceType,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(serviceType, fallback, lang);
}

export function formatStatus(status, fallback = "", lang = getCurrentLanguage()) {
  return formatLocalizedText(status, fallback, lang);
}

export function formatRoleLabel(role, fallback = "", lang = getCurrentLanguage()) {
  return formatLocalizedText(role, fallback, lang);
}

export function formatNurseTypeLabel(
  nurseType,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(nurseType, fallback, lang);
}

export function formatWorkStatusLabel(
  status,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(status, fallback, lang);
}

export function formatPresenceStatusLabel(
  status,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(status, fallback, lang);
}

export function formatPaymentMethodLabel(
  method,
  fallback = "",
  lang = getCurrentLanguage()
) {
  return formatLocalizedText(method, fallback, lang);
}

export function formatLocalizedMessage(
  message,
  fallback = "",
  lang = getCurrentLanguage()
) {
  if (message == null || message === "") return fallback;

  const raw = String(message);
  if (!raw.trim()) return fallback;

  const normalizeToken = (token) => {
    const formatted = formatLocalizedText(token, "", lang);
    return formatted && formatted !== token ? formatted : token;
  };

  return raw
    .replace(/'([^']+)'/g, (_, token) => `'${normalizeToken(token)}'`)
    .replace(/\b[a-z0-9]+(?:_[a-z0-9]+)+\b/gi, (token) => normalizeToken(token));
}

// Format currency to Vietnamese format
export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return "0đ";
  return `${Number(amount).toLocaleString("vi-VN")}đ`;
}

// Format date to Vietnamese format
export function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

// Format datetime to Vietnamese format
export function formatDateTime(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
