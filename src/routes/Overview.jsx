import React from 'react';
import { motion } from "framer-motion";
import KpiRail from "../components/overview/KpiRail.jsx";
import AppointmentsCard from "../components/overview/AppointmentsCard.jsx";
import WorkBoardCard from "../components/overview/WorkBoardCard.jsx";
import AlertsCard from "../components/overview/AlertsCard.jsx";
import ActivityCard from "../components/overview/ActivityCard.jsx";
import {
  kpi,
  upcomingAppointments,
  scheduleTasks, // dùng dữ liệu cũ nhưng render bằng WorkBoardCard mới
  alerts,
  activities,
} from "../data/overview.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
export default function Overview() {
    useViewportVH();
    const isMobile = useMediaQuery("(max-width: 640px)");
    const isTablet = useMediaQuery("(max-width: 1024px)");
    const topbar = isMobile ? 64 : isTablet ? 72 : 80;
  
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
        <div className="flex-none">
          <KpiRail kpi={kpi} />
        </div>
        <div className="mt-2  flex-1 min-h-0 overflow-hidden">
      <section
        className="
          pb-0.5 pt-1.5 h-full py-0 overflow-y-auto scrollbar-none grid gap-3 items-start
          md:grid-cols-12 grid-rows-[auto_auto] content-start
        "

        
      >
        {/* Hàng 1 */}
        <div className="md:col-span-6 min-w-0">
          {/* Chiều cao cố định + cuộn bên trong để bố cục không vỡ */}
          <AppointmentsCard
            rows={upcomingAppointments}
          />
        </div>
        <div className="md:col-span-6 min-w-0">
          <WorkBoardCard
            upcoming={(scheduleTasks?.timeline || []).slice(0, 8)}
            todos={(scheduleTasks?.todos || []).slice(0, 8)}
            minH="min-h-[340px]"
          />
        </div>

        {/* Hàng 2 */}
        <div className="md:col-span-6 min-w-0 ">
          <AlertsCard alerts={(alerts || []).slice(0, 5)} />
        </div>
        <div className="md:col-span-6 min-w-0">
          <ActivityCard items={(activities || []).slice(0, 5)} />
        </div>
      </section>
      </div>
      </div>
    </motion.main>
  );
}
