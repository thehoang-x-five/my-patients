// src/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ReportToolbar from "../components/reports/ReportToolbar.jsx";
import KpiCard from "../components/reports/KpiCard.jsx";
import OverviewChart from "../components/reports/OverviewChart.jsx";
import ReportsTable from "../components/reports/ReportsTable.jsx";
import ClinicalAnalytics from "../components/reports/ClinicalAnalytics.jsx";

import { useReportsOverview } from "../api/reports.js";
import { useAuthStore } from "../components/stores/appStore.js";
import {
  canViewRevenueReport,
  canViewVisitReport,
  canViewStaffReport,
  isAdmin,
  hasGlobalScope,
  getScopeLabel,
} from "../utils/permissions.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const VND = (n) => `₫ ${Number(n || 0).toLocaleString("vi-VN")}`;

const EMPTY_KPI = {
  revenue: { value: 0, trend: 0, spark: [] },
  newPatients: { value: 0, trend: 0, spark: [] },
  revisits: { value: 0, trend: 0, spark: [] },
  cancelRate: { value: 0, trend: 0, spark: [] },
};

export default function Reports() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  // ✅ RBAC: Permission checks
  const user = useAuthStore((s) => s.user);
  const showRevenue = canViewRevenueReport(user);
  const showVisit = canViewVisitReport(user);
  const scopeLabel = !hasGlobalScope(user) ? getScopeLabel(user) : null;

  const [period, setPeriod] = useState("mtd");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState("overview"); // để sẵn nếu sau này cần
  const [view, setView] = useState("chart");
  const [loadingView, setLoadingView] = useState(false);

  const queryParams = useMemo(
    () => ({
      period,
      from: from || undefined,
      to: to || undefined,
    }),
    [period, from, to]
  );

  const { data, isLoading, error } = useReportsOverview(queryParams);

  const kpi = data?.kpi || EMPTY_KPI;
  const rows = Array.isArray(data?.rows) ? data.rows : [];

  const sparkRev = kpi.revenue.spark || [];
  const sparkNew = kpi.newPatients.spark || [];
  const sparkRevisit = kpi.revisits.spark || [];
  const sparkCancel = kpi.cancelRate.spark || [];

  function onExport() {
    if (!rows.length) return;

    const header =
      "Date,Revenue,NewPatients,Revisits,CancelRate(%)\n";
    const body = rows
      .map((r) =>
        [
          r.date,
          r.revenue,
          r.newPatients,
          r.revisits,
          r.cancelRate,
        ].join(",")
      )
      .join("\n");

    const blob = new Blob([header + body], {
      type: "text/csv;charset=utf-8;",
    });
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
    setLoadingView(true);
    const t = setTimeout(() => setLoadingView(false), 150);
    return () => clearTimeout(t);
  }, [period, from, to, tab, view, isLoading]);

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


        <AnimatePresence mode="wait">
          {tab === "analytics" ? (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mt-2.5 flex-1 min-h-0 p-1 overflow-y-auto scrollbar-none"
            >
              <ClinicalAnalytics period={period} from={from} to={to} />
            </motion.div>
          ) : (
            <>
              {/* KPI rail – đồng bộ tone đỏ nhẹ + nâu nhẹ */}
              {/* Scope badge — hiện phạm vi dữ liệu cho user non-global */}
              {scopeLabel && (
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/70 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-600/40">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none">
                      <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {scopeLabel}
                  </span>
                </div>
              )}
              <section className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {showRevenue && (
                <KpiCard
                  title="Doanh thu"
                  value={kpi.revenue.value}
                  trend={kpi.revenue.trend}
                  data={sparkRev}
                  color="#b91c1c"
                  formatter={VND}
                />
                )}
                <KpiCard
                  title="Bệnh nhân mới"
                  value={kpi.newPatients.value}
                  trend={kpi.newPatients.trend}
                  data={sparkNew}
                  color="#0ea5e9"
                />
                <KpiCard
                  title="Tái khám"
                  value={kpi.revisits.value}
                  trend={kpi.revisits.trend}
                  data={sparkRevisit}
                  color="#c2410c"
                />
                <KpiCard
                  title="Tỷ lệ huỷ (%)"
                  value={kpi.cancelRate.value}
                  trend={kpi.cancelRate.trend}
                  data={sparkCancel}
                  color="#fb7185"
                />
              </section>

              {/* Content */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`overview-${view}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-2.5 flex-1 min-h-0 p-1 overflow-hidden"
                >
                  {isLoading || loadingView ? (
                    <section className="rounded-2xl bg-white ring-1 ring-slate-200/80 p-3 h-full">
                      <div className="skel h-full" />
                    </section>
                  ) : view === "chart" ? (
                    <OverviewChart rows={rows} stretch />
                  ) : (
                    <ReportsTable rows={rows} stretch />
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.main>
  );
}
