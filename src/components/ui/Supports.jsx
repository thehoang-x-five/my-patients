import { motion } from "framer-motion";
import React from 'react';
/* ---------- Tag (nhẹ, đồng bộ tone) ---------- */
export function Tag({ children, tone = "blue" }) {
  const map = {
    blue: "bg-sky-50 text-sky-700 border-sky-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------- Card (nâng UI + hiệu ứng) ---------- */
export function Card({
  title,
  action,
  children,
  footer,
  className = "",
  ariaLabel,
  tone = "sky", // sky | emerald | amber | slate | rose
}) {
  const toneMap = {
    sky: "from-sky-400/70 via-emerald-400/60 to-fuchsia-400/60",
    emerald: "from-emerald-400/70 via-teal-400/60 to-sky-400/60",
    amber: "from-amber-400/70 via-orange-400/60 to-rose-400/60",
    slate: "from-slate-400/70 via-sky-400/60 to-slate-300/60",
    rose: "from-rose-400/70 via-fuchsia-400/60 to-amber-400/60",
  };

  return (
    <section
      className={[
        "group relative rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-soft overflow-hidden",
        "transition will-change-transform",
        "hover:-translate-y-0.5 hover:shadow-lg",
        "focus-within:ring-2 focus-within:ring-brand-500",
        className,
      ].join(" ")}
      aria-label={ariaLabel || title}
    >
      {/* viền gradient mảnh phía trên */}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${toneMap[tone]}`}
      />

      {(title || action) && (
        <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-[2px] flex items-center justify-between px-5 py-3 border-b border-slate-200">
          <h3 className="font-extrabold text-slate-800 tracking-tight">
            {title}
          </h3>
          {action}
        </header>
      )}

      <div className="p-3 pt-1 pb-3 flex-1 min-h-0 overflow-auto scrollbar-none">
        {children}
      </div>

      {footer && (
        <footer className="px-4 py-3 border-t border-slate-200 flex flex-wrap gap-2">
          {footer}
        </footer>
      )}

      {/* halo glow khi hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute -inset-8 opacity-0 rounded-[30px] bg-[radial-gradient(80%_50%_at_50%_0%,rgba(14,165,233,0.08),rgba(14,165,233,0))] transition-opacity duration-300 group-hover:opacity-100"
      />
    </section>
  );
}

/* ---------- Badge ---------- */
export function Badge({ children, tone = "info" }) {
  const map = {
    info: "bg-sky-50 text-sky-700 ring-sky-200",
    ok: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-700 ring-amber-200",
    danger: "bg-rose-50 text-rose-700 ring-rose-200",
    neutral: "bg-slate-100 text-slate-700 ring-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${map[tone]}`}
    >
      {children}
    </span>
  );
}

/* ---------- Empty ---------- */
export function Empty({
  title = "Chưa có dữ liệu",
  subtitle = "Hãy thử thay đổi bộ lọc hoặc quay lại sau.",
  icon = "📭",
}) {
  return (
    <div role="status" className="grid place-items-center text-center py-10">
      <div className="text-4xl">{icon}</div>
      <div className="mt-1 font-bold">{title}</div>
      <div className="text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

/* ---------- Loader ---------- */
export function Loader({ label = "Đang tải..." }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 text-slate-600 p-4"
    >
      <i className="w-3 h-3 rounded-full bg-sky-500 animate-pulse" />
      <span>{label}</span>
    </div>
  );
}

/* ---------- Error ---------- */
export function ErrorState({ message = "Có lỗi xảy ra. Vui lòng thử lại." }) {
  return (
    <div
      role="alert"
      className="rounded-xl p-3 ring-1 ring-rose-200 bg-rose-50 text-rose-700"
    >
      {message}
    </div>
  );
}

/* ---------- FadeIn tiện dụng ---------- */
export const FadeIn = ({ children, delay = 0, className = "" }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.28, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ---------- Stagger container & item cho list ---------- */
export const Stagger = ({ children, delay = 0, className = "" }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show: { transition: { staggerChildren: 0.03, delayChildren: delay } },
    }}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children }) => (
  <motion.div
    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
  >
    {children}
  </motion.div>
);
