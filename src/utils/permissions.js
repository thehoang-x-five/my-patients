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
  const r = user?.ChucVu || user?.chucVu || user?.role || "";
  return r.toString().toLowerCase().trim();
};

export const getNurseType = (user) => {
  const t = user?.LoaiYTa || user?.loaiYTa || user?.nurseType || "";
  return t.toString().toLowerCase().replace(/_/g, "").trim();
};

// Kiểm tra quyền
export const isAdmin = (user) => {
  return getUserRole(user) === "admin";
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

// Quyền tiếp nhận (Lịch hẹn + Bệnh nhân)
export const canManageReception = (user) => {
  return isAdmin(user) || isReceptionNurse(user);
};

// Quyền khám lâm sàng
export const canManageClinical = (user) => {
  return isAdmin(user) || isDoctor(user) || isClinicalNurse(user) || isReceptionNurse(user);
};

// Quyền khám CLS
export const canManageCls = (user) => {
  return isAdmin(user) || isTechnician(user) || isClsNurse(user) || isReceptionNurse(user);
};

// Quyền gọi vào khám
export const canCallPatient = (user) => {
  return canManageClinical(user) || canManageCls(user) || isReceptionNurse(user);
};
