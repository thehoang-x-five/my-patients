// src/components/notifications/NotificationItem.jsx
import React from "react";
import { motion } from "framer-motion";
import { useMarkRead } from "../../api/notifications.js";

function typeEmoji(type) {
  const t = (type || "").toLowerCase();
  if (t === "appointment") return "📅";
  if (t === "patient") return "👤";
  if (t === "pharmacy") return "💊";
  if (t === "billing") return "💳";
  if (t === "system") return "⚙️";
  return "🔔";
}

function PriorityChip({ priority }) {
  const p = (priority || "").toLowerCase();
  if (p !== "high") return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 ring-1 ring-rose-200">
      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      Ưu tiên
    </span>
  );
}

export default function NotificationItem({ item, index = 0, onOpenDetail }) {
  const mark = useMarkRead();

  const handleClick = () => {
    onOpenDetail?.(item);
    if (!item.read && !mark.isPending && item.id != null) {
      mark.mutate(item.id);
    }
  };

  const created = item.createdAt || item.sentAt || item.time;
  const createdStr = created
    ? new Date(created).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
      })
    : "";

  const subtitleParts = [];
  if (item.fromStaff) subtitleParts.push(item.fromStaff);
  if (item.fromDept) subtitleParts.push(item.fromDept);
  if (item.patientId || item.patientName) {
    subtitleParts.push(
      `BN ${
        item.patientId
          ? `${item.patientId}${item.patientName ? " - " : ""}`
          : ""
      }${item.patientName || ""}`.trim()
    );
  }
  const subtitle = subtitleParts.join(" • ");

  return (
    <motion.article
      initial={{ y: 6, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.02 }}
      onClick={handleClick}
      className={[
        "group relative grid grid-cols-[44px_1fr_auto] gap-3 items-start p-3 rounded-xl cursor-pointer",
        "bg-gradient-to-br from-pink-100/30 to-violet-50/40 ring-1 ring-violet-100",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-0.5 hover:ring-violet-300 hover:shadow-lg hover:shadow-violet-200/40",
        "hover:from-white hover:to-violet-100/80",
      ].join(" ")}
    >
      {/* left: emoji in gradient pill */}
      <div className="relative mt-0.5">
        <div
          className={[
            "w-9 h-9 rounded-2xl grid place-items-center text-lg",
            item.read
              ? "bg-slate-100 text-violet-600"
              : "bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 text-white shadow-md",
          ].join(" ")}
        >
          <span aria-hidden="true">{typeEmoji(item.type)}</span>
        </div>
        {!item.read && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_0_4px_rgba(129,140,248,.4)]" />
        )}
      </div>

      {/* middle: text */}
      <div className="min-w-0 space-y-1">
        <div className="flex items-start gap-2 flex-wrap">
          <p
            className={[
              "text-sm font-semibold truncate max-w-full",
              item.read ? "text-slate-800" : "text-slate-900",
              "group-hover:text-violet-700 transition-colors",
            ].join(" ")}
          >
            {item.title || "(Không có tiêu đề)"}
          </p>
          <PriorityChip priority={item.priority} />
        </div>

        {subtitle && (
          <p className="text-[12px] text-slate-500 line-clamp-1 group-hover:text-slate-600 transition-colors">
            {subtitle}
          </p>
        )}

        {item.description && (
          <p className="text-[13px] text-slate-600 line-clamp-2 group-hover:text-slate-700 transition-colors">
            {item.description}
          </p>
        )}
      </div>

      {/* right: time + type */}
      <div className="flex flex-col items-end justify-between gap-1 ml-2">
        {createdStr && (
          <span className="text-[11px] text-slate-500">{createdStr}</span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-white/80 text-violet-700 ring-1 ring-violet-200">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
          {item.type==="lich_hen"?"Lịch hẹn": item.type==="reminder"?"Nhắc nhở":item.type==="result"?"Kết quả":"Khác"}
        </span>
      </div>
    </motion.article>
  );
}
