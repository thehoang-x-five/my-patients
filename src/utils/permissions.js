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

export const isAdmin = (user) => getUserRole(user) === "admin";

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
  userManagement: (u) => isAdmin(u),                                                // Chỉ Admin
  prescriptions:  () => true,                                                       // Tất cả
  history:        () => true,                                                       // Tất cả
  notifications:  () => true,                                                       // Tất cả
  reports:        () => true,                                                       // Tất cả
};

// ==================== TẦNG 5: ACTION-LEVEL PERMISSIONS ====================

// -- Lịch hẹn --
export const canCreateAppointment = (u) => isReceptionNurse(u);
export const canEditAppointment   = (u) => isReceptionNurse(u);
export const canViewAppointment   = (u) => isReceptionNurse(u) || isAdmin(u);

// -- Bệnh nhân --
export const canCreatePatient = (u) => isReceptionNurse(u) || isAdmin(u);
export const canEditPatient   = (u) => isReceptionNurse(u) || isAdmin(u);

// -- Khám bệnh --
export const canManageClinical = (u) => isAdmin(u) || isDoctor(u) || isClinicalNurse(u) || isReceptionNurse(u);
export const canManageCls      = (u) => isAdmin(u) || isTechnician(u) || isClsNurse(u) || isReceptionNurse(u);
export const canCallPatient    = (u) => canManageClinical(u) || canManageCls(u) || isReceptionNurse(u);

// -- Khoa phòng --
export const canEditDepartment = (u) => isAdmin(u);

// -- Nhân sự --
export const canManageStaff = (u) => isAdmin(u);

// -- Đơn thuốc --
export const canPrescribe = (u) => isDoctor(u);
export const canDispenseMedicine = (u) => isReceptionNurse(u) || isAdmin(u);

// -- Báo cáo --
export const canViewRevenueReport = (u) => isAdmin(u) || isReceptionNurse(u);
export const canViewVisitReport   = (u) => isAdmin(u) || isDoctor(u);
export const canViewStaffReport   = (u) => isAdmin(u);

// -- Tiếp nhận (composite) --
export const canManageReception = (u) => isAdmin(u) || isReceptionNurse(u);

// -- Thông báo --
export const canManageNotifications = (u) => isAdmin(u);

// ==================== COMPONENT HELPERS ====================

/** Kiểm tra user có quyền read-only trên module không */
export const isReadOnly = (u, module) => {
  switch (module) {
    case 'appointments':
      return isAdmin(u); // Admin chỉ xem, không thao tác
    case 'patients':
      return !canEditPatient(u); // Non-YTHC/Admin chỉ xem
    case 'departments':
      return !isAdmin(u); // Non-Admin chỉ xem
    case 'staff':
      return !isAdmin(u); // Non-Admin chỉ xem
    case 'prescriptions':
      // Bác sĩ: kê đơn. Y tá HC: phát thuốc. Còn lại: xem
      return !isDoctor(u) && !isReceptionNurse(u) && !isAdmin(u);
    default:
      return false;
  }
};

/** User có global data scope không? (Admin + Y tá HC = toàn phòng khám) */
export const hasGlobalScope = (u) => isAdmin(u) || isReceptionNurse(u);

/** Lấy tên scope hiển thị cho user */
export const getScopeLabel = (u) => {
  if (hasGlobalScope(u)) return null; // Không cần badge
  const khoa = u?.TenKhoa || u?.tenKhoa || u?.MaKhoa || u?.maKhoa || null;
  return khoa ? `Khoa: ${khoa}` : 'Giới hạn theo phân quyền';
};
