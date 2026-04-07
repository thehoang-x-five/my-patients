import React from "react";
import { FadeIn } from "../ui/Supports.jsx";
import KpiCard from "./KpiCard.jsx";

export default function KpiRail({ kpi, role = "default", services }) {
  const safe = kpi || {};
  const isCls = role === "cls";
  const isClinical = role === "clinical";
  const showRevenue = role === "admin" || role === "reception";
  const hasSpark = (item) => Array.isArray(item?.spark) && item.spark.length > 0;
  const pickRoleKpi = (preferred, fallback) =>
    hasSpark(preferred) || !hasSpark(fallback) ? preferred : fallback;

  const patientKpi = isCls
    ? pickRoleKpi(safe.clsPatients, safe.patientsToday)
    : isClinical
      ? pickRoleKpi(safe.lsPatients, safe.patientsToday)
      : safe.patientsToday;
  const examKpi = isCls
    ? pickRoleKpi(safe.clsExams, safe.exams)
    : isClinical
      ? pickRoleKpi(safe.lsExams, safe.exams)
      : safe.exams;

  const examCounts = examKpi?.counts || {};
  const diagnosisCounts = safe.diagnoses?.counts || {};
  const resultCounts = safe.results?.counts || {};

  const patientTitle = isCls
    ? "Bệnh nhân CLS hôm nay"
    : isClinical
      ? "Bệnh nhân LS hôm nay"
      : "Bệnh nhân trong ngày";

  const examMeta = [
    `${isCls ? "Chờ thực hiện" : "Chờ khám"}: ${examCounts.pending ?? 0}`,
    `Hoàn tất: ${examCounts.done ?? 0}`,
    `Hủy: ${examCounts.cancelled ?? 0}`,
  ].join(" · ");

  const thirdCard = {
    title: isCls ? "Lượt CLS hôm nay" : isClinical ? "Lượt khám LS hôm nay" : "Lượt khám hôm nay",
    value: examKpi?.value,
    delta: examKpi?.delta,
    deltaTone: "info",
    meta: examMeta,
    data24: examKpi?.spark,
    barColor: "#f97316",
    link: isCls
      ? {
          href: "/examination?tab=cls",
          label: "Xem lượt CLS",
        }
      : {
          href: "/examination?date=today",
          label: isClinical ? "Xem lượt khám LS" : "Xem danh sách khám",
        },
  };

  const fourthCard = showRevenue
    ? {
        title: "Doanh thu hôm nay",
        value: safe.revenue?.value,
        delta: safe.revenue?.delta,
        deltaTone: "ok",
        meta: safe.revenue?.meta,
        data24: safe.revenue?.spark,
        barColor: "#eab308",
        link: { href: "/history?tab=billing", label: "Xem giao dịch" },
      }
    : isCls
      ? {
          title: "Kết quả hôm nay",
          value: safe.results?.value,
          delta: safe.results?.delta ?? "0.0%",
          deltaTone: "ok",
          meta: [
            `Sớm: ${resultCounts.early ?? 0}`,
            `Đúng giờ: ${resultCounts.onTime ?? 0}`,
            `Trễ: ${resultCounts.late ?? 0}`,
          ].join(" · "),
          data24: safe.results?.spark,
          barColor: "#eab308",
          link: {
            href: "/examination?tab=cls",
            label: "Xem kết quả CLS",
          },
        }
      : {
          title: "Chẩn đoán hôm nay",
          value: safe.diagnoses?.value,
          delta: safe.diagnoses?.delta ?? "0.0%",
          deltaTone: "ok",
          meta: [
            `Cho về: ${diagnosisCounts.choVe ?? 0}`,
            `Tái khám: ${diagnosisCounts.taiKham ?? 0}`,
            `Cho thuốc: ${diagnosisCounts.choThuoc ?? 0}`,
          ].join(" · "),
          data24: safe.diagnoses?.spark,
          barColor: "#eab308",
          link: {
            href: "/examination",
            label: "Xem chẩn đoán",
          },
        };

  return (
    <section
      className="grid items-stretch gap-3 sm:grid-cols-2 md:grid-cols-4"
      aria-label="Chỉ số chính trong ngày"
    >
      <FadeIn>
        <KpiCard
          title={patientTitle}
          value={patientKpi?.value}
          delta={patientKpi?.delta}
          deltaTone="ok"
          meta={patientKpi?.meta}
          data24={patientKpi?.spark}
          barColor="#10b981"
          link={{
            href: "/patients?view=today",
            label: isCls ? "Xem BN CLS" : isClinical ? "Xem BN LS" : "Xem danh sách",
          }}
        />
      </FadeIn>

      <FadeIn>
        {isCls ? (
          <KpiCard
            title="Dịch vụ CLS hôm nay"
            value={services?.value ?? "0"}
            delta={services?.delta}
            deltaTone="info"
            meta={services?.meta}
            data24={services?.spark}
            barColor="#14b8a6"
            link={{
              href: "/examination?tab=cls",
              label: "Xem dịch vụ",
            }}
          />
        ) : (
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
        )}
      </FadeIn>

      <FadeIn>
        <KpiCard {...thirdCard} />
      </FadeIn>

      <FadeIn>
        <KpiCard {...fourthCard} />
      </FadeIn>
    </section>
  );
}
