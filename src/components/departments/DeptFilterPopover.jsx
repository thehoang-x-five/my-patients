// src/components/departments/DeptFilterPopover.jsx
import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { AnimatePresence, motion } from "framer-motion";
  import { createPortal } from "react-dom";
  import Chip from "../ui/Chip.jsx";
  
  const STATUS_SEG = [
    { code: "all", label: "Tất cả" },
    { code: "online", label: "Online" },
    { code: "offline", label: "Offline" },
  ];
  
  const ROOM_TYPES = [
    { code: "all", label: "Tất cả loại phòng" },
    { code: "ls", label: "Phòng khám (LS)" },
    { code: "cls", label: "Phòng CLS / DV" },
  ];
  
  const SORT_SEG = [
    { code: "none", label: "Không sắp xếp" },
    { code: "capacity_asc", label: "Tải phòng ↑" },
    { code: "capacity_desc", label: "Tải phòng ↓" },
  ];
  
  export default function DeptFilterPopover({
    open,
    onClose,
    anchorEl,
    values,
    setValues,
  }) {
    const boxRef = useRef(null);
    const kwRef = useRef(null);
    const justOpenedRef = useRef(false);
  
    const anchorNode =
      anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;
  
    const [pos, setPos] = useState({ top: 72, left: 16 });
    const [widthPx, setWidthPx] = useState(380);
    const [maxH, setMaxH] = useState(460);
  
    const keyword = values?.keyword ?? "";
    const status = values?.status ?? "all";
    const roomType = values?.roomType ?? "all";
    const sort = values?.sort ?? "none";
  
    const apply = (patch) =>
      setValues((prev) => ({
        ...prev,
        ...patch,
      }));
  
    // ESC + click ngoài
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
          '[data-popover-anchor="dept-filter"]'
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
  
    // tính vị trí
    function computePosition() {
      const gap = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
  
      const W = Math.min(350, vw - 24);
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
            className="fixed z-[90]"
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
              aria-label="Bộ lọc phòng khám"
              className="rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/80 overflow-hidden"
              style={{ maxHeight: maxH }}
            >
              {/* Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 border-b border-emerald-100">
                <div className="text-[13px] font-extrabold tracking-tight text-emerald-800 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-lg bg-white ring-1 ring-emerald-200 items-center justify-center">
                    🧭
                  </span>
                  Bộ lọc phòng khám
                </div>
              </div>
  
              {/* Body */}
              <div className="p-3 grid gap-3 text-[13px] text-slate-700 overflow-y-auto">
                {/* Search */}
                <label className="text-[13px]">
                  Từ khóa
                  <div className="relative mt-1">
                    <input
                      ref={kwRef}
                      value={keyword}
                      onChange={(e) =>
                        apply({ keyword: e.target.value || "" })
                      }
                      placeholder="Tên phòng / khoa / bác sĩ phụ trách…"
                      className="w-full rounded-xl px-3 py-2 pl-9 bg-white ring-1 ring-slate-200/80 focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                    />
                    <span className="absolute left-2 top-2.5 text-emerald-600">
                      🔍
                    </span>
                    {keyword && (
                      <button
                        type="button"
                        aria-label="Xóa tìm kiếm"
                        onClick={() => apply({ keyword: "" })}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </label>
  
                {/* Trạng thái hoạt động */}
                <div>
                  Trạng thái hoạt động
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {STATUS_SEG.map((s) => (
                      <Chip
                        key={s.code}
                        active={status === s.code}
                        onClick={() => apply({ status: s.code })}
                        dot={
                          s.code === "online"
                            ? "emerald"
                            : s.code === "offline"
                            ? "slate"
                            : "slate"
                        }
                      >
                        {s.label}
                      </Chip>
                    ))}
                  </div>
                </div>
  
                {/* Loại phòng */}
                <div>
                  Loại phòng
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {ROOM_TYPES.map((t) => (
                      <Chip
                        key={t.code}
                        active={roomType === t.code}
                        onClick={() => apply({ roomType: t.code })}
                        dot={
                          t.code === "ls"
                            ? "emerald"
                            : t.code === "cls"
                            ? "indigo"
                            : undefined
                        }
                      >
                        {t.label}
                      </Chip>
                    ))}
                  </div>
                </div>
  
                {/* Sắp xếp theo sức chứa */}
                <div>
                  Sắp xếp theo sức chứa
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {SORT_SEG.map((s) => (
                      <Chip
                        key={s.code}
                        active={sort === s.code}
                        onClick={() => apply({ sort: s.code })}
                        tone={
                          s.code === "capacity_asc" || s.code === "capacity_desc"
                            ? "sky"
                            : "slate"
                        }
                      >
                        {s.label}
                      </Chip>
                    ))}
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
  