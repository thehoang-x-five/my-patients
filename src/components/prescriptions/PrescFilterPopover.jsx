// src/components/prescriptions/PrescFilterPopover.jsx
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";

function Chip({ active, dot, children, ...rest }) {
  const base =
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-medium cursor-pointer select-none transition";
  const activeCls =
    "bg-violet-600/10 text-violet-700 ring-1 ring-violet-300 shadow-sm";
  const inactiveCls =
    "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-violet-300 hover:text-violet-700";
  const dotMap = {
    rose: "bg-rose-400",
    violet: "bg-violet-500",
    amber: "bg-amber-400",
    sky: "bg-sky-400",
    red: "bg-red-400",
    emerald: "bg-emerald-400",
    indigo: "bg-indigo-300",
    slate: "bg-slate-400",
  };
  const dotCls = dotMap[dot] || "bg-indigo-300";
  return (
    <button
      type="button"
      className={`${base} ${active ? activeCls : inactiveCls}`}
      {...rest}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotCls}`}
          aria-hidden="true"
        />
      )}
      <span>{children}</span>
    </button>
  );
}

const ORDER_STATUS_SEG = ["Tất cả", "Đã kê", "Chờ phát", "Đã phát", "Đã hủy"];

const ORDER_RANGE_SEG = [
  { value: "all", label: "Tất cả" },
  { value: "today", label: "Hôm nay" },
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "custom", label: "Tùy chọn" },
];

const ORDER_PRICE_SEG = [
  { value: "all", label: "Tất cả" },
  { value: "0-100000", label: "< 100k" },
  { value: "100000-500000", label: "100k – 500k" },
  { value: "500000-1000000", label: "500k – 1tr" },
  { value: "1000000-", label: "> 1 triệu" },
];

const STOCK_STATUS_SEG = [
  { code: "all", label: "Tất cả" },
  { code: "hoat_dong", label: "Hoạt động" },
  { code: "het_han", label: "Hết hạn" },
  { code: "sap_het_han", label: "Sắp hết hạn" },
  { code: "sap_het_ton", label: "Sắp hết tồn" },
];

export default function PrescFilterPopover({
  open,
  onClose,
  anchorEl,
  tab = "orders",

  qOrders,
  setQOrders,
  qStock,
  setQStock,

  unit,
  setUnit,

  orderStatus = "Tất cả",
  setOrderStatus = () => {},
  orderRange = "all",
  setOrderRange = () => {},

  // ✅ NEW: custom date range cho cả 2 tab
  orderFromDate = "",
  setOrderFromDate = () => {},
  orderToDate = "",
  setOrderToDate = () => {},

  // ✅ NEW: Lọc theo mệnh giá đơn thuốc
  orderPriceRange = "all",
  setOrderPriceRange = () => {},

  // ✅ NEW: Lọc theo lô (stock tab)
  stockLot = "",
  setStockLot = () => {},
  lotOptions = [], // dynamic từ data

  // ✅ NEW: custom date range cho kho
  stockExpFrom = "",
  setStockExpFrom = () => {},
  stockExpTo = "",
  setStockExpTo = () => {},

  stockStatus = "all",
  setStockStatus = () => {},
  onResetFilters,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  useEffect(() => {
    if (!open) return;
    justOpenedRef.current = true;

    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    const onClickOutside = (e) => {
      if (justOpenedRef.current) return;
      const target = e.target;
      const onAnchorBtn = !!target?.closest?.(
        '[data-popover-anchor="presc-filter"]'
      );
      if (onAnchorBtn) return;
      const inside = boxRef.current?.contains(target);
      const insideAnchor =
        anchorNode && anchorNode.contains && anchorNode.contains(target);
      if (!inside && !insideAnchor) onClose?.();
    };

    document.addEventListener("keydown", onKey, true);
    const t = setTimeout(() => {
      justOpenedRef.current = false;
      document.addEventListener("click", onClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", onClickOutside, true);
      clearTimeout(t);
    };
  }, [open, onClose, anchorNode]);

  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [maxH, setMaxH] = useState(600);
  const [widthPx, setWidthPx] = useState(380);

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const W = Math.min(390, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const r = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;

    const estH = 520;
    if (top + estH > vh - 12 && r) {
      top = Math.max(12, r.top - gap - estH);
    }

    setWidthPx(W);
    setPos({ top, left });
    setMaxH(Math.min(vh - top - 12, 650));
  }

  useLayoutEffect(() => {
    if (open) computePosition();
  }, [open, anchorNode]);

  useEffect(() => {
    if (!open) return;
    const handler = () => computePosition();
    window.addEventListener("resize", handler, { passive: true });
    window.addEventListener("scroll", handler, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handler);
      window.visualViewport.addEventListener("scroll", handler);
    }
    setTimeout(() => kwRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handler);
        window.visualViewport.removeEventListener("scroll", handler);
      }
    };
  }, [open, anchorNode]);

  if (typeof document === "undefined") return null;

  const isOrders = tab === "orders";
  const kw = isOrders ? qOrders ?? "" : qStock ?? "";

  const setKw = (v) => {
    if (isOrders) setQOrders?.(v);
    else setQStock?.(v);
  };

  // helper: khi chọn quick range → auto compute from/to
  const handleOrderQuickRange = (value) => {
    setOrderRange(value);
    if (value === "all") {
      setOrderFromDate("");
      setOrderToDate("");
      return;
    }
    if (value === "custom") return; // giữ nguyên date inputs

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const toStr = today.toISOString().slice(0, 10);

    if (value === "today") {
      setOrderFromDate(toStr);
      setOrderToDate(toStr);
    } else if (value === "7d") {
      const from = new Date(today);
      from.setDate(from.getDate() - 6);
      setOrderFromDate(from.toISOString().slice(0, 10));
      setOrderToDate(toStr);
    } else if (value === "30d") {
      const from = new Date(today);
      from.setDate(from.getDate() - 29);
      setOrderFromDate(from.toISOString().slice(0, 10));
      setOrderToDate(toStr);
    }
  };

  const uniqueLots = useMemo(() => {
    const raw = Array.isArray(lotOptions) ? lotOptions : [];
    const set = new Set(raw.filter(Boolean).map((l) => String(l).trim()));
    return Array.from(set).sort();
  }, [lotOptions]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed z-[100]"
          style={{ top: pos.top, left: pos.left, width: widthPx }}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <div
            ref={boxRef}
            role="dialog"
            aria-modal="true"
            aria-label="Bộ lọc đơn / kho"
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-indigo-200/80 overflow-hidden"
            style={{ maxHeight: maxH }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-indigo-50 via-violet-50 to-indigo-50 border-b border-indigo-100">
              <div className="text-[13px] font-extrabold tracking-tight text-indigo-800 flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-lg bg-white ring-1 ring-indigo-200 items-center justify-center">
                  🔎
                </span>
                {isOrders ? "Bộ lọc đơn thuốc" : "Bộ lọc kho thuốc"}
              </div>
            </div>

            <div className="p-2.5 grid gap-2.5 overflow-y-auto scrollbar-none text-[13px] text-slate-700" style={{ maxHeight: maxH - 100 }}>
              {/* Từ khóa */}
              <label className="text-[13px]">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={kw}
                    onChange={(e) => setKw(e.target.value)}
                    placeholder={
                      isOrders
                        ? "Mã đơn / Tên BN / Bác sĩ / CĐ…"
                        : "Tên thuốc / mã / công dụng…"
                    }
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm text-[13px]"
                  />
                  <span className="absolute left-2 top-2.5 text-indigo-600">
                    🔍
                  </span>
                  {kw && (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setKw("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              {isOrders ? (
                <>
                  {/* Trạng thái đơn */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Trạng thái đơn</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ORDER_STATUS_SEG.map((s) => (
                        <Chip
                          key={s}
                          active={orderStatus === s}
                          onClick={() => setOrderStatus(s)}
                          dot={
                            s === "Đã kê"
                              ? "sky"
                              : s === "Chờ phát"
                              ? "amber"
                              : s === "Đã phát"
                              ? "emerald"
                              : s === "Đã hủy"
                              ? "rose"
                              : "slate"
                          }
                        >
                          {s}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* ✅ Khoảng thời gian — mẫu giống Báo cáo */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Khoảng thời gian</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ORDER_RANGE_SEG.map((r) => (
                        <Chip
                          key={r.value}
                          active={orderRange === r.value}
                          onClick={() => handleOrderQuickRange(r.value)}
                        >
                          {r.label}
                        </Chip>
                      ))}
                    </div>

                    {/* Date pickers — hiện khi "Tùy chọn" hoặc khi đã có giá trị custom */}
                    {(orderRange === "custom" || orderFromDate || orderToDate) && (
                      <div className="mt-2 rounded-2xl bg-indigo-50/60 ring-1 ring-indigo-100 px-2.5 py-2.5">
                        <div className="flex items-center justify-between text-[11px] mb-1.5">
                          <span className="font-medium text-slate-500">
                            Khoảng ngày cụ thể
                          </span>
                          <span className="text-[10px] text-indigo-600/70">
                            Chọn nhanh bằng lịch ↓
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex-1 text-[11px] text-slate-500">
                            Từ ngày
                            <div className="mt-0.5 relative">
                              <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-indigo-500">
                                📅
                              </span>
                              <input
                                type="date"
                                value={orderFromDate || ""}
                                onChange={(e) => {
                                  setOrderFromDate(e.target.value);
                                  setOrderRange("custom");
                                }}
                                className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </label>
                          <span className="text-slate-400 text-xs mt-4">–</span>
                          <label className="flex-1 text-[11px] text-slate-500">
                            Đến ngày
                            <div className="mt-0.5 relative">
                              <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-indigo-500">
                                📅
                              </span>
                              <input
                                type="date"
                                value={orderToDate || ""}
                                onChange={(e) => {
                                  setOrderToDate(e.target.value);
                                  setOrderRange("custom");
                                }}
                                className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ✅ Lọc theo mệnh giá đơn thuốc */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Mệnh giá đơn thuốc</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ORDER_PRICE_SEG.map((p) => (
                        <Chip
                          key={p.value}
                          active={orderPriceRange === p.value}
                          onClick={() => setOrderPriceRange(p.value)}
                          dot={
                            p.value === "all"
                              ? "slate"
                              : p.value === "1000000-"
                              ? "rose"
                              : p.value.startsWith("500000")
                              ? "amber"
                              : "indigo"
                          }
                        >
                          {p.label}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Trạng thái kho */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Trạng thái kho</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {STOCK_STATUS_SEG.map((s) => (
                        <Chip
                          key={s.code}
                          active={stockStatus === s.code}
                          onClick={() => setStockStatus(s.code)}
                          dot={
                            s.code === "hoat_dong"
                              ? "emerald"
                              : s.code === "het_han"
                              ? "rose"
                              : s.code === "sap_het_han"
                              ? "amber"
                              : s.code === "sap_het_ton"
                              ? "sky"
                              : "slate"
                          }
                        >
                          {s.label}
                        </Chip>
                      ))}
                    </div>
                  </div>

                  {/* Đơn vị thuốc */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Đơn vị thuốc</span>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Chip active={!unit} onClick={() => setUnit("")}>
                        Tất cả
                      </Chip>
                      <Chip
                        active={unit === "viên"}
                        onClick={() => setUnit("viên")}
                      >
                        Viên
                      </Chip>
                      <Chip
                        active={unit === "chai"}
                        onClick={() => setUnit("chai")}
                      >
                        Chai
                      </Chip>
                      <Chip
                        active={unit === "ống"}
                        onClick={() => setUnit("ống")}
                      >
                        Ống
                      </Chip>
                    </div>
                  </div>

                  {/* ✅ Lọc theo lô — danh sách dynamic từ dữ liệu */}
                  {uniqueLots.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-slate-500">Lọc theo lô</span>
                      <div className="mt-1.5 flex flex-wrap gap-2 max-h-[140px] overflow-y-auto scrollbar-none p-1 -ml-1">
                        <Chip active={!stockLot} onClick={() => setStockLot("")}>
                          Tất cả
                        </Chip>
                        {uniqueLots.map((lot) => (
                          <Chip
                            key={lot}
                            active={stockLot === lot}
                            onClick={() => setStockLot(lot)}
                          >
                            {lot}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ✅ Hạn sử dụng — date range cho kho */}
                  <div>
                    <span className="text-xs font-medium text-slate-500">Hạn sử dụng</span>
                    <div className="mt-1.5 rounded-2xl bg-indigo-50/60 ring-1 ring-indigo-100 px-2.5 py-2.5">
                      <div className="flex items-center gap-2">
                        <label className="flex-1 text-[11px] text-slate-500">
                          Từ ngày
                          <div className="mt-0.5 relative">
                            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-indigo-500">
                              📅
                            </span>
                            <input
                              type="date"
                              value={stockExpFrom || ""}
                              onChange={(e) => setStockExpFrom(e.target.value)}
                              className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </label>
                        <span className="text-slate-400 text-xs mt-4">–</span>
                        <label className="flex-1 text-[11px] text-slate-500">
                          Đến ngày
                          <div className="mt-0.5 relative">
                            <span className="pointer-events-none absolute inset-y-0 left-2 flex items-center text-xs text-indigo-500">
                              📅
                            </span>
                            <input
                              type="date"
                              value={stockExpTo || ""}
                              onChange={(e) => setStockExpTo(e.target.value)}
                              className="w-full rounded-xl pl-7 pr-2.5 py-1.5 bg-white text-sm ring-1 ring-slate-200/80 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            <FilterPopoverFooter
              onReset={() => onResetFilters?.()}
              onClose={onClose}
              resetLabel="Reset bộ lọc"
              closeLabel="Đóng"
              accent="indigo"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
