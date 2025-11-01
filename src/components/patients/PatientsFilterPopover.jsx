import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const SEG = [
  "Tất cả",
  "Hoàn thành",
  "Hẹn khám",
  "Hẹn tái khám",
  "Chờ tiếp nhận",
  "Chờ tiếp nhận (dịch vụ)",
  "Chờ khám",
  "Chờ khám (dịch vụ)",
  "Chờ xử lý",
  "Chờ xử lý (dịch vụ)",
];

export default function PatientsFilterPopover({ open, onClose, values, setValues, anchorEl }) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  // chấp nhận anchorEl là DOM node hoặc ref.current
  const anchorNode = (anchorEl && anchorEl.current) ? anchorEl.current : anchorEl || null;

  const [kw, setKw] = useState(values?.keyword || "");
  const [status, setStatus] = useState(values?.status || "Tất cả");

  useEffect(() => {
    setKw(values?.keyword || "");
    setStatus(values?.status || "Tất cả");
  }, [values?.keyword, values?.status]);

  // ===== overlay close / esc =====
  useEffect(() => {
    if (!open) return;
    justOpenedRef.current = true;

    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };

    const onClickOutside = (e) => {
      if (justOpenedRef.current) return;
      const target = e.target;
      const onAnchorBtn = !!(target?.closest?.('[data-popover-anchor="patients-filter"]'));
      if (onAnchorBtn) return;
      const inside = boxRef.current?.contains(target);
      const insideAnchor = anchorNode && anchorNode.contains && anchorNode.contains(target);
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

  // ===== positioning (bottom-end) + shrink to fit =====
  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [maxH, setMaxH] = useState(520);
  const [widthPx, setWidthPx] = useState(360); // gọn hơn

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // popover width <= 360 và luôn chừa 24px tổng margin 2 bên
    const W = Math.min(360, vw - 24);
    const el = (anchorNode && anchorNode.getBoundingClientRect) ? anchorNode : null;
    const r = el ? el.getBoundingClientRect() : null;

    // placement: bottom-end (căn phải theo anchor)
    let left = Math.min(Math.max((r ? r.right - W : vw - W - 12), 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;

    // nếu tràn đáy thì đặt lên trên (top-end)
    const estH = 340; // ước tính sau khi thu gọn
    if (top + estH > vh - 12 && r) {
      top = Math.max(12, r.top - gap - estH);
    }

    setWidthPx(W);
    setPos({ top, left });
    setMaxH(Math.min(vh - top - 12, 500));
  }

  useLayoutEffect(() => { if (open) computePosition(); }, [open, anchorNode]);
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

  // ===== sync out =====
  useEffect(() => {
    if (!open) return;
    if (values?.keyword === kw && values?.status === status) return;
    setValues({ keyword: kw, status });
  }, [open, kw, status, setValues, values?.keyword, values?.status]);

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
            aria-label="Bộ lọc bệnh nhân"
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70 overflow-hidden"
            style={{ maxHeight: maxH }}
          >
            {/* Header gọn và cùng tone */}
            <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100">
              <div className="text-[13px] font-extrabold tracking-tight text-emerald-800 flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-lg bg-emerald-100 ring-1 ring-emerald-200 items-center justify-center">🔎</span>
                Bộ lọc
              </div>
            </div>

            <div className="p-2 grid gap-2 overflow-y-auto">
              {/* Từ khóa - thu gọn padding/height */}
              <label className="text-[13px]">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    value={kw}
                    ref={kwRef}
                    onChange={(e) => setKw(e.target.value)}
                    placeholder="Mã BN / Họ tên / SĐT / Email…"
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-[13px]"
                  />
                  <span className="absolute left-2 top-2.5 text-emerald-600">🔎</span>
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

              {/* Trạng thái - gọn để vừa khung */}
              <div className="text-[13px]">
                Trạng thái
                <div
                  role="radiogroup"
                  aria-label="Lọc theo trạng thái"
                  className="mt-1 gap-1.5 relative flex flex-wrap w-full p-1 rounded-xl ring-1 ring-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 overflow-x-auto overflow-y-visible"
                  onKeyDown={(e) => {
                    const idx = SEG.findIndex((x) => x === status);
                    if (e.key === "ArrowRight") { e.preventDefault(); setStatus(SEG[(idx + 1) % SEG.length]); }
                    else if (e.key === "ArrowLeft") { e.preventDefault(); setStatus(SEG[(idx - 1 + SEG.length) % SEG.length]); }
                  }}
                >
                  {SEG.map((s) => {
                    const active = status === s;
                    return (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setStatus(s)}
                        className={[
                          "relative z-10 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap rounded-lg",
                          "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                          active ? "text-teal-800" : "text-slate-700 hover:text-emerald-800",
                          "ring-1",
                          active ? "ring-emerald-300 bg-teal-50" : "ring-slate-200 hover:ring-emerald-200 bg-white"
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="patientsSegPillPopover"
                            className="absolute inset-0 rounded-lg bg-teal-50"
                            transition={{ type: "spring", stiffness: 420, damping: 30 }}
                          />
                        )}
                        <span className="relative">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
