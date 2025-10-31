import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import { useEffect, useState } from "react";
import React from 'react';
export default function StockModal({ open, onClose, onSave, initial }) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    unit: "viên",
    price: 0,
    usage: "",
    qty: 0,
    exp: "",
    lot: "",
  });

  useEffect(() => {
    if (open) {
      setForm(
        initial || {
          code: "",
          name: "",
          unit: "viên",
          price: 0,
          usage: "",
          qty: 0,
          exp: "",
          lot: "",
        }
      );
    }
  }, [open, initial]);

  const valid =
    form.code.trim() &&
    form.name.trim() &&
    String(form.qty) !== "" &&
    Number(form.qty) >= 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Thông tin thuốc"
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h3 className="font-extrabold">
                {initial ? "Sửa thuốc" : "Thêm thuốc"}
              </h3>
              <Button onClick={onClose} aria-label="Đóng">
                ✕
              </Button>
            </header>

            <div className="p-4 grid gap-3">
              <label className="text-sm">
                Mã thuốc
                <input
                  className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={form.code}
                  onChange={(e) =>
                    setForm({ ...form, code: e.target.value.toUpperCase() })
                  }
                  placeholder="VD: TH123"
                />
              </label>
              <label className="text-sm">
                Tên thuốc
                <input
                  className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Paracetamol 500mg"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Đơn vị
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="viên/tuýp/chai…"
                  />
                </label>
                <label className="text-sm">
                  Giá (đ)
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value || 0) })
                    }
                  />
                </label>
              </div>

              <label className="text-sm">
                Công dụng
                <textarea
                  rows="2"
                  className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                  value={form.usage}
                  onChange={(e) => setForm({ ...form, usage: e.target.value })}
                  placeholder="Mô tả ngắn công dụng / chỉ định"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm">
                  Số lượng
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.qty}
                    onChange={(e) =>
                      setForm({ ...form, qty: Number(e.target.value || 0) })
                    }
                  />
                </label>
                <label className="text-sm">
                  Hạn dùng
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.exp || ""}
                    onChange={(e) => setForm({ ...form, exp: e.target.value })}
                  />
                </label>
                <label className="text-sm">
                  Số lô
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none"
                    value={form.lot || ""}
                    onChange={(e) => setForm({ ...form, lot: e.target.value })}
                    placeholder="VD: L0125"
                  />
                </label>
              </div>
            </div>

            <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200">
              <Button onClick={onClose}>Huỷ</Button>
              <Button
                className="btn-primary"
                disabled={!valid}
                aria-disabled={!valid}
                onClick={() => onSave?.(form)}
              >
                Lưu
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
