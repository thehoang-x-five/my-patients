import React from "react";
import { motion } from "framer-motion";
import KpiRail from "../components/overview/KpiRail.jsx";
import AppointmentsCard from "../components/overview/AppointmentsCard.jsx";
import ActivityCard from "../components/overview/ActivityCard.jsx";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { useDashboardToday } from "../api/dashboard.js";

export default function Overview() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const { data, isLoading, error } = useDashboardToday();

  const kpi = data?.kpi || {
    patientsToday: { value: "0", delta: null, meta: null, spark: [] },
    appointments: { value: "0", delta: null, meta: null, spark: [] },
    revenue: { value: "0", delta: null, meta: null, spark: [] },
    exams: { value: "0", delta: null, meta: null, spark: [] },
  };

  const upcomingAppointments = data?.upcomingAppointments || [];
  const activities = data?.activities || [];

  return (
    <motion.main
      id="main"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-2.5 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Tổng quan trong ngày"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {/* Dải KPI 4 box */}
        <div className="flex-none">
          <KpiRail kpi={kpi} />
        </div>

        {/* Vùng bên dưới: chỉ còn 2 card, kéo cao full */}
        <div className="mt-2 flex-1 min-h-0 overflow-hidden">
          <section
            className="
              pb-0.5 pt-1.5 h-full py-0 overflow-y-auto scrollbar-none
              grid gap-3 items-stretch md:grid-cols-12 content-stretch
            "
          >
            {/* Lịch hẹn sắp tới (hôm nay) - chiếm nửa trái, cao full */}
            <div className="md:col-span-6 min-w-0 h-full">
              <AppointmentsCard
                rows={upcomingAppointments}
                loading={isLoading}
                error={error ? error.message : null}
                maxBodyClass="max-h-none overflow-y-auto pr-1 scrollbar-none"
              />
            </div>

            {/* Hoạt động gần đây - nửa phải, cao full */}
            <div className="md:col-span-6 min-w-0 h-full">
              {isLoading && !activities.length ? (
                <div className="skel h-36" />
              ) : (
                <ActivityCard items={activities} />
              )}
            </div>
          </section>
        </div>
      </div>
    </motion.main>
  );
}
