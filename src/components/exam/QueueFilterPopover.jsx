// src/components/examination/QueueFilterPopover.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";

const SOURCE_OPTIONS = [
  { value: "all", label: "Tất cả nguồn" },
  { value: "walkin", label: "Walk-in" },
  { value: "appointment", label: "Hẹn khám" },
  { value: "service_return", label: "Trả từ dịch vụ" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Tất cả lượt" },
  { value: "ls", label: "Khám LS" },
  { value: "cls", label: "Cận lâm sàng" },
];

export default function QueueFilterPopover({
  open,
  onClose,
  anchorEl,
  values,
  setValues,
}) {
  const boxRef = useRef(null);
  const [pos, setPos] = useState({ top: 72, left: 16, width: 320 });

  const source = values?.source ?? "all";
  const kind = values?.kind ?? "all";

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  useLayoutEffect(() => {
    if (!open) return;
    const el = anchorNode || document.querySelector('[data-queue-filter="btn"]');
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const width = 279
    const left = Math.min(Math.max(r.right - width, 12), vw - width - 12);
    const top = r.bottom + 8;
    setPos({ top, left, width });
  }, [open, anchorNode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    const onClick = (e) => {
      const inside = boxRef.current?.contains(e.target);
      const insideBtn =
        anchorNode && anchorNode.contains && anchorNode.contains(e.target);
      if (!inside && !insideBtn) onClose?.();
    };
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [open, anchorNode, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed z-[120]"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          initial={{ opacity: 0, y: 6, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 420, damping: 30 }}
        >
          <div
            ref={boxRef}
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70 overflow-hidden"
          >
            <div className="px-3 py-2 bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border-b border-emerald-100">
              <div className="text-[13px] font-extrabold text-emerald-800 flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-lg bg-emerald-100 ring-1 ring-emerald-200 items-center justify-center">
                  ⚗️
                </span>
                Lọc hàng chờ
              </div>
            </div>

            <div className="p-3 space-y-3 text-[13px]">
              <div>
                Nguồn
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {SOURCE_OPTIONS.map((opt) => {
                    const active = opt.value === source;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setValues((v) => ({ ...v, source: opt.value }))
                        }
                        className={[
                          "px-2.5 py-1 rounded-full border text-[12px] font-semibold",
                          active
                            ? "bg-teal-100 border-teal-400 text-teal-800"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                Loại lượt
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {TYPE_OPTIONS.map((opt) => {
                    const active = opt.value === kind;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setValues((v) => ({ ...v, kind: opt.value }))
                        }
                        className={[
                          "px-2.5 py-1 rounded-full border text-[12px] font-semibold",
                          active
                            ? "bg-sky-100 border-sky-400 text-sky-800"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {opt.label}
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
