// src/components/patients/PatientFormMode.jsx
import React from "react";
import { motion } from "framer-motion";

// Đúng: từ src/components/patients -> lên src -> vào api
import { STATUSES } from "../../api/patients";
// Dùng EXTRA_FIELDS chung để hiển thị combobox “Thông tin bổ sung” (bệnh sử)
import { EXTRA_FIELDS } from "../../api/examination";

import { ANIMATION_CONFIG } from "./Shared.jsx";

export default function PatientFormMode({
  mode,
  form,
  change,
  firstRef,
  scrollTopRef,
  extras,
  removeExtra,
  pushExtra,
  newExtraKey,
  setNewExtraKey,
  newExtraVal,
  setNewExtraVal,
  onClose,
  onSubmit,
}) {
  return (
    <motion.form
      {...ANIMATION_CONFIG}
      onSubmit={onSubmit}
      className="space-y-3"
    >
      <div ref={scrollTopRef} />

      {/* Thông tin cơ bản */}
      <motion.div
        whileHover={{ y: -1 }}
        className="grid md:grid-cols-2 gap-3 p-3 rounded-2xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm"
      >
        <label className="text-sm font-semibold text-slate-700">
          Mã BN
          <input
            ref={firstRef}
            value={form.id || ""}
            onChange={(e) => change("id", e.target.value)}
            required
            disabled={mode === "edit"} // Sửa: không cho đổi mã BN khi edit
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Họ và tên
          <input
            value={form.name || ""}
            onChange={(e) => change("name", e.target.value)}
            required
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Ngày sinh
          <input
            type="date"
            value={form.dob || ""}
            onChange={(e) => change("dob", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Giới tính
          <select
            value={form.gender || ""}
            onChange={(e) => change("gender", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          >
            <option value="">—</option>
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Điện thoại
          <input
            value={form.phone || ""}
            onChange={(e) => change("phone", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Email
          <input
            value={form.email || ""}
            onChange={(e) => change("email", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700 md:col-span-2">
          Địa chỉ
          <input
            value={form.address || ""}
            onChange={(e) => change("address", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Trạng thái tài khoản
          <select
            value={form.accountStatus || "hoat_dong"}
            onChange={(e) => change("accountStatus", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          >
            <option value="hoat_dong">Hoạt động</option>
            <option value="da_xoa">Đã xóa</option>
            <option value="khong_hoat_dong">Không hoạt động</option>
          </select>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Trạng thái trong ngày
          <select
            value={form.status || STATUSES.WAIT_INTAKE}
            onChange={(e) => change("status", e.target.value)}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          >
            {mode === "add" ? (
              <>
                <option value={STATUSES.WAIT_INTAKE}>
                  {STATUSES.WAIT_INTAKE}
                </option>
                <option value={STATUSES.SCHEDULED_APPT}>
                  {STATUSES.SCHEDULED_APPT}
                </option>
              </>
            ) : (
              <>
                <option value={STATUSES.WAIT_INTAKE}>
                  {STATUSES.WAIT_INTAKE}
                </option>
                <option value={STATUSES.WAIT_EXAM}>
                  {STATUSES.WAIT_EXAM}
                </option>
                <option value={STATUSES.WAIT_PROC}>
                  {STATUSES.WAIT_PROC}
                </option>
                <option value={STATUSES.SCHEDULED_APPT}>
                  {STATUSES.SCHEDULED_APPT}
                </option>
                <option value={STATUSES.SCHEDULED_FUP}>
                  {STATUSES.SCHEDULED_FUP}
                </option>
                <option value={STATUSES.DONE}>{STATUSES.DONE}</option>
              </>
            )}
          </select>
        </label>
      </motion.div>

      {/* Thông tin bổ sung (dị ứng, bệnh sử,...) */}
      {extras.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          {extras.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-xl p-3 bg-white ring-1 ring-slate-200 flex items-center justify-between shadow-sm"
            >
              <div className="text-sm flex-1 min-w-0">
                <b className="text-slate-700">
                  {EXTRA_FIELDS.find((f) => f.key === ex.key)?.label ||
                    ex.key}
                  :
                </b>
                <span className="text-slate-600 ml-2">{ex.value}</span>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeExtra(i)}
                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs"
              >
                ✕
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Thêm dòng thông tin bổ sung */}
      <div className="flex items-end gap-2 p-3 rounded-xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={pushExtra}
          className="px-2 py-1 rounded-xl border-2 border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm hover:shadow transition whitespace-nowrap"
        >
          + Thêm thông tin
        </motion.button>
        <label className="text-sm flex-1">
          Loại
          <select
            value={newExtraKey}
            onChange={(e) => setNewExtraKey(e.target.value)}
            className="mt-1.5 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
          >
            {EXTRA_FIELDS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex-[2]">
          Nội dung
          <input
            value={newExtraVal}
            onChange={(e) => setNewExtraVal(e.target.value)}
            className="mt-1.5 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
            placeholder="Nhập nội dung..."
          />
        </label>
      </div>

      {/* Footer buttons */}
      <div className="flex items-center justify-end gap-3 pt-1">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onClose}
          className="px-6 py-2.5 rounded-xl ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
        >
          Hủy
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
        >
          {mode === "add" ? "Lưu bệnh nhân mới" : "Lưu thay đổi"}
        </motion.button>
      </div>
    </motion.form>
  );
}
