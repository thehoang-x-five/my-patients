// src/components/patients/PatientFormMode.jsx
import React from "react";
import { motion } from "framer-motion";
import PopoverSelect from "../ui/PopoverSelect.jsx";

// Đúng: từ src/components/patients -> lên src -> vào api
import { STATUSES, TODAY_STATUS_MAP } from "../../api/patients";
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
            required={mode !== "add"} // Không required khi add (backend tự sinh)
            disabled={mode === "edit" || mode === "add"} // Không cho nhập khi edit hoặc add (backend tự sinh)
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm disabled:bg-slate-50 disabled:text-slate-500"
            placeholder={mode === "add" ? "Mã bệnh nhân sẽ được tự động tạo" : ""}
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
            required={mode === "add"}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Giới tính
          <div className="mt-2">
            <PopoverSelect
              name="gender"
              value={form.gender || ""}
              onChange={(value) => change("gender", value)}
              options={[
                { value: "", label: "—" },
                { value: "Nam", label: "Nam" },
                { value: "Nữ", label: "Nữ" },
                { value: "Khác", label: "Khác" },
              ]}
              placeholder="Chọn giới tính"
            />
          </div>
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Điện thoại
          <input
            type="tel"
            value={form.phone || ""}
            onChange={(e) => change("phone", e.target.value)}
            required={mode === "add"}
            className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Email
          <input
            type="email"
            value={form.email || ""}
            onChange={(e) => change("email", e.target.value)}
            required={mode === "add"}
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
          <div className="mt-2">
            <PopoverSelect
              name="accountStatus"
              value={form.accountStatus || "hoat_dong"}
              onChange={(value) => change("accountStatus", value)}
              disabled={mode === "add"}
              options={[
                { value: "hoat_dong", label: "Hoạt động" },
                { value: "da_xoa", label: "Đã xóa" },
                { value: "khong_hoat_dong", label: "Không hoạt động" },
              ]}
              placeholder="Chọn trạng thái tài khoản"
            />
          </div>
        </label>

        <label className="text-sm font-semibold text-slate-700">
          Trạng thái trong ngày
          <div className="mt-2">
            <PopoverSelect
              name="status"
              value={mode === "add" ? form.status || STATUSES.WAIT_INTAKE : form.status || ""}
              onChange={(value) => change("status", value)}
              disabled
              options={
                mode === "add"
                  ? [
                      {
                        value: STATUSES.WAIT_INTAKE,
                        label:
                          TODAY_STATUS_MAP[STATUSES.WAIT_INTAKE] ||
                          STATUSES.WAIT_INTAKE,
                      },
                    ]
                  : [
                      ...(form.status
                        ? [
                            {
                              value: form.status,
                              label: TODAY_STATUS_MAP[form.status] || form.status,
                            },
                          ]
                        : [{ value: "", label: "—" }]),
                      ...Object.entries(TODAY_STATUS_MAP)
                        .filter(([key]) => key !== form.status)
                        .map(([key, label]) => ({
                          value: key,
                          label,
                          disabled: true,
                        })),
                    ]
              }
              placeholder="Trạng thái trong ngày"
            />
          </div>
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
          <div className="mt-1.5">
            <PopoverSelect
              name="newExtraKey"
              value={newExtraKey}
              onChange={(value) => setNewExtraKey(value)}
              options={EXTRA_FIELDS.map((o) => ({
                value: o.key,
                label: o.label,
              }))}
              placeholder="Chọn loại thông tin"
            />
          </div>
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
