import React from 'react';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const icons = {
  appointment: "📅",
  stock: "⚠️",
  billing: "💳",
  lab: "🧪",
  rx: "💊",
  message: "💬",
  system: "🛠️",
  staff: "🧑‍⚕️",
};

export default function NotificationItem({ n, onToggleRead, onOpen, idx = 0 }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ delay: idx * 0.02 }}
      className="group rounded-xl p-3 bg-gradient-to-b  from-white bg-violet-100/50 ring-1 ring-slate-200/80 hover:ring-gray-200 hover:shadow-soft transition cursor-pointer  hover:bg-gradient-to-b  hover:from-slate-50 hover:bg-sky-100 hover:-translate-y-0.5 "
      onClick={() => onOpen?.(n)}
      role="listitem"
      aria-label={`${n.title}`}
    >
      <div className="flex items-start gap-3">
        <div className="grid place-items-center w-10 h-10 rounded-lg ring-1 ring-slate-200/80 bg-slate-50">
          <span aria-hidden>{icons[n.type] || "🔔"}</span>
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-extrabold leading-tight">{n.title}</div>
              <div className="text-sm text-slate-600 mt-0.5">{n.body}</div>
              <div className="text-xs text-slate-500 mt-1">
                {n.patientId && (
                  <>
                    BN:{" "}
                    <Link
                      className="underline underline-offset-2 hover:text-sky-700"
                      to={`/patients?pid=${n.patientId}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {n.patientName} ({n.patientId})
                    </Link>
                    {" · "}
                  </>
                )}
                {new Date(n.ts).toLocaleString("vi-VN")}
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {n.unread ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 text-xs bg-sky-50 text-sky-700 ring-sky-200">
                  Mới
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full ring-1 text-xs bg-slate-50 text-slate-600 ring-slate-200">
                  Đã đọc
                </span>
              )}
              <button
                className="btn !px-2"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleRead?.(n.id);
                }}
                aria-label={n.unread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
                title={n.unread ? "Đánh dấu đã đọc" : "Đánh dấu chưa đọc"}
              >
                {n.unread ? "✓" : "⟲"}
              </button>
            </div>
          </div>

          {!!(n.links || []).length && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(n.links || []).map((l, i) => (
                <Link
                  key={i}
                  to={l.to}
                  onClick={(e) => e.stopPropagation()}
                  className="text-sm underline underline-offset-2 text-sky-700 hover:text-sky-800 focus:outline-none focus:ring-2 ring-sky-300 rounded"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
