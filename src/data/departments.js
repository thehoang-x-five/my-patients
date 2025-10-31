// src/data/departments.js
// DỮ LIỆU MẪU (mỗi item = 1 PHÒNG, thuộc 1 KHOA)

export const WEEK_TEMPLATE = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const DEPARTMENTS = [
  {
    id: "room-201",
    short: "TM",
    name: "Khoa Tim mạch",
    head: "TS.BS. Nguyễn Văn Tâm",
    room: {
      number: "201",
      status: true,
      area: "Tầng 2 - Khu A",
      phone: "0243 555 100",
      services: ["Khám tim mạch", "Siêu âm tim", "Tư vấn điều trị"]
    },
    doctorInCharge: "BS. Trần Hữu Phước",
    nurseInCharge: "ĐD. Lê Thị Hồng",
    waitingPatients: 5,
    examinedPatients: 18,
    capacityPerDay: 40,
    avgWaitMin: 18,
    lastUpdated: "2025-10-20T09:35:00+07:00",
    equipments: ["Máy siêu âm tim", "Monitor theo dõi", "ECG 12 chuyển đạo"],
    notes: "Ưu tiên bệnh nhân có lịch hẹn trước; tái khám vào buổi chiều.",
    doctors: ["BS. Trần Hữu Phước", "BS. Phạm Quang Lâm", "BS. Lê Tuấn"],
    nurses: ["ĐD. Lê Thị Hồng", "ĐD. Nguyễn Thị Xuân", "ĐD. Đoàn Thu Hà"]
  },
  {
    id: "room-305",
    short: "TK",
    name: "Khoa Thần kinh",
    head: "BSCKII. Phạm Hồng Sơn",
    room: {
      number: "305",
      status: true,
      area: "Tầng 3 - Khu B",
      phone: "0243 555 200",
      services: ["Khám thần kinh", "Điện não đồ"]
    },
    doctorInCharge: "BS. Đỗ Minh Khoa",
    nurseInCharge: "ĐD. Trần Thu Thảo",
    waitingPatients: 2,
    examinedPatients: 12,
    capacityPerDay: 32,
    avgWaitMin: 22,
    lastUpdated: "2025-10-21T10:10:00+07:00",
    equipments: ["Máy EEG", "Búa phản xạ", "Đèn khám"],
    notes: "Khuyến cáo không tự ý ngưng thuốc; có tư vấn tuân thủ điều trị.",
    doctors: ["BS. Đỗ Minh Khoa", "BS. Đào Duy Tân"],
    nurses: ["ĐD. Trần Thu Thảo", "ĐD. Vũ Hải Yến"]
  },
  {
    id: "room-112",
    short: "TMH",
    name: "Khoa Tai Mũi Họng",
    head: "BSCKI. Lưu Thị Lan",
    room: {
      number: "112",
      status: false,
      area: "Tầng 1 - Khu A",
      phone: "0243 555 300",
      services: ["Khám TMH", "Nội soi TMH"]
    },
    doctorInCharge: "BS. Đinh Đức Huy",
    nurseInCharge: "ĐD. Phạm Mai",
    waitingPatients: 0, // inactive ⇒ 0
    examinedPatients: 0,
    capacityPerDay: 28,
    avgWaitMin: 0,
    lastUpdated: "2025-10-15T16:00:00+07:00",
    equipments: ["Đèn Clar", "Ống nội soi TMH"],
    notes: "Tạm dừng hoạt động để bảo trì thiết bị.",
    doctors: ["BS. Đinh Đức Huy", "BS. Nguyễn Văn Hậu"],
    nurses: ["ĐD. Phạm Mai", "ĐD. Nguyễn Thị Thanh"]
  },
  {
    id: "room-409",
    short: "Da",
    name: "Khoa Da liễu",
    head: "ThS.BS. Nguyễn Hồng Nhung",
    room: {
      number: "409",
      status: true,
      area: "Tầng 4 - Khu C",
      phone: "0243 555 400",
      services: ["Khám da liễu", "Tư vấn thẩm mỹ"]
    },
    doctorInCharge: "BS. Lưu Đức Long",
    nurseInCharge: "ĐD. Bùi Thị Hằng",
    waitingPatients: 7,
    examinedPatients: 22,
    capacityPerDay: 36,
    avgWaitMin: 25,
    lastUpdated: "2025-10-22T08:55:00+07:00",
    equipments: ["Đèn Wood", "Máy soi da"],
    notes: "Hạn chế mỹ phẩm trước khám ít nhất 24 giờ.",
    doctors: ["BS. Lưu Đức Long", "BS. Phan Thành"],
    nurses: ["ĐD. Bùi Thị Hằng", "ĐD. Phạm Lan"]
  },
  {
    id: "room-210",
    short: "Nhi",
    name: "Khoa Nhi",
    head: "BSCKII. Trần Thị Hoa",
    room: {
      number: "210",
      status: true,
      area: "Tầng 2 - Khu A",
      phone: "0243 555 500",
      services: ["Khám nhi tổng quát", "Tiêm chủng"]
    },
    doctorInCharge: "BS. Phạm Thị Kim Ngân",
    nurseInCharge: "ĐD. Đỗ Khánh Vy",
    waitingPatients: 3,
    examinedPatients: 15,
    capacityPerDay: 38,
    avgWaitMin: 14,
    lastUpdated: "2025-10-23T11:20:00+07:00",
    equipments: ["Tủ vaccine", "Ống nghe nhi"],
    notes: "Ưu tiên trẻ dưới 2 tuổi vào buổi sáng.",
    doctors: ["BS. Phạm Thị Kim Ngân", "BS. Vũ Mạnh Hùng"],
    nurses: ["ĐD. Đỗ Khánh Vy", "ĐD. Nguyễn Thuỷ"]
  },
  {
    id: "room-512",
    short: "CTCH",
    name: "Khoa Chấn thương - Chỉnh hình",
    head: "PGS.TS. Lê Minh Tuấn",
    room: {
      number: "512",
      status: false,
      area: "Tầng 5 - Khu B",
      phone: "0243 555 600",
      services: ["Khám cơ xương khớp", "Vật lý trị liệu"]
    },
    doctorInCharge: "BS. Vũ Đức Dũng",
    nurseInCharge: "ĐD. Trịnh Thuỳ Dung",
    waitingPatients: 0, // inactive ⇒ 0
    examinedPatients: 5,
    capacityPerDay: 30,
    avgWaitMin: 0,
    lastUpdated: "2025-10-18T15:40:00+07:00",
    equipments: ["Nẹp chỉnh hình", "Băng nẹp"],
    notes: "Đang tạm ngừng tiếp nhận do di dời phòng.",
    doctors: ["BS. Vũ Đức Dũng", "BS. Đặng Anh Quân"],
    nurses: ["ĐD. Trịnh Thuỳ Dung", "ĐD. Nguyễn Mai"]
  }
];

/** LỊCH TRỰC — đủ 7 ngày/tuần, gắn theo PHÒNG (key = room id) */
export const DUTY = {
  "room-201": {
    Mon: { doc: "BS. Trần Hữu Phước", nurse: "ĐD. Lê Thị Hồng" },
    Tue: { doc: "BS. Phạm Quang Lâm", nurse: "ĐD. Nguyễn Thị Xuân" },
    Wed: { doc: "BS. Lê Tuấn", nurse: "ĐD. Đoàn Thu Hà" },
    Thu: { doc: "BS. Trần Hữu Phước", nurse: "ĐD. Lê Thị Hồng" },
    Fri: { doc: "BS. Phạm Quang Lâm", nurse: "ĐD. Nguyễn Thị Xuân" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  },
  "room-305": {
    Mon: { doc: "BS. Đỗ Minh Khoa", nurse: "ĐD. Trần Thu Thảo" },
    Tue: { doc: "BS. Đào Duy Tân", nurse: "ĐD. Vũ Hải Yến" },
    Wed: { doc: "BS. Đỗ Minh Khoa", nurse: "ĐD. Trần Thu Thảo" },
    Thu: { doc: "BS. Đào Duy Tân", nurse: "ĐD. Vũ Hải Yến" },
    Fri: { doc: "BS. Đỗ Minh Khoa", nurse: "ĐD. Trần Thu Thảo" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  },
  "room-112": {
    Mon: { doc: "BS. Đinh Đức Huy", nurse: "ĐD. Phạm Mai" },
    Tue: { doc: "BS. Nguyễn Văn Hậu", nurse: "ĐD. Nguyễn Thị Thanh" },
    Wed: { doc: "BS. Đinh Đức Huy", nurse: "ĐD. Phạm Mai" },
    Thu: { doc: "BS. Nguyễn Văn Hậu", nurse: "ĐD. Nguyễn Thị Thanh" },
    Fri: { doc: "BS. Đinh Đức Huy", nurse: "ĐD. Phạm Mai" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  },
  "room-409": {
    Mon: { doc: "BS. Lưu Đức Long", nurse: "ĐD. Bùi Thị Hằng" },
    Tue: { doc: "BS. Phan Thành", nurse: "ĐD. Phạm Lan" },
    Wed: { doc: "BS. Lưu Đức Long", nurse: "ĐD. Bùi Thị Hằng" },
    Thu: { doc: "BS. Phan Thành", nurse: "ĐD. Phạm Lan" },
    Fri: { doc: "BS. Lưu Đức Long", nurse: "ĐD. Bùi Thị Hằng" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  },
  "room-210": {
    Mon: { doc: "BS. Phạm Thị Kim Ngân", nurse: "ĐD. Đỗ Khánh Vy" },
    Tue: { doc: "BS. Vũ Mạnh Hùng", nurse: "ĐD. Nguyễn Thuỷ" },
    Wed: { doc: "BS. Phạm Thị Kim Ngân", nurse: "ĐD. Đỗ Khánh Vy" },
    Thu: { doc: "BS. Vũ Mạnh Hùng", nurse: "ĐD. Nguyễn Thuỷ" },
    Fri: { doc: "BS. Phạm Thị Kim Ngân", nurse: "ĐD. Đỗ Khánh Vy" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  },
  "room-512": {
    Mon: { doc: "BS. Vũ Đức Dũng", nurse: "ĐD. Trịnh Thuỳ Dung" },
    Tue: { doc: "BS. Đặng Anh Quân", nurse: "ĐD. Nguyễn Mai" },
    Wed: { doc: "BS. Vũ Đức Dũng", nurse: "ĐD. Trịnh Thuỳ Dung" },
    Thu: { doc: "BS. Đặng Anh Quân", nurse: "ĐD. Nguyễn Mai" },
    Fri: { doc: "BS. Vũ Đức Dũng", nurse: "ĐD. Trịnh Thuỳ Dung" },
    Sat: { doc: "Luân phiên", nurse: "Luân phiên" },
    Sun: { doc: "Luân phiên", nurse: "Luân phiên" }
  }
};
