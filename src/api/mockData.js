// mockData.js
// Bật mock khi VITE_USE_MOCK !== "0" (mặc định bật nếu không cấu hình)
export const mockEnabled = String(import.meta.env?.VITE_USE_MOCK ?? "1") !== "0";

const now = new Date();
const d = (n) => new Date(now.getTime() - n * 86400000).toISOString().slice(0, 10);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const ACCOUNT = ["hoat_dong", "khong_hoat_dong", "da_xoa"];
const TODAY = [
  "Chờ tiếp nhận", "Chờ tiếp nhận (dịch vụ)",
  "Chờ khám", "Chờ khám (dịch vụ)",
  "Chờ CLS",
  "Đang khám", "Đang khám (dịch vụ)",
  "Chờ xử lý", "Chờ xử lý (dịch vụ)",
  "Hẹn khám", "Hẹn tái khám",
  "Đã khám", "Hoàn thành", "Đã hủy"
];

function makePatient(i, over = {}) {
  const id = `BN${String(1000 + i)}`;
  const name = [
    "Nguyễn Văn","Trần Thị","Lê Văn","Phạm Thị","Hoàng",
    "Võ","Phan","Vũ","Đặng","Bùi"
  ][i % 10] + " " + ["An","Bình","Châu","Dũng","Giang","Hà","Khánh","Linh","Minh","Quân"][i % 10];

  const todayStatus = TODAY[i % TODAY.length];
  const account = ACCOUNT[i % ACCOUNT.length];
  const sv = (i % 3 === 0) ? { items: ["XQ ngực thẳng"], note: "DV CLS" } :
            (i % 5 === 0) ? { items: ["Siêu âm bụng"], note: "" } : null;

  return {
    id, pid: id, name,
    phone: `09${String(10000000 + i).slice(0, 8)}`,
    email: `bn${i}@demo.local`,
    address: `Số ${i} Đường Demo, TP.HCM`,
    gioi_tinh: (i % 2 ? "Nữ" : "Nam"),
    ngay_sinh: `19${70 + (i % 30)}-0${(i % 9) + 1}-1${i % 9}`,
    nhom_mau: pick(["A", "B", "AB", "O"]),
    sinh_hieu: (i % 2) ? "M: 78 • HA: 120/80 • T: 36.8℃" : "",
    di_ung: (i % 11 === 0) ? "Penicillin" : "",
    thuoc_dang_dung: (i % 7 === 0) ? "Metformin 500mg" : "",
    tieu_su_benh: (i % 9 === 0) ? "Tăng huyết áp" : "",
    tien_su_phau_thuat: (i % 13 === 0) ? "Cắt túi mật 2018" : "",
    benh_man_tinh: (i % 6 === 0) ? "ĐTĐ type 2" : "",
    trang_thai_tai_khoan: account,
    trang_thai_hom_nay: todayStatus,
    ngay_trang_thai: d(i % 5),
    status: todayStatus,        // nhãn legacy cho FE cũ
    statusDate: d(i % 5),       // legacy
    serviceOrder: sv,
    ...over,
  };
}

export let mockPatients = Array.from({ length: 60 }, (_, i) => makePatient(i + 1));
const byId = (id) => mockPatients.find((p) => p.id === id || p.pid === id);

function filterList(list, { keyword, status, accountStatus, todayOnly }) {
  let arr = list.slice();
  if (keyword?.trim()) {
    const kw = keyword.trim().toLowerCase();
    arr = arr.filter((p) =>
      [p.name, p.phone, p.address, p.pid].some((x) => String(x || "").toLowerCase().includes(kw))
    );
  }
  if (status && status !== "Tất cả") {
    const tgt = status.toLowerCase();
    arr = arr.filter((p) => String(p.status || p.trang_thai_hom_nay || "").toLowerCase() === tgt);
  }
  if (accountStatus && accountStatus !== "tất cả") {
    const tgt = accountStatus.toLowerCase();
    arr = arr.filter((p) => String(p.trang_thai_tai_khoan || "hoat_dong").toLowerCase() === tgt);
  }
  if (todayOnly) {
    const META = new Set([
      "chờ tiếp nhận", "chờ tiếp nhận (dịch vụ)",
      "chờ khám", "chờ khám (dịch vụ)",
      "chờ cls",
      "đang khám", "đang khám (dịch vụ)",
      "chờ xử lý", "chờ xử lý (dịch vụ)",
      "hẹn khám", "hẹn tái khám"
    ]);
    arr = arr.filter((p) => META.has(String(p.status || "").toLowerCase()));
  }
  return arr;
}

export const mockPatientsApi = {
  async listPatients(params = {}) {
    const page = Number(params.page || 1);
    const pageSize = Number(params.pageSize || 50);
    let arr = filterList(mockPatients, params);
    const total = arr.length;
    const start = (page - 1) * pageSize;
    const items = arr.slice(start, start + pageSize);
    return { items, total };
  },
  async getPatient(id) {
    const p = byId(id);
    if (!p) throw new Error("Không tìm thấy bệnh nhân");
    return p;
  },
  async addPatient(payload) {
    const id = payload?.id || `BN${1000 + mockPatients.length + 1}`;
    const np = makePatient(mockPatients.length + 1, { ...payload, id, pid: id, status: payload?.status || "Chờ tiếp nhận" });
    mockPatients.unshift(np);
    return np;
  },
  async updatePatient({ id, patch }) {
    const p = byId(id);
    if (!p) throw new Error("Không tìm thấy bệnh nhân");
    Object.assign(p, patch);
    return p;
  },

  // demo visits/transactions/holds
  _visits: new Map(), _txs: new Map(), _holds: new Map(),
  async getVisits(id) { return this._visits.get(id) ?? []; },
  async addVisit({ id, payload }) {
    const v = this._visits.get(id) ?? [];
    v.push({ id: `${id}-V${v.length + 1}`, ...payload, createdAt: new Date().toISOString() });
    this._visits.set(id, v);
    return v.at(-1);
  },
  async getTransactions(id) { return this._txs.get(id) ?? []; },
  async addTransaction({ id, payload }) {
    const t = this._txs.get(id) ?? [];
    t.push({ id: `${id}-T${t.length + 1}`, ...payload, createdAt: new Date().toISOString() });
    this._txs.set(id, t);
    return t.at(-1);
  },
  async listAppointmentHolds(id) { return this._holds.get(id) ?? []; },
  async createFollowupHold({ id, payload }) {
    const h = this._holds.get(id) ?? [];
    h.push({ id: `${id}-H${h.length + 1}`, type: "followup", ...payload, createdAt: new Date().toISOString() });
    this._holds.set(id, h);
    return h.at(-1);
  },

  // metadata
  async listExamTemplates() { return ["Nội tổng quát", "Nhi", "Sản", "Tai mũi họng"]; },
  async listExtraFields() { return []; },
  async listDepartments() {
    return [
      { id: "K01", name: "Nội tổng quát" },
      { id: "K02", name: "Nhi" },
      { id: "K03", name: "Cận lâm sàng" },
    ];
  },
  async getDoctorsQueue() {
    return {
      "BS. Nguyễn A": { dept: "Nội", waiting: 5, appointments: 3, status: "Đang khám" },
      "BS. Trần B": { dept: "Nhi", waiting: 2, appointments: 1, status: "Đang khám" },
    };
  },
};

/** ===== MOCK LỊCH HẸN (appointments) ===== */

const nowAppt = new Date();
const dAppt = (n) =>
  new Date(nowAppt.getTime() + n * 86400000).toISOString().slice(0, 10);
const pad = (x) => String(x).padStart(2, "0");
const pickAppt = (arr) => arr[Math.floor(Math.random() * arr.length)];

const APPT_TYPES = ["Khám mới", "Tái khám"];
const APPT_STATUS_CODES = ["dang_cho", "da_xac_nhan", "da_checkin", "da_huy"];
const DOCTORS = [
  { name: "BS. Nguyễn A", dept: "Nội tổng quát", room: "P.101" },
  { name: "BS. Trần B", dept: "Nhi", room: "P.201" },
  { name: "BS. Lê C", dept: "Cận lâm sàng", room: "P.CLS-1" },
];

function makeMockAppt(i) {
  const offset = Math.floor(Math.random() * 9) - 3; // -3..+5 ngày quanh hôm nay
  const dateObj = new Date(nowAppt.getTime() + offset * 86400000);
  const date = dateObj.toISOString().slice(0, 10);
  const hour = pickAppt([8, 9, 10, 14, 15, 16]);
  const minute = pickAppt([0, 15, 30, 45]);
  const time = `${pad(hour)}:${pad(minute)}`;
  const duration = pickAppt([15, 20, 30]);

  const doc = pickAppt(DOCTORS);
  const status = pickAppt(APPT_STATUS_CODES);
  const checkedIn = status === "da_checkin";

  const code = `BN${1000 + i}`;
  const patient = `Bệnh nhân ${i}`;
  const phone = `0909${pad(i)}${pad(i)}`;

  return {
    // raw ERD-style field names
    ma_lich_hen: `LH${1000 + i}`,
    ngay_hen: date,
    gio_hen: time,
    thoi_luong_phut: duration,
    ma_benh_nhan: code,
    loai_hen: pickAppt(APPT_TYPES),
    ten_benh_nhan: patient,
    so_dien_thoai: phone,
    ma_lich_truc: `LT${2000 + i}`,
    ghi_chu: checkedIn ? "Đã đến sớm 5 phút" : "",
    trang_thai: status,
    co_hieu_luc: true,

    // extra info cho UI (không có trong gốc ERD nhưng BE có thể flatten)
    doctorName: doc.name,
    deptName: doc.dept,
    roomName: doc.room,
  };
}

export let mockAppointments = Array.from({ length: 40 }, (_, i) =>
  makeMockAppt(i + 1)
);

function filterAppointments(list, params = {}) {
  let arr = list.slice();
  const { date, fromDate, toDate, status, doctor, keyword } = params;

  if (date) {
    arr = arr.filter((a) => a.ngay_hen === date);
  }
  if (fromDate) {
    arr = arr.filter((a) => a.ngay_hen >= fromDate);
  }
  if (toDate) {
    arr = arr.filter((a) => a.ngay_hen <= toDate);
  }
  if (status && status !== "all") {
    arr = arr.filter((a) => a.trang_thai === status);
  }
  if (doctor) {
    arr = arr.filter((a) => a.doctorName === doctor);
  }
  if (keyword && keyword.trim()) {
    const kw = keyword.trim().toLowerCase();
    arr = arr.filter((a) =>
      [
        a.ten_benh_nhan,
        a.ma_benh_nhan,
        a.so_dien_thoai,
        a.doctorName,
        a.deptName,
      ].some((x) => String(x || "").toLowerCase().includes(kw))
    );
  }

  arr.sort((a, b) => {
    const sa = `${a.ngay_hen} ${a.gio_hen}`;
    const sb = `${b.ngay_hen} ${b.gio_hen}`;
    return sa.localeCompare(sb);
  });
  return arr;
}

export const mockAppointmentsApi = {
  async listByDate(date) {
    return filterAppointments(mockAppointments, { date });
  },

  async listAppointments(params = {}) {
    return filterAppointments(mockAppointments, params);
  },

  async createAppointment(payload) {
    // payload đang theo ERD (ma_lich_hen,...)
    const id =
      payload.ma_lich_hen || `LH${1000 + mockAppointments.length + 1}`;
    const base = {
      ...payload,
      ma_lich_hen: id,
      trang_thai: payload.trang_thai || "dang_cho",
      co_hieu_luc:
        typeof payload.co_hieu_luc === "boolean"
          ? payload.co_hieu_luc
          : true,
    };
    mockAppointments.push(base);
    return base;
  },

  async updateAppointment({ id, patch }) {
    const idx = mockAppointments.findIndex((a) => a.ma_lich_hen === id);
    if (idx === -1) throw new Error("Không tìm thấy lịch hẹn");
    mockAppointments[idx] = { ...mockAppointments[idx], ...patch };
    return mockAppointments[idx];
  },

  async checkIn(id) {
    const appt = mockAppointments.find((a) => a.ma_lich_hen === id);
    if (!appt) throw new Error("Không tìm thấy lịch hẹn");
    if (appt.trang_thai === "da_huy") return appt;
    appt.trang_thai = "da_checkin";
    return appt;
  },

  async findLastAppointment({ code, name, cutoff }) {
    const cutoffDate = cutoff || new Date().toISOString().slice(0, 10);
    let arr = mockAppointments.filter((a) => a.ngay_hen <= cutoffDate);

    if (code) {
      arr = arr.filter((a) => a.ma_benh_nhan === code);
    } else if (name) {
      const kw = name.toLowerCase();
      arr = arr.filter((a) =>
        String(a.ten_benh_nhan || "").toLowerCase().includes(kw)
      );
    }

    if (!arr.length) return null;
    arr.sort((a, b) => {
      const sa = `${a.ngay_hen} ${a.gio_hen}`;
      const sb = `${b.ngay_hen} ${b.gio_hen}`;
      return sb.localeCompare(sa); // mới nhất trước
    });
    return arr[0];
  },
};
// ====== MOCK QUEUE (hang_doi) + VISIT (luot_kham_benh) ======

function isoToday(h = 8, m = 0) {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

// Bộ mẫu: đủ case chính theo ERD cho hang_doi
let _queue = [
  // 1) LS - hẹn khám đúng giờ, chưa gọi
  {
    // ERD
    ma_hang_doi: "Q-LS-001",
    ma_benh_nhan: "BN0001",
    ma_phong: "PK101",
    loai_hang_doi: "kham_lam_sang", // enum(kham_lam_sang,can_lam_sang)
    nguon: "appointment", // enum(appointment,walkin,service_return)
    nhan: null,
    cap_cuu: false,
    phan_loai_den: "dung_gio", // enum(dung_gio,den_som,den_muon)
    thoi_gian_checkin: isoToday(7, 55),
    thoi_gian_lich_hen: isoToday(8, 0),
    do_uu_tien: 5, // appointment=5
    trang_thai: "cho_goi", // enum(cho_goi,dang_goi,da_phuc_vu,da_huy)
    ghi_chu: "Hẹn khám tổng quát, ho sốt 3 ngày.",
    ma_phieu_kham: "PKLS-0001",
    ma_chi_tiet_dv: null,

    // Meta cho UI
    id: "Q-LS-001",
    pid: "BN0001",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1988-05-10",
    phone: "0901 234 567",
    dept: "Khoa Nội tổng quát",
    room: "PK.101",
    doctor: "BS. Trần Văn B",
    visitType: "kham_moi", // loai_luot
  },

  // 2) LS - walkin đến trễ, đang gọi / đang khám
  {
    ma_hang_doi: "Q-LS-002",
    ma_benh_nhan: "BN0002",
    ma_phong: "PK102",
    loai_hang_doi: "kham_lam_sang",
    nguon: "walkin",
    nhan: null,
    cap_cuu: false,
    phan_loai_den: "den_muon",
    thoi_gian_checkin: isoToday(9, 15),
    thoi_gian_lich_hen: null,
    do_uu_tien: 10, // walkin=10
    trang_thai: "dang_goi",
    ghi_chu: "Walk-in, đau bụng quặn từng cơn.",
    ma_phieu_kham: "PKLS-0002",
    ma_chi_tiet_dv: null,

    id: "Q-LS-002",
    pid: "BN0002",
    name: "Trần Thị B",
    gender: "Nữ",
    dob: "1993-03-20",
    phone: "0902 345 678",
    dept: "Khoa Tiêu hoá",
    room: "PK.102",
    doctor: "BS. Lê Văn C",
    visitType: "kham_moi",
  },

  // 3) CLS - từ LS chỉ định, đang chờ thực hiện CLS
  {
    ma_hang_doi: "Q-CLS-001",
    ma_benh_nhan: "BN0001",
    ma_phong: "CLS201",
    loai_hang_doi: "can_lam_sang",
    nguon: "appointment",
    nhan: null,
    cap_cuu: false,
    phan_loai_den: "dung_gio",
    thoi_gian_checkin: isoToday(9, 30),
    thoi_gian_lich_hen: isoToday(9, 30),
    do_uu_tien: 5,
    trang_thai: "cho_goi",
    ghi_chu: "Xét nghiệm máu theo chỉ định PKLS-0001.",
    ma_phieu_kham: null,
    ma_chi_tiet_dv: "CTDV-0001",

    id: "Q-CLS-001",
    pid: "BN0001",
    name: "Nguyễn Văn A",
    gender: "Nam",
    dob: "1988-05-10",
    phone: "0901 234 567",
    dept: " xét nghiệm",
    room: "XN.201",
    doctor: "KTV. Nguyễn Văn CLS",
    visitType: "cls", // dùng riêng cho UI
    services: [
      {
        id: "DV-XN-MAU",
        name: "Xét nghiệm máu tổng quát",
        status: "cho_thuc_hien",
      },
    ],
  },

  // 4) LS - lượt tái khám "Trả từ dịch vụ" (để demo kết quả dịch vụ trên màn LS)
  {
    ma_hang_doi: "Q-LS-RT-001",
    ma_benh_nhan: "BN0003",
    ma_phong: "PK103",
    loai_hang_doi: "kham_lam_sang",
    nguon: "service_return", // <<< quan trọng
    nhan: "service_return",
    cap_cuu: false,
    phan_loai_den: "dung_gio",
    thoi_gian_checkin: isoToday(10, 15),
    thoi_gian_lich_hen: isoToday(10, 30),
    do_uu_tien: 0, // service_return = 0
    trang_thai: "cho_goi",
    ghi_chu: "Bệnh nhân quay lại sau CLS để đọc kết quả.",
    ma_phieu_kham: "PKLS-0003",
    ma_chi_tiet_dv: null,

    id: "Q-LS-RT-001",
    pid: "BN0003",
    name: "Phạm Văn C",
    gender: "Nam",
    dob: "1975-09-01",
    phone: "0903 456 789",
    dept: "Khoa Nội tổng quát",
    room: "PK.103",
    doctor: "BS. Nguyễn Văn D",
    visitType: "tai_kham",

    // Dữ liệu để ExamDetail (LS) hiển thị block "Kết quả dịch vụ trả về"
    serviceResults: [
      {
        id: "CTDV-0003",
        serviceName: "Chụp X-quang phổi",
        note: "Chụp kiểm tra sau điều trị 2 tuần.",
        result:
          "Hình ảnh phổi hai bên sáng, không thấy tổn thương tiến triển so với lần trước.",
        files: [
          { id: "FILE-0001", name: "XQ_PHOI_2025-11-11.png" },
          { id: "FILE-0002", name: "REPORT_XQ_2025-11-11.pdf" },
        ],
      },
      {
        id: "CTDV-0004",
        serviceName: "Xét nghiệm CRP",
        note: "",
        result: "CRP 3.2 mg/L (trong giới hạn bình thường).",
        files: [],
      },
    ],
  },

  // 5) CLS - service_return (vẫn giữ để demo màn CLS)
  {
    ma_hang_doi: "Q-CLS-002",
    ma_benh_nhan: "BN0004",
    ma_phong: "CLS301",
    loai_hang_doi: "can_lam_sang",
    nguon: "service_return",
    nhan: "service_return",
    cap_cuu: false,
    phan_loai_den: "den_som",
    thoi_gian_checkin: isoToday(10, 0),
    thoi_gian_lich_hen: isoToday(10, 0),
    do_uu_tien: 0,
    trang_thai: "da_phuc_vu",
    ghi_chu: "Chụp X-quang kiểm tra sau điều trị.",
    ma_phieu_kham: null,
    ma_chi_tiet_dv: "CTDV-0002",

    id: "Q-CLS-002",
    pid: "BN0004",
    name: "Vũ Văn D",
    gender: "Nam",
    dob: "1982-01-15",
    phone: "0904 567 890",
    dept: "Chẩn đoán hình ảnh",
    room: "XQ.301",
    doctor: "KTV. Đặng Thị D",
    visitType: "cls",
    services: [
      {
        id: "DV-XQ",
        name: "Chụp X-quang phổi",
        status: "da_hoan_tat",
      },
    ],
  },
];

// Lượt khám (luot_kham_benh) mock – link 1-1 với hang_doi
let _visits = [
  // Lượt đang khám LS (walkin)
  {
    ma_luot_kham: "LK-LS-002",
    ma_hang_doi: "Q-LS-002",
    ma_phieu_kham: "PKLS-0002",
    ma_chi_tiet_dv: null,
    ma_nhan_su_thuc_hien: "NV-BS-0002",
    ma_y_ta_ho_tro: "NV-YT-0001",
    loai_luot: "kham_moi",
    thoi_gian_bat_dau: isoToday(9, 20),
    thoi_gian_ket_thuc: null,
    trang_thai: "dang_kham", // enum(dang_kham,da_kham,hoan_tat,da_huy)

    id: "LK-LS-002",
    queueId: "Q-LS-002",
  },
  // Lượt CLS đã hoàn tất
  {
    ma_luot_kham: "LK-CLS-002",
    ma_hang_doi: "Q-CLS-002",
    ma_phieu_kham: null,
    ma_chi_tiet_dv: "CTDV-0002",
    ma_nhan_su_thuc_hien: "NV-KTV-0001",
    ma_y_ta_ho_tro: null,
    loai_luot: "kham_moi",
    thoi_gian_bat_dau: isoToday(9, 40),
    thoi_gian_ket_thuc: isoToday(9, 55),
    trang_thai: "hoan_tat",

    id: "LK-CLS-002",
    queueId: "Q-CLS-002",
  },
];

function findVisitByQueueId(qid) {
  return _visits.find((v) => v.ma_hang_doi === qid || v.queueId === qid);
}

// ====== MOCK API QUEUE ======

export const mockQueueApi = {
  async listQueueToday() {
    // Chuẩn hóa theo ERD + thêm field UI
    return _queue.map((q) => {
      const checkIn =
        q.thoi_gian_checkin ? new Date(q.thoi_gian_checkin) : null;
      const bookedAt =
        q.thoi_gian_lich_hen ? new Date(q.thoi_gian_lich_hen) : null;

      return {
        ...q,
        // Giờ hẹn dạng HH:mm cho table
        time:
          q.time ||
          (bookedAt
            ? bookedAt.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : null),

        // Thời điểm check-in
        checkIn: q.checkIn || checkIn,

        // Ghi chú UI dùng chung
        note: q.note ?? q.ghi_chu ?? "",

        // Alias để FE cũ dùng tạm
        queueType: q.loai_hang_doi, // kham_lam_sang / can_lam_sang
        source: q.nguon,
      };
    });
  },

  async enqueueWalkin(payload) {
    // payload dự kiến: { pid, name, dept, doctor, note, symptoms }
    const idNum = _queue.length + 1;
    const id = `Q-LS-WI-${String(idNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const item = {
      ma_hang_doi: id,
      ma_benh_nhan: payload.pid,
      ma_phong: payload.room || "PK-WI",
      loai_hang_doi: "kham_lam_sang",
      nguon: "walkin",
      nhan: null,
      cap_cuu: !!payload.emergency,
      phan_loai_den: "den_som",
      thoi_gian_checkin: now,
      thoi_gian_lich_hen: null,
      do_uu_tien: 10,
      trang_thai: "cho_goi",
      ghi_chu: payload.note || "",
      ma_phieu_kham: payload.examTicketId || null,
      ma_chi_tiet_dv: null,

      id,
      pid: payload.pid,
      name: payload.name,
      gender: payload.gender || "",
      dob: payload.dob || "",
      phone: payload.phone || "",
      dept: payload.dept || "",
      room: payload.room || "",
      doctor: payload.doctor || "",
      visitType: "kham_moi",
    };

    _queue.push(item);
    return item;
  },

  async enqueueFromAppointment(payload) {
    // payload dự kiến: { pid, name, dept, doctor, bookedAt, phone, ... }
    const idNum = _queue.length + 1;
    const id = `Q-LS-AP-${String(idNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const item = {
      ma_hang_doi: id,
      ma_benh_nhan: payload.pid,
      ma_phong: payload.room || "PK-APPT",
      loai_hang_doi: "kham_lam_sang",
      nguon: "appointment",
      nhan: null,
      cap_cuu: !!payload.emergency,
      phan_loai_den: "dung_gio",
      thoi_gian_checkin: payload.checkinAt || now,
      thoi_gian_lich_hen: payload.bookedAt || now,
      do_uu_tien: 5,
      trang_thai: "cho_goi",
      ghi_chu: payload.note || "",
      ma_phieu_kham: payload.examTicketId || null,
      ma_chi_tiet_dv: null,

      id,
      pid: payload.pid,
      name: payload.name,
      gender: payload.gender || "",
      dob: payload.dob || "",
      phone: payload.phone || "",
      dept: payload.dept || "",
      room: payload.room || "",
      doctor: payload.doctor || "",
      visitType: payload.visitType || "kham_moi",
    };

    _queue.push(item);
    return item;
  },

  async enqueueService(payload) {
    // payload dự kiến: { pid, name, dept, room, doctor, services: [] }
    const idNum = _queue.length + 1;
    const id = `Q-CLS-${String(idNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const item = {
      ma_hang_doi: id,
      ma_benh_nhan: payload.pid,
      ma_phong: payload.room || "CLS-ROOM",
      loai_hang_doi: "can_lam_sang",
      nguon: payload.source || "appointment",
      nhan: payload.source === "service_return" ? "service_return" : null,
      cap_cuu: !!payload.emergency,
      phan_loai_den: "dung_gio",
      thoi_gian_checkin: now,
      thoi_gian_lich_hen: payload.scheduledAt || now,
      do_uu_tien: payload.source === "service_return" ? 0 : 5,
      trang_thai: "cho_goi",
      ghi_chu: payload.note || "",
      ma_phieu_kham: payload.examTicketId || null,
      ma_chi_tiet_dv: payload.detailId || null,

      id,
      pid: payload.pid,
      name: payload.name,
      gender: payload.gender || "",
      dob: payload.dob || "",
      phone: payload.phone || "",
      dept: payload.dept || "",
      room: payload.room || "",
      doctor: payload.doctor || "",
      visitType: "cls",
      services: (payload.services || []).map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status || "cho_thuc_hien",
      })),
    };

    _queue.push(item);
    return item;
  },

  async enqueueReturnToDoctor(payload) {
    // từ CLS quay lại bác sĩ
    const idNum = _queue.length + 1;
    const id = `Q-LS-RT-${String(idNum).padStart(3, "0")}`;
    const now = new Date().toISOString();

    const item = {
      ma_hang_doi: id,
      ma_benh_nhan: payload.pid,
      ma_phong: payload.room || "PK-RETURN",
      loai_hang_doi: "kham_lam_sang",
      nguon: "service_return",
      nhan: "service_return",
      cap_cuu: !!payload.emergency,
      phan_loai_den: "dung_gio",
      thoi_gian_checkin: now,
      thoi_gian_lich_hen: now,
      do_uu_tien: 0,
      trang_thai: "cho_goi",
      ghi_chu: payload.note || "Tái đánh giá sau CLS.",
      ma_phieu_kham: payload.examTicketId || null,
      ma_chi_tiet_dv: payload.detailId || null,

      id,
      pid: payload.pid,
      name: payload.name,
      gender: payload.gender || "",
      dob: payload.dob || "",
      phone: payload.phone || "",
      dept: payload.dept || "",
      room: payload.room || "",
      doctor: payload.doctor || "",
      visitType: payload.visitType || "tai_kham",
      serviceResults: payload.serviceResults || [],
    };

    _queue.push(item);
    return item;
  },

  async startExam(id) {
    const q = _queue.find((x) => x.ma_hang_doi === id || x.id === id);
    if (!q) throw new Error("Không tìm thấy hàng đợi.");

    // Update trạng thái hàng đợi
    q.trang_thai = "dang_goi";

    let v = findVisitByQueueId(q.ma_hang_doi);
    if (!v) {
      const visitId = `LK-${q.ma_hang_doi}`;
      v = {
        ma_luot_kham: visitId,
        ma_hang_doi: q.ma_hang_doi,
        ma_phieu_kham: q.ma_phieu_kham,
        ma_chi_tiet_dv: q.ma_chi_tiet_dv,
        ma_nhan_su_thuc_hien: q.doctorId || null,
        ma_y_ta_ho_tro: null,
        loai_luot: q.visitType === "cls" ? "kham_moi" : "kham_moi",
        thoi_gian_bat_dau: new Date().toISOString(),
        thoi_gian_ket_thuc: null,
        trang_thai: "dang_kham",

        id: visitId,
        queueId: q.ma_hang_doi,
      };
      _visits.push(v);
    }

    q.currentVisitId = v.ma_luot_kham;
    return { queue: q, visit: v };
  },

  async markEmergency({ id, flag }) {
    const q = _queue.find((x) => x.ma_hang_doi === id || x.id === id);
    if (!q) throw new Error("Không tìm thấy hàng đợi.");
    q.cap_cuu = !!flag;
    return q;
  },

  async skipOnce(id) {
    const q = _queue.find((x) => x.ma_hang_doi === id || x.id === id);
    if (!q) throw new Error("Không tìm thấy hàng đợi.");
    q.skippedCount = (q.skippedCount || 0) + 1;
    return q;
  },

  async markNoShow(id) {
    const q = _queue.find((x) => x.ma_hang_doi === id || x.id === id);
    if (!q) throw new Error("Không tìm thấy hàng đợi.");
    q.trang_thai = "da_huy";
    q.ghi_chu = (q.ghi_chu || "") + "\nNo-show.";
    return q;
  },

  async finishAndRemove(id) {
    const qIndex = _queue.findIndex(
      (x) => x.ma_hang_doi === id || x.id === id
    );
    if (qIndex === -1) throw new Error("Không tìm thấy hàng đợi.");

    const q = _queue[qIndex];
    q.trang_thai = "da_phuc_vu";

    const v = findVisitByQueueId(q.ma_hang_doi);
    if (v) {
      v.trang_thai = "hoan_tat";
      v.thoi_gian_ket_thuc = new Date().toISOString();
    }

    // Để dễ debug UI, không xoá khỏi mảng, chỉ đánh dấu đã phục vụ
    return { queue: q, visit: v || null };
  },
};
/* ===== APPEND TO: src/api/mockData.js =====
   DEPARTMENTS MOCK – bám ERD (khoa/phòng/dịch vụ/lịch trực)
   Exports added: mockDepartmentsApi
   (Giữ nguyên mọi nội dung có sẵn ở trên; chỉ dán khối dưới cùng file) */

// ---------- Dataset (prefix DEPT_ để tránh xung đột) ----------
const DEPT_ROOMS = [
  { ma_khoa: "NOI", ma_phong: "NOI-201", ten_phong: "Phòng khám Nội 1", loai_phong: "phong_kham",
    suc_chua: 60, vi_tri: "Tầng 2, khu A", dien_thoai_phong: "028 9999 0201",
    gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "noi201@his.local",
    thiet_bi: "Monitor, Máy đo huyết áp, ECG",
    dich_vu_cung_cap: "Khám nội tổng quát, Khám tăng huyết áp, Khám đái tháo đường",
    trang_thai_phong: "hoat_dong",
    bac_si_phu_trach_name: "BS. Nguyễn A",
    nurse_in_charge: "ĐD. Trần B",
    queue_waiting: 4, queue_done: 18 },

    { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
    suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
    gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
    thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
    dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
    trang_thai_phong: "hoat_dong",
    bac_si_phu_trach_name: "BS. Trần B",
    nurse_in_charge: "ĐD. Phạm C",
    queue_waiting: 3, queue_done: 22 },
    { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
      suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
      gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
      thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
      dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
      trang_thai_phong: "hoat_dong",
      bac_si_phu_trach_name: "BS. Trần B",
      nurse_in_charge: "ĐD. Phạm C",
      queue_waiting: 3, queue_done: 22 }, { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
        suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
        gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
        thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
        dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
        trang_thai_phong: "hoat_dong",
        bac_si_phu_trach_name: "BS. Trần B",
        nurse_in_charge: "ĐD. Phạm C",
        queue_waiting: 3, queue_done: 22 }, { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
          suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
          gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
          thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
          dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
          trang_thai_phong: "hoat_dong",
          bac_si_phu_trach_name: "BS. Trần B",
          nurse_in_charge: "ĐD. Phạm C",
          queue_waiting: 3, queue_done: 22 }, { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
            suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
            gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
            thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
            dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
            trang_thai_phong: "hoat_dong",
            bac_si_phu_trach_name: "BS. Trần B",
            nurse_in_charge: "ĐD. Phạm C",
            queue_waiting: 3, queue_done: 22 }, { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
              suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
              gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
              thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
              dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
              trang_thai_phong: "hoat_dong",
              bac_si_phu_trach_name: "BS. Trần B",
              nurse_in_charge: "ĐD. Phạm C",
              queue_waiting: 3, queue_done: 22 }, { ma_khoa: "NHI", ma_phong: "NHI-301", ten_phong: "Phòng khám Nhi 1", loai_phong: "phong_kham",
                suc_chua: 50, vi_tri: "Tầng 3, khu A", dien_thoai_phong: "028 9999 0301",
                gio_mo_cua: "07:30", gio_dong_cua: "16:30", email_phong: "nhi301@his.local",
                thiet_bi: "Monitor, Cân điện tử, Máy đo SpO2",
                dich_vu_cung_cap: "Khám nhi tổng quát, Tư vấn dinh dưỡng",
                trang_thai_phong: "hoat_dong",
                bac_si_phu_trach_name: "BS. Trần B",
                nurse_in_charge: "ĐD. Phạm C",
                queue_waiting: 3, queue_done: 22 },
  { ma_khoa: "CLS", ma_phong: "LAB-1", ten_phong: "Phòng xét nghiệm tổng quát", loai_phong: "phong_dich_vu",
    suc_chua: 200, vi_tri: "Tầng 1, khu B", dien_thoai_phong: "028 9999 0401",
    gio_mo_cua: "07:00", gio_dong_cua: "17:00", email_phong: "lab1@his.localaaaaaaaaaaaaaaaaaa",
    thiet_bi: "Máy sinh hóa, Máy huyết học, Máy phân tích nước tiểu",
    dich_vu_cung_cap: "Xét nghiệm máu, Xét nghiệm sinh hóa, Xét nghiệm nước tiểu",
    trang_thai_phong: "hoat_dong",
    bac_si_phu_trach_name: "CN. Nguyễn D",
    nurse_in_charge: "KTV. Lê E",
    queue_waiting: 6, queue_done: 120 },
];

// dich_vu_y_te mẫu (1 dịch vụ -> 1 phòng)
const DEPT_SERVICES = [
  // LS @ Nội
  { ma_dich_vu: "DV-NOI-KLS-01", loai_dich_vu: "kham_lam_sang", ten_dich_vu: "Khám nội tổng quát",
    don_gia: 200000, trang_thai: "hoat_dong", thoi_gian_du_kien_phut: 20, ma_phong_thuc_hien: "NOI-201" },
  { ma_dich_vu: "DV-NOI-KCK-01", loai_dich_vu: "kham_chuyen_khoa", ten_dich_vu: "Khám tăng huyết áp",
    don_gia: 250000, trang_thai: "hoat_dong", thoi_gian_du_kien_phut: 25, ma_phong_thuc_hien: "NOI-201" },

  // LS @ Nhi
  { ma_dich_vu: "DV-NHI-KLS-01", loai_dich_vu: "kham_lam_sang", ten_dich_vu: "Khám nhi tổng quát",
    don_gia: 220000, trang_thai: "hoat_dong", thoi_gian_du_kien_phut: 20, ma_phong_thuc_hien: "NHI-301" },

  // CLS @ LAB
  { ma_dich_vu: "DV-CLS-01", loai_dich_vu: "can_lam_sang", ten_dich_vu: "Xét nghiệm máu tổng quát",
    don_gia: 150000, trang_thai: "hoat_dong", thoi_gian_du_kien_phut: 15, ma_phong_thuc_hien: "LAB-1" },
  { ma_dich_vu: "DV-CLS-02", loai_dich_vu: "can_lam_sang", ten_dich_vu: "Xét nghiệm sinh hóa",
    don_gia: 250000, trang_thai: "hoat_dong", thoi_gian_du_kien_phut: 20, ma_phong_thuc_hien: "LAB-1" },
];

// lich_truc (y tá/KTV luân phiên; BS cố định theo phòng)
const mockDutyByRoom = {
  "NOI-201": {
    fixedDoctor: "BS. Nguyễn A",
    Mon: [{ nurse: "ĐD. Trần B", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Tue: [{ nurse: "ĐD. Trần B", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Wed: [{ nurse: "ĐD. Trần B", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Thu: [{ nurse: "ĐD. Trần B", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Fri: [{ nurse: "ĐD. Trần B", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Sat: [{ nurse: "ĐD. Trần B", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Sun: [],
  },
  "NHI-301": {
    fixedDoctor: "BS. Trần B",
    Mon: [{ nurse: "ĐD. Phạm C", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Tue: [{ nurse: "ĐD. Phạm C", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Wed: [{ nurse: "ĐD. Phạm C", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Thu: [{ nurse: "ĐD. Phạm C", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Fri: [{ nurse: "ĐD. Phạm C", ca_truc: "Sáng", gio_bat_dau: "07:30", gio_ket_thuc: "11:30" }],
    Sat: [],
    Sun: [],
  },
  "LAB-1": {
    fixedDoctor: "CN. Nguyễn D",
    Mon: [{ nurse: "KTV. Lê E", ca_truc: "Sáng", gio_bat_dau: "07:00", gio_ket_thuc: "11:30" }],
    Tue: [{ nurse: "KTV. Lê E", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Wed: [{ nurse: "KTV. Lê E", ca_truc: "Sáng", gio_bat_dau: "07:00", gio_ket_thuc: "11:30" }],
    Thu: [{ nurse: "KTV. Lê E", ca_truc: "Chiều", gio_bat_dau: "13:00", gio_ket_thuc: "17:00" }],
    Fri: [{ nurse: "KTV. Lê E", ca_truc: "Sáng", gio_bat_dau: "07:00", gio_ket_thuc: "11:30" }],
    Sat: [],
    Sun: [],
  },
};

const defaultDutyWeek = {
  Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [],
};

// ---------- Helpers ----------
function _deptFindById(id) {
  return DEPT_ROOMS.find(
    (d) => d.ma_phong === id || d.id === id || d.ma_phong === String(id)
  );
}
function _deptJson(data) { return Promise.resolve({ data }); }

// ---------- Public API cho Departments ----------
export const mockDeptRooms = DEPT_ROOMS;
export const mockDeptServices = DEPT_SERVICES;

export const mockDepartmentsApi = {
  async list() {
    return DEPT_ROOMS.slice();
  },
  async get(id) {
    return _deptFindById(id) || null;
  },
  async update({ id, patch }) {
    const idx = DEPT_ROOMS.findIndex(
      (d) => d.ma_phong === id || d.id === id
    );
    if (idx === -1) throw new Error("Không tìm thấy phòng");
    DEPT_ROOMS[idx] = { ...DEPT_ROOMS[idx], ...patch };
    return DEPT_ROOMS[idx];
  },
  async toggleRoom({ id, status }) {
    const idx = DEPT_ROOMS.findIndex(
      (d) => d.ma_phong === id || d.id === id
    );
    if (idx === -1) throw new Error("Không tìm thấy phòng");
    DEPT_ROOMS[idx].trang_thai_phong =
      typeof status === "boolean" ? (status ? "hoat_dong" : "tam_dung") : status;
    return DEPT_ROOMS[idx];
  },
  async getDutyByRoom(id) {
    return mockDutyByRoom[id] || { fixedDoctor: "—", ...defaultDutyWeek };
  },
  async listServicesByRoom(roomId) {
    return DEPT_SERVICES.filter((dv) => dv.ma_phong_thuc_hien === roomId);
  },
  async getDoctorQueueByDept(/* dept */) {
    // Có thể mở rộng theo nhu cầu hiển thị
    return {};
  },
};

// (Optional) Nếu bạn muốn hook vào http.get/patch tự động (không cần ở hiện tại):
export function mockDepartmentsHttpBridge(http) {
  if (!http?.get || !http?.patch) return;
  const _get = http.get.bind(http);
  const _patch = http.patch.bind(http);

  http.get = async (url, config) => {
    if (typeof url === "string" && url.startsWith("/departments")) {
      if (url === "/departments") {
        return _deptJson(await mockDepartmentsApi.list());
      }
      const m1 = url.match(/^\/departments\/([^/]+)$/);
      if (m1) return _deptJson(await mockDepartmentsApi.get(decodeURIComponent(m1[1])));
      const m2 = url.match(/^\/departments\/([^/]+)\/duty$/);
      if (m2) return _deptJson(await mockDepartmentsApi.getDutyByRoom(decodeURIComponent(m2[1])));
      const m3 = url.match(/^\/departments\/([^/]+)\/services$/);
      if (m3) return _deptJson(await mockDepartmentsApi.listServicesByRoom(decodeURIComponent(m3[1])));
    }
    return _get(url, config);
  };

  http.patch = async (url, body) => {
    if (typeof url === "string" && url.startsWith("/departments")) {
      const m1 = url.match(/^\/departments\/([^/]+)$/);
      if (m1) return _deptJson(await mockDepartmentsApi.update({ id: decodeURIComponent(m1[1]), patch: body }));
      const m2 = url.match(/^\/departments\/([^/]+)\/toggle-room$/);
      if (m2) return _deptJson(await mockDepartmentsApi.toggleRoom({ id: decodeURIComponent(m2[1]), status: body?.status }));
    }
    return _patch(url, body);
  };
}



/* ======================= STAFF MOCKS ======================= */
/** status: online | offline | pause
 *  vai_tro_cong_tac (chỉ cho Y tá):
 *  - lam_sang       → Y tá lâm sàng
 *  - can_lam_sang   → Y tá cận lâm sàng
 *  - hanh_chinh     → Y tá hành chính
 */

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STAFF = [
  // ===== BÁC SĨ =====
  {
    id: "BS001",
    ma_nhan_vien: "BS001",
    vai_tro: "bac_si",
    name: "BSCKII. Nguyễn Văn A",
    degree: "BSCK II",
    dept: "Khoa Nội tổng hợp",
    ma_khoa: "NOI",
    specialties: ["Tim mạch", "Tăng huyết áp"],
    skills: ["Siêu âm tim", "Đọc ECG", "Tư vấn thay đổi lối sống"],
    email: "nguyenvana@hospital.local",
    phone: "0901000001",
    status: "online", // online | offline | pause
    years: 15,
    doctorRoom: "Nội 101",
    managedRooms: ["Nội 101"],
    appointmentsToday: 8,
    avatarUrl: "",
  },
  {
    id: "BS002",
    ma_nhan_vien: "BS002",
    vai_tro: "bac_si",
    name: "BS. Trần Thị B",
    degree: "ThS.BS",
    dept: "Khoa Nhi",
    ma_khoa: "NHI",
    specialties: ["Nhi hô hấp", "Dinh dưỡng nhi"],
    skills: ["Khám nhi tổng quát", "Tư vấn dinh dưỡng"],
    email: "tranthib@hospital.local",
    phone: "0901000002",
    status: "pause",
    years: 9,
    doctorRoom: "Nhi 201",
    managedRooms: ["Nhi 201"],
    appointmentsToday: 5,
    avatarUrl: "",
  },
  {
    id: "BS003",
    ma_nhan_vien: "BS003",
    vai_tro: "bac_si",
    name: "BS. Lê Văn C",
    degree: "BSCK I",
    dept: "Khoa Ngoại",
    ma_khoa: "NGOAI",
    specialties: ["Ngoại tổng quát", "Tiêu hoá"],
    skills: ["Khám ngoại", "Tư vấn phẫu thuật"],
    email: "levanc@hospital.local",
    phone: "0901000003",
    status: "offline",
    years: 12,
    doctorRoom: "Ngoại 301",
    managedRooms: ["Ngoại 301"],
    appointmentsToday: 2,
    avatarUrl: "",
  },

  // ===== ĐIỀU DƯỠNG =====
  // Y tá lâm sàng
  {
    id: "DD001",
    ma_nhan_vien: "DD001",
    vai_tro: "y_ta",
    roleType: "clinical", // để filter cũ dùng
    vai_tro_cong_tac: "lam_sang",
    name: "ĐD. Phạm Thị D",
    dept: "Khoa Nội tổng hợp",
    ma_khoa: "NOI",
    specialties: ["Chăm sóc nội khoa"],
    skills: [
      "Đặt ven",
      "Theo dõi dấu hiệu sinh tồn",
      "Giải thích quy trình cho BN",
    ],
    email: "phamthid@hospital.local",
    phone: "0902000001",
    status: "online",
    years: 7,
    managedRooms: ["Nội 101", "Nội 102"],
    appointmentsToday: 0,
    avatarUrl: "",
  },
  // Y tá hành chính
  {
    id: "DD002",
    ma_nhan_vien: "DD002",
    vai_tro: "y_ta",
    roleType: "administrative",
    vai_tro_cong_tac: "hanh_chinh",
    name: "ĐD. Vũ Thị E",
    dept: "Phòng khám",
    ma_khoa: "PK",
    specialties: ["Điều phối khám ngoại trú"],
    skills: ["Sắp xếp lịch khám", "Hướng dẫn thủ tục tiếp nhận"],
    email: "vuthie@hospital.local",
    phone: "0902000002",
    status: "pause",
    years: 5,
    managedDepartments: ["Khoa Nội tổng hợp", "Khoa Nhi"],
    managedRooms: ["Quầy tiếp nhận 1", "Quầy tiếp nhận 2"],
    appointmentsToday: 0,
    avatarUrl: "",
  },
  // Y tá cận lâm sàng
  {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  }, {
    id: "DD003",
    ma_nhan_vien: "DD003",
    vai_tro: "y_ta",
    roleType: "clinical",
    vai_tro_cong_tac: "can_lam_sang",
    name: "ĐD. Nguyễn Văn F",
    dept: "Khoa Cận lâm sàng",
    ma_khoa: "CLS",
    specialties: ["Hỗ trợ xét nghiệm, chẩn đoán hình ảnh"],
    skills: ["Lấy mẫu", "Chuẩn bị BN trước CLS"],
    email: "nguyenvanf@hospital.local",
    phone: "0902000003",
    status: "offline",
    years: 3,
    managedRooms: ["Phòng lấy mẫu 01"],
    appointmentsToday: 0,
    avatarUrl: "",
  },
];

// Lịch trực theo tuần
const STAFF_SCHEDULE = {
  BS001: {
    week: [
      { day: "Mon", shift: "Sáng" },
      { day: "Tue", shift: "Chiều" },
      { day: "Wed", shift: "Sáng" },
      { day: "Thu", shift: "Sáng" },
      { day: "Fri", shift: "Chiều" },
      { day: "Sat", shift: "Nghỉ" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  BS002: {
    week: [
      { day: "Mon", shift: "Chiều" },
      { day: "Tue", shift: "Chiều" },
      { day: "Wed", shift: "Sáng" },
      { day: "Thu", shift: "Chiều" },
      { day: "Fri", shift: "Sáng" },
      { day: "Sat", shift: "Sáng" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  BS003: {
    week: [
      { day: "Mon", shift: "Nghỉ" },
      { day: "Tue", shift: "Sáng" },
      { day: "Wed", shift: "Chiều" },
      { day: "Thu", shift: "Chiều" },
      { day: "Fri", shift: "Nghỉ" },
      { day: "Sat", shift: "Nghỉ" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  DD001: {
    week: [
      { day: "Mon", shift: "Sáng" },
      { day: "Tue", shift: "Sáng" },
      { day: "Wed", shift: "Chiều" },
      { day: "Thu", shift: "Chiều" },
      { day: "Fri", shift: "Sáng" },
      { day: "Sat", shift: "Sáng" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  DD002: {
    week: [
      { day: "Mon", shift: "Sáng" },
      { day: "Tue", shift: "Chiều" },
      { day: "Wed", shift: "Sáng" },
      { day: "Thu", shift: "Chiều" },
      { day: "Fri", shift: "Sáng" },
      { day: "Sat", shift: "Nghỉ" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  DD003: {
    week: [
      { day: "Mon", shift: "Nghỉ" },
      { day: "Tue", shift: "Nghỉ" },
      { day: "Wed", shift: "Nghỉ" },
      { day: "Thu", shift: "Nghỉ" },
      { day: "Fri", shift: "Nghỉ" },
      { day: "Sat", shift: "Nghỉ" },
      { day: "Sun", shift: "Nghỉ" },
    ],
  },
  DEFAULT: {
    week: DAY_KEYS.map((d) => ({ day: d, shift: "Nghỉ" })),
  },
};

// Bàn/Phòng trực trong tuần
const STAFF_DUTY_ROOMS = {
  BS001: {
    Mon: "Nội 101",
    Tue: "Nội 101",
    Wed: "Nội 102",
    Thu: "Nội 101",
    Fri: "Nội 103",
    Sat: "Nội 101",
    Sun: "-",
  },
  BS002: {
    Mon: "Nhi 201",
    Tue: "Nhi 201",
    Wed: "Nhi 202",
    Thu: "Nhi 202",
    Fri: "Nhi 201",
    Sat: "Nhi 201",
    Sun: "-",
  },
  BS003: {
    Mon: "-",
    Tue: "Ngoại 301",
    Wed: "Ngoại 302",
    Thu: "Ngoại 301",
    Fri: "-",
    Sat: "-",
    Sun: "-",
  },
  DD001: {
    Mon: "Nội 101",
    Tue: "Nội 102",
    Wed: "Nội 101",
    Thu: "Nội 102",
    Fri: "Nội 101",
    Sat: "Nội 101",
    Sun: "-",
  },
  DD002: {
    Mon: "Quầy tiếp nhận 1",
    Tue: "Quầy tiếp nhận 1",
    Wed: "Quầy tiếp nhận 2",
    Thu: "Quầy tiếp nhận 2",
    Fri: "Quầy tiếp nhận 1",
    Sat: "Quầy tiếp nhận 1",
    Sun: "-",
  },
  DD003: {
    Mon: "-",
    Tue: "-",
    Wed: "-",
    Thu: "-",
    Fri: "-",
    Sat: "-",
    Sun: "-",
  },
  DEFAULT: {
    Mon: "-",
    Tue: "-",
    Wed: "-",
    Thu: "-",
    Fri: "-",
    Sat: "-",
    Sun: "-",
  },
};

function dayKeyFromISO(dateISO) {
  const d = dateISO ? new Date(dateISO) : new Date();
  return DAY_KEYS[d.getDay()]; // Sun, Mon, ...
}

function filterStaff(list, params = {}) {
  const { role, q, status, nurseKind, dept } = params;
  let out = [...list];

  // role doctor / nurse
  if (role && role !== "all") {
    if (role === "doctor") {
      out = out.filter((x) => x.vai_tro === "bac_si");
    } else if (role === "nurse") {
      out = out.filter((x) => x.vai_tro === "y_ta");
    }
  }

  // dept
  if (dept && dept !== "all") {
    out = out.filter(
      (x) => x.ma_khoa === dept || x.dept === dept
    );
  }

  // status online / offline / pause
  if (status && status !== "all") {
    out = out.filter((x) => x.status === status);
  }

  // loại điều dưỡng (filter cũ, giữ lại)
  if (nurseKind && nurseKind !== "all") {
    out = out.filter((x) => x.roleType === nurseKind);
  }

  // search
  if (q && q.trim()) {
    const s = q.toLowerCase();
    out = out.filter((x) => {
      return (
        x.name?.toLowerCase().includes(s) ||
        x.email?.toLowerCase().includes(s) ||
        x.dept?.toLowerCase().includes(s) ||
        x.specialties?.some((v) => v.toLowerCase().includes(s)) ||
        x.skills?.some((v) => v.toLowerCase().includes(s))
      );
    });
  }

  return out;
}

export const mockStaffApi = {
  async list(params = {}) {
    const items = filterStaff(STAFF, params);
    return { items, total: items.length };
  },

  async get(id) {
    return (
      STAFF.find((x) => x.id === id || x.ma_nhan_vien === id) ||
      STAFF[0] ||
      null
    );
  },

  async schedule(id) {
    const sched = STAFF_SCHEDULE[id] || STAFF_SCHEDULE.DEFAULT;
    const map = {};
    (sched.week || []).forEach(({ day, shift }) => {
      map[day] = shift;
    });
    return map;
  },

  async dutyRoom(id, dateISO) {
    const week = STAFF_DUTY_ROOMS[id] || STAFF_DUTY_ROOMS.DEFAULT;
    const day = dayKeyFromISO(dateISO);
    return {
      today: week[day] || "—",
      week,
    };
  },

  async stats(params = {}) {
    const items = filterStaff(STAFF, params);
    const online = items.filter((x) => x.status === "online").length;
    const idle = items.filter((x) => x.status === "pause").length; // pause ~ đang rảnh
    const depts = Array.from(
      new Set(items.map((x) => x.dept).filter(Boolean))
    ).length;
    return { online, idle, depts };
  },

  async updateStatus({ id, status }) {
    const idx = STAFF.findIndex(
      (x) => x.id === id || x.ma_nhan_vien === id
    );
    if (idx >= 0) {
      STAFF[idx] = { ...STAFF[idx], status };
      return STAFF[idx];
    }
    return null;
  },
};

// mockData.js (phần liên quan Pharmacy)

let stock = [
  {
    code: "PARA500",
    name: "Paracetamol 500mg",
    unit: "viên",
    price: 1500,
    usage: "Giảm đau, hạ sốt",
    qty: 320,
    exp: "2026-12-31",
    lot: "L0123",
  },
  {
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },{
    code: "AMOX500",
    name: "Amoxicillin 500mg",
    unit: "viên",
    price: 2500,
    usage: "Kháng sinh, nhiễm khuẩn hô hấp",
    qty: 180,
    exp: "2025-08-15",
    lot: "L0456",
  },
  {
    code: "CET10",
    name: "Cetirizine 10mg",
    unit: "viên",
    price: 2000,
    usage: "Chống dị ứng, mẩn ngứa",
    qty: 90,
    exp: "2025-03-20",
    lot: "L0789",
  },
  {
    code: "OMEP20",
    name: "Omeprazole 20mg",
    unit: "viên",
    price: 3500,
    usage: "Giảm tiết acid dạ dày",
    qty: 210,
    exp: "2027-01-10",
    lot: "L1111",
  },
  {
    code: "ORS",
    name: "Oresol gói",
    unit: "gói",
    price: 3000,
    usage: "Bù nước, điện giải",
    qty: 500,
    exp: "2026-05-01",
    lot: "L2222",
  },
  {
    code: "VITC500",
    name: "Vitamin C 500mg",
    unit: "viên",
    price: 1200,
    usage: "Tăng đề kháng",
    qty: 400,
    exp: "2025-11-30",
    lot: "L3333",
  },
  {
    code: "SALBUT",
    name: "Salbutamol xịt",
    unit: "chai",
    price: 75000,
    usage: "Giãn phế quản, hen phế quản",
    qty: 40,
    exp: "2026-09-01",
    lot: "L4444",
  },
  {
    code: "METFOR500",
    name: "Metformin 500mg",
    unit: "viên",
    price: 1800,
    usage: "Đái tháo đường type 2",
    qty: 260,
    exp: "2027-02-15",
    lot: "L5555",
  },
  {
    code: "LOSAR50",
    name: "Losartan 50mg",
    unit: "viên",
    price: 2200,
    usage: "Tăng huyết áp",
    qty: 9,
    exp: "2026-07-10",
    lot: "L6666",
  },
  {
    code: "ATOR20",
    name: "Atorvastatin 20mg",
    unit: "viên",
    price: 4200,
    usage: "Rối loạn mỡ máu",
    qty: 130,
    exp: "2026-10-05",
    lot: "L7777",
  },
].map((d) => ({
  ...d,
  status: computeStatus(d.exp),
}));

let orders = [
  {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  }, {
    id: "RX20241117001",
    at: "2024-11-17T09:15:00",
    ptId: "BN000001",
    ptName: "Nguyễn Văn A",
    doctor: "BS. Trần Thị B",
    diag: "Cảm cúm",
    total: 150000,
    status: "done",
    items: [
      {
        code: "PARA500",
        name: "Paracetamol 500mg",
        unit: "viên",
        dose: "1 viên x 3 lần/ngày",
        qty: 10,
        price: 1500,
      },
      {
        code: "VITC500",
        name: "Vitamin C 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 10,
        price: 1200,
      },
    ],
  },
  {
    id: "RX20241117002",
    at: "2024-11-17T10:30:00",
    ptId: "BN000002",
    ptName: "Trần Thị C",
    doctor: "BS. Nguyễn Văn D",
    diag: "Viêm họng",
    total: 180000,
    status: "pending",
    items: [
      {
        code: "AMOX500",
        name: "Amoxicillin 500mg",
        unit: "viên",
        dose: "1 viên x 2 lần/ngày",
        qty: 14,
        price: 2500,
      },
      {
        code: "CET10",
        name: "Cetirizine 10mg",
        unit: "viên",
        dose: "1 viên tối",
        qty: 7,
        price: 2000,
      },
    ],
  },
  // anh có thể thêm tiếp nhiều đơn tương tự...
];

export const mockPharmacyApi = {
  async listStock() {
    return stock;
  },
  async listPrescriptions() {
    return orders;
  },
  async upsertStock(form) {
    const idx = stock.findIndex((x) => x.code === form.code);
    if (idx >= 0) stock[idx] = { ...stock[idx], ...form };
    else stock.unshift(form);
    return form;
  },
};
function computeStatus(exp) {
  const today = new Date();
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return "hoat_dong";
  today.setHours(0,0,0,0);
  d.setHours(0,0,0,0);
  const diff = (d - today) / 86400000;
  if (diff < 0) return "het_han";
  return "hoat_dong";
}

