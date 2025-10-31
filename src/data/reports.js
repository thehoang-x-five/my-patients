const rand = (min, max) => Math.round(min + Math.random() * (max - min));

const fmt = (d) =>
  new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });

/** Sinh chuỗi ngày + số liệu (doanh thu / số BN / tỉ lệ huỷ) */
export function buildSeries(days = 90) {
  const today = new Date();
  const start = addDays(today, -(days - 1));
  const rows = [];
  let lastRev = 8500000;
  let lastOrder = 7;
  for (let i = 0; i < days; i++) {
    const date = addDays(start, i);
    // seasonal noise
    const weekend = [0, 6].includes(date.getDay());
    const rev = Math.max(
      0,
      Math.round(
        lastRev + (weekend ? -rand(800000, 1500000) : rand(-900000, 1500000))
      )
    );
    const orders = Math.max(0, lastOrder + rand(-4, 6));
    const returns = Math.max(0, rand(0, 2)); // số ca hủy
    const conv = orders ? Math.min(100, Math.round((orders / 60) * 100)) : 0;

    rows.push({
      key: i,
      date: date.toISOString().slice(0, 10),
      label: fmt(date),
      revenue: rev,
      orders,
      revisits: Math.max(0, rand(0, Math.floor(orders / 2))),
      cancelRate: Math.min(
        100,
        Math.round((returns / Math.max(1, orders)) * 100)
      ),
    });
    lastRev = rev;
    lastOrder = orders;
  }
  return rows;
}

const DEPTS = [
  "Nội",
  "Ngoại",
  "Tim mạch",
  "Nhi",
  "Tai mũi họng",
  "RHM",
  "Da liễu",
];
export function buildDeptRevenue() {
  return DEPTS.map((name) => ({
    name,
    value: rand(120, 520) * 1_000_000,
  })).sort((a, b) => b.value - a.value);
}
export function buildSources() {
  return [
    { name: "Đặt lịch", value: rand(25, 55) },
    { name: "Trực tiếp", value: rand(10, 40) },
    { name: "Tái khám", value: rand(15, 45) },
  ].sort((a, b) => b.value - a.value);
}

export const PERIODS = [
  { key: "mtd", label: "Tháng này" },
  { key: "prevMonth", label: "Tháng trước" },
  { key: "last7", label: "Quý này" },
];
// src/data/reports.js

// Helpers
const startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0); // 0 = last day prev month
const addDays = (d, n) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

export function filterByPeriod(rows, period) {
  const today = new Date();
  let start, end;

  switch (period) {
    case "mtd": {
      // Tháng này: từ ngày 1 đến HÔM NAY
      start = startOfMonth(today);
      end = today;
      break;
    }
    case "prevMonth": {
      // Tháng trước: từ ngày 1 → ngày cuối THÁNG TRƯỚC (đầy tháng)
      const prevAny = new Date(today.getFullYear(), today.getMonth() - 1, 15);
      start = startOfMonth(prevAny);
      end = endOfMonth(prevAny); // <-- luôn chốt cuối tháng trước
      break;
    }
    case "last7": {
      end = today;
      start = addDays(today, -6); // đủ 7 điểm
      break;
    }
    default: {
      // fallback: không lọc
      return rows.slice();
    }
  }

  // Chuẩn hoá đầu/cuối ngày để so sánh “bao gồm” 2 biên
  const startMid = new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate(),
    0,
    0,
    0,
    0
  );
  const endMid = new Date(
    end.getFullYear(),
    end.getMonth(),
    end.getDate(),
    23,
    59,
    59,
    999
  );

  return rows.filter((r) => {
    const d = new Date(r.date);
    return d >= startMid && d <= endMid;
  });
}

export function calcKpi(rows) {
  if (!rows.length)
    return { revenue: 0, newPatients: 0, revisits: 0, cancel: 0 };
  const revenue = rows.reduce((a, b) => a + b.revenue, 0);
  const newPatients = rows.reduce((a, b) => a + b.orders, 0);
  const revisits = rows.reduce((a, b) => a + b.revisits, 0);
  const cancel = Math.round(
    rows.reduce((a, b) => a + b.cancelRate, 0) / rows.length
  );
  return { revenue, newPatients, revisits, cancel };
}
