import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import PopoverSelect from "../ui/PopoverSelect.jsx";
import { useUI } from "../../context/UIContext.jsx";

const EMPTY_FORM = {
  type: "he_thong",
  priority: "normal",
  target: "nhan_vien_y_te",
  title: "",
  message: "",
};

export default function AdminNotificationComposeModal({
  open,
  onClose,
  onSubmit,
  isPending = false,
}) {
  const { lang } = useUI();
  const [form, setForm] = useState(EMPTY_FORM);

  const t =
    lang === "en"
      ? {
          title: "Compose system notification",
          subtitle:
            "Send a broadcast to a target group from the admin notification workspace.",
          type: "Notification type",
          priority: "Priority",
          target: "Recipient group",
          heading: "Title",
          message: "Message",
          typePlaceholder: "Choose a notification type",
          priorityPlaceholder: "Choose a priority",
          targetPlaceholder: "Choose a recipient group",
          titlePlaceholder: "Example: Afternoon duty schedule adjustment",
          messagePlaceholder: "Enter the notification message...",
          cancel: "Cancel",
          submit: "Send notification",
          submitting: "Sending...",
        }
      : {
          title: "Soạn thông báo hệ thống",
          subtitle:
            "Gửi broadcast theo nhóm người nhận từ màn quản trị admin.",
          type: "Loại thông báo",
          priority: "Mức độ ưu tiên",
          target: "Nhóm nhận",
          heading: "Tiêu đề",
          message: "Nội dung",
          typePlaceholder: "Chọn loại thông báo",
          priorityPlaceholder: "Chọn mức độ ưu tiên",
          targetPlaceholder: "Chọn nhóm nhận",
          titlePlaceholder: "Ví dụ: Điều chỉnh lịch trực chiều nay",
          messagePlaceholder: "Nhập nội dung thông báo...",
          cancel: "Hủy",
          submit: "Gửi thông báo",
          submitting: "Đang gửi...",
        };

  const typeOptions = useMemo(
    () => [
      {
        value: "he_thong",
        label: lang === "en" ? "System" : "Hệ thống",
      },
      {
        value: "lich_hen",
        label: lang === "en" ? "Appointment" : "Lịch hẹn",
      },
      {
        value: "thanh_toan",
        label: lang === "en" ? "Payment" : "Thanh toán",
      },
      {
        value: "result",
        label: lang === "en" ? "Result" : "Kết quả",
      },
      {
        value: "reminder",
        label: lang === "en" ? "Reminder" : "Nhắc nhở",
      },
    ],
    [lang]
  );

  const priorityOptions = useMemo(
    () => [
      {
        value: "normal",
        label: lang === "en" ? "Normal" : "Thường",
      },
      {
        value: "cao",
        label: lang === "en" ? "High" : "Cao",
      },
    ],
    [lang]
  );

  const targetOptions = useMemo(
    () => [
      {
        value: "nhan_vien_y_te",
        label:
          lang === "en" ? "All healthcare staff" : "Toàn bộ nhân viên y tế",
      },
      {
        value: "bac_si",
        label: lang === "en" ? "Doctors" : "Bác sĩ",
      },
      {
        value: "y_ta",
        label: lang === "en" ? "Nurses" : "Y tá",
      },
      {
        value: "ky_thuat_vien",
        label: lang === "en" ? "Technicians" : "Kỹ thuật viên",
      },
      {
        value: "admin",
        label: "Admin",
      },
    ],
    [lang]
  );

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
              <h3 className="text-lg font-semibold text-slate-900">{t.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 md:grid-cols-3">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    {t.type}
                  </span>
                  <PopoverSelect
                    name="notification-type"
                    value={form.type}
                    onChange={(next) => update("type", next)}
                    options={typeOptions}
                    placeholder={t.typePlaceholder}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    {t.priority}
                  </span>
                  <PopoverSelect
                    name="notification-priority"
                    value={form.priority}
                    onChange={(next) => update("priority", next)}
                    options={priorityOptions}
                    placeholder={t.priorityPlaceholder}
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    {t.target}
                  </span>
                  <PopoverSelect
                    name="notification-target"
                    value={form.target}
                    onChange={(next) => update("target", next)}
                    options={targetOptions}
                    placeholder={t.targetPlaceholder}
                  />
                </label>
              </div>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  {t.heading}
                </span>
                <input
                  required
                  className="input"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  placeholder={t.titlePlaceholder}
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-600">
                  {t.message}
                </span>
                <textarea
                  required
                  rows={6}
                  className="input min-h-[148px] resize-y"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder={t.messagePlaceholder}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 rounded-b-2xl border-t border-slate-100 bg-white px-6 py-4">
              <button type="button" onClick={onClose} className="btn text-sm">
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-violet-600 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
              >
                {isPending ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
