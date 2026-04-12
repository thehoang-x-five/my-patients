// src/components/billing/UnpaidInvoiceFilterPopover.jsx
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
    "bg-amber-600/10 text-amber-700 ring-1 ring-amber-300 shadow-sm";
  const inactiveCls =
    "bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-amber-300 hover:text-amber-700";
  const dotCls =
    dot === "rose"
      ? "bg-rose-400"
      : dot === "amber"
      ? "bg-amber-400"
      : dot === "orange"
      ? "bg-orange-400"
      : "bg-slate-300";
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

const AGE_SEGMENTS = [
  { code: "all", label: "Tất cả" },
  { code: "0-7", label: "0-7 ngày" },
  { code: "8-30", label: "8-30 ngày" },
  { code: "30+", label: "Quá 30 ngày" },
];

const AMOUNT_SEGMENTS = [
  { code: "all", label: "Tất cả" },
  { code: "0-500k", label: "< 500k" },
  { code: "500k-1m", label: "500k - 1M" },
  { code: "1m-5m", label: "1M - 5M" },
  { code: "5m+", label: "> 5M" },
];

const TYPE_SEGMENTS = [
  { code: "all", label: "Tất cả" },
  { code: "kham_lam_sang", label: "Khám LS" },
  { code: "can_lam_sang", label: "CLS" },
  { code: "thuoc", label: "Thuốc" },
];

export default function UnpaidInvoiceFilterPopover({
  open,
  mode = "unpaid",
  onClose,
  anchorEl,
  keyword,
  setKeyword,
  ageRange,
  setAgeRange,
  amountRange,
  setAmountRange,
  invoiceType,
  setInvoiceType,
  onResetFilters,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);
  const isReserved = mode === "reserved";

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
        '[data-popover-anchor="unpaid-filter"]'
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
            aria-label={isReserved ? "Bộ lọc hóa đơn bảo lưu" : "Bộ lọc hóa đơn chưa thu"}
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-amber-200/80 overflow-hidden"
            style={{ maxHeight: maxH }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-b border-amber-100">
              <div className="text-[13px] font-extrabold tracking-tight text-amber-800 flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-lg bg-white ring-1 ring-amber-200 items-center justify-center">
                  🔎
                </span>
                {isReserved ? "Bộ lọc hóa đơn bảo lưu" : "Bộ lọc hóa đơn chưa thu"}
              </div>
            </div>

            <div className="p-2 grid gap-2 overflow-y-auto text-[13px] text-slate-700">
              {/* Từ khóa */}
              <label className="text-[13px]">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="Mã HĐ / Tên BN / Nội dung…"
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm text-[13px]"
                  />
                  <span className="absolute left-2 top-2.5 text-amber-600">
                    🔍
                  </span>
                  {keyword && (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setKeyword("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              {/* Độ tuổi nợ */}
              <div className="mt-1">
                {isReserved ? "Tuổi bảo lưu" : "Độ tuổi nợ"}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {AGE_SEGMENTS.map((s) => (
                    <Chip
                      key={s.code}
                      active={ageRange === s.code}
                      onClick={() => setAgeRange(s.code)}
                      dot={
                        s.code === "0-7"
                          ? "slate"
                          : s.code === "8-30"
                          ? "amber"
                          : s.code === "30+"
                          ? "rose"
                          : undefined
                      }
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Khoản tiền */}
              <div className="mt-2">
                Khoản tiền
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {AMOUNT_SEGMENTS.map((s) => (
                    <Chip
                      key={s.code}
                      active={amountRange === s.code}
                      onClick={() => setAmountRange(s.code)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Loại thanh toán */}
              <div className="mt-2">
                Loại thanh toán
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {TYPE_SEGMENTS.map((s) => (
                    <Chip
                      key={s.code}
                      active={invoiceType === s.code}
                      onClick={() => setInvoiceType(s.code)}
                    >
                      {s.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
            <FilterPopoverFooter
              onReset={() => onResetFilters?.()}
              onClose={onClose}
              resetLabel="Reset bộ lọc"
              closeLabel="Đóng"
              accent="amber"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
