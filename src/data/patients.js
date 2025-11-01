// src/data/patients.js
// ===============================================
// Mock Patients Store + Helpers for the demo app
// ===============================================

// ====== TRẠNG THÁI CHUẨN ======
export const STATUSES = {
  WAIT_INTAKE: "Chờ tiếp nhận",
  WAIT_EXAM: "Chờ khám",
  WAIT_PROC: "Chờ xử lý",
  SCHEDULED_APPT: "Hẹn khám",
  SCHEDULED_FUP: "Hẹn tái khám",
  DONE: "Hoàn thành",
};

// ====== STORE & EVENT BUS ======
const listeners = new Set();
const emit = () => {
     // gọi các subscriber trong SPA
     listeners.forEach((fn) => fn(getAll()));
     // bắn sự kiện global cho mọi màn hình/route khác
     try {
       window.dispatchEvent(new CustomEvent("patients:changed"));
     } catch {}
   };
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

// ====== DỮ LIỆU MẪU ======
export const PATIENTS = [
  // Các hồ sơ đồng bộ với appointments.js (BN001..BN012)
  {
    id: "BN001",
    name: "Nguyễn Văn An",
    dob: "1990-03-12",
    gender: "Nam",
    phone: "0901234567",
    email: "an.nguyen@example.com",
    address: "12 Trần Quang Diệu, Q.3, TP.HCM",
    insurance: "Có",
    status: STATUSES.WAIT_PROC,
    allergies: "Không",
    chronicConditions: "Tăng huyết áp độ I",
    currentMedications: "Amlodipine 5mg/ngày",
    bloodGroup: "O+",
    heightCm: 170,
    weightKg: 68,
    lastVitals: { bp: "125/80", hr: 76, rr: 18, spo2: 98, temp: 36.7 },
  },
  {
    id: "BN002",
    name: "Trần Thị Bình",
    dob: "1985-11-25",
    gender: "Nữ",
    phone: "0902223333",
    email: "binh.tran@example.com",
    address: "45 Lê Văn Sỹ, Q.Phú Nhuận, TP.HCM",
    insurance: "Không",
    status: STATUSES.SCHEDULED_APPT, // giữ chỗ bởi y tá
    heightCm: 160,
    weightKg: 52,
    lastVitals: { bp: "118/76", hr: 74, rr: 17, spo2: 99, temp: 36.6 },
  },
  {
    id: "BN003",
    name: "Lê Quốc Cường",
    dob: "1978-07-09",
    gender: "Nam",
    phone: "0909990000",
    email: "cuong.le@example.com",
    address: "88 Nguyễn Văn Cừ, Q.5, TP.HCM",
    insurance: "Có",
    status: STATUSES.SCHEDULED_FUP, // tái khám đã hẹn
    chronicConditions: "Tiểu đường type 2",
    currentMedications: "Metformin 500mg x2",
    heightCm: 172,
    weightKg: 74,
    lastVitals: { bp: "132/86", hr: 82, rr: 18, spo2: 97, temp: 36.8 },
  },
  // ➕ “Chờ xử lý” để test nút "Xử lý & chẩn đoán"
  {
    id: "BN004",
    name: "Phạm Minh Dũng",
    dob: "1993-04-01",
    gender: "Nam",
    phone: "0911223344",
    email: "dung.pham@example.com",
    address: "21 Võ Văn Tần, Q.3, TP.HCM",
    insurance: "Có",
    status: STATUSES.WAIT_PROC,
    allergies: "Penicillin",
    heightCm: 175,
    weightKg: 70,
    lastVitals: { bp: "124/78", hr: 72, rr: 18, spo2: 98, temp: 36.5 },
  },
  // ====== Thêm bệnh nhân để phủ đủ case ======
  {
    id: "BN005",
    name: "Vũ Hồng Hạnh",
    dob: "1992-09-10",
    gender: "Nữ",
    phone: "0905556677",
    email: "hanh.vu@example.com",
    address: "99 Trần Hưng Đạo, Q.1, TP.HCM",
    insurance: "Có",
    status: STATUSES.SCHEDULED_APPT,
  },
  {
    id: "BN006",
    name: "Đỗ Mỹ E",
    dob: "2000-02-20",
    gender: "Nữ",
    phone: "0901010101",
    email: "my.do@example.com",
    address: "22 Nguyễn Du, Q.1, TP.HCM",
    insurance: "Không",
    status: STATUSES.SCHEDULED_APPT,
  },
  {
    id: "BN007",
    name: "Võ Gia F",
    dob: "1988-12-12",
    gender: "Nam",
    phone: "0902323232",
    email: "gia.vo@example.com",
    address: "11 Hoàng Hoa Thám, Bình Thạnh, TP.HCM",
    insurance: "Có",
    status: STATUSES.SCHEDULED_FUP,
  },
  {
    id: "BN008",
    name: "Hà Minh G",
    dob: "1996-05-03",
    gender: "Nam",
    phone: "0904545454",
    email: "minh.ha@example.com",
    address: "5 Cách Mạng Tháng 8, Q.10, TP.HCM",
    insurance: "Không",
    status: STATUSES.WAIT_EXAM,
  },
  {
    id: "BN009",
    name: "Ngô Quang H",
    dob: "1975-04-28",
    gender: "Nam",
    phone: "0906767676",
    email: "quang.ngo@example.com",
    address: "7 Võ Thị Sáu, Q.3, TP.HCM",
    insurance: "Có",
    status: STATUSES.DONE,
  },
  {
    id: "BN010",
    name: "Lương Thế K",
    dob: "1983-07-07",
    gender: "Nam",
    phone: "0908989898",
    email: "the.luong@example.com",
    address: "15 Lý Tự Trọng, Q.1, TP.HCM",
    insurance: "Không",
    status: STATUSES.SCHEDULED_APPT,
  },
  {
    id: "BN011",
    name: "Phan Bảo L",
    dob: "1991-01-11",
    gender: "Nam",
    phone: "0901111222",
    email: "bao.phan@example.com",
    address: "18 Nguyễn Thái Học, Q.1, TP.HCM",
    insurance: "Có",
    status: STATUSES.SCHEDULED_FUP,
  },
  {
    id: "BN012",
    name: "Đặng Thu M",
    dob: "1994-08-18",
    gender: "Nữ",
    phone: "0903333444",
    email: "thu.dang@example.com",
    address: "3 Nguyễn Bỉnh Khiêm, Q.1, TP.HCM",
    insurance: "Có",
    status: STATUSES.SCHEDULED_APPT,
  },
];

/* ===================== DEMO BỔ SUNG (đủ mọi trạng thái) ===================== */
// Quy ước: Các BN1xx chỉ dành cho demo luồng UI / queue.
// Có cả case dịch vụ: chờ tiếp nhận(dịch vụ), chờ khám(dịch vụ), chờ xử lý(dịch vụ)
PATIENTS.push(
  // 1) Chờ tiếp nhận (thường) → test "Lập phiếu khám"
  { id:"BN101", name:"Đinh Lan A", dob:"1993-01-10", gender:"Nữ", phone:"0911000001",
    email:"a.lan@example.com", address:"1 Lê Lợi, Q.1", insurance:"Có",
    status: STATUSES.WAIT_INTAKE, allergies:"Penicillin", chronicConditions:"Viêm mũi dị ứng", currentMedications:"Cetirizine 10mg" },

  // 2) Hẹn khám
  { id:"BN102", name:"Phạm Quốc B", dob:"1986-05-12", gender:"Nam", phone:"0911000002",
    email:"b.quoc@example.com", address:"2 Hai Bà Trưng, Q.1", insurance:"Không",
    status: STATUSES.SCHEDULED_APPT },

  // 3) Hẹn tái khám
  { id:"BN103", name:"Trương Minh C", dob:"1979-08-21", gender:"Nam", phone:"0911000003",
    email:"c.minh@example.com", address:"3 Pasteur, Q.1", insurance:"Có",
    status: STATUSES.SCHEDULED_FUP },

  // 4) Chờ khám (thường)
  { id:"BN104", name:"Ngô Mỹ D", dob:"1992-12-09", gender:"Nữ", phone:"0911000004",
    email:"d.my@example.com", address:"4 Trần Hưng Đạo, Q.1", insurance:"Có",
    status: STATUSES.WAIT_EXAM },

  // 5) Chờ xử lý (thường)
  { id:"BN105", name:"Hoàng Gia E", dob:"1988-03-03", gender:"Nam", phone:"0911000005",
    email:"e.gia@example.com", address:"5 Nguyễn Huệ, Q.1", insurance:"Không",
    status: STATUSES.WAIT_PROC,
    pendingProcess: {
      services: ["X-Quang phổi thẳng", "Xét nghiệm máu tổng quát"],
      dx: {
        dxPrimary: "Viêm phế quản cấp",
        icd10: "J20",
        dxSecondary: "—",
        summary: "Ho khan, đau ngực nhẹ 3 ngày, không sốt.",
        orders: "Thuốc ho  CLS nếu không cải thiện",
        advice: "Uống nước ấm, theo dõi sốt",
        followup: "Cho thuốc về",
        followupDate: "",
        followupTime: ""
      }
    }
  },

  // 6) Hoàn thành
  { id:"BN106", name:"Đoàn Thảo F", dob:"1995-10-01", gender:"Nữ", phone:"0911000006",
    email:"f.thao@example.com", address:"6 CMT8, Q.3", insurance:"Có",
    status: STATUSES.DONE },

  // 7) Chờ tiếp nhận (dịch vụ) — có dịch vụ & chưa dispatch
  { id:"BN107", name:"Bùi Tuấn G", dob:"1990-04-18", gender:"Nam", phone:"0911000007",
    email:"g.tuan@example.com", address:"7 Điện Biên Phủ, Q.3", insurance:"Có",
    status: "Chờ tiếp nhận (dịch vụ)",
    serviceOrder: {
      items: ["T-KHAM-DV", "X-Quang phổi thẳng", "Siêu âm bụng tổng quát"],
      note: "Chỉ định từ phòng Nội tổng quát",
      fromDoctor: "BS. Trần Văn Nam",
      dispatched: false
    }
  },

  // 8) Chờ khám (dịch vụ) — đã đẩy sang khu dịch vụ (đã thu phí)
  { id:"BN108", name:"Trần Hà H", dob:"1987-07-22", gender:"Nữ", phone:"0911000008",
    email:"h.ha@example.com", address:"8 Võ Thị Sáu, Q.3", insurance:"Không",
    status: "Chờ khám (dịch vụ)",
    serviceOrder: {
      items: ["Xét nghiệm máu tổng quát"],
      note: "Theo dõi lipid",
      fromDoctor: "BS. Lê Văn Hùng",
      dispatched: true
    }
  },

  // 9) Chờ xử lý (dịch vụ) — có kết quả dịch vụ để test "chỉ xem"
  { id:"BN109", name:"Vũ Minh I", dob:"1983-11-30", gender:"Nam", phone:"0911000009",
    email:"i.minh@example.com", address:"9 Hoàng Sa, Q.1", insurance:"Có",
    status: "Chờ xử lý (dịch vụ)",
    serviceOrder: {
      items: ["Siêu âm bụng tổng quát"],
      note: "Nghi sỏi túi mật",
      fromDoctor: "BS. Phạm Thu Lan",
      dispatched: true
    },
    // 👉 dữ liệu mẫu để ExamDetail/Patient modal hiển thị "Kết quả dịch vụ (chỉ xem)"
    pendingServiceResults: [
      {
        id: "ultrasound",
        name: "Siêu âm bụng tổng quát",
        status: "Hoàn tất",
        result: "Gan kích thước bình thường, túi mật có sỏi 6mm. Không ứ dịch.",
        note: "Nhịn ăn trước 6 giờ.",
        files: [
          { url: "/mock/ultrasound-report.pdf", name: "Báo cáo siêu âm (PDF)" }
        ]
      },
      {
        id: "blood",
        name: "Xét nghiệm máu tổng quát",
        status: "Chưa có kết quả",
        result: "",
        note: ""
      }
    ]
  }
);

// ====== LỊCH SỬ KHÁM (VISITS) ======
export const VISITS = {
  BN001: [
    { date: "2025-10-15", dept: "Nội tổng quát", doctor: "BS. Trần Văn Nam", note: "Khám ban đầu: Cao huyết áp độ I. Kê đơn Amlodipine 5mg/ngày.", by: "Bác sĩ", type: "Khám lần đầu" },
    { date: "2025-10-22", dept: "Nội tổng quát", doctor: "BS. Trần Văn Nam", note: "Tái khám: Huyết áp ổn định. Tiếp tục điều trị.", by: "Bác sĩ", type: "Tái khám" },
  ],
  BN002: [
    { date: "2025-10-20", dept: "Sản phụ khoa", doctor: "BS. Nguyễn Thị Mai", note: "Khám thai 8 tuần. Tình trạng ổn. Dặn tái khám sau 2 tuần.", by: "Bác sĩ", type: "Khám thai định kỳ" },
  ],
  BN003: [
    { date: "2025-10-18", dept: "Nội tiết", doctor: "BS. Hồ Minh Tâm", note: "ĐK: T2 ổn. Kế hoạch: Tái khám sau 7 ngày (2025-10-25) cùng BS.", by: "Bác sĩ", type: "Kết luận" },
    { date: "2025-10-12", dept: "Nội tiết", doctor: "BS. Hồ Minh Tâm", note: "Khám định kỳ: Đường huyết ổn. Chỉnh liều Metformin.", by: "Bác sĩ", type: "Tái khám" },
  ],
  BN004: [
    { date: "2025-10-24", dept: "Nội tổng quát", doctor: "BS. Lê Văn Hùng", note: "Triệu chứng: Sốt, ho, đau đầu. Chẩn đoán: Cảm cúm. Kê đơn thuốc.", by: "Bác sĩ", type: "Khám ban đầu" },
  ],
  BN009: [
    { date: "2025-10-28", dept: "Tim mạch", doctor: "BS. Phạm Dũng", note: "Tái khám tim mạch, đã hoàn thành.", by: "Bác sĩ", type: "Tái khám" },
  ],
  BN105: [
    { date:"2025-10-28", dept:"Nội tổng quát", doctor:"BS. Trần Văn Nam", note:"Tiếp nhận • Khám thường • Triệu chứng: ho khan 3 ngày", by:"Lễ tân", type:"Walk-in" }
  ],
  BN106: [
    { date:"2025-10-20", dept:"Nội tiết", doctor:"BS. Hồ Minh Tâm", note:"Kết thúc khám: ĐTĐ type 2 ổn định", by:"Bác sĩ", type:"Kết thúc khám" }
  ],
  BN107: [
    { date:"2025-10-29", dept:"Phòng khám", doctor:"BS. Trần Văn Nam", note:"Chỉ định khám dịch vụ trước", by:"Bác sĩ", type:"Chỉ định dịch vụ" }
  ],
  BN108: [
    { date:"2025-10-29", dept:"Cận lâm sàng", doctor:"Khu dịch vụ", note:"Đã thu phí, chờ lấy mẫu xét nghiệm", by:"Điều dưỡng CLS", type:"Dịch vụ" }
  ],
  BN109: [
    { date:"2025-10-29", dept:"Cận lâm sàng", doctor:"Khu dịch vụ", note:"Có kết quả siêu âm bụng", by:"Điều dưỡng CLS", type:"Dịch vụ hoàn tất" }
  ]
};

// ====== GIAO DỊCH (TRANSACTIONS) ======
export const TRANSACTIONS = {
  BN001: [
    { date: "2025-10-15", item: "Phí khám (Khám thường)", amount: 35000, status: "Đã thu", ref: "WI-15-1" },
    { date: "2025-10-22", item: "Phí khám (Tái khám)", amount: 0, status: "Đúng hẹn", ref: "FU-22-1" },
  ],
  BN002: [
    { date: "2025-10-20", item: "Phí khám  Siêu âm thai", amount: 350000, status: "Đã thu", ref: "AP-20-1" },
  ],
  BN003: [
    { date: "2025-10-12", item: "Phí khám (Nội tiết)", amount: 200000, status: "Đã thu", ref: "FU-12-1" },
    { date: "2025-10-18", item: "Phí khám (Tái khám - Đúng hẹn)", amount: 0, status: "Đúng hẹn", ref: "FU-18-1" },
  ],
  BN004: [
    { date: "2025-10-24", item: "Phí khám (Khám thường)", amount: 35000, status: "Đã thu", ref: "WI-24-1" },
    { date: "2025-10-24", item: "Thuốc", amount: 150000, status: "Đã thu", ref: "RX-24-1" },
  ],
  BN009: [
    { date: "2025-10-28", item: "Phí khám (Tái khám Tim mạch)", amount: 200000, status: "Đã thu", ref: "FU-28-1" },
  ],
  BN108: [
    { date:"2025-10-29", item:"Phí dịch vụ (1 hạng mục)", amount:350000, status:"Đã thu", ref:"SV-108-1" }
  ]
};

// ====== GIỮ CHỖ/LỊCH HẸN LIÊN QUAN BỆNH NHÂN ======
function ymd(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

const _APPOINTMENT_HOLDS = [
  // Hẹn khám BN002
  {
    id: "HOLD-APPT-1",
    pid: "BN002",
    patient: "Trần Thị Bình",
    type: "appointment",
    date: ymd(1), // ví dụ
    time: "15:30",
    dept: "Nội tổng quát",
    doctor: "BS. Phạm Thu Lan",
    note: "Quá tải ngày 26 → chuyển 27",
    status: "scheduled",
  },
  // Hẹn tái khám BN003
  {
    id: "HOLD-FUP-1",
    pid: "BN003",
    patient: "Lê Quốc Cường",
    type: "followup",
    date: ymd(1),
    time: "09:00",
    dept: "Nội tiết",
    doctor: "BS. Hồ Minh Tâm",
    note: "Tái khám sau chỉnh liều",
    status: "scheduled",
  },
  // Late — BN011
  {
    id: "HOLD-LATE-BN011",
    pid: "BN011",
    patient: "Phan Bảo L",
    type: "followup",
    date: ymd(0),
    time: "08:15",
    dept: "Nội tổng quát",
    doctor: "BS. Nguyễn An",
    note: "Có dấu hiệu đến trễ.",
    status: "scheduled",
  },
  // Very late — BN012
  {
    id: "HOLD-VLATE-BN012",
    pid: "BN012",
    patient: "Đặng Thu M",
    type: "appointment",
    date: ymd(0),
    time: "07:45",
    dept: "Tai mũi họng",
    doctor: "BS. Trần Bình",
    note: "Rất trễ → xử lý như walk-in.",
    status: "scheduled",
  },
  // Early — BN008
  {
    id: "HOLD-EARLY-BN008",
    pid: "BN008",
    patient: "Hà Minh G",
    type: "appointment",
    date: ymd(1),
    time: "10:00",
    dept: "Da liễu",
    doctor: "BS. Lê Chi",
    note: "Có thể đến sớm >20'.",
    status: "scheduled",
  },
  // Hẹn khám cho BN102
  { id:"HOLD-APPT-BN102", pid:"BN102", patient:"Phạm Quốc B", type:"appointment",
    date: ymd(0), time:"10:00", dept:"Nội tổng quát", doctor:"BS. Lê Văn Hùng",
    note:"Đến đúng giờ", status:"scheduled" },
  // Hẹn tái khám cho BN103
  { id:"HOLD-FUP-BN103", pid:"BN103", patient:"Trương Minh C", type:"followup",
    date: ymd(1), time:"09:00", dept:"Nội tiết", doctor:"BS. Hồ Minh Tâm",
    note:"Tái khám định kỳ", status:"scheduled" }
];

// ====== CRUD / HELPERS ======
export function getAll() { return PATIENTS.map((p) => ({ ...p })); }
export function findById(pid) { const p = PATIENTS.find((x) => x.id === pid); return p ? { ...p } : null; }
export function indexOf(pid) { return PATIENTS.findIndex((x) => x.id === pid); }
export function listPatients() { return getAll(); }
export const listAllPatients = listPatients;

export function addOne(p) { PATIENTS.push({ ...p }); emit(); }

export function updateOne(pid, patch) {
  const i = PATIENTS.findIndex((p) => p.id === pid);
  if (i === -1) return;
  const cur = PATIENTS[i];
  PATIENTS[i] = typeof patch === "function" ? { ...cur, ...patch(cur) } : { ...cur, ...patch };
  emit();
}

export function addVisit(pid, v) { (VISITS[pid] ||= []).push({ ...v }); emit(); }
export function addTransaction(pid, t) { (TRANSACTIONS[pid] ||= []).push({ ...t }); emit(); }

export function addAppointmentHold({ pid, patient, date, time, dept, doctor, type = "appointment", note = "" }) {
  const id = `HOLD-${Math.random().toString(36).slice(2)}`;
  _APPOINTMENT_HOLDS.push({ id, pid, patient, type, date, time, dept, doctor, note, status: "scheduled" });
  return id;
}
export function createFollowupHold({ pid, patient, date, time, dept, doctor, note = "" }) {
  return addAppointmentHold({ pid, patient, date, time, dept, doctor, type: "followup", note });
}
export function listAppointmentHolds(pid) {
  return _APPOINTMENT_HOLDS.filter((h) => h.pid === pid).map((h) => ({ ...h }));
}
export function markAppointmentCheckedIn(holdId) {
  const h = _APPOINTMENT_HOLDS.find((x) => x.id === holdId);
  if (h) h.status = "checked-in";
}
export function markAppointmentDone(holdId) {
  const i = _APPOINTMENT_HOLDS.findIndex((x) => x.id === holdId);
  if (i !== -1) _APPOINTMENT_HOLDS.splice(i, 1);
}
export function markAppointmentDoneForPid(pid) {
  const ids = _APPOINTMENT_HOLDS.filter(h => h.pid === pid).map(h => h.id);
  ids.forEach(markAppointmentDone);
}
export function getLastVisit(pid) {
  const arr = VISITS[pid] || [];
  return arr.length ? arr[arr.length - 1] : null;
}

// ====== LEGACY TEMPLATE CATALOG (giữ tương thích) ======
export const TEMPLATE_CATALOG = [
  { id: "T-KHAM-THUONG", title: "Khám thường", price: 35000, defaultDept: "Nội tổng quát", steps: ["Tiếp nhận", "Khám lâm sàng", "Chỉ định CLS", "Kết luận & đơn thuốc"] },
  { id: "T-TONG-QUAT", title: "Khám tổng quát", price: 150000, defaultDept: "Nội tổng quát", steps: ["Khám tổng thể", "Xét nghiệm máu", "Điện tim", "Kết luận"] },
  { id: "T-DICH-VU", title: "Khám dịch vụ", price: 300000, defaultDept: "Nội tổng quát", steps: ["Khám chi tiết", "Xét nghiệm", "Chẩn đoán hình ảnh", "Tư vấn"] },
  { id: "T-NOI-TIET", title: "Khám Nội tiết", price: 200000, defaultDept: "Nội tiết", steps: ["Đo đường huyết", "Đánh giá điều trị", "Điều chỉnh liều", "Hẹn tái khám"] },
  { id: "T-TIM-MACH", title: "Khám Tim mạch", price: 250000, defaultDept: "Tim mạch", steps: ["Điện tim", "Siêu âm tim", "Đánh giá tim", "Kết luận"] },
  { id: "T-THUYET-MINH", title: "Khám Thần kinh", price: 220000, defaultDept: "Thần kinh", steps: ["Khám thần kinh", "Điện não đồ", "Đánh giá", "Kết luận"] },
];

// ====== DANH MỤC KHOA / BÁC SĨ (dùng cho selector) ======
export const DEPARTMENTS = [
  { id: "NOI-TONG-QUAT", name: "Nội tổng quát", rooms: ["P.201", "P.202", "P.203"], doctors: ["BS. Trần Văn Nam", "BS. Phạm Thu Lan", "BS. Lê Văn Hùng", "BS. Nguyễn An"] },
  { id: "NOI-TIET", name: "Nội tiết", rooms: ["P.301", "P.302"], doctors: ["BS. Hồ Minh Tâm", "BS. Nguyễn Thị Hoa"] },
  { id: "TIM-MACH", name: "Tim mạch", rooms: ["P.401"], doctors: ["BS. Trần Đức Long"] },
  { id: "THAN-KINH", name: "Thần kinh", rooms: ["P.501"], doctors: ["BS. Lê Minh Tuấn"] },
  { id: "SAN-PHU-KHOA", name: "Sản phụ khoa", rooms: ["P.601", "P.602"], doctors: ["BS. Nguyễn Thị Mai", "BS. Phạm Thị Hương"] },
  { id: "DA-LIEU", name: "Da liễu", rooms: ["P.701", "P.702"], doctors: ["BS. Lê Chi"] },
  { id: "TAI-MUI-HONG", name: "Tai mũi họng", rooms: ["P.801"], doctors: ["BS. Trần Bình"] },
];

export const DOCTORS_QUEUE = {
  "BS. Trần Văn Nam": { dept: "Nội tổng quát", waiting: 3, appointments: 5, status: "Hoạt động" },
  "BS. Phạm Thu Lan": { dept: "Nội tổng quát", waiting: 1, appointments: 3, status: "Hoạt động" },
  "BS. Lê Văn Hùng": { dept: "Nội tổng quát", waiting: 0, appointments: 2, status: "Hoạt động" },
  "BS. Nguyễn An": { dept: "Nội tổng quát", waiting: 0, appointments: 2, status: "Hoạt động" },
  "BS. Hồ Minh Tâm": { dept: "Nội tiết", waiting: 2, appointments: 4, status: "Hoạt động" },
  "BS. Nguyễn Thị Hoa": { dept: "Nội tiết", waiting: 1, appointments: 1, status: "Hoạt động" },
  "BS. Trần Đức Long": { dept: "Tim mạch", waiting: 2, appointments: 3, status: "Hoạt động" },
  "BS. Lê Minh Tuấn": { dept: "Thần kinh", waiting: 1, appointments: 2, status: "Hoạt động" },
  "BS. Nguyễn Thị Mai": { dept: "Sản phụ khoa", waiting: 0, appointments: 6, status: "Hoạt động" },
  "BS. Phạm Thị Hương": { dept: "Sản phụ khoa", waiting: 1, appointments: 4, status: "Hoạt động" },
  "BS. Lê Chi": { dept: "Da liễu", waiting: 0, appointments: 2, status: "Hoạt động" },
  "BS. Trần Bình": { dept: "Tai mũi họng", waiting: 0, appointments: 2, status: "Hoạt động" },
};
