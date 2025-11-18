// src/components/ui/Chip.jsx
import React from "react";
import { motion } from "framer-motion";

export default function Chip({
  children,
  dot, // "emerald" | "amber" | "sky" | "rose" | "slate" | "teal" | "cyan" | "violet"
  tone = "white", // "white" | "yellow" | "amber" | "sky" | "slate" | "teal" | "emerald" | "violet"
  className = "",
  as: Tag = "span",
  ...rest
}) {
  const toneMap = {
    white: "bg-white ring-slate-200/80",
    yellow: "bg-yellow-50 ring-yellow-200",
    amber: "bg-amber-50 ring-amber-200",
    sky: "bg-sky-50 ring-sky-200",
    slate: "bg-slate-50 ring-slate-200",
    teal: "bg-teal-50 ring-teal-200",
    emerald: "bg-emerald-50 ring-emerald-200",
    violet: "bg-violet-50 ring-violet-200",
    red:"bg-red-50 ring-red-200",
    rose:"bg-rose-50 ring-rose-200",
  };
  const dotMap = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    sky: "bg-sky-500",
    cyan: "bg-cyan-500",
    teal: "bg-teal-500",
    rose: "bg-rose-500",
    slate: "bg-slate-400",
    violet: "bg-violet-500",
    red:"bg-red-400",
  };

  // Hover shadow theo tone/dot (fallback violet để đồng bộ one-tone)
  const rgbByTone = {
    emerald: "16,185,129",
    amber: "245,158,11",
    sky: "14,165,233",
    teal: "20,184,166",
    rose: "244,63,94",
    slate: "100,116,139",
    violet: "139,92,246",
    white: "139,92,246",
    yellow: "234,179,8",
    cyan: "6,182,212",
    red: "240,70,100",
  };
  const prefer = dot && rgbByTone[dot] ? dot : tone;
  const hoverRGB = rgbByTone[prefer] || rgbByTone.violet;

  return (
    <motion.span
      whileHover={{ y: -1, boxShadow: `0 6px 18px rgba(${hoverRGB}, .18)` }}
      className={`inline-flex text-sm items-center gap-2 rounded-full px-3 py-1.5 ring-1 ${toneMap[tone] || toneMap.white} ${className}`}
      {...rest}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotMap[dot] || ""}`} />}
      {children}
    </motion.span>
  );
}
