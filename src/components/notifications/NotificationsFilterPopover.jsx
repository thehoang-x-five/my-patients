// /src/components/notifications/NotificationsFilterPopover.jsx
import React, {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
  } from "react";
  import { AnimatePresence, motion } from "framer-motion";
  import { createPortal } from "react-dom";
  import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";
  
  const TYPE_SEG = [
    { code: "all", label: "Tất cả" },
    { code: "system", label: "Hệ thống" },
    { code: "appointment", label: "Lịch hẹn" },
    { code: "patient", label: "Bệnh nhân" },
    { code: "pharmacy", label: "Nhà thuốc" },
    { code: "billing", label: "Thanh toán" },
    { code: "reminder", label: "Nhắc nhở" },
    { code: "result", label: "Kết quả" },
  ];
  
  const PRIORITY_SEG = [
    { code: "all", label: "Tất cả" },
    { code: "high", label: "Ưu tiên cao" },
    { code: "normal", label: "Thông thường" },
  ];
  
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
  
  export default function NotificationsFilterPopover({
    open,
    onClose,
    anchorEl,
    values,
    setValues,
    onReset,
  }) {
    const boxRef = useRef(null);
    const kwRef = useRef(null);
    const justOpenedRef = useRef(false);
  
    const anchorNode =
      anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;
  
    const [pos, setPos] = useState({ top: 72, left: 16, width: 360 });
    const [maxH, setMaxH] = useState(520);
  
    const { keyword = "", type = "all", priority = "all" } = values || {};
  
    const sync = (nextPartial) => {
      const next = {
        keyword,
        type,
        priority,
        ...(nextPartial || {}),
      };
      setValues?.(next);
    };
  
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
          '[data-popover-anchor="notif-filter"]'
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
    const computePosition = () => {
      const gap = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const W = Math.min(345, vw - 24);
  
      const el =
        anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
      const r = el ? el.getBoundingClientRect() : null;
  
      let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
      let top = (r ? r.bottom : 64) + gap;
  
      const estH = 320;
      if (top + estH > vh - 12 && r) {
        top = Math.max(12, r.top - gap - estH);
      }
  
      setPos({ top, left, width: W });
      setMaxH(Math.min(vh - top - 12, 520));
    };
  
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
            style={{
              top: pos.top,
              left: pos.left,
              width: pos.width,
            }}
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
          >
            <div
              ref={boxRef}
              role="dialog"
              aria-modal="true"
              aria-label="Bộ lọc thông báo"
              className="rounded-2xl bg-white shadow-2xl ring-1 ring-violet-200/80 overflow-hidden"
              style={{ maxHeight: maxH }}
            >
              {/* Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 border-b border-violet-100">
                <div className="text-[13px] font-extrabold tracking-tight text-violet-800 flex items:center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-lg bg-white ring-1 ring-violet-200 items-center justify-center">
                    🔔
                  </span>
                  Bộ lọc thông báo
                </div>
              </div>
  
              {/* Body */}
              <div className="p-3 grid gap-3 overflow-y-auto text-[13px] text-slate-700">
                {/* Keyword */}
                <label className="text-[13px]">
                  Từ khóa
                  <div className="relative mt-1">
                    <input
                      ref={kwRef}
                      value={keyword}
                      onChange={(e) => sync({ keyword: e.target.value })}
                      placeholder="Tiêu đề / nội dung / loại…"
                      className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-violet-500 outline-none shadow-sm text-[13px]"
                    />
                    <span className="absolute left-2 top-2.5 text-violet-500">
                      🔍
                    </span>
                    {keyword && (
                      <button
                        type="button"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => sync({ keyword: "" })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </label>
  
                {/* Type */}
                <div className="mt-1">
                  Loại thông báo
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {TYPE_SEG.map((t) => (
                      <Chip
                        key={t.code}
                        active={type === t.code}
                        onClick={() => sync({ type: t.code })}
                        dot={
                          t.code === "system"
                            ? "violet"
                            : t.code === "appointment"
                            ? "sky"
                            : t.code === "patient"
                            ? "amber"
                            : t.code === "pharmacy"
                            ? "sky"
                            : t.code === "billing"
                            ? "rose"
                            :  t.code === "result"
                            ? "red"
                            :  t.code === "reminder"
                            ? "indigo"
                            : undefined
                        }
                      >
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </div>
  
                {/* Priority */}
                <div className="mt-1">
                  Mức ưu tiên
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {PRIORITY_SEG.map((p) => (
                      <Chip
                        key={p.code}
                        active={priority === p.code}
                        onClick={() => sync({ priority: p.code })}
                        dot={p.code === "high" ? "rose" : "violet"}
                      >
                        {p.label}
                      </Chip>
                    ))}
                  </div>
                </div>
  
              </div>
              <FilterPopoverFooter
                onReset={() => onReset?.()}
                onClose={onClose}
                resetLabel="Reset bộ lọc"
                closeLabel="Đóng"
                accent="violet"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    );
  }
  
