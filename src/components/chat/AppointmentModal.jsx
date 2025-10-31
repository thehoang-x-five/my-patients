import React from 'react';
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

export default function AppointmentModal({
  open,
  onClose,
  onCreate,
  presetName,
}) {
  const firstRef = useRef(null);
  const [form, setForm] = useState({
    name: presetName || "",
    datetime: "",
    dept: "",
    doctor: "",
    note: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm((s) => ({ ...s, name: presetName || s.name }));
    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, presetName]);

  function change(k, v) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  const canCreate = form.name.trim() && form.datetime && form.dept.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-slate-900/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Tạo lịch hẹn"
          onClick={(e) => e.target === e.currentTarget && onClose?.()}
        >
          <motion.section
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
            className="w-full max-w-lg rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-2xl p-4"
          >
            <header className="flex items-center justify-between">
              <b className="text-lg">Tạo lịch hẹn</b>
              <button className="btn !px-2" onClick={onClose} aria-label="Đóng">
                ✕
              </button>
            </header>

            <div className="mt-3 grid gap-3">
              <label className="text-sm">
                Bệnh nhân
                <input
                  ref={firstRef}
                  className="input mt-1"
                  value={form.name}
                  onChange={(e) => change("name", e.target.value)}
                  placeholder="Tên bệnh nhân"
                />
              </label>
              <label className="text-sm">
                Thời gian
                <input
                  type="datetime-local"
                  className="input mt-1"
                  value={form.datetime}
                  onChange={(e) => change("datetime", e.target.value)}
                />
              </label>
              <label className="text-sm">
                Khoa
                <input
                  className="input mt-1"
                  value={form.dept}
                  onChange={(e) => change("dept", e.target.value)}
                  placeholder="VD: Nội, Tai mũi họng…"
                />
              </label>
              <label className="text-sm">
                Bác sĩ
                <input
                  className="input mt-1"
                  value={form.doctor}
                  onChange={(e) => change("doctor", e.target.value)}
                  placeholder="Tên bác sĩ (tuỳ chọn)"
                />
              </label>
              <label className="text-sm">
                Ghi chú
                <textarea
                  className="input mt-1"
                  rows="3"
                  value={form.note}
                  onChange={(e) => change("note", e.target.value)}
                />
              </label>
            </div>

            <footer className="mt-3 flex items-center justify-end gap-2">
              <button className="btn" onClick={onClose}>
                Huỷ
              </button>
              <button
                className="btn btn-primary"
                disabled={!canCreate}
                aria-disabled={!canCreate}
                onClick={() => onCreate?.(form)}
              >
                Lưu lịch hẹn
              </button>
            </footer>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
