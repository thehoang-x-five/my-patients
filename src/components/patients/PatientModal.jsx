// src/components/patients/PatientModal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { toast } from "react-toastify";

import PatientFormMode from "./PatientFormMode.jsx";
import PatientViewMode from "./PatientViewMode.jsx";
import PatientExamMode from "./PatientExamMode.jsx";
import PatientProcessMode from "./PatientProcessMode.jsx";
import Chip from "../ui/Chip.jsx";

// Lấy luôn SERVICE_ROOMS ở đây cho gọn
import { StatusPill, ANIMATION_CONFIG, SERVICE_ROOMS } from "./Shared.jsx";

import {
  STATUSES,
  mapTodayStatusLabel,
  TODAY_STATUS_MAP,
  usePatientDetail,
} from "../../api/patients";
// Metadata khám LS (extra fields, dịch vụ khám)
import {
  EXTRA_FIELDS,
  useExamServices,
  useServiceInfo,
  useCreateClinicalExam,
  searchClsOrders,
} from "../../api/examination";
import { getStoredAccessToken } from "../../api/http.js";
// History (lượt khám)
import { useCreateHistoryVisit } from "../../api/history";
import { getClinicalExam, getFinalDiagnosis } from "../../api/examination";
import { useExamStore } from "../stores/appStore.js";
import { useNavigate } from "react-router-dom";

// Hàng đợi (enqueue khám LS, CLS, quay lại khám)
import {
  enqueueFromAppointment,
  enqueueService,
  enqueueReturnToDoctor,
  enqueueWalkin,
} from "../../api/queue";
// Lịch hẹn (nếu cần làm follow-up)
import { APPT_STATUS, APPT_STATUS_LABEL } from "../../api/appointments";

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
  onSaved,
  onMutatePatient,
}) {
  const firstRef = useRef(null);
  const scrollTopRef = useRef(null);


  
 
  
  const [form, setForm] = useState(patient || {});
  const [isDirty, setIsDirty] = useState(false);
  const change = (k, v) => {
    setForm((s) => ({ ...s, [k]: v }));
    setIsDirty(true);
  };
  // ===== Lấy chi tiết bệnh nhân để ViewMode hiển thị lịch sử khám/giao dịch =====
  const patientId =
    patient?.MaBenhNhan ||
    patient?.maBenhNhan ||
    patient?.id ||
    form?.id ||
    "";
  const maPhieuKhamCurrent =
    patient?.MaPhieuKham ||
    patient?.maPhieuKham ||
    patient?.MaPhieuKhamLs ||
    patient?.maPhieuKhamLs ||
    form?.MaPhieuKham ||
    form?.maPhieuKham ||
    (() => {
      try {
        return localStorage.getItem("last-clinical-exam-id") || null;
      } catch {
        return null;
      }
    })();

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

  const statusLow = useMemo(
    () =>
      String(
        patientForView?.status ||
          patient?.status ||
          patient?.trang_thai_hom_nay_code ||
          patient?.TrangThaiHomNay ||
          patient?.todayStatus ||
          ""
      ).toLowerCase(),
    [
      patientForView?.status,
      patient?.status,
      patient?.trang_thai_hom_nay_code,
      patient?.TrangThaiHomNay,
      patient?.todayStatus,
    ]
  );

  // Gom các field trạng thái khả dụng để nhận diện đúng nhánh xử lý
  const statusBag = useMemo(() => {
    const raw = [
      statusLow,
      patientForView?.TrangThaiHomNay,
      patientForView?.trang_thai_hom_nay_code,
      patientForView?.statusCode,
      patientForView?.todayStatus,
      patient?.TrangThaiHomNay,
      patient?.trang_thai_hom_nay_code,
      patient?.statusCode,
      patient?.todayStatus,
    ];
    return raw
      .filter(Boolean)
      .map((v) => String(v).toLowerCase())
      .map((v) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  }, [statusLow, patientForView, patient]);

  const isSvcProcessingStatus = useMemo(() => {
    const target = String(STATUSES.WAIT_PROC_SVC || "").toLowerCase();
    return statusBag.some((s) => {
      return (
        s === target ||
        s.includes("cho_xu_ly_dv") ||
        s.includes("cho xu ly dv") ||
        s.includes("cho xu ly dich vu")
      );
    });
  }, [statusBag]);

  const isServiceIntake = useMemo(() => {
    if (isSvcProcessingStatus) return false;

    const svcCode = String(STATUSES.WAIT_INTAKE_SVC || "").toLowerCase();
    return statusBag.some((s) => {
      return (
        s === svcCode ||
        s.includes("cho_tiep_nhan_dv") ||
        s.includes("cho tiep nhan dv") ||
        s.includes("cho tiep nhan dich vu") ||
        s.includes("chờ tiếp nhận") && s.includes("dich vu") ||
        s.includes("dich vu")
      );
    });
  }, [statusBag, isSvcProcessingStatus]);

  const navigate = useNavigate();

  // ================= EXAM TEMPLATE / BOOKING =================

  const [tplId, setTplId] = useState(null);

  // Lấy danh sách dịch vụ khám lâm sàng (overview) - BE đã normalize trong examination.js
  const { data: examServices = [] } = useExamServices(
    { loaiDichVu: "kham_lam_sang" },
    { enabled: !isServiceIntake && mode === "exam" }
  );

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

  // Auto-select mẫu khám đầu tiên khi mở modal khám nếu chưa chọn
  useEffect(() => {
    if (mode !== "exam") return;
    if (isServiceIntake) return;
    if (tplId) return;
    if (!tplList.length) return;
    const first = tplList[0];
    setTplId(first?.id || "");
    setExam((s) => ({ ...s, type: s.type || first?.title || s.type || "" }));
  }, [mode, tplId, tplList, isServiceIntake]);

  // Thông tin khoa + phòng + bác sĩ của dịch vụ hiện tại
  // Chỉ gọi API khi không ở mode "edit" hoặc "add" (không cần service info khi chỉnh sửa form)
  const { data: serviceInfo } = useServiceInfo(tpl?.id, {
    enabled:
      !!tpl?.id && mode !== "edit" && mode !== "add" && mode === "exam" && !isServiceIntake,
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
  // Override service items when prefetched from CLS orders
  const [servicePrefill, setServicePrefill] = useState([]);
  const [serviceRoomPrefill, setServiceRoomPrefill] = useState([]);
  const [serviceNotePrefill, setServiceNotePrefill] = useState([]);
  const [servicePricePrefill, setServicePricePrefill] = useState([]);
  const [clsOrderId, setClsOrderId] = useState("");
  const [clsStaffCode, setClsStaffCode] = useState("");
  const [loadingFinalDx, setLoadingFinalDx] = useState(false);

  const isServiceFlow = useMemo(() => {
    const svcItems = (patientForView || patient)?.serviceOrder?.items || [];
    if (isSvcProcessingStatus) return false;
    return (
      isServiceIntake ||
      servicePrefill.length > 0 ||
      !!clsOrderId ||
      (Array.isArray(svcItems) && svcItems.length > 0)
    );
  }, [isServiceIntake, servicePrefill.length, clsOrderId, patientForView, patient, isSvcProcessingStatus]);

  // Khi serviceInfo thay đổi -> prefill khoa / phòng / bác sĩ / đơn giá theo DV đang chọn
  useEffect(() => {
    if (!serviceInfo || isServiceIntake) return;

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
      dept: tenKhoa || s.dept,
      room: tenPhong || s.room,
    }));

    setBooking((b) => ({
      ...b,
      dept: tenKhoa || b.dept,
      doctor: tenBacSi || b.doctor,
      price: donGia != null ? Number(donGia) || b.price || 0 : b.price || 0,
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

  const isSvcProcessing = useMemo(() => {
    if (isSvcProcessingStatus) return true;
    return new RegExp(
      `^${STATUSES.WAIT_PROC_SVC.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}$`,
      "i"
    ).test(patientForView?.status || "");
  }, [patientForView?.status, isSvcProcessingStatus]);

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
    if (!open) {
      // reset dirty flag when modal closes
      setIsDirty(false);
      return;
    }
    // If the user already started editing, don't overwrite their changes
    if (isDirty) return;
    
    // Sử dụng patientForView thay vì patient vì nó có dữ liệu đầy đủ từ API
    const sourcePatient = patientForView || patient;
    
    // Ensure the status field holds the raw status code (used by the select)
    let statusCodeToSet = null;
    if (sourcePatient) {
      // Prefer raw canonical status code properties if available.
      // Lưu ý: trang_thai_hom_nay là label, không phải code!
      // Ưu tiên lấy từ các field chứa code (không phải label)
      let statusCode = null;

      // Thử lấy từ các field code (ưu tiên cao nhất)
      if (sourcePatient.trang_thai_hom_nay_code && sourcePatient.trang_thai_hom_nay_code !== "") {
        statusCode = sourcePatient.trang_thai_hom_nay_code;
      } else if (sourcePatient.trangThaiHomNay && sourcePatient.trangThaiHomNay !== "") {
        statusCode = sourcePatient.trangThaiHomNay;
      } else if (sourcePatient.TrangThaiHomNay && sourcePatient.TrangThaiHomNay !== "") {
        statusCode = sourcePatient.TrangThaiHomNay;
      } else if (sourcePatient.statusCode && sourcePatient.statusCode !== "") {
        statusCode = sourcePatient.statusCode;
      }

      // Nếu vẫn chưa có code, thử lấy từ _raw (dữ liệu gốc từ API)
      if (!statusCode && sourcePatient._raw) {
        const rawStatus = sourcePatient._raw.TrangThaiHomNay || sourcePatient._raw.trangThaiHomNay;
        if (rawStatus && rawStatus !== "" && rawStatus !== null) {
          statusCode = rawStatus;
        }
      }

      // If we don't have a code but have a human label (e.g., "Chờ tiếp nhận"),
      // try reverse-lookup into TODAY_STATUS_MAP to recover the canonical code.
      if ((!statusCode || statusCode === "") && sourcePatient.status) {
        try {
          const rev = Object.entries(TODAY_STATUS_MAP).reduce((acc, [k, v]) => {
            acc[String(v || "").toLowerCase()] = k;
            return acc;
          }, {});
          const low = String(sourcePatient.status || "").toLowerCase();
          if (rev[low]) statusCode = rev[low];
        } catch {
          // ignore
        }
      }

      // Nếu vẫn chưa có, thử reverse lookup từ trang_thai_hom_nay (label)
      if ((!statusCode || statusCode === "") && sourcePatient.trang_thai_hom_nay) {
        try {
          const rev = Object.entries(TODAY_STATUS_MAP).reduce((acc, [k, v]) => {
            acc[String(v || "").toLowerCase()] = k;
            return acc;
          }, {});
          const low = String(sourcePatient.trang_thai_hom_nay || "").toLowerCase();
          if (rev[low]) statusCode = rev[low];
        } catch {
          // ignore
        }
      }

      // Set status: nếu có code (không null và không empty) thì dùng code, nếu không thì set rỗng để hiển thị "—"
      // Đảm bảo statusCode là string hợp lệ
      if (statusCode && statusCode !== "" && typeof statusCode === "string") {
        statusCodeToSet = statusCode;
      }
    }
    
    // Set form với status đã được xử lý
    setForm((prevForm) => {
      const newForm = sourcePatient ? { ...sourcePatient } : {};
      // Override status với giá trị đã xử lý
      if (statusCodeToSet !== null) {
        newForm.status = statusCodeToSet;
      } else {
        // Nếu không có statusCode, set rỗng để hiển thị "—"
        newForm.status = "";
      }
      return newForm;
    });
    
    // Ensure accountStatus (select) uses code if available
    if (sourcePatient) {
      const acct = sourcePatient.accountStatus ?? sourcePatient.TrangThaiTaiKhoan ?? sourcePatient.trangThaiTaiKhoan ?? null;
      if (acct) {
        setForm((s) => ({ ...(s || {}), accountStatus: acct }));
      }
      
      // Normalize NgaySinh -> input type=date expects yyyy-MM-dd
      const rawDob = sourcePatient.NgaySinh ?? sourcePatient.ngaySinh ?? sourcePatient.dob ?? null;
      if (rawDob) {
        try {
          const d = new Date(rawDob);
          if (!Number.isNaN(d.getTime())) {
            const iso = d.toISOString().slice(0, 10);
            setForm((s) => ({ ...(s || {}), dob: iso }));
          }
        } catch {
          // ignore
        }
      }
    }
    // Ensure default values for add mode: account = hoat_dong, status = cho_tiep_nhan
    if (mode === "add") {
      setForm((s) => ({
        ...(s || {}),
        accountStatus: s?.accountStatus || "hoat_dong",
        status: s?.status || STATUSES.WAIT_INTAKE,
      }));
    }
    // Khong hardcode template ID, de user chon tu danh sach
    setTplId(null);
    setExam((s) => ({ ...s, dept: "", room: "", symptoms: "", note: "" }));
    const preExtras = EXTRA_FIELDS.filter(
      (f) => sourcePatient?.[f.key] && String(sourcePatient[f.key]).trim().length
    ).map((f) => ({ key: f.key, value: String(sourcePatient[f.key]) }));
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

      if (isWaitingProcess && maPhieuKhamCurrent) {
        fetchFinalDiagnosis();
      }
    }

    if (sourcePatient && mode === "edit") {
      const pre = EXTRA_FIELDS.filter(
        (f) => sourcePatient[f.key] && String(sourcePatient[f.key]).trim().length
      ).map((f) => ({ key: f.key, value: String(sourcePatient[f.key]) }));
      setExtras(pre);
    } else {
      setExtras([]);
    }

    const t = setTimeout(() => firstRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, patient, patientForView, mode, today, isDirty]);



  useEffect(() => {
    if (!tpl) return;
    if (isServiceIntake) return;
    // Chỉ cập nhật giá nếu tpl có giá và booking chưa có giá
    if (tpl.price && tpl.price > 0) {
      setBooking((b) => ({ ...b, price: b.price && b.price > 0 ? b.price : Number(tpl.price) }));
    }
    // Cập nhật type từ template nếu exam.type đang trống
    if (tpl.title && !exam.type) {
      setExam((s) => ({ ...s, type: s.type || tpl.title }));
    }
  }, [tpl, exam.type, isServiceIntake]);
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
  const isFollowupStatus =
    (patientForView?.status || "") === STATUSES.SCHEDULED_FUP;
  const isWaitingProcess =
    (patientForView?.status || "") === STATUSES.WAIT_PROC ||
    (patientForView?.status || "") === STATUSES.WAIT_PROC_SVC;


  // ---- Prefill cho Hẹn tái khám ----
  useEffect(() => {
    if (!open || mode !== "exam") return;
    const pid =
      patient?.id ||
      patient?.pid ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      form?.id ||
      form?.pid ||
      form?.MaBenhNhan ||
      form?.maBenhNhan ||
      "";

    // Prefetch CLS orders (trạng thái da_lap) khi intake dịch vụ
    if (isServiceIntake && pid) {
      (async () => {
        try {
          const res = await searchClsOrders({
            MaBenhNhan: pid,
            TrangThai: "da_lap",
            PageSize: 500,
          });
          const first = Array.isArray(res?.Items) ? res.Items[0] : null;
          const list = Array.isArray(first?.ListItemDV) ? first.ListItemDV : [];
          if (list.length) {
            const services = list.map(
              (it) =>
                it.TenDichVu ||
                it.tenDichVu ||
                it.MaDichVu ||
                it.maDichVu ||
                ""
            );
            const rooms = list.map(
              (it) => it.TenPhong || it.MaPhong || it.tenPhong || ""
            );
            const notes = list.map((it) => it.GhiChu || it.ghiChu || "");
            const prices = list.map((it) => Number(it.PhiDV || it.phiDV || 0) || 0);
            setServicePrefill(services);
            setServiceRoomPrefill(rooms);
            setServiceNotePrefill(notes);
            setServicePricePrefill(prices);
            const staffItem = list.find(
              (it) =>
                it.MaYTaThucHien ||
                it.maYTaThucHien ||
                it.MaNguoiLap ||
                it.NguoiLap
            );
            const staffCode =
              staffItem?.MaYTaThucHien ||
              staffItem?.maYTaThucHien ||
              staffItem?.MaNguoiLap ||
              staffItem?.NguoiLap ||
              first?.PhieuKhamClsFull?.MaYTaThucHien ||
              first?.PhieuKhamClsFull?.MaNguoiLap ||
              first?.MaNguoiLap ||
              "";
            setClsStaffCode(staffCode);
            setClsOrderId(first?.MaPhieuKhamCls || first?.maPhieuKhamCls || "");
            // Prefill khoa/phòng nếu có
            const tenKhoa =
              first?.TenKhoa || first?.tenKhoa || first?.MaKhoa || "";
            const tenPhong =
              first?.TenPhong || first?.tenPhong || first?.MaPhong || "";
            if (tenKhoa || tenPhong) {
              setExam((s) => ({
                ...s,
                dept: tenKhoa || s.dept,
                room: tenPhong || s.room,
              }));
              setBooking((b) => ({
                ...b,
                dept: tenKhoa || b.dept,
              }));
            }
          }
          else {
          setServicePrefill([]);
          setServiceRoomPrefill([]);
          setServiceNotePrefill([]);
          setServicePricePrefill([]);
          setClsOrderId("");
          setClsStaffCode("");
        }
        } catch (err) {
          console.warn("Prefetch CLS orders failed:", err);
          setServicePrefill([]);
          setServiceRoomPrefill([]);
          setServiceNotePrefill([]);
          setServicePricePrefill([]);
          setClsOrderId("");
          setClsStaffCode("");
        }
      })();
    } else {
      setServicePrefill([]);
      setServiceRoomPrefill([]);
      setServiceNotePrefill([]);
      setServicePricePrefill([]);
      setClsOrderId("");
      setClsStaffCode("");
    }

    if (isFollowupStatus && !isServiceIntake) {
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
      // Không hardcode template ID cho dịch vụ, đặt mặc định loại phiếu CLS
      setExam((s) => ({
        ...s,
        type: s.type || "Khám Cận lâm sàng",
        dept: "",
        symptoms: "",
        note: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode]);

  // ---- UI ghi chú từng dịch vụ (nếu intake dịch vụ) ----
  const serviceItems = useMemo(() => {
    if (servicePrefill.length) return servicePrefill;
    return Array.isArray(patient?.serviceOrder?.items)
      ? patient.serviceOrder.items
      : [];
  }, [patient?.serviceOrder, servicePrefill]);

  const [serviceNotes, setServiceNotes] = useState([]);
  const [serviceRooms, setServiceRooms] = useState([]);
  useEffect(() => {
    if (servicePrefill.length) {
      setServiceNotes(serviceNotePrefill.length ? serviceNotePrefill : serviceItems.map(() => ""));
      setServiceRooms(serviceRoomPrefill.length ? serviceRoomPrefill : serviceItems.map(() => ""));
    } else {
      setServiceNotes(serviceItems.map(() => ""));
      setServiceRooms(serviceItems.map(() => ""));
    }
  }, [serviceItems, servicePrefill, serviceNotePrefill, serviceRoomPrefill]);

  // Giá 1 dịch vụ từ danh sách services overview hoặc prefill CLS
  const priceOfService = (name) => {
    if (servicePrefill.length) {
      const idx = servicePrefill.findIndex((sv) => sv === name);
      if (idx >= 0 && servicePricePrefill[idx] != null) {
        const v = Number(servicePricePrefill[idx]);
        if (Number.isFinite(v)) return v;
      }
    }
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

  async function saveEdit(e) {
    e.preventDefault();
    const src = form || {};
  
    // Lấy MaBenhNhan từ nhiều nguồn (ưu tiên từ form, sau đó từ patient prop)
    const maBenhNhan =
      src.MaBenhNhan ||
      src.maBenhNhan ||
      src.id ||
      src.pid ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      patient?.id ||
      patient?.pid ||
      null;

    // Khi edit, bắt buộc phải có MaBenhNhan
    if (mode === "edit" && !maBenhNhan) {
      toast.error("Không tìm thấy mã bệnh nhân. Vui lòng thử lại.");
      return;
    }
  
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
  
    // Lấy trạng thái mới - ưu tiên từ form state (UI input)
    const newStatus = src.status || src.trangThaiHomNay || src.TrangThaiHomNay || null;
  
    // Ưu tiên lấy giá trị từ form state (các key mà UI sẽ dùng: name, phone, email, address, dob, gender, accountStatus)
    // Sau đó mới fallback sang các key khác (HoTen, NgaySinh, ...) nếu không có
    const payload = {
      // Map sang BE UpsertPatient
      MaBenhNhan: maBenhNhan || "",
      // Ưu tiên lấy từ form state (UI input) trước
      HoTen: src.name || src.HoTen || src.hoTen || "",
      NgaySinh: src.dob || src.NgaySinh || src.ngaySinh || null,
      GioiTinh: src.gender || src.GioiTinh || src.gioiTinh || "",
      DienThoai: src.phone || src.DienThoai || src.dienThoai || "",
      Email: src.email || src.Email || "",
      DiaChi: src.address || src.DiaChi || src.diaChi || "",
      TrangThaiTaiKhoan:
        src.accountStatus || src.TrangThaiTaiKhoan || "hoat_dong",
      // Trạng thái trong ngày (FE -> API build sẽ map sang TrangThaiHomNay)
      // Chỉ gọi nếu có giá trị
      ...(newStatus ? { TrangThaiHomNay: newStatus, status: newStatus } : {}),
  
      ...extrasMap,
  
      // Giữ lại vài field FE nếu hook upsert có dùng
      id: maBenhNhan || src.id,
      pid: maBenhNhan || src.pid,
      name: src.name,
      phone: src.phone,
      email: src.email,
      address: src.address,
      dob: src.dob,
      gender: src.gender,
      accountStatus: src.accountStatus,
    };
  
    // Client-side required checks for create mode: ensure dob, phone, email present
    if (mode === "add") {
      const missing = [];
      if (!src.dob && !src.NgaySinh && !src.ngaySinh) missing.push("Ngày sinh");
      if (!src.phone && !src.DienThoai && !src.dienThoai) missing.push("SĐT");
      if (!src.email && !src.Email) missing.push("Email");
      if (missing.length) {
        toast.error(`Vui lòng nhập ${missing.join(", ")} khi tạo bệnh nhân.`);
        return;
      }
    }

    try {
      const result = await onSave?.(payload, mode);
      
      // Nếu có thay đổi trạng thái và đã update thành công, cập nhật trạng thái riêng
      // (mặc dù payload đã có TrangThaiHomNay, nhưng để đảm bảo, có thể gọi riêng)
      // Tuy nhiên, nếu BE đã xử lý trong upsertPatient thì không cần gọi riêng
      
      // Gọi callback onSaved sau khi lưu thành công
      if (result) {
        onSaved?.(result);
      }
      
      // Reset dirty flag sau khi lưu thành công
      setIsDirty(false);
    } catch (err) {
      // Error đã được xử lý in parent (if provided) — rethrow so parent can show toast
      // If there's no parent handler, show local toast
      if (!onSave) {
        toast.error(err?.message || "Lưu bệnh nhân thất bại.");
      }
      throw err;
    }
  }
  



  // Bác sĩ khả dụng: lấy từ ServiceDetailInfoDto
  const availableDoctors = useMemo(() => {
    if (!serviceInfo) return [];
    const list = (
      serviceInfo.DanhSachBacSi ||
      serviceInfo.danhSachBacSi ||
      serviceInfo.BacSis ||
      serviceInfo.bacSis ||
      null
    );

    const deptName =
      serviceInfo.TenKhoa ||
      serviceInfo.tenKhoa ||
      serviceInfo.ten_khoa ||
      "";

    if (Array.isArray(list) && list.length) {
      const toNumber = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : 0;
      };
      return list.map((bs) => ({
        name:
          bs.TenBacSi ||
          bs.tenBacSi ||
          bs.name ||
          bs.fullName ||
          bs.HoTen ||
          "",
        dept: deptName,
        waiting: toNumber(
          bs.SoCho ||
            bs.soCho ||
            bs.SoChoKham ||
            bs.soChoKham ||
            bs.SoChoHienTai ||
            bs.soChoHienTai ||
            bs.DangCho ||
            bs.dangCho ||
            bs.Waiting ||
            bs.waiting
        ),
        appointments: toNumber(
          bs.SoLich ||
            bs.soLich ||
            bs.SoLichHen ||
            bs.soLichHen ||
            bs.LichHen ||
            bs.lichHen ||
            bs.Appointments ||
            bs.appointments
        ),
        status: bs.TrangThai || bs.trangThai || "Đang làm việc",
      }));
    }

    const name =
      serviceInfo.TenBacSi ||
      serviceInfo.tenBacSi ||
      serviceInfo.ten_bac_si ||
      "";
    if (!name) return [];

    return [
      {
        name,
        dept: deptName,
        waiting: 0,
        appointments: 0,
        status: "Đang làm việc",
      },
    ];
  }, [serviceInfo]);

  // Danh sách phòng: chỉ lấy phòng BE trả về
  const availableRooms = useMemo(() => {
    if (!serviceInfo) return [];
    const tenPhong =
      serviceInfo.TenPhong ||
      serviceInfo.tenPhong ||
      serviceInfo.ten_phong ||
      "";
    if (!tenPhong) return [];
    return [tenPhong];
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

  // Hook để tạo phiếu khám lâm sàng
  const createClinicalExamMut = useCreateClinicalExam();
  const createHistoryVisitMut = useCreateHistoryVisit();
  const setExamActive = useExamStore((s) => s.setActive);

  /* ==================== PRINT OVERLAY STATE ==================== */
  const [print, setPrint] = useState({ show: false, payload: null });
  const [clsSummaryPrint, setClsSummaryPrint] = useState(null);

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

    if (payload.clsSummary !== undefined) {
      setClsSummaryPrint(payload.clsSummary);
    }

    setPrint({ show: true, payload });
  };

  const closePrint = () => {
    setPrint({ show: false, payload: null });
    onClose?.();
  };

  // Helpers to resolve current user (for MaNguoiLap + display)
  const decodeJwtPayload = (token) => {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      let jsonStr = null;

      if (typeof atob === "function") {
        const binary = atob(padded);
        jsonStr = decodeURIComponent(
          binary
            .split("")
            .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
            .join("")
        );
      } else if (typeof Buffer !== "undefined") {
        jsonStr = Buffer.from(padded, "base64").toString("utf8");
      } else {
        return null;
      }

      return JSON.parse(jsonStr);
    } catch (err) {
      console.warn("decodeJwtPayload error:", err);
      return null;
    }
  };

  const resolveCurrentUser = () => {
    let code = null;
    let name = null;

    const pickFromUser = (u) => {
      if (!u) return;
      if (!code) {
        code =
          u.MaNhanSu ||
          u.maNhanSu ||
          u.MaNguoiLap ||
          u.maNguoiLap ||
          u.MaNhanVien ||
          u.maNhanVien ||
          u.MaNguoiDung ||
          u.maNguoiDung ||
          u.UserName ||
          u.userName ||
          u.username ||
          u.id ||
          u.userId ||
          u.staffId ||
          null;
      }
      if (!name) {
        name =
          u.fullName ||
          u.FullName ||
          u.name ||
          u.tenNhanVien ||
          u.tenNguoiDung ||
          u.username ||
          u.TenNguoiDung ||
          u.TenNhanVien ||
          u.unique_name ||
          null;
      }
    };

    try {
      const raw = localStorage.getItem("his-auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        pickFromUser(parsed?.user);
        if ((!code || !name) && parsed?.accessToken) {
          const payload = decodeJwtPayload(parsed.accessToken);
          pickFromUser(payload || {});
          if (payload && !code) {
            code =
              payload.MaNhanSu ||
              payload.maNhanSu ||
              payload.MaNhanVien ||
              payload.maNhanVien ||
              payload.sub ||
              payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ] ||
              null;
          }
        }
      }
    } catch (err) {
      console.warn("resolveCurrentUser local storage error:", err);
    }

    if (!code || !name) {
      try {
        const token = getStoredAccessToken?.();
        const payload = token ? decodeJwtPayload(token) : null;
        if (payload) {
          pickFromUser(payload);
          if (!code) {
            code =
              payload.MaNhanSu ||
              payload.maNhanSu ||
              payload.MaNhanVien ||
              payload.maNhanVien ||
              payload.sub ||
              payload[
                "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
              ] ||
              null;
          }
          if (!name) {
            name =
              payload.HoTen ||
              payload.hoTen ||
              payload.fullName ||
              payload.FullName ||
              payload.unique_name ||
              payload.preferred_username ||
              payload.name ||
              null;
          }
        }
      } catch (err) {
        console.warn("resolveCurrentUser token decode error:", err);
      }
    }

    if ((!code || !name) && typeof window !== "undefined" && window.APP_USER) {
      pickFromUser(window.APP_USER);
    }

    return {
      name: name || null,
      code: code || name || null,
    };
  };

  const currentUserInfo = React.useMemo(() => resolveCurrentUser(), []);
  const currentUser = currentUserInfo.name || "";

  // Tránh double submit phiếu khám
  const [creatingExam, setCreatingExam] = useState(false);
  const [loadingFinalDiagnosis, setLoadingFinalDiagnosis] = useState(false);

  // ----------------- FETCH FINAL DIAGNOSIS FOR PROCESS MODE -----------------
  const fetchFinalDiagnosis = async () => {
    if (loadingFinalDiagnosis) return;
    if (!maPhieuKhamCurrent) {
      toast.error("Thiếu mã phiếu khám.");
      return;
    }
    try {
      setLoadingFinalDiagnosis(true);
      const dxRes = await getFinalDiagnosis(maPhieuKhamCurrent);
      if (!dxRes) {
        toast.error("Không tìm thấy chẩn đoán cuối.");
        return;
      }
      setDiagnosisData((prev) => ({
        ...prev,
        MaPhieuChanDoan: dxRes.MaPhieuChanDoan || dxRes.maPhieuChanDoan,
        MaPhieuKham: dxRes.MaPhieuKham || dxRes.maPhieuKham,
        MaDonThuoc: dxRes.MaDonThuoc || dxRes.maDonThuoc,
        dxPrimary: dxRes.ChanDoanSoBo || dxRes.dxPrimary || "",
        dxSecondary: dxRes.ChanDoanCuoi || dxRes.dxSecondary || "",
        summary: dxRes.NoiDungKham || dxRes.summary || "",
        orders: dxRes.PhatDoDieuTri || dxRes.orders || "",
        advice: dxRes.LoiKhuyen || dxRes.advice || "",
        followup: dxRes.HuongXuTri || dxRes.followup || "",
        prescriptionCode: dxRes.MaDonThuoc || dxRes.maDonThuoc || "",
      }));
      toast.success("Đã tải chẩn đoán cuối.");
    } catch (err) {
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể tải chẩn đoán cuối.";
      toast.error(msg);
    } finally {
      setLoadingFinalDiagnosis(false);
    }
  };

  // ----------------- LUỒNG KHÁM TRỰC TIẾP -----------------
  async function handleDirectExam() {
    const { id: pid, name } = form || {};
    if (creatingExam || createClinicalExamMut.isLoading) return;

    if (!pid) {
      toast.error("Thiếu mã BN.");
      return;
    }

    if (isServiceFlow) {
      if (!clsOrderId) {
        toast.error("Không tìm thấy mã phiếu CLS.");
        return;
      }
      const services = serviceItems;
      if (!services.length) {
        toast.error("Chưa có danh sách dịch vụ chỉ định.");
        return;
      }

      try {
        await updateClsOrderStatus(clsOrderId, "dang_thuc_hien");
        toast.success("Cập nhật phiếu CLS thành công.");
        setClsSummaryPrint(null);
        openPrint({
          type: "service",
          creatorName: currentUser,
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
            doctor: booking.doctor || "",
            dept: exam.dept || booking.dept || "",
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
      } catch (err) {
        console.error("Cập nhật trạng thái CLS thất bại:", err);
        toast.error("Không thể cập nhật trạng thái CLS. Vui lòng thử lại.");
      }

      return;
    }

    const dept = exam.dept || booking.dept || "";
    const doctor = booking.doctor || "";
    const room = exam.room || "";
    const fee = booking.price || tpl?.price || 0;
    if (!dept || !room || !doctor) {
      toast.error("Vui lòng chọn đầy đủ khoa, phòng và bác sĩ.");
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
    const maNguoiLap = currentUserInfo.code || "admin";

    // Lấy MaDichVuKham từ template
    const maDichVuKham = tpl?.id || tplId || null;
    // Hình thức tiếp nhận: normalize về appointment | service_return | walkin
    const normalizeIntake = (v) => {
      const val = String(v || "").toLowerCase();
      if (val === "appointment") return "appointment";
      if (val === "service_return" || val === "service-return" || val === "tai_kham")
        return "service_return";
      if (
        val === "walkin" ||
        val === "walk_in" ||
        val === "walk-in" ||
        val === "tiep_nhan_truc_tiep" ||
        val === "kham_moi"
      )
        return "walkin";
      return "walkin";
    };
    const hinhThucTiepNhan = normalizeIntake(
      exam?.hinhThucTiepNhan || (isFollowupStatus ? "service_return" : "walkin")
    );
    // Tạo phiếu khám lâm sàng
    let maPhieuKham = null;
    let tenNguoiLapPhieu = currentUser || "";
    try {
      setCreatingExam(true);
      const clinicalExamResult = await createClinicalExamMut.mutateAsync({
        MaBenhNhan: pid,
        MaKhoa: maKhoa,
        MaPhong: maPhong,
        MaBacSiKham: maBacSi,
        MaNguoiLap: maNguoiLap,
        MaDichVuKham: maDichVuKham,
        HinhThucTiepNhan: hinhThucTiepNhan,
        LoaiPhieuKham: exam.type || null,
        TrieuChung: exam.symptoms || "",
        GhiChu: examNote,
        ...extraFields,
      });
      maPhieuKham = clinicalExamResult?.MaPhieuKham || clinicalExamResult?.maPhieuKham || clinicalExamResult?.id || null;
      tenNguoiLapPhieu =
        clinicalExamResult?.TenNguoiLap ||
        clinicalExamResult?.tenNguoiLap ||
        clinicalExamResult?.NguoiLap ||
        clinicalExamResult?.nguoiLap ||
        tenNguoiLapPhieu;

      // Show BE message if provided
      const createdMsg =
        clinicalExamResult?.message ||
        clinicalExamResult?.Message ||
        clinicalExamResult?.msg ||
        clinicalExamResult?.Msg;
      if (createdMsg) {
        toast.success(createdMsg);
      }

      // Lưu mã phiếu khám LS để process-mode có thể lấy final diagnosis
      if (maPhieuKham) {
        try {
          localStorage.setItem("last-clinical-exam-id", maPhieuKham);
        } catch (err) {
          console.warn("Không thể lưu MaPhieuKham vào localStorage:", err);
        }
      }
    } catch (err) {
      console.error("Lỗi khi tạo phiếu khám:", err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể tạo phiếu khám. Vui lòng thử lại."
      toast.error(msg);
      return;
    } finally {
      setCreatingExam(false);
    }

    // Hóa đơn sẽ được tạo tự động bởi BE khi tạo phiếu khám
    // Hàng đợi sẽ được tạo tự động bởi BE khi tạo phiếu khám
    // Không cần gọi enqueueWalkin nữa

    // Tạo lịch sử lượt khám (history.visit) để hiện trong History và thống kê
    try {
      await createHistoryVisitMut.mutateAsync({
        MaBenhNhan: pid,
        MaPhieuKhamLs: maPhieuKham,
        MaKhoa: maKhoa,
        MaPhong: maPhong,
        MaBacSi: maBacSi,
        MaNhanSuThucHien: (isServiceIntake ? (clsStaffCode || maNguoiLap) : maBacSi),
        MaYTaHoTro: isServiceIntake ? (clsStaffCode || maNguoiLap) : undefined,
        LoaiLuot: isServiceIntake ? "service" : "clinic",
        GhiChu: examNote,
      });
    } catch (err) {
      console.warn("Không thể tạo lịch sử lượt khám:", err);
    }

    onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });

    // Lấy chi tiết phiếu khám để prefill trang Khám nếu có
    let summaryForPrint = null;
    try {
      const clinicalDetail = await getClinicalExam(maPhieuKham);
      if (clinicalDetail) {
        tenNguoiLapPhieu =
          clinicalDetail?.TenNguoiLap ||
          clinicalDetail?.NguoiLap ||
          clinicalDetail?.NguoiLapPhieu ||
          tenNguoiLapPhieu;
        // Set active patient/exam in exam store (dùng để prefill)
        try {
          setExamActive({ ...form, clinical: clinicalDetail });
        } catch (e) {
          console.warn("setExamActive failed:", e);
        }
        // Emit event để trang khám có thể lắng nghe và prefill
        window.dispatchEvent(
          new CustomEvent("app:exam-prefill", {
            detail: { clinical: clinicalDetail, patient: { ...form } },
          })
        );

        const summary =
          clinicalDetail.SnapshotKqKhamCls ||
          clinicalDetail.snapshotKqKhamCls ||
          clinicalDetail.PhieuTongHopCls ||
          clinicalDetail.phieuTongHopCls ||
          clinicalDetail.PhieuTongHopCLS ||
          clinicalDetail.clsSummary ||
          clinicalDetail.ClsSummary ||
          clinicalDetail.TongHopCls ||
          clinicalDetail.tongHopCls ||
          clinicalDetail.PhieuTongHop ||
          clinicalDetail.phieuTongHop ||
          null;
        summaryForPrint = summary || null;
        setClsSummaryPrint(summaryForPrint);
      }
    } catch (err) {
      console.warn("Không thể lấy chi tiết phiếu khám:", err);
      setClsSummaryPrint(null);
    }

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
      creatorName: tenNguoiLapPhieu || currentUser,
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
      clsSummary: summaryForPrint,
    });
  }

  // ----------------- LUỒNG TÁI KHÁM (giữ chỗ) -----------------
  async function handleFollowupExam() {
    const { id: pid, name } = form || {};
    if (!pid) {
      toast.error("Thiếu mã BN.");
      return;
    }

    const holds = listAppointmentHolds(pid);
    const fup = holds.find(
      (h) => h.type === "followup" && h.status === "scheduled"
    );

    if (!fup) {
      toast.warn("Không tìm thấy lịch hẹn tái khám.");
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
      toast.error("Vui lòng chọn khoa & bác sĩ (phòng có thể chọn sau).");
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

    // Hóa đơn sẽ được tạo tự động bởi BE khi tạo phiếu khám

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
      creatorName: currentUser,
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
    // Hóa đơn sẽ được tạo tự động bởi BE khi cần

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
          note: d.advice || "Hẹn tái khám (bác sĩ tự xử lý)",
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

  // Lắng nghe Custom Events để mở Select Modal từ component con
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

    try {
      // Lưu đầy đủ thông tin bệnh nhân vào localStorage để điền vào form tạo lịch hẹn
      const sourcePatient = patientForView || patient || form || {};
      const apptPrefillData = {
        patient: name,
        code: pid,
        phone:
          sourcePatient?.DienThoai ||
          sourcePatient?.dienThoai ||
          sourcePatient?.phone ||
          "",
        email:
          sourcePatient?.Email ||
          sourcePatient?.email ||
          "",
        dob:
          sourcePatient?.NgaySinh ||
          sourcePatient?.ngaySinh ||
          sourcePatient?.dob ||
          "",
        gender:
          sourcePatient?.GioiTinh ||
          sourcePatient?.gioiTinh ||
          sourcePatient?.gender ||
          "",
        address:
          sourcePatient?.DiaChi ||
          sourcePatient?.diaChi ||
          sourcePatient?.address ||
          "",
        type: "follow_up",
        lastVisit: { patientName: name, patientCode: pid },
      };
      
      // Lưu vào localStorage
      localStorage.setItem("appt-prefill", JSON.stringify(apptPrefillData));
      
      // Navigate to appointments page
      navigate("/appointments");
    } catch (err) {
      console.error("Lỗi khi lưu thông tin bệnh nhân:", err);
    }
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
                    currentUser={currentUserInfo}
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
                    handleFetchFinalDiagnosis={fetchFinalDiagnosis}
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
                        ×
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
                        ×
                      </button>
                    </header>
                    <div className="p-4 pt-2 overflow-y-auto max-h-[60vh] scrollbar-none">
                      <div className="space-y-2">
                        {availableRooms.map((room) => {
                          return (
                            <motion.button
                              key={room}
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                setExam((s) => ({ ...s, room }));
                                setShowRoomSelect(false);
                              }}
                              className="w-full rounded-xl p-3 bg-white ring-1 ring-slate-200 hover:ring-emerald-300 hover:bg-emerald-50/50 transition text-left font-medium"
                            >
                              <span>{room}</span>
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
                        ×
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
            clsSummary={print.payload?.clsSummary ?? clsSummaryPrint}
            creatorName={print.payload?.creatorName || currentUser || ""}
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



