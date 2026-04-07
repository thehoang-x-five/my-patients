import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PopoverSelect from "../ui/PopoverSelect.jsx";

const TYPE_OPTIONS = [
  { value: "he_thong", label: "Hệ thống" },
  { value: "lich_hen", label: "Lịch hẹn" },
  { value: "thanh_toan", label: "Thanh toán" },
  { value: "result", label: "Kết quả" },
  { value: "reminder", label: "Nhắc nhở" },
];

const PRIORITY_OPTIONS = [
  { value: "thuong", label: "Thường" },
  { value: "cao", label: "Cao" },
];

const TARGET_OPTIONS = [
  { value: "nhan_vien_y_te", label: "Toàn bộ nhân viên y tế" },
  { value: "bac_si", label: "Bác sĩ" },
  { value: "y_ta", label: "Y tá" },
  { value: "ky_thuat_vien", label: "Kỹ thuật viên" },
  { value: "admin", label: "Admin" },
];

const EMPTY_FORM = {
  type: "he_thong",
  priority: "thuong",
  target: "nhan_vien_y_te",
  title: "",
  message: "",
};

const TYPE_SELECT_OPTIONS = TYPE_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const PRIORITY_SELECT_OPTIONS = PRIORITY_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

const TARGET_SELECT_OPTIONS = TARGET_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

export default function AdminNotificationComposeModal({
  open,
  onClose,
  onSubmit,
  isPending = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);

  if (!open) return null;

  const update = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit?.({
      type: form.type,
      title: form.title.trim(),
      message: form.message.trim(),
      priority: form.priority,
      recipients: [{ LoaiNguoiNhan: form.target, MaNguoiNhan: "" }],
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="mx-4 w-full max-w-2xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
        >
          <form onSubmit={handleSubmit}>
            <div className="rounded-t-2xl border-b border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Soạn thông báo hệ thống
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Gửi broadcast theo nhóm người nhận từ màn quản trị admin.
              </p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Loại thông báo
                  </span>
                  <PopoverSelect
                    name="notification-type"
                    value={form.type}
                    onChange={(next) => update("type", next)}
                    options={TYPE_SELECT_OPTIONS}
                    placeholder="Chon loai thong bao"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Mức độ ưu tiên
                  </span>
                  <PopoverSelect
                    name="notification-priority"
                    value={form.priority}
                    onChange={(next) => update("priority", next)}
                    options={PRIORITY_SELECT_OPTIONS}
                    placeholder="Chon muc do uu tien"
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Nhóm nhận
                  </span>
                  <PopoverSelect
                    name="notification-target"
                    value={form.target}
                    onChange={(next) => update("target", next)}
                    options={TARGET_SELECT_OPTIONS}
                    placeholder="Chon nhom nhan"
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  Tiêu đề
                </span>
                <input
                  required
                  className="input"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder="Ví dụ: Điều chỉnh lịch trực chiều nay"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  Nội dung
                </span>
                <textarea
                  required
                  rows={6}
                  className="input min-h-[148px] resize-y"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Nhập nội dung thông báo..."
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={onClose} className="btn text-sm">
                Hủy
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-violet-600 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
              >
                {isPending ? "Đang gửi..." : "Gửi thông báo"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
