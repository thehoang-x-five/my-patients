// src/api/auth.js
import { post } from "./http";

// Chuẩn hóa response AuthTokenResponse từ BE
function normalizeAuthResponse(raw) {
  if (!raw) return null;

  const data = raw.data ?? raw; // phòng trường hợp axios trả { data: ... }

  // Token
  const accessToken =
    data.accessToken || data.AccessToken || data.token || data.access_token || null;
  const refreshToken =
    data.refreshToken || data.RefreshToken || data.refresh_token || null;

  const accessTokenExpiresAt =
    data.accessTokenExpiresAt || data.AccessTokenExpiresAt || null;
  const refreshTokenExpiresAt =
    data.refreshTokenExpiresAt || data.RefreshTokenExpiresAt || null;

  // Ưu tiên object NhanVien nếu có, fallback flatten
  const staffRaw =
    data.nhanVien ||
    data.NhanVien ||
    null;

  const base = {
    maNhanVien:
      staffRaw?.maNhanVien ||
      staffRaw?.MaNhanVien ||
      data.maNhanVien ||
      data.MaNhanVien ||
      "",
    tenDangNhap:
      staffRaw?.tenDangNhap ||
      staffRaw?.TenDangNhap ||
      data.tenDangNhap ||
      data.TenDangNhap ||
      "",
    hoTen:
      staffRaw?.hoTen ||
      staffRaw?.HoTen ||
      data.hoTen ||
      data.HoTen ||
      "",
    vaiTro:
      staffRaw?.vaiTro ||
      staffRaw?.VaiTro ||
      data.vaiTro ||
      data.VaiTro ||
      "",
    maKhoa:
      staffRaw?.maKhoa ||
      staffRaw?.MaKhoa ||
      data.maKhoa ||
      data.MaKhoa ||
      null,
    email:
      staffRaw?.email ||
      staffRaw?.Email ||
      data.email ||
      data.Email ||
      null,
    dienThoai:
      staffRaw?.dienThoai ||
      staffRaw?.DienThoai ||
      data.dienThoai ||
      data.DienThoai ||
      null,
    trangThaiCongTac:
      staffRaw?.trangThaiCongTac ||
      staffRaw?.TrangThaiCongTac ||
      data.trangThaiCongTac ||
      data.TrangThaiCongTac ||
      "",
    loaiYTa:
      staffRaw?.loaiYTa ||
      staffRaw?.LoaiYTa ||
      data.loaiYTa ||
      data.LoaiYTa ||
      null,
    soNamKinhNghiem:
      staffRaw?.soNamKinhNghiem ||
      staffRaw?.SoNamKinhNghiem ||
      data.soNamKinhNghiem ||
      data.SoNamKinhNghiem ||
      0,
    chuyenMon:
      staffRaw?.chuyenMon ||
      staffRaw?.ChuyenMon ||
      data.chuyenMon ||
      data.ChuyenMon ||
      null,
    hocVi:
      staffRaw?.hocVi ||
      staffRaw?.HocVi ||
      data.hocVi ||
      data.HocVi ||
      null,
    anhDaiDien:
      staffRaw?.anhDaiDien ||
      staffRaw?.AnhDaiDien ||
      data.anhDaiDien ||
      data.AnhDaiDien ||
      null,
    moTa:
      staffRaw?.moTa ||
      staffRaw?.MoTa ||
      data.moTa ||
      data.MoTa ||
      null,
  };

  // Shape chuẩn cho FE (SettingsScreen, topbar, v.v.)
  const staff = {
    // BE gốc
    maNhanVien: base.maNhanVien,
    tenDangNhap: base.tenDangNhap,
    hoTen: base.hoTen,
    vaiTro: base.vaiTro,
    maKhoa: base.maKhoa,
    email: base.email,
    dienThoai: base.dienThoai,
    trangThaiCongTac: base.trangThaiCongTac,
    loaiYTa: base.loaiYTa,
    soNamKinhNghiem: base.soNamKinhNghiem,
    chuyenMon: base.chuyenMon,
    hocVi: base.hocVi,
    anhDaiDien: base.anhDaiDien,
    moTa: base.moTa,

    // Alias cho FE:
    id: base.maNhanVien,
    code: base.maNhanVien,
    maNhanSu: base.maNhanVien,   // SettingsScreen.staffCode ưu tiên field này
    staffCode: base.maNhanVien,

    username: base.tenDangNhap,
    userName: base.tenDangNhap,

    name: base.hoTen,
    role: base.vaiTro,

    dept: base.maKhoa,
    department: base.maKhoa,

    avatar: base.anhDaiDien,
    phone: base.dienThoai,
  };

  const user = staff;

  return {
    accessToken,
    refreshToken,
    accessTokenExpiresAt,
    refreshTokenExpiresAt,
    staff,
    user,
  };
}


/**
 * Login: POST /api/auth/login
 * Body chuẩn: { TenDangNhap, MatKhau }
 */
export async function loginApi({ username, password }) {
  const payload = {
    TenDangNhap: username,
    MatKhau: password,
  };
  const data = await post("/auth/login", payload);
  return normalizeAuthResponse(data);
}

/**
 * Refresh: POST /api/auth/refresh
 * Không có body.
 */
export async function refreshApi() {
  const data = await post("/auth/refresh");
  return normalizeAuthResponse(data);
}

/**
 * Forgot password: POST /api/auth/forgot-password
 * Body: { TenDangNhap, MatKhauMoi, Email, OtpIntentId }
 */
export async function forgotPasswordApi({
  username,
  email,
  newPassword,
  otpIntentId,
}) {
  const payload = {
    TenDangNhap: username,
    MatKhauMoi: newPassword,
    Email: email,
    OtpIntentId: otpIntentId,
  };
  // Không cần đọc body, 200/204 là thành công
  await post("/auth/forgot-password", payload);
}

/**
 * Change password: POST /api/auth/change-password
 * Body: { CurrentPassword, NewPassword, ConfirmPassword, OtpIntentId }
 */
export async function changePasswordApi({
  currentPassword,
  newPassword,
  confirmPassword,
  otpIntentId,
}) {
  const payload = {
    CurrentPassword: currentPassword,
    NewPassword: newPassword,
    ConfirmPassword: confirmPassword,
    OtpIntentId: otpIntentId,
  };
  await post("/auth/change-password", payload);
}

/**
 * Logout: POST /api/auth/logout
 * Body optional: { RefreshToken }
 * → FE sẽ gửi refreshToken hiện tại nếu có.
 */
export async function logoutApi(refreshToken) {
  const payload = refreshToken ? { RefreshToken: refreshToken } : {};
  try {
    await post("/auth/logout", payload);
  } catch {
    // Nếu token hết hạn / lỗi mạng thì vẫn coi là đã logout ở FE
  }
}
