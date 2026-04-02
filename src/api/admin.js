import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, put, del } from "./http.js";

function normalizeUser(dto = {}) {
  return {
    id: dto.MaNhanVien ?? dto.maNhanVien ?? dto.id,
    maNhanVien: dto.MaNhanVien ?? dto.maNhanVien,
    hoTen: dto.HoTen ?? dto.hoTen,
    email: dto.Email ?? dto.email,
    dienThoai: dto.DienThoai ?? dto.dienThoai,
    vaiTro: dto.VaiTro ?? dto.vaiTro,
    maKhoa: dto.MaKhoa ?? dto.maKhoa,
    tenKhoa: dto.TenKhoa ?? dto.tenKhoa,
    loaiYTa: dto.LoaiYTa ?? dto.loaiYTa,
    trangThaiCongTac: dto.TrangThaiCongTac ?? dto.trangThaiCongTac,
    trangThaiTaiKhoan: dto.TrangThaiTaiKhoan ?? dto.trangThaiTaiKhoan,
    raw: dto,
  };
}

export async function searchUsers(filter = {}) {
  const payload = {
    Keyword: filter.keyword || null,
    VaiTro: filter.vaiTro || null,
    MaKhoa: filter.maKhoa || null,
    TrangThaiTaiKhoan: filter.trangThaiTaiKhoan || null,
    Page: filter.page ?? 1,
    PageSize: filter.pageSize ?? 50,
  };
  const data = await post("/admin/users/search", payload);
  const items = data?.Items ?? data?.items ?? [];
  return {
    Items: items.map(normalizeUser),
    TotalItems: data?.TotalItems ?? data?.totalItems ?? items.length,
    Page: data?.Page ?? data?.page ?? 1,
    PageSize: data?.PageSize ?? data?.pageSize ?? 50,
  };
}

export async function createUser(payload) {
  const body = {
    HoTen: payload.hoTen,
    Email: payload.email,
    DienThoai: payload.dienThoai,
    VaiTro: payload.vaiTro,
    MaKhoa: payload.maKhoa || null,
    LoaiYTa: payload.loaiYTa || null,
    MatKhau: payload.matKhau,
  };
  const data = await post("/admin/users", body);
  return normalizeUser(data);
}

export async function updateUserStatus({ id, status }) {
  const body = { TrangThaiTaiKhoan: status };
  const data = await put(`/admin/users/${id}/status`, body);
  return normalizeUser(data);
}

export async function deleteUser(id) {
  await del(`/admin/users/${id}`);
}

export function useSearchUsers(filter = {}, options = {}) {
  return useQuery({
    queryKey: ["admin", "users", filter],
    queryFn: () => searchUsers(filter),
    keepPreviousData: true,
    ...options,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateUserStatus,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}
