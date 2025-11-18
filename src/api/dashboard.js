// src/api/dashboard.js
// API cho trang Overview (Dashboard)
import { useQuery } from "@tanstack/react-query";
import { http } from "./http.js";
import { mockEnabled, mockDashboardApi } from "./dashboardMock.js";

const EMPTY = {
  kpi: {
    patientsToday: { value: "0", delta: null, meta: null, spark: [] },
    appointments: { value: "0", delta: null, meta: null, spark: [] },
    revenue: { value: "0", delta: null, meta: null, spark: [] },
    exams: { value: "0", delta: null, meta: null, spark: [] },
  },
  upcomingAppointments: [],
  activities: [],
};

function toNumber(...values) {
  for (const v of values) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function formatDelta(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return null;
  const n = Number(v);
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

function mapSpark(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((x, idx) => ({
    hour: x.hour ?? x.gio ?? x.Gio ?? idx,
    value: Number(x.value ?? x.giaTri ?? x.GiaTri ?? 0),
  }));
}

/* ========== KPI MAPPING – BÁM SÁT DTO ========== */

function mapPatientsKpi(src = {}) {
  const total = toNumber(
    src.TongSoBenhNhan,
    src.tongSoBenhNhan,
    src.tongSo,
    src.total,
    src.count
  );
  const processed = toNumber(
    src.DaXuLy,
    src.daXuLy,
    src.daKham,
    src.done
  );
  const pending = toNumber(
    src.ChoXuLy,
    src.choXuLy,
    src.choKham,
    src.waitExam,
    src.waiting
  );
  const cancelled = toNumber(
    src.DaHuy,
    src.daHuy,
    src.cancelled
  );
  const delta = toNumber(
    src.TangTruongPhanTram,
    src.tangTruongPhanTram,
    src.thayDoiPhanTramSoVoiHomQua,
    src.deltaPercent,
    src.delta
  );

  const parts = [];
  if (processed !== null) parts.push(`Đã xử lý: ${processed}`);
  if (pending !== null) parts.push(`Chờ xử lý: ${pending}`);
  if (cancelled !== null) parts.push(`Đã huỷ: ${cancelled}`);

  return {
    value: total !== null ? String(total) : "0",
    delta: formatDelta(delta),
    meta: parts.join(" · ") || null,
    spark: mapSpark(
      src.PhanBoTheoGio ||
        src.phanBoTheoGio ||
        src.duLieu24Gio ||
        src.spark
    ),
  };
}

function mapAppointmentsKpi(src = {}) {
  const total = toNumber(
    src.TongSoLichHen,
    src.tongSoLichHen,
    src.tongSo,
    src.total,
    src.count
  );
  const confirmed = toNumber(
    src.DaXacNhan,
    src.daXacNhan,
    src.confirmed
  );
  const pending = toNumber(
    src.ChoXacNhan,
    src.choXacNhan,
    src.pending,
    src.waiting
  );
  const cancelled = toNumber(
    src.DaHuy,
    src.daHuy,
    src.cancelled
  );
  const delta = toNumber(
    src.TangTruongPhanTram,
    src.tangTruongPhanTram,
    src.thayDoiPhanTramSoVoiHomQua,
    src.deltaPercent,
    src.delta
  );

  const parts = [];
  if (confirmed !== null) parts.push(`Đã xác nhận: ${confirmed}`);
  if (pending !== null) parts.push(`Đang chờ: ${pending}`);
  if (cancelled !== null) parts.push(`Đã huỷ: ${cancelled}`);

  return {
    value: total !== null ? String(total) : "0",
    delta: formatDelta(delta),
    meta: parts.join(" · ") || null,
    spark: mapSpark(
      src.PhanBoTheoGio ||
        src.phanBoTheoGio ||
        src.duLieu24Gio ||
        src.spark
    ),
  };
}

function formatMoney(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return "0";
  const n = Number(num);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function mapRevenueKpi(src = {}) {
  const total = toNumber(
    src.TongDoanhThu,
    src.tongDoanhThu,
    src.tongSo,
    src.tongTien,
    src.total,
    src.amount
  );
  const clinic = toNumber(
    src.DoanhThuKhamLs,
    src.doanhThuKhamLs,
    src.tienKham,
    src.kham,
    src.clinic
  );
  const cls = toNumber(
    src.DoanhThuCls,
    src.doanhThuCls,
    src.tienCls,
    src.cls,
    src.lab
  );
  const drug = toNumber(
    src.DoanhThuThuoc,
    src.doanhThuThuoc,
    src.tienThuoc,
    src.thuoc,
    src.drug
  );
  const delta = toNumber(
    src.TangTruongPhanTram,
    src.tangTruongPhanTram,
    src.thayDoiPhanTramSoVoiHomQua,
    src.deltaPercent,
    src.delta
  );

  const parts = [];
  if (clinic !== null) parts.push(`LS: ${formatMoney(clinic)}`);
  if (cls !== null) parts.push(`CLS: ${formatMoney(cls)}`);
  if (drug !== null) parts.push(`Thuốc: ${formatMoney(drug)}`);

  return {
    value: total !== null ? `${formatMoney(total)}` : "0",
    delta: formatDelta(delta),
    meta: parts.join(" · ") || null,
    spark: mapSpark(
      src.PhanBoTheoGio ||
        src.phanBoTheoGio ||
        src.duLieu24Gio ||
        src.spark
    ),
  };
}

function mapExamsKpi(src = {}) {
  const total = toNumber(
    src.TongLuotKham,
    src.tongLuotKham,
    src.tongSo,
    src.total,
    src.count
  );
  const waitExam = toNumber(
    src.ChoKham,
    src.choKham,
    src.waitExam
  );
  const inExam = toNumber(
    src.DangKham,
    src.dangKham,
    src.inExam
  );
  const done = toNumber(
    src.DaHoanTat,
    src.daHoanTat,
    src.done
  );
  const delta = toNumber(
    src.TangTruongPhanTram,
    src.tangTruongPhanTram,
    src.thayDoiPhanTramSoVoiHomQua,
    src.deltaPercent,
    src.delta
  );

  const parts = [];
  if (waitExam !== null) parts.push(`Chờ khám: ${waitExam}`);
  if (inExam !== null) parts.push(`Đang khám: ${inExam}`);
  if (done !== null) parts.push(`Hoàn tất: ${done}`);

  return {
    value: total !== null ? String(total) : "0",
    delta: formatDelta(delta),
    meta: parts.join(" · ") || null,
    spark: mapSpark(
      src.PhanBoTheoGio ||
        src.phanBoTheoGio ||
        src.duLieu24Gio ||
        src.spark
    ),
  };
}

/* ========== LIST MAPPING ========== */

function mapAppointmentStatusTone(codeOrLabel) {
  const raw = (codeOrLabel ?? "").toString().toLowerCase();
  if (!raw) return "info";
  if (raw.includes("hủy") || raw.includes("huy")) return "danger";
  if (
    raw.includes("checkin") ||
    raw.includes("đã đến") ||
    raw.includes("da_den")
  )
    return "ok";
  if (
    raw.includes("đang chờ") ||
    raw.includes("dang_cho") ||
    raw.includes("cho")
  )
    return "warn";
  if (raw.includes("xác nhận") || raw.includes("xac_nhan")) return "ok";
  return "info";
}

function formatTime(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ========== DTO → UI MODEL ========== */

function normalizeDashboardDto(dto) {
  if (!dto || typeof dto !== "object") return EMPTY;

  const patientsRaw =
    dto.BenhNhanTrongNgay ||
    dto.benhNhanTrongNgay ||
    dto.patientsToday ||
    {};
  const apptRaw =
    dto.LichHenHomNay ||
    dto.lichHenHomNay ||
    dto.appointments ||
    {};
  const revenueRaw =
    dto.DoanhThuHomNay ||
    dto.doanhThuHomNay ||
    dto.revenue ||
    {};
  const examsRaw =
    dto.LuotKhamHomNay ||
    dto.luotKhamHomNay ||
    dto.exams ||
    {};

  const rawUpcoming =
    dto.LichHenSapToi ||
    dto.lichHenSapToi ||
    dto.upcomingAppointments ||
    [];
  const rawActivities =
    dto.HoatDongGanDay ||
    dto.hoatDongGanDay ||
    dto.activities ||
    [];

  const upcomingAppointments = Array.isArray(rawUpcoming)
    ? rawUpcoming.map((a, idx) => {
        const status =
          a.TrangThai ||
          a.trangThai ||
          a.statusLabel ||
          a.status ||
          "";
        const patient =
          a.TenBenhNhan ||
          a.tenBenhNhan ||
          a.patientName ||
          a.hoTen ||
          a.patient ||
          `#${idx + 1}`;
        const service =
          a.TenDichVuKham ||
          a.tenDichVuKham ||
          a.tenDichVu ||
          a.serviceName ||
          a.dichVu ||
          a.service ||
          "";
        const at =
          a.gioHienThi ||
          a.at ||
          formatTime(
            a.GioHen ||
              a.gioHen ||
              a.ThoiGianHen ||
              a.thoiGianHen ||
              a.time
          );

        const id =
          a.id ||
          a.MaLichHen ||
          a.maLichHen ||
          a.code ||
          `APPT-${idx + 1}`;

        return {
          id,
          status,
          statusTone: mapAppointmentStatusTone(
            a.TrangThai || a.trangThai || a.status
          ),
          patient,
          service,
          at,
        };
      })
    : [];

  const activities = Array.isArray(rawActivities)
    ? rawActivities.map((x, idx) => ({
        id: x.id || x.MaHoatDong || x.maHoatDong || `ACT-${idx + 1}`,
        content: x.MoTa || x.moTa || x.noiDung || x.message || x.text || "",
        at:
          x.thoiGianHienThi ||
          x.at ||
          formatTime(x.ThoiGian || x.thoiGian || x.time),
      }))
    : [];

  return {
    kpi: {
      patientsToday: mapPatientsKpi(patientsRaw),
      appointments: mapAppointmentsKpi(apptRaw),
      revenue: mapRevenueKpi(revenueRaw),
      exams: mapExamsKpi(examsRaw),
    },
    upcomingAppointments,
    activities,
  };
}

/* ========== PUBLIC API HOOKS ========== */

export async function getDashboardToday() {
  let dto;
  if (mockEnabled) {
    dto = await mockDashboardApi.getToday();
  } else {
    const response = await http.get("/dashboard/today");
    dto = response.data ?? response;
  }
  return normalizeDashboardDto(dto);
}

export function useDashboardToday() {
  return useQuery({
    queryKey: ["dashboardToday"],
    queryFn: getDashboardToday,
    staleTime: 30_000,
  });
}
