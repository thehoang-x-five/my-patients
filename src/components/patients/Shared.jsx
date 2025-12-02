//src/components/patients/Shared.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx"; // Lưu ý đường dẫn import tùy project thực tế

export const ANIMATION_CONFIG = {
  initial: { opacity: 0, scale: 0.98, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

export const SERVICE_ROOMS = ["X-Quang", "Siêu âm", "Xét nghiệm", "Nội soi"];

export function StatusPill({ s }) {
  const low = (s || "").toLowerCase();
  const tone = /hoàn thành/.test(low)
    ? "emerald"
    : /hẹn tái khám/.test(low)
    ? "teal"
    : /hẹn khám/.test(low)
    ? "cyan"
    : /chờ xử lý/.test(low)
    ? "sky"
    : /chờ/.test(low)
    ? "amber"
    : "slate";
  
  return (
    <Chip tone={tone} dot={tone} className="text-xs">
      {s || "—"}
    </Chip>
  );
}

export function R({ label, value, classname }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div
        className={`rounded-xl px-3 py-2 ring-1 ring-emerald-200/60 bg-white text-[13px] text-slate-800 whitespace-pre-wrap ${
          classname ? classname : ""
        }`}
      >
        {value && String(value).trim() ? value : "Không có nội dung"}
      </div>
    </div>
  );
}