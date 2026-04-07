// src/components/staff/ViewToggle.jsx
// Week 4 — Toggle Card ↔ Table view (admin only)
import React from "react";
import { motion } from "framer-motion";

export default function ViewToggle({ mode, onChange }) {
  const options = [
    { key: "card", icon: "▦", label: "Dạng ô" },
    { key: "table", icon: "☰", label: "Dạng dòng" },
  ];

  return (
    <div
      className="relative inline-flex p-0.5 overflow-hidden rounded-xl ring-1 ring-teal-200/80 bg-white"
      role="radiogroup"
      aria-label="Chế độ xem"
    >
      {options.map((opt) => {
        const active = mode === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={active}
            title={opt.label}
            onClick={() => onChange(opt.key)}
            className={`relative z-10 px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${
              active
                ? "text-teal-800"
                : "text-slate-500 hover:text-teal-700"
            }`}
          >
            {active && (
              <motion.span
                layoutId="viewTogglePill"
                className="absolute inset-0 rounded-lg bg-teal-50"
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
              />
            )}
            <span className="relative">{opt.icon}</span>
          </button>
        );
      })}
    </div>
  );
}
