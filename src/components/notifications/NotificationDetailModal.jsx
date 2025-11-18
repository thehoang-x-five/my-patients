// /src/components/notifications/NotificationDetailModal.jsx
import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export default function NotificationDetailModal({ open, item, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-x-0 top-14 mx-auto w-[680px] max-w-[92vw] card p-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-label="Chi tiết thông báo"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-semibold">{item?.title || item?.message}</div>
                <div className="text-xs text-gray-500 mt-1">{item?.type} • {item ? new Date(item.createdAt || item.time).toLocaleString() : ""}</div>
              </div>
              <button className="btn-icon" onClick={onClose}><span className="i-x" /></button>
            </div>
            {item?.description && <div className="mt-3 text-gray-700 whitespace-pre-wrap">{item.description}</div>}
            {Array.isArray(item?.links) && item.links.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {item.links.map((l, i) => (
                  <a key={i} href={l.href} className="btn btn-light" target="_blank" rel="noreferrer">{l.label || l.href}</a>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}