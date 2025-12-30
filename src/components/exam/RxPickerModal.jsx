// src/components/exam/RxPickerModal.jsx
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState, useDeferredValue } from "react";
import Button from "../ui/Button.jsx";
import { useSearchStock } from "../../api/pharmacy.js";

export default function RxPickerModal({ open, onClose, onPickMany }) {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState([]); // [{code,name,unit,price,dose,qty,usage}]
  const [stockPage, setStockPage] = useState(1);
  const inputRef = useRef(null);

  // ✅ Dùng searchStock với phân trang (pageSize nhỏ hơn vì là modal)
  const qDef = useDeferredValue(q);
  const stockQuery = useSearchStock({
    keyword: qDef || "",
    page: stockPage,
    pageSize: 20,
  }, { enabled: !!open });

  const stockResult = stockQuery.data || { Items: [], TotalItems: 0, Page: 1, PageSize: 20 };
  const stock = stockResult.Items || [];
  const stockTotalItems = stockResult.TotalItems || 0;
  const stockTotalPages = Math.ceil(stockTotalItems / 20);
  const isFetching = stockQuery.isFetching;

  useEffect(() => {
    if (open) {
      setRows([]);
      setQ("");
      setStockPage(1); // Reset về trang 1
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [open]);

  // ✅ Reset page khi search thay đổi
  useEffect(() => {
    if (stockPage > 1) setStockPage(1);
  }, [qDef]);

  const filtered = stock; // Đã được filter ở BE

  const alreadyPicked = (code) => rows.some((r) => r.code === code);
  function addDrug(d) {
    if (!alreadyPicked(d.code)) {
      setRows((s) => [...s, { ...d, dose: "", qty: 1 }]); // 👈 thay "" -> 1
    }
  }
  function removeDrug(code) { setRows((s) => s.filter((x) => x.code !== code)); }

  function onKeyDown(e) {
    if (e.key === "Escape") return onClose?.();
    const isSearch = e.target === inputRef.current;
    if (e.key === "Enter" && !e.ctrlKey && !e.metaKey) {
      if (isSearch) {
        e.preventDefault();
        const first = filtered[0];
        if (first) addDrug(first);
      }
      return;
    }
    if ((e.key === "Enter" && (e.ctrlKey || e.metaKey)) || e.key === "F9") {
      e.preventDefault();
      if (rows.length) onPickMany?.(rows);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/45 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="dialog" aria-modal="true" aria-label="Kê thuốc" onKeyDown={onKeyDown}>
          <motion.div
            className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
            initial={{ y: 18, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: -10, scale: 0.99, opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          >
            <header className="px-4 py-3 border-b border-slate-200 bg-gradient-to-b from-teal-600/10 to-white">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-extrabold text-slate-900">Kê thuốc</h3>
                  <p className="text-sm text-slate-600">Chọn từ kho • Nhập liều dùng / số lượng</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag bg-sky-50 text-sky-700 border-sky-200">Kết quả: <b className="ml-1">{stockTotalItems}</b></span>
                  <span className="tag bg-teal-50 text-teal-700 border-teal-200">Đã chọn: <b className="ml-1">{rows.length}</b></span>
                  <Button onClick={onClose} aria-label="Đóng" className="!px-2">✕</Button>
                </div>
              </div>
            </header>

            <div className="p-4 grid md:grid-cols-2 gap-3">
              {/* STOCK */}
              <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-3 border-b border-slate-200 flex items-center gap-2">
                  <label className="relative w-full">
                    <input
                      ref={inputRef}
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Tìm tên / công dụng / mã… (Enter: thêm mục đầu)"
                      className="w-full rounded-lg px-3 py-2 pl-9 bg-white ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                    <span className="absolute left-2 top-2.5 select-none">🔎</span>
                  </label>
                </div>

                <div className="max-h-80 overflow-y-auto p-2 scrollbar-none">
                  {isFetching && (
                    <div className="p-3 text-sm text-slate-500">Đang tải kho thuốc...</div>
                  )}
                  {!isFetching && filtered.map((d, i) => {
                    const picked = alreadyPicked(d.code);
                    return (
                      <motion.button
                        key={d.code} onClick={() => addDrug(d)} disabled={picked} aria-disabled={picked}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.01 }}
                        className={[
                          "w-full text-left rounded-lg px-3 py-2",
                          "border border-slate-200 bg-white",
                          "hover:-translate-y-px hover:shadow-soft transition",
                          "hover:border-teal-200 hover:bg-gradient-to-tr hover:from-teal-50/80 hover:to-white",
                          picked ? "opacity-60 cursor-not-allowed" : "",
                          "flex items-start justify-between gap-3",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500",
                          "mb-2",
                        ].join(" ")}
                      >
                        <div className="min-w-0">
                          <div className="font-semibold text-slate-900 truncate">{d.name}</div>
                          <div className="text-xs text-slate-500 truncate">{d.code} • {d.unit} • {d.usage}</div>
                        </div>
                        <div className="shrink-0">
                          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-bold bg-teal-50 text-teal-700 border-teal-200">
                            {Number(d.price || 0).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                
                {/* ✅ Pagination cho modal (nếu có nhiều trang) */}
                {stockTotalPages > 1 && (
                  <div className="px-3 py-2 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">
                      Trang {stockPage}/{stockTotalPages} ({stockTotalItems} kết quả)
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setStockPage(p => Math.max(1, p - 1))}
                        disabled={stockPage === 1}
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ←
                      </button>
                      <button
                        onClick={() => setStockPage(p => Math.min(stockTotalPages, p + 1))}
                        disabled={stockPage === stockTotalPages}
                        className="px-2 py-1 text-xs rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        →
                      </button>
                    </div>
                  </div>
                )}
              </section>

              {/* PICKED */}
              <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                <div className="p-3 border-b border-slate-200 font-semibold flex items-center justify-between">
                  <span>Thuốc đã chọn</span>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-none">
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-slate-700 sticky top-0 bg-white shadow-[inset_0_-1px_0_rgba(15,23,42,.06)]">
                      <tr><th className="px-3 py-2">Thuốc</th><th className="px-3 py-2">Liều</th><th className="px-3 py-2 w-24">SL</th><th className="px-3 py-2 w-10">Xóa</th></tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.code} className="align-top odd:bg-slate-50/40">
                          <td className="px-3 py-2">
                            <div className="font-semibold text-slate-900">{r.name}</div>
                            <div className="text-xs text-slate-500">{r.code} • {r.unit}</div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              value={r.dose}
                              onChange={(e) => setRows((s) => s.map((x) => (x.code === r.code ? { ...x, dose: e.target.value } : x)))}
                              placeholder="VD: 1v x 2 lần/ngày"
                              className="w-full rounded-md px-2 py-1 ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number" min="1" step="1"
                              value={r.qty}
                              onChange={(e) => {
                                const v = e.target.value;
                                const n = Math.max(1, Number.parseInt(v || "0", 10) || 1);
                                setRows((s) => s.map((x) => (x.code === r.code ? { ...x, qty: String(n) } : x)));
                              }}
                              placeholder="SL"
                              className="w-full rounded-md px-2 py-1 ring-1 ring-teal-200/80 focus:ring-2 focus:ring-teal-500 outline-none"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <Button type="button" className="!px-2" onClick={() => removeDrug(r.code)} aria-label={`Xóa ${r.name}`} title="Xóa">✕</Button>
                          </td>
                        </tr>
                      ))}
                      {!rows.length && <tr><td colSpan="4" className="px-3 py-6 text-slate-500">Chưa chọn thuốc. Nhấn vào danh sách bên trái để thêm.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <footer className="flex items-center justify-between gap-2 px-4 py-3 border-t border-slate-200 bg-white">
              <div className="text-xs text-slate-500">Gợi ý: Enter để thêm thuốc đầu, Ctrl+Enter hoặc F9 để xác nhận.</div>
              <div className="flex items-center gap-2">
                <Button type="button" onClick={onClose}>Huỷ</Button>
                <Button
  type="button"
  className="btn-primary"
  disabled={!rows.length}
  aria-disabled={!rows.length}
  onClick={() =>
    onPickMany?.(
      rows.map((r) => ({
        ...r,
        qty: Number.parseInt(String(r.qty || 0), 10) || 0,
      }))
    )
  }
>
  {rows.length ? `Thêm ${rows.length} thuốc` : "Kê"}
</Button>
                  
              </div>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
