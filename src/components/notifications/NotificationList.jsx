// src/components/notifications/NotificationList.jsx
import React from "react";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationList({
  items,
  onOpenDetail,
  stretch = false,
}) {
  const list = Array.isArray(items) ? items : [];

  const shellBase =
    "pt-2 bg-white rounded-2xl overflow-hidden shadow-soft ring-1 ring-violet-100/80";
  const shellStretch = stretch ? "h-full min-h-[320px] flex flex-col" : "";
  const bodyBase = "p-3 pt-1";
  const bodyScroll = stretch
    ? "flex-1 min-h-0 overflow-y-auto scrollbar-none"
    : "max-h-full overflow-y-auto scrollbar-none";

  if (!list.length) {
    return (
      <section
        className={[
          "h-full p-6 rounded-2xl text-slate-500  bg-white",
          stretch ? "min-h-[320px] flex items-center justify-center" : "",
        ].join(" ")}
      >
        Không có thông báo phù hợp.
      </section>
    );
  }

  return (
    <section className={`${shellBase} ${shellStretch}`}>
      <div className={`${bodyBase} ${bodyScroll}`}>
        <div className="flex flex-col gap-2">
          {list.map((n, i) => (
            <NotificationItem
              key={n.id ?? `${n.notifId}-${n.createdAt}-${i}`}
              item={n}
              index={i}
              onOpenDetail={onOpenDetail}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
