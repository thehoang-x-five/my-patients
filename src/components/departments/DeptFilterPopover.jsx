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

function FilterPill({ active = false, onClick, children, dot, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold transition",
        active
          ? "border-emerald-300 bg-emerald-50 text-emerald-800"
          : disabled
          ? "cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400"
          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40 hover:text-emerald-700",
      ].join(" ")}
    >
      {dot ? <span className={`h-2 w-2 rounded-full ${dot}`} /> : null}
      {children}
    </button>
  );
}

export default function DeptFilterPopover({
  open,
  onClose,
  anchorEl,
  values,
  setValues,
  lockedRoomType = null,
  onReset,
}) {
  const { lang } = useUI();
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const t =
    lang === "en"
      ? {
          dialog: "Room filters",
          title: "Room filters",
          keyword: "Keyword",
          keywordPlaceholder: "Room / department / assigned staff...",
          clearSearch: "Clear search",
          status: "Operating status",
          roomType: "Room type",
          sort: "Sort by capacity",
          statusAll: "All",
          statusOnline: "Active",
          statusOffline: "Paused",
          roomTypeAll: "All room types",
          roomTypeClinical: "Exam room (clinical)",
          roomTypeCls: "CLS room",
          sortNone: "No sorting",
          sortAsc: "Room load ↑",
          sortDesc: "Room load ↓",
        }
      : {
          dialog: "Bộ lọc phòng khám",
          title: "Bộ lọc phòng khám",
          keyword: "Từ khóa",
          keywordPlaceholder: "Tên phòng / khoa / nhân sự phụ trách...",
          clearSearch: "Xóa tìm kiếm",
          status: "Trạng thái hoạt động",
          roomType: "Loại phòng",
          sort: "Sắp xếp theo sức chứa",
          statusAll: "Tất cả",
          statusOnline: "Hoạt động",
          statusOffline: "Tạm dừng",
          roomTypeAll: "Tất cả loại phòng",
          roomTypeClinical: "Phòng khám (LS)",
          roomTypeCls: "Phòng CLS",
          sortNone: "Không sắp xếp",
          sortAsc: "Tải phòng ↑",
          sortDesc: "Tải phòng ↓",
        };

  const statusSegments = [
    { code: "all", label: t.statusAll, dot: "bg-slate-400" },
    { code: "online", label: t.statusOnline, dot: "bg-emerald-500" },
    { code: "offline", label: t.statusOffline, dot: "bg-slate-500" },
  ];

  const roomTypes = [
    { code: "all", label: t.roomTypeAll, dot: "bg-slate-400" },
    { code: "ls", label: t.roomTypeClinical, dot: "bg-emerald-500" },
    { code: "cls", label: t.roomTypeCls, dot: "bg-indigo-500" },
  ];

  const sortSegments = [
    { code: "none", label: t.sortNone },
    { code: "capacity_asc", label: t.sortAsc },
    { code: "capacity_desc", label: t.sortDesc },
  ];

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [widthPx, setWidthPx] = useState(340);
  const [maxH, setMaxH] = useState(430);

  const keyword = values?.keyword ?? "";
  const status = values?.status ?? "all";
  const roomType = values?.roomType ?? "all";
  const sort = values?.sort ?? "none";

  const apply = (patch) =>
    setValues((prev) => ({
      ...prev,
      ...patch,
    }));

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

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(336, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const rect = el ? el.getBoundingClientRect() : null;

    let left = Math.min(Math.max(rect ? rect.right - width : 16, 12), vw - width - 12);
    let top = (rect ? rect.bottom : 64) + gap;

    const estH = 340;
    if (top + estH > vh - 12 && rect) {
      top = Math.max(12, rect.top - gap - estH);
    }

    setWidthPx(width);
    setPos({ top, left });
    setMaxH(Math.min(vh - top - 12, 460));
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
            aria-label={t.dialog}
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70"
            style={{ maxHeight: maxH }}
          >
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-sky-50 to-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-emerald-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 ring-1 ring-emerald-200">
                  🧭
                </span>
                {t.title}
              </div>
            </div>

            <div className="grid gap-2 overflow-y-auto scrollbar-none p-2.5 text-[13px] text-slate-700">
              <label className="text-[13px]">
                {t.keyword}
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={keyword}
                    onChange={(e) => apply({ keyword: e.target.value || "" })}
                    placeholder={t.keywordPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 pl-9 text-[13px] shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-3 top-2.5 text-emerald-600">
                    🔍
                  </span>
                  {keyword && (
                    <button
                      type="button"
                      aria-label={t.clearSearch}
                      onClick={() => apply({ keyword: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <div className="text-[13px]">
                {t.status}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {statusSegments.map((item) => (
                    <FilterPill
                      key={item.code}
                      active={status === item.code}
                      onClick={() => apply({ status: item.code })}
                      dot={item.dot}
                    >
                      {item.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div className="text-[13px]">
                {t.roomType}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {roomTypes.map((item) => (
                    <FilterPill
                      key={item.code}
                      active={roomType === item.code}
                      disabled={!!lockedRoomType && item.code !== lockedRoomType}
                      onClick={() => {
                        if (lockedRoomType && item.code !== lockedRoomType) return;
                        apply({ roomType: item.code });
                      }}
                      dot={item.dot}
                    >
                      {item.label}
                    </FilterPill>
                  ))}
                </div>
              </div>

              <div className="text-[13px]">
                {t.sort}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {sortSegments.map((item) => (
                    <FilterPill
                      key={item.code}
                      active={sort === item.code}
                      onClick={() => apply({ sort: item.code })}
                    >
                      {item.label}
                    </FilterPill>
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
