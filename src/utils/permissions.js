import { VAI_TRO, LOAI_Y_TA } from "../constants/enums.js";
import { getCurrentLanguage, pickLocalizedLabel } from "./i18n.js";
import { formatDisplayText, normalizeEnumKey } from "./textFormatters.js";

export const ROLES = VAI_TRO;
export const NURSE_TYPES = LOAI_Y_TA;

export function getUserRole(user) {
  const role =
    user?.VaiTro ||
    user?.vaiTro ||
    user?.vai_tro ||
    user?.ChucVu ||
    user?.chucVu ||
    user?.role ||
    "";
  return String(role).toLowerCase().trim();
}

export function getNurseType(user) {
  const nurseType =
    user?.LoaiYTa ||
    user?.loaiYTa ||
    user?.loai_y_ta ||
    user?.nurseType ||
    "";
  return normalizeEnumKey(nurseType).replace(/_/g, "");
}

export function isAdmin(user) {
  const role = getUserRole(user);
  return role === "admin" || role === "quan_tri_vien";
}

export function isDoctor(user) {
  const role = getUserRole(user);
  return role === "bac_si" || role === "doctor";
}

export function isNurse(user) {
  const role = getUserRole(user);
  return role === "y_ta" || role === "nurse";
}

export function isReceptionNurse(user) {
  const nurseType = getNurseType(user);
  return isNurse(user) && (nurseType === "hanhchinh" || nurseType === "hc");
}

export function isClinicalNurse(user) {
  const nurseType = getNurseType(user);
  return (
    isNurse(user) &&
    (nurseType === "phongkham" ||
      nurseType === "lamsang" ||
      nurseType === "pk" ||
      nurseType === "ls")
  );
}

export function isClsNurse(user) {
  const nurseType = getNurseType(user);
  return isNurse(user) && (nurseType === "canlamsang" || nurseType === "cls");
}

export function isTechnician(user) {
  const role = getUserRole(user);
  return (
    role === "ky_thuat_vien" ||
    role === "kythuatvien" ||
    role === "ktv" ||
    role === "technician"
  );
}

export const TAB_VISIBILITY = {
  overview: () => true,
  appointments: (user) => isReceptionNurse(user) || isAdmin(user),
  patients: () => true,
  examination: () => true,
  departments: () => true,
  staff: () => true,
  adminUsers: (user) => isAdmin(user),
  prescriptions: () => true,
  unpaidInvoices: (user) => isReceptionNurse(user) || isAdmin(user),
  history: () => true,
  notifications: () => true,
  reports: (user) =>
    isAdmin(user) || isDoctor(user) || isReceptionNurse(user),
  settings: () => true,
};

export const canCreateAppointment = (user) => isReceptionNurse(user);
export const canEditAppointment = (user) => isReceptionNurse(user);
export const canViewAppointment = (user) =>
  isReceptionNurse(user) || isAdmin(user);

export const canCreatePatient = (user) => isReceptionNurse(user);
export const canEditPatient = (user) => isReceptionNurse(user);

export const canManageClinical = (user) =>
  isDoctor(user) || isClinicalNurse(user);
export const canManageCls = (user) => isTechnician(user) || isClsNurse(user);
export const canCallPatient = (user) =>
  canManageClinical(user) || canManageCls(user);
export const canCancelClinicalVisit = (user) =>
  isDoctor(user) || isClinicalNurse(user);
export const canCancelClsOrder = (user) =>
  isDoctor(user) || isClinicalNurse(user);
export const canEnterExamData = (user) =>
  isDoctor(user) || isClinicalNurse(user);
export const canEnterClsResult = (user) =>
  isClsNurse(user) || isTechnician(user);

export const canEditDepartment = (user) => isAdmin(user);

export const canManageStaff = (user) => isAdmin(user);
export const canViewStaffAuth = (user) => isAdmin(user);
export const canToggleStaffView = (user) => isAdmin(user);
export const canLockUnlockStaff = (user) => isAdmin(user);
export const canResetStaffPassword = (user) => isAdmin(user);

export const canPrescribe = (user) => isDoctor(user);
export const canDispenseMedicine = (user) =>
  isReceptionNurse(user) || isAdmin(user);
export const canCancelPrescription = (user) =>
  isAdmin(user) || isReceptionNurse(user) || isDoctor(user);
export const canEditStock = (user) =>
  isReceptionNurse(user) || isAdmin(user);

export const canViewReports = (user) =>
  isAdmin(user) || isDoctor(user) || isReceptionNurse(user);
export const canViewRevenueReport = (user) =>
  isAdmin(user) || isDoctor(user);
export const canViewVisitReport = (user) => canViewReports(user);
export const canViewStaffReport = (user) => isAdmin(user);

export const canManageReception = (user) => isReceptionNurse(user);
export const canManageNotifications = (user) => isAdmin(user);

export function isReadOnly(user, module) {
  switch (module) {
    case "appointments":
      return !isReceptionNurse(user);
    case "patients":
      return !canEditPatient(user);
    case "departments":
      return !isAdmin(user);
    case "staff":
      return !isAdmin(user);
    case "prescriptions":
      return !isAdmin(user) && !isDoctor(user) && !isReceptionNurse(user);
    default:
      return false;
  }
}

export const hasGlobalScope = (user) =>
  isAdmin(user) || isReceptionNurse(user);

const DEPARTMENT_LABELS = {
  khoa_xn: { vi: "Khoa xét nghiệm", en: "Laboratory department" },
  khoa_tq: { vi: "Khoa tổng quát", en: "General department" },
  khoa_noi: { vi: "Khoa nội", en: "Internal medicine department" },
  khoa_ngoai: { vi: "Khoa ngoại", en: "Surgery department" },
  khoa_tm: { vi: "Khoa tim mạch", en: "Cardiology department" },
  khoa_nhi: { vi: "Khoa nhi", en: "Pediatrics department" },
  khoa_san: { vi: "Khoa sản", en: "Obstetrics department" },
  khoa_mat: { vi: "Khoa mắt", en: "Ophthalmology department" },
  khoa_tmh: { vi: "Khoa tai mũi họng", en: "ENT department" },
  khoa_rhm: { vi: "Khoa răng hàm mặt", en: "Dental department" },
  khoa_dl: { vi: "Khoa da liễu", en: "Dermatology department" },
  khoa_cls: { vi: "Khoa cận lâm sàng", en: "Paraclinical department" },
  khoa_cdha: { vi: "Khoa chẩn đoán hình ảnh", en: "Imaging department" },
  khoa_duoc: { vi: "Khoa dược", en: "Pharmacy department" },
  tq: { vi: "Khoa tổng quát", en: "General department" },
  xn: { vi: "Khoa xét nghiệm", en: "Laboratory department" },
  cls: { vi: "Khoa cận lâm sàng", en: "Paraclinical department" },
  cdha: { vi: "Khoa chẩn đoán hình ảnh", en: "Imaging department" },
  duoc: { vi: "Khoa dược", en: "Pharmacy department" },
};

export function formatDepartmentLabel(
  value,
  lang = getCurrentLanguage()
) {
  if (!value) return null;

  const raw = String(value).trim();
  if (!raw) return null;

  const normalized = normalizeEnumKey(raw);

  if (DEPARTMENT_LABELS[normalized]) {
    return pickLocalizedLabel(DEPARTMENT_LABELS[normalized], lang);
  }

  const compact = normalized.replace(/^khoa_/, "");
  if (DEPARTMENT_LABELS[compact]) {
    return pickLocalizedLabel(DEPARTMENT_LABELS[compact], lang);
  }

  return formatDisplayText(raw, raw, lang);
}

export function getScopeLabel(user) {
  if (hasGlobalScope(user)) return null;

  const lang = getCurrentLanguage();
  const department =
    user?.TenKhoa || user?.tenKhoa || user?.MaKhoa || user?.maKhoa || null;

  if (!department) {
    return lang === "en"
      ? "Restricted by permission scope"
      : "Giới hạn theo phân quyền";
  }

  const label = formatDepartmentLabel(department, lang);
  return lang === "en" ? `Department: ${label}` : `Khoa: ${label}`;
}
