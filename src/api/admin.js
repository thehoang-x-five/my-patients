// src/api/admin.js
// API & hooks cho trang Quản lý nhân sự (Admin CRUD)

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, post, put } from "./http.js";
import { on } from "./realtime.js";
import { useEffect } from "react";

/** ================== API CALLS ================== */

const BASE = "/admin/users";

export const fetchAdminUsers = (filter = {}) => {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.vaiTro) params.set("vaiTro", filter.vaiTro);
  if (filter.loaiYTa) params.set("loaiYTa", filter.loaiYTa);
  if (filter.trangThai) params.set("trangThai", filter.trangThai);
  if (filter.maKhoa) params.set("maKhoa", filter.maKhoa);
  params.set("page", String(filter.page || 1));
  params.set("pageSize", String(filter.pageSize || 20));
  return get(`${BASE}?${params.toString()}`);
};

export const fetchAdminUser = (id) => get(`${BASE}/${id}`);

export const createAdminUser = (data) => post(BASE, data);

export const updateAdminUser = (id, data) => put(`${BASE}/${id}`, data);

export const updateAdminUserStatus = (id, data) =>
  put(`${BASE}/${id}/status`, data);

export const lockUnlockAccount = (id, data) =>
  put(`${BASE}/${id}/lock-status`, data);

export const resetAdminUserPassword = (id, data) =>
  post(`${BASE}/${id}/reset-password`, data);

/** ================== NORMALIZE ================== */

const roleLabels = {
  admin: "Admin",
  bac_si: "Bác sĩ",
  y_ta: "Y tá",
  ky_thuat_vien: "Kỹ thuật viên",
};

const statusLabels = {
  dang_cong_tac: "Đang công tác",
  tam_nghi: "Tạm nghỉ",
  nghi_viec: "Nghỉ việc",
};

const statusColors = {
  dang_cong_tac: "green",
  tam_nghi: "amber",
  nghi_viec: "red",
};

export function normalizeStaff(dto = {}) {
  const id = dto.MaNhanVien ?? dto.maNhanVien ?? "";
  const username = dto.TenDangNhap ?? dto.tenDangNhap ?? "";
  const name = dto.HoTen ?? dto.hoTen ?? "";
  const role = dto.VaiTro ?? dto.vaiTro ?? "";
  const position = dto.ChucVu ?? dto.chucVu ?? "";
  const nurseType = dto.LoaiYTa ?? dto.loaiYTa ?? null;
  const email = dto.Email ?? dto.email ?? "";
  const phone = dto.DienThoai ?? dto.dienThoai ?? "";
  const specialty = dto.ChuyenMon ?? dto.chuyenMon ?? "";
  const degree = dto.HocVi ?? dto.hocVi ?? "";
  const experience = Number(dto.SoNamKinhNghiem ?? dto.soNamKinhNghiem ?? 0) || 0;
  const departmentId = dto.MaKhoa ?? dto.maKhoa ?? "";
  const departmentName = dto.TenKhoa ?? dto.tenKhoa ?? "";
  const workStatus = dto.TrangThaiCongTac ?? dto.trangThaiCongTac ?? "dang_cong_tac";
  const accountStatus = dto.TrangThaiTaiKhoan ?? dto.trangThaiTaiKhoan ?? "hoat_dong";
  const avatar = dto.AnhDaiDien ?? dto.anhDaiDien ?? null;

  return {
    id,
    maNhanVien: id,
    username,
    tenDangNhap: username,
    name,
    hoTen: name,
    role,
    vaiTro: role,
    roleLabel: roleLabels[role] ?? role ?? "",
    position,
    chucVu: position,
    nurseType,
    loaiYTa: nurseType,
    email,
    phone,
    dienThoai: phone,
    specialty,
    chuyenMon: specialty,
    degree,
    hocVi: degree,
    experience,
    soNamKinhNghiem: experience,
    departmentId,
    maKhoa: departmentId,
    departmentName,
    dept: departmentName,
    tenKhoa: departmentName,
    status: workStatus,
    trangThaiCongTac: workStatus,
    statusLabel: statusLabels[workStatus] ?? workStatus ?? "",
    statusColor: statusColors[workStatus] ?? "gray",
    trangThaiTaiKhoan: accountStatus,
    statusAccount: accountStatus,
    avatar,
    anhDaiDien: avatar,
    _raw: dto,
  };
}

function normalizeAdminUsersResponse(data = {}) {
  const rawItems = data?.Items ?? data?.items ?? [];
  const items = Array.isArray(rawItems) ? rawItems.map(normalizeStaff) : [];

  return {
    ...data,
    Items: items,
    items,
    TotalItems: data?.TotalItems ?? data?.totalItems ?? items.length,
    totalItems: data?.TotalItems ?? data?.totalItems ?? items.length,
    Page: data?.Page ?? data?.page ?? 1,
    page: data?.Page ?? data?.page ?? 1,
    PageSize: data?.PageSize ?? data?.pageSize ?? items.length,
    pageSize: data?.PageSize ?? data?.pageSize ?? items.length,
  };
}

/** ================== HOOKS ================== */

const ADMIN_USERS_KEY = "admin-users";

export function useAdminUsers(filter = {}, options = {}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [ADMIN_USERS_KEY, filter],
    queryFn: () => fetchAdminUsers(filter),
    select: normalizeAdminUsersResponse,
    enabled: options.enabled ?? true,
    staleTime: 30_000,
    ...options,
  });

  // Realtime: auto-refresh khi có StaffChanged
  useEffect(() => {
    const off = on("StaffChanged", () => {
      qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
    });
    return off;
  }, [qc]);

  return query;
}

export function useAdminUser(id) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, id],
    queryFn: () => fetchAdminUser(id),
    enabled: !!id,
    select: normalizeStaff,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createAdminUser(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminUser(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminUserStatus(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useLockUnlockAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => lockUnlockAccount(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => resetAdminUserPassword(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}
