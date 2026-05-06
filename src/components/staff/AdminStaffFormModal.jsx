import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PopoverSelect from "../ui/PopoverSelect.jsx";

const ROLE_OPTIONS = [
  { value: "bac_si", label: "Bác sĩ" },
  { value: "y_ta", label: "Y tá" },
  { value: "ky_thuat_vien", label: "Kỹ thuật viên" },
  { value: "admin", label: "Admin" },
];

const POSITION_OPTIONS = [
  { value: "bac_si", label: "Bác sĩ", roles: ["bac_si"] },
  { value: "y_ta_hanh_chinh", label: "Y tá hành chính", roles: ["y_ta"] },
  { value: "y_ta_lam_sang", label: "Y tá lâm sàng", roles: ["y_ta"] },
  { value: "y_ta_can_lam_sang", label: "Y tá cận lâm sàng", roles: ["y_ta"] },
  { value: "ky_thuat_vien", label: "Kỹ thuật viên", roles: ["ky_thuat_vien"] },
  { value: "admin", label: "Admin", roles: ["admin"] },
];

const ROLE_DEFAULT_POSITION = {
  bac_si: "bac_si",
  y_ta: "",
  ky_thuat_vien: "ky_thuat_vien",
  admin: "admin",
};

const NURSE_TYPE_OPTIONS = [
  { value: "", label: "-- Chọn loại y tá --" },
  { value: "hanhchinh", label: "Hành chính" },
  { value: "ls", label: "Lâm sàng" },
  { value: "cls", label: "Cận lâm sàng" },
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

function Field({ label, required = false, children }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-600">
        {label}
        {required ? " *" : ""}
      </span>
      {children}
    </label>
  );
}

function normalizeForm(initial, isEdit) {
  if (!initial) return EMPTY_FORM;

  return {
    tenDangNhap:
      initial.tenDangNhap ||
      initial.username ||
      initial.raw?.TenDangNhap ||
      initial.raw?.tenDangNhap ||
      initial._raw?.TenDangNhap ||
      initial._raw?.tenDangNhap ||
      "",
    matKhau: "",
    hoTen: initial.hoTen || initial.name || "",
    vaiTro: String(initial.vaiTro || initial.role || "y_ta").toLowerCase(),
    chucVu: String(initial.chucVu || initial.position || "").toLowerCase(),
    loaiYTa: String(initial.loaiYTa || initial.nurseType || "").toLowerCase(),
    email: initial.email || "",
    dienThoai: initial.dienThoai || initial.phone || "",
    chuyenMon: initial.chuyenMon || initial.specialty || "",
    hocVi: initial.hocVi || initial.degree || "",
    soNamKinhNghiem:
      Number(initial.soNamKinhNghiem ?? initial.experience ?? 0) || 0,
    maKhoa: initial.maKhoa || initial.departmentId || "",
  };
}

function submitShape(form, isEdit) {
  const base = {
    TenDangNhap: form.tenDangNhap.trim(),
    HoTen: form.hoTen.trim(),
    VaiTro: form.vaiTro,
    ChucVu: (form.chucVu || form.vaiTro).trim(),
    LoaiYTa: form.vaiTro === "y_ta" ? form.loaiYTa || null : null,
    Email: form.email?.trim() || null,
    DienThoai: form.dienThoai?.trim() || null,
    ChuyenMon: form.chuyenMon?.trim() || null,
    HocVi: form.hocVi?.trim() || null,
    SoNamKinhNghiem: Number(form.soNamKinhNghiem) || 0,
    MaKhoa: form.maKhoa,
  };

  if (isEdit) return base;

  return { ...base, MatKhau: form.matKhau };
}

export default function AdminStaffFormModal({
  open,
  onClose,
  initial = null,
  isEdit = false,
  onSubmit,
  isPending = false,
  departments = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(normalizeForm(initial, isEdit));
    }
  }, [open, initial, isEdit]);

  const departmentOptions = useMemo(
    () =>
      (Array.isArray(departments) ? departments : []).map((d) => ({
        value: d.MaKhoa || d.maKhoa || d.code || d.id || "",
        label: d.TenKhoa || d.tenKhoa || d.name || d.code || "—",
      })),
    [departments]
  );



  const positionOptions = POSITION_OPTIONS.filter(
    (opt) => opt.roles.includes(form.vaiTro)
  ).map(({ value, label }) => ({ value, label }));

  const nurseTypeOptions = useMemo(() => {
    if (form.chucVu === "y_ta_hanh_chinh") {
      return [
        { value: "hanhchinh", label: "Hành chính" },
      ];
    }
    if (form.chucVu === "y_ta_lam_sang") {
      return [
        { value: "ls", label: "Lâm sàng" },
      ];
    }
    if (form.chucVu === "y_ta_can_lam_sang") {
      return [
        { value: "cls", label: "Cận lâm sàng" },
      ];
    }
    return NURSE_TYPE_OPTIONS;
  }, [form.chucVu]);

  if (!open) return null;

  const updateField = (key, value) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "vaiTro") {
        if (value !== "y_ta") next.loaiYTa = "";
        next.chucVu = ROLE_DEFAULT_POSITION[value] || value;
      }
      if (key === "chucVu") {
        if (value === "y_ta_hanh_chinh") next.loaiYTa = "hanhchinh";
        else if (value === "y_ta_lam_sang") next.loaiYTa = "ls";
        else if (value === "y_ta_can_lam_sang") next.loaiYTa = "cls";
      }
      if (key === "loaiYTa") {
        if (value === "hanhchinh") next.chucVu = "y_ta_hanh_chinh";
        else if (value === "ls") next.chucVu = "y_ta_lam_sang";
        else if (value === "cls") next.chucVu = "y_ta_can_lam_sang";
      }
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.(submitShape(form, isEdit));
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto scrollbar-none rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
        >
          <form onSubmit={handleSubmit}>
            <div className="sticky top-0 rounded-t-2xl border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                {isEdit ? "Sửa nhân viên" : "Thêm nhân viên"}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Admin quản lý trực tiếp user ngay trong màn Staff.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Tên đăng nhập" required>
                  <input
                    required
                    className="input"
                    value={form.tenDangNhap}
                    onChange={(e) => updateField("tenDangNhap", e.target.value)}
                    placeholder="vd: nguyenvana"
                  />
                </Field>
                {!isEdit ? (
                  <Field label="Mật khẩu" required>
                    <input
                      required
                      type="password"
                      className="input"
                      value={form.matKhau}
                      onChange={(e) => updateField("matKhau", e.target.value)}
                      placeholder="Tối thiểu 6 ký tự"
                    />
                  </Field>
                ) : (
                  <div className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-500 ring-1 ring-slate-200">
                    Mật khẩu đổi bằng chức năng reset riêng.
                  </div>
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Họ tên" required>
                  <input
                    required
                    className="input"
                    value={form.hoTen}
                    onChange={(e) => updateField("hoTen", e.target.value)}
                    placeholder="Nguyễn Văn A"
                  />
                </Field>
                <Field label="Khoa" required>
                  <PopoverSelect
                    required
                    name="maKhoa"
                    value={form.maKhoa}
                    onChange={(value) => updateField("maKhoa", value)}
                    options={departmentOptions}
                    placeholder="Chọn khoa"
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Vai trò">
                  <PopoverSelect
                    name="vaiTro"
                    value={form.vaiTro}
                    onChange={(value) => updateField("vaiTro", value)}
                    options={ROLE_OPTIONS}
                    placeholder="Chọn vai trò"
                  />
                </Field>
                <Field label="Chức vụ">
                  <PopoverSelect
                    name="chucVu"
                    value={form.chucVu}
                    onChange={(value) => updateField("chucVu", value)}
                    options={positionOptions}
                    placeholder="Chọn chức vụ"
                  />
                </Field>
                {form.vaiTro === "y_ta" ? (
                  <Field label="Loại y tá">
                    <PopoverSelect
                      name="loaiYTa"
                      value={form.loaiYTa}
                      onChange={(value) => updateField("loaiYTa", value)}
                      options={nurseTypeOptions}
                      placeholder="Chọn loại y tá"
                    />
                  </Field>
                ) : (
                  <div />
                )}
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Email">
                  <input
                    type="email"
                    className="input"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </Field>
                <Field label="Điện thoại">
                  <input
                    className="input"
                    value={form.dienThoai}
                    onChange={(e) => updateField("dienThoai", e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <Field label="Chuyên môn">
                  <input
                    className="input"
                    value={form.chuyenMon}
                    onChange={(e) => updateField("chuyenMon", e.target.value)}
                  />
                </Field>
                <Field label="Học vị">
                  <input
                    className="input"
                    value={form.hocVi}
                    onChange={(e) => updateField("hocVi", e.target.value)}
                  />
                </Field>
                <Field label="Số năm kinh nghiệm">
                  <input
                    min="0"
                    type="number"
                    className="input"
                    value={form.soNamKinhNghiem}
                    onChange={(e) =>
                      updateField("soNamKinhNghiem", Number(e.target.value))
                    }
                  />
                </Field>
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={onClose} className="btn text-sm">
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-teal-600 via-teal-500 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
              >
                {isPending ? "Đang lưu..." : isEdit ? "Cập nhật" : "Tạo mới"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
