import { AnimatePresence } from "framer-motion";
import NotificationItem from "./NotificationItem.jsx";
import React from 'react';
export default function NotificationList({
  items,
  onToggleRead,
  onOpen,
  loading,
  stretch = true, // mặc định fill chiều cao cha
}) {
  if (loading) {
    return (
      <section
        className={`card p-4 ${stretch ? "h-full flex flex-col min-h-0" : ""}`}
      >
        <div className="space-y-2 flex-1 min-h-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skel h-14" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section
      className={`card p-2 ${stretch ? "h-full flex flex-col min-h-0" : ""}`}
      role="list"
      aria-label="Danh sách thông báo"
    >
      <div className="flex-1 min-h-0 overflow-auto scrollbar-none p-1">
        <div className="grid gap-2">
          <AnimatePresence initial={false}>
            {items.map((n, idx) => (
              <NotificationItem
                key={n.id}
                n={n}
                idx={idx}
                onToggleRead={onToggleRead}
                onOpen={onOpen}
              />
            ))}
          </AnimatePresence>

          {!items.length && (
            <div className="text-slate-500 text-sm px-2 py-10 text-center">
              Không có thông báo phù hợp.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
