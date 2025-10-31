// DỮ LIỆU MẪU & HELPERS cho trang Đơn thuốc (orders + stock)
// Lưu localStorage để bạn sửa/tạo/xoá giữ được giữa các lần refresh.

const LS_ORDERS = "hc.rx.orders.v1";
const LS_STOCK = "hc.rx.stock.v1";

/* =========================
 *  Seed dữ liệu ban đầu
 * ========================= */

// Đơn đã kê (chỉ đọc, bạn có thể đổi sang fetch API thật)
const SEED_ORDERS = [
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0001",
    at: "2025-10-22T08:15:00+07:00",
    ptId: "BN001",
    ptName: "Nguyễn Văn An",
    doctor: "BS. Trần Thị Bình",
    diag: "Viêm họng cấp",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v x 3 lần/ngày",
        qty: 12,
      },
      {
        code: "AMB30",
        name: "Ambroxol 30mg",
        dose: "1v x 2 lần/ngày",
        qty: 10,
      },
    ],
    total: 68000,
  },
  {
    id: "RX2025-0002",
    at: "2025-10-22T09:40:00+07:00",
    ptId: "BN005",
    ptName: "Lê Thị Cúc",
    doctor: "BS. Phạm Văn Đạt",
    diag: "Đau dạ dày",
    status: "pending",
    items: [
      {
        code: "OMZ20",
        name: "Omeprazole 20mg",
        dose: "1v x sáng trước ăn",
        qty: 14,
      },
      {
        code: "ALM",
        name: "Aluminium – Magnesium Hydroxide",
        dose: "10ml sau ăn",
        qty: 1,
      },
    ],
    total: 142000,
  },
  {
    id: "RX2025-0003",
    at: "2025-10-21T15:20:00+07:00",
    ptId: "BN012",
    ptName: "Phạm Minh Đức",
    doctor: "BS. Nguyễn Thu Hà",
    diag: "Cảm lạnh",
    status: "done",
    items: [
      {
        code: "PCM500",
        name: "Paracetamol 500mg",
        dose: "1v khi sốt > 38.5℃",
        qty: 6,
      },
      { code: "VITC1G", name: "Vitamin C 1g", dose: "1g/ngày", qty: 10 },
    ],
    total: 52000,
  },
];

// Kho thuốc (có số lượng + hạn dùng + số lô)
const SEED_STOCK = [
  {
    code: "PCM500",
    name: "Paracetamol 500mg",
    unit: "viên",
    price: 1500,
    usage: "Giảm đau, hạ sốt",
    qty: 1200,
    exp: "2026-04-30",
    lot: "L-P25A",
  },
  {
    code: "AMB30",
    name: "Ambroxol 30mg",
    unit: "viên",
    price: 2800,
    usage: "Long đờm",
    qty: 350,
    exp: "2025-11-15", // gần hết hạn (ví dụ), dùng để test lọc "Gần hết hạn"
    lot: "L-AMB11",
  },
  {
    code: "OMZ20",
    name: "Omeprazole 20mg",
    unit: "viên",
    price: 4200,
    usage: "Giảm tiết acid dạ dày",
    qty: 800,
    exp: "2027-02-28",
    lot: "L-OMZ07",
  },
  {
    code: "ALM",
    name: "Al(OH)3 – Mg(OH)2 hỗn dịch",
    unit: "chai",
    price: 38000,
    usage: "Trung hoà acid, giảm ợ nóng",
    qty: 42,
    exp: "2026-01-10",
    lot: "L-ALM06",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1h",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
  {
    code: "VITC1G",
    name: "Vitamin C 1g",
    unit: "viên",
    price: 1000,
    usage: "Bổ sung Vitamin C",
    qty: 2200,
    exp: "2025-12-05",
    lot: "L-VIT12",
  },
];

// Nếu chưa có trong localStorage thì seed
(function seed() {
  if (!localStorage.getItem(LS_ORDERS)) {
    localStorage.setItem(LS_ORDERS, JSON.stringify(SEED_ORDERS));
  }
  if (!localStorage.getItem(LS_STOCK)) {
    localStorage.setItem(LS_STOCK, JSON.stringify(SEED_STOCK));
  }
})();

/* =========================
 *  Public API
 * ========================= */

export function loadRxOrders() {
  try {
    return JSON.parse(localStorage.getItem(LS_ORDERS) || "[]");
  } catch {
    return [];
  }
}

export function loadStock() {
  try {
    return JSON.parse(localStorage.getItem(LS_STOCK) || "[]");
  } catch {
    return [];
  }
}

export function saveStock(list) {
  localStorage.setItem(LS_STOCK, JSON.stringify(list || []));
}

/**
 * Thêm 1 đơn mới (nếu bạn muốn ghi lại đơn khi bác sĩ ấn “Xuất chẩn đoán…”)
 * @param {object} order {id, at, ptId, ptName, doctor, diag, status, items, total}
 */
export function appendOrder(order) {
  const curr = loadRxOrders();
  curr.unshift(order);
  localStorage.setItem(LS_ORDERS, JSON.stringify(curr));
  return curr;
}
