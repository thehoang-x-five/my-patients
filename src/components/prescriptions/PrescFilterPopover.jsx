// src/components/prescriptions/PrescFilterPopover.jsx
import React, {
  useEffect,
  useLayoutEffect,
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
  const dotCls =
    dot === "rose"
      ? "bg-rose-400"
      : dot === "violet"
      ? "bg-violet-500"
      : dot === "amber"
      ? "bg-amber-400"
      : dot === "sky"
      ? "bg-sky-400"
      : dot === "red"
          ? "bg-red-400"
      : dot === "emerald"
      ? "bg-emerald-400"
  
      : dot === "indigo"
      ? "bg-indigo-300"
      :"bg-indigo-300";
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
const ORDER_RANGE_SEG = ["Tất cả", "Hôm nay", "7 ngày", "30 ngày"];

// Trạng thái kho mới: bỏ "Tạm dừng", thay bằng "Hết hạn"
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
  orderRange = "Tất cả",
  setOrderRange = () => {},

  stockStatus = "all",
  setStockStatus = () => {},
  onResetFilters,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  // esc / click ngoài
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

  // position
  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [maxH, setMaxH] = useState(520);
  const [widthPx, setWidthPx] = useState(340);

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const W = Math.min(340, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const r = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;

    const estH = 380;
    if (top + estH > vh - 12 && r) {
      top = Math.max(12, r.top - gap - estH);
    }

    setWidthPx(W);
    setPos({ top, left });
    setMaxH(Math.min(vh - top - 12, 520));
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

            <div className="p-2 grid gap-2 overflow-y-auto text-[13px] text-slate-700">
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
                  <div className="mt-1">
                    Trạng thái đơn
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

                  {/* Mốc thời gian */}
                  <div className="mt-2">
                    Mốc thời gian
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {ORDER_RANGE_SEG.map((r) => (
                        <Chip
                          key={r}
                          active={orderRange === r}
                          onClick={() => setOrderRange(r)}
                        >
                          {r}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Trạng thái kho */}
                  <div className="mt-1">
                    Trạng thái kho
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
                  <div className="mt-2">
                    Đơn vị thuốc
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
