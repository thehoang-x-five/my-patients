// Vai trò
export const ROLES = {
  ADMIN: 'admin',
  BAC_SI: 'bac_si',
  Y_TA: 'y_ta',
  KY_THUAT_VIEN: 'ky_thuat_vien',
};

// Loại Y tá
export const NURSE_TYPES = {
  HANH_CHINH: 'hanhchinh',
  PHONG_KHAM: 'phong_kham',
  CAN_LAM_SANG: 'can_lam_sang',
};

// Lấy thông tin user từ store
export const getUserRole = (user) => {
  return user?.ChucVu || user?.chucVu || user?.role || null;
};

export const getNurseType = (user) => {
  return user?.LoaiYTa || user?.loaiYTa || user?.nurseType || null;
};

// Kiểm tra quyền
export const isAdmin = (user) => {
  return getUserRole(user) === ROLES.ADMIN;
};

export const isDoctor = (user) => {
  return getUserRole(user) === ROLES.BAC_SI;
};

export const isNurse = (user) => {
  return getUserRole(user) === ROLES.Y_TA;
};

export const isReceptionNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.HANH_CHINH;
};

export const isClinicalNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.PHONG_KHAM;
};

export const isClsNurse = (user) => {
  return isNurse(user) && getNurseType(user) === NURSE_TYPES.CAN_LAM_SANG;
};

export const isTechnician = (user) => {
  return getUserRole(user) === ROLES.KY_THUAT_VIEN;
};

// Quyền tiếp nhận (Lịch hẹn + Bệnh nhân)
export const canManageReception = (user) => {
  return isAdmin(user) || isReceptionNurse(user);
};

// Quyền khám lâm sàng
export const canManageClinical = (user) => {
  return isAdmin(user) || isDoctor(user) || isClinicalNurse(user);
};

// Quyền khám CLS
export const canManageCls = (user) => {
  return isAdmin(user) || isTechnician(user) || isClsNurse(user);
};

// Quyền gọi vào khám
export const canCallPatient = (user) => {
  return canManageClinical(user) || canManageCls(user);
};
