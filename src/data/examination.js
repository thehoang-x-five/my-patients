// src/data/examination.js
// ======= MOCK DATA CHO MÀN KHÁM BỆNH (Hàng chờ + Phiếu khám) =======

// Queue “walk-in” & “tái khám” đồng bộ với PatientTable (có dept, doctor, time, checkIn, source, early/late, tag…)
export const EXAM_PATIENTS = {
  direct: [
    {
      id: "BN001", pid: "BN001",
      name: "Nguyễn Văn An", age: 35, gender: "Nam",
      dept: "Nội khoa", doctor: "BS. Trần Hữu Tài",
      symptoms: "Sốt, ho khan, đau đầu",
      notes: "Bệnh nhân có tiền sử cao huyết áp",
      history: "Cao huyết áp, tiểu đường",
      allergies: "Không có",
      medications: "Metformin, Amlodipine",
      source: "walkin",
      time: "08:30",
      checkIn: Date.now() - 12 * 60 * 1000, // vào trước 12'
      early: true,
    },
    {
      id: "BN002", pid: "BN002",
      name: "Trần Thị Bình", age: 28, gender: "Nữ",
      dept: "Sản phụ khoa", doctor: "BS. Nguyễn Hà Anh",
      symptoms: "Đau bụng dưới, buồn nôn",
      notes: "Có thai 8 tuần",
      history: "Không có",
      allergies: "Penicillin",
      medications: "Folic acid",
      source: "walkin",
      time: "09:00",
      checkIn: Date.now() - 5 * 60 * 1000, // vào trước 5'
      // đúng giờ
    },
    {
      id: "BN003", pid: "BN003",
      name: "Lê Văn Cường", age: 45, gender: "Nam",
      dept: "Tim mạch", doctor: "BS. Phạm Đức Long",
      symptoms: "Đau ngực, khó thở",
      notes: "Nghi ngờ đau thắt ngực",
      history: "Rối loạn lipid máu",
      allergies: "Không có",
      medications: "Atorvastatin",
      source: "walkin",
      priority: "emergency", // hiển thị “Khẩn”
      time: "09:20",
      checkIn: Date.now() - 1 * 60 * 1000,
      late: true,
    },
  ],
  visit: [
    {
      id: "BN004", pid: "BN004",
      name: "Phạm Thị Dung", age: 60, gender: "Nữ",
      dept: "Nội khoa", doctor: "BS. Lê Khánh Huy",
      symptoms: "Tái khám sau điều trị",
      notes: "Bệnh nhân nội trú",
      history: "Viêm phổi",
      allergies: "Không có",
      medications: "Kháng sinh",
      source: "appointment",
      time: "10:00",
      checkIn: Date.now() + 10 * 60 * 1000, // chưa đến
      tag: "serviceReturn", // sẽ hiển thị pill “Tiếp tục khám”
    },
  ],
};

// Danh mục dịch vụ dùng ở ExamDetail (id, name, price)
export const EXAM_SERVICES = [
  { id: "blood",       name: "Xét nghiệm máu",      price: 120_000 },
  { id: "ultrasound",  name: "Siêu âm ổ bụng",      price: 180_000 },
  { id: "ecg",         name: "Điện tâm đồ",         price: 80_000 },
  { id: "echo",        name: "Siêu âm tim",         price: 200_000 },
  {id: "pressure", name:"Đo huyết áp",price:50_000},
  {id:"thyroid",name:"Siêu âm tuyến giáp", price:190_000},
  {id:"glucose",name:"Xét nghiệm đường huyết", price:150_000},
  {id:"lipid", name:"Xét nghiệm mỡ máu", price:150_000}
];

// Trường bổ sung (nếu muốn render ở “Thông tin chi tiết”)
export const EXTRA_FIELDS = [
  { key: "allergies",           label: "Dị ứng" },
  { key: "contraindications",   label: "Chống chỉ định" },
  { key: "chronicConditions",   label: "Bệnh mạn tính" },
  { key: "currentMedications",  label: "Thuốc đang dùng" },
  { key: "medicalHistory",      label: "Tiền sử bệnh" },
  { key: "surgeries",           label: "Tiền sử phẫu thuật" },
  { key: "immunization",        label: "Tiêm chủng" },
  { key: "bloodGroup",          label: "Nhóm máu" },
  {key: "vitals", label: "Sinh hiệu" },
];

// ⚠️ Quan trọng: ID phải khớp helper getServiceExamFee() trong PatientsTable
//   - ưu tiên "T-KHAM-DV", fallback "T-KHAM-THUONG"
export const EXAM_TEMPLATES = [
  { id: "T-KHAM-TONG-QUAT", title: "Khám nội tổng quát",                 price: 150_000, hasInsurance: true,  lateFee: 150_000 },
  { id: "T-KHAM-DV",        title: "Khám chuyên khoa",    price: 300_000, hasInsurance: false, lateFee: 300_000 },
];
