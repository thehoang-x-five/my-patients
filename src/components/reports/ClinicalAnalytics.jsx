// src/components/reports/ClinicalAnalytics.jsx
// Tab "Phân tích Y khoa" — MongoDB Aggregation visualization
// Tone: Teal/Cyan — đồng bộ với Reports (cyan) nhưng dùng teal nhấn mạnh
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  AreaChart, Area,
} from "recharts";

import {
  useTopDiseases,
  useTopDrugs,
  useVitalAnomalies,
} from "../../api/analytics.js";

/* ===================== CONSTANTS ===================== */

const PERIOD_OPTS = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "90d", label: "3 tháng" },
  { value: "1y", label: "1 năm" },
];

const COLORS = [
  "#0d9488", "#14b8a6", "#2dd4bf", "#5eead4",
  "#06b6d4", "#22d3ee", "#67e8f9",
  "#0891b2", "#0e7490", "#155e75",
];

const PIE_COLORS = [
  "#0d9488", "#f59e0b", "#ef4444", "#8b5cf6",
  "#06b6d4", "#ec4899", "#10b981",
];

/* ===================== CHART TOOLTIP ===================== */
function formatAnalyticsLabel(value = "") {
  const text = String(value || "").trim();
  if (!text) return "Không xác định";
  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/^./, (ch) => ch.toLocaleUpperCase("vi-VN"));
}

function compactLabel(value = "", max = 26) {
  const text = formatAnalyticsLabel(value);
  return text.length > max ? `${text.slice(0, max - 1)}...` : text;
}

function DiseaseAxisTick({ x, y, payload }) {
  const label = formatAnalyticsLabel(payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text
        x={-10}
        y={0}
        dy={4}
        textAnchor="end"
        className="fill-slate-600 text-[11px]"
      >
        {compactLabel(label, 24)}
      </text>
    </g>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        boxShadow: "0 6px 16px rgba(2,6,23,0.08)",
        padding: "8px 12px",
        background: "#fff",
      }}
    >
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-semibold tabular-nums" style={{ color: p.color }}>
          {p.name}: {typeof p.value === "number" ? p.value.toLocaleString("vi-VN") : p.value}
        </p>
      ))}
    </div>
  );
}

/* ===================== SECTION CARD ===================== */
function SectionCard({ title, icon, children, className = "" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`rounded-2xl bg-white ring-1 ring-slate-200/80 shadow-soft p-4 flex flex-col ${className}`}
    >
      <div className="flex items-center gap-2 mb-3 shrink-0">
        <span className="text-lg">{icon}</span>
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 relative">
        {children}
      </div>
    </motion.article>
  );
}

/* ===================== EMPTY/LOADING STATE ===================== */
function ChartPlaceholder({ loading, message = "Chưa có dữ liệu" }) {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px] text-slate-400 text-sm">
      {loading ? (
        <div className="inline-flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-teal-300 border-t-transparent rounded-full animate-spin" />
          Đang tải…
        </div>
      ) : (
        <div className="text-center">
          <p className="text-2xl mb-1">📊</p>
          <p>{message}</p>
          <p className="text-xs mt-1 text-slate-300">Biểu đồ sẽ hiện khi có dữ liệu phù hợp trong khoảng lọc</p>
        </div>
      )}
    </div>
  );
}

/* ===================== MAIN COMPONENT ===================== */
export default function ClinicalAnalytics({ period, from, to }) {
  const params = { period, from, to };

  const { data: diseases, isLoading: loadDiseases } = useTopDiseases(params);
  const { data: drugs, isLoading: loadDrugs } = useTopDrugs(params);
  const { data: vitals, isLoading: loadVitals } = useVitalAnomalies(params);

  // Normalize data arrays (BE might return objects or arrays)
  const diseaseItems = Array.isArray(diseases) ? diseases : diseases?.items || [];
  const drugItems = Array.isArray(drugs) ? drugs : drugs?.items || [];
  const vitalItems = Array.isArray(vitals) ? vitals : vitals?.items || [];
  const vitalSummary = useMemo(
    () =>
      vitalItems
        .map((item) => {
          const details = item.details ?? item.Details ?? [];
          const displayDetails = Array.isArray(details)
            ? details.map(formatAnalyticsLabel).filter(Boolean)
            : [];
          return {
            name: formatAnalyticsLabel(
              item.name ?? item.date ?? item.TestType ?? item.testType
            ),
            count: Number(item.count ?? item.Count ?? 0) || 0,
            percentage: Number(item.percentage ?? item.Percentage ?? 0) || 0,
            details: displayDetails,
          };
        })
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count),
    [vitalItems]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Charts Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
        {/* === Top Bệnh lý phổ biến === */}
        <SectionCard title="Bệnh lý phổ biến (Top ICD-10)" icon="🏥" className="lg:col-span-1">
          {loadDiseases || !diseaseItems.length ? (
            <ChartPlaceholder loading={loadDiseases} message="Chưa có dữ liệu bệnh lý" />
          ) : (
            <div className="w-full h-full min-h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={diseaseItems} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={<DiseaseAxisTick />}
                    tickLine={false}
                    axisLine={{ stroke: "#cbd5e1" }}
                    width={150}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="count" name="Số ca" barSize={18} radius={[0, 6, 6, 0]}>
                    {diseaseItems.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* === Top Thuốc kê nhiều === */}
        <SectionCard title="Thuốc được kê nhiều nhất" icon="💊" className="lg:col-span-1">
          {loadDrugs || !drugItems.length ? (
            <ChartPlaceholder loading={loadDrugs} message="Chưa có dữ liệu thuốc" />
          ) : (
            <div className="w-full h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={drugItems}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                    labelLine={{ stroke: "#cbd5e1" }}
                  >
                    {drugItems.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 11, color: "#64748b" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* === Sinh hiệu bất thường === */}
        <SectionCard title="Tần suất sinh hiệu bất thường" icon="📈" className="lg:col-span-2">
          {loadVitals || !vitalItems.length ? (
            <ChartPlaceholder loading={loadVitals} message="Chưa có dữ liệu sinh hiệu" />
          ) : (
            <div className="flex h-full min-h-[260px] flex-col gap-3">
              <div className="min-h-[180px] flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={vitalItems} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
                  <defs>
                    <linearGradient id="gVital" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0d9488" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Bất thường"
                    stroke="#0d9488"
                    fill="url(#gVital)"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#0d9488" }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: "#fff" }}
                  />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {vitalSummary.map((item, index) => (
                  <div
                    key={`${item.name}-${index}`}
                    className="rounded-lg border border-teal-100 bg-teal-50/70 px-3 py-2"
                    title={item.name}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-xs font-semibold text-slate-700">
                        {item.name}
                      </p>
                      <p className="shrink-0 text-sm font-bold tabular-nums text-teal-700">
                        {item.count.toLocaleString("vi-VN")} ca
                      </p>
                    </div>
                    {item.details.length ? (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {item.details.slice(0, 3).map((detail) => (
                          <span
                            key={detail}
                            className="max-w-full truncate rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 ring-1 ring-teal-100"
                            title={detail}
                          >
                            {detail}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
