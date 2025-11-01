import { STATUSES } from "./patients.js";
import { SERVICE_STATUSES } from "./patientFlow.js";

export const QUEUE_RULES = {
  GRACE_MIN: 10,
  EARLY_WIN_MIN: 20,
  VERY_LATE_MIN: 30,
};

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn(getQueue()));

const _QUEUE = [];
// item: {id, apptId, pid, name, dept, doctor, date, time, checkIn, priority, source, tag, early, late, lateFlag, status, note, symptoms}

export function addListener(fn) { listeners.add(fn); return () => listeners.delete(fn); }
export const subscribe = addListener;

export function getQueue() { return _QUEUE.map((x) => ({ ...x })); }
export function clearQueue() { _QUEUE.length = 0; emit(); }

function rank(it) {
  if (it.priority === "emergency") return 0;
  if (it.tag === "followup") return 1;
  if (it.tag === "appointment") return 2;
  if (it.tag === "service") return 2.5;
  if (it.late) return 4;
  if (it.source === "walkin") return 5;
  if (it.early) return 6;
  return 3;
}

function parseDT(d, t) { return new Date(`${d}T${t || "00:00"}:00`); }
function effectiveTime(it) {
  const st = parseDT(it.date, it.time);
  if (it.late) return new Date(Math.max(it.checkIn.getTime(), st.getTime()));
  return st;
}
function sortQueue(a, b) {
  const r = rank(a) - rank(b);
  if (r !== 0) return r;
  const et = effectiveTime(a) - effectiveTime(b);
  if (et !== 0) return et;
  return a.checkIn - b.checkIn;
}

function _makeItem(base) {
  return {
    id: base.id || globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2),
    apptId: base.apptId ?? null,
    pid: base.pid || base.code || "",
    name: base.name || base.patient || "",
    dept: base.dept || "",
    doctor: base.doctor || "",
    date: base.date,
    time: base.time || "",
    checkIn: base.checkIn || new Date(),
    priority: base.priority || "normal",
    source: base.source || "appt",    // "appt" | "walkin" | "service"
    tag: base.tag || null,            // "appointment" | "followup" | "service" | "serviceReturn" | null
    early: !!base.early,
    late: !!base.late,
    lateFlag: base.lateFlag || "",
    status: base.status || STATUSES.WAIT_EXAM,
    note: base.note || "",
    symptoms: base.symptoms || "",
  };
}

/** Check-in từ GIỮ CHỖ/TÁI KHÁM — KHÔNG xoá hold, KHÔNG auto start */
export function enqueueFromAppointment(hold, opts = {}) {
  const now = opts.now || new Date();
  const st = parseDT(hold.date, hold.time);
  const diffMin = Math.round((now - st) / 60000);

  let src = "appt";
  let early = false, late = false, lateFlag = "";
  if (diffMin <= -QUEUE_RULES.EARLY_WIN_MIN) {
    early = true;
  } else if (diffMin > QUEUE_RULES.GRACE_MIN && diffMin <= QUEUE_RULES.VERY_LATE_MIN) {
    late = true;
    lateFlag = "Đến trễ";
  } else if (diffMin > QUEUE_RULES.VERY_LATE_MIN) {
    src = "walkin";
  }

  const tag = hold.type === "followup" ? "followup" : "appointment";

  const item = _makeItem({
    id: hold.id,
    apptId: hold.id,
    pid: hold.pid || hold.code,
    name: hold.patient,
    dept: hold.dept,
    doctor: hold.doctor,
    date: hold.date,
    time: hold.time,
    checkIn: now,
    source: src,
    tag,
    early,
    late,
    lateFlag,
    note: opts.note,
    symptoms: opts.symptoms,
  });

  _QUEUE.push(item);
  _QUEUE.sort(sortQueue);
  emit();
  return item;
}

export function enqueueWalkin({ pid, name, dept, doctor, note, symptoms }) {
  const item = _makeItem({
    source: "walkin",
    tag: null,
    pid, name, dept, doctor,
    date: new Date().toISOString().slice(0, 10),
    time: "",
    note, symptoms,
  });
  _QUEUE.push(item);
  _QUEUE.sort(sortQueue);
  emit();
  return item;
}

/** Gửi bệnh nhân đi DỊCH VỤ */
export function enqueueService({ pid, name, services = [], note = "", dept = "Cận lâm sàng", doctor = "Khu dịch vụ" }) {
  const item = _makeItem({
    source: "service",
    tag: "service",
    pid, name, dept, doctor,
    date: new Date().toISOString().slice(0,10),
    time: "",
    note: [services.join(", "), note].filter(Boolean).join(" • "),
    symptoms: "",
    status: SERVICE_STATUSES?.WAIT_EXAM_SVC || "Chờ khám (dịch vụ)",
  });
  _QUEUE.push(item);
  _QUEUE.sort(sortQueue);
  emit();
  return item;
}

/** Trả bệnh nhân về BÁC SĨ sau khi xong dịch vụ */
export function enqueueReturnToDoctor({ pid, name, dept = "Phòng khám", doctor, note = "Đã có kết quả dịch vụ" }) {
  const item = _makeItem({
    source: "walkin",
    tag: "serviceReturn",
    pid, name, dept, doctor,
    date: new Date().toISOString().slice(0,10),
    time: "",
    note,
    status: STATUSES.WAIT_EXAM,
  });
  _QUEUE.push(item);
  _QUEUE.sort(sortQueue);
  emit();
  return item;
}

export function markEmergency(id, flag = true) {
  const it = _QUEUE.find((x) => x.id === id);
  if (it) { it.priority = flag ? "emergency" : "normal"; _QUEUE.sort(sortQueue); emit(); }
}
export function startExam(id) {
  const it = _QUEUE.find((x) => x.id === id);
  if (it) { it.status = "Đang khám"; emit(); }
}
export function finishAndRemove(id) {
  const i = _QUEUE.findIndex((x) => x.id === id);
  if (i !== -1) { _QUEUE.splice(i, 1); emit(); }
}
export function skipOnce(id) {
  const i = _QUEUE.findIndex((x) => x.id === id);
  if (i === -1) return;
  const it = _QUEUE[i];
  _QUEUE.splice(i, 1);
  it.checkIn = new Date(it.checkIn.getTime() + 60000);
  _QUEUE.push(it);
  _QUEUE.sort(sortQueue);
  emit();
}
export function markNoShow(id) {
  const it = _QUEUE.find((x) => x.id === id);
  if (!it) return;
  it.status = "Không đến";
  _QUEUE.splice(_QUEUE.indexOf(it), 1);
  emit();
}
