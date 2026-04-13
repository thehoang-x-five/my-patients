import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import { useUI } from "../../context/UIContext.jsx";

function normalizeOptions(options) {
  return (Array.isArray(options) ? options : []).map((option) => {
    if (option && typeof option === "object") {
      return {
        value: option.value ?? "",
        label: option.label ?? String(option.value ?? ""),
        description: option.description ?? "",
        disabled: !!option.disabled,
      };
    }

    return {
      value: option ?? "",
      label: String(option ?? ""),
      description: "",
      disabled: false,
    };
  });
}

export default function PopoverSelect({
  value,
  onChange,
  options = [],
  placeholder,
  disabled = false,
  required = false,
  name,
  className = "",
  buttonClassName = "",
  panelClassName = "",
  searchable,
  searchPlaceholder,
  emptyText,
  ariaLabel,
}) {
  const { lang } = useUI();
  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState({ top: 72, left: 16, width: 240 });

  const fallbackPlaceholder = lang === "en" ? "Select..." : "Chọn...";
  const fallbackSearchPlaceholder =
    lang === "en" ? "Search options..." : "Tìm lựa chọn...";
  const fallbackEmptyText =
    lang === "en"
      ? "No matching options found."
      : "Không có lựa chọn phù hợp.";

  const normalizedOptions = useMemo(() => normalizeOptions(options), [options]);
  const selected = normalizedOptions.find(
    (option) => String(option.value) === String(value)
  );
  const canSearch = searchable ?? normalizedOptions.length > 8;

  const filteredOptions = useMemo(() => {
    if (!query.trim()) return normalizedOptions;
    const keyword = query.trim().toLowerCase();
    return normalizedOptions.filter((option) => {
      const haystack = `${option.label} ${option.description}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [normalizedOptions, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const computePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 12;
    const gap = 8;
    const width = Math.min(Math.max(rect.width, 240), vw - 24);
    const panelHeight = Math.min(
      panelRef.current?.offsetHeight || (canSearch ? 360 : 300),
      vh - margin * 2
    );
    const spaceBelow = vh - rect.bottom - margin;
    const spaceAbove = rect.top - margin;

    let left = Math.min(Math.max(rect.left, margin), vw - width - margin);
    let top;

    if (spaceBelow >= panelHeight || spaceBelow >= spaceAbove) {
      top = Math.min(rect.bottom + gap, vh - panelHeight - margin);
    } else {
      top = Math.max(margin, rect.top - panelHeight - gap);
    }

    setPos({ top, left, width });
  }, [canSearch]);

  useLayoutEffect(() => {
    if (!open) return undefined;

    let raf1 = 0;
    let raf2 = 0;
    let raf3 = 0;

    computePosition();
    raf1 = window.requestAnimationFrame(() => {
      computePosition();
      raf2 = window.requestAnimationFrame(() => {
        computePosition();
        raf3 = window.requestAnimationFrame(() => {
          computePosition();
        });
      });
    });

    return () => {
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.cancelAnimationFrame(raf3);
    };
  }, [open, normalizedOptions.length, computePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const onKey = (event) => {
      if (event.key === "Escape") close();
    };

    const onClickOutside = (event) => {
      const target = event.target;
      const insidePanel = panelRef.current?.contains(target);
      const insideTrigger = triggerRef.current?.contains(target);
      if (!insidePanel && !insideTrigger) close();
    };

    const onViewport = () => computePosition();

    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onClickOutside, true);
    document.addEventListener("scroll", onViewport, true);
    window.addEventListener("resize", onViewport, { passive: true });
    window.addEventListener("scroll", onViewport, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onViewport);
      window.visualViewport.addEventListener("scroll", onViewport);
    }

    const focusTimer = window.setTimeout(() => {
      if (canSearch) searchRef.current?.focus();
    }, 0);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onClickOutside, true);
      document.removeEventListener("scroll", onViewport, true);
      window.removeEventListener("resize", onViewport);
      window.removeEventListener("scroll", onViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onViewport);
        window.visualViewport.removeEventListener("scroll", onViewport);
      }
    };
  }, [open, canSearch, computePosition]);

  useEffect(() => {
    if (!open || !triggerRef.current || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => computePosition());
    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [open, computePosition]);

  return (
    <>
      <input
        readOnly
        tabIndex={-1}
        aria-hidden="true"
        name={name}
        required={required}
        value={value ?? ""}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
      />
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder || fallbackPlaceholder}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={[
          "flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-left text-sm text-slate-800 ring-1 ring-slate-300 shadow-sm transition",
          "hover:ring-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
          className,
          buttonClassName,
        ].join(" ")}
      >
        <span className={selected ? "truncate" : "truncate text-slate-400"}>
          {selected?.label || placeholder || fallbackPlaceholder}
        </span>
        <span
          className={`text-xs text-slate-400 transition ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {open && (
                <motion.div
                  className="fixed z-[400]"
                  style={{ top: pos.top, left: pos.left, width: pos.width }}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                >
                  <div
                    ref={panelRef}
                    role="listbox"
                    className={[
                      "overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200",
                      panelClassName,
                    ].join(" ")}
                  >
                    {canSearch ? (
                      <div className="border-b border-slate-100 p-2">
                        <input
                          ref={searchRef}
                          value={query}
                          onChange={(event) => setQuery(event.target.value)}
                          placeholder={
                            searchPlaceholder || fallbackSearchPlaceholder
                          }
                          className="w-full rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800 ring-1 ring-slate-200 outline-none transition focus:bg-white focus:ring-2 focus:ring-teal-500"
                        />
                      </div>
                    ) : null}

                    <div className="max-h-72 overflow-y-auto scrollbar-none p-1.5">
                      {filteredOptions.length ? (
                        filteredOptions.map((option) => {
                          const active =
                            String(option.value) === String(value);
                          return (
                            <button
                              key={`${option.value}`}
                              type="button"
                              role="option"
                              aria-selected={active}
                              disabled={option.disabled}
                              onClick={() => {
                                if (option.disabled) return;
                                onChange?.(option.value);
                                close();
                              }}
                              className={[
                                "flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition",
                                option.disabled
                                  ? "cursor-not-allowed opacity-50"
                                  : active
                                  ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200"
                                  : "text-slate-700 hover:bg-slate-50",
                              ].join(" ")}
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-medium">
                                  {option.label}
                                </span>
                                {option.description ? (
                                  <span className="mt-0.5 block text-xs text-slate-500">
                                    {option.description}
                                  </span>
                                ) : null}
                              </span>
                              {active ? (
                                <span className="text-xs font-semibold text-teal-600">
                                  ✓
                                </span>
                              ) : null}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-slate-500">
                          {emptyText || fallbackEmptyText}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
