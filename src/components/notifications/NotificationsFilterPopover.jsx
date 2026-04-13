import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";
import { useUI } from "../../context/UIContext.jsx";

function Chip({ active, dot, children, ...rest }) {
  const base =
    "inline-flex cursor-pointer select-none items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium transition";
  const activeCls =
    "bg-violet-600/10 text-violet-700 ring-1 ring-violet-300 shadow-sm";
  const inactiveCls =
    "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-violet-700 hover:ring-violet-300";
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
      : "bg-indigo-300";

  return (
    <button
      type="button"
      className={`${base} ${active ? activeCls : inactiveCls}`}
      {...rest}
    >
      {dot ? (
        <span className={`h-1.5 w-1.5 rounded-full ${dotCls}`} aria-hidden="true" />
      ) : null}
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
  const { lang } = useUI();
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const t =
    lang === "en"
      ? {
          dialog: "Notification filters",
          title: "Notification filters",
          keyword: "Keyword",
          keywordPlaceholder: "Title / content / type...",
          clearSearch: "Clear search",
          type: "Notification type",
          priority: "Priority",
          all: "All",
          system: "System",
          appointment: "Appointment",
          patient: "Patient",
          pharmacy: "Pharmacy",
          billing: "Billing",
          reminder: "Reminder",
          result: "Result",
          high: "High priority",
          normal: "Normal",
        }
      : {
          dialog: "Bộ lọc thông báo",
          title: "Bộ lọc thông báo",
          keyword: "Từ khóa",
          keywordPlaceholder: "Tiêu đề / nội dung / loại...",
          clearSearch: "Xóa tìm kiếm",
          type: "Loại thông báo",
          priority: "Mức ưu tiên",
          all: "Tất cả",
          system: "Hệ thống",
          appointment: "Lịch hẹn",
          patient: "Bệnh nhân",
          pharmacy: "Nhà thuốc",
          billing: "Thanh toán",
          reminder: "Nhắc nhở",
          result: "Kết quả",
          high: "Ưu tiên cao",
          normal: "Thông thường",
        };

  const typeSegments = [
    { code: "all", label: t.all },
    { code: "system", label: t.system },
    { code: "appointment", label: t.appointment },
    { code: "patient", label: t.patient },
    { code: "pharmacy", label: t.pharmacy },
    { code: "billing", label: t.billing },
    { code: "reminder", label: t.reminder },
    { code: "result", label: t.result },
  ];

  const prioritySegments = [
    { code: "all", label: t.all },
    { code: "high", label: t.high },
    { code: "normal", label: t.normal },
  ];

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
    const timer = setTimeout(() => {
      justOpenedRef.current = false;
      document.addEventListener("click", onClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("click", onClickOutside, true);
      clearTimeout(timer);
    };
  }, [open, onClose, anchorNode]);

  const computePosition = () => {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(345, vw - 24);

    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const rect = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(rect ? rect.right - width : 16, 12), vw - width - 12);
    let top = (rect ? rect.bottom : 64) + gap;

    const estH = 320;
    if (top + estH > vh - 12 && rect) {
      top = Math.max(12, rect.top - gap - estH);
    }

    setPos({ top, left, width });
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
            aria-label={t.dialog}
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-violet-200/80"
            style={{ maxHeight: maxH }}
          >
            <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50 via-fuchsia-50 to-rose-50 px-3 py-2">
              <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-violet-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-white ring-1 ring-violet-200">
                  🔔
                </span>
                {t.title}
              </div>
            </div>

            <div className="grid gap-3 overflow-y-auto scrollbar-none p-3 text-[13px] text-slate-700">
              <label className="text-[13px]">
                {t.keyword}
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={keyword}
                    onChange={(e) => sync({ keyword: e.target.value })}
                    placeholder={t.keywordPlaceholder}
                    className="w-full rounded-xl bg-white px-3 py-2 pl-9 text-[13px] shadow-sm outline-none ring-1 ring-slate-200/80 focus:ring-2 focus:ring-violet-500"
                  />
                  <span className="absolute left-2 top-2.5 text-violet-500">
                    🔍
                  </span>
                  {keyword && (
                    <button
                      type="button"
                      aria-label={t.clearSearch}
                      onClick={() => sync({ keyword: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <div className="mt-1">
                {t.type}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {typeSegments.map((item) => (
                    <Chip
                      key={item.code}
                      active={type === item.code}
                      onClick={() => sync({ type: item.code })}
                      dot={
                        item.code === "system"
                          ? "violet"
                          : item.code === "appointment"
                          ? "sky"
                          : item.code === "patient"
                          ? "amber"
                          : item.code === "pharmacy"
                          ? "sky"
                          : item.code === "billing"
                          ? "rose"
                          : item.code === "result"
                          ? "red"
                          : item.code === "reminder"
                          ? "indigo"
                          : undefined
                      }
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-1">
                {t.priority}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {prioritySegments.map((item) => (
                    <Chip
                      key={item.code}
                      active={priority === item.code}
                      onClick={() => sync({ priority: item.code })}
                      dot={item.code === "high" ? "rose" : "violet"}
                    >
                      {item.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>

            <FilterPopoverFooter
              onReset={() => onReset?.()}
              onClose={onClose}
              accent="violet"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
