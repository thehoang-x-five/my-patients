// src/pages/SettingsForm.jsx
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { ROLES } from "../../data/settings.js";
import React from "react";

/** Tone mới: Fuchsia */
const toneRing = "ring-1 ring-fuchsia-200/80 focus:ring-2 focus:ring-fuchsia-500";
const toneGrad = "from-fuchsia-50 via-white to-fuchsia-50/70";
const toneHeader = "bg-gradient-to-b from-fuchsia-600/10 to-white";

const Field = ({ label, children, className = "" }) => (
  <label className={`text-sm ${className}`}>
    <span className="block text-slate-700">{label}</span>
    {children}
  </label>
);

const Section = ({ title, children }) => (
  <motion.section
    initial={{ opacity: 0, y: 8, scale: 0.99 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: "spring", stiffness: 420, damping: 32 }}
    className="h-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
  >
    <div className={`px-4 py-3 border-b border-slate-200 ${toneHeader}`}>
      <h3 className="font-extrabold text-slate-900">{title}</h3>
    </div>
    <div className="p-4 flex-1">{children}</div>
  </motion.section>
);

export default function SettingsForm({
  user,
  form,
  change,
  theme,
  setTheme,
  lang,
  setLang,
  onSave,
  onReset,
}) {
  const roleKey = form.role === "Y tá" ? "nurse" : "doctor";

  return (
    <div
      className={`
        grid lg:grid-cols-2 gap-4 auto-rows-fr
        bg-gradient-to-r ${toneGrad} p-1 rounded-2xl
      `}
    >
      {/* 1) Tài khoản & Liên hệ */}
      <Section title="Tài khoản & Liên hệ">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Họ tên">
            <input
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={form.name}
              onChange={(e) => change("name", e.target.value)}
            />
          </Field>
          <Field label="Email">
            <input
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={form.email}
              onChange={(e) => change("email", e.target.value)}
            />
          </Field>
          <Field label="Số điện thoại">
            <input
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={form.phone || ""}
              onChange={(e) => change("phone", e.target.value)}
            />
          </Field>
          <Field label="Vai trò">
            <select
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={form.role}
              onChange={(e) => change("role", e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-end pt-6">
          <Button
            as={Link}
            to="/staff?role=doctor"
            variant="soft"
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-gradient-to-tr from-fuchsia-50 to-fuchsia-200 px-3 py-1.5 text-sm font-semibold text-fuchsia-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
          >
            Danh sách Bác sĩ
          </Button>
          <Button
            as={Link}
            to="/staff?role=nurse"
            variant="soft"
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-gradient-to-tr from-fuchsia-50 to-fuchsia-200 px-3 py-1.5 text-sm font-semibold text-fuchsia-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
          >
            Danh sách Y tá
          </Button>
          <Button
            as="a"
            href={`/staff?role=${roleKey}&uid=${encodeURIComponent(user?.id || "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-fuchsia-100 bg-gradient-to-tr from-white to-fuchsia-50 px-3 py-1.5 text-sm font-semibold text-slate-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
          >
            Mở hồ sơ
          </Button>
        </div>
      </Section>

      {/* 2) Tùy chọn ứng dụng */}
      <Section title="Tùy chọn ứng dụng">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Ngôn ngữ">
            <select
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </Field>
          <Field label="Mật độ hiển thị">
            <select
              className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`}
              value={form.density}
              onChange={(e) => change("density", e.target.value)}
            >
              <option value="comfortable">Thoải mái</option>
              <option value="compact">Gọn</option>
            </select>
          </Field>
          <Field label=" " className="md:col-span-2">
            <label className="inline-flex items-center gap-2 mt-1">
              <input
                type="checkbox"
                checked={form.showTips}
                onChange={(e) => change("showTips", e.target.checked)}
              />
              Hiện mẹo / tooltip
            </label>
          </Field>
        </div>

        {/* Xuất / Nhập cấu hình */}
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
          <div className="text-sm font-semibold mb-2">Sao lưu cấu hình</div>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const data = localStorage.getItem("app.settings") || "{}";
                const blob = new Blob([data], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = "settings.json";
                a.click();
                URL.revokeObjectURL(a.href);
              }}
            >
              Xuất cấu hình
            </Button>
            <label className="btn cursor-pointer">
              Nhập cấu hình
              <input
                type="file"
                accept="application/json"
                hidden
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const text = await f.text();
                  localStorage.setItem("app.settings", text);
                  alert("Đã nhập cấu hình. Hãy tải lại trang để áp dụng.");
                }}
              />
            </label>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Thao tác này dùng LocalStorage. Sau khi nhập, hãy tải lại trang.
          </div>
        </div>
      </Section>

      {/* 3) Giao diện */}
      <Section title="Giao diện">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <div className="text-sm font-semibold">Chủ đề</div>
            <div className="inline-flex p-0.5 rounded-xl ring-1 ring-slate-200/80 bg-white mt-1">
              {["light", "dark"].map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme(m)}
                  className={`relative z-10 px-3 py-1.5 font-semibold ${
                    theme === m ? "text-fuchsia-700" : "text-slate-700"
                  }`}
                >
                  {theme === m && (
                    <motion.span
                      layoutId="settingsThemeActive"
                      className="absolute inset-0 rounded-lg bg-fuchsia-50"
                      transition={{ type: "spring", stiffness: 480, damping: 30 }}
                    />
                  )}
                  <span className="relative">{m === "light" ? "Sáng" : "Tối"}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Màu nhấn (accent)</div>
            <div className="flex items-center gap-2 mt-1">
              {[
                ["sky", "bg-sky-500"],
                ["emerald", "bg-emerald-500"],
                ["violet", "bg-violet-500"],
                ["amber", "bg-amber-500"],
                ["fuchsia", "bg-fuchsia-500"],
              ].map(([key, swatch]) => (
                <button
                  key={key}
                  onClick={() => change("accent", key)}
                  className={`relative w-8 h-8 rounded-full ring-2 transition ${
                    form.accent === key ? "ring-slate-900/50" : "ring-slate-200"
                  }`}
                  title={key}
                >
                  <span className={`absolute inset-0 rounded-full ${swatch}`} />
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              * Lưu để áp dụng rộng rãi (có thể dùng biến này cho theme global).
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="mt-7 grid grid-cols-3 gap-2">
          {["Card", "Chip", "Button"].map((k, i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="p-3 rounded-xl border border-slate-200 bg-white"
            >
              <div className="text-sm text-slate-600 mb-2">{k} preview</div>
              {k === "Card" && (
                <div className="rounded-lg p-2 bg-gradient-to-tr from-white to-slate-50 border border-slate-200">
                  Thẻ nội dung
                </div>
              )}
              {k === "Chip" && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ring-1 ring-slate-200 bg-slate-50">
                  <i
                    className={`w-2 h-2 rounded-full ${
                      form.accent === "emerald"
                        ? "bg-emerald-500"
                        : form.accent === "violet"
                        ? "bg-violet-500"
                        : form.accent === "amber"
                        ? "bg-amber-500"
                        : form.accent === "fuchsia"
                        ? "bg-fuchsia-500"
                        : "bg-sky-500"
                    }`}
                  />
                  Nhãn mẫu
                </span>
              )}
              {k === "Button" && (
                <div className="flex gap-1">
                  <Button>Button</Button>
                  <Button className="w-17" variant="primary">
                    Primary
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* 4) Bảo mật */}
      <Section title="Bảo mật">
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Mật khẩu hiện tại">
            <input type="password" className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`} placeholder="••••••••" />
          </Field>
          <Field label="Mật khẩu mới">
            <input type="password" className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`} placeholder="••••••••" />
          </Field>
          <Field label="Nhập lại mật khẩu mới" className="md:col-span-2">
            <input type="password" className={`mt-1 w-full rounded-md px-3 py-2 bg-white ${toneRing} outline-none`} placeholder="••••••••" />
          </Field>
        </div>
        <div className="flex justify-end mt-3">
          <Button
            className="mr-auto mt-5 mb-2 inline-flex items-center gap-2 rounded-xl border border-fuchsia-100 bg-gradient-to-tr from-fuchsia-100 to-fuchsia-50 px-3 py-1.5 text-sm font-semibold text-fuchsia-900 shadow hover:shadow-md hover:-translate-y-0.5 transition"
            variant="soft"
          >
            Đổi mật khẩu
          </Button>
        </div>
      </Section>

      {/* Footer actions */}
<div className="col-2 flex h-10 justify-end gap-2 px-0 w-full">
  <Button className="ml-auto" onClick={onReset}>
    Đặt lại
  </Button>
  <Button className="ml-2 mr-2" variant="primary" onClick={onSave}>
    Lưu cài đặt
  </Button>
</div>

    </div>
  );
}
