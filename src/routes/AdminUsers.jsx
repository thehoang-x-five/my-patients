import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, Lock, Unlock, Trash2 } from "lucide-react";
import { useSearchUsers, useCreateUser, useUpdateUserStatus, useDeleteUser } from "../api/admin.js";
import { useDepartments } from "../api/staff.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import Pagination from "../components/ui/Pagination.jsx";
import { toast } from "sonner";

export default function AdminUsers() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [keyword, setKeyword] = useState("");
  const [vaiTro, setVaiTro] = useState("");
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const filter = useMemo(() => ({ keyword, vaiTro, page, pageSize: 50 }), [keyword, vaiTro, page]);

  const { data, isLoading } = useSearchUsers(filter);
  const { data: depts } = useDepartments();
  const createMutation = useCreateUser();
  const updateStatusMutation = useUpdateUserStatus();
  const deleteMutation = useDeleteUser();

  const users = data?.Items ?? [];
  const totalPages = Math.ceil((data?.TotalItems ?? 0) / 50);

  const departments = useMemo(() => {
    if (Array.isArray(depts)) return depts;
    if (Array.isArray(depts?.data)) return depts.data;
    return [];
  }, [depts]);

  const [form, setForm] = useState({
    hoTen: "",
    email: "",
    dienThoai: "",
    vaiTro: "bac_si",
    maKhoa: "",
    loaiYTa: "",
    matKhau: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(form);
      toast.success("Thêm nhân viên thành công");
      setShowForm(false);
      setForm({ hoTen: "", email: "", dienThoai: "", vaiTro: "bac_si", maKhoa: "", loaiYTa: "", matKhau: "" });
    } catch (err) {
      toast.error(err.message || "Thêm nhân viên thất bại");
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.trangThaiTaiKhoan === "hoat_dong" ? "khoa" : "hoat_dong";
    try {
      await updateStatusMutation.mutateAsync({ id: user.id, status: newStatus });
      toast.success(newStatus === "hoat_dong" ? "Mở khóa tài khoản" : "Khóa tài khoản");
    } catch (err) {
      toast.error(err.message || "Cập nhật thất bại");
    }
  };

  const handleDelete = async (user) => {
    if (!confirm(`Xóa nhân viên ${user.hoTen}?`)) return;
    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success("Xóa nhân viên thành công");
    } catch (err) {
      toast.error(err.message || "Xóa thất bại");
    }
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-slate-800">Quản trị nhân sự</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Thêm nhân viên
          </button>
        </div>

        {showForm && (
          <div className="card p-4 mb-4">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Họ tên"
                value={form.hoTen}
                onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <input
                type="tel"
                placeholder="Điện thoại"
                value={form.dienThoai}
                onChange={(e) => setForm({ ...form, dienThoai: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              />
              <select
                value={form.vaiTro}
                onChange={(e) => setForm({ ...form, vaiTro: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                required
              >
                <option value="bac_si">Bác sĩ</option>
                <option value="y_ta">Y tá</option>
                <option value="ktv">Kỹ thuật viên</option>
              </select>
              <select
                value={form.maKhoa}
                onChange={(e) => setForm({ ...form, maKhoa: e.target.value })}
                className="px-3 py-2 border rounded-lg"
              >
                <option value="">Chọn khoa</option>
                {departments.map(d => (
                  <option key={d.MaKhoa ?? d.maKhoa} value={d.MaKhoa ?? d.maKhoa}>
                    {d.TenKhoa ?? d.tenKhoa}
                  </option>
                ))}
              </select>
              {form.vaiTro === "y_ta" && (
                <select
                  value={form.loaiYTa}
                  onChange={(e) => setForm({ ...form, loaiYTa: e.target.value })}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="">Chọn loại y tá</option>
                  <option value="hanh_chinh">Hành chính</option>
                  <option value="phong_kham">Phòng khám</option>
                  <option value="can_lam_sang">Cận lâm sàng</option>
                </select>
              )}
              <input
                type="password"
                placeholder="Mật khẩu"
                value={form.matKhau}
                onChange={(e) => setForm({ ...form, matKhau: e.target.value })}
                className="px-3 py-2 border rounded-lg"
                required
              />
              <div className="flex gap-2">
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-4 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <select
            value={vaiTro}
            onChange={(e) => setVaiTro(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả vai trò</option>
            <option value="bac_si">Bác sĩ</option>
            <option value="y_ta">Y tá</option>
            <option value="ktv">Kỹ thuật viên</option>
          </select>
        </div>

        <div className="card flex-1 min-h-0 overflow-auto">
          <table className="w-full">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Mã NV</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Họ tên</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Vai trò</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Khoa</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">Trạng thái</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Đang tải...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm">{user.maNhanVien}</td>
                    <td className="px-4 py-3 text-sm font-medium">{user.hoTen}</td>
                    <td className="px-4 py-3 text-sm">{user.vaiTro}</td>
                    <td className="px-4 py-3 text-sm">{user.tenKhoa || "-"}</td>
                    <td className="px-4 py-3 text-sm">{user.email || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          user.trangThaiTaiKhoan === "hoat_dong"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {user.trangThaiTaiKhoan === "hoat_dong" ? "Hoạt động" : "Khóa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className="p-2 hover:bg-slate-100 rounded"
                          title={user.trangThaiTaiKhoan === "hoat_dong" ? "Khóa" : "Mở khóa"}
                        >
                          {user.trangThaiTaiKhoan === "hoat_dong" ? (
                            <Lock size={16} className="text-red-600" />
                          ) : (
                            <Unlock size={16} className="text-green-600" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="p-2 hover:bg-slate-100 rounded"
                          title="Xóa"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={data?.TotalItems ?? 0}
              pageSize={50}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </motion.main>
  );
}
