// Dữ liệu demo & helpers cho Live Chat

export const CHANNELS = ["Facebook", "Zalo", "Website", "Hotline"];

export const PATIENTS = {
  BN001: {
    id: "BN001",
    name: "Nguyễn Văn An",
    gender: "Nam",
    dob: "1990-02-21",
    phone: "0901234567",
    email: "nguyenvana@email.com",
    address: "Quận 3, TP.HCM",
    insurance: "Có",
    allergies: "Penicillin",
    doctor: "BS. Trần Thị Bình",
    blood: "O+",
    note: "Nhắc tái khám 03/11",
    chronicConditions: "Tăng huyết áp",
  },
};

export const THREADS = [
  {
    id: "t1",
    role: "patient",
    patientId: "BN001",
    avatar: "BN",
    name: "Nguyễn Văn An",
    channel: "Facebook",
    lastAt: "08:45",
    snippet: "Tôi muốn đặt lịch tái khám…",
    unread: 1,
    pinned: false,
    archived: false,
  },
  {
    id: "t2",
    role: "patient",
    patientId: null,
    avatar: "ML",
    name: "Trần Mỹ Linh",
    channel: "Zalo",
    lastAt: "Hôm qua",
    snippet: "Em bị viêm họng, cần tư vấn thuốc…",
    unread: 0,
    pinned: true,
    archived: false,
  },
  {
    id: "t3",
    role: "doctor",
    patientId: null,
    avatar: "BS",
    name: "BS. Phạm Quang",
    channel: "Hotline",
    lastAt: "2 ngày trước",
    snippet: "Cập nhật lịch trực tuần sau…",
    unread: 0,
    pinned: false,
    archived: false,
  },
  {
    id: "t4",
    role: "nurse",
    patientId: null,
    avatar: "YT",
    name: "Điều dưỡng Khoa Nội",
    channel: "Website",
    lastAt: "09:10",
    snippet: "Danh sách BN chờ vào phòng…",
    unread: 3,
    pinned: false,
    archived: false,
  },
];

export const MESSAGES = {
  t1: [
    {
      id: "m1",
      dir: "in",
      text: "Xin chào, tôi muốn đặt lịch tái khám.",
      at: "08:30",
    },
    {
      id: "m2",
      dir: "out",
      text: "Dạ vâng, anh/chị cho biết mã bệnh nhân?",
      at: "08:31",
    },
    { id: "m3", dir: "in", text: "Mã của tôi là BN001 ạ.", at: "08:31" },
  ],
  t2: [
    {
      id: "m1",
      dir: "in",
      text: "Em bị viêm họng, cần tư vấn thuốc.",
      at: "13:34",
    },
  ],
  t3: [
    { id: "m1", dir: "in", text: "Tôi cần đổi ca trực ngày 12.", at: "10:12" },
  ],
  t4: [
    { id: "m1", dir: "in", text: "Bổ sung 2 BN vào danh sách.", at: "09:08" },
  ],
};
