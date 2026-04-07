// src/components/prescriptions/PrescToolbar.jsx
import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button.jsx";
import Chip from "../ui/Chip.jsx";

const tabs = [
  { key: "orders", label: "Đơn đã kê" },
  { key: "stock", label: "Kho thuốc" },
];

export default function PrescToolbar({
  tab,
  setTab,

  // thống kê đơn
  ordersCount,
  ordersCreatedCount = 0,
  ordersPendingCount = 0,
  ordersDoneCount = 0,

  // thống kê kho
  stockCount,
  stockActiveCount = 0,
  stockExpiredCount = 0,     // ⚠ prop cũ, nhưng dùng cho "Hết hạn"
  stockNearExpiryCount = 0,
  stockNearOutCount = 0,

  // filter kho (để hiển thị trạng thái hiện tại nếu cần sau này)
  unit,
  stockStatus,

  // control filter popover (ở page)
  filterBtnRef,
  onOpenFilter,
  onResetFilters,
  showStockManageAction = false,
  onAddStock,
}) {
  const isOrders = tab === "orders";

  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {/* CHIP THỐNG KÊ BÊN TRÁI */}
      {isOrders ? (
        <>
          <Chip dot="slate">
            Tổng đơn:&nbsp;<b>{ordersCount}</b>
          </Chip>
          <Chip dot="sky">
            Đã kê:&nbsp;
            <b>{ordersCreatedCount}</b>
          </Chip>
          <Chip dot="amber">
            Chờ phát:&nbsp;<b>{ordersPendingCount}</b>
          </Chip>
          <Chip dot="emerald">
            Đã phát:&nbsp;<b>{ordersDoneCount}</b>
          </Chip>
        </>
      ) : (
        <>
          <Chip dot="slate">
            Tổng thuốc:&nbsp;<b>{stockCount}</b>
          </Chip>
          <Chip dot="emerald">
            Hoạt động:&nbsp;<b>{stockActiveCount}</b>
          </Chip>
          <Chip dot="rose">
            Hết hạn:&nbsp;<b>{stockExpiredCount }</b>
          </Chip>
          <Chip dot="amber">
            Sắp hết hạn:&nbsp;<b>{stockNearExpiryCount}</b>
          </Chip>
          <Chip dot="sky">
            Sắp hết tồn:&nbsp;<b>{stockNearOutCount}</b>
          </Chip>
        </>
      )}

      {/* TAB + LỌC + RESET BÊN PHẢI */}
      <div className="flex flex-wrap items-center gap-2 ml-auto">
       
        <button
          type="button"
          onClick={onResetFilters}
          className="inline-flex items-center justify-center rounded-2xl bg-white ring-1 ring-slate-200 hover:ring-violet-400 text-xs px-3 py-2 shadow-sm"
          title="Làm mới bộ lọc"
        >
          ⟲
        </button>
        <Button
          ref={filterBtnRef}
          type="button"
          onClick={onOpenFilter}
          data-popover-anchor="presc-filter"
          className="
            flex items-center gap-1 px-3 py-1.5 rounded-xl
            bg-white ring-1 ring-indigo-200 hover:ring-indigo-400
            text-[13px] shadow-sm
          "
        >
          <span className="text-indigo-600">🔍</span>
          Lọc
        </Button>

        {!isOrders && showStockManageAction && onAddStock ? (
          <Button
            type="button"
            onClick={onAddStock}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 px-3 py-1.5 text-[13px] font-semibold text-white shadow-sm transition hover:-translate-y-px"
          >
            <span className="text-base leading-none">+</span>
            Thêm thuốc
          </Button>
        ) : null}

        {/* Segmented tabs */}
        <div
          className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-indigo-200/70 bg-white"
          role="tablist"
          aria-label="Chọn chế độ hiển thị"
        >
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setTab(t.key)}
                className={`relative z-10 px-3 py-1.5 text-[13px] font-semibold transition-colors ${
                  active
                    ? "text-indigo-700"
                    : "text-slate-700 hover:text-indigo-700"
                }`}
                title={t.label}
              >
                {active && (
                  <motion.span
                    layoutId="prescTabPill"
                    className="absolute inset-0 rounded-lg bg-indigo-50"
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
