import React, { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

import KpiRail from "../components/overview/KpiRail.jsx";
import AppointmentsCard from "../components/overview/AppointmentsCard.jsx";
import UpcomingServicesCard from "../components/overview/UpcomingServicesCard.jsx";
import TrendingServicesCard from "../components/overview/TrendingServicesCard.jsx";
import ActivityCard from "../components/overview/ActivityCard.jsx";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import {
  useDashboardToday,
  subscribeDashboard,
} from "../api/dashboard.js";
import { useAuthStore } from "../components/stores/appStore.js";
import {
  isAdmin,
  isDoctor,
  isClinicalNurse,
  isClsNurse,
  isReceptionNurse,
  isTechnician,
} from "../utils/permissions.js";

export default function Overview() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // Detect role group
  const roleGroup = useMemo(() => {
    if (isAdmin(user)) return "admin";
    if (isDoctor(user) || isClinicalNurse(user)) return "clinical";
    if (isTechnician(user) || isClsNurse(user)) return "cls";
    if (isReceptionNurse(user)) return "reception";
    return "default";
  }, [user]);

  // Realtime
  useEffect(() => {
    let off;
    (async () => {
      try {
        off = await subscribeDashboard(queryClient);
      } catch (err) {
        if (import.meta?.env?.DEV) {
          console.error("[Dashboard] subscribe realtime failed", err);
        }
      }
    })();
    return () => {
      if (typeof off === "function") off();
    };
  }, [queryClient]);

  const { data, isLoading, error } = useDashboardToday();

  const kpi = data?.kpi || {
    patientsToday: { value: "0", delta: null, meta: null, spark: [] },
    appointments: { value: "0", delta: null, meta: null, spark: [] },
    revenue: { value: "0", delta: null, meta: null, spark: [] },
    exams: { value: "0", delta: null, meta: null, spark: [] },
  };

  const upcomingAppointments = data?.upcomingAppointments || [];
  const upcomingServices = data?.upcomingServices || [];
  const trendingServices = data?.trendingServices || [];
  const services = data?.services || { value: "0", delta: null, meta: null, spark: [] };
  const activities = data?.activities || [];

  // Left card: depends on role
  const renderLeftCard = () => {
    const errMsg = error ? error.message : null;

    if (roleGroup === "cls") {
      return (
        <UpcomingServicesCard
          rows={upcomingServices}
          loading={isLoading}
          error={errMsg}
          maxBodyClass="max-h-none overflow-y-auto pr-1 scrollbar-none"
        />
      );
    }

    if (roleGroup === "admin" || roleGroup === "reception") {
      return (
        <TrendingServicesCard
          rows={trendingServices}
          loading={isLoading}
          error={errMsg}
          maxBodyClass="max-h-none overflow-y-auto pr-1 scrollbar-none"
        />
      );
    }

    // clinical / default
    return (
      <AppointmentsCard
        rows={upcomingAppointments}
        loading={isLoading}
        error={errMsg}
        maxBodyClass="max-h-none overflow-y-auto pr-1 scrollbar-none"
      />
    );
  };

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
          <KpiRail kpi={kpi} role={roleGroup} services={services} />
        </div>

        {/* Vùng bên dưới: Left card + Activities */}
        <div className="mt-1.5 flex-1 min-h-0 overflow-hidden">
          <section
            className="
              pb-0.5 pt-1.5 h-full py-0 overflow-y-auto scrollbar-none
              grid gap-2 items-stretch md:grid-cols-12 content-stretch
            "
          >
            {/* Left card — role-specific */}
            <div className="p-1 pb-0 md:col-span-6 min-w-0 h-full">
              {renderLeftCard()}
            </div>

            {/* Hoạt động gần đây — shared */}
            <div className="p-1 pb-0 md:col-span-6 min-w-0 h-full">
              <ActivityCard
                items={activities}
                loading={isLoading}
                error={error ? error.message : null}
                maxBodyClass="max-h-none overflow-y-auto pr-1 scrollbar-none"
              />
            </div>
          </section>
        </div>
      </div>
    </motion.main>
  );
}
