// /src/components/notifications/NotificationList.jsx
import React from "react";
import NotificationItem from "./NotificationItem.jsx";

export default function NotificationList({ items, onOpenDetail }) {
  if (!items?.length) {
    return (
      <section className="card mt-3 p-8 text-center text-gray-500">
        Không có thông báo.
      </section>
    );
  }
  return (
    <section className="card mt-3 p-2">
      <ul className="divide-y">
        {items.map((n) => (
          <NotificationItem
            key={n.id}
            item={n}
            onOpenDetail={() => onOpenDetail(n)}
          />
        ))}
      </ul>
    </section>
  );
}