import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import {
  ACCOUNT_STATUSES,
  STATUSES,
  getAccountStatusLabel,
  getTodayStatusLabel,
} from "../../api/patients";
import { useUI } from "../../context/UIContext.jsx";
import FilterPopoverFooter from "../ui/FilterPopoverFooter.jsx";

const TODAY_SEG = [
  "all",
  STATUSES.WAIT_INTAKE,
  STATUSES.WAIT_INTAKE_SVC,
  STATUSES.WAIT_EXAM,
  STATUSES.WAIT_EXAM_SVC,
  STATUSES.WAIT_PROC,
  STATUSES.WAIT_PROC_SVC,
  STATUSES.IN_EXAM,
  STATUSES.IN_EXAM_SVC,
  STATUSES.DONE,
  STATUSES.CANCELLED,
];

export default function PatientsFilterPopover({
  open,
  onClose,
  values,
  setValues,
  anchorEl,
  sort = "priority",
  onChangeSort,
  onReset,
}) {
  const { lang } = useUI();
  const boxRef = useRef(null);
  const kwRef = useRef(null);
  const justOpenedRef = useRef(false);

  const anchorNode =
    anchorEl && anchorEl.current ? anchorEl.current : anchorEl || null;

  const kw = values?.keyword ?? "";
  const todayStatus = values?.todayStatus ?? "all";
  const accountStatus = values?.accountStatus ?? "all";

  const t =
    lang === "en"
      ? {
          title: "Patient Filters",
          keyword: "Keyword",
          keywordPlaceholder: "Patient ID / name / phone / email…",
          clearSearch: "Clear search",
          todayStatus: "Today's status",
          accountStatus: "Account status",
          all: "All",
          sort: "Sort by",
          sortPriority: "Status priority",
          sortName: "Name",
          sortDate: "Status date",
          todayStatusAria: "Filter by today's status",
          accountStatusAria: "Filter by account status",
        }
      : {
          title: "Bộ lọc bệnh nhân",
          keyword: "Từ khóa",
          keywordPlaceholder: "Mã BN / Họ tên / SĐT / Email…",
          clearSearch: "Xóa tìm kiếm",
          todayStatus: "Trạng thái hôm nay",
          accountStatus: "Trạng thái tài khoản",
          all: "Tất cả",
          sort: "Sắp xếp",
          sortPriority: "Ưu tiên trạng thái",
          sortName: "Theo tên",
          sortDate: "Theo ngày trạng thái",
          todayStatusAria: "Lọc theo trạng thái hôm nay",
          accountStatusAria: "Lọc theo trạng thái tài khoản",
        };

  const accountOptions = [
    { value: "all", label: t.all },
    ...ACCOUNT_STATUSES.map((code) => ({
      value: code,
      label: getAccountStatusLabel(code, lang),
    })),
  ];

  const sortOptions = [
    { value: "priority", label: t.sortPriority },
    { value: "name", label: t.sortName },
    { value: "date", label: t.sortDate },
  ];

  useEffect(() => {
    if (!open) return;
    justOpenedRef.current = true;

    const onKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };

    const onClickOutside = (event) => {
      if (justOpenedRef.current) return;
      const target = event.target;
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

  const [pos, setPos] = useState({ top: 72, left: 16 });
  const [maxH, setMaxH] = useState(520);
  const [widthPx, setWidthPx] = useState(360);

  function computePosition() {
    const gap = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const width = Math.min(355, vw - 24);
    const el =
      anchorNode && anchorNode.getBoundingClientRect ? anchorNode : null;
    const rect = el ? el.getBoundingClientRect() : null;

    const left = Math.min(Math.max(rect ? rect.right - width : 16, 12), vw - width - 12);
    let top = (rect ? rect.bottom : 64) + gap;

    const estimatedHeight = 360;
    if (top + estimatedHeight > vh - 12 && rect) {
      top = Math.max(12, rect.top - gap - estimatedHeight);
    }

    setWidthPx(width);
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
            aria-label={t.title}
            className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-emerald-200/70"
            style={{ maxHeight: maxH }}
          >
            <div className="border-b border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 px-3 py-2">
              <div className="flex items-center gap-2 text-[13px] font-extrabold tracking-tight text-emerald-800">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-lg bg-emerald-100 ring-1 ring-emerald-200">
                  🔎
                </span>
                {t.title}
              </div>
            </div>

            <div className="grid gap-2 overflow-y-auto p-2">
              <label className="text-[13px]">
                {t.keyword}
                <div className="relative mt-1">
                  <input
                    ref={kwRef}
                    value={kw}
                    onChange={(event) => setValues({ keyword: event.target.value })}
                    placeholder={t.keywordPlaceholder}
                    className="w-full rounded-xl bg-white px-3 py-2 pl-9 text-[13px] shadow-sm ring-1 ring-slate-200/80 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute left-2 top-2.5 text-emerald-600">🔎</span>
                  {kw && (
                    <button
                      type="button"
                      aria-label={t.clearSearch}
                      onClick={() => setValues({ keyword: "" })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </label>

              <div className="text-[13px]">
                {t.todayStatus}
                <div
                  role="radiogroup"
                  aria-label={t.todayStatusAria}
                  className="mt-1 flex w-full flex-wrap gap-1.5 overflow-x-auto overflow-y-visible rounded-xl bg-gradient-to-b from-white to-emerald-50/40 p-1 ring-1 ring-emerald-100"
                  onKeyDown={(event) => {
                    const index = TODAY_SEG.findIndex((value) => value === todayStatus);
                    if (event.key === "ArrowRight") {
                      event.preventDefault();
                      const next = TODAY_SEG[(index + 1) % TODAY_SEG.length];
                      setValues({ todayStatus: next });
                    } else if (event.key === "ArrowLeft") {
                      event.preventDefault();
                      const prev =
                        TODAY_SEG[(index - 1 + TODAY_SEG.length) % TODAY_SEG.length];
                      setValues({ todayStatus: prev });
                    }
                  }}
                >
                  {TODAY_SEG.map((status) => {
                    const active = todayStatus === status;
                    const label =
                      status === "all"
                        ? t.all
                        : getTodayStatusLabel(status, lang) || status;
                    return (
                      <button
                        key={status}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setValues({ todayStatus: status })}
                        className={[
                          "relative z-10 rounded-lg px-3 py-1 text-[12px] font-semibold whitespace-nowrap ring-1 transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                          active
                            ? "bg-teal-50 text-teal-800 ring-emerald-300"
                            : "bg-white text-slate-700 ring-slate-200 hover:text-emerald-800 hover:ring-emerald-200",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="patientsSegPillPopoverToday"
                            className="absolute inset-0 rounded-lg bg-teal-50"
                            transition={{ type: "spring", stiffness: 420, damping: 30 }}
                          />
                        )}
                        <span className="relative">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="text-[13px]">
                {t.accountStatus}
                <div
                  role="radiogroup"
                  aria-label={t.accountStatusAria}
                  className="mt-1 flex w-full flex-wrap gap-1.5 rounded-xl bg-gradient-to-b from-white to-emerald-50/40 p-1 ring-1 ring-emerald-100"
                >
                  {accountOptions.map((option) => {
                    const active = accountStatus === option.value;
                    return (
                      <button
                        key={option.value}
                        role="radio"
                        aria-checked={active}
                        onClick={() => setValues({ accountStatus: option.value })}
                        className={[
                          "relative z-10 rounded-lg px-2.5 py-1 text-[12px] font-semibold whitespace-nowrap ring-1 transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400",
                          active
                            ? "bg-teal-50 text-teal-800 ring-emerald-300"
                            : "bg-white text-slate-700 ring-slate-200 hover:text-emerald-800 hover:ring-emerald-200",
                        ].join(" ")}
                      >
                        {active && (
                          <motion.span
                            layoutId="patientsSegPillPopoverAcc"
                            className="absolute inset-0 rounded-lg bg-teal-50"
                            transition={{ type: "spring", stiffness: 420, damping: 30 }}
                          />
                        )}
                        <span className="relative">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-2 text-[13px]">
                {t.sort}
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {sortOptions.map((option) => {
                    const active = sort === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => onChangeSort?.(option.value)}
                        className={[
                          "rounded-full border px-2.5 py-1 text-[12px] font-semibold transition",
                          active
                            ? "border-emerald-400 bg-emerald-100 text-emerald-800"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <FilterPopoverFooter onReset={() => onReset?.()} onClose={onClose} accent="emerald" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
