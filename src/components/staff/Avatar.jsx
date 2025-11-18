// src/components/staff/Avatar.jsx
import React from "react";

export default function Avatar({
  item,
  src,
  name = "?",
  size = 40,
  status = "offline",
}) {
  const pixelSize = typeof size === "number" ? size : 40;

  const finalSrc =
    src ?? item?.avatarUrl ?? item?.photoUrl ?? item?.imageUrl ?? null;
  const finalName = (name || item?.name || "?").trim() || "?";
  const finalStatus = status || item?.status || "offline";

  const colors = {
    online: "bg-emerald-500",
    idle: "bg-amber-400",
    offline: "bg-slate-400",
  };

  return (
    <div
      className="relative inline-flex items-center"
      style={{ width: pixelSize, height: pixelSize }}
    >
      {finalSrc ? (
        <img
          alt={finalName}
          src={finalSrc}
          className="w-full h-full object-cover rounded-full ring-1 ring-black/5"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
          {finalName[0]?.toUpperCase() ?? "?"}
        </div>
      )}
      <span
        className={`absolute -bottom-0 -right-0 block w-3 h-3 rounded-full ring-2 ring-white ${
          colors[finalStatus] || colors.offline
        }`}
        aria-label={`Trạng thái: ${finalStatus}`}
      />
    </div>
  );
}
