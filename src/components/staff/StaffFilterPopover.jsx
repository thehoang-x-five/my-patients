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

const STATUS_SEG = [
  { code: "all", label: "Tất cả", dot: "bg-slate-400" },
  { code: "online", label: "Online", dot: "bg-emerald-500" },
  { code: "pause", label: "Pause", dot: "bg-amber-500" },
  { code: "offline", label: "Offline", dot: "bg-slate-500" },
];

const NURSE_TYPES = [
  { code: "all", label: "Tất cả" },
  { code: "hanh_chinh", label: "Hành chính" },
  { code: "can_lam_sang", label: "Cận lâm sàng" },
  { code: "lam_sang", label: "Lâm sàng" },
];

function FilterPill({ active = false, onClick, children, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-[12px] font-semibold transition",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-700",
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatusPill({ active = false, dot, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40",
      ].join(" ")}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {children}
    </button>
  );
}

export default function StaffFilterPopover({
  open,
  onClose,
  anchorEl,
  role = "doctor",
  setRole,
  roleOptions = [],
  values,
  setValues,
  departments = [],
  onReset,
}) {
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [widthPx, setWidthPx] = useState(350);
  const [maxH, setMaxH] = useState(460);

  const deptList = useMemo(() => {
    const raw = Array.isArray(departments) ? departments : [];
    const mapped = raw
      .map((d) => {
        const value =
          d.MaKhoa ||
          d.maKhoa ||
          d.ma_khoa ||
          d.code ||
          d.id ||
          d.maPhong ||
          d.ma_phong ||
          "";
        const label =
          d.TenKhoa ||
          d.tenKhoa ||
          d.ten_khoa ||
          d.name ||
          d.tenPhong ||
          d.ten_phong ||
          d.label ||
          "";
        if (!value || !label) return null;
        return { value, label };
      })
      .filter(Boolean);

    return [{ value: "", label: "Tất cả khoa" }, ...mapped];
  }, [departments]);

  const keyword = values?.keyword ?? "";
  const status = values?.status ?? "all";
  const dept = values?.dept ?? "";
  const nurseType = values?.nurseType ?? "all";

  const apply = (patch) =>
    setValues((prev) => ({
      ...prev,
      ...patch,
    }));

  const applyRole = (nextRole) => {
    setRole?.(nextRole);
    if (nextRole !== "nurse" && nurseType !== "all") {
      apply({ nurseType: "all" });
    }
  };

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
        '[data-popover-anchor="staff-filter"]'
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

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const preferredWidth = role === "nurse" ? 372 : 340;
    const W = Math.min(preferredWidth, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const r = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(r ? r.right - W : 16, 12), vw - W - 12);
    let top = (r ? r.bottom : 64) + gap;

    const estH = role === "nurse" ? 440 : 380;
    if (top + estH > vh - 12 && r) {
      top = Math.max(12, r.top - gap - estH);
    }

    setWidthPx(W);
    setPos({ top, left });
    setMaxH(Math.min(vh - top - 12, role === "nurse" ? 520 : 470));
  }

  useLayoutEffect(() => {
    if (open) computePosition();
  }, [open, anchorNode, role]);

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
  }, [open, anchorNode, role]);

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
            aria-label="Bộ lọc nhân sự"
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70"
            style={{ maxHeight: maxH }}
          >
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-emerald-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 ring-1 ring-emerald-200">
                  🧩
                </span>
                Bộ lọc nhân sự
              </div>
            </div>

            <div className="grid gap-2 overflow-y-auto p-2.5 text-[13px] text-slate-700">
              <label className="text-[13px]">
                Từ khóa
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={keyword}
                    onChange={(e) => apply({ keyword: e.target.value || "" })}
                    placeholder="Tên / mã / khoa / chức vụ..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-[13px] shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/30"
                  />
                  <span className="absolute left-3 top-2.5 text-emerald-600">
                    🔎
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

              {roleOptions.length > 0 && (
                <div className="text-[13px]">
                  Vai trò
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {roleOptions.map((item) => (
                      <FilterPill
                        key={item.key}
                        active={role === item.key}
                        onClick={() => applyRole(item.key)}
                      >
                        {item.label}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              )}

              {role === "nurse" && (
                <div className="text-[13px]">
                  Loại y tá
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {NURSE_TYPES.map((item) => (
                      <FilterPill
                        key={item.code}
                        active={nurseType === item.code}
                        onClick={() => apply({ nurseType: item.code })}
                      >
                        {item.label}
                      </FilterPill>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[13px]">
                Khoa / phòng
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {deptList.map((item) => (
                    <FilterPill
                      key={item.value || "all"}
                      active={dept === item.value}
                      onClick={() => apply({ dept: item.value })}
                    >
                      {item.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div className="text-[13px]">
                Trạng thái làm việc
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {STATUS_SEG.map((item) => (
                    <StatusPill
                      key={item.code}
                      active={status === item.code}
                      dot={item.dot}
                      onClick={() => apply({ status: item.code })}
                    >
                      {item.label}
                    </StatusPill>
                  ))}
                </div>
              </div>
            </div>

            <FilterPopoverFooter
              onReset={onReset}
              onClose={onClose}
              accent="emerald"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
