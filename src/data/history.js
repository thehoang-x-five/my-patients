// Mock data + helpers cho trang Lịch sử

export const SERVICE_DEPTS = [
  "X-quang",
  "CT",
  "MRI",
  "Siêu âm",
  "Xét nghiệm máu",
  "Nội soi",
  "Điện tim",
];

const todayISO = () => new Date().toISOString().slice(0, 10);

// ===== Khám bệnh (visits)
export const VISITS = [
  // Khám chuyên khoa (có đơn)
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  {
    type: "visit",
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    dept: "Nội khoa",
    doctor: "BS. Trần Thị Bình",
    note: "Sốt 38.2℃, đau họng 2 ngày; họng đỏ, amidan xung huyết.",
    examRows: [
      { label: "Toàn thân", value: "Mệt mỏi nhẹ, không mất nước" },
      { label: "Hô hấp", value: "Phổi thông khí đều, không ran" },
      { label: "Tai - Mũi - Họng", value: "Amidan xung huyết, không giả mạc" },
    ],
    services: [
      { code: "CBC", name: "Xét nghiệm công thức máu", result: "BC tăng nhẹ" },
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Không thâm nhiễm" },
    ],
    diagnosis: {
      pre: "Nghi viêm họng cấp",
      final: "Viêm họng cấp",
      plan: "Hạ sốt/giảm đau; súc họng ấm; tái khám 3 ngày",
      advice: "Uống nhiều nước; theo dõi sốt",
    },
    prescriptionId: "RX2025-0001",
  },
  // Khám ngoại khoa (có đơn)
  {
    type: "visit",
    date: "2025-03-05",
    id: "BN011",
    name: "Nguyễn Nhật Long",
    dept: "Ngoại khoa",
    doctor: "BS. Nguyễn Thu Hà",
    note: "Vết rách 1.5cm cẳng tay phải; sạch, ít chảy máu.",
    examRows: [
      { label: "Da - Cơ - Xương", value: "Không tổn thương gân thần kinh" },
    ],
    services: [],
    diagnosis: {
      pre: "Vết thương phần mềm",
      final: "Vết thương phần mềm nhẹ",
      plan: "Sát khuẩn, khâu, kháng sinh dự phòng 3 ngày",
      advice: "Giữ khô; tái khám cắt chỉ sau 7 ngày",
    },
    prescriptionId: "RX2025-0003",
  },
  // Dịch vụ (không có đơn)
  {
    type: "service",
    date: todayISO(),
    id: "BN005",
    name: "Lê Thị Cúc",
    dept: "X-quang",
    doctor: "—",
    note: "Chụp X-quang ngực thẳng",
    services: [
      { code: "XQ-CH", name: "X-quang ngực thẳng", result: "Bình thường" },
    ],
  },
  {
    type: "service",
    date: "2025-02-12",
    id: "BN012",
    name: "Huỳnh Gia Hân",
    dept: "Xét nghiệm máu",
    doctor: "—",
    note: "Công thức máu + men gan",
    services: [
      {
        code: "CBC",
        name: "Công thức máu",
        result: "Trong giới hạn bình thường",
      },
      { code: "LFT", name: "Men gan", result: "ALT/AST bình thường" },
    ],
  },
];

// ===== Giao dịch (transactions)
export const TRANSACTIONS = [
  {
    date: todayISO(),
    id: "BN001",
    name: "Nguyễn Văn An",
    content: "Tạm thu khám bệnh",
    money: 80000,
    invoiceId: "INV-001",
    drugsFee: 68000, // có phí thuốc
    rxId: "RX2025-0001", // liên kết sang đơn thuốc
  },
  {
    date: "2025-01-22",
    id: "BN005",
    name: "Lê Thị Cúc",
    content: "Phí X-quang",
    money: 150000,
    invoiceId: "INV-002",
  },
  {
    date: "2025-01-22",
    id: "BN012",
    name: "Huỳnh Gia Hân",
    content: "Phí xét nghiệm máu",
    money: 120000,
    invoiceId: "INV-003",
  },
];

// ===== Helpers
export const isServiceDept = (name) => SERVICE_DEPTS.includes(name);

export const todayStats = (visits = [], txns = []) => {
  const d = new Date().toISOString().slice(0, 10);
  const v = visits.filter((r) => r.date === d).length;
  const tRows = txns.filter((r) => r.date === d);
  const tSum = tRows.reduce((a, b) => a + (Number(b.money) || 0), 0);
  return { vCount: v, tCount: tRows.length, tSum };
};
