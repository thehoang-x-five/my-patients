const LS_KEY = "hc.notifications.v1";

export const TYPES = {
  appointment: { label: "Lịch hẹn" },
  stock: { label: "Kho thuốc" },
  billing: { label: "Thanh toán" },
  lab: { label: "Cận lâm sàng" },
  rx: { label: "Đơn thuốc" },
  message: { label: "Tin nhắn" },
  system: { label: "Hệ thống" },
  staff: { label: "Nhân sự" },
};

const nowISO = () => new Date().toISOString();
const minutesAgo = (m) => new Date(Date.now() - m * 60000).toISOString();

const SEED = [
  // Chưa đọc hôm nay
  {
    id: "n1",
    ts: minutesAgo(5),
    type: "appointment",
    unread: true,
    title: "Lịch hẹn mới 08:00 ngày mai",
    body: "BN Nguyễn Văn An đặt lịch với BS. Trần Thị Bình.",
    patientId: "BN001",
    patientName: "Nguyễn Văn An",
    links: [{ to: "/appointments", label: "Xem lịch hẹn" }],
  },
  {
    id: "n2",
    ts: minutesAgo(25),
    type: "stock",
    unread: true,
    title: "Cảnh báo kho thuốc",
    body: "Ambroxol 30mg còn 50 viên, gần hết hạn 15 ngày.",
    drugCode: "AMB30",
    links: [{ to: "/prescriptions?tab=stock", label: "Mở kho thuốc" }],
  },

  // Hôm nay (đã đọc)
  {
    id: "n3",
    ts: minutesAgo(60),
    type: "lab",
    unread: false,
    title: "Có kết quả X-quang",
    body: "BN Lê Thị Cúc (BN005) có kết quả X-quang ngực.",
    patientId: "BN005",
    patientName: "Lê Thị Cúc",
    links: [
      { to: "/history?tab=visits&pid=BN005", label: "Xem lịch sử" },
      { to: "/patients?pid=BN005", label: "Hồ sơ BN" },
    ],
  },
  {
    id: "n4",
    ts: minutesAgo(90),
    type: "billing",
    unread: false,
    title: "Hóa đơn đã thanh toán",
    body: "INV-001 của BN Nguyễn Văn An đã thanh toán.",
    invoiceId: "INV-001",
    patientId: "BN001",
    patientName: "Nguyễn Văn An",
    links: [{ to: "/history?tab=transactions", label: "Xem giao dịch" }],
  },

  // Trước đó
  {
    id: "n5",
    ts: "2025-03-03T10:20:00+07:00",
    type: "rx",
    unread: false,
    title: "Đơn thuốc đã phát",
    body: "RX2025-0003 (BN012) đã phát tại quầy.",
    rxId: "RX2025-0003",
    patientId: "BN012",
    patientName: "Phạm Minh Đức",
    links: [{ to: "/prescriptions?view=RX2025-0003", label: "Xem đơn" }],
  },
  {
    id: "n6",
    ts: "2025-03-01T08:00:00+07:00",
    type: "message",
    unread: false,
    title: "Tin nhắn nội bộ",
    body: "Điều dưỡng nhắc BS. Hà xác nhận ca trực chiều nay.",
    links: [{ to: "/departments", label: "Lịch trực" }],
  },
  {
    id: "n7",
    ts: "2025-02-27T18:30:00+07:00",
    type: "system",
    unread: false,
    title: "Bảo trì hệ thống",
    body: "Hệ thống sẽ bảo trì lúc 22:00–23:30 hôm nay.",
  },
  {
    id: "n8",
    ts: "2025-02-26T07:45:00+07:00",
    type: "staff",
    unread: false,
    title: "Phân công nhân sự",
    body: "Điều chỉnh kíp trực khoa Nội ngày mai.",
    links: [{ to: "/departments", label: "Xem phân công" }],
  },
];

function seedIfEmpty() {
  if (!localStorage.getItem(LS_KEY)) {
    localStorage.setItem(LS_KEY, JSON.stringify(SEED));
  }
}
seedIfEmpty();

export function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveNotifications(list) {
  localStorage.setItem(LS_KEY, JSON.stringify(list || []));
}

export function markAllRead() {
  const curr = loadNotifications().map((n) => ({ ...n, unread: false }));
  saveNotifications(curr);
  return curr;
}

export function todayStats(notis = []) {
  const d = new Date().toISOString().slice(0, 10);
  const today = notis.filter((n) => (n.ts || "").slice(0, 10) === d);
  const unreadToday = today.filter((n) => n.unread).length;
  return { todayTotal: today.length, unreadToday };
}
