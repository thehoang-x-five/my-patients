// src/components/ui/Chip.jsx
import React from "react";
import { motion } from "framer-motion";

export default function Chip({
  children,
  dot, // "emerald" | "amber" | "sky" | "rose" | "slate" | "teal" | "cyan" | "violet"
  tone = "white", // "white" | "yellow" | "amber" | "sky" | "slate" | "teal" | "emerald" | "violet"
  active = false,
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
    red: "bg-red-50 ring-red-200",
    rose: "bg-rose-50 ring-rose-200",
    indigo: "bg-indigo-50 ring-indigo-200", // thêm indigo
    cyan: "bg-cyan-50 ring-cyan-200",
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
    red: "bg-red-400",
    indigo: "bg-indigo-500", // thêm indigo
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
    indigo: "99,102,241", // thêm indigo
  };
  
  const prefer = dot && rgbByTone[dot] ? dot : tone;
  const hoverRGB = rgbByTone[prefer] || rgbByTone.violet;
  const activeColor = dot && toneMap[dot] ? dot : toneMap[tone] ? tone : "violet";
  const activeToneMap = {
    white: "bg-violet-50 text-violet-700 ring-violet-300 shadow-sm",
    yellow: "bg-yellow-100 text-yellow-800 ring-yellow-300 shadow-sm",
    amber: "bg-amber-100 text-amber-800 ring-amber-300 shadow-sm",
    sky: "bg-sky-100 text-sky-800 ring-sky-300 shadow-sm",
    slate: "bg-slate-200 text-slate-800 ring-slate-300 shadow-sm",
    teal: "bg-teal-100 text-teal-800 ring-teal-300 shadow-sm",
    emerald: "bg-emerald-100 text-emerald-800 ring-emerald-300 shadow-sm",
    violet: "bg-violet-100 text-violet-800 ring-violet-300 shadow-sm",
    red: "bg-red-100 text-red-800 ring-red-300 shadow-sm",
    rose: "bg-rose-100 text-rose-800 ring-rose-300 shadow-sm",
    indigo: "bg-indigo-100 text-indigo-800 ring-indigo-300 shadow-sm",
    cyan: "bg-cyan-100 text-cyan-800 ring-cyan-300 shadow-sm",
  };
  const interactive = typeof rest.onClick === "function" || Tag === "button";

  return (
    <motion.span
      whileHover={{
        y: -1,
        boxShadow: `0 6px 18px rgba(${hoverRGB}, ${active ? ".24" : ".18"})`,
      }}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      className={[
        "inline-flex text-sm items-center gap-2 rounded-full px-3 py-1.5 ring-1 transition-all duration-150",
        interactive ? "cursor-pointer select-none" : "",
        active
          ? activeToneMap[activeColor] || activeToneMap.violet
          : toneMap[tone] || toneMap.white,
        className,
      ].join(" ")}
      {...rest}
    >
      {dot && <span className={`w-2 h-2 rounded-full ${dotMap[dot] || ""}`} />}
      {children}
    </motion.span>
  );
}
