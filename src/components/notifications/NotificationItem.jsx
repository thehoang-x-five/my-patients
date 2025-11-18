// /src/components/notifications/NotificationItem.jsx
import React from "react";
import { useMarkRead } from "../../api/notifications";

function TypeIcon({ type }) {
  const map = {
    appointment: "i-calendar",
    patient: "i-user",
    pharmacy: "i-capsule",
    billing: "i-receipt",
    system: "i-info",
  };
  const cls = map[type] || "i-bell";
  return <span className={`${cls} text-lg`} aria-hidden />;
}

export default function NotificationItem({ item, onOpenDetail }) {
  const mark = useMarkRead();
  const isUnread = !item.read;

  const onClick = () => {
    onOpenDetail?.();
    if (isUnread && !mark.isPending) mark.mutate(item.id);
  };

  return (
    <li
      className={`flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer ${
        isUnread ? "bg-yellow-50/40" : ""
      }`}
      onClick={onClick}
    >
      <div className="mt-0.5"><TypeIcon type={item.type} /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-medium line-clamp-1">
            {item.title || item.message}
          </div>
          {isUnread && (
            <span className="text-[10px] px-1.5 py-0.5 bg-blue-600 text-white rounded">
              Mới
            </span>
          )}
        </div>
        {item.description && (
          <div className="text-sm text-gray-600 line-clamp-2">
            {item.description}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-0.5">
          {item.type} • {new Date(item.createdAt || item.time).toLocaleString()}
        </div>
      </div>
    </li>
  );
}