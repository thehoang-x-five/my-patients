import React from "react";
import { motion } from "framer-motion";
import { useUI } from "../../context/UIContext.jsx";

export default function ViewToggle({ mode, onChange }) {
  const { lang } = useUI();
  const options = [
    {
      key: "card",
      icon: "◫",
      label: lang === "en" ? "Cards" : "Dạng ô",
    },
    {
      key: "table",
      icon: "☰",
      label: lang === "en" ? "Rows" : "Dạng dòng",
    },
  ];

  return (
    <div
      className="relative inline-flex overflow-hidden rounded-xl bg-white p-0.5 ring-1 ring-teal-200/80"
      role="radiogroup"
      aria-label={lang === "en" ? "View mode" : "Chế độ xem"}
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
