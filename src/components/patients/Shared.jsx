//src/components/patients/Shared.jsx
import React from "react";
import { motion } from "framer-motion";
import Chip from "../ui/Chip.jsx"; // Lưu ý đường dẫn import tùy project thực tế
import { TODAY_STATUS_MAP } from "../../api/patients";

export const ANIMATION_CONFIG = {
  initial: { opacity: 0, scale: 0.98, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

export const SERVICE_ROOMS = ["X-Quang", "Siêu âm", "Xét nghiệm", "Nội soi"];

export function StatusPill({ s }) {
  const label = s || "";

  // Determine canonical status code (if s is already a code or a label)
  const input = String(s || "").trim();
  const inputLower = input.toLowerCase();

  let code = null;
  if (Object.prototype.hasOwnProperty.call(TODAY_STATUS_MAP, inputLower)) {
    code = inputLower;
  } else {
    const rev = Object.entries(TODAY_STATUS_MAP).reduce((acc, [k, v]) => {
      acc[String(v || "").toLowerCase()] = k;
      return acc;
    }, {});
    if (rev[inputLower]) code = rev[inputLower];
  }

  // Map canonical code to Chip tone/dot
  let tone = "slate";
  let dot = "slate";

  if (code) {
    if (code === "hoan_tat") {
      tone = "emerald";
      dot = "emerald";
    } else if (code === "da_huy" || code === "huy") {
      tone = "rose";
      dot = "rose";
    } else if (/^cho_/.test(code) || code.includes("cho")) {
      tone = "amber";
      dot = "amber";
    } else if (/^dang_/.test(code) || code.includes("dang")) {
      tone = "cyan";
      dot = "cyan";
    } else if (/hen|hẹn/.test(code) || code.includes("hen")) {
      tone = "teal";
      dot = "teal";
    }
  } else {
    // Fallback: infer from label text
    const low = (label || "").toLowerCase();
    if (/hoàn thành|hoan_tat/.test(low)) {
      tone = "emerald";
      dot = "emerald";
    } else if (/hẹn tái khám|hẹn tái|hen_tai_kham/.test(low)) {
      tone = "teal";
      dot = "teal";
    } else if (/hẹn khám|hen_kham/.test(low)) {
      tone = "cyan";
      dot = "cyan";
    } else if (/chờ|cho_/.test(low)) {
      tone = "amber";
      dot = "amber";
    } else if (/hủy|da_huy|huy/.test(low)) {
      tone = "rose";
      dot = "rose";
    }
  }

  return (
    <Chip tone={tone} dot={dot} className="text-xs">
      {label || "—"}
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