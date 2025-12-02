// src/components/ui/Avatar.jsx
import React from "react";

export default function Avatar({
  item,
  src,
  name = "?",
  size = 40,
  status, // KHÔNG set default để không ép luôn 'offline'
}) {
  const pixelSize = typeof size === "number" ? size : 40;

  // Ưu tiên src truyền vào, sau đó tới avatar/ảnh trong item
  const finalSrc =
    src ??
    item?.avatarUrl ??
    item?.anhDaiDien ??
    item?.AnhDaiDien ??
    item?.photoUrl ??
    item?.imageUrl ??
    null;

  const rawName =
    name || item?.name || item?.hoTen || item?.HoTen || "?";
  const finalName = (rawName || "?").toString().trim() || "?";

  // Ưu tiên status đã normalize trên item (online/pause/offline),
  // nếu prop status được truyền vào thì override.
  const rawStatus = (item?.status ==="active" )? "online" :((item?.status ==="inactive" )? "offline" :(status ?? item?.status ?? null));
  const finalStatus =
    (rawStatus && rawStatus.toString().toLowerCase()) || "offline";

   
const colors = {
      online: "bg-emerald-500",
      pause: "bg-amber-400",   // tạm nghỉ
      idle: "bg-amber-400",    // alias cũ, nếu lỡ dùng
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
