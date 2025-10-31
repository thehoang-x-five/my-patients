import { motion } from "framer-motion";
import React from 'react';
import {
  Bar,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ComposedChart,
} from "recharts";

const fmtVN = (iso) =>
  new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });

export default function OverviewChart({ rows = [], stretch = false }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 ${
        stretch ? "h-full flex flex-col min-h-0" : ""
      }`}
      role="region"
      aria-label="Biểu đồ tổng quan"
    >
      <div className="mb-2 font-extrabold shrink-0">Biểu đồ tổng quan</div>

      <div
        className={stretch ? "flex-1 min-h-0" : "h-[clamp(260px,40svh,420px)]"}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ left: 8, right: 8, top: 8, bottom: 0 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              type="category"
              tick={{ fontSize: 12 }}
              tickFormatter={fmtVN}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 12 }}
              tickFormatter={(v) => (v >= 1e9 ? `${v / 1e9}B` : `${v / 1e6}M`)}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 12 }}
              domain={[0, "auto"]}
              axisLine={{ stroke: "#e5e7eb" }}
            />
            <Tooltip
              labelFormatter={(_, payload) =>
                payload?.length ? `Ngày ${fmtVN(payload[0].payload.date)}` : ""
              }
              formatter={(v, n) =>
                n === "Doanh thu" ? `${Number(v).toLocaleString("vi-VN")} đ` : v
              }
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                boxShadow: "0 6px 16px rgba(2,6,23,0.08)",
                padding: "6px 10px",
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="revenue"
              name="Doanh thu"
              fill="#6366f1"
              radius={[6, 6, 0, 0]}
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              dataKey="orders"
              name="Bệnh nhân mới"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              type="monotone"
              isAnimationActive={false}
            />
            <Line
              yAxisId="right"
              dataKey="cancelRate"
              name="Tỷ lệ huỷ (%)"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              type="monotone"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </motion.section>
  );
}
