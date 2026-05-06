import { useQuery } from "@tanstack/react-query";
import { http } from "./http.js";
import { toLocalYmd } from "../utils/dateLocal.js";

const EMPTY = {
  kpi: {
    revenue: { value: 0, trend: 0, spark: [] },
    checkedIn: { value: 0, trend: 0, spark: [] },
    newPatients: { value: 0, trend: 0, spark: [] },
    revisits: { value: 0, trend: 0, spark: [] },
    cancelRate: { value: 0, trend: 0, spark: [] },
  },
  rows: [],
  canViewRevenue: true,
};

function toNumber(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function toPercent(...vals) {
  for (const v of vals) {
    if (v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
  }
  return 0;
}

function mapSpark(list) {
  if (!Array.isArray(list)) return [];
  return list.map((x, idx) => ({
    date: x.Ngay || x.ngay || x.date || idx,
    value: toNumber(x.GiaTri, x.giaTri, x.value),
  }));
}

function normalizeOverviewDto(dto) {
  if (!dto || typeof dto !== "object") return EMPTY;

  const canViewRevenue = Boolean(
    dto.CoTheXemDoanhThu ?? dto.coTheXemDoanhThu ?? true
  );

  const revRaw = dto.DoanhThu || dto.doanhThu || {};
  const checkedInRaw = dto.BenhNhanDaCheckIn || dto.benhNhanDaCheckIn || {};
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

  const checkedIn = {
    value: toNumber(
      checkedInRaw.TongBenhNhanDaCheckIn,
      checkedInRaw.tongBenhNhanDaCheckIn,
      checkedInRaw.total,
      checkedInRaw.value
    ),
    trend: toPercent(
      checkedInRaw.CheckInChangePercent,
      checkedInRaw.checkInChangePercent,
      checkedInRaw.delta
    ),
    spark: mapSpark(
      checkedInRaw.PhanBoTheoNgay || checkedInRaw.phanBoTheoNgay || []
    ),
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

  const rawItems = dto.Items || dto.items || dto.Rows || dto.rows || [];

  const rows = Array.isArray(rawItems)
    ? rawItems.map((i, idx) => {
        const rawDate = i.Ngay || i.ngay || i.date;
        let date = "";
        if (rawDate instanceof Date) {
          date = toLocalYmd(rawDate);
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
    kpi: { revenue, checkedIn, newPatients, revisits, cancelRate },
    rows,
    canViewRevenue,
  };
}

function buildDateRange({ period, from, to }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const toDate = to
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

  const fromStr = toLocalYmd(fromDate);
  const toStr = toLocalYmd(toDate);

  const days =
    (toDate.getTime() - fromDate.getTime()) / 86_400_000 + 1 || 1;
  let groupBy = "day";
  if (days > 120) groupBy = "month";
  else if (days > 31) groupBy = "week";

  return { fromDate: fromStr, toDate: toStr, groupBy };
}

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

export function useReportsOverview(params) {
  return useQuery({
    queryKey: ["reportsOverview", params],
    queryFn: () => getReportsOverview(params),
    staleTime: 60_000,
  });
}
