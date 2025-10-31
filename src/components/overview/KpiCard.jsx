import React from 'react';
import { memo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, Tooltip } from "recharts";
import { Badge } from "../ui/Supports.jsx";

function KpiCard({
  title,
  value,
  delta, // "+12%" | "-4%"
  deltaTone, // "ok" | "warn" | "danger" | "info" | "neutral"
  meta,
  data24 = [],
  barColor = "#38bdf8",
  link, // { href, label }
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="relative rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 shadow-soft overflow-hidden"
      role="group"
      aria-label={`KPI ${title}`}
    >
      {/* đường top accent nhạt */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 via-emerald-300 to-fuchsia-300"
      />

      <div className="flex items-center justify-between">
        <span className="text-slate-600">{title}</span>
        {delta ? <Badge tone={deltaTone || "neutral"}>{delta}</Badge> : null}
      </div>

      <div className="mt-1 text-2xl font-black tabular-nums">{value}</div>
      {meta ? (
        <div className="text-sm text-slate-500 mt-0.5">{meta}</div>
      ) : null}

      {/* spark 24h */}
      <div className="mt-2 h-16 rounded-md bg-slate-50 relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data24}
            margin={{ left: 4, right: 4, top: 6, bottom: 0 }}
          >
            <Tooltip
              cursor={{ fill: "rgba(2,6,23,.06)" }}
              labelFormatter={(l, p) => `Giờ ${p?.[0]?.payload?.hour || l}`}
              formatter={(v) => [v, "Giá trị"]}
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                boxShadow: "0 8px 24px rgba(2,6,23,.08)",
              }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={barColor} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {link?.href && (
        <a
          href={link.href}
          className="mt-2 inline-flex items-center gap-1 text-sm text-sky-700 hover:text-sky-500 underline underline-offset-2"
        >
          {link.label || "Xem chi tiết"} →
        </a>
      )}
    </motion.article>
  );
}

export default memo(KpiCard);
