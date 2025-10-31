import React from 'react';
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

let enqueueToast = null; // setter toàn cục

export function pushToast(t) {
  if (enqueueToast) enqueueToast(t);
  else console.warn("ToastDock chưa mount!");
}

export default function ToastDock() {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    enqueueToast = (t) => {
      const id = crypto.randomUUID();
      const toast = { id, tone: "info", title: "", message: "", ...t };
      setToasts((s) => [...s, toast]);
      // auto-hide 3.2s
      const h = setTimeout(() => {
        setToasts((s) => s.filter((x) => x.id !== id));
      }, 3200);
      timers.current.set(id, h);
    };
    return () => {
      enqueueToast = null;
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  const toneMap = {
    info: "bg-sky-50 text-sky-900 ring-sky-200",
    ok: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    warn: "bg-amber-50 text-amber-900 ring-amber-200",
    danger: "bg-rose-50 text-rose-900 ring-rose-200",
  };

  return (
    <div className="fixed right-4 bottom-4 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            className={`pointer-events-auto max-w-[320px] rounded-xl px-3 py-2 ring-1 shadow-soft ${
              toneMap[t.tone]
            }`}
          >
            {t.title && <b className="block">{t.title}</b>}
            {t.message && <div className="text-sm">{t.message}</div>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
