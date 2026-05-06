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

function getStaffId(dto = {}) {
  return dto?.MaNhanVien ?? dto?.maNhanVien ?? dto?.id ?? dto?.maNhanSu ?? "";
}

function toPresenceStatus(workStatus) {
  const value = String(workStatus || "").trim().toLowerCase();
  if (value === "dang_cong_tac") return "online";
  if (value === "tam_nghi") return "pause";
  if (value === "nghi_viec") return "offline";
  return value;
}

function getWorkStatusLabel(workStatus) {
  const labels = {
    dang_cong_tac: "Đang công tác",
    tam_nghi: "Tạm nghỉ",
    nghi_viec: "Nghỉ việc",
  };
  return labels[String(workStatus || "").trim().toLowerCase()] || workStatus || "";
}

function buildUpdatedUserPatch(response = {}, vars = {}) {
  const payload = vars?.data || {};
  const raw = response && typeof response === "object" ? response : {};
  const id = getStaffId(raw) || vars?.id || getStaffId(payload);
  const username = (
    payload.TenDangNhap ??
    payload.tenDangNhap ??
    raw.TenDangNhap ??
    raw.tenDangNhap ??
    raw.username ??
    ""
  ).toString().trim();

  const patch = { ...raw };
  if (id) {
    patch.MaNhanVien = id;
    patch.maNhanVien = id;
    patch.id = id;
  }
  if (username) {
    patch.TenDangNhap = username;
    patch.tenDangNhap = username;
    patch.username = username;
  }

  const fieldGroups = [
    ["HoTen", "hoTen", "name"],
    ["VaiTro", "vaiTro", "role"],
    ["ChucVu", "chucVu", "position"],
    ["LoaiYTa", "loaiYTa", "nurseType"],
    ["Email", "email"],
    ["DienThoai", "dienThoai", "phone"],
    ["ChuyenMon", "chuyenMon", "specialty"],
    ["HocVi", "hocVi", "degree"],
    ["SoNamKinhNghiem", "soNamKinhNghiem", "experience"],
    ["MaKhoa", "maKhoa", "departmentId"],
  ];

  for (const names of fieldGroups) {
    const value = names.map((name) => payload[name]).find((v) => v !== undefined);
    if (value !== undefined) {
      for (const name of names) patch[name] = value;
    }
  }

  return patch;
}

function patchUserInCache(old, patch) {
  const id = getStaffId(patch);
  if (!old || !id) return old;

  const patchItem = (item) =>
    getStaffId(item) === id ? { ...item, ...patch } : item;

  if (Array.isArray(old)) {
    return old.map(patchItem);
  }

  if (getStaffId(old) === id) {
    return { ...old, ...patch };
  }

  let changed = false;
  const next = { ...old };
  if (Array.isArray(old.Items)) {
    next.Items = old.Items.map(patchItem);
    changed = true;
  }
  if (Array.isArray(old.items)) {
    next.items = old.items.map(patchItem);
    changed = true;
  }

  return changed ? next : old;
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

export function useAdminUser(id, options = {}) {
  return useQuery({
    queryKey: [ADMIN_USERS_KEY, id],
    queryFn: () => fetchAdminUser(id),
    enabled: options.enabled ?? !!id,
    select: normalizeStaff,
    ...options,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => createAdminUser(data),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
        qc.invalidateQueries({ queryKey: ["staff-cards"] }),
        qc.invalidateQueries({ queryKey: ["staff-stats"] }),
      ]);
      await Promise.all([
        qc.refetchQueries({ queryKey: [ADMIN_USERS_KEY], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-cards"], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-stats"], type: "active" }),
      ]);
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminUser(id, data),
    onSuccess: async (_updated, vars) => {
      const id = vars?.id;
      const rawPatch = buildUpdatedUserPatch(_updated, vars);
      const staffPatch = normalizeStaff(rawPatch);
      delete staffPatch.status;
      delete staffPatch.statusLabel;
      delete staffPatch.statusColor;

      qc.setQueriesData({ queryKey: [ADMIN_USERS_KEY] }, (old) =>
        patchUserInCache(old, rawPatch)
      );
      qc.setQueriesData({ queryKey: ["staff-cards"] }, (old) =>
        patchUserInCache(old, staffPatch)
      );
      if (id) {
        qc.setQueryData([ADMIN_USERS_KEY, id], (old) =>
          old ? { ...old, ...rawPatch } : old
        );
        qc.setQueryData(["staff-detail", id], (old) =>
          old ? { ...old, ...staffPatch } : old
        );
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
        qc.invalidateQueries({ queryKey: ["staff-cards"] }),
        qc.invalidateQueries({ queryKey: ["staff-stats"] }),
        ...(id
          ? [
              qc.invalidateQueries({ queryKey: ["staff-detail", id] }),
              qc.invalidateQueries({ queryKey: ["staff-duty-week", id] }),
              qc.invalidateQueries({ queryKey: ["staff-duty-room", id] }),
            ]
          : []),
      ]);
      await Promise.all([
        qc.refetchQueries({ queryKey: [ADMIN_USERS_KEY], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-cards"], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-stats"], type: "active" }),
        ...(id
          ? [
              qc.refetchQueries({ queryKey: ["staff-detail", id], type: "active" }),
              qc.refetchQueries({ queryKey: ["staff-duty-week", id], type: "active" }),
              qc.refetchQueries({ queryKey: ["staff-duty-room", id], type: "active" }),
            ]
          : []),
      ]);
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => updateAdminUserStatus(id, data),
    onSuccess: async (_updated, vars) => {
      const id = vars?.id;
      const nextStatus =
        vars?.data?.TrangThaiCongTac ??
        vars?.data?.trangThaiCongTac ??
        vars?.data?.status;
      if (id && nextStatus) {
        const rawPatch = {
          MaNhanVien: id,
          maNhanVien: id,
          id,
          TrangThaiCongTac: nextStatus,
          trangThaiCongTac: nextStatus,
          status: nextStatus,
          statusLabel: getWorkStatusLabel(nextStatus),
        };
        const cardPatch = {
          MaNhanVien: id,
          maNhanVien: id,
          id,
          TrangThaiCongTac: nextStatus,
          trangThaiCongTac: nextStatus,
          status: toPresenceStatus(nextStatus),
        };

        qc.setQueriesData({ queryKey: [ADMIN_USERS_KEY] }, (old) =>
          patchUserInCache(old, rawPatch)
        );
        qc.setQueriesData({ queryKey: ["staff-cards"] }, (old) =>
          patchUserInCache(old, cardPatch)
        );
        qc.setQueryData([ADMIN_USERS_KEY, id], (old) =>
          old ? { ...old, ...rawPatch } : old
        );
        qc.setQueryData(["staff-detail", id], (old) =>
          old ? { ...old, ...cardPatch } : old
        );
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
        qc.invalidateQueries({ queryKey: ["staff-cards"] }),
        qc.invalidateQueries({ queryKey: ["staff-stats"] }),
        ...(id ? [qc.invalidateQueries({ queryKey: ["staff-detail", id] })] : []),
      ]);
      await Promise.all([
        qc.refetchQueries({ queryKey: [ADMIN_USERS_KEY], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-cards"], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-stats"], type: "active" }),
        ...(id ? [qc.refetchQueries({ queryKey: ["staff-detail", id], type: "active" })] : []),
      ]);
    },
  });
}

export function useLockUnlockAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => lockUnlockAccount(id, data),
    onSuccess: async (_updated, vars) => {
      const id = vars?.id;
      const accountStatus = vars?.data?.TrangThai ?? vars?.data?.trangThai;
      if (id && accountStatus) {
        const patch = {
          MaNhanVien: id,
          maNhanVien: id,
          id,
          TrangThaiTaiKhoan: accountStatus,
          trangThaiTaiKhoan: accountStatus,
          statusAccount: accountStatus,
        };
        qc.setQueriesData({ queryKey: [ADMIN_USERS_KEY] }, (old) =>
          patchUserInCache(old, patch)
        );
        qc.setQueriesData({ queryKey: ["staff-cards"] }, (old) =>
          patchUserInCache(old, patch)
        );
        qc.setQueryData([ADMIN_USERS_KEY, id], (old) =>
          old ? { ...old, ...patch } : old
        );
        qc.setQueryData(["staff-detail", id], (old) =>
          old ? { ...old, ...patch } : old
        );
      }

      await Promise.all([
        qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] }),
        qc.invalidateQueries({ queryKey: ["staff-cards"] }),
        qc.invalidateQueries({ queryKey: ["staff-stats"] }),
        ...(id ? [qc.invalidateQueries({ queryKey: ["staff-detail", id] })] : []),
      ]);
      await Promise.all([
        qc.refetchQueries({ queryKey: [ADMIN_USERS_KEY], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-cards"], type: "active" }),
        qc.refetchQueries({ queryKey: ["staff-stats"], type: "active" }),
        ...(id ? [qc.refetchQueries({ queryKey: ["staff-detail", id], type: "active" })] : []),
      ]);
    },
  });
}

export function useResetPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => resetAdminUserPassword(id, data),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: [ADMIN_USERS_KEY] });
      await qc.refetchQueries({ queryKey: [ADMIN_USERS_KEY], type: "active" });
    },
  });
}
