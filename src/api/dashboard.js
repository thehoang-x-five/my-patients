// src/api/dashboard.js
// API + realtime cho trang Overview (Dashboard)

import { useQuery } from "@tanstack/react-query";
import { http } from "./http.js";
import { ensureStarted, on } from "./realtime.js";

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

/* ================== HELPERS ================== */

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
    hour:
      toNumber(x.Gio, x.gio, x.Hour, x.hour, idx) ??
      idx,
    value:
      toNumber(
        x.GiaTri,
        x.giaTri,
        x.Value,
        x.value,
        x.count
      ) ?? 0,
  }));
}

function formatTime(input) {
  if (!input) return "";
  const str = String(input);

  // dạng "HH:mm"
  const m = str.match(/(\d{1,2}):(\d{2})/);
  if (m) {
    const hh = m[1].padStart(2, "0");
    const mm = m[2];
    return `${hh}:${mm}`;
  }

  const d = new Date(str);
  if (!Number.isNaN(d.getTime())) {
    try {
      return d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    }
  }

  return str;
}

function formatMoney(num) {
  if (num === null || num === undefined || Number.isNaN(num)) return "0";
  const n = Number(num);
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} triệu`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

/* ================== KPI MAPPERS ================== */

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
    src.pending,
    src.choKham
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
    src.pending
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
  if (pending !== null) parts.push(`Chờ xác nhận: ${pending}`);
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

function mapRevenueKpi(src = {}) {
  const total = toNumber(
    src.TongDoanhThu,
    src.tongDoanhThu,
    src.tongSo,
    src.total
  );
  const clinic = toNumber(
    src.DoanhThuKhamLs,
    src.doanhThuKhamLs
  );
  const cls = toNumber(
    src.DoanhThuCls,
    src.doanhThuCls
  );
  const drug = toNumber(
    src.DoanhThuThuoc,
    src.doanhThuThuoc
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
    src.total
  );
  const inProgress = toNumber(
    src.DangKham,
    src.dangKham,
    src.inProgress
  );
  const done = toNumber(
    src.DaHoanTat,
    src.daHoanTat,
    src.done
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
  if (inProgress !== null) parts.push(`Đang khám: ${inProgress}`);
  if (done !== null) parts.push(`Hoàn tất: ${done}`);
  if (cancelled !== null) parts.push(`Đã hủy: ${cancelled}`);

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

function mapServicesKpi(src = {}) {
  const total = toNumber(src.TongDichVu, src.tongDichVu, src.total);
  const done = toNumber(src.HoanTat, src.hoanTat, src.done);
  const inProg = toNumber(src.DangLam, src.dangLam, src.inProgress);
  const cancelled = toNumber(src.DaHuy, src.daHuy, src.cancelled);
  const delta = toNumber(
    src.TangTruongPhanTram, src.tangTruongPhanTram, src.deltaPercent, src.delta
  );

  const parts = [];
  if (done !== null) parts.push(`Hoàn tất: ${done}`);
  if (inProg !== null) parts.push(`Đang làm: ${inProg}`);
  if (cancelled !== null) parts.push(`Đã hủy: ${cancelled}`);

  return {
    value: total !== null ? String(total) : "0",
    delta: formatDelta(delta),
    meta: parts.join(" · ") || null,
    spark: mapSpark(
      src.PhanBoTheoGio || src.phanBoTheoGio || src.spark
    ),
  };
}

/* ================== LIST NORMALIZERS ================== */

function normalizeUpcomingAppointment(a = {}, idx = 0) {
  const statusRaw =
    a.TrangThai ||
    a.trangThai ||
    a.statusLabel ||
    a.status ||
    "";

  const status = statusRaw || "Đang xử lý";

  const lower = String(statusRaw).toLowerCase();
  let statusTone = "info";
  if (lower.includes("huy")) statusTone = "danger";
  else if (lower.includes("cho")) statusTone = "info";
  else if (lower.includes("xac_nhan") || lower.includes("checkin"))
    statusTone = "ok";

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
    patient,
    service,
    status,
    statusTone,
    at,
  };
}

function normalizeActivity(a = {}, idx = 0) {
  const id =
    a.id ||
    a.MaHoatDong ||
    a.maHoatDong ||
    `ACT-${idx + 1}`;
  const content =
    a.MoTa ||
    a.moTa ||
    a.NoiDung ||
    a.noiDung ||
    a.content ||
    "";
  const at =
    a.gioHienThi ||
    a.at ||
    formatTime(
      a.ThoiGian ||
        a.thoiGian ||
        a.time
    );

  return {
    id,
    content,
    at,
  };
}

/* ================== ROOT NORMALIZER ================== */

function normalizeDashboardDto(dto) {
  if (!dto || typeof dto !== "object") {
    return {
      ...EMPTY,
      kpi: { ...EMPTY.kpi },
    };
  }

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

  return {
    date:
      dto.Ngay ||
      dto.ngay ||
      dto.date ||
      null,
    kpi: {
      patientsToday: mapPatientsKpi(patientsRaw),
      appointments: mapAppointmentsKpi(apptRaw),
      revenue: mapRevenueKpi(revenueRaw),
      exams: mapExamsKpi(examsRaw),
    },
    // Role-specific: services KPI (for CLS/KTV)
    services: mapServicesKpi(
      dto.DichVuHomNay || dto.dichVuHomNay || {}
    ),
    // Role-specific: upcoming services list (for CLS/KTV)
    upcomingServices: (() => {
      const raw = dto.DichVuSapLam || dto.dichVuSapLam || [];
      return (Array.isArray(raw) ? raw : []).map((s, i) => ({
        id: s.MaChiTietDV || s.maChiTietDV || `SVC-${i}`,
        service: s.TenDichVu || s.tenDichVu || "",
        patient: s.TenBenhNhan || s.tenBenhNhan || "",
        status: s.TrangThai || s.trangThai || "da_lap",
        at: formatTime(s.GioChiDinh || s.gioChiDinh),
        hasResult: s.CoKetQua ?? s.coKetQua ?? false,
      }));
    })(),
    // Role-specific: trending services (for Admin/HC)
    trendingServices: (() => {
      const raw = dto.DichVuTangManh || dto.dichVuTangManh || [];
      return (Array.isArray(raw) ? raw : []).map((s, i) => ({
        id: `TREND-${i}`,
        name: s.TenDichVu || s.tenDichVu || "",
        type: s.LoaiDichVu || s.loaiDichVu || "cls",
        count: s.SoLuong ?? s.soLuong ?? 0,
      }));
    })(),
    upcomingAppointments: Array.isArray(rawUpcoming)
      ? rawUpcoming.map(normalizeUpcomingAppointment)
      : [],
    activities: Array.isArray(rawActivities)
      ? rawActivities.map(normalizeActivity)
      : [],
  };
}

/* ================== HTTP HOOK ================== */

export async function getDashboardToday() {
  const response = await http.get("/dashboard/today");

  console.log(response?.data);
  const raw = response?.data ?? response;

  // Một số backend bọc thêm lớp { data: ... }
  const dto =
    raw && typeof raw === "object" && raw.data && typeof raw.data === "object"
      ? raw.data
      : raw;

  return normalizeDashboardDto(dto);
  
}

export function useDashboardToday(options = {}) {
  return useQuery({
    queryKey: ["dashboardToday"],
    queryFn: getDashboardToday,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,

    ...options,
  });
}

/* ================== REALTIME SUBSCRIPTION ================== */
/**
 * FE dùng:
 *   const qc = useQueryClient();
 *   useEffect(() => {
 *     const off = await subscribeDashboard(qc);
 *     return () => off && off();
 *   }, [qc]);
 */
export async function subscribeDashboard(queryClient) {
  if (!queryClient) {
    throw new Error("subscribeDashboard cần QueryClient");
  }

  // Đảm bảo connection đã start
  await ensureStarted();

  const updateWhole = (dto) => {
    queryClient.setQueryData(
      ["dashboardToday"],
      normalizeDashboardDto(dto || {})
    );
  };

  const patchKpi = (key, mapper) => (dto) => {
    queryClient.setQueryData(["dashboardToday"], (prev) => {
      const base = prev || EMPTY;
      return {
        ...base,
        kpi: {
          ...(base.kpi || EMPTY.kpi),
          [key]: mapper(dto || {}),
        },
      };
    });
  };

  const patchList = (field, mapper) => (items) => {
    queryClient.setQueryData(["dashboardToday"], (prev) => {
      const base = prev || EMPTY;
      const arr = Array.isArray(items) ? items : [];
      return {
        ...base,
        [field]: arr
          .map((x, idx) => mapper(x, idx))
          .filter(Boolean),
      };
    });
  };

  const disposers = [
    on("DashboardTodayUpdated", updateWhole),
   
  ];

  return () => {
    for (const off of disposers) {
      try {
        typeof off === "function" && off();
      } catch {
        // ignore
      }
    }
  };
}
