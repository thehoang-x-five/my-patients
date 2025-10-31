import React from 'react';
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReportToolbar from "../components/reports/ReportToolbar.jsx";
import KpiCard from "../components/reports/KpiCard.jsx";
import OverviewChart from "../components/reports/OverviewChart.jsx";
import ReportsTable from "../components/reports/ReportsTable.jsx";
import { buildSeries, filterByPeriod, calcKpi } from "../data/reports.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const VND = (n) => `₫ ${Number(n || 0).toLocaleString("vi-VN")}`;

export default function Reports() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const [raw] = useState(() => buildSeries(90));
  const [period, setPeriod] = useState("mtd");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState("overview");
  const [view, setView] = useState("chart");
  const [loading, setLoading] = useState(false);

  const rows = useMemo(() => {
    let r = filterByPeriod(raw, period);
    if (from) r = r.filter((x) => new Date(x.date) >= new Date(from));
    if (to) r = r.filter((x) => new Date(x.date) <= new Date(to));
    return r;
  }, [raw, period, from, to]);

  const kpi = useMemo(() => calcKpi(rows), [rows]);

  const sparkRev = rows.map((r) => ({
    value: r.revenue,
    date: r.date,
    label: r.label,
  }));
  const sparkOrders = rows.map((r) => ({
    value: r.newPatients ?? r.orders,
    date: r.date,
    label: r.label,
  }));
  const sparkRevisit = rows.map((r) => ({
    value: r.revisits,
    date: r.date,
    label: r.label,
  }));
  const sparkCancel = rows.map((r) => ({
    value: r.cancelRate,
    date: r.date,
    label: r.label,
  }));

  function onExport() {
    const header = "Date,Revenue,Orders,Revisits,CancelRate(%)\n";
    const body = rows
      .map((r) =>
        [r.date, r.revenue, r.orders, r.revisits, r.cancelRate].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function onReset() {
    setFrom("");
    setTo("");
    setPeriod("mtd");
  }

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 150);
    return () => clearTimeout(t);
  }, [period, from, to, tab, view]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-0.5 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Báo cáo"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+5px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <ReportToolbar
          period={period}
          setPeriod={setPeriod}
          from={from}
          setFrom={setFrom}
          to={to}
          setTo={setTo}
          tab={tab}
          setTab={setTab}
          view={view}
          setView={setView}
          onExport={onExport}
          onReset={onReset}
        />

        {/* KPI rail */}
        <section className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 ">
          <KpiCard
            title="Doanh thu"
            value={kpi.revenue}
            trend={7}
            data={sparkRev}
            color="#16a34a"
            formatter={VND}
          />
          <KpiCard
            title="Bệnh nhân mới"
            value={kpi.newPatients}
            trend={3}
            data={sparkOrders}
            color="#0ea5e9"
          />
          <KpiCard
            title="Tái khám"
            value={kpi.revisits}
            trend={1}
            data={sparkRevisit}
            color="#f59e0b"
          />
          <KpiCard
            title="Tỷ lệ huỷ (%)"
            value={kpi.cancel}
            trend={-2}
            data={sparkCancel}
            color="#ef4444"
          />
        </section>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${tab}-${view}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2.5 flex-1 min-h-0 p-1 overflow-hidden"
          >
            {loading ? (
              <section className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-3  h-full">
                <div className="skel h-full" />
              </section>
            ) : view === "chart" ? (
              <OverviewChart rows={rows} stretch />
            ) : (
              <ReportsTable rows={rows} stretch />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
