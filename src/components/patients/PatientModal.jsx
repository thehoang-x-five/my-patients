
// src/components/patients/PatientModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Chip from "../ui/Chip.jsx";

// ✅ Chỉ dùng API & metadata từ layer API
import {
  STATUSES,
  useVisits,
  useTransactions,
  useAppointmentHolds,
  useExamTemplates,
  useExtraFields,
  useDepartments,
  useDoctorsQueue,
  // mutations
  useAddVisit,
  useAddTransaction,
  useCreateFollowupHold,
} from "../../api/patients.js";

import {
  useEnqueueWalkin,
  useEnqueueFromAppointment,
  useReturnToDoctor,
  useEnqueueService,
} from "../../api/queue.js";

import {
  useMarkServiceDispatched,
  useMarkServiceDone,
  useMarkWaitDoctorReview,
} from "../../api/patientFlow.js";

import PrintExamTicket from "../print/PrintExamTicket.jsx";

const ANIMATION_CONFIG = {
  initial: { opacity: 0, scale: 0.98, y: 8 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.98, y: 8 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

function StatusPill({ s }) {
  const low = (s || "").toLowerCase();
  const tone =
    /hoàn thành/.test(low)
      ? "emerald"
      : /hẹn tái khám/.test(low)
      ? "teal"
      : /hẹn khám/.test(low)
      ? "cyan"
      : /chờ xử lý/.test(low)
      ? "sky"
      : /chờ/.test(low)
      ? "amber"
      : "slate";
  const dot =
    /hoàn thành/.test(low)
      ? "emerald"
      : /hẹn tái khám/.test(low)
      ? "teal"
      : /chờ xử lý/.test(low)
      ? "sky"
      : /chờ/.test(low)
      ? "amber"
      : "slate";
  return (
    <Chip tone={tone} dot={dot} className="text-xs">
      {s || "—"}
    </Chip>
  );
}

export default function PatientModal({
  open,
  mode = "view",
  patient,
  onClose,
  onSave,
  onMutatePatient,
}) {
  const R = ({ label, value, classname }) => (
    <div className="space-y-1">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div
        className={`rounded-xl px-3 py-2 ring-1 ring-emerald-200/60 bg-white text-[13px] text-slate-800 whitespace-pre-wrap ${
          classname ? classname : ""
        }`}
      >
        {value && String(value).trim() ? value : "Không có nội dung"}
      </div>
    </div>
  );

  const firstRef = useRef(null);
  const scrollTopRef = useRef(null);

  const [form, setForm] = useState(patient || {});
  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  // ---------- Exam template / booking ----------
  const { data: tplList = [] } = useExamTemplates();
  const [tplId, setTplId] = useState(() => tplList[0]?.id || "T-KHAM-THUONG");
  const tpl = useMemo(
    () =>
      tplList.find((t) => t?.id === tplId) ||
      tplList[0] || { title: "Khám thường", price: 70000 },
    [tplId, tplList]
  );

  const [exam, setExam] = useState({
    type: "Khám thường",
    dept: "",
    room: "",
    symptoms: "",
    note: "",
  });

  const today = new Date().toISOString().slice(0, 10);
  const [booking, setBooking] = useState({
    date: today,
    time: "08:00",
    price: 70000,
    doctor: "",
    dept: "",
  });

  const [showDoctorSelect, setShowDoctorSelect] = useState(false);
  const [showDeptSelect, setShowDeptSelect] = useState(false);
  const [showRoomSelect, setShowRoomSelect] = useState(false);

  const DIAG_INIT = {
    dxPrimary: "",
    icd10: "",
    dxSecondary: "",
    summary: "",
    orders: "",
    advice: "",
    followup: "Cho thuốc về",
    followupDate: "",
    followupTime: "08:00",
  };
  const [diagnosisData, setDiagnosisData] = useState(DIAG_INIT);
  const [svcResults, setSvcResults] = useState([]);

  // ---------- Y tá xử lý ----------
  const [rx, setRx] = useState([]);
  const addRx = () =>
    setRx((s) => [
      ...s,
      {
        name: "",
        form: "",
        route: "",
        dose: "",
        freq: "",
        days: 1,
        qty: 1,
        price: 0,
        note: "",
      },
    ]);
  const updRx = (i, k, v) =>
    setRx((s) => s.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const delRx = (i) => setRx((s) => s.filter((_, idx) => idx !== i));
  const totalDrugAmount = useMemo(
    () =>
      rx.reduce((sum, r) => {
        const qty = Number(r.qty || 0);
        const price = Number(r.price || 0);
        return sum + (isFinite(qty * price) ? qty * price : 0);
      }, 0),
    [rx]
  );

  // ---------- Thông tin bổ sung ----------
  const { data: extraFields = [] } = useExtraFields();
  const [extras, setExtras] = useState([]);
  const [newExtraKey, setNewExtraKey] = useState(extraFields[0]?.key || "");
  const [newExtraVal, setNewExtraVal] = useState("");

  function pushExtra() {
    if (!newExtraVal.trim()) return;
    setExtras((s) => [{ key: newExtraKey, value: newExtraVal }, ...s]);
    setNewExtraVal("");
    setTimeout(() => {
      if (scrollTopRef.current) {
        scrollTopRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 100);
  }
  function removeExtra(i) {
    setExtras((s) => s.filter((_, idx) => idx !== i));
  }

  const [examExtras, setExamExtras] = useState([]);
  const [newExamKey, setNewExamKey] = useState(extraFields[0]?.key || "");
  const [newExamVal, setNewExamVal] = useState("");
  function pushExamExtra() {
    if (!newExamVal.trim()) return;
    setExamExtras((s) => [{ key: newExamKey, value: newExamVal }, ...s]);
    setNewExamVal("");
  }
  function removeExamExtra(i) {
    setExamExtras((s) => s.filter((_, idx) => idx !== i));
  }

  const patientExtras = useMemo(() => {
    if (!patient) return [];
    return (extraFields || [])
      .filter((f) => patient[f.key] && String(patient[f.key]).trim().length)
      .map((f) => ({ key: f.key, value: String(patient[f.key]), label: f.label }));
  }, [patient, extraFields]);

  useEffect(() => {
    if (!open) return;
    setForm(patient || {});
    setTplId(tplList[0]?.id || "T-KHAM-THUONG");
    setExam({ type: "Khám thường", dept: "", room: "", symptoms: "", note: "" });

    const preExtras = (extraFields || [])
      .filter((f) => patient?.[f.key] && String(patient[f.key]).trim().length)
      .map((f) => ({ key: f.key, value: String(patient[f.key]) }));
    setExamExtras(preExtras);

    setBooking({
      date: today,
      time: "08:00",
      price: 70000,
      doctor: "",
      dept: "",
    });
    setShowDoctorSelect(false);
    setShowDeptSelect(false);
    setShowRoomSelect(false);

    setRx([]);

    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, patient, today, extraFields, tplList]);

  useEffect(() => {
    if (!tpl) return;
    setBooking((b) => ({ ...b, price: Number(tpl.price ?? b.price ?? 70000) }));
  }, [tpl]);

  // ===== Server state (TanStack Query)
  const pidQ = patient?.id;
  const { data: visits = [] } = useVisits(pidQ);
  const { data: transactions = [] } = useTransactions(pidQ);
  const { data: holds = [] } = useAppointmentHolds(pidQ);
  // Metadata for departments / doctors
  const { data: departments = [] } = useDepartments();
  const { data: doctorsQueue = {} } = useDoctorsQueue();

  // Lần khám gần nhất
  const lastVisit = useMemo(() => {
    return [...visits].sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];
  }, [visits]);

  // ---- Helpers nhận diện trạng thái ----
  const statusLow = (patient?.status || "").toLowerCase();
  const isServiceIntake = /chờ tiếp nhận \(dịch vụ\)/i.test(statusLow);
  const isFollowupStatus = (patient?.status || "") === STATUSES.SCHEDULED_FUP;

  // Prefill cho Hẹn tái khám / Khám dịch vụ
  useEffect(() => {
    if (!open || mode !== "exam") return;
    if (isFollowupStatus) {
      const fup = holds.find((h) => h.type === "followup" && h.status === "scheduled");
      if (fup) {
        setExam((s) => ({ ...s, dept: fup.dept || "", room: "", note: lastVisit?.note || "" }));
        setBooking((b) => ({ ...b, doctor: fup.doctor || "", dept: fup.dept || "" }));
      } else {
        setExam((s) => ({ ...s, note: lastVisit?.note || "" }));
      }
    }
    if (isServiceIntake) {
      setTplId("T-KHAM-DV");
      setExam((s) => ({ ...s, type: "Khám dịch vụ", dept: "", symptoms: "", note: "" }));
    }
  }, [open, mode, isFollowupStatus, isServiceIntake, holds, lastVisit]);

  // ---- Danh sách phòng dịch vụ mặc định ----
  const SERVICE_ROOMS = ["X-Quang", "Siêu âm", "Xét nghiệm", "Nội soi"];

  // ---- UI ghi chú từng dịch vụ (nếu intake dịch vụ) ----
  const serviceItems = useMemo(() => {
    return Array.isArray(patient?.serviceOrder?.items)
      ? patient.serviceOrder.items
      : [];
  }, [patient?.serviceOrder]);

  const [serviceNotes, setServiceNotes] = useState([]);
  const [serviceRooms, setServiceRooms] = useState([]);
  useEffect(() => {
    setServiceNotes(serviceItems.map(() => ""));
    setServiceRooms(serviceItems.map(() => ""));
  }, [serviceItems]);

  const priceOfService = (name) => {
    const hit =
      tplList.find((t) => t.id === name || t.title === name) ||
      tplList.find((t) => t.title?.toLowerCase() === String(name).toLowerCase());
    return hit?.price || 0;
  };
  const totalServiceFee = serviceItems.reduce((sum, it) => sum + priceOfService(it), 0);

  function saveEdit(e) {
    e.preventDefault();
    const patch = { ...form };
    extras.forEach(({ key, value }) => {
      patch[key] = value;
    });
    onSave?.(patch, mode);
  }

  const bmi = useMemo(() => {
    const h = Number(patient?.heightCm || 0),
      w = Number(patient?.weightKg || 0);
    if (!h || !w) return null;
    const m = h / 100;
    return (w / (m * m)).toFixed(1);
  }, [patient?.heightCm, patient?.weightKg]);

  const availableDoctors = useMemo(() => {
    const deptName = exam.dept || booking.dept;
    if (!deptName) return [];
    const dept = (departments || []).find((d) => d.name === deptName);
    if (!dept) return [];
    return (dept.doctors || []).map((name) => ({
      name,
      ...(doctorsQueue?.[name] || { dept: deptName, waiting: 0, appointments: 0, status: "Đang làm việc" }),
    }));
  }, [exam.dept, booking.dept, departments, doctorsQueue]);

  const availableRooms = useMemo(() => {
    if (isServiceIntake) return SERVICE_ROOMS;
    const deptName = exam.dept || booking.dept;
    if (!deptName) return [];
    const dept = (departments || []).find((d) => d.name === deptName);
    return dept ? (dept.rooms || []) : [];
  }, [exam.dept, booking.dept, isServiceIntake, departments]);

  const waitingByDept = {};

  /* ==================== PRINT OVERLAY STATE ==================== */
  const [print, setPrint] = useState({ show: false, payload: {} });
  const openPrint = (payload) => setPrint({ show: true, payload });
  const closePrint = () => {
    setPrint({ show: false, payload: {} });
    onClose?.();
  };
  const currentUser =
    (typeof window !== "undefined" &&
      window.APP_USER &&
      (window.APP_USER.fullName || window.APP_USER.name)) ||
    "—";

  // ===== Mutations
  const addVisitMut = useAddVisit();
  const addTxnMut = useAddTransaction();
  const enqueueWalkinMut = useEnqueueWalkin();
  const enqueueFromApptMut = useEnqueueFromAppointment();
  const enqueueServiceMut = useEnqueueService();
  const returnToDoctorMut = useReturnToDoctor();
  const svcDispatched = useMarkServiceDispatched();
  const svcDone = useMarkServiceDone();
  const svcWaitReview = useMarkWaitDoctorReview();
  const createFollowupHold = useCreateFollowupHold(); // ✅ giữ ở top-level

  // ----------------- KHÁM TRỰC TIẾP -----------------
  function handleDirectExam() {
    const { id: pid, name } = form || {};
    if (!pid) return alert("Thiếu mã BN.");

    const dept = exam.dept || "";
    const doctor = booking.doctor || "";
    const room = exam.room || "";
    const fee = booking.price || tpl?.price || 70000;

    if (isServiceIntake) {
      const services = serviceItems;
      if (!services.length) return alert("Chưa có danh sách dịch vụ chỉ định.");

      if (totalServiceFee > 0) {
        addTxnMut.mutate({
          pid,
          data: {
            date: new Date().toLocaleDateString("vi-VN"),
            item: `Phí dịch vụ (${services.length} hạng mục)`,
            amount: totalServiceFee,
            status: "Đã thu",
            ref: `SV-${Date.now()}`,
          },
        });
      }

      const perNotes = services
        .map(
          (s, i) => `• ${s}${serviceRooms[i] ? ` @ ${serviceRooms[i]}` : ""}: ${serviceNotes[i] || "—"}`
        )
        .join("\n");

      enqueueServiceMut.mutate({
        pid,
        name,
        services,
        note: [exam.note || "", perNotes].filter(Boolean).join("\n"),
        dept: "Cận lâm sàng",
        doctor: "Khu dịch vụ",
      });
      svcDispatched.mutate({ pid });
      onMutatePatient?.(pid, { status: "Chờ khám (dịch vụ)" });

      openPrint({
        type: "service",
        patient: { id: pid, name, gender: form?.gender, dob: form?.dob, phone: form?.phone, address: form?.address },
        booking: { date: booking.date, time: booking.time, price: totalServiceFee, doctor: "Khu dịch vụ", dept: "Cận lâm sàng" },
        examInfo: { type: exam.type || tpl?.title || "Khám dịch vụ", note: exam.note || "" },
        isServiceIntake: true,
        totalServiceFee,
        feePaid: totalServiceFee > 0,
        services: (serviceItems || []).map((sv, i) => ({
          name: sv,
          room: serviceRooms[i] || `Phòng ${sv}`,
          price: priceOfService(sv),
          note: serviceNotes[i] || "",
        })),
      });

      return;
    }

    if (!dept || !room || !doctor) {
      alert("Vui lòng chọn đầy đủ khoa, phòng và bác sĩ.");
      return;
    }

    const label = isFollowupStatus ? "Ghi chú" : "Triệu chứng";
    const examNote = [
      `${label}: ${isFollowupStatus ? exam.note || "—" : exam.symptoms || "—"}`,
      ...examExtras.map((e) => {
        const lab = (extraFields || []).find((f) => f.key === e.key)?.label || e.key;
        return `${lab}: ${e.value}`;
      }),
    ].join("\n");

    addVisitMut.mutate({
      pid,
      data: {
        date: new Date().toISOString().slice(0, 10),
        dept,
        doctor,
        room,
        note: `Tiếp nhận trực tiếp • ${exam.type}\n${examNote}`,
        by: "Lễ tân",
        type: "Walk-in",
      },
    });

    if (fee > 0) {
      addTxnMut.mutate({
        pid,
        data: {
          date: new Date().toLocaleDateString("vi-VN"),
          item: `Phí khám (${exam.type})`,
          amount: fee,
          status: "Đã thu",
          ref: `WI${Date.now()}`,
        },
      });
    }

    enqueueWalkinMut.mutate({
      pid,
      name,
      dept,
      doctor,
      note: examNote,
      symptoms: exam.symptoms || "",
    });
    onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });

    window.dispatchEvent(new CustomEvent("app:navigate", { detail: { to: `/examination` } }));

    // In phiếu khám thường
    openPrint({
      patient: { id: pid, name, gender: form?.gender, dob: form?.dob, phone: form?.phone, address: form?.address },
      booking: { date: booking.date, time: booking.time, price: fee, doctor, dept },
      examInfo: { type: exam.type || tpl?.title || "Khám", dept, room },
      isServiceIntake: false,
      totalServiceFee: 0,
      feePaid: fee > 0,
    });
  }

  // ----------------- LUỒNG TÁI KHÁM (giữ chỗ) -----------------
  function handleFollowupExam() {
    const { id: pid, name } = form || {};
    if (!pid) return alert("Thiếu mã BN.");

    const fup = holds.find((h) => h.type === "followup" && h.status === "scheduled");
    if (!fup) {
      alert("Không tìm thấy lịch hẹn tái khám.");
      return;
    }

    const GRACE_MIN = 10; // ⏱️ thay cho QUEUE_RULES.GRACE_MIN
    const now = new Date();
    const st = new Date(`${fup.date}T${fup.time || "00:00"}:00`);
    const diffMin = Math.round((now - st) / 60000);
    const isLate = diffMin > GRACE_MIN;

    const dept = exam.dept || fup.dept || "";
    const doctor = booking.doctor || fup.doctor || "";
    const room = exam.room || "";

    if (!dept || !doctor) {
      alert("Vui lòng chọn khoa & bác sĩ (phòng có thể chọn sau).");
      return;
    }

    const examNote = [
      `Triệu chứng: ${exam.symptoms || "—"}`,
      ...examExtras.map((e) => {
        const lab = (extraFields || []).find((f) => f.key === e.key)?.label || e.key;
        return `${lab}: ${e.value}`;
      }),
    ].join("\n");

    addVisitMut.mutate({
      pid,
      data: {
        date: new Date().toISOString().slice(0, 10),
        dept,
        doctor,
        room,
        note: `Tái khám • ${exam.type} • ${isLate ? "ĐẾN TRỄ" : "ĐÚNG HẸN"}\n${examNote}`,
        by: "Điều dưỡng",
        type: "Tái khám",
      },
    });

    let feeLate = 0;
    if (isLate) {
      feeLate = tpl?.lateFee ?? tpl?.price ?? 35000;
      if (feeLate > 0) {
        addTxnMut.mutate({
          pid,
          data: {
            date: new Date().toLocaleDateString("vi-VN"),
            item: `Phí khám (Tái khám trễ hẹn)`,
            amount: feeLate,
            status: "Đã thu",
            ref: `FU-LATE-${Date.now()}`,
          },
        });
      }
    }

    enqueueFromApptMut.mutate({
      id: fup.id,
      date: fup.date,
      time: fup.time,
      patient: name,
      code: pid,
      dept,
      doctor,
      note: examNote,
      symptoms: exam.symptoms || "",
    });

    onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });

    window.dispatchEvent(new CustomEvent("app:navigate", { detail: { to: `/examination` } }));

    // In phiếu tái khám
    openPrint({
      printedBy: currentUser,
      patient: { id: pid, name, gender: form?.gender, dob: form?.dob, phone: form?.phone, address: form?.address },
      booking: { date: fup.date || booking.date, time: fup.time || booking.time, price: isLate ? feeLate : 0, doctor, dept },
      examInfo: { type: "Tái khám", dept, room, symptoms: exam.symptoms, note: exam.note },
      feePaid: isLate && feeLate > 0,
    });
  }

  // ----------------- HOÀN TẤT & THU PHÍ (THƯỜNG) -----------------
  function handleFinishDoctor() {
    const pid = form?.id;
    if (!pid) return;
    const now = new Date().toISOString().slice(0, 10);

    const d = diagnosisData || {};
    const noteLines = [
      `Chẩn đoán: ${d.dxPrimary || "—"}${d.icd10 ? ` (ICD-10: ${d.icd10})` : ""}`,
      d.dxSecondary ? `Chẩn đoán phụ: ${d.dxSecondary}` : "",
      d.summary ? `Tóm tắt: ${d.summary}` : "",
      d.orders ? `Chỉ định: ${d.orders}` : "",
      d.advice ? `Dặn dò: ${d.advice}` : "",
      d.followup ? `Hướng xử lý: ${d.followup}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    addVisitMut.mutate({
      pid,
      data: {
        date: now,
        dept: booking.dept || exam.dept || "",
        doctor: booking.doctor || "",
        note: noteLines,
        by: "Bác sĩ",
        type: "Kết thúc khám",
      },
    });

    const drugTotal = Number(totalDrugAmount || 0);
    if (drugTotal > 0) {
      addTxnMut.mutate({
        pid,
        data: {
          date: new Date().toLocaleDateString("vi-VN"),
          item: "Thuốc",
          amount: drugTotal,
          status: "Đã thu",
          ref: `RX-${Date.now()}`,
        },
      });
    }

    if (/tái khám/i.test(d.followup || "")) {
      const date = (d.followupDate || "").slice(0, 10);
      const time = d.followupTime || "08:00";
      if (date) {
        createFollowupHold.mutate({
          pid,
          data: {
            patient: form?.name || pid,
            date,
            time,
            dept: booking.dept || exam.dept || "",
            doctor: booking.doctor || "",
            note: d.advice || "Hẹn tái khám từ xử lý bác sĩ",
          },
        });
        onMutatePatient?.(pid, { status: STATUSES.SCHEDULED_FUP });
      } else {
        onMutatePatient?.(pid, { status: STATUSES.DONE });
      }
    } else {
      onMutatePatient?.(pid, { status: STATUSES.DONE });
    }

    onClose?.();
  }

  // ----------------- DỊCH VỤ: TRẢ VỀ BÁC SĨ -----------------
  function handleServiceReturnToDoctor() {
    const pid = form?.id;
    if (!pid) return;
    const fromDoctor = patient?.serviceOrder?.fromDoctor || booking.doctor || "Bác sĩ chỉ định";

    const now = new Date().toISOString().slice(0, 10);
    const svcNote = (svcResults || [])
      .map((r, i) => `#${i + 1} ${r.service}: ${r.result || "—"}${r.note ? ` • ${r.note}` : ""}`)
      .join("\n");

    // ⚠️ Fix Rules of Hooks: dùng addVisitMut (đã create ở top-level), KHÔNG gọi hook trong hàm
    addVisitMut.mutate({
      pid,
      data: {
        date: now,
        dept: "Cận lâm sàng",
        doctor: "Khu dịch vụ",
        note: `Hoàn tất dịch vụ:\n${svcNote}`,
        by: "Điều dưỡng CLS",
        type: "Dịch vụ hoàn tất",
      },
    });

    svcDone.mutate({ pid });
    svcWaitReview.mutate({ pid });
    returnToDoctorMut.mutate({
      name: form?.name || pid,
      dept: "Phòng khám",
      doctor: fromDoctor,
      note: "Đã có kết quả dịch vụ",
    });
    onClose?.();
  }

  // ----------------- RENDER -----------------
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            role="dialog"
            className="fixed inset-0 z-50 p-1 flex items-center justify-center pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-[min(1120px,100%)] max-h-[92vh] bg-white rounded-3xl shadow-2xl ring-1 ring-emerald-200/50 overflow-hidden pointer-events-auto"
            >
              <header className="sticky top-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-50/80 via-teal-50/60 to-emerald-50/80 backdrop-blur-sm border-b border-emerald-100/60">
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  {mode === "exam"
                    ? "Lập phiếu khám"
                    : mode === "edit"
                    ? "Chỉnh sửa bệnh nhân"
                    : mode === "add"
                    ? "Thêm bệnh nhân"
                    : mode === "process"
                    ? "Xử lý chẩn đoán"
                    : "Hồ sơ bệnh nhân"}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-xl bg-white/90 ring-1 ring-slate-200 text-slate-500 hover:text-slate-900 hover:shadow-sm transition-all grid place-items-center"
                  aria-label="Đóng"
                >
                  ✕
                </motion.button>
              </header>

              <div className="p-4 pt-1 overflow-y-auto max-h-[calc(92vh-73px)] scrollbar-none">
                {/* VIEW */}
                {mode === "view" && (
                  <motion.div {...ANIMATION_CONFIG} className="space-y-3">
                    <div className="flex items-start gap-3 pt-2">
                      <motion.div
                        whileHover={{ y: -3, scale: 1.03 }}
                        className="w-10 h-10 rounded-3xl ring-2 ring-emerald-200 bg-gradient-to-br from-emerald-100 to-teal-100 grid place-items-center font-black text-lg text-emerald-700 shadow-sm"
                      >
                        BN
                      </motion.div>
                      <motion.div
                        whileHover={{ y: -2 }}
                        className="flex-1 rounded-2xl p-4 bg-gradient-to-br from-white to-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm"
                      >
                        <div className="grid md:grid-cols-2 gap-3">
                          <div>
                            <div className="font-extrabold text-lg text-slate-900">
                              {patient?.name || "—"}
                            </div>
                            <div className="text-sm text-slate-600">
                              {patient?.id || "—"}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {patient?.dob || "—"} • {patient?.gender || "—"}
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-sm text-slate-700">
                              {patient?.phone || "—"}
                            </div>
                            <div className="text-sm text-slate-700">
                              {patient?.email || "—"}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {patient?.address || "—"}
                            </div>
                          </div>
                        </div>
                        {(() => {
                          const h = Number(patient?.heightCm || 0),
                            w = Number(patient?.weightKg || 0);
                          if (!h || !w) return null;
                          const m = h / 100;
                          const bmi = (w / (m * m)).toFixed(1);
                          return (
                            <div className="mt-3 pt-3 border-t border-emerald-100">
                              <Chip tone="emerald" dot="teal" className="text-xs">
                                BMI: {bmi}
                              </Chip>
                            </div>
                          );
                        })()}
                        {patientExtras.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-emerald-100">
                            <div className="text-xs font-semibold text-slate-600 mb-2">
                              Thông tin bổ sung
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {patientExtras.map((ex, i) => (
                                <Chip key={i} tone="slate" className="text-xs">
                                  {ex.label || ex.key}
                                </Chip>
                              ))}
                            </div>
                          </div>
                        )}
                      </motion.div>
                      <StatusPill s={patient?.status} />
                    </div>

                    <div className="grid lg:grid-cols-2 gap-4">
                      <motion.section
                        whileHover={{ y: -2 }}
                        className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-900">Lịch sử khám</h4>
                          <Chip tone="emerald" dot="emerald" className="text-xs">
                            {visits.length}
                          </Chip>
                        </div>
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
                          {visits.length ? (
                            visits.map((v, i) => (
                              <motion.div
                                key={`${v.date}-${i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-xl p-3 bg-emerald-50/50 ring-1 ring-emerald-100/50 hover:shadow-sm transition"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-slate-900">
                                      {v.date}
                                    </div>
                                    <div className="text-xs text-slate-600">
                                      {v.dept} • {v.doctor}
                                    </div>
                                    <div className="text-xs text-slate-700 mt-1 whitespace-pre-wrap line-clamp-2">
                                      {v.note || ""}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <Chip
                                        tone="slate"
                                        className="text-xs px-2 py-0.5"
                                      >
                                        {v.type || "—"}
                                      </Chip>
                                      <span className="text-xs text-slate-500">
                                        {v.by || "—"}
                                      </span>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      window.dispatchEvent(
                    new CustomEvent("app:navigate", { detail: { to: `/visits/${patient?.id}` } })
                                      )
                                    }
                                    className="shrink-0 w-7 h-7 rounded-lg border border-emerald-300 bg-white hover:bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold shadow-sm hover:shadow transition"
                                  >
                                    →
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-12 text-slate-400 text-sm">
                              Chưa có dữ liệu
                            </div>
                          )}
                        </div>
                      </motion.section>

                      <motion.section
                        whileHover={{ y: -2 }}
                        className="rounded-2xl p-4 ring-1 ring-emerald-200/50 bg-white shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-bold text-slate-900">Giao dịch</h4>
                          <Chip tone="cyan" dot="cyan" className="text-xs">
                            {transactions.length}
                          </Chip>
                        </div>
                        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 scrollbar-none">
                          {transactions.length ? (
                            transactions.map((t, i) => (
                              <motion.div
                                key={`${t.ref || i}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="rounded-xl p-3 bg-cyan-50/50 ring-1 ring-cyan-100/50 hover:shadow-sm transition"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-slate-900">
                                      {t.date}
                                    </div>
                                    <div className="text-xs text-slate-700">
                                      {t.item}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2">
                                      <span className="text-xs font-bold text-emerald-700 tabular-nums">
                                        {Number(t.amount || 0).toLocaleString("vi-VN")}đ
                                      </span>
                                      <Chip tone="amber" dot="amber" className="text-xs px-2 py-0.5">
                                        {t.status}
                                      </Chip>
                                    </div>
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() =>
                                      window.dispatchEvent(
                    new CustomEvent("app:navigate", { detail: { to: `/transactions/${patient?.id}` } })
                                      )
                                    }
                                    className="shrink-0 w-7 h-7 rounded-lg border border-cyan-300 bg-white hover:bg-cyan-50 flex items-center justify-center text-cyan-600 text-xs font-bold shadow-sm hover:shadow transition"
                                  >
                                    →
                                  </motion.button>
                                </div>
                              </motion.div>
                            ))
                          ) : (
                            <div className="text-center py-12 text-slate-400 text-sm">
                              Chưa có giao dịch
                            </div>
                          )}
                        </div>
                      </motion.section>
                    </div>

                    {!!patient?.pendingProcess?.services?.length && (
                      <motion.section
                        whileHover={{ y: -2 }}
                        className="rounded-2xl p-4 ring-1 ring-violet-200/60 bg-gradient-to-br from-violet-50/60 to-white shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-slate-900">
                            Chỉ định dịch vụ cần thực hiện
                          </h4>
                          <Chip tone="violet" dot="violet" className="text-xs">
                            {patient.pendingProcess.services.length}
                          </Chip>
                        </div>
                        <ul className="list-disc pl-5 mt-2 text-sm text-slate-800">
                          {patient.pendingProcess.services.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                        {patient.pendingProcess.dx?.advice && (
                          <div className="mt-3 p-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 text-sm text-slate-800">
                            <b>Dặn dò/ghi chú:</b>{" "}
                            {patient.pendingProcess.dx.advice}
                          </div>
                        )}
                        <div className="mt-4 flex items-center gap-2">
                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              window.dispatchEvent(
                                new CustomEvent("app:navigate", {
                                  detail: { to: `/examination` },
                                })
                              )
                            }
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                          >
                            Chuyển đi khám dịch vụ
                          </motion.button>

                          <motion.button
                            whileHover={{ y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() =>
                              alert(
                                "Sau khi dịch vụ hoàn tất, Y tá sẽ đẩy kết quả về bác sĩ đã chỉ định (khỏi chờ)."
                              )
                            }
                            className="px-3 py-2 rounded-xl ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                          >
                            Quy trình trả kết quả
                          </motion.button>
                        </div>
                      </motion.section>
                    )}
                  </motion.div>
                )}

                {/* ADD / EDIT */}
                {(mode === "edit" || mode === "add") && (
                  <motion.form
                    {...ANIMATION_CONFIG}
                    onSubmit={saveEdit}
                    className="space-y-3 "
                  >
                    <div ref={scrollTopRef} />
                    <motion.div
                      whileHover={{ y: -1 }}
                      className="grid md:grid-cols-2 gap-3 p-3 rounded-2xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm"
                    >
                      <label className="text-sm font-semibold text-slate-700">
                        Mã BN
                        <input
                          ref={firstRef}
                          value={form.id || ""}
                          onChange={(e) => change("id", e.target.value)}
                          required
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Họ và tên
                        <input
                          value={form.name || ""}
                          onChange={(e) => change("name", e.target.value)}
                          required
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Ngày sinh
                        <input
                          type="date"
                          value={form.dob || ""}
                          onChange={(e) => change("dob", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Giới tính
                        <select
                          value={form.gender || ""}
                          onChange={(e) => change("gender", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        >
                          <option value="">—</option>
                          <option>Nam</option>
                          <option>Nữ</option>
                          <option>Khác</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Điện thoại
                        <input
                          value={form.phone || ""}
                          onChange={(e) => change("phone", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Email
                        <input
                          value={form.email || ""}
                          onChange={(e) => change("email", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700 md:col-span-2">
                        Địa chỉ
                        <input
                          value={form.address || ""}
                          onChange={(e) => change("address", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        />
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Bảo hiểm
                        <select
                          value={form.insurance || ""}
                          onChange={(e) => change("insurance", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        >
                          <option value="">—</option>
                          <option value="Có">Có</option>
                          <option value="Không">Không</option>
                        </select>
                      </label>
                      <label className="text-sm font-semibold text-slate-700">
                        Trạng thái
                        <select
                          value={form.status || STATUSES.WAIT_INTAKE}
                          onChange={(e) => change("status", e.target.value)}
                          className="mt-2 w-full rounded-xl px-4 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition-all shadow-sm"
                        >
                          {mode === "add" ? (
                            <>
                              <option>{STATUSES.WAIT_INTAKE}</option>
                              <option>{STATUSES.SCHEDULED_APPT}</option>
                            </>
                          ) : (
                            <>
                              <option>{STATUSES.WAIT_INTAKE}</option>
                              <option>{STATUSES.WAIT_EXAM}</option>
                              <option>{STATUSES.WAIT_PROC}</option>
                              <option>{STATUSES.SCHEDULED_APPT}</option>
                              <option>{STATUSES.SCHEDULED_FUP}</option>
                              <option>{STATUSES.DONE}</option>
                            </>
                          )}
                        </select>
                      </label>
                    </motion.div>

                    {extras.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        {extras.map((ex, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.01 }}
                            className="rounded-xl p-3 bg-white ring-1 ring-slate-200 flex items-center justify-between shadow-sm"
                          >
                            <div className="text-sm flex-1 min-w-0">
                              <b className="text-slate-700">
                                {extraFields.find((f) => f.key === ex.key)?.label || ex.key}:
                              </b>
                              <span className="text-slate-600 ml-2">{ex.value}</span>
                            </div>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeExtra(i)}
                              className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs"
                            >
                              ✕
                            </motion.button>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}

                    <div className="flex items-end gap-2 p-3 rounded-xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={pushExtra}
                        className="px-2 py-1 rounded-xl border-2 border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm hover:shadow transition whitespace-nowrap"
                      >
                        + Thêm thông tin
                      </motion.button>
                      <label className="text-sm flex-1">
                        Loại
                        <select
                          value={newExtraKey}
                          onChange={(e) => setNewExtraKey(e.target.value)}
                          className="mt-1.5 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
                        >
                          {extraFields.map((o) => (
                            <option key={o.key} value={o.key}>
                              {o.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm flex-[2]">
                        Nội dung
                        <input
                          value={newExtraVal}
                          onChange={(e) => setNewExtraVal(e.target.value)}
                          className="mt-1.5 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition"
                          placeholder="Nhập nội dung..."
                        />
                      </label>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-1">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onClose}
                        className="px-6 py-2.5 rounded-xl ring-1 ring-slate-300 text-slate-700 hover:bg-slate-50 font-semibold transition"
                      >
                        Hủy
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                      >
                        {mode === "add" ? "Lưu bệnh nhân mới" : "Lưu thay đổi"}
                      </motion.button>
                    </div>
                  </motion.form>
                )}

                {/* EXAM */}
                {mode === "exam" && (
  <motion.div {...ANIMATION_CONFIG} className="space-y-3">
    <motion.section
      whileHover={{ y: -2 }}
      className="rounded-2xl p-2 mt-2 mb-0 ring-1 ring-emerald-200/50 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-900">Phiếu khám</h4>
        <Chip tone="emerald" dot="emerald" className="text-xs">
          {exam.type || tpl.title}
        </Chip>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <div className="rounded-xl p-3.5 bg-emerald-50/60 ring-1 ring-emerald-100">
          <div className="text-xs text-slate-600 mb-1">Bệnh nhân</div>
          <div className="font-bold text-slate-900">{form?.name}</div>
          <div className="text-xs text-slate-600">{form?.id}</div>
        </div>
        <div className="rounded-xl p-3.5 bg-cyan-50/60 ring-1 ring-cyan-100">
          <div className="text-xs text-slate-600 mb-1">Loại khám</div>
          <div className="font-bold text-slate-900">
            {exam.type || tpl.title}
          </div>
        </div>
        <div className="rounded-xl p-3.5 bg-amber-50/60 ring-1 ring-amber-100">
          <div className="text-xs text-slate-600 mb-1">Mức phí</div>
          <div className="font-bold text-emerald-700">
            {(isServiceIntake ? totalServiceFee : booking.price)?.toLocaleString("vi-VN")}đ
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-5">
        {!isServiceIntake && (
          <>
            <label className="text-sm font-semibold text-slate-700">
              Mẫu khám
              <select
                value={tplId}
                onChange={(e) => {
                  setTplId(e.target.value);
                  setExam((s) => ({
                    ...s,
                    type: e.target.options[e.target.selectedIndex].text,
                  }));
                }}
                className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
              >
                {tplList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Chuyên khoa
              <button
                type="button"
                onClick={() => setShowDeptSelect(true)}
                className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-left transition hover:bg-emerald-50 shadow-sm"
              >
                {exam.dept || "Chọn khoa..."}
              </button>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Bác sĩ
              <button
                type="button"
                onClick={() => setShowDoctorSelect(true)}
                className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-left transition hover:bg-emerald-50 shadow-sm"
              >
                {booking.doctor || "Chọn bác sĩ..."}
              </button>
            </label>
          </>
        )}
        {!isServiceIntake && (
          <label className="text-sm font-semibold text-slate-700">
            Phòng
            <button
              type="button"
              onClick={() => setShowRoomSelect(true)}
              className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-left transition hover:bg-emerald-50 shadow-sm"
            >
              {exam.room || "Chọn phòng..."}
            </button>
          </label>
        )}
        <label className="text-sm font-semibold text-slate-700">
          Ngày
          <input
            type="date"
            value={booking.date}
            onChange={(e) =>
              setBooking((b) => ({ ...b, date: e.target.value }))
            }
            className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Giờ
          <input
            type="time"
            value={booking.time}
            onChange={(e) =>
              setBooking((b) => ({ ...b, time: e.target.value }))
            }
            className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition shadow-sm"
          />
        </label>
      </div>

      {!isServiceIntake && (
        <label className="text-sm font-semibold text-slate-700 mb-2 block">
          {isFollowupStatus ? "Ghi chú" : "Triệu chứng"}
          <textarea
            rows={2}
            value={isFollowupStatus ? exam.note : exam.symptoms}
            onChange={(e) =>
              isFollowupStatus
                ? setExam((s) => ({ ...s, note: e.target.value }))
                : setExam((s) => ({
                    ...s,
                    symptoms: e.target.value,
                  }))
            }
            className="mt-2 w-full rounded-xl px-3 py-2.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white transition resize-none shadow-sm"
          />
        </label>
      )}

      {isServiceIntake && (
        <div className="mt-0 mb-2 rounded-2xl p-3 ring-1 ring-amber-200 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-slate-900">
              Dịch vụ đã chỉ định
            </h5>
            <Chip tone="amber" dot="amber" className="text-xs">
              {serviceItems.length || 0}
            </Chip>
          </div>
          <div className="mt-2 space-y-2">
            {(serviceItems.length ? serviceItems : ["(Không có dịch vụ)"]).map((sv, idx) => (
              <div key={idx} className="rounded-xl p-2 bg-white ring-1 ring-amber-100">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 md:col-span-6 font-semibold text-sm truncate">
                    {sv}
                  </div>
                  <div className="col-span-3 md:col-span-3 text-sm font-bold text-emerald-700 tabular-nums">
                    {serviceItems.length ? priceOfService(sv).toLocaleString("vi-VN") : 0}đ
                  </div>
                  <div className="col-span-3 md:col-span-3">
                    <select
                      value={serviceRooms[idx] || ""}
                      onChange={(e) =>
                        setServiceRooms((arr) => arr.map((x, i) => (i === idx ? e.target.value : x)))
                      }
                      className="w-full rounded-lg px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 bg-white text-sm"
                      disabled={!serviceItems.length}
                    >
                      <option value="">{serviceItems.length ? "Chọn phòng…" : "—"}</option>
                      {SERVICE_ROOMS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <input
                  value={serviceNotes[idx] || ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setServiceNotes((s) => s.map((x, i) => (i === idx ? v : x)));
                  }}
                  className="mt-2 w-full rounded-lg px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
                  placeholder={serviceItems.length ? "Ghi chú riêng cho dịch vụ này…" : "Không có nội dung"}
                  disabled={!serviceItems.length}
                />
              </div>
            ))}
          </div>
          <label className="block text-sm font-semibold text-slate-700 mt-3">
            Ghi chú
            <textarea
              rows={2}
              value={exam.note}
              onChange={(e) => setExam((s) => ({ ...s, note: e.target.value }))}
              className="mt-2 w-full rounded-xl px-3 py-2 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-sm"
              placeholder="Ghi chú chung…"
            />
          </label>
          <div className="mt-3 flex items-center justify-end gap-3">
            <span className="text-sm text-slate-600">Tổng phí</span>
            <span className="text-base font-extrabold text-emerald-700">
              {totalServiceFee.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>
      )}

      {examExtras.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mb-4">
          {examExtras.map((ex, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.01 }}
              className="rounded-xl p-3 bg-white ring-1 ring-slate-200 flex items-center justify-between shadow-sm"
            >
              <div className="text-sm flex-1">
                <b className="text-slate-700">
                  {extraFields.find((f) => f.key === ex.key)?.label || ex.key}:
                </b>
                <span className="ml-2 text-slate-600">{ex.value}</span>
              </div>
              <motion.button
                type="button"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => removeExamExtra(i)}
                className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </motion.button>
            </motion.div>
          ))}
        </motion.div>
      )}

      <div className="flex items-end gap-2 p-3 mt-2 rounded-xl bg-emerald-50/30 ring-1 ring-emerald-200/50 shadow-sm">
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={pushExamExtra}
          className="px-2 py-1 rounded-xl border-2 border-emerald-400 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold shadow-sm hover:shadow transition whitespace-nowrap"
        >
          + Thêm dòng
        </motion.button>
        <label className="text-sm flex-1">
          Loại thông tin
          <select
            value={newExamKey}
            onChange={(e) => setNewExamKey(e.target.value)}
            className="mt-1.5 w-full rounded-xl px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs transition"
          >
            {extraFields.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm flex-[2]">
          Nội dung
          <input
            value={newExamVal}
            onChange={(e) => setNewExamVal(e.target.value)}
            className="mt-1.5 w-full rounded-xl px-2 py-1.5 ring-1 ring-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-xs transition"
            placeholder="Nhập..."
          />
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-200">
        {isFollowupStatus ? (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleFollowupExam}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            Lập phiếu tái khám (Miễn phí)
          </motion.button>
        ) : (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDirectExam}
            className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
          >
            {isServiceIntake
              ? "Lập phiếu khám dịch vụ & Thu phí"
              : "Lập phiếu khám & Thu phí"}
          </motion.button>
        )}
      </div>
    </motion.section>
  </motion.div>
)}


                {/* PROCESS */}
                {mode === "process" && !isServiceIntake && (
                  <motion.div {...ANIMATION_CONFIG} className="space-y-3">
                    <motion.section
                      whileHover={{ y: -2 }}
                      className="rounded-2xl p-3 mt-2 mb-0 ring-1 ring-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
                    >
                      <h4 className="font-bold text-slate-900 mb-3">
                        Xử lý chẩn đoán
                      </h4>
                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        <R label="Chẩn đoán chính" value={diagnosisData?.dxPrimary} />
                        <R label="ICD-10" value={diagnosisData?.icd10} />
                        <div className="md:col-span-2">
                          <R label="Chẩn đoán phụ" value={diagnosisData?.dxSecondary} />
                        </div>
                        <div className="md:col-span-2">
                          <R label="Tóm tắt" value={diagnosisData?.summary} />
                        </div>
                        <div className="md:col-span-2">
                          <R label="Chỉ định" value={diagnosisData?.orders} />
                        </div>
                        <div className="md:col-span-2">
                          <R label="Dặn dò" value={diagnosisData?.advice} />
                        </div>
                        <R
                          label="Hướng xử lý"
                          value={diagnosisData?.followup || "Không có nội dung"}
                          classname={"ring-orange-200 bg-yellow-50/40"}
                        />
                        {/tái khám/i.test(diagnosisData?.followup || "") && (
                          <>
                            <R label="Ngày tái khám" value={diagnosisData?.followupDate} />
                            <R label="Giờ tái khám" value={diagnosisData?.followupTime} />
                          </>
                        )}
                      </div>

                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-2">
                        <div className="text-sm font-semibold text-slate-700 mb-2">
                          Đơn thuốc
                        </div>
                        {rx.length === 0 ? (
                          <div className="rounded-xl px-3 py-2 ring-1 ring-sky-200 bg-sky-50/40 text-[13px] text-slate-600">
                            Không có đơn thuốc
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="rounded-xl ring-1 ring-sky-200 bg-sky-50/40 overflow-hidden shadow-sm"
                          >
                            <table className="min-w-full text-sm">
                              <thead className="bg-emerald-50">
                                <tr className="text-xs font-bold text-slate-700">
                                  <th className="px-3 py-2.5 text-left">#</th>
                                  <th className="px-3 py-2.5 text-left">Thuốc</th>
                                  <th className="px-3 py-2.5 text-left">Dạng</th>
                                  <th className="px-3 py-2.5 text-left">Đường dùng</th>
                                  <th className="px-3 py-2.5 text-left">Liều</th>
                                  <th className="px-3 py-2.5 text-left">Số lần/ngày</th>
                                  <th className="px-3 py-2.5 text-left">Số ngày</th>
                                  <th className="px-3 py-2.5 text-left">Số lượng</th>
                                  <th className="px-3 py-2.5 text-left">Đơn giá</th>
                                  <th className="px-3 py-2.5 text-left">Ghi chú</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rx.map((r, i) => (
                                  <motion.tr
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 + i * 0.1 }}
                                    className="border-t border-slate-100 hover:bg-emerald-50/30 transition"
                                  >
                                    <td className="px-3 py-2">{i + 1}</td>
                                    <td className="px-3 py-2">{r.name || "—"}</td>
                                    <td className="px-3 py-2">{r.form || "—"}</td>
                                    <td className="px-3 py-2">{r.route || "—"}</td>
                                    <td className="px-3 py-2">{r.dose || "—"}</td>
                                    <td className="px-3 py-2">{r.freq || "—"}</td>
                                    <td className="px-3 py-2">{r.days ?? "—"}</td>
                                    <td className="px-3 py-2">{r.qty ?? "—"}</td>
                                    <td className="px-3 py-2">{r.price ?? "—"}</td>
                                    <td className="px-3 py-2 text-xs">{r.note || "—"}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </motion.div>
                        )}
                        <div className="mt-2 text-right text-sm">
                          Tổng tiền thuốc:{" "}
                          <b className="tabular-nums">
                            {totalDrugAmount.toLocaleString("vi-VN")}đ
                          </b>
                        </div>
                      </motion.div>

                      <div className="flex items-center justify-end gap-3 mt-2 pt-2 border-t border-slate-200">
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.02, y: -1 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleFinishDoctor}
                          className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold shadow-md hover:shadow-lg transition"
                        >
                          Hoàn tất & thu phí
                        </motion.button>
                      </div>
                    </motion.section>
                  </motion.div>
                )}

                {/* PROCESS — DỊCH VỤ */}
                {mode === "process" && isServiceIntake && (
  <motion.div {...ANIMATION_CONFIG} className="space-y-3">
    <motion.section
      whileHover={{ y: -2 }}
      className="rounded-2xl p-3 mt-2 mb-0 ring-1 ring-emerald-200/60 bg-gradient-to-br from-emerald-50/60 to-white shadow-sm"
    >
      <h4 className="font-bold text-slate-900 mb-2">
        Kết quả dịch vụ
      </h4>
      {svcResults.length === 0 ? (
        <div className="rounded-xl px-3 py-2 ring-1 ring-emerald-200/60 bg-white text-[13px] text-slate-600">
          Chưa có kết quả dịch vụ
        </div>
      ) : (
        <div className="space-y-3">
          {svcResults.map((r, i) => (
            <div
              key={i}
              className="rounded-xl p-3 ring-1 ring-emerald-200 bg-white"
            >
              <div className="font-semibold text-slate-900">
                {r.service}
              </div>
              <div className="mt-2 grid md:grid-cols-3 gap-3">
                <R label="Kết quả" value={r.result} />
                <R
                  classname="ring-orange-200 bg-yellow-50/40"
                  label="Ghi chú"
                  value={r.note}
                />
                <R
                  classname="ring-sky-200 bg-sky-50/30"
                  label="File đính kèm"
                  value={(r.attachments || []).join(", ")}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 mt-3 pt-2 border-t border-slate-200">
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={handleServiceReturnToDoctor}
          className="px-7 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-semibold shadow-md hover:shadow-lg transition"
        >
          Chuyển về bác sĩ chẩn đoán
        </motion.button>
      </div>
    </motion.section>
  </motion.div>
)}

              </div>
            </motion.div>

            {/* SELECT MODALS (Dept/Room/Doctor) */}
            {showDeptSelect && (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] p-2 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-200 max-w-2xl w-full overflow-hidden"
      >
        <header className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <h3 className="font-bold text-slate-900">Chọn khoa</h3>
          <button
            onClick={() => setShowDeptSelect(false)}
            className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            ✕
          </button>
        </header>
        <div className="p-4 pt-2 overflow-y-auto max-h-[60vh] scrollbar-none">
          <div className="space-y-2">
            {DEPARTMENTS.map((dept) => (
              <motion.button
                key={dept.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setExam((s) => ({ ...s, dept: dept.name, room: "" }));
                  setBooking((b) => ({
                    ...b,
                    dept: dept.name,
                    doctor: "",
                  }));
                  setShowDeptSelect(false);
                }}
                className="w-full rounded-xl p-3 bg-white ring-1 ring-slate-200 hover:ring-emerald-300 hover:bg-emerald-50/50 transition text-left"
              >
                <div className="font-semibold text-slate-900">
                  {dept.name}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {dept.rooms.length} phòng • {dept.doctors.length} bác sĩ
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
)}

{showRoomSelect && availableRooms.length > 0 && (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] p-2 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-200 max-w-xl w-full overflow-hidden"
      >
        <header className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <h3 className="font-bold text-slate-900">Chọn phòng</h3>
          <button
            onClick={() => setShowRoomSelect(false)}
            className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            ✕
          </button>
        </header>
        <div className="p-4 pt-2 overflow-y-auto max-h-[60vh] scrollbar-none">
          <div className="space-y-2">
            {availableRooms.map((room) => {
              const deptWaiting = waitingByDept[exam.dept || booking.dept || ""] || 0;
              return (
                <motion.button
                  key={room}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setExam((s) => ({ ...s, room }));
                    setShowRoomSelect(false);
                  }}
                  className="w-full rounded-xl p-3 bg-white ring-1 ring-slate-200 hover:ring-emerald-300 hover:bg-emerald-50/50 transition text-left font-medium flex items-center justify-between"
                >
                  <span>{room}</span>
                  <span className="text-xs text-slate-500">
                    Đang chờ trong khoa: <b className="text-slate-700">{deptWaiting}</b>
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
)}

{showDoctorSelect && (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] p-2 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.97, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl ring-1 ring-emerald-200 max-w-4xl w-full max-h-[80vh] overflow-hidden"
      >
        <header className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <h3 className="font-bold text-slate-900">Chọn bác sĩ</h3>
          <button
            onClick={() => setShowDoctorSelect(false)}
            className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 text-slate-600 hover:text-slate-900 transition"
          >
            ✕
          </button>
        </header>
        <div className="p-4 pt-2 overflow-y-auto max-h-[calc(80vh-73px)] scrollbar-none">
          <div className="rounded-xl ring-1 ring-slate-200 overflow-hidden">
            <table className="min-w-full text-sm">
              <thead className="bg-emerald-50">
                <tr className="text-xs font-bold text-slate-700">
                  <th className="px-3 py-2.5 text-left">Bác sĩ</th>
                  <th className="px-3 py-2.5 text-left">Khoa</th>
                  <th className="px-3 py-2.5 text-left">Đang chờ</th>
                  <th className="px-3 py-2.5 text-left">Lịch hẹn</th>
                  <th className="px-3 py-2.5 text-left">Trạng thái</th>
                  <th className="px-3 py-2.5 text-left">Chọn</th>
                </tr>
              </thead>
              <tbody>
                {availableDoctors.map((doc) => (
                  <motion.tr
                    key={doc.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-slate-100 hover:bg-emerald-50/30 transition"
                  >
                    <td className="px-3 py-2.5 font-semibold text-slate-900">
                      {doc.name}
                    </td>
                    <td className="px-3 py-2.5">{doc.dept}</td>
                    <td className="px-3 py-2.5">
                      <Chip tone="amber" dot="amber" className="text-xs">
                        {doc.waiting}
                      </Chip>
                    </td>
                    <td className="px-3 py-2.5">
                      <Chip tone="teal" dot="teal" className="text-xs">
                        {doc.appointments}
                      </Chip>
                    </td>
                    <td className="px-3 py-2.5">
                      <Chip tone="emerald" dot="emerald" className="text-xs">
                        {doc.status}
                      </Chip>
                    </td>
                    <td className="px-3 py-2.5">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setBooking((b) => ({ ...b, doctor: doc.name }));
                          setShowDoctorSelect(false);
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition"
                      >
                        Chọn
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
                {availableDoctors.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      Chưa chọn khoa
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
)}
            {/* PRINT OVERLAY */}
            <PrintExamTicket
              show={print.show}
              onAfterPrint={closePrint}
              patient={{
                id: form?.id,
                name: form?.name,
                gender: form?.gender,
                dob: form?.dob,
                phone: form?.phone,
                address: form?.address,
              }}
              exam={{
                type: exam.type,
                dept: exam.dept,
                room: exam.room,
                symptoms: exam.symptoms,
                note: exam.note,
              }}
              booking={{
                date: booking.date,
                time: booking.time,
                price: isServiceIntake ? totalServiceFee : booking.price,
                doctor: booking.doctor,
                dept: booking.dept,
              }}
              isServiceIntake={isServiceIntake}
              totalServiceFee={totalServiceFee}
              services={(serviceItems || []).map((sv, i) => ({
                name: sv,
                room: serviceRooms[i] || `Phòng ${sv}`,
                price: priceOfService(sv),
                note: serviceNotes[i] || "",
              }))}
              feePaid={isServiceIntake ? totalServiceFee > 0 : (booking.price || 0) > 0}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
