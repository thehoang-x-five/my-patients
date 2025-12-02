// src/components/patients/PatientModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { toast } from "react-toastify";

import PatientFormMode from "./PatientFormMode.jsx";
import PatientViewMode from "./PatientViewMode.jsx";
import PatientExamMode from "./PatientExamMode.jsx";
import PatientProcessMode from "./PatientProcessMode.jsx";

// Lấy luôn SERVICE_ROOMS ở đây cho gọn
import { StatusPill, ANIMATION_CONFIG, SERVICE_ROOMS } from "./Shared.jsx";

import {
  STATUSES,
  mapTodayStatusLabel,
  usePatientDetail,
} from "../../api/patients";
// Metadata khám LS (extra fields, dịch vụ khám)
import {
  EXTRA_FIELDS,
  useExamServices,
  useServiceInfo,
  useCreateClinicalExam,
} from "../../api/examination";

// Hàng đợi (enqueue khám LS, CLS, quay lại khám)
import {
  useQueueToday,
  enqueueFromAppointment,
  enqueueService,
  enqueueReturnToDoctor,
  enqueueWalkin,
} from "../../api/queue";
// Lịch hẹn (nếu cần làm follow-up)
import { APPT_STATUS, APPT_STATUS_LABEL } from "../../api/appointments";
// Billing (thu tiền)
import { useCreateInvoice } from "../../api/billing";

import PrintExamTicket from "../print/PrintExamTicket.jsx";

// (giả sử các helper addVisit, addTransaction, listAppointmentHolds, getLastVisit,
//  createFollowupHold, markAppointmentDoneForPid, markServiceDispatched,
//  markServiceDone, markWaitDoctorReview, QUEUE_RULES, Chip ... vẫn được import
//  hoặc defined ở file khác như trước – em giữ nguyên các đoạn gọi chúng)

export default function PatientModal({
  open,
  mode = "view",
  patient,
  onClose,
  onSave,
  onMutatePatient,
}) {
  const firstRef = useRef(null);
  const scrollTopRef = useRef(null);


  
 
  
  const [form, setForm] = useState(patient || {});
  const change = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  // ===== Lấy chi tiết bệnh nhân để ViewMode hiển thị lịch sử khám/giao dịch =====
  const patientId =
    patient?.MaBenhNhan ||
    patient?.maBenhNhan ||
    patient?.id ||
    form?.id ||
    "";

    const {
      data: patientDetail,
      isFetching: loadingPatientDetail,
      isError: errorPatientDetail,
    }  = usePatientDetail(patientId, {
    enabled: open && !!patientId && mode !== "add",
  });

  // Ưu tiên data detail (có LichSuKham, LichSuGiaoDich, bệnh sử đầy đủ)
  const patientForView = useMemo(
    () => (patientDetail ? { ...patient, ...patientDetail } : patient),
    [patient, patientDetail]
  );

  // ================= EXAM TEMPLATE / BOOKING =================

  const [tplId, setTplId] = useState(null);

  // Lấy danh sách dịch vụ (overview) – BE đã normalize trong examination.js
  const { data: examServices = [] } = useExamServices({}, { enabled: true });

  // Map dịch vụ -> template cho tab khám
  const tplList = useMemo(
    () =>
      (examServices || []).map((s) => {
        const id =
          s.id ??
          s.maDichVu ??
          s.MaDichVu ??
          s.maDV ??
          s.MaDV ??
          s.code ??
          s.Code ??
          null;

        const title =
          s.title ??
          s.tenDichVu ??
          s.TenDichVu ??
          s.tenDV ??
          s.TenDV ??
          s.name ??
          "";

        const price =
          s.price ??
          s.donGia ??
          s.DonGia ??
          s.don_gia ??
          s.DonGia ??
          0;

        return { id, title, price: Number(price) || 0, _raw: s };
      }),
    [examServices]
  );

  const tpl = useMemo(
    () =>
      (tplId ? tplList.find((t) => t?.id === tplId) : null) ||
      tplList[0] || { id: "", title: "", price: 0 },
    [tplId, tplList]
  );

  // Thông tin khoa + phòng + bác sĩ của dịch vụ hiện tại
  const { data: serviceInfo } = useServiceInfo(tpl?.id, {
    enabled: !!tpl?.id,
  });

  const today = new Date().toISOString().slice(0, 10);

  const [exam, setExam] = useState({
    type: "",
    dept: "",
    room: "",
    symptoms: "",
    note: "",
  });

  const [booking, setBooking] = useState({
    date: today,
    time: "",
    price: 0,
    doctor: "",
    dept: "",
  });

  // Khi serviceInfo thay đổi -> prefill khoa / phòng / bác sĩ / đơn giá
  useEffect(() => {
    if (!serviceInfo) return;

    const tenKhoa =
      serviceInfo.TenKhoa ||
      serviceInfo.tenKhoa ||
      serviceInfo.ten_khoa ||
      "";
    const tenPhong =
      serviceInfo.TenPhong ||
      serviceInfo.tenPhong ||
      serviceInfo.ten_phong ||
      "";
    const tenBacSi =
      serviceInfo.TenBacSi ||
      serviceInfo.tenBacSi ||
      serviceInfo.ten_bac_si ||
      "";
    const donGia =
      serviceInfo.DonGia ??
      serviceInfo.donGia ??
      serviceInfo.price ??
      serviceInfo.PhiDV ??
      serviceInfo.phiDV ??
      null;

    setExam((s) => ({
      ...s,
      dept: s.dept || tenKhoa,
      room: s.room || tenPhong,
    }));

    setBooking((b) => ({
      ...b,
      dept: b.dept || tenKhoa,
      doctor: b.doctor || tenBacSi,
      price:
        b.price && b.price > 0
          ? b.price
          : donGia != null
          ? Number(donGia) || b.price || 0
          : b.price || 0,
    }));
  }, [serviceInfo]);

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
    followupTime: "",
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

  const isSvcProcessing = useMemo(
    () =>
      new RegExp(
        `^${STATUSES.WAIT_PROC_SVC.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        )}$`,
        "i"
      ).test(patientForView?.status || ""),
    [patientForView?.status]
  );

  // ---------- Thông tin bổ sung ----------
  const [extras, setExtras] = useState([]);
  const [newExtraKey, setNewExtraKey] = useState(EXTRA_FIELDS[0]?.key || "");
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
  const [newExamKey, setNewExamKey] = useState(EXTRA_FIELDS[0]?.key || "");
  const [newExamVal, setNewExamVal] = useState("");
  function pushExamExtra() {
    if (!newExamVal.trim()) return;
    setExamExtras((s) => [{ key: newExamKey, value: newExamVal }, ...s]);
    setNewExamVal("");
  }
  function removeExamExtra(i) {
    setExamExtras((s) => s.filter((_, idx) => idx !== i));
  }

    // ---------- Derived ----------
    const patientExtras = useMemo(() => {
      const src = patientForView;
      if (!src) return [];
      return EXTRA_FIELDS.filter(
        (f) => src[f.key] && String(src[f.key]).trim().length
      ).map((f) => ({
        key: f.key,
        value: String(src[f.key]),
        label: f.label,
      }));
    }, [patientForView]);
  

  useEffect(() => {
    if (!open) return;
    setForm(patient || {});
    // Không hardcode template ID, để user chọn từ danh sách
    setTplId(null);
    setExam({ type: "", dept: "", room: "", symptoms: "", note: "" });
    const preExtras = EXTRA_FIELDS.filter(
      (f) => patient?.[f.key] && String(patient[f.key]).trim().length
    ).map((f) => ({ key: f.key, value: String(patient[f.key]) }));
    setExamExtras(preExtras);

    setBooking({
      date: today,
      time: "",
      price: 0,
      doctor: "",
      dept: "",
    });
    setShowDoctorSelect(false);
    setShowDeptSelect(false);
    setShowRoomSelect(false);

    setRx([]);

    if (patient && mode === "process") {
      setDiagnosisData((prev) => prev ?? DIAG_INIT);
      const svcItems = Array.isArray(patient?.serviceOrder?.items)
        ? patient.serviceOrder.items
        : [];
      setSvcResults(
        svcItems.map((s) => ({
          service: s,
          result: "",
          note: "",
          attachments: [],
        }))
      );
    }

    if (patient && mode === "edit") {
      const pre = EXTRA_FIELDS.filter(
        (f) => patient[f.key] && String(patient[f.key]).trim().length
      ).map((f) => ({ key: f.key, value: String(patient[f.key]) }));
      setExtras(pre);
    } else {
      setExtras([]);
    }

    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, patient, mode, today]);



  useEffect(() => {
    if (!tpl) return;
    // Chỉ cập nhật giá nếu tpl có giá và booking chưa có giá
    if (tpl.price && tpl.price > 0) {
      setBooking((b) => ({ ...b, price: b.price && b.price > 0 ? b.price : Number(tpl.price) }));
    }
    // Cập nhật type từ template nếu exam.type đang trống
    if (tpl.title && !exam.type) {
      setExam((s) => ({ ...s, type: s.type || tpl.title }));
    }
  }, [tpl, exam.type]);
// Lịch sử khám từ PatientDetail
const visits = useMemo(() => {
  const p = patientForView;
  if (!p) return [];
  if (Array.isArray(p.visits)) return p.visits;
  if (Array.isArray(p.LichSuKham)) return p.LichSuKham;
  if (Array.isArray(p.lich_su_kham)) return p.lich_su_kham;
  return [];
}, [patientForView]);

// Lịch sử giao dịch từ PatientDetail
const transactions = useMemo(() => {
  const p = patientForView;
  if (!p) return [];
  if (Array.isArray(p.transactions)) return p.transactions;
  if (Array.isArray(p.LichSuGiaoDich)) return p.LichSuGiaoDich;
  if (Array.isArray(p.lich_su_giao_dich)) return p.lich_su_giao_dich;
  return [];
}, [patientForView]);

  // ---- Helpers nhận diện trạng thái ----
  const statusLow = (patientForView?.status || "").toLowerCase();
  const isServiceIntake = /cho_tiep_nhan_dv|chờ tiếp nhận \(dịch vụ\)/i.test(
    statusLow
  );
  const isFollowupStatus =
    (patientForView?.status || "") === STATUSES.SCHEDULED_FUP;


  // ---- Prefill cho Hẹn tái khám ----
  useEffect(() => {
    if (!open || mode !== "exam") return;
    if (isFollowupStatus) {
      const holds = listAppointmentHolds(patient?.id || "");
      const fup = holds.find(
        (h) => h.type === "followup" && h.status === "scheduled"
      );
      if (fup) {
        setExam((s) => ({ ...s, dept: fup.dept || "", room: "" }));
        setBooking((b) => ({
          ...b,
          doctor: fup.doctor || "",
          dept: fup.dept || "",
        }));
      }
      const last = getLastVisit(patient?.id || "");
      setExam((s) => ({ ...s, note: last?.note || "" }));
    }
    if (isServiceIntake) {
      // Không hardcode template ID cho dịch vụ, để user chọn
      setExam((s) => ({
        ...s,
        type: s.type || "",
        dept: "",
        symptoms: "",
        note: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

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

  // Giá 1 dịch vụ từ danh sách services overview
  const priceOfService = (name) => {
    if (!name) return 0;
    const hit = (examServices || []).find((s) => {
      const id =
        s.id ??
        s.maDichVu ??
        s.MaDichVu ??
        s.maDV ??
        s.MaDV ??
        s.code ??
        s.Code;
      const title =
        s.tenDichVu ??
        s.TenDichVu ??
        s.tenDV ??
        s.TenDV ??
        s.name;
      return id === name || title === name;
    });
    const price =
      hit?.DonGia ??
      hit?.donGia ??
      hit?.price ??
      hit?.PhiDV ??
      hit?.phiDV ??
      0;
    return Number(price) || 0;
  };

  const totalServiceFee = serviceItems.reduce(
    (sum, it) => sum + priceOfService(it),
    0
  );

  function saveEdit(e) {
    e.preventDefault();
    const src = form || {};
  
    // Map thông tin bổ sung
    const extrasMap = {};
    extras.forEach((ex) => {
      const v = ex.value;
      switch (ex.key) {
        case "di_ung":
          extrasMap.DiUng = v;
          break;
        case "chong_chi_dinh":
          extrasMap.ChongChiDinh = v;
          break;
        case "thuoc_dang_dung":
          extrasMap.ThuocDangDung = v;
          break;
        case "tieu_su_benh":
          extrasMap.TieuSuBenh = v;
          break;
        case "tien_su_phau_thuat":
          extrasMap.TienSuPhauThuat = v;
          break;
        case "nhom_mau":
          extrasMap.NhomMau = v;
          break;
        case "benh_man_tinh":
          extrasMap.BenhManTinh = v;
          break;
        case "sinh_hieu":
          extrasMap.SinhHieu = v;
          break;
        default:
          extrasMap[ex.key] = v;
      }
    });
  
    const payload = {
      // Map sang BE UpsertPatient
      MaBenhNhan:
        src.MaBenhNhan ||
        src.maBenhNhan ||
        src.id ||
        patient?.MaBenhNhan ||
        "",
      HoTen: src.HoTen || src.hoTen || src.name || "",
      NgaySinh: src.NgaySinh || src.ngaySinh || src.dob || null,
      GioiTinh: src.GioiTinh || src.gioiTinh || src.gender || "",
      DienThoai: src.DienThoai || src.dienThoai || src.phone || "",
      Email: src.Email || src.email || "",
      DiaChi: src.DiaChi || src.diaChi || src.address || "",
      TrangThaiTaiKhoan:
        src.TrangThaiTaiKhoan || src.accountStatus || "hoat_dong",
  
      // Không gửi TrangThaiHomNay ở đây – update qua API UpdateDailyStatus riêng
  
      ...extrasMap,
  
      // giữ lại vài field FE nếu hook upsert có dùng
      id: src.id,
      name: src.name,
      phone: src.phone,
      email: src.email,
      address: src.address,
    };
  
    onSave?.(payload, mode);
  }
  



  // Bác sĩ khả dụng: lấy từ ServiceDetailInfoDto
  const availableDoctors = useMemo(() => {
    if (!serviceInfo) return [];
    const name =
      serviceInfo.TenBacSi ||
      serviceInfo.tenBacSi ||
      serviceInfo.ten_bac_si ||
      "";
    if (!name) return [];
    const deptName =
      serviceInfo.TenKhoa ||
      serviceInfo.tenKhoa ||
      serviceInfo.ten_khoa ||
      "";
    return [
      {
        name,
        dept: deptName,
        waiting: "—",
        appointments: "—",
        status: "Đang làm việc",
      },
    ];
  }, [serviceInfo]);

  // Danh sách phòng: ưu tiên phòng của dịch vụ, fallback SERVICE_ROOMS
  const availableRooms = useMemo(() => {
    const base = SERVICE_ROOMS || [];
    if (!serviceInfo) return base;
    const tenPhong =
      serviceInfo.TenPhong ||
      serviceInfo.tenPhong ||
      serviceInfo.ten_phong ||
      "";
    if (!tenPhong) return base;
    const rest = base.filter((r) => r !== tenPhong);
    return [tenPhong, ...rest];
  }, [serviceInfo]);

  // Khoa hiện tại: chỉ 1 khoa lấy từ serviceInfo
  const DEPARTMENTS = useMemo(() => {
    if (!serviceInfo) return [];
    const id =
      serviceInfo.MaKhoa ||
      serviceInfo.maKhoa ||
      serviceInfo.code ||
      serviceInfo.Code ||
      null;
    const name =
      serviceInfo.TenKhoa ||
      serviceInfo.tenKhoa ||
      serviceInfo.ten_khoa ||
      "";
    return [{ id, name, rooms: [], doctors: [] }];
  }, [serviceInfo]);

  // Lấy danh sách hàng đợi để tính số lượng chờ theo khoa
  const { data: queueData } = useQueueToday();
  const queueItems = Array.isArray(queueData?.items) ? queueData.items : [];

  // Hook để tạo phiếu khám lâm sàng
  const createClinicalExamMut = useCreateClinicalExam();
  // Hook để tạo hóa đơn (thay thế addTransaction)
  const createInvoiceMut = useCreateInvoice();

  const waitingByDept = useMemo(() => {
    const map = {};
    queueItems.forEach((it) => {
      const k = it.dept || "";
      map[k] = (map[k] || 0) + 1;
    });
    return map;
  }, [queueItems]);

  /* ==================== PRINT OVERLAY STATE ==================== */
  const [print, setPrint] = useState({ show: false, payload: null });

  const openPrint = (payload = {}) => {
    if (payload.booking) {
      setBooking((prev) => ({
        ...prev,
        ...payload.booking,
      }));
    }

    if (payload.examInfo) {
      setExam((prev) => ({
        ...prev,
        ...payload.examInfo,
      }));
    }

    if (payload.patient) {
      setForm((prev) => ({
        ...prev,
        ...payload.patient,
      }));
    }

    setPrint({ show: true, payload });
  };

  const closePrint = () => {
    setPrint({ show: false, payload: null });
    onClose?.();
  };

  const currentUser =
    (typeof window !== "undefined" &&
      window.APP_USER &&
      (window.APP_USER.fullName || window.APP_USER.name)) ||
    "—";

  // ----------------- LUỒNG KHÁM TRỰC TIẾP -----------------
  async function handleDirectExam() {
    const { id: pid, name } = form || {};
    if (!pid) return alert("Thiếu mã BN.");

    const dept = exam.dept || booking.dept || "";
    const doctor = booking.doctor || "";
    const room = exam.room || "";
    const fee = booking.price || tpl?.price || 0;

    if (isServiceIntake) {
      const services = serviceItems;
      if (!services.length)
        return alert("Chưa có danh sách dịch vụ chỉ định.");

      // Tạo hóa đơn cho dịch vụ
      if (totalServiceFee > 0) {
        try {
          await createInvoiceMut.mutateAsync({
            MaBenhNhan: pid,
            LoaiDotThu: "can_lam_sang",
            SoTien: totalServiceFee,
            NoiDung: `Phí dịch vụ (${services.length} hạng mục)`,
            PhuongThucThanhToan: "tien_mat",
          });
        } catch (err) {
          console.error("Lỗi khi tạo hóa đơn dịch vụ:", err);
        }
      }

      const perNotes = services
        .map(
          (s, i) =>
            `• ${s}${serviceRooms[i] ? ` @ ${serviceRooms[i]}` : ""}: ${
              serviceNotes[i] || "—"
            }`
        )
        .join("\n");

      enqueueService({
        pid,
        name,
        services,
        note: [exam.note || "", perNotes].filter(Boolean).join("\n"),
        dept: "Cận lâm sàng",
        doctor: "Khu dịch vụ",
      });
      markServiceDispatched(pid);
      onMutatePatient?.(pid, { status: "Chờ khám (dịch vụ)" });

      openPrint({
        type: "service",
        patient: {
          id: pid,
          name,
          gender: form?.gender,
          dob: form?.dob,
          phone: form?.phone,
          address: form?.address,
        },
        exam: {
          type: exam.type,
          dept: exam.dept,
          room: exam.room,
          symptoms: exam.symptoms,
          note: exam.note,
        },
        booking: {
          date: booking.date,
          time: booking.time,
          price: totalServiceFee,
          doctor,
          dept,
        },
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
      `${label}: ${
        isFollowupStatus ? exam.note || "—" : exam.symptoms || "—"
      }`,
      ...examExtras.map(
        (e) =>
          `${
            EXTRA_FIELDS.find((f) => f.key === e.key)?.label || e.key
          }: ${e.value}`
      ),
    ].join("\n");

    // Map examExtras sang format API
    const extraFields = {};
    examExtras.forEach((e) => {
      const key = e.key;
      if (key === "di_ung") extraFields.DiUng = e.value;
      else if (key === "chong_chi_dinh") extraFields.ChongChiDinh = e.value;
      else if (key === "thuoc_dang_dung") extraFields.ThuocDangDung = e.value;
      else if (key === "tieu_su_benh") extraFields.TieuSuBenh = e.value;
      else if (key === "tien_su_phau_thuat") extraFields.TienSuPhauThuat = e.value;
      else if (key === "nhom_mau") extraFields.NhomMau = e.value;
      else if (key === "benh_man_tinh") extraFields.BenhManTinh = e.value;
      else if (key === "sinh_hieu") extraFields.SinhHieu = e.value;
    });

    // Lấy MaKhoa, MaPhong, MaBacSi từ serviceInfo hoặc form
    const maKhoa = serviceInfo?.MaKhoa || serviceInfo?.maKhoa || null;
    const maPhong = serviceInfo?.MaPhong || serviceInfo?.maPhong || null;
    const maBacSi = serviceInfo?.MaBacSi || serviceInfo?.maBacSi || null;

    // Lấy MaNguoiLap từ user hiện tại
    const getCurrentUserId = () => {
      try {
        // Thử lấy từ localStorage
        const authData = localStorage.getItem("his-auth");
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed?.user?.id) return parsed.user.id;
          if (parsed?.userId) return parsed.userId;
          if (parsed?.maNhanSu) return parsed.maNhanSu;
        }
        // Thử lấy từ window.APP_USER
        if (typeof window !== "undefined" && window.APP_USER) {
          return window.APP_USER.id || window.APP_USER.userId || window.APP_USER.maNhanSu || "admin";
        }
      } catch (err) {
        console.error("Lỗi khi lấy user ID:", err);
      }
      return "admin"; // Fallback
    };

    // Lấy MaDichVuKham từ template
    const maDichVuKham = tpl?.id || tplId || null;

    // Tạo phiếu khám lâm sàng
    let maPhieuKham = null;
    try {
      const clinicalExamResult = await createClinicalExamMut.mutateAsync({
        MaBenhNhan: pid,
        MaKhoa: maKhoa,
        MaPhong: maPhong,
        MaBacSiKham: maBacSi,
        MaNguoiLap: getCurrentUserId(),
        MaDichVuKham: maDichVuKham,
        HinhThucTiepNhan: isFollowupStatus ? "tai_kham" : "tiep_nhan_truc_tiep",
        LoaiPhieuKham: exam.type || null,
        TrieuChung: exam.symptoms || "",
        GhiChu: examNote,
        ...extraFields,
      });
      maPhieuKham = clinicalExamResult?.MaPhieuKham || clinicalExamResult?.maPhieuKham || clinicalExamResult?.id || null;
    } catch (err) {
      console.error("Lỗi khi tạo phiếu khám:", err);
      toast.error("Không thể tạo phiếu khám. Vui lòng thử lại.");
      return;
    }

    // Tạo hóa đơn nếu có phí
    if (fee > 0) {
      try {
        await createInvoiceMut.mutateAsync({
          MaBenhNhan: pid,
          MaPhieuKham: maPhieuKham,
          LoaiDotThu: "kham_lam_sang",
          SoTien: fee,
          NoiDung: `Phí khám (${exam.type})`,
          PhuongThucThanhToan: "tien_mat",
        });
      } catch (err) {
        console.error("Lỗi khi tạo hóa đơn:", err);
      }
    }

    enqueueWalkin({
      pid,
      name,
      dept,
      doctor,
      note: examNote,
      symptoms: exam.symptoms || "",
    });
    onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });

    window.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: { to: `/examination` },
      })
    );

    // In phiếu khám thường
    openPrint({
      type: "walkin",
      patient: {
        id: pid,
        name,
        gender: form?.gender,
        dob: form?.dob,
        phone: form?.phone,
        address: form?.address,
      },
      booking: {
        date: booking.date,
        time: booking.time,
        price: fee,
        doctor,
        dept,
      },
      examInfo: { type: exam.type || tpl?.title || "Khám", dept, room },
      isServiceIntake: false,
      totalServiceFee: 0,
      feePaid: fee > 0,
    });
  }

  // ----------------- LUỒNG TÁI KHÁM (giữ chỗ) -----------------
  async function handleFollowupExam() {
    const { id: pid, name } = form || {};
    if (!pid) return alert("Thiếu mã BN.");

    const holds = listAppointmentHolds(pid);
    const fup = holds.find(
      (h) => h.type === "followup" && h.status === "scheduled"
    );

    if (!fup) {
      alert("Không tìm thấy lịch hẹn tái khám.");
      return;
    }

    const now = new Date();
    const st = new Date(`${fup.date}T${fup.time || "00:00"}:00`);
    const diffMin = Math.round((now - st) / 60000);
    const isLate = diffMin > QUEUE_RULES.GRACE_MIN;

    const dept = exam.dept || fup.dept || "";
    const doctor = booking.doctor || fup.doctor || "";
    const room = exam.room || "";

    if (!dept || !doctor) {
      alert("Vui lòng chọn khoa & bác sĩ (phòng có thể chọn sau).");
      return;
    }

    const examNote = [
      `Triệu chứng: ${exam.symptoms || "—"}`,
      ...examExtras.map(
        (e) =>
          `${
            EXTRA_FIELDS.find((f) => f.key === e.key)?.label || e.key
          }: ${e.value}`
      ),
    ].join("\n");

    // Lịch sử khám sẽ được tạo tự động khi tạo phiếu khám

    let lateFee =
      tpl?.lateFee ??
      tpl?.price ??
      tplList.find((t) => t?.id === tplId)?.lateFee ??
      35000;
    if (!isLate) lateFee = 0;

    // Tạo hóa đơn nếu có phí trễ hẹn
    if (lateFee > 0) {
      try {
        await createInvoiceMut.mutateAsync({
          MaBenhNhan: pid,
          LoaiDotThu: "kham_lam_sang",
          SoTien: lateFee,
          NoiDung: `Phí khám (Tái khám trễ hẹn)`,
          PhuongThucThanhToan: "tien_mat",
        });
      } catch (err) {
        console.error("Lỗi khi tạo hóa đơn tái khám:", err);
      }
    }

    enqueueFromAppointment(
      { ...fup, patient: name, code: pid, type: "followup" },
      { note: examNote, symptoms: exam.symptoms || "" }
    );

    onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });

    window.dispatchEvent(
      new CustomEvent("app:navigate", {
        detail: { to: `/examination` },
      })
    );

    openPrint({
      type: "walkin",
      printedBy: currentUser,
      patient: {
        id: pid,
        name,
        gender: form?.gender,
        dob: form?.dob,
        phone: form?.phone,
        address: form?.address,
      },
      booking: {
        date: fup.date || booking.date,
        time: fup.time || booking.time,
        price: lateFee,
        doctor,
        dept,
      },
      examInfo: {
        type: "Tái khám",
        dept,
        room,
        symptoms: exam.symptoms,
        note: exam.note,
      },
      feeInfo: { total: lateFee, paid: isLate, showFee: isLate },
    });
  }

  // ----------------- HOÀN TẤT & THU PHÍ (THƯỜNG) -----------------
  async function handleFinishDoctor() {
    const pid = form?.id;
    if (!pid) return;
    const now = new Date().toISOString().slice(0, 10);

    const d = diagnosisData || {};
    const noteLines = [
      `Chẩn đoán: ${d.dxPrimary || "—"}${
        d.icd10 ? ` (ICD-10: ${d.icd10})` : ""
      }`,
      d.dxSecondary ? `Chẩn đoán phụ: ${d.dxSecondary}` : "",
      d.summary ? `Tóm tắt: ${d.summary}` : "",
      d.orders ? `Chỉ định: ${d.orders}` : "",
      d.advice ? `Dặn dò: ${d.advice}` : "",
      d.followup ? `Hướng xử lý: ${d.followup}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    // Lịch sử khám sẽ được cập nhật khi hoàn tất chẩn đoán qua API examination

    // Tạo hóa đơn cho thuốc
    const drugTotal = Number(totalDrugAmount || 0);
    if (drugTotal > 0) {
      try {
        await createInvoiceMut.mutateAsync({
          MaBenhNhan: pid,
          LoaiDotThu: "thuoc",
          SoTien: drugTotal,
          NoiDung: "Thuốc",
          PhuongThucThanhToan: "tien_mat",
        });
      } catch (err) {
        console.error("Lỗi khi tạo hóa đơn thuốc:", err);
      }
    }

    if (/tái khám/i.test(d.followup || "")) {
      const date = (d.followupDate || "").slice(0, 10);
      const time = d.followupTime || "";
      if (date) {
        createFollowupHold({
          pid,
          patient: form?.name || pid,
          date,
          time,
          dept: booking.dept || exam.dept || "",
          doctor: booking.doctor || "",
          note: d.advice || "Hẹn tái khám từ xử lý bác sĩ",
        });
        onMutatePatient?.(pid, { status: STATUSES.SCHEDULED_FUP });
      } else {
        onMutatePatient?.(pid, { status: STATUSES.DONE });
      }
    } else {
      onMutatePatient?.(pid, { status: STATUSES.DONE });
    }

    markAppointmentDoneForPid(pid);
    onClose?.();
  }

  // ----------------- DỊCH VỤ: TRẢ VỀ BÁC SĨ -----------------
  function handleServiceReturnToDoctor() {
    const pid = form?.id;
    if (!pid) return;
    const fromDoctor =
      patient?.serviceOrder?.fromDoctor ||
      booking.doctor ||
      "Bác sĩ chỉ định";

    const now = new Date().toISOString().slice(0, 10);
    const svcNote = (svcResults || [])
      .map(
        (r, i) =>
          `#${i + 1} ${r.service}: ${r.result || "—"}${
            r.note ? ` • ${r.note}` : ""
          }`
      )
      .join("\n");

    // Lịch sử khám sẽ được cập nhật khi hoàn tất dịch vụ qua API examination

    markServiceDone(pid);
    markWaitDoctorReview(pid);
    enqueueReturnToDoctor({
      pid,
      name: form?.name || pid,
      dept: "Phòng khám",
      doctor: fromDoctor,
      note: "Đã có kết quả dịch vụ",
    });
    onClose?.();
  }

  // Listeners cho Custom Events để mở Select Modal từ component con
  useEffect(() => {
    const onSelectDept = () => setShowDeptSelect(true);
    const onSelectDoctor = () => setShowDoctorSelect(true);
    const onSelectRoom = () => setShowRoomSelect(true);

    window.addEventListener("patient:selectDept", onSelectDept);
    window.addEventListener("patient:selectDoctor", onSelectDoctor);
    window.addEventListener("patient:selectRoom", onSelectRoom);

    return () => {
      window.removeEventListener("patient:selectDept", onSelectDept);
      window.removeEventListener("patient:selectDoctor", onSelectDoctor);
      window.removeEventListener("patient:selectRoom", onSelectRoom);
    };
  }, []);

  // --- Tạo lịch hẹn từ màn view ---
  function handleCreateAppointmentFromView() {
    const pid =
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      patient?.id ||
      form?.id ||
      "";
    const name =
      patient?.HoTen ||
      patient?.hoTen ||
      patient?.name ||
      form?.name ||
      "";

    if (!pid) return;

    onClose?.();

    window.dispatchEvent(
      new CustomEvent("patient:createAppointmentFromView", {
        detail: {
          patientId: pid,
          name,
          patient: patient || form,
        },
      })
    );
  }

  // ================== RENDER ==================
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
              {mode === "view" && (
                  <PatientViewMode
                    patient={patientForView || patient || form}
                    visits={visits}
                    transactions={transactions}
                    patientExtras={patientExtras}
                    handleCreateAppointmentFromView={handleCreateAppointmentFromView}
                  />
                )}

                {(mode === "edit" || mode === "add") && (
                  <PatientFormMode
                    mode={mode}
                    form={form}
                    change={change}
                    firstRef={firstRef}
                    scrollTopRef={scrollTopRef}
                    extras={extras}
                    removeExtra={removeExtra}
                    pushExtra={pushExtra}
                    newExtraKey={newExtraKey}
                    setNewExtraKey={setNewExtraKey}
                    newExtraVal={newExtraVal}
                    setNewExtraVal={setNewExtraVal}
                    onClose={onClose}
                    onSubmit={saveEdit}
                  />
                )}

                {mode === "exam" && (
                  <PatientExamMode
                    form={form}
                    exam={exam}
                    setExam={setExam}
                    tplId={tplId}
                    setTplId={setTplId}
                    tpl={tpl}
                    tplList={tplList}
                    booking={booking}
                    setBooking={setBooking}
                    isServiceIntake={isServiceIntake}
                    isFollowupStatus={isFollowupStatus}
                    serviceItems={serviceItems}
                    serviceNotes={serviceNotes}
                    setServiceNotes={setServiceNotes}
                    serviceRooms={serviceRooms}
                    setServiceRooms={setServiceRooms}
                    priceOfService={priceOfService}
                    totalServiceFee={totalServiceFee}
                    examExtras={examExtras}
                    removeExamExtra={removeExamExtra}
                    pushExamExtra={pushExamExtra}
                    newExamKey={newExamKey}
                    setNewExamKey={setNewExamKey}
                    newExamVal={newExamVal}
                    setNewExamVal={setNewExamVal}
                    handleDirectExam={handleDirectExam}
                    handleFollowupExam={handleFollowupExam}
                  />
                )}

                {mode === "process" && (
                  <PatientProcessMode
                    isSvcProcessing={isSvcProcessing}
                    diagnosisData={diagnosisData}
                    setDiagnosisData={setDiagnosisData}
                    rx={rx}
                    addRx={addRx}
                    updRx={updRx}
                    delRx={delRx}
                    totalDrugAmount={totalDrugAmount}
                    handleFinishDoctor={handleFinishDoctor}
                    svcResults={svcResults}
                    setSvcResults={setSvcResults}
                    handleServiceReturnToDoctor={handleServiceReturnToDoctor}
                  />
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
                            key={dept.id || dept.name}
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
                              {dept.rooms.length} phòng •{" "}
                              {dept.doctors.length} bác sĩ
                            </div>
                          </motion.button>
                        ))}
                        {DEPARTMENTS.length === 0 && (
                          <div className="text-center text-slate-400 text-sm py-4">
                            Chưa có thông tin khoa từ dịch vụ.
                          </div>
                        )}
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
                          const deptKey = exam.dept || booking.dept || "";
                          const deptWaiting = waitingByDept[deptKey] || 0;
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
                                Đang chờ trong khoa:{" "}
                                <b className="text-slate-700">{deptWaiting}</b>
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
                              <th className="px-3 py-2.5 text-left">
                                Trạng thái
                              </th>
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
                                  <Chip
                                    tone="amber"
                                    dot="amber"
                                    className="text-xs"
                                  >
                                    {doc.waiting}
                                  </Chip>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Chip
                                    tone="teal"
                                    dot="teal"
                                    className="text-xs"
                                  >
                                    {doc.appointments}
                                  </Chip>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Chip
                                    tone="emerald"
                                    dot="emerald"
                                    className="text-xs"
                                  >
                                    {doc.status}
                                  </Chip>
                                </td>
                                <td className="px-3 py-2.5">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setBooking((b) => ({
                                        ...b,
                                        doctor: doc.name,
                                      }));
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
                                <td
                                  colSpan={6}
                                  className="px-4 py-6 text-center text-slate-400"
                                >
                                  Chưa có thông tin bác sĩ từ dịch vụ.
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
          </motion.div>

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
            feePaid={
              isServiceIntake ? totalServiceFee > 0 : (booking.price || 0) > 0
            }
          />
        </>
      )}
    </AnimatePresence>
  );
}
