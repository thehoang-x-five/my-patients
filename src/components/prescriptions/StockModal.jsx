// src/components/prescriptions/StockModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import React, { useEffect, useState } from "react";

const EMPTY_FORM = {
  code: "",
  name: "",
  unit: "",
  price: 0,
  usage: "",
  qty: 0,
  exp: "",
  lot: "",
  status: "hoat_dong",
};

export default function StockModal({ open, item, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!open) return;
    if (item) {
      let exp = "";
      const rawExp = item.exp ?? item.hanSuDung ?? item.HanSuDung;
      if (rawExp) {
        if (rawExp instanceof Date) {
          exp = rawExp.toISOString().slice(0, 10);
        } else {
          const s = String(rawExp);
          exp = s.slice(0, 10);
        }
      }

      setForm({
        ...EMPTY_FORM,
        ...item,
        code: item.code || item.maThuoc || item.MaThuoc || "",
        name: item.name || item.tenThuoc || item.TenThuoc || "",
        unit: item.unit || item.donViTinh || item.DonViTinh || "",
        price:
          Number(
            item.price ??
              item.giaNiemYet ??
              item.GiaNiemYet ??
              item.giaBanLe ??
              item.GiaBanLe ??
              0
          ) || 0,
        qty:
          Number(item.qty ?? item.soLuongTon ?? item.SoLuongTon ?? 0) || 0,
        usage: item.usage || item.congDung || item.CongDung || "",
        lot: item.lot || item.soLo || item.SoLo || "",
        exp,
        status:
          item.status ||
          item.trangThai ||
          item.TrangThai ||
          "hoat_dong",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, item]);

  const valid =
    form.code.trim() !== "" &&
    form.name.trim() !== "" &&
    form.unit.trim() !== "";

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={item ? "Sửa thuốc" : "Thêm thuốc"}
        >
          <motion.div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200/80"
            initial={{ y: 16, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -8, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            {/* THAY ĐỔI: Thêm 'rounded-t-2xl' */}
            <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 rounded-t-2xl">
              <h2 className="text-lg font-semibold text-slate-800">
                {item ? "Sửa thuốc trong kho" : "Thêm thuốc vào kho"}
              </h2>
              <Button
                onClick={onClose}
                aria-label="Đóng"
                className="rounded-full !px-2"
              >
                ✕
              </Button>
            </header>

            <div className="px-4 py-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm col-span-1">
                  Mã thuốc
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.code}
                    onChange={(e) =>
                      updateField("code", e.target.value.trim())
                    }
                    placeholder="VD: PARA500"
                    disabled={!!item?.code}
                  />
                </label>
                <label className="text-sm col-span-2">
                  Tên thuốc
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.name}
                    onChange={(e) =>
                      updateField("name", e.target.value)
                    }
                    placeholder="Paracetamol 500mg"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Đơn vị
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.unit}
                    onChange={(e) =>
                      updateField("unit", e.target.value)
                    }
                    placeholder="viên/tuýp/chai…"
                  />
                </label>
                <label className="text-sm">
                  Giá (đ)
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.price}
                    onChange={(e) =>
                      updateField(
                        "price",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </label>
              </div>

              <label className="text-sm">
                Công dụng
                <textarea
                  rows="2"
                  className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.usage}
                  onChange={(e) =>
                    updateField("usage", e.target.value)
                  }
                  placeholder="Mô tả ngắn công dụng / chỉ định"
                />
              </label>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm">
                  Số lượng
                  <input
                    type="number"
                    min="0"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.qty}
                    onChange={(e) =>
                      updateField(
                        "qty",
                        Number(e.target.value || 0)
                      )
                    }
                  />
                </label>
                <label className="text-sm">
                  Hạn dùng
                  <input
                    type="date"
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.exp || ""}
                    onChange={(e) =>
                      updateField("exp", e.target.value)
                    }
                  />
                </label>
                <label className="text-sm">
                  Số lô
                  <input
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.lot || ""}
                    onChange={(e) =>
                      updateField("lot", e.target.value)
                    }
                    placeholder="VD: L0125"
                  />
                </label>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <label className="text-sm col-span-1">
                  Trạng thái
                  <select
                    className="mt-1 w-full rounded-md px-3 py-2 ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                    value={form.status}
                    onChange={(e) =>
                      updateField("status", e.target.value)
                    }
                  >
                    <option value="hoat_dong">Hoạt động</option>
                    <option value="tam_dung">Tạm dừng</option>
                    <option value="het_han">Hết hạn</option>
                  </select>
                </label>
              </div>
            </div>

            {/* THAY ĐỔI: Thêm 'rounded-b-2xl' */}
            <footer className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50/60 rounded-b-2xl">
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