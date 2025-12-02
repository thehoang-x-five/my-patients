import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useUiStore } from "../stores/appStore.js";

/* ------------ UI helpers ------------ */

function SectionCard({ title, subtitle, children, className = "" }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 4, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      className={
        "rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col " +
        className
      }
    >
      <div className="px-4 py-2 border-b border-slate-100 bg-gradient-to-r from-cyan-50 via-white to-rose-50">
        <h3 className="font-semibold text-slate-900">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      <div className="p-3 flex-1 flex flex-col">{children}</div>
    </motion.section>
  );
}

function PillToggle({ value, options, onChange }) {
  return (
    <div className="inline-flex p-0.5 rounded-full bg-slate-100/70">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative px-3 py-1.5 text-xs font-medium rounded-full transition ${
              active
                ? "bg-white shadow-sm text-sky-700"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function GradientChip({ label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] bg-gradient-to-r from-sky-100 via-white to-rose-100 border border-slate-100">
      <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
      <span className="text-slate-700">{label}</span>
    </span>
  );
}

function PrimaryButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-sky-500 via-sky-400 to-rose-400 text-white shadow hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none " +
        className
      }
    >
      {children}
    </button>
  );
}

function OutlineButton({ children, className = "", ...rest }) {
  return (
    <button
      {...rest}
      className={
        "inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition " +
        className
      }
    >
      {children}
    </button>
  );
}

/* ------------ Main ------------ */

export default function SettingsScreen({ user, onChangePassword, onLogout }) {
  const theme = useUiStore((s) => s.theme);
  const lang = useUiStore((s) => s.lang);
  const setTheme = useUiStore((s) => s.setTheme);
  const setLang = useUiStore((s) => s.setLang);

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSubmitting, setPwSubmitting] = useState(false);

  const staffName = user?.hoTen || user?.name || "User";
  const staffCode = user?.maNhanSu || user?.code || user?.staffCode || "";
  const staffRole = user?.chucDanh || user?.role || "Nhân viên y tế";
  const staffDept = user?.tenPhong || user?.dept || user?.department || "";
  const staffUsername = user?.username || user?.userName || user?.email || "--";

  const staffIdForProfile = staffCode || user?.id || user?.staffId || user?.maNhanSu || "BS";

  const staffRoleKey =
    staffRole.includes("Y tá") || staffRole.includes("Điều dưỡng")
      ? "nurse"
      : "doctor";

  const canSubmitPw =
    pw.currentPassword &&
    pw.newPassword &&
    pw.confirmPassword &&
    pw.newPassword === pw.confirmPassword &&
    !pwSubmitting;

  async function handleSubmitPassword(e) {
    e.preventDefault();
    if (!onChangePassword || !canSubmitPw) return;
    try {
      setPwSubmitting(true);
      await onChangePassword(pw);
      setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } finally {
      setPwSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 overflow-hidden">
      {/* HERO */}
      <motion.div
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-1 rounded-3xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-rose-50 px-4 py-1 flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 to-rose-400 flex items-center justify-center text-white font-bold text-xl shadow-md">
              {staffName?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white border border-sky-200 flex items-center justify-center text-[11px] text-sky-600">
              ⚙
            </span>
          </div>
          <div className="space-y-0.5">
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Hồ sơ cá nhân
            </div>
            <div className="text-base sm:text-lg font-semibold text-slate-900">
              {staffName}
            </div>
            <div className="text-[11px] text-slate-500">
              {staffRole}
              {staffDept && " • "}
              {staffDept}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-right">
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <GradientChip label="Kinh nghiệm tốt hơn khi thiết lập đúng cho bạn" />
            {staffIdForProfile && (
              <Link
                to={`/staff?role=${staffRoleKey}&uid=${encodeURIComponent(
                  staffIdForProfile
                )}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border border-sky-300 bg-white text-sky-700 hover:bg-sky-50 hover:shadow-sm transition"
              >
                <span>Hồ sơ</span>
                <span className="text-xs">↗</span>
              </Link>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            <span>
              Ngôn ngữ:{" "}
              <strong className="text-slate-700">
                {lang === "en" ? "English" : "Tiếng Việt"}
              </strong>
            </span>
            <span>•</span>
            <span>
              Giao diện:{" "}
              <strong className="text-slate-700">
                {theme === "dark" ? "Tối" : "Sáng"}
              </strong>
            </span>
          </div>
        </div>
      </motion.div>

      {/* GRID MAIN */}
      <div className="grid lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.3fr)] gap-3 flex-1 min-h-0">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Thông tin tài khoản */}
          <SectionCard
            title="Thông tin tài khoản"
            subtitle="Thông tin được đồng bộ từ hồ sơ nhân viên. Nếu cần thay đổi, vui lòng liên hệ quản trị hệ thống."
          >
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">Họ tên</div>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  {staffName}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">Mã NV</div>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  {staffCode || "--"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">Email</div>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 truncate">
                  {user?.email || user?.Email || "--"}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-500 mb-0.5">
                  Khoa/Phòng
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-800">
                  {staffDept || "--"}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Đổi mật khẩu */}
          <div className="flex-1 min-h-0 flex">
            <SectionCard
              title="Đổi mật khẩu"
              subtitle="Mật khẩu mới nên đủ mạnh và khó đoán, tối thiểu 8 ký tự."
              className="flex-1"
            >
              <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] gap-4 text-sm ">
                {/* Form bên trái */}
                <form
                  className="grid md:grid-cols-2 gap-3"
                  onSubmit={handleSubmitPassword}
                >
                  <div className="md:col-span-2">
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 bg-sky-50/60 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      value={pw.currentPassword}
                      onChange={(e) =>
                        setPw((s) => ({
                          ...s,
                          currentPassword: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 bg-sky-50/60 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      value={pw.newPassword}
                      onChange={(e) =>
                        setPw((s) => ({ ...s, newPassword: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      Nhập lại mật khẩu mới
                    </label>
                    <input
                      type="password"
                      className="w-full rounded-xl border border-slate-200 bg-sky-50/60 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                      value={pw.confirmPassword}
                      onChange={(e) =>
                        setPw((s) => ({
                          ...s,
                          confirmPassword: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end gap-2 pt-2 mt-auto">
                    <OutlineButton
                      type="button"
                      onClick={() =>
                        setPw({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }
                    >
                      Xóa
                    </OutlineButton>
                    <PrimaryButton type="submit" disabled={!canSubmitPw}>
                      {pwSubmitting ? "Đang lưu..." : "Lưu mật khẩu mới"}
                    </PrimaryButton>
                  </div>
                </form>

                {/* Cột gợi ý bên phải (chỉ UI) */}
                <div className="hidden lg:flex flex-col gap-3 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-rose-50 border border-sky-100 px-3 py-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600">
                      🔒
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">
                        Gợi ý mật khẩu an toàn
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Mẹo nhỏ để tránh bị đoán hoặc lộ mật khẩu.
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 space-y-1">
                    <div className="flex gap-1">
                      <span className="flex-1 h-1.5 rounded-full bg-rose-200" />
                      <span className="flex-1 h-1.5 rounded-full bg-amber-200" />
                      <span className="flex-1 h-1.5 rounded-full bg-emerald-300" />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Tránh dùng mật khẩu giống nhau cho nhiều hệ thống.
                    </div>
                  </div>

                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500">•</span>
                      <span>Tối thiểu 8 ký tự, có chữ và số.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500">•</span>
                      <span>Hạn chế dùng ngày sinh, số điện thoại, tên.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500">•</span>
                      <span>Nên đổi mật khẩu định kỳ vài tháng một lần.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-3 min-h-0">
          {/* Lang + Theme */}
          <SectionCard
            title="Giao diện & ngôn ngữ"
            subtitle="Chọn phong cách hiển thị và ngôn ngữ bạn muốn sử dụng."
          >
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-xs text-slate-500 uppercase">
                    Ngôn ngữ
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    Hiển thị nội dung
                  </div>
                </div>
                <PillToggle
                  value={lang}
                  onChange={setLang}
                  options={[
                    { value: "vi", label: "Tiếng Việt" },
                    { value: "en", label: "English" },
                  ]}
                />
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap border-t border-slate-100 pt-3">
                <div>
                  <div className="text-xs text-slate-500 uppercase">
                    Giao diện
                  </div>
                  <div className="text-sm font-medium text-slate-800">
                    Chế độ màu
                  </div>
                </div>
                <PillToggle
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: "light", label: "Sáng" },
                    { value: "dark", label: "Tối" },
                  ]}
                />
              </div>

              {/* Preview trang trí */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-2">
                  <div className="w-full h-3 rounded-xl bg-slate-200 mb-1" />
                  <div className="w-3/4 h-2 rounded-full bg-slate-200" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white p-2 flex flex-col gap-1">
                  <span className="w-10 h-3 rounded-full bg-sky-100" />
                  <span className="w-12 h-2 rounded-full bg-slate-100" />
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-900 p-2 flex flex-col gap-1">
                  <span className="w-10 h-3 rounded-full bg-sky-400" />
                  <span className="w-12 h-2 rounded-full bg-slate-600" />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Phiên đăng nhập */}
          <div className="flex-1 min-h-0 flex">
            <SectionCard
              title="Phiên đăng nhập"
              subtitle="Bảo vệ tài khoản khi sử dụng trên máy lạ hoặc máy dùng chung."
              className="flex-1"
            >
              <div className="flex flex-col justify-between gap-3 text-sm ">
                <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                  Đảm bảo bạn không chia sẻ tài khoản với người khác. Nếu nghi
                  ngờ có truy cập lạ, hãy đổi mật khẩu và liên hệ quản trị.
                </div>

                <div className="flex items-center justify-between gap-2 flex-wrap mt-auto pt-1">
                  <div className="text-[11px] text-slate-500">
                    Bạn đang đăng nhập với tài khoản{" "}
                    <span className="font-semibold text-slate-800">
                      {staffUsername}
                    </span>
                    .
                  </div>
                  <button
                    type="button"
                    onClick={onLogout}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold border border-rose-200 text-rose-700 bg-rose-100 hover:bg-rose-400 hover:text-white transition"
                  >
                    ⏏ Đăng xuất
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </div>
      </div>

      {/* FULL WIDTH: Các lỗi thường gặp & cách giải quyết nhanh */}
      <SectionCard
      title="Các lỗi thường gặp & cách giải quyết nhanh"
      subtitle="Một số tình huống hay gặp khi sử dụng hệ thống và cách xử lý nhanh."
      className="mb-1"
>
  <div className="grid md:grid-cols-3 gap-3 text-[10px] text-slate-600">
    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-[10px] text-rose-600">
          01
        </span>
        <span className="font-semibold text-slate-800">
          Không đăng nhập được
        </span>
      </div>
      <ul className="space-y-0.5">
        <li>• Kiểm tra lại tài khoản/mật khẩu, tắt CapsLock.</li>
        <li>• Nếu quên mật khẩu: dùng chức năng “Quên mật khẩu”.</li>
      </ul>
    </div>

    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-[10px] text-amber-600">
          02
        </span>
        <span className="font-semibold text-slate-800">
          Màn hình bị treo / chậm
        </span>
      </div>
      <ul className="space-y-0.5">
        <li>• Thử tải lại trang (Ctrl + R / F5).</li>
        <li>• Đóng bớt tab không dùng, kiểm tra mạng.</li>
      </ul>
    </div>

    <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-1.5 space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-[10px] text-emerald-600">
          03
        </span>
        <span className="font-semibold text-slate-800">
          Không thấy bệnh nhân / đơn / lịch
        </span>
      </div>
      <ul className="space-y-0.5">
        <li>• Kiểm tra lại bộ lọc ngày, trạng thái, khoa/phòng.</li>
        <li>• Dùng ô tìm kiếm theo mã BN hoặc số hồ sơ.</li>
      </ul>
    </div>
  </div>
</SectionCard>
    </div>
  );
}
