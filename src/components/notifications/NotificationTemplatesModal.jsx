import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import ConfirmModal from "../ui/ConfirmModal.jsx";
import {
  useCreateNotificationTemplate,
  useDeleteNotificationTemplate,
  useNotificationTemplates,
  useUpdateNotificationTemplate,
} from "../../api/notifications.js";

const EMPTY_FORM = {
  tenMau: "",
  noiDungMau: "",
  bienDong: "",
  kichHoat: true,
};

function normalizeForm(template) {
  if (!template) return EMPTY_FORM;
  return {
    tenMau: template.TenMau || "",
    noiDungMau: template.NoiDungMau || "",
    bienDong: template.BienDong || "",
    kichHoat: template.KichHoat ?? true,
  };
}

export default function NotificationTemplatesModal({ open, onClose }) {
  const { data: templates = [], isLoading } = useNotificationTemplates({
    enabled: open,
  });
  const createTemplate = useCreateNotificationTemplate();
  const updateTemplate = useUpdateNotificationTemplate();
  const deleteTemplate = useDeleteNotificationTemplate();

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const activeId = editing?.MaMau || null;

  const sortedTemplates = useMemo(
    () =>
      [...(Array.isArray(templates) ? templates : [])].sort((a, b) =>
        String(a.TenMau || "").localeCompare(String(b.TenMau || ""), "vi")
      ),
    [templates]
  );

  if (!open) return null;

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (template) => {
    setEditing(template);
    setForm(normalizeForm(template));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      TenMau: form.tenMau.trim(),
      NoiDungMau: form.noiDungMau.trim(),
      BienDong: form.bienDong?.trim() || null,
      KichHoat: !!form.kichHoat,
    };

    if (editing?.MaMau) {
      updateTemplate.mutate(
        { id: editing.MaMau, data: payload },
        {
          onSuccess: () => {
            toast.success("Đã cập nhật mẫu thông báo");
            resetForm();
          },
          onError: (error) => {
            toast.error(error?.message || "Không thể cập nhật mẫu thông báo");
          },
        }
      );
      return;
    }

    createTemplate.mutate(payload, {
      onSuccess: () => {
        toast.success("Đã tạo mẫu thông báo");
        resetForm();
      },
      onError: (error) => {
        toast.error(error?.message || "Không thể tạo mẫu thông báo");
      },
    });
  };

  const handleDelete = (template) => {
    if (!template?.MaMau) return;
    deleteTemplate.mutate(template.MaMau, {
      onSuccess: () => {
        toast.success("Đã xóa mẫu thông báo");
        if (activeId === template.MaMau) resetForm();
        setDeleteTarget(null);
      },
      onError: (error) => {
        toast.error(error?.message || "Không thể xóa mẫu thông báo");
      },
    });
  };

  const isPending =
    createTemplate.isPending || updateTemplate.isPending || deleteTemplate.isPending;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: "spring", stiffness: 360, damping: 28 }}
          className="mx-4 grid max-h-[90vh] w-full max-w-6xl gap-0 overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80 lg:grid-cols-[1.2fr_1fr]"
        >
          <section className="border-r border-slate-100 bg-slate-50/70">
            <div className="border-b border-slate-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-4">
              <h3 className="text-lg font-semibold text-slate-900">
                Mẫu thông báo
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Admin quản lý nội dung mẫu dùng lại cho thông báo hệ thống.
              </p>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200/70">
                  Đang tải mẫu thông báo.
                </div>
              ) : !sortedTemplates.length ? (
                <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 ring-1 ring-slate-200/70">
                  Chưa có mẫu thông báo nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedTemplates.map((template) => {
                    const selected = activeId === template.MaMau;
                    return (
                      <article
                        key={template.MaMau}
                        className={`rounded-2xl bg-white p-4 ring-1 transition ${
                          selected
                            ? "ring-violet-300 shadow-sm"
                            : "ring-slate-200 hover:ring-violet-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold text-slate-900">
                              {template.TenMau}
                            </h4>
                            <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                              {template.NoiDungMau}
                            </p>
                          </div>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
                              template.KichHoat
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {template.KichHoat ? "Kích hoạt" : "Tắt"}
                          </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEdit(template)}
                            className="rounded-xl bg-violet-50 px-3 py-1.5 text-[13px] font-semibold text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-100"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(template)}
                            className="rounded-xl bg-rose-50 px-3 py-1.5 text-[13px] font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-100"
                          >
                            Xóa
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section className="flex max-h-[90vh] flex-col">
            <form onSubmit={handleSubmit} className="flex h-full flex-col">
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {editing ? "Cập nhật mẫu" : "Tạo mẫu mới"}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Dùng cho thông báo lặp lại hoặc broadcast định kỳ.
                    </p>
                  </div>
                  {editing ? (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="rounded-xl bg-slate-100 px-3 py-1.5 text-[13px] font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-200"
                    >
                      Tạo mới
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Tên mẫu
                  </span>
                  <input
                    required
                    className="input"
                    value={form.tenMau}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, tenMau: e.target.value }))
                    }
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Nội dung mẫu
                  </span>
                  <textarea
                    required
                    rows={8}
                    className="input min-h-[180px] resize-y"
                    value={form.noiDungMau}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        noiDungMau: e.target.value,
                      }))
                    }
                  />
                </label>

                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-600">
                    Biến động
                  </span>
                  <input
                    className="input"
                    value={form.bienDong}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, bienDong: e.target.value }))
                    }
                    placeholder='Ví dụ: ["ten_benh_nhan","gio_hen"]'
                  />
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={form.kichHoat}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        kichHoat: e.target.checked,
                      }))
                    }
                  />
                  Kích hoạt mẫu
                </label>
              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
                <button type="button" onClick={onClose} className="btn text-sm">
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl border-transparent bg-gradient-to-tr from-violet-600 via-violet-500 to-fuchsia-500 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-px disabled:opacity-50"
                >
                  {isPending ? "Đang lưu..." : editing ? "Cập nhật" : "Tạo mẫu"}
                </button>
              </div>
            </form>
          </section>
        </motion.div>
        <ConfirmModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
          title="Xác nhận xóa mẫu"
          message={
            deleteTarget
              ? `Xóa mẫu "${deleteTarget.TenMau}"?`
              : "Xóa mẫu thông báo này?"
          }
          confirmText="Xóa mẫu"
          cancelText="Hủy"
          tone="danger"
          isPending={deleteTemplate.isPending}
        />
      </div>
    </AnimatePresence>
  );
}
