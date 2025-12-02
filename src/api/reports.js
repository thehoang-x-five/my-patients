// src/api/reports.js
import { useQuery } from "@tanstack/react-query";
import { http } from "./http.js";

const EMPTY = {
  kpi: {
    revenue: { value: 0, trend: 0, spark: [] },
    newPatients: { value: 0, trend: 0, spark: [] },
    revisits: { value: 0, trend: 0, spark: [] },
    cancelRate: { value: 0, trend: 0, spark: [] },
  },
  rows: [],
};

// Lấy số đầu tiên hợp lệ trong list giá trị
function toNumber(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

// Tỷ lệ % cũng chỉ là Number, không scale thêm
function toPercent(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

// Map list PhanBoTheoNgay -> { date, value } cho sparkline
function mapSpark(list) {
  if (!Array.isArray(list)) return [];
  return list.map((x, idx) => ({
    date: x.Ngay || x.ngay || x.date || idx,
    value: toNumber(x.GiaTri, x.giaTri, x.value),
  }));
}

/**
 * Chuẩn hoá ReportOverviewDto từ BE về shape FE:
 * {
 *   kpi: { revenue, newPatients, revisits, cancelRate },
 *   rows: [{ id, date, revenue, newPatients, revisits, cancelRate }]
 * }
 */
function normalizeOverviewDto(dto) {
  if (!dto || typeof dto !== "object") return EMPTY;

  // Kpi raw từ BE (PascalCase) + fallback camelCase/mock
  const revRaw = dto.DoanhThu || dto.doanhThu || {};
  const newRaw = dto.BenhNhanMoi || dto.benhNhanMoi || {};
  const rvRaw = dto.TaiKham || dto.taiKham || {};
  const cancelRaw = dto.TyLeHuy || dto.tyLeHuy || {};

  const revenue = {
    value: toNumber(
      revRaw.TongDoanhThu,
      revRaw.tongDoanhThu,
      revRaw.total,
      revRaw.value
    ),
    trend: toPercent(
      revRaw.DoanhThuChangePercent,
      revRaw.doanhThuChangePercent,
      revRaw.delta
    ),
    spark: mapSpark(revRaw.PhanBoTheoNgay || revRaw.phanBoTheoNgay || []),
  };

  const newPatients = {
    value: toNumber(
      newRaw.TongBenhNhanMoi,
      newRaw.tongBenhNhanMoi,
      newRaw.total,
      newRaw.value
    ),
    trend: toPercent(
      newRaw.BenhNhanMoiChangePercent,
      newRaw.benhNhanMoiChangePercent,
      newRaw.delta
    ),
    spark: mapSpark(newRaw.PhanBoTheoNgay || newRaw.phanBoTheoNgay || []),
  };

  const revisits = {
    value: toNumber(
      rvRaw.TongTaiKham,
      rvRaw.tongTaiKham,
      rvRaw.total,
      rvRaw.value
    ),
    trend: toPercent(
      rvRaw.TaiKhamChangePercent,
      rvRaw.taiKhamChangePercent,
      rvRaw.delta
    ),
    spark: mapSpark(rvRaw.PhanBoTheoNgay || rvRaw.phanBoTheoNgay || []),
  };

  const cancelRate = {
    value: toPercent(
      cancelRaw.TyLeHuy,
      cancelRaw.tyLeHuy,
      cancelRaw.total,
      cancelRaw.value
    ),
    trend: toPercent(
      cancelRaw.TyLeHuyChangePercent,
      cancelRaw.tyLeHuyChangePercent,
      cancelRaw.delta
    ),
    spark: mapSpark(
      cancelRaw.PhanBoTheoNgay || cancelRaw.phanBoTheoNgay || []
    ),
  };

  // Items chi tiết theo ngày/tuần/tháng
  const rawItems =
    dto.Items || dto.items || dto.Rows || dto.rows || [];

  const rows = Array.isArray(rawItems)
    ? rawItems.map((i, idx) => {
        const rawDate = i.Ngay || i.ngay || i.date;
        let date = "";
        if (rawDate instanceof Date) {
          date = rawDate.toISOString().slice(0, 10);
        } else if (typeof rawDate === "string") {
          date = rawDate.slice(0, 10);
        }

        return {
          id: idx + 1,
          date: date || `#${idx + 1}`,
          revenue: toNumber(i.DoanhThu, i.doanhThu, i.revenue),
          newPatients: toNumber(
            i.BenhNhanMoi,
            i.benhNhanMoi,
            i.newPatients
          ),
          revisits: toNumber(i.TaiKham, i.taiKham, i.revisits),
          cancelRate: toPercent(i.TyLeHuy, i.tyLeHuy, i.cancelRate),
        };
      })
    : [];

  return {
    kpi: { revenue, newPatients, revisits, cancelRate },
    rows,
  };
}

/**
 * Build khoảng thời gian + GroupBy theo period:
 * - mtd: từ đầu tháng -> hôm nay
 * - 30d: 30 ngày gần nhất
 * - 90d: 90 ngày gần nhất
 * - ytd: từ 01/01 năm hiện tại
 * - custom: nếu FE truyền from/to thì dùng thẳng, nếu không fallback 30d
 */
function buildDateRange({ period, from, to }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let toDate = to
    ? new Date(to)
    : new Date(today.getFullYear(), today.getMonth(), today.getDate());
  let fromDate;

  if (from) {
    fromDate = new Date(from);
  } else {
    const base = new Date(toDate);
    switch (period) {
      case "30d":
        base.setDate(base.getDate() - 29);
        break;
      case "90d":
        base.setDate(base.getDate() - 89);
        break;
      case "ytd":
        fromDate = new Date(toDate.getFullYear(), 0, 1);
        break;
      case "custom":
        base.setDate(base.getDate() - 29);
        break;
      case "mtd":
      default:
        fromDate = new Date(toDate.getFullYear(), toDate.getMonth(), 1);
        break;
    }
    if (!fromDate) fromDate = base;
  }

  fromDate.setHours(0, 0, 0, 0);
  toDate.setHours(0, 0, 0, 0);

  const fromStr = fromDate.toISOString().slice(0, 10);
  const toStr = toDate.toISOString().slice(0, 10);

  const days =
    (toDate.getTime() - fromDate.getTime()) / 86_400_000 + 1 || 1;
  let groupBy = "day";
  if (days > 120) groupBy = "month";
  else if (days > 31) groupBy = "week";

  return { fromDate: fromStr, toDate: toStr, groupBy };
}

/**
 * Gọi BE thật: POST /reports/overview
 * Body: { FromDate, ToDate, GroupBy }
 */
export async function getReportsOverview(params = {}) {
  const { fromDate, toDate, groupBy } = buildDateRange(params);

  const res = await http.post("/reports/overview", {
    FromDate: fromDate,
    ToDate: toDate,
    GroupBy: groupBy,
  });

  const dto = res?.data ?? res;
  return normalizeOverviewDto(dto);
}

/**
 * Hook React Query cho trang Reports
 */
export function useReportsOverview(params) {
  return useQuery({
    queryKey: ["reportsOverview", params],
    queryFn: () => getReportsOverview(params),
    staleTime: 60_000,
  });
}
