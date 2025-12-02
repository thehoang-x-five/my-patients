import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import React from "react";

export default function KpiCard({
  title,
  value,
  trend = 0,
  data = [],
  color = "#22d3ee", // cyan mặc định
  formatter,
}) {
  const trendCls =
    trend > 0
      ? "text-cyan-600"
      : trend < 0
      ? "text-rose-500"
      : "text-slate-500";

  const display = typeof formatter === "function" ? formatter(value) : value;
  const gid = `g-${String(title).replace(/\W+/g, "").toLowerCase()}`;

  const Tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload || {};
    const day = p.date || p.label || p.name;
    const n = p.value;
    const dateStr = day
      ? /^\d{4}-\d{2}-\d{2}/.test(String(day))
        ? new Date(day).toLocaleDateString("vi-VN")
        : String(day)
      : title;

    return (
      <div
        style={{
          borderRadius: 10,
          border: "1px solid #e2e8f0",
          boxShadow: "0 6px 16px rgba(2,6,23,0.08)",
          padding: "6px 8px",
          background: "#fff",
        }}
      >
        <div className="text-xs text-slate-500">{dateStr}</div>
        <div className="font-semibold tabular-nums">
          {typeof n === "number" ? n.toLocaleString("vi-VN") : n}
        </div>
      </div>
    );
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 shadow-soft"
      aria-label={`Chỉ số ${title}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-slate-500">{title}</span>
        <span className={`text-xs font-bold ${trendCls}`}>
          {trend > 0 ? `▲ +${trend}%` : trend < 0 ? `▼ ${trend}%` : "–"}
        </span>
      </div>

      <div className="text-2xl font-black mt-1 tabular-nums">{display}</div>

      <div className="h-10 mt-2 rounded-md bg-cyan-50/60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
              </linearGradient>
            </defs>

            <Tooltip
              cursor={{ stroke: "rgba(2,6,23,0.08)" }}
              content={<Tip />}
            />

            <Area
              dataKey="value"
              type="monotone"
              stroke={color}
              fill={`url(#${gid})`}
              strokeWidth={2}
              isAnimationActive
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.article>
  );
}
