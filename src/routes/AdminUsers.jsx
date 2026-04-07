// src/routes/AdminUsers.jsx
// Trang quản lý nhân viên (Admin CRUD) — chỉ admin truy cập
// Tone: Violet/Purple (riêng cho admin, tách biệt với cyan Reports, blue Clinical)
import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import PopoverSelect from "../components/ui/PopoverSelect.jsx";

import {
  useAdminUsers,
  useCreateUser,
  useUpdateUser,
  useUpdateUserStatus,
  useResetPassword,
} from "../api/admin.js";

/* ======================= CONSTANTS ======================= */

const ROLE_OPTS = [
  { value: "", label: "Tất cả vai trò" },
  { value: "bac_si", label: "Bác sĩ" },
  { value: "y_ta", label: "Y tá" },
  { value: "ky_thuat_vien", label: "Kỹ thuật viên" },
  { value: "admin", label: "Admin" },
];

const STATUS_OPTS = [
  { value: "", label: "Tất cả trạng thái" },
  { value: "dang_cong_tac", label: "Đang công tác" },
  { value: "tam_nghi", label: "Tạm nghỉ" },
  { value: "nghi_viec", label: "Nghỉ việc" },
];

const NURSE_TYPE_OPTS = [
  { value: "", label: "-- Chọn loại y tá --" },
  { value: "hanhchinh", label: "Hành chính" },
  { value: "phong_kham", label: "Lâm sàng" },
  { value: "can_lam_sang", label: "Cận lâm sàng" },
];

const EMPTY_FORM = {
  tenDangNhap: "",
  matKhau: "",
  hoTen: "",
  vaiTro: "y_ta",
  chucVu: "",
  loaiYTa: "",
  email: "",
  dienThoai: "",
  chuyenMon: "",
  hocVi: "",
  soNamKinhNghiem: 0,
  maKhoa: "",
};

/* ======================= StatusBadge ======================= */
function StatusBadge({ status, label }) {
  const map = {
    dang_cong_tac: {
      bg: "bg-emerald-50 text-emerald-700 ring-emerald-200",
      dot: "bg-emerald-500",
    },
    tam_nghi: {
      bg: "bg-amber-50 text-amber-700 ring-amber-200",
      dot: "bg-amber-500",
    },
    nghi_viec: {
      bg: "bg-rose-50 text-rose-700 ring-rose-200",
      dot: "bg-rose-500",
    },
  };
  const s = map[status] || map.nghi_viec;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ${s.bg}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label}
    </span>
  );
}

/* ======================= Field ======================= */
function Field({ label, children }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-600 font-medium mb-1 block">{label}</span>
      {children}
    </label>
  );
}

/* ======================= Table Header/Row (consistent with OrdersTable) ======================= */
const Th = ({ children, first, last, right }) => (
  <th
    className={[
      "sticky top-0 z-10 px-4 py-3 whitespace-nowrap text-[13px] font-semibold text-slate-600",
      "bg-white/80 backdrop-blur",
      "bg-gradient-to-b from-violet-50/60 to-slate-50/40",
      "ring-1 ring-slate-200/70",
      first ? "rounded-l-xl" : "",
      last ? "rounded-r-xl" : "",
      right ? "text-right" : "",
    ].join(" ")}
  >
    {children}
  </th>
);

/* ======================= MODAL (Create / Edit) ======================= */
function StaffFormModal({ open, onClose, initial, isEdit, onSubmit, isPending }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);

  React.useEffect(() => {
    if (open) setForm(initial || EMPTY_FORM);
  }, [open, initial]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(form);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto ring-1 ring-slate-200/80"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-violet-100 rounded-t-2xl">
            <h3 className="text-lg font-semibold text-violet-900">
              {isEdit ? "✏️ Sửa nhân viên" : "➕ Thêm nhân viên"}
            </h3>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {!isEdit && (
              <Field label="Tên đăng nhập *">
                <input
                  required
                  className="input"
                  value={form.tenDangNhap}
                  onChange={(e) => set("tenDangNhap", e.target.value)}
                  placeholder="vd: nguyenvana"
                />
              </Field>
            )}
            {!isEdit && (
              <Field label="Mật khẩu *">
                <input
                  required
                  type="password"
                  className="input"
                  value={form.matKhau}
                  onChange={(e) => set("matKhau", e.target.value)}
                  placeholder="Tối thiểu 6 ký tự"
                />
              </Field>
            )}

            <Field label="Họ tên *">
              <input
                required
                className="input"
                value={form.hoTen}
                onChange={(e) => set("hoTen", e.target.value)}
                placeholder="Nguyễn Văn A"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Vai trò">
                <PopoverSelect
                  name="vaiTro"
                  value={form.vaiTro}
                  onChange={(value) => set("vaiTro", value)}
                  options={[
                    { value: "bac_si", label: "Bác sĩ" },
                    { value: "y_ta", label: "Y tá" },
                    { value: "ky_thuat_vien", label: "Kỹ thuật viên" },
                    { value: "admin", label: "Admin" },
                  ]}
                  placeholder="Chọn vai trò"
                />
              </Field>
              <Field label="Chức vụ">
                <input
                  className="input"
                  value={form.chucVu}
                  onChange={(e) => set("chucVu", e.target.value)}
                  placeholder="vd: Trưởng khoa"
                />
              </Field>
            </div>

            {form.vaiTro === "y_ta" && (
              <Field label="Loại y tá">
                <PopoverSelect
                  name="loaiYTa"
                  value={form.loaiYTa}
                  onChange={(value) => set("loaiYTa", value)}
                  options={NURSE_TYPE_OPTS}
                  placeholder="Chọn loại y tá"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email">
                <input type="email" className="input" value={form.email} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Điện thoại">
                <input className="input" value={form.dienThoai} onChange={(e) => set("dienThoai", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Chuyên môn">
                <input className="input" value={form.chuyenMon} onChange={(e) => set("chuyenMon", e.target.value)} />
              </Field>
              <Field label="Học vị">
                <input className="input" value={form.hocVi} onChange={(e) => set("hocVi", e.target.value)} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số năm KN">
                <input type="number" className="input" min="0" value={form.soNamKinhNghiem} onChange={(e) => set("soNamKinhNghiem", Number(e.target.value))} />
              </Field>
              <Field label="Mã khoa">
                <input className="input" value={form.maKhoa} onChange={(e) => set("maKhoa", e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-slate-100 rounded-b-2xl flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="btn text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr from-violet-600 via-violet-500 to-purple-500 hover:-translate-y-px shadow-md disabled:opacity-50 transition border-transparent"
            >
              {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

/* ======================= RESET PASSWORD MODAL ======================= */
function ResetPasswordModal({ open, onClose, staffId, onSubmit, isPending }) {
  const [pwd, setPwd] = useState("");

  React.useEffect(() => {
    if (open) setPwd("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 ring-1 ring-slate-200/80"
      >
        <div className="px-6 py-4 border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 rounded-t-2xl">
          <h3 className="text-base font-semibold text-orange-900">
            🔑 Đặt lại mật khẩu
          </h3>
          <p className="text-xs text-orange-600 mt-0.5">Nhân viên: {staffId}</p>
        </div>
        <div className="px-6 py-4">
          <Field label="Mật khẩu mới *">
            <input
              required
              type="password"
              className="input"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Nhập mật khẩu mới"
            />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn text-sm">Hủy</button>
          <button
            onClick={() => onSubmit({ id: staffId, data: { matKhauMoi: pwd } })}
            disabled={isPending || !pwd}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr from-orange-500 to-amber-400 hover:-translate-y-px shadow-md disabled:opacity-50 transition border-transparent"
          >
            {isPending ? "Đang xử lý..." : "Đặt lại"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ======================= MAIN PAGE ======================= */
export default function AdminUsers() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  // Filter state
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const filter = useMemo(
    () => ({ q, vaiTro: roleFilter, trangThai: statusFilter, page, pageSize: 15 }),
    [q, roleFilter, statusFilter, page]
  );

  const { data, isLoading } = useAdminUsers(filter);
  const users = data?.items || [];
  const totalItems = data?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / 15) || 1;

  // Mutations
  const createMut = useCreateUser();
  const updateMut = useUpdateUser();
  const statusMut = useUpdateUserStatus();
  const resetPwdMut = useResetPassword();

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetPwdUser, setResetPwdUser] = useState(null);

  const handleCreate = useCallback(
    (form) => {
      createMut.mutate(form, {
        onSuccess: () => { toast.success("Tạo nhân viên thành công"); setShowForm(false); },
        onError: (err) => toast.error(err.message),
      });
    },
    [createMut]
  );

  const handleUpdate = useCallback(
    (form) => {
      updateMut.mutate(
        { id: editUser.id, data: form },
        {
          onSuccess: () => { toast.success("Cập nhật thành công"); setEditUser(null); },
          onError: (err) => toast.error(err.message),
        }
      );
    },
    [updateMut, editUser]
  );

  const handleToggleStatus = useCallback(
    (user) => {
      const next = user.status === "dang_cong_tac" ? "tam_nghi" : "dang_cong_tac";
      statusMut.mutate(
        { id: user.id, data: { trangThaiCongTac: next } },
        {
          onSuccess: () => toast.success(next === "tam_nghi" ? "Đã khóa tài khoản" : "Đã mở khóa"),
          onError: (err) => toast.error(err.message),
        }
      );
    },
    [statusMut]
  );

  const handleResetPwd = useCallback(
    (payload) => {
      resetPwdMut.mutate(payload, {
        onSuccess: () => { toast.success("Đặt lại mật khẩu thành công"); setResetPwdUser(null); },
        onError: (err) => toast.error(err.message),
      });
    },
    [resetPwdMut]
  );

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-2.5 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Quản lý nhân viên"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* ======= HEADER ======= */}
        <header className="flex-none flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              <span className="text-violet-600">🛡️</span> Quản lý nhân viên
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {totalItems} nhân viên • Chỉ Admin truy cập
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-tr from-violet-600 via-violet-500 to-purple-500 shadow-sm hover:-translate-y-px hover:shadow-md transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Thêm nhân viên
          </button>
        </header>

        {/* ======= FILTER BAR ======= */}
        <div className="flex-none flex flex-col sm:flex-row gap-2 mb-3">
          <div className="relative flex-1 max-w-sm">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              className="input pl-9"
              placeholder="Tìm theo tên, mã NV…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
          <div className="max-w-[170px] flex-1">
            <PopoverSelect
              name="roleFilter"
              value={roleFilter}
              onChange={(value) => { setRoleFilter(value); setPage(1); }}
              options={ROLE_OPTS}
              placeholder="Lọc vai trò"
            />
          </div>
          <div className="max-w-[170px] flex-1">
            <PopoverSelect
              name="statusFilter"
              value={statusFilter}
              onChange={(value) => { setStatusFilter(value); setPage(1); }}
              options={STATUS_OPTS}
              placeholder="Lọc trạng thái"
            />
          </div>
        </div>

        {/* ======= TABLE ======= */}
        <section className="flex-1 min-h-0 bg-white rounded-2xl ring-1 ring-slate-200/80 shadow-soft overflow-hidden flex flex-col">
          <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-none px-3 pt-0 pb-0">
            <table className="min-w-full table-fixed">
              <colgroup>
                <col style={{ width: "12%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "12%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "14%" }} />
              </colgroup>
              <thead className="text-left">
                <tr>
                  <Th first>Mã NV</Th>
                  <Th>Họ tên</Th>
                  <Th>Vai trò</Th>
                  <Th>Khoa</Th>
                  <Th>Trạng thái</Th>
                  <Th last right>Thao tác</Th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      <div className="inline-flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-violet-300 border-t-transparent rounded-full animate-spin" />
                        Đang tải…
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      Không tìm thấy nhân viên nào
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      whileHover={{ y: -2 }}
                      className="group odd:bg-slate-50/40 hover:bg-violet-50/50 transition shadow-[inset_0_-1px_0_0_rgba(15,23,42,.06)]"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-500 group-hover:text-violet-600">
                        {u.id}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs shrink-0 ring-2 ring-violet-200/60">
                            {(u.name || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate text-[13px]">{u.name}</p>
                            <p className="text-[11px] text-slate-400 truncate">@{u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-violet-50 text-violet-700 ring-1 ring-violet-200">
                          {u.roleLabel}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-[13px] text-slate-600 truncate">
                        {u.departmentName || "—"}
                      </td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={u.status} label={u.statusLabel} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="inline-flex items-center gap-0.5">
                          {/* Sửa */}
                          <button
                            title="Sửa"
                            onClick={() => setEditUser({ ...u, ...u._raw })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <path d="M15.232 5.232l3.536 3.536M6.5 21H3v-3.5L16.732 3.732a2.5 2.5 0 013.536 3.536L6.5 21z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </button>
                          {/* Khóa / Mở */}
                          <button
                            title={u.status === "dang_cong_tac" ? "Khóa" : "Mở khóa"}
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.status === "dang_cong_tac"
                                ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                          >
                            {u.status === "dang_cong_tac" ? (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                                <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
                                <path d="M7 11V7a5 5 0 019.9-.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                              </svg>
                            )}
                          </button>
                          {/* Reset password */}
                          <button
                            title="Đặt lại mật khẩu"
                            onClick={() => setResetPwdUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                              <path d="M15 7h2a5 5 0 010 10h-2M9 17H7A5 5 0 017 7h2M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalItems > 0 && (
            <div className="flex-none flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-white">
              <span className="text-xs text-slate-400">
                Trang {page} / {totalPages} • {totalItems} kết quả
              </span>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 hover:bg-violet-50 hover:ring-violet-300 disabled:opacity-40 transition"
                >
                  ← Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 rounded-lg text-xs font-medium text-slate-600 ring-1 ring-slate-200/80 hover:bg-violet-50 hover:ring-violet-300 disabled:opacity-40 transition"
                >
                  Sau →
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ======= MODALS ======= */}
      <AnimatePresence>
        {showForm && (
          <StaffFormModal
            open
            onClose={() => setShowForm(false)}
            isEdit={false}
            onSubmit={handleCreate}
            isPending={createMut.isPending}
          />
        )}
        {editUser && (
          <StaffFormModal
            open
            onClose={() => setEditUser(null)}
            isEdit
            initial={editUser}
            onSubmit={handleUpdate}
            isPending={updateMut.isPending}
          />
        )}
        {resetPwdUser && (
          <ResetPasswordModal
            open
            staffId={resetPwdUser}
            onClose={() => setResetPwdUser(null)}
            onSubmit={handleResetPwd}
            isPending={resetPwdMut.isPending}
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
