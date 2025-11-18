// src/components/patients/PatientsFilterPopover.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { STATUSES, ACCOUNT_STATUSES } from "../../api/patients";

const TODAY_SEG = [
  "Tất cả",
  STATUSES.WAIT_INTAKE,
  STATUSES.WAIT_INTAKE_SVC,
  STATUSES.WAIT_EXAM,
  STATUSES.WAIT_EXAM_SVC,
  STATUSES.WAIT_PROC,
  STATUSES.WAIT_PROC_SVC,
  STATUSES.IN_EXAM,
  STATUSES.IN_EXAM_SVC,
  STATUSES.DONE,
];

const ACC_LABELS = {
  hoat_dong: "Hoạt động",
  khong_hoat_dong: "Không hoạt động",
  da_xoa: "Đã xóa",
};
const ACCOUNT_OPTIONS = [
  { value: "all", label: "Tất cả" },
  ...ACCOUNT_STATUSES.map((code) => ({
    value: code,
    label: ACC_LABELS[code] || code,
  })),
];

export default function PatientsFilterPopover({
  open,
  onClose,
  values,
  setValues,
  anchorEl,
  sort = "priority",
  onChangeSort,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  const kw = values?.keyword ?? "";
  const todayStatus = values?.todayStatus ?? "Tất cả";
  const accountStatus = values?.accountStatus ?? "all";

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
        '[data-popover-anchor="patients-filter"]'
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

  // position bottom-end + shrink to fit
  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [maxH, setMaxH] = useState(520);
  const [widthPx, setWidthPx] = useState(360);

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const W = Math.min(355, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const r = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;

    const estH = 360;
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
            aria-label="Bộ lọc bệnh nhân"
            className="rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70 overflow-hidden"
            style={{ maxHeight: maxH }}
          >
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-100">
              <div className="text-[13px] font-extrabold tracking-tight text-emerald-800 flex items-center gap-2">
                <span className="inline-flex w-5 h-5 rounded-lg bg-emerald-100 ring-1 ring-emerald-200 items-center justify-center">
                  🔎
                </span>
                Bộ lọc
              </div>
            </div>

            <div className="p-2 grid gap-2 overflow-y-auto">
              {/* Từ khóa */}
              <label className="text-[13px]">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={kw}
                    onChange={(e) =>
                      setValues({ keyword: e.target.value })
                    }
                    placeholder="Mã BN / Họ tên / SĐT / Email…"
                    className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm text-[13px]"
                  />
                  <span className="absolute left-2 top-2.5 text-emerald-600">
                    🔎
                  </span>
                  {kw && (
                    <button
                      type="button"
                      aria-label="Xóa tìm kiếm"
                      onClick={() => setValues({ keyword: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              {/* Trạng thái hôm nay */}
              <div className="text-[13px]">
                Trạng thái hôm nay
                <div
                  role="radiogroup"
                  aria-label="Lọc theo trạng thái hôm nay"
                  className="mt-1 gap-1.5 relative flex flex-wrap w-full p-1 rounded-xl ring-1 ring-emerald-100 bg-gradient-to-b from-white to-emerald-50/40 overflow-x-auto overflow-y-visible"
                  onKeyDown={(e) => {
                    const idx = TODAY_SEG.findIndex((x) => x === todayStatus);
                    if (e.key === "ArrowRight") {
                      e.preventDefault();
                      const next =
                        TODAY_SEG[(idx + 1) % TODAY_SEG.length];
                      setValues({ todayStatus: next });
                    } else if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      const prev =
                        TODAY_SEG[
                          (idx - 1 + TODAY_SEG.length) % TODAY_SEG.length
                        ];
                      setValues({ todayStatus: prev });
                    }
                  }}
                >
                  {TODAY_SEG.map((s) => {
                    const active = todayStatus === s;
                    return (
                      <button
                        key={s}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setValues({ todayStatus: s })}
                        className={[
                          "relative z-10 px-3 py-1 text-[12px] font-semibold whitespace-nowrap rounded-lg",
                          "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                          active
                            ? "text-teal-800"
                            : "text-slate-700 hover:text-emerald-800",
                          "ring-1",
                          active
                            ? "ring-emerald-300 bg-teal-50"
                            : "ring-slate-200 hover:ring-emerald-200 bg-white",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="patientsSegPillPopoverToday"
                            className="absolute inset-0 rounded-lg bg-teal-50"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative">{s}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Trạng thái tài khoản */}
              <div className="text-[13px]">
                Trạng thái tài khoản
                <div
                  role="radiogroup"
                  aria-label="Lọc theo trạng thái tài khoản"
                  className="mt-1 gap-1.5 relative flex flex-wrap w-full p-1 rounded-xl ring-1 ring-emerald-100 bg-gradient-to-b from-white to-emerald-50/40"
                >
                  {ACCOUNT_OPTIONS.map((opt) => {
                    const active = accountStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        role="radio"
                        aria-checked={active}
                        onClick={() =>
                          setValues({ accountStatus: opt.value })
                        }
                        className={[
                          "relative z-10 px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap rounded-lg",
                          "transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                          active
                            ? "text-teal-800"
                            : "text-slate-700 hover:text-emerald-800",
                          "ring-1",
                          active
                            ? "ring-emerald-300 bg-teal-50"
                            : "ring-slate-200 hover:ring-emerald-200 bg-white",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="patientsSegPillPopoverAcc"
                            className="absolute inset-0 rounded-lg bg-teal-50"
                            transition={{
                              type: "spring",
                              stiffness: 420,
                              damping: 30,
                            }}
                          />
                        )}
                        <span className="relative">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort */}
              <div className="mt-4 text-[13px]">
                Sắp xếp
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {[
                    { value: "priority", label: "Ưu tiên trạng thái" },
                    { value: "name", label: "Theo tên" },
                    { value: "date", label: "Theo ngày trạng thái" },
                  ].map((opt) => {
                    const active = sort === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => onChangeSort?.(opt.value)}
                        className={[
                          "px-2.5 py-1 rounded-full text-[12px] font-semibold border",
                          active
                            ? "bg-emerald-100 border-emerald-400 text-emerald-800"
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
