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
  return {
    id: dto.maNhanVien ?? "",
    username: dto.tenDangNhap ?? "",
    name: dto.hoTen ?? "",
    role: dto.vaiTro ?? "",
    roleLabel: roleLabels[dto.vaiTro] ?? dto.vaiTro ?? "",
    position: dto.chucVu ?? "",
    nurseType: dto.loaiYTa ?? null,
    email: dto.email ?? "",
    phone: dto.dienThoai ?? "",
    specialty: dto.chuyenMon ?? "",
    degree: dto.hocVi ?? "",
    experience: dto.soNamKinhNghiem ?? 0,
    departmentId: dto.maKhoa ?? "",
    departmentName: dto.tenKhoa ?? "",
    status: dto.trangThaiCongTac ?? "dang_cong_tac",
    statusLabel: statusLabels[dto.trangThaiCongTac] ?? dto.trangThaiCongTac ?? "",
    statusColor: statusColors[dto.trangThaiCongTac] ?? "gray",
    avatar: dto.anhDaiDien ?? null,
    // raw DTO
    _raw: dto,
  };
}

/** ================== HOOKS ================== */

const ADMIN_USERS_KEY = "admin-users";

export function useAdminUsers(filter = {}) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: [ADMIN_USERS_KEY, filter],
    queryFn: () => fetchAdminUsers(filter),
    select: (data) => ({
      ...data,
      items: (data.items || []).map(normalizeStaff),
    }),
    staleTime: 30_000,
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

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => resetAdminUserPassword(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
  });
}
