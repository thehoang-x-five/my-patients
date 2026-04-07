import React from "react";

const ACCENT_STYLES = {
  emerald: {
    reset:
      "hover:bg-emerald-50 hover:text-emerald-700 hover:ring-emerald-300",
    close: "bg-emerald-600 hover:bg-emerald-700",
  },
  violet: {
    reset:
      "hover:bg-violet-50 hover:text-violet-700 hover:ring-violet-300",
    close: "bg-violet-600 hover:bg-violet-700",
  },
  indigo: {
    reset:
      "hover:bg-indigo-50 hover:text-indigo-700 hover:ring-indigo-300",
    close: "bg-indigo-600 hover:bg-indigo-700",
  },
  cyan: {
    reset:
      "hover:bg-cyan-50 hover:text-cyan-700 hover:ring-cyan-300",
    close: "bg-cyan-600 hover:bg-cyan-700",
  },
  amber: {
    reset:
      "hover:bg-amber-50 hover:text-amber-700 hover:ring-amber-300",
    close: "bg-amber-600 hover:bg-amber-700",
  },
};

export default function FilterPopoverFooter({
  onReset,
  onClose,
  resetLabel = "Reset bộ lọc",
  closeLabel = "Đóng",
  accent = "emerald",
}) {
  const styles = ACCENT_STYLES[accent] || ACCENT_STYLES.emerald;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-slate-50/80 px-3 py-2">
      <button
        type="button"
        onClick={onReset}
        className={`inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[13px] font-medium text-slate-700 ring-1 ring-slate-200 transition ${styles.reset}`}
      >
        {resetLabel}
      </button>
      <button
        type="button"
        onClick={onClose}
        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-[13px] font-semibold text-white transition ${styles.close}`}
      >
        {closeLabel}
      </button>
    </div>
  );
}
