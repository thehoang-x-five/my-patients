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
  hasGlobalScope,
  isAdmin,
  isClinicalNurse,
  isClsNurse,
  isDoctor,
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

  const roleGroup = useMemo(() => {
    if (isAdmin(user)) return "admin";
    if (isDoctor(user) || isClinicalNurse(user)) return "clinical";
    if (isTechnician(user) || isClsNurse(user)) return "cls";
    if (isReceptionNurse(user)) return "reception";
    return "default";
  }, [user]);

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

  const maKhoa = useMemo(() => {
    if (hasGlobalScope(user)) return null;
    return user?.MaKhoa || user?.maKhoa || user?.ma_khoa || null;
  }, [user]);

  const { data, isLoading, error } = useDashboardToday(maKhoa);

  const kpi = data?.kpi || {
    patientsToday: { value: "0", delta: null, meta: null, spark: [] },
    lsPatients: { value: "0", delta: null, meta: null, spark: [] },
    clsPatients: { value: "0", delta: null, meta: null, spark: [] },
    appointments: { value: "0", delta: null, meta: null, spark: [] },
    revenue: { value: "0", delta: null, meta: null, spark: [] },
    exams: { value: "0", delta: null, meta: null, spark: [] },
    lsExams: { value: "0", delta: null, meta: null, spark: [] },
    clsExams: { value: "0", delta: null, meta: null, spark: [] },
    diagnoses: { value: "0", delta: null, meta: null, spark: [] },
    results: { value: "0", delta: null, meta: null, spark: [] },
  };

  const upcomingAppointments = data?.upcomingAppointments || [];
  const upcomingServices = data?.upcomingServices || [];
  const trendingServices = data?.trendingServices || [];
  const services = data?.services || {
    value: "0",
    delta: null,
    meta: null,
    spark: [],
  };
  const activities = data?.activities || [];

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
      className="min-h-0 overflow-hidden px-4 pb-2.5 pt-1"
      role="main"
      aria-label="Tổng quan trong ngày"
    >
      <div
        className="mt-2 flex h-[calc(var(--app-dvh)-var(--topbar-h)+1px)] min-h-0 flex-col"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <div className="flex-none">
          <KpiRail kpi={kpi} role={roleGroup} services={services} />
        </div>

        <div className="mt-1.5 flex-1 min-h-0 overflow-hidden">
          <section
            className="
              grid items-stretch content-stretch gap-2 overflow-y-auto scrollbar-none
              py-0 pb-0.5 pt-1.5 h-full md:grid-cols-12
            "
          >
            <div className="min-w-0 h-full p-1 pb-0 md:col-span-6">
              {renderLeftCard()}
            </div>

            <div className="min-w-0 h-full p-1 pb-0 md:col-span-6">
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
