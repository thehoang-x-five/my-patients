import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ReportToolbar from "../components/reports/ReportToolbar.jsx";
import KpiCard from "../components/reports/KpiCard.jsx";
import OverviewChart from "../components/reports/OverviewChart.jsx";
import ReportsTable from "../components/reports/ReportsTable.jsx";
import ClinicalAnalytics from "../components/reports/ClinicalAnalytics.jsx";

import { useReportsOverview } from "../api/reports.js";
import { useAuthStore } from "../components/stores/appStore.js";
import { canViewRevenueReport } from "../utils/permissions.js";
import { toLocalYmd } from "../utils/dateLocal.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

const VND = (n) => `₫ ${Number(n || 0).toLocaleString("vi-VN")}`;

const EMPTY_KPI = {
  revenue: { value: 0, trend: 0, spark: [] },
  checkedIn: { value: 0, trend: 0, spark: [] },
  newPatients: { value: 0, trend: 0, spark: [] },
  revisits: { value: 0, trend: 0, spark: [] },
  cancelRate: { value: 0, trend: 0, spark: [] },
};

export default function Reports() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const user = useAuthStore((s) => s.user);
  const canSeeRevenueByRole = canViewRevenueReport(user);

  const [period, setPeriod] = useState("mtd");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [tab, setTab] = useState("overview");
  const [view, setView] = useState("chart");
  const [loadingView, setLoadingView] = useState(false);

  const queryParams = useMemo(
    () => ({
      period,
      from: from || undefined,
      to: to || undefined,
      viewerKey: `${user?.VaiTro || user?.vaiTro || ""}:${user?.LoaiYTa || user?.loaiYTa || user?.loai_y_ta || ""}`,
    }),
    [period, from, to, user]
  );

  const { data, isLoading } = useReportsOverview(queryParams);

  const kpi = data?.kpi || EMPTY_KPI;
  const rows = Array.isArray(data?.rows) ? data.rows : [];
  const showRevenue = canSeeRevenueByRole && data?.canViewRevenue !== false;

  const sparkRev = kpi.revenue.spark || [];
  const sparkCheckedIn = kpi.checkedIn.spark || [];
  const sparkNew = kpi.newPatients.spark || [];
  const sparkRevisit = kpi.revisits.spark || [];
  const sparkCancel = kpi.cancelRate.spark || [];

  function onExport() {
    if (!rows.length) return;

    const header = showRevenue
      ? "Date,Revenue,NewPatients,Revisits,CancelRate(%)\n"
      : "Date,NewPatients,Revisits,CancelRate(%)\n";
    const body = rows
      .map((r) =>
        (
          showRevenue
            ? [r.date, r.revenue, r.newPatients, r.revisits, r.cancelRate]
            : [r.date, r.newPatients, r.revisits, r.cancelRate]
        ).join(",")
      )
      .join("\n");

    const blob = new Blob([header + body], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${toLocalYmd(new Date())}.csv`;
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
      className="min-h-0 overflow-hidden px-4 pb-0.5 pt-1"
      role="main"
      aria-label="Báo cáo"
    >
      <div
        className="mt-2 flex h-[calc(var(--app-dvh)-var(--topbar-h)+5px)] min-h-0 flex-col"
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
              className="mt-2.5 flex-1 min-h-0 overflow-y-auto p-1 scrollbar-none"
            >
              <ClinicalAnalytics period={period} from={from} to={to} />
            </motion.div>
          ) : (
            <>
              <section className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {showRevenue ? (
                  <KpiCard
                    title="Doanh thu"
                    value={kpi.revenue.value}
                    trend={kpi.revenue.trend}
                    data={sparkRev}
                    color="#b91c1c"
                    formatter={VND}
                  />
                ) : (
                  <KpiCard
                    title="Bệnh nhân đã check-in"
                    value={kpi.checkedIn.value}
                    trend={kpi.checkedIn.trend}
                    data={sparkCheckedIn}
                    color="#0f766e"
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
                  title="Tỷ lệ hủy (%)"
                  value={kpi.cancelRate.value}
                  trend={kpi.cancelRate.trend}
                  data={sparkCancel}
                  color="#fb7185"
                />
              </section>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`overview-${view}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="mt-2.5 flex-1 min-h-0 overflow-hidden p-1"
                >
                  {isLoading || loadingView ? (
                    <section className="h-full rounded-2xl bg-white p-3 ring-1 ring-slate-200/80">
                      <div className="skel h-full" />
                    </section>
                  ) : view === "chart" ? (
                    <OverviewChart rows={rows} stretch showRevenue={showRevenue} />
                  ) : (
                    <ReportsTable rows={rows} stretch showRevenue={showRevenue} />
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
