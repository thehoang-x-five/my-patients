// src/data/overview.js
const two = (n) => n.toString().padStart(2, "0");
const now = new Date();
const todayISO = now.toISOString().slice(0, 10);

// tạo 24 điểm cho sparkline theo giờ trong ngày
function build24(min = 5, max = 50, scale = 1) {
  const arr = [];
  for (let h = 0; h < 24; h++) {
    const base =
      h < 7
        ? Math.random() * (min / 2)
        : h < 12
        ? min + Math.random() * (max - min)
        : h < 17
        ? min + Math.random() * (max - min)
        : Math.random() * max * 0.8;
    arr.push({ hour: two(h), value: Math.round(base * scale) });
  }
  return arr;
}

export const kpi = {
  patientsToday: {
    value: "148",
    delta: "+9%",
    meta: "Đã xử lý: 96 • Chờ: 13 • Hủy: 3",
    spark: build24(2, 12, 1.4),
  },
  appointments: {
    value: "62",
    delta: "+4%",
    meta: "Đã xác nhận: 52 • Chờ: 13 • Hủy: 3",
    spark: build24(0, 6, 1.2),
  },
  revenue: {
    value: "₫ 128.500.000",
    delta: "+11%",
    meta: "BHYT: 38% • Dịch vụ: 62%",
    spark: build24(500, 6500, 1200 / 1000), // pattern tăng nhẹ theo giờ
  },
  satisfaction: {
    value: "94%",
    delta: "-1%",
    meta: "Phản hồi mới: 17 • Trung vị: 4.6/5",
    spark: build24(40, 95, 1),
  },
};

export const upcomingAppointments = [
  {
    id: "a1",
    patient: "Nguyễn Văn An",
    service: "Khám mới · Nội tổng quát",
    at: "08:30",
    status: "Đã xác nhận",
    statusTone: "ok",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a2",
    patient: "Lê Thị Cúc",
    service: "Tái khám · Tai-Mũi-Họng",
    at: "09:15",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a3",
    patient: "Phạm Minh Đức",
    service: "Khám định kỳ · Nhi",
    at: "10:00",
    status: "Đã xác nhận",
    statusTone: "ok",
  },
  {
    id: "a4",
    patient: "Trần Mỹ Linh",
    service: "Tư vấn online",
    at: "11:20",
    status: "Chờ xác nhận",
    statusTone: "warn",
  },
  {
    id: "a5",
    patient: "Võ Gia Hào",
    service: "Chụp X-quang",
    at: "14:10",
    status: "Đã xác nhận",
    statusTone: "ok",
  },
  {
    id: "a6",
    patient: "Đỗ Nhật Nam",
    service: "Siêu âm ổ bụng",
    at: "15:40",
    status: "Đã xác nhận",
    statusTone: "ok",
  },
];

export const scheduleTasks = {
  timeline: [
    { at: "08:00", title: "Ca trực sáng", dept: "Tiếp nhận" },
    { at: "10:00", title: "Hội chẩn ca BN BN001", dept: "Nội" },
    { at: "14:00", title: "Rà soát hồ sơ BHYT", dept: "Tài chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
    { at: "16:30", title: "Báo cáo cuối ngày", dept: "Hành chính" },
  ],
  todos: [
    "Gọi xác nhận 8 lịch hẹn chờ",
    "Duyệt 5 hóa đơn tạm ứng",
    "Ký 12 hồ sơ BHYT",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
    "Nhắn tin nhắc tái khám BN001, BN023, BN078",
  ],
};

export const alerts = [
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al1",
    level: "high",
    levelLabel: "Ưu tiên cao",
    title: "Kho dược: Paracetamol 500mg còn 8%",
    desc: "Cần đặt hàng bổ sung trong hôm nay.",
  },
  {
    id: "al2",
    level: "medium",
    levelLabel: "Cần lưu ý",
    title: "Thiết bị: Bảo trì máy X-quang 17:00",
    desc: "Sắp xếp lịch tránh ảnh hưởng vận hành.",
  },
  {
    id: "al3",
    level: "low",
    levelLabel: "Thông tin",
    title: "Phản hồi khách hàng mới",
    desc: "12 phản hồi tích cực, 2 phản hồi cần xem xét.",
  },
];

export const activities = [
  {
    id: "ac1",
    content: "Thu ngân hoàn tất 12 hóa đơn (₫ 58.2M).",
    at: "09:15",
  },
  {
    id: "ac2",
    content: "BS. Trần Thị B chốt hồ sơ bệnh nhân BN023.",
    at: "09:50",
  },
  { id: "ac3", content: "Thêm bệnh nhân mới: Phạm Thị M.", at: "10:05" },
  { id: "ac4", content: "Tạo 3 lịch hẹn tái khám cho ngày mai.", at: "11:12" },
  { id: "ac5", content: "Xử lý 4 phản hồi CSAT chấm < 4 sao.", at: "14:22" },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
  {
    id: "ac6",
    content: "Duyệt tồn thuốc tuần và ghi chú đặt hàng.",
    at: "15:40",
  },
];
