// src/components/prescriptions/PrescToolbar.jsx
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";
import React from 'react';
export default function PrescToolbar({
  tab,
  setTab,
  qOrders,
  setQOrders,
  qStock,
  setQStock,
  unit,
  setUnit,
  nearOnly,
  setNearOnly,
  ordersCount = 0,
  stockCount = 0,
}) {
  const tabs = [
    { key: "orders", label: "Đơn đã kê" },
    { key: "stock", label: "Kho thuốc" },
  ];

  return (
    <div
      className="mt-0 w-full flex flex-col gap-2 md:flex-row md:items-center"
      role="toolbar"
      aria-label="Thanh công cụ Đơn thuốc"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Chip dot="sky">
          {tab === "orders" ? (
            <>
              Tổng đơn: <b className="ml-1">{ordersCount}</b>
            </>
          ) : (
            <>
              Tổng thuốc: <b className="ml-1">{stockCount}</b>
            </>
          )}
        </Chip>
      </div>

      <div
        className="ml-0 md:ml-auto flex items-center gap-2"
        role="tablist"
        aria-label="Chọn mục"
      >
        {tab === "stock" && (
          <div className="flex flex-wrap items-center gap-3 ">
            <button
              type="button"
              role="switch"
              aria-checked={nearOnly}
              onClick={() => setNearOnly(!nearOnly)}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition ${
                nearOnly
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-white text-slate-700 ring-1 ring-slate-200/80"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full inline-block ${
                  nearOnly ? "bg-amber-500" : "bg-slate-300"
                }`}
              />
              Gần hết hạn
            </button>

            <div className="relative">
              <select
                aria-label="Lọc theo đơn vị"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mr-1 appearance-none rounded-xl px-4 py-1.5 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
              >
                {["", "viên", "chai", "tuýp", "gói", "ống", "vỉ"].map((u) => (
                  <option key={u} value={u}>
                    {u ? u : "Tất cả đơn vị"}
                  </option>
                ))}
              </select>
              <motion.span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-slate-500">
                ▾
              </motion.span>
            </div>

            <label className="relative">
              <span className="sr-only">Tìm trong kho</span>
              <input
                value={qStock}
                onChange={(e) => setQStock(e.target.value)}
                placeholder="Tìm theo tên / công dụng / mã…"
                className="rounded-xl px-3 py-2 pl-9 pr-6 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
              />
              <span className="absolute left-2 top-1.5">🔎</span>
              {qStock && (
                <button
                  type="button"
                  onClick={() => setQStock("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </label>
          </div>
        )}

        {tab === "orders" && (
          <label className="relative">
            <span className="sr-only">Tìm đơn đã kê</span>
            <input
              value={qOrders}
              onChange={(e) => setQOrders(e.target.value)}
              placeholder="Tìm theo mã đơn / BN / bác sĩ…"
              className="rounded-xl px-3 py-2 pl-9 pr-6 bg-white focus:ring-2 ring-1 ring-slate-200/80 outline-none focus:ring-brand-500"
            />
            <span className="absolute left-2 top-1.5">🔎</span>
            {qOrders && (
              <button
                type="button"
                onClick={() => setQOrders("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                aria-label="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </label>
        )}

        <div className="relative ml-1 inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-slate-200/80 bg-white">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`relative z-9 px-3 py-1.5 font-semibold ${
                  active ? "text-sky-700" : "text-slate-700"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="prescTabPill"
                    className="absolute inset-0 rounded-lg bg-sky-50"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
