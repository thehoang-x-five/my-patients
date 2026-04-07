import React from 'react';
import { memo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, BarChart, Bar, Tooltip } from "recharts";
import { Badge } from "../ui/Supports.jsx";

function SparkTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload || {};
  const hour = point.hour ?? label ?? 0;
  const value = Number(payload[0]?.value ?? point.value ?? 0);

  return (
    <div
      className="rounded-xl border border-slate-200 bg-white/95 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
    >
      <div className="text-slate-500">{`Giờ ${hour}`}</div>
      <div className="font-semibold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}

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
  const deltaLabel = delta ?? "0.0%";
  const valueLabel = value ?? "0";
  const sparkData =
    Array.isArray(data24) && data24.length > 0
      ? data24
      : Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }} // giữ hiệu ứng card như ban đầu
      className="relative h-full flex flex-col rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 shadow-soft overflow-hidden"
      role="group"
      aria-label={`KPI ${title}`}
    >
      {/* đường top accent nhạt */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-sky-300 via-emerald-300 to-fuchsia-300"
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-600 truncate">{title}</span>
        <Badge tone={deltaTone || "neutral"}>{deltaLabel}</Badge>
      </div>

      <div className="mt-1">
        <div className="text-2xl font-bold tabular-nums">{valueLabel}</div>
        {meta ? (
          <div className="text-xs text-slate-500 mt-0.5 truncate">
            {meta}
          </div>
        ) : null}
      </div>

      {/* spark 24h + link dưới cùng để card cao đều nhau */}
      <div className="mt-2 flex-1 flex flex-col">
        <div className="h-16 rounded-md bg-slate-50 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sparkData}
              margin={{ left: 4, right: 4, top: 6, bottom: 0 }}
            >
              <Tooltip
                content={<SparkTooltip />}
                cursor={{ fill: "rgba(2,6,23,.06)" }}
                labelFormatter={(l, p) => `Giờ ${p?.[0]?.payload?.hour || l}`}
                formatter={(v) => [v, "Giá trị"]}
                contentStyle={{
                  paddingInline: 5,
                  paddingBlock: 4,
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(2,6,23,.08)",
                }}
              />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
                fill={barColor}
                minPointSize={2}
              />
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
      </div>
    </motion.article>
  );
}

export default memo(KpiCard);
