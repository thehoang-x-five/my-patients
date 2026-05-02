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
  getClsSummary,
  searchClsOrders,
  updateClsSummaryStatus,
  updateClsOrderStatus,
} from "../../api/examination";
import { getStoredAccessToken } from "../../api/http.js";
// History (lượt khám)
import { useCreateHistoryVisit } from "../../api/history";
import { getClinicalExam, getFinalDiagnosis, useCompleteExam } from "../../api/examination";
import { getPrescriptionByCode } from "../../api/pharmacy.js";
import { searchInvoices } from "../../api/billing.js";
import { useExamStore, useUIStore, useAuthStore } from "../stores/appStore.js";
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
import PaymentWizard from "../billing/PaymentWizard.jsx";

// Follow-up context utilities
import { saveFollowupContext } from "../../utils/followupContext.js";

// Permission helpers
import {
  canCreateAppointment,
  canManageReception,
  isReceptionNurse,
} from "../../utils/permissions.js";

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
  function normalizeInvoiceStatus(value) {
    return String(value || "").toLowerCase().trim();
  }

  function isDeferredInvoice(invoice) {
    if (!invoice) return false;
    const status = normalizeInvoiceStatus(invoice?.status || invoice?.TrangThai);
    if (status === "bao_luu") return true;

    const text = [
      invoice?.NoiDung,
      invoice?.noiDung,
      invoice?.GhiChu,
      invoice?.ghiChu,
      invoice?.LyDo,
      invoice?.lyDo,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return text.includes("bao luu") || text.includes("cong no") || text.includes("thu sau");
  }

  function buildScopedProcessInvoices(rows, maPhieuKham, maDonThuoc) {
    const list = Array.isArray(rows) ? rows : [];
    const examCode = String(maPhieuKham || "").trim();
    const prescriptionCode = String(maDonThuoc || "").trim();

    const pickLatest = (predicate) =>
      list
        .filter(predicate)
        .sort((a, b) => {
          const aTime = new Date(a?.date || a?.dateLabel || 0).getTime();
          const bTime = new Date(b?.date || b?.dateLabel || 0).getTime();
          return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
        })[0] || null;

    const examInvoice = examCode
      ? pickLatest(
          (row) =>
            String(row?.maPhieuKham || row?.MaPhieuKham || "").trim() === examCode &&
            normalizeInvoiceStatus(row?.status || row?.TrangThai) !== "da_huy"
        )
      : null;

    const drugInvoice = prescriptionCode
      ? pickLatest(
          (row) =>
            String(row?.maDonThuoc || row?.MaDonThuoc || "").trim() === prescriptionCode &&
            normalizeInvoiceStatus(row?.status || row?.TrangThai) !== "da_huy"
        )
      : null;

    return { examInvoice, drugInvoice };
  }

  const firstRef = useRef(null);
  const scrollTopRef = useRef(null);

  // ✅ Check permissions
  const user = useAuthStore((s) => s.user);
  const canCreateAppt = canCreateAppointment(user);
  const isReceptionUser = isReceptionNurse(user);
  const canCollectProcessFee = canManageReception(user);




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

  // ✅ useMemo để tính lại maPhieuKham khi patient hoặc form thay đổi
  // ⚠️ KHÔNG lấy từ localStorage để tránh lấy nhầm mã phiếu khám cũ
  const maPhieuKhamCurrent = useMemo(() => {
    const fromPatient =
      patient?.MaPhieuKham ||
      patient?.maPhieuKham ||
      patient?.MaPhieuKhamLs ||
      patient?.maPhieuKhamLs ||
      null;

    const fromForm =
      form?.MaPhieuKham ||
      form?.maPhieuKham ||
      null;

    // ✅ CHỈ lấy từ patient prop và form state, KHÔNG lấy từ localStorage
    const result = fromPatient || fromForm;

    console.log(
      `[maPhieuKhamCurrent] Computed for patient ${patientId}: ` +
      `fromPatient=${fromPatient}, fromForm=${fromForm}, result=${result}`
    );

    return result;
  }, [patient, form, patientId]);

  const {
    data: patientDetail,
    isFetching: loadingPatientDetail,
    isError: errorPatientDetail,
    refetch: refetchPatientDetail,
  } = usePatientDetail(patientId, {
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
  const examPrefillAppointment = useExamStore((s) => s.prefillAppointment);

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

  // Thông tin khoa + phòng + bác sĩ của dịch vụ hiện tại
  // Chỉ gọi API khi không ở mode "edit" hoặc "add" (không cần service info khi chỉnh sửa form)
  const { data: serviceInfo } = useServiceInfo(tpl?.id, {
    enabled:
      !!tpl?.id && mode !== "edit" && mode !== "add" && mode === "exam" && !isServiceIntake,
  });


  const readServiceInfoAutofill = (info) => {
    const tenKhoa =
      info?.TenKhoa ||
      info?.tenKhoa ||
      info?.ten_khoa ||
      "";
    const tenPhong =
      info?.TenPhong ||
      info?.tenPhong ||
      info?.ten_phong ||
      "";
    const tenBacSi =
      info?.TenBacSi ||
      info?.tenBacSi ||
      info?.ten_bac_si ||
      "";
    const donGia =
      info?.DonGia ??
      info?.donGia ??
      info?.price ??
      info?.PhiDV ??
      info?.phiDV ??
      null;

    return { tenKhoa, tenPhong, tenBacSi, donGia };
  };

  const handleTemplateChange = (newTplId) => {
    const nextTplId = newTplId || "";
    const selectedTpl =
      (nextTplId
        ? tplList.find((item) => String(item?.id) === String(nextTplId))
        : null) ||
      tplList[0] ||
      tpl ||
      null;

    const shouldUseCurrentServiceInfo =
      !!serviceInfo && String(nextTplId) === String(tpl?.id || "");
    const { tenKhoa, tenPhong, tenBacSi, donGia } = readServiceInfoAutofill(
      shouldUseCurrentServiceInfo ? serviceInfo : null
    );

    setTplId(nextTplId);

    setExam((prev) => ({
      ...prev,
      type: selectedTpl?.title || prev.type || "",
      dept: tenKhoa || "",
      room: tenPhong || "",

    }));
    setBooking((prev) => ({
      ...prev,
      dept: tenKhoa || "",

      doctor: tenBacSi || "",

      price: isFollowupExamFlow
        ? 0
        : donGia != null
          ? Number(donGia) || 0
          : Number(selectedTpl?.price || 0) || 0,
    }));
  };

  // Auto-select mẫu khám đầu tiên khi mở modal khám nếu chưa chọn
  useEffect(() => {
    if (mode !== "exam") return;
    if (isServiceIntake) return;
    if (tplId) return;
    if (!tplList.length) return;
    handleTemplateChange(tplList[0]?.id || "");
  }, [mode, tplId, tplList, isServiceIntake]);

  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

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

  const currentPatientCode =
    patient?.MaBenhNhan ||
    patient?.maBenhNhan ||
    patient?.id ||
    form?.MaBenhNhan ||
    form?.maBenhNhan ||
    form?.id ||
    "";

  const currentPatientName =
    form?.name ||
    form?.HoTen ||
    form?.hoTen ||
    patient?.HoTen ||
    patient?.hoTen ||
    patient?.name ||
    "";

  const currentPatientPhone =
    form?.phone ||
    form?.DienThoai ||
    form?.dienThoai ||
    patient?.DienThoai ||
    patient?.dienThoai ||
    patient?.phone ||
    "";

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const normalizeDigits = (value) => String(value || "").replace(/\D/g, "");

  const readAppointmentPatientCode = (appt) =>
    appt?.MaBenhNhan ||
    appt?.maBenhNhan ||
    appt?.patientCode ||
    appt?.code ||
    appt?.patient_code ||
    "";

  const readAppointmentId = (appt) =>
    appt?.MaLichHen || appt?.maLichHen || appt?.appointmentCode || appt?.id || "";

  const readAppointmentType = (appt) =>
    appt?.LoaiHen || appt?.loaiHen || appt?.apptType || appt?.appointmentType || "";

  const isFollowupAppointmentType = (value) => {
    const normalized = normalizeText(value).replace(/_/g, " ");
    return (
      normalized.includes("tai kham") ||
      normalized.includes("kham lai") ||
      normalized.includes("follow")
    );
  };

  const readAppointmentPatientName = (appt) =>
    appt?.TenBenhNhan ||
    appt?.tenBenhNhan ||
    appt?.HoTen ||
    appt?.hoTen ||
    appt?.patientName ||
    appt?.patient ||
    "";

  const readAppointmentPhone = (appt) =>
    appt?.SoDienThoai ||
    appt?.soDienThoai ||
    appt?.DienThoai ||
    appt?.dienThoai ||
    appt?.phone ||
    "";

  const mapAppointmentToBooking = (appt) => ({
    appointmentCode: readAppointmentId(appt),
    MaLichHen: readAppointmentId(appt),
    maLichHen: readAppointmentId(appt),
    LoaiHen: readAppointmentType(appt),
    loaiHen: readAppointmentType(appt),
    appointmentType: readAppointmentType(appt),
    apptType: readAppointmentType(appt),
    date:
      appt?.NgayHen ||
      appt?.ngayHen ||
      appt?.date ||
      appt?.appointmentDate ||
      today,
    time:
      appt?.GioHen ||
      appt?.gioHen ||
      appt?.time ||
      "",
    doctor:
      appt?.TenBacSiKham ||
      appt?.tenBacSiKham ||
      appt?.doctorName ||
      appt?.doctor ||
      "",
    dept:
      appt?.KhoaKham ||
      appt?.khoaKham ||
      appt?.deptName ||
      appt?.dept ||
      "",
  });
  // Override service items when prefetched from CLS orders
  const [servicePrefill, setServicePrefill] = useState([]);
  const [serviceRoomPrefill, setServiceRoomPrefill] = useState([]);
  const [serviceStaffPrefill, setServiceStaffPrefill] = useState([]);
  const [serviceNotePrefill, setServiceNotePrefill] = useState([]);
  const [servicePricePrefill, setServicePricePrefill] = useState([]);
  const [clsOrderId, setClsOrderId] = useState("");
  const [clsStaffCode, setClsStaffCode] = useState("");
  const [loadingFinalDiagnosis, setLoadingFinalDiagnosis] = useState(false);

  // ✅ Cache key để track bệnh nhân nào đang có data cached
  const cachedDiagnosisPatientRef = useRef(null);

  // ✅ Cache maPhieuKham để tránh mất khi switch tab
  const cachedMaPhieuKhamRef = useRef(null);

  // ✅ Track if fetchFinalDiagnosis is currently running
  const isFetchingDiagnosisRef = useRef(null);

  // ✅ Track if validation is currently running to prevent duplicate getClinicalExam calls
  const isValidatingPhieuKhamRef = useRef(null);

  // ✅ Track if search is currently running to prevent duplicate searchClinicalRaw calls
  const isSearchingPhieuKhamRef = useRef(null);

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
    followupFlags: {
      choVe: false,
      choThuocVe: false,
      taiKham: false,
    },
    followupDate: "",
    followupTime: "",
  };
  const [diagnosisData, setDiagnosisData] = useState(DIAG_INIT);
  const [svcResults, setSvcResults] = useState([]);
  const [serviceProcessSummary, setServiceProcessSummary] = useState(null);
  const [serviceProcessMeta, setServiceProcessMeta] = useState(null);
  const [processingServiceReturn, setProcessingServiceReturn] = useState(false);

  // ---------- Y tá xử lý ----------
  const [rx, setRx] = useState([]);
  /** Trạng thái đơn thuốc (da_ke, da_phat, …) sau khi tải / phát tại tab xử lý */
  const [prescriptionOrderStatus, setPrescriptionOrderStatus] = useState("");
  const [processInvoices, setProcessInvoices] = useState({
    examInvoice: null,
    drugInvoice: null,
  });
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
        const line =
          r.ThanhTien ?? r.thanhTien ?? r.amount ?? r.lineTotal ?? null;
        if (line != null && Number(line)) return sum + (Number(line) || 0);
        const qty =
          Number(r.qty ?? r.SoLuong ?? r.soLuong ?? 0) || 0;
        const price =
          Number(r.price ?? r.DonGia ?? r.donGia ?? 0) || 0;
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

  const parseMaybeJson = (value) => {
    if (!value || typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const normalizeServiceProcessResults = (summaryLike) => {
    const summary = parseMaybeJson(summaryLike);
    const parseAttachments = (raw) => {
      if (!raw) return [];

      if (Array.isArray(raw)) {
        return raw
          .map((item, index) => {
            if (typeof item === "string") {
              return {
                id: `file-${index + 1}`,
                name: item,
                url: "",
              };
            }

            if (item && typeof item === "object") {
              return {
                id: item.id || item.name || item.fileName || `file-${index + 1}`,
                name:
                  item.name ||
                  item.fileName ||
                  item.filename ||
                  item.url ||
                  `Tệp ${index + 1}`,
                url: item.url || item.href || item.path || "",
              };
            }

            return null;
          })
          .filter(Boolean);
      }

      if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (!trimmed) return [];

        if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
          try {
            return parseAttachments(JSON.parse(trimmed));
          } catch {
            return [
              {
                id: trimmed,
                name: trimmed,
                url: "",
              },
            ];
          }
        }

        return [
          {
            id: trimmed,
            name: trimmed,
            url: "",
          },
        ];
      }

      return [];
    };

    const arr =
      summary?.KetQua ||
      summary?.ketQua ||
      summary?.Items ||
      summary?.items ||
      (Array.isArray(summary) ? summary : []);

    if (!Array.isArray(arr)) return [];

    return arr.map((row, idx) => {
      const attachmentsRaw =
        row?.TepDinhKem ||
        row?.tepDinhKem ||
        row?.Attachments ||
        row?.attachments ||
        [];
      return {
        id:
          row?.MaKetQua ||
          row?.maKetQua ||
          row?.MaChiTietDv ||
          row?.maChiTietDv ||
          `${idx}`,
        service:
          row?.TenDichVu ||
          row?.tenDichVu ||
          row?.DichVu ||
          row?.dichVu ||
          row?.MaDichVu ||
          row?.maDichVu ||
          `Dich vu ${idx + 1}`,
        result:
          row?.NoiDungKetQua ||
          row?.noiDungKetQua ||
          row?.KetQua ||
          row?.ketQua ||
          row?.Result ||
          row?.result ||
          row?.KetLuanChuyen ||
          row?.ketLuanChuyen ||
          row?.GhiChu ||
          row?.ghiChu ||
          "Chua co ket qua",
        note: row?.GhiChu || row?.ghiChu || "",
        technician:
          row?.TenKyThuatVienThucHien ||
          row?.tenKyThuatVienThucHien ||
          row?.TenNhanSuThucHien ||
          row?.tenNhanSuThucHien ||
          row?.NguoiThucHien ||
          row?.nguoiThucHien ||
          "",
        timeText:
          row?.ThoiGianTao ||
          row?.thoiGianTao ||
          row?.ThoiGian ||
          row?.thoiGian ||
          "",
        attachments: parseAttachments(attachmentsRaw),
      };
    });
  };

  const loadServiceProcessData = async (maPhieuKham, currentPid) => {
    if (!maPhieuKham || !currentPid) return;

    try {
      const clinicalDetail = await getClinicalExam(maPhieuKham);
      if (!clinicalDetail) return;

      const detailPatientId =
        clinicalDetail?.MaBenhNhan || clinicalDetail?.maBenhNhan || "";
      if (detailPatientId && detailPatientId !== currentPid) {
        console.warn(
          `[PatientModal] Service summary mismatch: ${detailPatientId} != ${currentPid}`
        );
        return;
      }

      const maPhieuTongHop =
        clinicalDetail?.MaPhieuKqKhamCls ||
        clinicalDetail?.maPhieuKqKhamCls ||
        null;

      let summaryDto = null;
      if (maPhieuTongHop) {
        try {
          summaryDto = await getClsSummary(maPhieuTongHop);
        } catch (err) {
          console.warn("Lấy phiếu tổng hợp CLS thất bại:", err);
        }
      }

      const rawSummary =
        summaryDto?.SnapshotJson ||
        summaryDto?.snapshotJson ||
        clinicalDetail?.SnapshotKqKhamCls ||
        clinicalDetail?.snapshotKqKhamCls ||
        clinicalDetail?.clsSummary ||
        clinicalDetail?.ClsSummary ||
        null;

      setServiceProcessSummary(parseMaybeJson(rawSummary));
      setServiceProcessMeta({
        maPhieuTongHop:
          summaryDto?.MaPhieuTongHop ||
          summaryDto?.maPhieuTongHop ||
          maPhieuTongHop ||
          "",
        maPhieuKhamCls:
          summaryDto?.MaPhieuKhamCls ||
          summaryDto?.maPhieuKhamCls ||
          parseMaybeJson(rawSummary)?.MaPhieuKhamCls ||
          parseMaybeJson(rawSummary)?.maPhieuKhamCls ||
          "",
        maPhieuKham:
          clinicalDetail?.MaPhieuKham || clinicalDetail?.maPhieuKham || maPhieuKham,
        trangThai:
          summaryDto?.TrangThai ||
          summaryDto?.trangThai ||
          "cho_xu_ly",
        thoiGianXuLy:
          summaryDto?.ThoiGianXuLy || summaryDto?.thoiGianXuLy || null,
        ghiChu:
          summaryDto?.GhiChu ||
          summaryDto?.ghiChu ||
          clinicalDetail?.TrieuChung ||
          clinicalDetail?.trieuChung ||
          "",
      });
      setDiagnosisData((prev) => ({
        ...prev,
        MaPhieuKham:
          clinicalDetail?.MaPhieuKham || clinicalDetail?.maPhieuKham || maPhieuKham,
      }));
      setSvcResults(normalizeServiceProcessResults(rawSummary));
    } catch (err) {
      console.error("Tải dữ liệu tổng hợp CLS thất bại:", err);
      toast.error("Không thể tải phiếu tổng hợp kết quả CLS.");
    }
  };


  useEffect(() => {
    if (!open) {
      // ✅ Reset ALL state when modal closes to prevent stale data
      setIsDirty(false);
      setDiagnosisData(DIAG_INIT); // Clear diagnosis data
      setRx([]); // Clear prescriptions
      setPrescriptionOrderStatus("");
      setSvcResults([]); // Clear service results
      setServiceProcessSummary(null);
      setServiceProcessMeta(null);
      setProcessingServiceReturn(false);

      // ✅ Reset cache
      cachedDiagnosisPatientRef.current = null; // ✅ Clear cache
      cachedMaPhieuKhamRef.current = null; // ✅ Clear maPhieuKham cache
      isFetchingDiagnosisRef.current = false; // ✅ Clear fetching flag
      isValidatingPhieuKhamRef.current = null; // ✅ Clear validation flag
      isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag

      return;
    }

    // ✅ CRITICAL: Clear localStorage NGAY KHI MỞ MODAL để tránh lấy nhầm mã phiếu khám cũ
    // Phải clear trước khi useMemo maPhieuKhamCurrent chạy
    try {
      const oldMaPhieuKham = localStorage.getItem("last-clinical-exam-id");
      if (oldMaPhieuKham) {
        console.log(`[PatientModal] Clearing stale maPhieuKham from localStorage on modal open: ${oldMaPhieuKham}`);
        localStorage.removeItem("last-clinical-exam-id");
      }
    } catch (err) {
      console.warn("[PatientModal] Failed to clear localStorage on open:", err);
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
    setPrescriptionOrderStatus("");
    setServiceProcessSummary(null);
    setServiceProcessMeta(null);
    setProcessingServiceReturn(false);

    if (patient && mode === "process") {
      // ✅ RESET diagnosis data về DIAG_INIT khi mở modal mới (tránh cache cũ)
      setDiagnosisData(DIAG_INIT);

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

      // ✅ Lấy mã bệnh nhân hiện tại
      const currentPid = patient?.id || patient?.pid || patient?.MaBenhNhan || patient?.maBenhNhan;

      // ✅ Lấy maPhieuKham từ patient prop (KHÔNG lấy từ localStorage để tránh lấy nhầm)
      const maPhieuKham =
        patient?.MaPhieuKham ||
        patient?.maPhieuKham ||
        patient?.MaPhieuKhamLs ||
        patient?.maPhieuKhamLs ||
        form?.MaPhieuKham ||
        form?.maPhieuKham ||
        null;

      console.log(
        `[PatientModal] Process mode - currentPid: ${currentPid}, maPhieuKham: ${maPhieuKham}`
      );

      if (isSvcProcessing && maPhieuKham && currentPid) {
        cachedMaPhieuKhamRef.current = maPhieuKham;
        void loadServiceProcessData(maPhieuKham, currentPid);
        return;
      }

      if (maPhieuKham && currentPid) {
        // ✅ Check if already validating to prevent duplicate getClinicalExam calls
        if (isValidatingPhieuKhamRef.current === maPhieuKham) {
          console.log(`[PatientModal] Already validating phiếu khám ${maPhieuKham}, skipping duplicate`);
          return; // Skip duplicate validation
        }

        // ✅ Lưu maPhieuKham vào ref để dùng cho lần sau (khi switch tab)
        cachedMaPhieuKhamRef.current = maPhieuKham;
        console.log(`[PatientModal] Saved maPhieuKham to ref: ${maPhieuKham}`);

        // ✅ Mark as validating
        isValidatingPhieuKhamRef.current = maPhieuKham;

        // ✅ REMOVED: Don't check fetchedDiagnosisRef here
        // Let fetchFinalDiagnosis handle cache logic internally

        // ✅ CRITICAL: Validate phiếu khám có thuộc về bệnh nhân này không
        // Gọi API để lấy thông tin phiếu khám và kiểm tra MaBenhNhan
        (async () => {
          try {
            const { getClinicalExam } = await import("../../api/examination");
            const clinicalExam = await getClinicalExam(maPhieuKham);

            if (!clinicalExam) {
              console.warn(`[PatientModal] Phiếu khám ${maPhieuKham} không tồn tại`);
              toast.error("Phiếu khám không tồn tại.");
              isValidatingPhieuKhamRef.current = null; // ✅ Clear validation flag
              return;
            }

            const examPatientId = clinicalExam.MaBenhNhan || clinicalExam.maBenhNhan;

            if (examPatientId !== currentPid) {
              console.error(
                `[PatientModal] ❌ PHIẾU KHÁM KHÔNG KHỚP: ` +
                `Phiếu khám ${maPhieuKham} thuộc về bệnh nhân ${examPatientId}, ` +
                `KHÔNG phải ${currentPid}. Bỏ qua để tránh hiển thị sai dữ liệu.`
              );
              toast.error(
                `Lỗi dữ liệu: Phiếu khám ${maPhieuKham} không thuộc về bệnh nhân này. ` +
                `Vui lòng kiểm tra lại dữ liệu.`
              );
              isValidatingPhieuKhamRef.current = null; // ✅ Clear validation flag
              return;
            }

            console.log(
              `[PatientModal] ✅ Phiếu khám ${maPhieuKham} thuộc về bệnh nhân ${currentPid}. ` +
              `Tiếp tục lấy chẩn đoán...`
            );

            // ✅ Always call fetchFinalDiagnosis - it will handle cache and duplicate prevention internally
            if (isSvcProcessing) {
              void loadServiceProcessData(maPhieuKham, currentPid);
            } else {
              fetchFinalDiagnosis(currentPid);
            }

            // ✅ Clear validation flag after successful validation
            isValidatingPhieuKhamRef.current = null;
          } catch (err) {
            console.error("[PatientModal] Lỗi khi validate phiếu khám:", err);
            toast.error("Không thể kiểm tra phiếu khám. Vui lòng thử lại.");
            isValidatingPhieuKhamRef.current = null; // ✅ Clear validation flag on error
          }
        })();
      } else if (currentPid) {
        // ✅ Check if already searching to prevent duplicate searchClinicalRaw calls
        if (isSearchingPhieuKhamRef.current === currentPid) {
          console.log(`[PatientModal] Already searching for phiếu khám of patient ${currentPid}, skipping duplicate`);
          return; // Skip duplicate search
        }

        // ✅ Mark as searching
        isSearchingPhieuKhamRef.current = currentPid;

        // Nếu không có maPhieuKham, thử tìm lại từ pid
        (async () => {
          try {
            const { searchClinicalRaw } = await import("../../api/examination");
            const clinicalList = await searchClinicalRaw({
              MaBenhNhan: currentPid, // ✅ Filter theo đúng mã bệnh nhân
            });

            if (Array.isArray(clinicalList) && clinicalList.length > 0) {
              // ✅ Lọc lấy phiếu đang hoạt động + kiểm tra mã bệnh nhân
              const activeClinical = clinicalList.find(
                (c) => {
                  // Kiểm tra mã bệnh nhân
                  const clinicalPid = c.MaBenhNhan || c.maBenhNhan;
                  if (clinicalPid && clinicalPid !== currentPid) {
                    return false; // Bỏ qua nếu không khớp mã BN
                  }

                  const status = c.TrangThai || c.trangThai || "";
                  return (
                    status !== "da_hoan_tat" &&
                    status !== "da_huy" &&
                    status !== "" &&
                    (status === "da_lap" ||
                      status === "dang_kham" ||
                      status === "da_lap_chan_doan")
                  );
                }
              );

              if (activeClinical) {
                const foundMaPhieuKham =
                  activeClinical?.MaPhieuKham ||
                  activeClinical?.maPhieuKham ||
                  null;

                if (foundMaPhieuKham) {
                  // ✅ Lưu maPhieuKham vào ref để dùng cho lần sau
                  cachedMaPhieuKhamRef.current = foundMaPhieuKham;
                  console.log(`[PatientModal] Saved found maPhieuKham to ref: ${foundMaPhieuKham}`);

                  // Lưu vào form để fetchFinalDiagnosis dùng
                  setForm(prev => ({
                    ...prev,
                    MaPhieuKham: foundMaPhieuKham,
                    maPhieuKham: foundMaPhieuKham,
                  }));

                  // ✅ Always call fetchFinalDiagnosis - it will handle cache and duplicate prevention internally
                  setTimeout(() => {
                    if (isSvcProcessing) {
                      void loadServiceProcessData(foundMaPhieuKham, currentPid);
                    } else {
                      fetchFinalDiagnosis(currentPid);
                    }
                    // ✅ Clear search flag after calling fetchFinalDiagnosis
                    isSearchingPhieuKhamRef.current = null;
                  }, 100);
                } else {
                  // Không tìm thấy mã phiếu khám
                  console.log("[PatientModal] Không tìm thấy mã phiếu khám cho bệnh nhân:", currentPid);
                  isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag
                }
              } else {
                // Không tìm thấy phiếu khám đang hoạt động
                console.log("[PatientModal] Chưa có phiếu khám đang hoạt động cho bệnh nhân:", currentPid);
                isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag
              }
            } else {
              // Không có phiếu khám nào
              console.log("[PatientModal] Chưa có phiếu khám cho bệnh nhân:", currentPid);
              isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag
            }
          } catch (err) {
            console.error("Lỗi khi tìm phiếu khám tự động:", err);
            isSearchingPhieuKhamRef.current = null; // ✅ Clear search flag on error
          }
        })();
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
  }, [open, patient, patientForView, mode, today, isDirty, patientId, isSvcProcessing]); // ✅ Thêm patientId để reset khi đổi bệnh nhân

  // ✅ Reset cache khi đổi bệnh nhân
  useEffect(() => {
    if (!open) return;

    const currentPid =
      patient?.id ||
      patient?.pid ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      patientId;

    // Nếu đổi bệnh nhân khác, reset cache và clear diagnosis state
    if (currentPid && cachedDiagnosisPatientRef.current !== null && cachedDiagnosisPatientRef.current !== currentPid) {
      console.log(`[PatientModal] Patient changed from ${cachedDiagnosisPatientRef.current} to ${currentPid}, clearing cache`);
      cachedDiagnosisPatientRef.current = null; // ✅ Clear cache
      cachedMaPhieuKhamRef.current = null; // ✅ Clear maPhieuKham cache
      setDiagnosisData(DIAG_INIT); // ✅ Clear diagnosis state

      // ✅ Clear localStorage để tránh lấy nhầm mã phiếu khám cũ
      try {
        const oldMaPhieuKham = localStorage.getItem("last-clinical-exam-id");
        if (oldMaPhieuKham) {
          console.log(`[PatientModal] Clearing old maPhieuKham from localStorage: ${oldMaPhieuKham}`);
          localStorage.removeItem("last-clinical-exam-id");
        }
      } catch (err) {
        console.warn("[PatientModal] Failed to clear localStorage:", err);
      }
    }
  }, [open, patient, patientId]);

  // ❌ REMOVED: Don't reset cache when switching tabs
  // cachedDiagnosisPatientRef: đánh dấu đã tải chẩn đoán (đổi BN thì xóa); không còn dùng để skip GET.
  // Only clear cache when patient changes (above useEffect) or modal closes



  // ---- Helpers nhận diện trạng thái ----
  const isFollowupStatus =
    (patientForView?.status || "") === STATUSES.SCHEDULED_FUP;
  const isFollowupBooking = isFollowupAppointmentType(
    booking?.LoaiHen ||
    booking?.loaiHen ||
    booking?.appointmentType ||
    booking?.apptType ||
    ""
  );
  const isFollowupExamFlow = isFollowupStatus || isFollowupBooking;
  const isWaitingProcess =
    (patientForView?.status || "") === STATUSES.WAIT_PROC ||
    (patientForView?.status || "") === STATUSES.WAIT_PROC_SVC;

  useEffect(() => {
    if (!tpl) return;
    if (isServiceIntake) return;
    if (isFollowupExamFlow) {
      setBooking((b) =>
        Number(b?.price || 0) === 0 ? b : { ...b, price: 0 }
      );
    }
    // Chỉ cập nhật giá nếu tpl có giá và booking chưa có giá
    else if (tpl.price && tpl.price > 0) {
      setBooking((b) => ({ ...b, price: b.price && b.price > 0 ? b.price : Number(tpl.price) }));
    }
    // Cập nhật type từ template nếu exam.type đang trống
    if (tpl.title && !exam.type) {
      setExam((s) => ({ ...s, type: s.type || tpl.title }));
    }
  }, [tpl, exam.type, isServiceIntake, isFollowupExamFlow]);
  // Lịch sử khám từ PatientDetail
  const visits = useMemo(() => {
    const p = patientForView;
    if (!p) return [];
    if (Array.isArray(p.visits)) return p.visits;
    if (Array.isArray(p.LichSuKham)) return p.LichSuKham;
    if (Array.isArray(p.lich_su_kham)) return p.lich_su_kham;
    return [];
  }, [patientForView]);

  const normalizeVisitDate = (value) => {
    if (!value) return "";
    const str = String(value).trim();
    if (!str) return "";
    if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toISOString().slice(0, 10);
  };

  const normalizeVisitTime = (value) => {
    if (!value) return "";
    const str = String(value).trim();
    if (!str) return "";
    if (/^\d{2}:\d{2}/.test(str)) return str.slice(0, 5);
    const isoMatch = str.match(/T(\d{2}:\d{2})/);
    if (isoMatch) return isoMatch[1];
    const parsed = new Date(str);
    if (Number.isNaN(parsed.getTime())) return "";
    return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
  };

  const latestVisitForAppointmentPrefill = useMemo(() => {
    if (!Array.isArray(visits) || !visits.length) return null;

    const latestVisit = [...visits].sort((a, b) => {
      const aTime = new Date(a?.date || a?.Date || 0).getTime();
      const bTime = new Date(b?.date || b?.Date || 0).getTime();
      return bTime - aTime;
    })[0];

    if (!latestVisit) return null;

    const pid =
      patientForView?.MaBenhNhan ||
      patientForView?.maBenhNhan ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      patient?.id ||
      form?.id ||
      "";
    const name =
      patientForView?.HoTen ||
      patientForView?.hoTen ||
      patientForView?.name ||
      patient?.HoTen ||
      patient?.hoTen ||
      patient?.name ||
      form?.name ||
      "";

    return {
      date: normalizeVisitDate(latestVisit.date || latestVisit.Date),
      time: normalizeVisitTime(latestVisit.date || latestVisit.Date),
      patientName: name,
      patientCode: pid,
      doctorName: latestVisit.doctor || latestVisit.Doctor || "",
      deptName: latestVisit.dept || latestVisit.Dept || "",
      note: latestVisit.note || latestVisit.Note || "",
    };
  }, [visits, patientForView, patient, form]);

  // Lịch sử giao dịch từ PatientDetail
  const transactions = useMemo(() => {
    const p = patientForView;
    if (!p) return [];
    if (Array.isArray(p.transactions)) return p.transactions;
    if (Array.isArray(p.LichSuGiaoDich)) return p.LichSuGiaoDich;
    if (Array.isArray(p.lich_su_giao_dich)) return p.lich_su_giao_dich;
    return [];
  }, [patientForView]);

  useEffect(() => {
    const scoped = buildScopedProcessInvoices(
      transactions,
      diagnosisData?.MaPhieuKham || diagnosisData?.maPhieuKham || "",
      diagnosisData?.MaDonThuoc || diagnosisData?.maDonThuoc || diagnosisData?.prescriptionCode || ""
    );
    setProcessInvoices(scoped);
  }, [
    transactions,
    diagnosisData?.MaPhieuKham,
    diagnosisData?.maPhieuKham,
    diagnosisData?.MaDonThuoc,
    diagnosisData?.maDonThuoc,
    diagnosisData?.prescriptionCode,
  ]);

  const processExamInvoice = processInvoices.examInvoice;
  const processDrugInvoice = processInvoices.drugInvoice;
  const hasPendingExamPayment =
    normalizeInvoiceStatus(processExamInvoice?.status || processExamInvoice?.TrangThai) === "chua_thu";
  const hasCollectableExamPayment =
    hasPendingExamPayment && !isDeferredInvoice(processExamInvoice);
  const pendingExamFeeAmount =
    Number(processExamInvoice?.SoTien ?? processExamInvoice?.soTien ?? 0) || 0;
  const finishBlockedByPayment = hasCollectableExamPayment;

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
            const staffs = list.map(
              (it) =>
                it.TenKyThuatVienThucHien ||
                it.tenKyThuatVienThucHien ||
                it.TenNhanSuThucHien ||
                it.tenNhanSuThucHien ||
                it.TenYTaThucHien ||
                it.tenYTaThucHien ||
                ""
            );
            const notes = list.map((it) => it.GhiChu || it.ghiChu || "");
            const prices = list.map((it) => Number(it.PhiDV || it.phiDV || 0) || 0);
            setServicePrefill(services);
            setServiceRoomPrefill(rooms);
            setServiceStaffPrefill(staffs);
            setServiceNotePrefill(notes);
            setServicePricePrefill(prices);
            const staffItem = list.find(
              (it) =>
                it.MaKyThuatVienThucHien ||
                it.maKyThuatVienThucHien ||
                it.MaNhanSuThucHien ||
                it.maNhanSuThucHien ||
                it.MaYTaThucHien ||
                it.maYTaThucHien ||
                it.MaNguoiLap ||
                it.NguoiLap
            );
            const staffCode =
              staffItem?.MaKyThuatVienThucHien ||
              staffItem?.maKyThuatVienThucHien ||
              staffItem?.MaNhanSuThucHien ||
              staffItem?.maNhanSuThucHien ||
              staffItem?.MaYTaThucHien ||
              staffItem?.maYTaThucHien ||
              staffItem?.MaNguoiLap ||
              staffItem?.NguoiLap ||
              first?.MaKyThuatVienThucHien ||
              first?.MaNhanSuThucHien ||
              first?.PhieuKhamClsFull?.MaYTaThucHien ||
              first?.PhieuKhamClsFull?.MaNguoiLap ||
              first?.MaNguoiLap ||
              "";
            setClsStaffCode(staffCode);
            setClsOrderId(first?.MaPhieuKhamCls || first?.maPhieuKhamCls || "");
            setExam((s) => ({
              ...s,
              note:
                first?.GhiChu ||
                first?.ghiChu ||
                s.note ||
                "",
            }));
            // Prefill khoa/phòng nếu có
            const tenKhoa =
              first?.TenKhoa || first?.tenKhoa || first?.MaKhoa || "";
            const tenPhong =
              first?.TenPhong ||
              first?.tenPhong ||
              first?.MaPhong ||
              list[0]?.TenPhong ||
              list[0]?.MaPhong ||
              "";
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
            setServiceStaffPrefill([]);
            setServiceNotePrefill([]);
            setServicePricePrefill([]);
            setClsOrderId("");
            setClsStaffCode("");
          }
        } catch (err) {
          console.warn("Prefetch CLS orders failed:", err);
          setServicePrefill([]);
          setServiceRoomPrefill([]);
          setServiceStaffPrefill([]);
          setServiceNotePrefill([]);
          setServicePricePrefill([]);
          setClsOrderId("");
          setClsStaffCode("");
        }
      })();
    } else {
      setServicePrefill([]);
      setServiceRoomPrefill([]);
      setServiceStaffPrefill([]);
      setServiceNotePrefill([]);
      setServicePricePrefill([]);
      setClsOrderId("");
      setClsStaffCode("");
    }

    if (isFollowupExamFlow && !isServiceIntake) {
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

  useEffect(() => {
    if (!open || mode !== "exam") return;

    const patientAppointment = patient?.latestAppointment || patientForView?.latestAppointment;
    const matchesCurrentPatient = (appt) => {
      if (!appt) return false;

      const apptCode = String(readAppointmentPatientCode(appt) || "").trim();
      const apptName = normalizeText(readAppointmentPatientName(appt));
      const apptPhone = normalizeDigits(readAppointmentPhone(appt));
      const patientCode = String(currentPatientCode || "").trim();
      const patientName = normalizeText(currentPatientName);
      const patientPhone = normalizeDigits(currentPatientPhone);

      if (patientCode && apptCode && apptCode === patientCode) return true;
      if (patientPhone && apptPhone && apptPhone === patientPhone) return true;
      if (patientName && apptName && apptName === patientName) return true;

      return false;
    };

    const appointmentCandidate = patientAppointment || [examPrefillAppointment].find(matchesCurrentPatient);

    if (!appointmentCandidate) return;

    const nextBooking = mapAppointmentToBooking(appointmentCandidate);
    if (!nextBooking.MaLichHen) return;

    setBooking((prev) => ({
      ...prev,
      ...nextBooking,
      date: nextBooking.date || prev.date,
      time: nextBooking.time || prev.time,
      doctor: nextBooking.doctor || prev.doctor,
      dept: nextBooking.dept || prev.dept,
      price: isFollowupAppointmentType(readAppointmentType(appointmentCandidate))
        ? 0
        : prev.price,
    }));

    setExam((prev) => ({
      ...prev,
      hinhThucTiepNhan: "appointment",
      dept: nextBooking.dept || prev.dept,
    }));
  }, [
    open,
    mode,
    patient,
    patientForView,
    currentPatientCode,
    currentPatientName,
    currentPatientPhone,
    examPrefillAppointment,
  ]);

  // Re-apply template/service prefill after the modal open-reset effects.
  // This fixes the "first click on the initial template does not auto-fill"
  // case when service info is already cached and the reset effect clears it.
  useEffect(() => {
    if (!open || mode !== "exam" || isServiceIntake || !tpl) return;

    const { tenKhoa, tenPhong, tenBacSi, donGia } = readServiceInfoAutofill(
      serviceInfo
    );
    const fallbackPrice =
      donGia != null ? Number(donGia) || 0 : Number(tpl?.price || 0) || 0;

    setExam((prev) => {
      const nextType = tpl?.title || prev.type || "";
      const nextDept = tenKhoa || prev.dept || "";
      const nextRoom = tenPhong || prev.room || "";

      if (
        prev.type === nextType &&
        prev.dept === nextDept &&
        prev.room === nextRoom
      ) {
        return prev;
      }

      return {
        ...prev,
        type: nextType,
        dept: nextDept,
        room: nextRoom,
      };
    });

    setBooking((prev) => {
      const nextDept = tenKhoa || prev.dept || "";
      const nextDoctor = tenBacSi || prev.doctor || "";
      const nextPrice = isFollowupExamFlow
        ? 0
        : fallbackPrice || prev.price || 0;

      if (
        prev.dept === nextDept &&
        prev.doctor === nextDoctor &&
        Number(prev.price || 0) === Number(nextPrice || 0)
      ) {
        return prev;
      }

      return {
        ...prev,
        dept: nextDept,
        doctor: nextDoctor,
        price: nextPrice,
      };
    });
  }, [open, mode, isServiceIntake, tplId, tpl, serviceInfo, isFollowupExamFlow]);

  // ---- UI ghi chú từng dịch vụ (nếu intake dịch vụ) ----
  const serviceItems = useMemo(() => {
    if (servicePrefill.length) return servicePrefill;
    return Array.isArray(patient?.serviceOrder?.items)
      ? patient.serviceOrder.items
      : [];
  }, [patient?.serviceOrder, servicePrefill]);

  const [serviceNotes, setServiceNotes] = useState([]);
  const [serviceRooms, setServiceRooms] = useState([]);
  const serviceStaffs = useMemo(() => {
    if (servicePrefill.length) {
      return serviceStaffPrefill.length
        ? serviceStaffPrefill
        : serviceItems.map(() => "");
    }
    return serviceItems.map(() => "");
  }, [serviceItems, servicePrefill, serviceStaffPrefill]);
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
  const completeExamMut = useCompleteExam();
  const setExamActive = useExamStore((s) => s.setActive);

  /* ==================== PRINT OVERLAY STATE ==================== */
  const [print, setPrint] = useState({ show: false, payload: null });
  const [clsSummaryPrint, setClsSummaryPrint] = useState(null);
  const [paymentFlow, setPaymentFlow] = useState({
    open: false,
    examId: null,
    clsId: null,
    rxId: null,
    items: [],
    initialInvoice: null,
    allowDeferred: true,
    source: "exam",
    printPayload: null,
  });

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

  const openPaymentFlow = ({
    examId = null,
    clsId = null,
    rxId = null,
    items = [],
    initialInvoice = null,
    allowDeferred = true,
    source = "exam",
    printPayload = null,
  } = {}) => {
    const hasCharge = (items || []).some((it) => Number(it?.amount || 0) > 0);

    if (!hasCharge && !initialInvoice) {
      openPrint(printPayload || {});
      return;
    }

    setPaymentFlow({
      open: true,
      examId,
      clsId,
      rxId,
      items,
      initialInvoice,
      allowDeferred,
      source,
      printPayload,
    });
  };

  const closePaymentFlow = ({ closeModal = false } = {}) => {
    setPaymentFlow({
      open: false,
      examId: null,
      clsId: null,
      rxId: null,
      items: [],
      initialInvoice: null,
      allowDeferred: true,
      source: "exam",
      printPayload: null,
    });

    if (closeModal) {
      onClose?.();
    }
  };

  const handlePaymentComplete = (result) => {
    if (paymentFlow.source === "process-exam-fee") {
      setProcessInvoices((prev) => ({
        ...prev,
        examInvoice: prev.examInvoice
          ? { ...prev.examInvoice, TrangThai: "da_thu", status: "da_thu" }
          : prev.examInvoice,
      }));
      closePaymentFlow();
      toast.success("Đã thu phí phiếu khám.");
      refetchPatientDetail?.();
      return;
    }

    const nextPrintPayload = paymentFlow.printPayload
      ? {
        ...paymentFlow.printPayload,
        feePaid: result?.status === "paid",
      }
      : null;

    closePaymentFlow();

    toast.success(
      result?.status === "deferred"
        ? "Đã lưu hóa đơn ở trạng thái chưa thu."
        : "Lập phiếu và thanh toán thành công."
    );

    if (nextPrintPayload) {
      openPrint(nextPrintPayload);
    }
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

  /** Map normalizePrescription().items → dòng thuốc cho PatientProcessMode */
  function prescriptionItemsToProcessRows(items) {
    if (!Array.isArray(items) || !items.length) return [];
    return items.map((it) => ({
      MaThuoc: it.code,
      TenThuoc: it.name,
      DonViTinh: it.unit,
      SoLuong: it.qty,
      DonGia: it.price,
      ThanhTien: it.amount,
      ChiDinhSuDung: [it.dose, it.usage].filter(Boolean).join(" — ") || "",
    }));
  }

  // ----------------- FETCH FINAL DIAGNOSIS FOR PROCESS MODE -----------------
  const fetchFinalDiagnosis = async (explicitPatientId = null) => {
    // ✅ Check if already fetching to prevent duplicate calls
    if (isFetchingDiagnosisRef.current) {
      console.log("[fetchFinalDiagnosis] Already fetching, skipping duplicate call");
      return;
    }

    // ✅ Lấy mã bệnh nhân hiện tại (MUST HAVE)
    const currentPatientId =
      explicitPatientId ||
      form?.id ||
      form?.MaBenhNhan ||
      form?.maBenhNhan ||
      patient?.id ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      patientId;

    if (!currentPatientId) {
      toast.error("Thiếu mã bệnh nhân.");
      return;
    }

    // ✅ Check loading state
    if (loadingFinalDiagnosis) {
      console.log("[fetchFinalDiagnosis] Already loading, skipping duplicate call");
      return;
    }

    // ✅ Lấy maPhieuKham DYNAMICALLY (tránh stale closure)
    // KHÔNG dùng maPhieuKhamCurrent từ closure vì nó có thể đã thay đổi
    // Ưu tiên lấy từ cache ref nếu có, nếu không thì lấy từ patient/form
    const currentMaPhieuKham =
      cachedMaPhieuKhamRef.current ||
      patient?.MaPhieuKham ||
      patient?.maPhieuKham ||
      patient?.MaPhieuKhamLs ||
      patient?.maPhieuKhamLs ||
      form?.MaPhieuKham ||
      form?.maPhieuKham ||
      null;

    if (!currentMaPhieuKham) {
      console.warn(
        `[fetchFinalDiagnosis] Không tìm thấy mã phiếu khám cho bệnh nhân ${currentPatientId}`
      );
      console.warn(
        `[fetchFinalDiagnosis] Debug: ` +
        `cachedMaPhieuKhamRef=${cachedMaPhieuKhamRef.current}, ` +
        `patient.MaPhieuKham=${patient?.MaPhieuKham}, ` +
        `form.MaPhieuKham=${form?.MaPhieuKham}`
      );
      toast.error("Chưa có phiếu khám để tải chẩn đoán.");
      return;
    }

    // ✅ Lưu maPhieuKham vào ref để dùng cho lần sau
    if (currentMaPhieuKham && !cachedMaPhieuKhamRef.current) {
      cachedMaPhieuKhamRef.current = currentMaPhieuKham;
      console.log(`[fetchFinalDiagnosis] Cached maPhieuKham: ${currentMaPhieuKham}`);
    }

    // Không skip theo cachedDiagnosisPatientRef: sau khi BS kê đơn + xuất chẩn đoán,
    // cần gọi lại GET final-diagnosis + GET đơn thuốc; cache cũ khiến rx/MaDonThuoc không cập nhật.

    console.log(
      `[fetchFinalDiagnosis] Fetching diagnosis for patient: ${currentPatientId}, ` +
      `maPhieuKham: ${currentMaPhieuKham}`
    );

    // ✅ Mark as fetching to prevent duplicate calls
    isFetchingDiagnosisRef.current = true;

    try {
      setLoadingFinalDiagnosis(true);

      // ✅ Gọi API với mã phiếu khám đã lấy động
      const dxRes = await getFinalDiagnosis(currentMaPhieuKham);

      // ✅ Log toàn bộ response để debug
      console.log("[fetchFinalDiagnosis] API Response:", dxRes);

      if (!dxRes) {
        console.log("[fetchFinalDiagnosis] API returned null/undefined");
        setRx([]);
        setPrescriptionOrderStatus("");
        toast.error("Chưa có chẩn đoán cuối cho bệnh nhân này.");
        return;
      }

      // ✅ CRITICAL: Kiểm tra mã bệnh nhân có khớp không
      const diagnosisPatientId =
        dxRes.MaBenhNhan ||
        dxRes.maBenhNhan ||
        dxRes.patientId;

      console.log(
        `[fetchFinalDiagnosis] Checking patient ID: ` +
        `MaBenhNhan=${dxRes.MaBenhNhan}, ` +
        `maBenhNhan=${dxRes.maBenhNhan}, ` +
        `patientId=${dxRes.patientId}, ` +
        `result=${diagnosisPatientId}`
      );

      if (!diagnosisPatientId) {
        console.warn("[fetchFinalDiagnosis] Phiếu chẩn đoán không có mã bệnh nhân");
        console.warn("[fetchFinalDiagnosis] Response keys:", Object.keys(dxRes));
        setRx([]);
        setPrescriptionOrderStatus("");
        toast.error("Chưa có chẩn đoán cuối cho bệnh nhân này.");
        return;
      }

      if (diagnosisPatientId !== currentPatientId) {
        console.warn(
          `[fetchFinalDiagnosis] ❌ Mã bệnh nhân KHÔNG KHỚP: ` +
          `current=${currentPatientId}, diagnosis=${diagnosisPatientId}. ` +
          `Bỏ qua kết quả này để tránh hiển thị sai dữ liệu.`
        );
        setRx([]);
        setPrescriptionOrderStatus("");
        toast.error("Chưa có chẩn đoán cuối cho bệnh nhân này.");
        return;
      }

      console.log(
        `[fetchFinalDiagnosis] ✅ Mã bệnh nhân khớp: ${currentPatientId}. Loading diagnosis...`
      );

      // Parse HuongXuTri field to populate checkbox flags
      const huongXuTri = dxRes.HuongXuTri || dxRes.followup || "";
      const rawFollowupAt =
        dxRes.NgayTaiKham || dxRes.ngayTaiKham || "";
      const followupDate =
        typeof rawFollowupAt === "string" && rawFollowupAt
          ? rawFollowupAt.slice(0, 10)
          : "";
      const followupTime =
        typeof rawFollowupAt === "string" && rawFollowupAt.length >= 16
          ? rawFollowupAt.slice(11, 16)
          : "";
      const flags = {
        choVe: huongXuTri.includes("cho_ve") || huongXuTri.includes("Cho về"),
        choThuocVe: huongXuTri.includes("cho_thuoc_ve") || huongXuTri.includes("Cho thuốc về"),
        taiKham: huongXuTri.includes("tai_kham") || huongXuTri.includes("Tái khám"),
      };

      const maDonThuoc =
        dxRes.MaDonThuoc || dxRes.maDonThuoc || null;

      setDiagnosisData((prev) => ({
        ...prev,
        MaPhieuChanDoan: dxRes.MaPhieuChanDoan || dxRes.maPhieuChanDoan,
        MaPhieuKham: dxRes.MaPhieuKham || dxRes.maPhieuKham,
        MaDonThuoc: maDonThuoc,
        dxPrimary: dxRes.ChanDoanSoBo || dxRes.dxPrimary || "",
        dxSecondary: dxRes.ChanDoanCuoi || dxRes.dxSecondary || "",
        summary: dxRes.NoiDungKham || dxRes.summary || "",
        orders: dxRes.PhatDoDieuTri || dxRes.orders || "",
        advice: dxRes.LoiKhuyen || dxRes.advice || "",
        followupFlags: flags,
        followupDate,
        followupTime,
        prescriptionCode: maDonThuoc || "",
      }));

      if (maDonThuoc) {
        try {
          const presc = await getPrescriptionByCode(maDonThuoc);
          setRx(prescriptionItemsToProcessRows(presc?.items));
          setPrescriptionOrderStatus(
            String(presc?.status || presc?.rawStatus || "")
              .toLowerCase()
              .trim()
          );
        } catch (rxErr) {
          console.warn("[fetchFinalDiagnosis] Không tải được chi tiết đơn thuốc:", rxErr);
          setRx([]);
          setPrescriptionOrderStatus("");
        }
      } else {
        setRx([]);
        setPrescriptionOrderStatus("");
      }

      // ✅ CACHE: Mark this patient's diagnosis as cached
      cachedDiagnosisPatientRef.current = currentPatientId;
      console.log(`[fetchFinalDiagnosis] ✅ Cached diagnosis for patient ${currentPatientId}`);

      toast.success("Đã tải chẩn đoán cuối.");
    } catch (err) {
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "";

      console.error("[fetchFinalDiagnosis] Error:", err);

      // Nếu là lỗi 404 hoặc không tìm thấy
      if (err?.response?.status === 404 || msg.includes("not found") || msg.includes("không tìm thấy")) {
        // ✅ 404 là trường hợp bình thường khi chưa có chẩn đoán
        // Chỉ log, KHÔNG hiển thị toast để tránh làm phiền user
        console.log(
          `[fetchFinalDiagnosis] Chưa có chẩn đoán cuối cho phiếu khám ${currentMaPhieuKham}. ` +
          `Đây là trường hợp bình thường khi bác sĩ chưa lập chẩn đoán.`
        );
      } else {
        // ❌ Lỗi thật sự (không phải 404) → Hiển thị toast error
        toast.error(msg || "Không thể tải chẩn đoán cuối.");
      }
    } finally {
      setLoadingFinalDiagnosis(false);
      // ✅ Clear fetching flag
      isFetchingDiagnosisRef.current = false;
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
        // Toast sẽ hiển thị sau khi thanh toán xong (trong handlePaymentComplete)

        // Refetch patient detail to get updated status
        if (refetchPatientDetail) {
          await refetchPatientDetail();
        }

        setClsSummaryPrint(null);

        const paymentItems = (serviceItems || []).map((sv, i) => ({
          name: sv,
          amount: priceOfService(sv),
        }));

        openPaymentFlow({
          clsId: clsOrderId || null,
          items: paymentItems,
          printPayload: {
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
              technician: serviceStaffs[i] || "",
            })),
          },
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
    const fee = isFollowupExamFlow
      ? 0
      : Number(booking?.price ?? tpl?.price ?? 0) || 0;
    if (!dept || !room || !doctor) {
      toast.error("Vui lòng chọn đầy đủ khoa, phòng và bác sĩ.");
      return;
    }

    const label = isFollowupExamFlow ? "Ghi chú" : "Triệu chứng";
    const examNote = [
      `${label}: ${isFollowupExamFlow ? exam.note || "—" : exam.symptoms || "—"
      }`,
      ...examExtras.map(
        (e) =>
          `${EXTRA_FIELDS.find((f) => f.key === e.key)?.label || e.key
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
      exam?.hinhThucTiepNhan || (isFollowupExamFlow ? "service_return" : "walkin")
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
        MaLichHen:
          booking?.MaLichHen ||
          booking?.maLichHen ||
          booking?.appointmentCode ||
          booking?.id ||
          null,
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

      // Toast sẽ hiển thị sau khi thanh toán xong (trong handlePaymentComplete)
      // Không hiển thị toast BE message ở đây để tránh toast trùng lặp

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
    // Lượt khám sẽ được tạo tự động bởi Examination.jsx khi gọi vào khám (cần MaHangDoi)
    // Không cần tạo lượt khám ở đây vì chưa có MaHangDoi

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

    openPaymentFlow({
      examId: maPhieuKham,
      items: [
        {
          name: exam.type || tpl?.title || "Khám lâm sàng",
          amount: Number(fee) || 0,
        },
      ],
      printPayload: {
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
      },
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
      toast.error("Không tìm thấy lịch hẹn tái khám.");
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
          `${EXTRA_FIELDS.find((f) => f.key === e.key)?.label || e.key
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

    openPaymentFlow({
      items: [
        {
          name: "Phí tái khám",
          amount: Number(lateFee) || 0,
        },
      ],
      printPayload: {
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
      },
    });
  }

  function handleCollectProcessExamFee() {
    if (!processExamInvoice) {
      toast.error("Không tìm thấy hóa đơn phí phiếu khám.");
      return;
    }

    if (!canCollectProcessFee) {
      toast.error("Bạn không có quyền thu phí.");
      return;
    }

    if (isDeferredInvoice(processExamInvoice)) {
      toast.info("Hóa đơn đã được bảo lưu/công nợ, không thu tại tab xử lý.");
      return;
    }

    const status = normalizeInvoiceStatus(
      processExamInvoice?.TrangThai || processExamInvoice?.status
    );
    if (status !== "chua_thu") {
      toast.info("Hóa đơn phí phiếu khám không còn ở trạng thái chờ thu.");
      return;
    }

    openPaymentFlow({
      examId:
        diagnosisData?.MaPhieuKham ||
        diagnosisData?.maPhieuKham ||
        form?.MaPhieuKham ||
        form?.maPhieuKham ||
        patient?.MaPhieuKham ||
        patient?.maPhieuKham ||
        null,
      items: [
        {
          name:
            processExamInvoice?.NoiDung ||
            processExamInvoice?.noiDung ||
            "Phí phiếu khám",
          amount: processExamInvoice?.SoTien ?? processExamInvoice?.soTien ?? 0,
        },
      ],
      initialInvoice: processExamInvoice,
      allowDeferred: false,
      source: "process-exam-fee",
    });
  }

  // ----------------- HOÀN TẤT & THU PHÍ (THƯỜNG) -----------------
  async function handleFinishDoctor() {
    const pid = form?.id;
    if (!pid) {
      toast.error("Thiếu mã bệnh nhân.");
      return;
    }

    // ✅ Validation: Check at least one treatment direction is selected
    const flags = diagnosisData.followupFlags || {};
    const hasSelection = flags.choVe || flags.choThuocVe || flags.taiKham;

    if (!hasSelection) {
      toast.error("Vui lòng chọn ít nhất một hướng xử trí");
      return;
    }

    // ✅ 1. Lấy maPhieuKham
    const maPhieuKham =
      diagnosisData?.MaPhieuKham ||
      diagnosisData?.maPhieuKham ||
      form?.MaPhieuKham ||
      form?.maPhieuKham ||
      patient?.MaPhieuKham ||
      patient?.maPhieuKham ||
      patient?.MaPhieuKhamLs ||
      patient?.maPhieuKhamLs ||
      null;

    if (!maPhieuKham) {
      toast.error("Thiếu mã phiếu khám. Không thể hoàn tất.");
      return;
    }

    const d = diagnosisData || {};
    const plannedFollowupDate = String(d.followupDate || "").slice(0, 10);
    const plannedFollowupTime = String(d.followupTime || "").trim();
    const maDonThuoc =
      d?.MaDonThuoc ||
      d?.maDonThuoc ||
      d?.prescriptionCode ||
      "";
    const plannedFollowupAt = plannedFollowupDate
      ? `${plannedFollowupDate}T${/^\d{2}:\d{2}$/.test(plannedFollowupTime) ? plannedFollowupTime : "08:00"}:00`
      : "";

    if (flags.taiKham && !plannedFollowupDate) {
      toast.error("Thiếu ngày tái khám.");
      return;
    }

    try {
      const invoiceSearch = await searchInvoices({
        MaBenhNhan: pid,
        Page: 1,
        PageSize: 100,
      });
      const invoiceRows = invoiceSearch?.Items ?? invoiceSearch?.items ?? [];
      const scopedInvoices = buildScopedProcessInvoices(
        invoiceRows,
        maPhieuKham,
        maDonThuoc
      );

      const latestExamInvoice = scopedInvoices.examInvoice || processExamInvoice;
      const latestDrugInvoice = scopedInvoices.drugInvoice || processDrugInvoice;
      setProcessInvoices({
        examInvoice: latestExamInvoice || null,
        drugInvoice: latestDrugInvoice || null,
      });

      const latestExamStatus = normalizeInvoiceStatus(
        latestExamInvoice?.TrangThai || latestExamInvoice?.status
      );
      if (latestExamStatus === "chua_thu" && !isDeferredInvoice(latestExamInvoice)) {
        toast.warn("Vui lòng thu phí phiếu khám trước khi hoàn tất.");
        return;
      }

      // ✅ 2. Gọi API hoàn tất phiếu khám
      await completeExamMut.mutateAsync({
        maPhieuKham,
        ForceComplete: false, // Không force, kiểm tra đầy đủ các bước
        GhiChu: "Hoàn tất từ tab xử lý chẩn đoán",
      });

      toast.success("Đã hoàn tất phiếu khám.");

      // ✅ 3. Nếu có tái khám, xử lý flow tái khám
      if (flags.taiKham) {
        // ✅ 3.1 Save context to localStorage
        try {
          saveFollowupContext({
            patientId: pid,
            patientName: form?.name || patient?.name || "",
            doctorCode: currentUserInfo.code || "",
            doctorName: currentUserInfo.name || currentUser || "",
            examDate: new Date().toISOString(),
            followupDateTime: plannedFollowupAt,
            deptName: booking.dept || exam.dept || "",
            note: d.advice || exam.note || "",
          });
          console.log("[Follow-up] Context saved to localStorage");
        } catch (err) {
          console.error("[Follow-up] Failed to save context:", err);
          toast.error("Không thể lưu thông tin tái khám");
        }

        // ✅ 3.2 Update patient status
        await onMutatePatient?.(pid, { status: STATUSES.DONE });

        // ✅ 3.3 Mark appointment done
        try {
          if (typeof markAppointmentDoneForPid === "function") {
            markAppointmentDoneForPid(pid);
          }
        } catch (err) {
          console.warn("Could not mark appointment done:", err);
        }

        // ✅ 3.4 Navigate to Appointments page with flash animation
        // ❌ REMOVED: toast.info() - will be shown in Appointments.jsx to prevent duplicate
        onClose?.();

        // ✅ Sử dụng UIStore để flash nút "Tạo lịch hẹn" giống flow check-in
        const uiStore = useUIStore.getState();
        uiStore.flashApptCreate();

        // Navigate after a short delay to ensure modal closes first
        setTimeout(() => {
          navigate("/appointments");
        }, 300);

        return;
      }

      // ✅ 4. Normal flow (không tái khám)
      const date = (d.followupDate || "").slice(0, 10);
      const time = d.followupTime || "";
      if (date) {
        // Create followup hold if date is specified
        try {
          if (typeof createFollowupHold === "function") {
            createFollowupHold({
              pid,
              patient: form?.name || pid,
              date,
              time,
              dept: booking.dept || exam.dept || "",
              doctor: booking.doctor || "",
              note: d.advice || "Hẹn tái khám",
            });
          }
        } catch (err) {
          console.warn("Could not create followup hold:", err);
        }
        await onMutatePatient?.(pid, { status: STATUSES.SCHEDULED_FUP });
      } else {
        await onMutatePatient?.(pid, { status: STATUSES.DONE });
      }

      // ✅ 5. Mark appointment done (if function exists)
      try {
        if (typeof markAppointmentDoneForPid === "function") {
          markAppointmentDoneForPid(pid);
        }
      } catch (err) {
        console.warn("Could not mark appointment done:", err);
      }

      // ✅ 6. Đóng modal
      onClose?.();

    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.message ||
        "Không thể hoàn tất phiếu khám. Vui lòng thử lại.";
      toast.error(msg);
      console.error("Lỗi khi hoàn tất phiếu khám:", err);
    }
  }

  // ----------------- DỊCH VỤ: TRẢ VỀ BÁC SĨ -----------------
  async function handleServiceReturnToDoctor() {
    const pid =
      form?.id ||
      form?.MaBenhNhan ||
      form?.maBenhNhan ||
      patient?.id ||
      patient?.MaBenhNhan ||
      patient?.maBenhNhan ||
      "";
    const maPhieuKham =
      cachedMaPhieuKhamRef.current ||
      diagnosisData?.MaPhieuKham ||
      diagnosisData?.maPhieuKham ||
      patient?.MaPhieuKham ||
      patient?.maPhieuKham ||
      "";

    if (!pid || !maPhieuKham) {
      toast.error("Không tìm thấy phiếu khám để trả về bác sĩ.");
      return;
    }

    try {
      setProcessingServiceReturn(true);

      const clinicalDetail = await getClinicalExam(maPhieuKham);
      if (!clinicalDetail) {
        throw new Error("Không tìm thấy chi tiết phiếu khám.");
      }

      const maKhoa = clinicalDetail?.MaKhoa || clinicalDetail?.maKhoa || "";
      const maPhong = clinicalDetail?.MaPhong || clinicalDetail?.maPhong || "";
      const maBacSiKham =
        clinicalDetail?.MaBacSiKham || clinicalDetail?.maBacSiKham || "";
      const maNguoiLap =
        currentUserInfo.code ||
        clinicalDetail?.MaNguoiLap ||
        clinicalDetail?.maNguoiLap ||
        "";
      const maDichVuKham =
        clinicalDetail?.MaDichVuKham || clinicalDetail?.maDichVuKham || "";

      if (!maKhoa || !maPhong || !maBacSiKham || !maNguoiLap || !maDichVuKham) {
        throw new Error("Phiếu khám thiếu thông tin để mở lại lượt service_return.");
      }

      await createClinicalExamMut.mutateAsync({
        MaBenhNhan: pid,
        MaKhoa: maKhoa,
        MaPhong: maPhong,
        MaBacSiKham: maBacSiKham,
        MaNguoiLap: maNguoiLap,
        MaDichVuKham: maDichVuKham,
        HinhThucTiepNhan: "service_return",
        MaLichHen:
          clinicalDetail?.MaLichHen || clinicalDetail?.maLichHen || null,
        NgayLap: new Date().toISOString(),
        TrieuChung:
          clinicalDetail?.TrieuChung ||
          clinicalDetail?.trieuChung ||
          exam?.symptoms ||
          "",
      });

      const maPhieuTongHop =
        serviceProcessMeta?.maPhieuTongHop ||
        serviceProcessMeta?.MaPhieuTongHop ||
        clinicalDetail?.MaPhieuKqKhamCls ||
        clinicalDetail?.maPhieuKqKhamCls ||
        "";

      if (maPhieuTongHop) {
        try {
          await updateClsSummaryStatus(maPhieuTongHop, "da_hoan_tat");
        } catch (err) {
          console.warn("Cập nhật trạng thái tổng hợp CLS thất bại:", err);
        }
      }

      await refetchPatientDetail?.();
      await onMutatePatient?.(pid, { status: STATUSES.WAIT_EXAM });
      toast.success("Đã trả bệnh nhân về hàng đợi bác sĩ.");
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.Message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể xử lý và trả bệnh nhân về bác sĩ.";
      console.error("Trả kết quả CLS về bác sĩ thất bại:", err);
      toast.error(msg);
    } finally {
      setProcessingServiceReturn(false);
    }
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
        lastVisit:
          latestVisitForAppointmentPrefill || {
            patientName: name,
            patientCode: pid,
          },
      };

      // Lưu vào localStorage
      localStorage.setItem("appt-prefill", JSON.stringify(apptPrefillData));

      // ✅ Flash nút "Tạo lịch hẹn" ở trang Appointments
      const uiStore = useUIStore.getState();
      uiStore.flashApptCreate();

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
                          ? isSvcProcessing
                            ? "Xử lý tổng hợp CLS"
                            : "Xử lý chẩn đoán"
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
                    handleCreateAppointmentFromView={canCreateAppt ? handleCreateAppointmentFromView : undefined}
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
                    onTemplateChange={handleTemplateChange}
                    tpl={tpl}
                    tplList={tplList}
                    booking={booking}
                    setBooking={setBooking}
                    isServiceIntake={isServiceIntake}
                    isFollowupStatus={isFollowupExamFlow}
                    serviceItems={serviceItems}
                    serviceNotes={serviceNotes}
                    setServiceNotes={setServiceNotes}
                    serviceRooms={serviceRooms}
                    setServiceRooms={setServiceRooms}
                    serviceStaffs={serviceStaffs}
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
                    serviceNoteReadOnly={isServiceIntake && isReceptionUser}
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
                    clsSummary={serviceProcessSummary}
                    serviceProcessMeta={serviceProcessMeta}
                    processingServiceReturn={processingServiceReturn}
                    setSvcResults={setSvcResults}
                    handleServiceReturnToDoctor={handleServiceReturnToDoctor}
                    prescriptionOrderStatus={prescriptionOrderStatus}
                    showExamFeePayment={hasCollectableExamPayment}
                    canCollectExamFee={canCollectProcessFee}
                    onCollectExamFee={handleCollectProcessExamFee}
                    collectExamFeeBusy={paymentFlow.open && paymentFlow.source === "process-exam-fee"}
                    pendingExamFeeAmount={pendingExamFeeAmount}
                    finishBlockedByPayment={finishBlockedByPayment}
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

          <PaymentWizard
            open={paymentFlow.open}
            patient={{
              id: form?.id,
              name: form?.name,
              HoTen: form?.name,
              MaBenhNhan: form?.id,
            }}
            items={paymentFlow.items}
            examId={paymentFlow.examId}
            clsId={paymentFlow.clsId}
            rxId={paymentFlow.rxId}
            initialInvoice={paymentFlow.initialInvoice}
            allowDeferred={paymentFlow.allowDeferred}
            onClose={() =>
              closePaymentFlow({
                closeModal: paymentFlow.source !== "process-exam-fee",
              })
            }
            onComplete={handlePaymentComplete}
          />

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
            services={
              print.payload?.services ||
              (serviceItems || []).map((sv, i) => ({
              name: sv,
              room: serviceRooms[i] || `Phòng ${sv}`,
              price: priceOfService(sv),
              note: serviceNotes[i] || "",
              technician: serviceStaffs[i] || "",
              }))
            }
            feePaid={
              print.payload?.feePaid ??
              (isServiceIntake ? totalServiceFee > 0 : (booking.price || 0) > 0)
            }
          />
        </>
      )}
    </AnimatePresence>
  );
}
