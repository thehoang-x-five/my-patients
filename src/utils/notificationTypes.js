const NOTIFICATION_TYPES = {
  he_thong: {
    labelVi: "Hệ thống",
    labelEn: "System",
    icon: "Settings",
    dot: "violet",
    group: "system",
  },
  system: {
    labelVi: "Hệ thống",
    labelEn: "System",
    icon: "Settings",
    dot: "violet",
    group: "system",
  },
  appointment: {
    labelVi: "Lịch hẹn",
    labelEn: "Appointment",
    icon: "CalendarDays",
    dot: "sky",
    group: "appointment",
  },
  lich_hen: {
    labelVi: "Lịch hẹn",
    labelEn: "Appointment",
    icon: "CalendarDays",
    dot: "sky",
    group: "appointment",
  },
  benh_nhan: {
    labelVi: "Bệnh nhân",
    labelEn: "Patient",
    icon: "UserRound",
    dot: "amber",
    group: "patient",
  },
  patient: {
    labelVi: "Bệnh nhân",
    labelEn: "Patient",
    icon: "UserRound",
    dot: "amber",
    group: "patient",
  },
  phieu_kham: {
    labelVi: "Phiếu khám",
    labelEn: "Clinical exam",
    icon: "Stethoscope",
    dot: "emerald",
    group: "clinical",
  },
  phieu_chan_doan: {
    labelVi: "Chẩn đoán",
    labelEn: "Diagnosis",
    icon: "ClipboardCheck",
    dot: "emerald",
    group: "clinical",
  },
  luot_kham: {
    labelVi: "Lượt khám",
    labelEn: "Visit",
    icon: "Activity",
    dot: "emerald",
    group: "clinical",
  },
  cls: {
    labelVi: "Cận lâm sàng",
    labelEn: "Clinical service",
    icon: "FlaskConical",
    dot: "cyan",
    group: "cls",
  },
  cls_tong_hop: {
    labelVi: "Tổng hợp CLS",
    labelEn: "CLS summary",
    icon: "FileText",
    dot: "cyan",
    group: "cls",
  },
  ket_qua_cls: {
    labelVi: "Kết quả CLS",
    labelEn: "CLS result",
    icon: "FileCheck2",
    dot: "red",
    group: "result",
  },
  result: {
    labelVi: "Kết quả",
    labelEn: "Result",
    icon: "FileCheck2",
    dot: "red",
    group: "result",
  },
  don_thuoc: {
    labelVi: "Đơn thuốc",
    labelEn: "Prescription",
    icon: "Pill",
    dot: "sky",
    group: "pharmacy",
  },
  nha_thuoc: {
    labelVi: "Nhà thuốc",
    labelEn: "Pharmacy",
    icon: "Pill",
    dot: "sky",
    group: "pharmacy",
  },
  pharmacy: {
    labelVi: "Nhà thuốc",
    labelEn: "Pharmacy",
    icon: "Pill",
    dot: "sky",
    group: "pharmacy",
  },
  hoa_don: {
    labelVi: "Hóa đơn",
    labelEn: "Invoice",
    icon: "ReceiptText",
    dot: "rose",
    group: "billing",
  },
  thanh_toan: {
    labelVi: "Thanh toán",
    labelEn: "Payment",
    icon: "CreditCard",
    dot: "rose",
    group: "billing",
  },
  billing: {
    labelVi: "Thanh toán",
    labelEn: "Billing",
    icon: "CreditCard",
    dot: "rose",
    group: "billing",
  },
  tai_kham: {
    labelVi: "Tái khám",
    labelEn: "Follow-up",
    icon: "AlarmClock",
    dot: "indigo",
    group: "reminder",
  },
  reminder: {
    labelVi: "Nhắc nhở",
    labelEn: "Reminder",
    icon: "BellRing",
    dot: "indigo",
    group: "reminder",
  },
};

const GROUP_TO_BACKEND_TYPES = {
  all: [],
  system: ["he_thong", "system"],
  appointment: ["lich_hen"],
  patient: ["benh_nhan"],
  clinical: ["phieu_kham", "phieu_chan_doan", "luot_kham"],
  cls: ["cls", "cls_tong_hop", "ket_qua_cls"],
  pharmacy: ["don_thuoc", "nha_thuoc"],
  billing: ["hoa_don", "thanh_toan"],
  reminder: ["tai_kham", "reminder"],
  result: ["ket_qua_cls", "result"],
};

export function normalizeNotificationType(type) {
  return String(type || "he_thong").trim().toLowerCase();
}

export function getNotificationTypeMeta(type) {
  const normalized = normalizeNotificationType(type);
  return (
    NOTIFICATION_TYPES[normalized] || {
      labelVi: normalized || "Thông báo",
      labelEn: normalized || "Notification",
      icon: "Bell",
      dot: "indigo",
      group: "other",
    }
  );
}

export function getNotificationTypeLabel(type, lang = "vi") {
  const meta = getNotificationTypeMeta(type);
  return lang === "en" ? meta.labelEn : meta.labelVi;
}

export function getNotificationTypeIcon(type) {
  return getNotificationTypeMeta(type).icon;
}

export function getNotificationTypeDot(type) {
  return getNotificationTypeMeta(type).dot;
}

export function getBackendTypesForFilterGroup(group) {
  return GROUP_TO_BACKEND_TYPES[group] || [];
}

export function getPrimaryBackendTypeForFilterGroup(group) {
  return getBackendTypesForFilterGroup(group)[0] || null;
}

export const notificationTypeOptions = [
  "he_thong",
  "lich_hen",
  "benh_nhan",
  "phieu_kham",
  "phieu_chan_doan",
  "luot_kham",
  "cls",
  "cls_tong_hop",
  "ket_qua_cls",
  "don_thuoc",
  "hoa_don",
  "thanh_toan",
  "tai_kham",
];

export const notificationFilterGroups = [
  "system",
  "appointment",
  "patient",
  "clinical",
  "cls",
  "pharmacy",
  "billing",
  "reminder",
  "result",
];
