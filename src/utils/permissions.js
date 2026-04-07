// src/utils/permissions.js
// Ma trận phân quyền 7 tầng — Week 4 RBAC upgrade
// Tầng 1: Menu Visibility (TAB_VISIBILITY)
// Tầng 2: Route Guard (ProtectedRoute)
// Tầng 3: Page-level permission
// Tầng 4: Component-level permission
// Tầng 5: Action-level permission (canCreate*, canEdit*, canDelete*)
// Tầng 6-7: Data scope (BE xử lý, FE hiện hint)

import { VAI_TRO, LOAI_Y_TA } from '../constants/enums.js';

// ==================== ROLE GETTERS ====================

export const ROLES = VAI_TRO;
export const NURSE_TYPES = LOAI_Y_TA;

/** Lấy vai trò từ user object — tương thích cả model cũ (ChucVu) lẫn mới (VaiTro) */
export const getUserRole = (user) => {
  const r = user?.VaiTro || user?.vaiTro || user?.vai_tro
         || user?.ChucVu || user?.chucVu || user?.role || "";
  return r.toString().toLowerCase().trim();
};

/** Lấy loại y tá — tương thích cả snake_case JWT claim lẫn camelCase store */
export const getNurseType = (user) => {
  const t = user?.LoaiYTa || user?.loaiYTa || user?.loai_y_ta
         || user?.nurseType || "";
  return t.toString().toLowerCase().replace(/_/g, "").trim();
};

// ==================== ROLE CHECKS ====================

export const isAdmin = (user) => {
  const r = getUserRole(user);
  return r === "admin" || r === "quan_tri_vien";
};

export const isDoctor = (user) => {
  const r = getUserRole(user);
  return r === "bac_si" || r === "doctor";
};

export const isNurse = (user) => {
  const r = getUserRole(user);
  return r === "y_ta" || r === "nurse";
};

export const isReceptionNurse = (user) => {
  const t = getNurseType(user);
  return isNurse(user) && (t === "hanhchinh" || t === "hc");
};

export const isClinicalNurse = (user) => {
  const t = getNurseType(user);
  return isNurse(user) && (t === "phongkham" || t === "lamsang" || t === "pk" || t === "ls");
};

export const isClsNurse = (user) => {
  const t = getNurseType(user);
  return isNurse(user) && (t === "canlamsang" || t === "cls");
};

export const isTechnician = (user) => {
  const r = getUserRole(user);
  return r === "ky_thuat_vien" || r === "kythuatvien" || r === "ktv" || r === "technician";
};

// ==================== TẦNG 1: TAB / MENU VISIBILITY ====================
// Quy tắc theo prompt.txt Section II — ma trận mới

export const TAB_VISIBILITY = {
  overview:       () => true,                                                       // Tất cả
  appointments:   (u) => isReceptionNurse(u) || isAdmin(u),                         // Y tá HC + Admin
  patients:       () => true,                                                       // Tất cả
  examination:    () => true,                                                       // Tất cả
  departments:    () => true,                                                       // Tất cả
  staff:          () => true,                                                       // Tất cả
  adminUsers:     (u) => isAdmin(u),                                                // Chỉ admin
  // userManagement: ❌ HỦY — gộp vào staff page (admin toggle Card↔Table)
  prescriptions:  () => true,                                                       // Tất cả
  history:        () => true,                                                       // Tất cả
  notifications:  () => true,                                                       // Tất cả
  reports:        (u) => isAdmin(u) || isDoctor(u) || isReceptionNurse(u),          // Admin + Bác sĩ + Y tá HC
  settings:       () => true,                                                       // Tất cả
};

// ==================== TẦNG 5: ACTION-LEVEL PERMISSIONS ====================

// -- Lịch hẹn --
export const canCreateAppointment = (u) => isReceptionNurse(u);
export const canEditAppointment   = (u) => isReceptionNurse(u);
export const canViewAppointment   = (u) => isReceptionNurse(u) || isAdmin(u);

// -- Bệnh nhân --
// ✅ Admin KHÔNG tạo/sửa BN — chỉ YTHC thao tác nghiệp vụ
export const canCreatePatient = (u) => isReceptionNurse(u);
export const canEditPatient   = (u) => isReceptionNurse(u);

// -- Khám bệnh --
export const canManageClinical = (u) => isDoctor(u) || isClinicalNurse(u);
export const canManageCls      = (u) => isTechnician(u) || isClsNurse(u);
// ✅ Chỉ nhân viên lâm sàng/CLS mới gọi BN — Admin/YTHC chỉ giám sát
export const canCallPatient    = (u) => canManageClinical(u) || canManageCls(u);
export const canCancelClinicalVisit = (u) => isDoctor(u) || isClinicalNurse(u);
export const canCancelClsOrder = (u) => isDoctor(u) || isClinicalNurse(u);

// ✅ Y tá LS được nhập liệu hỗ trợ BS (chẩn đoán, xuất CLS, hoàn tất)
export const canEnterExamData  = (u) => isDoctor(u) || isClinicalNurse(u);
// ✅ Y tá CLS / KTV nhập kết quả CLS
export const canEnterClsResult = (u) => isClsNurse(u) || isTechnician(u);

// -- Khoa phòng --
export const canEditDepartment = (u) => isAdmin(u);

// -- Nhân sự / Staff page --
export const canManageStaff = (u) => isAdmin(u);
export const canViewStaffAuth = (u) => isAdmin(u);           // Thấy auth fields (username, vai trò, trạng thái TK)
export const canToggleStaffView = (u) => isAdmin(u);         // Toggle Card ↔ Table view
export const canLockUnlockStaff = (u) => isAdmin(u);         // Khóa/Mở khóa tài khoản
export const canResetStaffPassword = (u) => isAdmin(u);      // Reset mật khẩu

// -- Đơn thuốc --
export const canPrescribe = (u) => isDoctor(u);
export const canDispenseMedicine = (u) => isReceptionNurse(u) || isAdmin(u);
// ✅ Hủy đơn: Admin + YTHC (phát thuốc) + BS
export const canCancelPrescription = (u) =>
  isAdmin(u) || isReceptionNurse(u) || isDoctor(u);
// ✅ Quản lý kho: Admin + YTHC
export const canEditStock = (u) => isReceptionNurse(u) || isAdmin(u);

// -- Báo cáo --
// ✅ Y tá hành chính được xem báo cáo y khoa, nhưng không xem doanh thu
export const canViewReports      = (u) => isAdmin(u) || isDoctor(u) || isReceptionNurse(u);
export const canViewRevenueReport = (u) => isAdmin(u) || isDoctor(u);
export const canViewVisitReport   = (u) => canViewReports(u);
export const canViewStaffReport   = (u) => isAdmin(u);

// -- Tiếp nhận (composite) --
export const canManageReception = (u) => isReceptionNurse(u);

// -- Thông báo --
export const canManageNotifications = (u) => isAdmin(u);

// ==================== COMPONENT HELPERS ====================

/** Kiểm tra user có quyền read-only trên module không */
export const isReadOnly = (u, module) => {
  switch (module) {
    case 'appointments':
      return !isReceptionNurse(u); // ✅ Chỉ YTHC thao tác — Admin chỉ xem
    case 'patients':
      return !canEditPatient(u); // Chỉ YTHC sửa
    case 'departments':
      return !isAdmin(u);
    case 'staff':
      return !isAdmin(u);
    case 'prescriptions':
      // Admin: quản trị thuốc/kho. BS: kê đơn. YTHC: phát thuốc + quản kho. Còn lại: read-only
      return !isAdmin(u) && !isDoctor(u) && !isReceptionNurse(u);
    default:
      return false;
  }
};

/** User có global data scope không? (Admin + Y tá HC = toàn phòng khám) */
export const hasGlobalScope = (u) => isAdmin(u) || isReceptionNurse(u);

const DEPARTMENT_LABELS = {
  KHOA_XN: "Khoa xét nghiệm",
  KHOA_NOI: "Khoa nội",
  KHOA_NGOAI: "Khoa ngoại",
  KHOA_TM: "Khoa tim mạch",
  KHOA_NHI: "Khoa nhi",
  KHOA_SAN: "Khoa sản",
  KHOA_MAT: "Khoa mắt",
  KHOA_TMH: "Khoa tai mũi họng",
  KHOA_RHM: "Khoa răng hàm mặt",
  KHOA_DL: "Khoa da liễu",
  KHOA_CLS: "Khoa cận lâm sàng",
  XN: "Khoa xét nghiệm",
  CLS: "Khoa cận lâm sàng",
};

export const formatDepartmentLabel = (value) => {
  if (!value) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  if (/\s/.test(raw) && /[a-zA-ZÀ-ỹ]/.test(raw)) {
    return raw;
  }

  const normalized = raw
    .replace(/-/g, "_")
    .replace(/\s+/g, "_")
    .toUpperCase();

  if (DEPARTMENT_LABELS[normalized]) {
    return DEPARTMENT_LABELS[normalized];
  }

  const compact = normalized.replace(/^KHOA_/, "");
  if (DEPARTMENT_LABELS[compact]) {
    return DEPARTMENT_LABELS[compact];
  }

  const humanized = normalized
    .replace(/^KHOA_/, "")
    .split("_")
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (lower === "xn") return "xét nghiệm";
      if (lower === "cls") return "cận lâm sàng";
      if (lower === "tmh") return "tai mũi họng";
      if (lower === "rhm") return "răng hàm mặt";
      if (lower === "dl") return "da liễu";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");

  return humanized ? `Khoa ${humanized}` : raw;
};

/** Lấy tên scope hiển thị cho user */
export const getScopeLabel = (u) => {
  if (hasGlobalScope(u)) return null; // Không cần badge
  const khoa = u?.TenKhoa || u?.tenKhoa || u?.MaKhoa || u?.maKhoa || null;
  return khoa ? `Khoa: ${khoa}` : 'Giới hạn theo phân quyền';
};
