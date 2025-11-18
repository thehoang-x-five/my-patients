import React from "react";
import { FadeIn } from "../ui/Supports.jsx";
import KpiCard from "./KpiCard.jsx";

/**
 * Dải 4 KPI trên cùng Dashboard.
 * Dùng grid + items-stretch để các card cao bằng nhau.
 */
export default function KpiRail({ kpi }) {
  const safe = kpi || {};

  return (
    <section
      className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 items-stretch"
      aria-label="Chỉ số chính trong ngày"
    >
      <FadeIn>
        <KpiCard
          title="Bệnh nhân trong ngày"
          value={safe.patientsToday?.value}
          delta={safe.patientsToday?.delta}
          deltaTone="ok"
          meta={safe.patientsToday?.meta}
          data24={safe.patientsToday?.spark}
          barColor="#10b981"
          link={{ href: "/patients?view=today", label: "Xem danh sách" }}
        />
      </FadeIn>

      <FadeIn>
        <KpiCard
          title="Lịch hẹn hôm nay"
          value={safe.appointments?.value}
          delta={safe.appointments?.delta}
          deltaTone="info"
          meta={safe.appointments?.meta}
          data24={safe.appointments?.spark}
          barColor="#0ea5e9"
          link={{
            href: "/appointments?view=today",
            label: "Xem lịch chi tiết",
          }}
        />
      </FadeIn>

      <FadeIn>
        <KpiCard
          title="Lượt khám hôm nay"
          value={safe.exams?.value}
          delta={safe.exams?.delta}
          deltaTone="info"
          meta={safe.exams?.meta}
          data24={safe.exams?.spark}
          barColor="#f97316"
          link={{
            href: "/examination?date=today",
            label: "Xem danh sách khám",
          }}
        />
      </FadeIn>

      <FadeIn>
        <KpiCard
          title="Doanh thu hôm nay"
          value={safe.revenue?.value}
          delta={safe.revenue?.delta}
          deltaTone="ok"
          meta={safe.revenue?.meta}
          data24={safe.revenue?.spark}
          barColor="#eab308"
          link={{ href: "/history?tab=billing", label: "Xem giao dịch" }}
        />
      </FadeIn>
    </section>
  );
}
