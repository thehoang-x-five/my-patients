import { FadeIn } from "../ui/Supports.jsx";
import KpiCard from "./KpiCard.jsx";
import React from 'react';
export default function KpiRail({ kpi }) {
  return (
    <section className="grid grid-cols-4 xl:grid-cols-4 lg:grid-cols-4 sm:grid-cols-2 gap-3 ">
      <FadeIn>
        <KpiCard
          title="Bệnh nhân trong ngày"
          value={kpi.patientsToday.value}
          delta={kpi.patientsToday.delta}
          deltaTone="ok"
          meta={kpi.patientsToday.meta}
          data24={kpi.patientsToday.spark}
          barColor="#10b981"
          link={{ href: "/patients?date=today", label: "Xem danh sách BN" }}
        />
      </FadeIn>
      <FadeIn delay={0.05}>
        <KpiCard
          title="Lịch hẹn hôm nay"
          value={kpi.appointments.value}
          delta={kpi.appointments.delta}
          deltaTone="info"
          meta={kpi.appointments.meta}
          data24={kpi.appointments.spark}
          barColor="#0ea5e9"
          link={{ href: "/appointments?date=today", label: "Quản lý lịch hẹn" }}
        />
      </FadeIn>
      <FadeIn delay={0.1}>
        <KpiCard
          title="Doanh thu hôm nay"
          value={kpi.revenue.value}
          delta={kpi.revenue.delta}
          deltaTone="ok"
          meta={kpi.revenue.meta}
          data24={kpi.revenue.spark}
          barColor="#6366f1"
          link={{ href: "/reports?period=today", label: "Xem báo cáo ngày" }}
        />
      </FadeIn>
      <FadeIn delay={0.15}>
        <KpiCard
          title="Điểm hài lòng (CSAT)"
          value={kpi.satisfaction.value}
          delta={kpi.satisfaction.delta}
          deltaTone="warn"
          meta={kpi.satisfaction.meta}
          data24={kpi.satisfaction.spark}
          barColor="#f59e0b"
          link={{ href: "/chat?date=today", label: "Phản hồi chi tiết" }}
        />
      </FadeIn>
    </section>
  );
}
