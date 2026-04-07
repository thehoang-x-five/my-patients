import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function PromptModal({
  open,
  title = "Nhap du lieu",
  message = "",
  value = "",
  placeholder = "",
  confirmText = "Xac nhan",
  cancelText = "Huy",
  onClose,
  onConfirm,
  isPending = false,
}) {
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    if (open) {
      setDraft(value || "");
    }
  }, [open, value]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-indigo-200"
          >
            <div className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-100 text-xl">
                *
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-slate-900">{title}</h3>
                {message ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                    {message}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-5">
              <input
                autoFocus
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !isPending) {
                    event.preventDefault();
                    onConfirm?.(draft);
                  }
                }}
                placeholder={placeholder}
                className="w-full rounded-2xl bg-white px-4 py-3 text-sm text-slate-800 ring-1 ring-slate-200 outline-none transition focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 hover:border-slate-300"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => onConfirm?.(draft)}
                className="rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-md disabled:opacity-60"
              >
                {isPending ? "Dang xu ly..." : confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
