import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PatientsToolbar from "../components/patients/PatientsToolbar.jsx";
import PatientsTable from "../components/patients/PatientsTable.jsx";
import PatientsFilterPopover from "../components/patients/PatientsFilterPopover.jsx";
import PatientModal from "../components/patients/PatientModal.jsx";
import Pagination from "../components/ui/Pagination.jsx";

import {
  usePatientsList,
  useCreatePatient,
  useUpdatePatient,
  useUpdatePatientStatus,
  usePatientDetail,
  
  STATUSES,
} from "../api/patients";
import { on } from "../api/realtime.js";
import { useQueryClient } from "@tanstack/react-query";
import { APPT_STATUS, searchAppointmentsRaw } from "../api/appointments";
import { searchClinicalRaw, getFinalDiagnosis } from "../api/examination";

import { useUIStore, useExamStore, useAuthStore } from "../components/stores/appStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { toast } from "react-toastify";
import { apiLogger } from "../utils/apiLogger.js";
import { canCreatePatient, canEditPatient } from "../utils/permissions.js";

const PATIENT_TOAST_IDS = {
  checkInReady: "patients-checkin-ready",
  checkInLoadError: "patients-checkin-load-error",
  flashAddReady: "patients-flash-add-ready",
  flashAddLoadError: "patients-flash-add-load-error",
  examInfoLoadError: "patients-exam-info-load-error",
};

// Lấy chuỗi yyyy-MM-dd của hôm nay
const todayStr = () => {
  try {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return "";
  }
};

function normStatusCode(p) {
  const todayStatus =
    p?.trang_thai_hom_nay_code ??
    p?.statusCode ??
    p?.trang_thai_hom_nay ??
    p?.todayStatus ??
    p?.status ??
    "";
  return String(todayStatus || "").trim();
}

function normAccount(p) {
  const v =
    p?.trang_thai_tai_khoan ??
    p?.accountStatus ??
    p?.account?.status ??
    "";
  return String(v || "").trim();
}

function normStatusDate(p) {
  const v =
    p?.NgayTrangThai ??
    p?.ngay_trang_thai ??
    p?.statusDate ??
    "";
  return String(v || "").trim();
}
function pickLatestAppointment(list = []) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const parseTs = (item) => {
    const d =
      item.NgayHen ||
      item.ngayHen ||
      item.date ||
      item.NgayHenKham ||
      item.appointmentDate ||
      "";
    const t =
      item.GioHen ||
      item.gioHen ||
      item.time ||
      item.GioHenKham ||
      "";

    if (!d && !t) return 0;

    try {
      const day = String(d).slice(0, 10);
      const time = String(t || "00:00").slice(0, 5);
      return new Date(`${day}T${time}:00`).getTime();
    } catch {
      return 0;
    }
  };

  return list.reduce(
    (best, cur) => {
      const ts = parseTs(cur);
      if (!best || ts > best.ts) return { ts, item: cur };
      return best;
    },
    null
  )?.item;
}

const toSearchableText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const toDigits = (value) => String(value || "").replace(/\D/g, "");

const readPatientName = (patient) =>
  patient?.HoTen ||
  patient?.hoTen ||
  patient?.fullName ||
  patient?.name ||
  patient?.TenBenhNhan ||
  patient?.tenBenhNhan ||
  patient?.patientName ||
  "";

const readPatientPhone = (patient) =>
  patient?.SoDienThoai ||
  patient?.soDienThoai ||
  patient?.DienThoai ||
  patient?.dienThoai ||
  patient?.phone ||
  "";

const readAppointmentPatientCode = (appt) =>
  appt?.MaBenhNhan ||
  appt?.maBenhNhan ||
  appt?.patientCode ||
  appt?.code ||
  appt?.patient_code ||
  "";

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


export default function Patients() {
  useViewportVH();

  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const nav = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

  // ✅ Check permissions
  const user = useAuthStore((s) => s.user);
  const canCreatePatientAction = canCreatePatient(user);
  const canEditPatientAction = canEditPatient(user);

  // === Bộ lọc
  const [filter, setFilter] = useState({
    keyword: "",
    // status code (TrangThaiHomNay)
    todayStatus: "all",
    // trạng thái tài khoản
    accountStatus: "all",
    // flag chỉ hôm nay (đang xử lý ở FE)
    todayOnly: false,
  });

  const [viewMode, setViewMode] = useState("today"); // "today" | "all"
  const [sort, setSort] = useState("priority"); // "priority" | "name" | "date"
  const [modal, setModal] = useState({
    open: false,
    mode: "view", // "view" | "add" | "edit" | "exam" | "process"
    patient: null,
  });
  // Khi modal mở với các mode khác "add" → load PatientDetail từ API
  const activePid =
    modal.open && modal.patient
      ? modal.patient?.id ||
        modal.patient?.pid ||
        modal.patient?.MaBenhNhan ||
        modal.patient?.maBenhNhan
      : null;

  const { data: patientDetail } = usePatientDetail(activePid, {
    enabled: !!activePid && modal.mode !== "add",
  });

  const patientForModal =
    modal.mode === "add" ? modal.patient : patientDetail || modal.patient;

  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

  const highlightPid = useUIStore((s) => s.highlightPid);
  const highlightNotified = useUIStore((s) => s.highlightNotified);  // ✅ NEW
  const markHighlightNotified = useUIStore((s) => s.markHighlightNotified);  // ✅ NEW
  const clearHighlight = useUIStore((s) => s.clearHighlight);
  const setHighlightPid = useUIStore((s) => s.setHighlightPid);

  const flashAddAt = useUIStore((s) => s.flashAddAt);
  const flashAddNotified = useUIStore((s) => s.flashAddNotified);  // ✅ NEW
  const markFlashAddNotified = useUIStore((s) => s.markFlashAddNotified);  // ✅ NEW
  const ackFlashAdd = useUIStore((s) => s.ackFlashAdd);

  const patientPrefill = useUIStore((s) => s.patientPrefill);
  const setPatientPrefill = useUIStore((s) => s.setPatientPrefill);
  const clearPatientPrefill = useUIStore((s) => s.clearPatientPrefill);

  // Exam store: dùng để prefill phiếu khám
  const setExamActive = useExamStore((s) => s.setActive);
  const setExamPrefillAppointment = useExamStore(
    (s) => s.setPrefillAppointment
  );
  const setExamCurrentClinical = useExamStore(
    (s) => s.setCurrentClinical
  );

  async function findLatestCheckedInAppointmentForPatient(patient) {
    const patientCode =
      patient?.id ||
      patient?.maBenhNhan ||
      patient?.ma_benh_nhan ||
      patient?.MaBenhNhan ||
      patient?.pid ||
      "";
    const patientName = toSearchableText(readPatientName(patient));
    const patientPhone = toDigits(readPatientPhone(patient));
    const today = todayStr();

    const prefilledAppointment = patientPrefill?.latestAppointment;
    if (prefilledAppointment) {
      const prefillCode = String(
        patientPrefill?.code || patientPrefill?.maBenhNhan || ""
      ).trim();
      const samePrefillCode =
        !!patientCode && !!prefillCode && String(patientCode).trim() === prefillCode;
      const samePrefillName =
        !!patientName &&
        patientName === toSearchableText(patientPrefill?.name || readAppointmentPatientName(prefilledAppointment));
      const samePrefillPhone =
        !!patientPhone &&
        patientPhone === toDigits(patientPrefill?.phone || readAppointmentPhone(prefilledAppointment));

      if (samePrefillCode || samePrefillName || samePrefillPhone) {
        return prefilledAppointment;
      }
    }

    const tryFindByCode = async () => {
      if (!patientCode) return null;
      const appts = await searchAppointmentsRaw({
        MaBenhNhan: patientCode,
        TrangThai: APPT_STATUS.DA_CHECKIN,
        FromDate: today,
        ToDate: today,
        Page: 1,
        PageSize: 200,
      });
      return Array.isArray(appts) && appts.length ? pickLatestAppointment(appts) : null;
    };

    const matchCandidate = (appt) => {
      const apptCode = String(readAppointmentPatientCode(appt) || "").trim();
      const apptName = toSearchableText(readAppointmentPatientName(appt));
      const apptPhone = toDigits(readAppointmentPhone(appt));

      if (patientCode && apptCode && apptCode === String(patientCode).trim()) return true;
      if (patientPhone && apptPhone && apptPhone === patientPhone) return true;
      if (patientName && apptName && apptName === patientName) return true;
      if (patientName && apptName && (apptName.includes(patientName) || patientName.includes(apptName))) {
        return !patientPhone || !apptPhone || apptPhone === patientPhone;
      }
      return false;
    };

    const byCode = await tryFindByCode();
    if (byCode) return byCode;

    const broadList = await searchAppointmentsRaw({
      TrangThai: APPT_STATUS.DA_CHECKIN,
      FromDate: today,
      ToDate: today,
      Page: 1,
      PageSize: 200,
    });

    if (!Array.isArray(broadList) || broadList.length === 0) return null;

    const matched = broadList.filter(matchCandidate);
    return matched.length ? pickLatestAppointment(matched) : null;
  }

  const [processPrefill, setProcessPrefill] = useState(null);


  // ✅ Phân trang
  const [page, setPage] = useState(1);

  // ✅ Map frontend sort → backend SortBy/SortDirection
  const getSortParams = (sortValue) => {
    switch (sortValue) {
      case "name":
        return { sortBy: "hoten", sortDirection: "asc" };
      case "date":
        return { sortBy: "ngaytrangthai", sortDirection: "desc" };
      case "priority":
        // Priority logic phức tạp, tạm thời dùng default của backend (theo HoTen)
        // TODO: Implement priority sorting ở backend nếu cần
        return { sortBy: "hoten", sortDirection: "asc" };
      default:
        return { sortBy: "hoten", sortDirection: "asc" };
    }
  };

  const sortParams = getSortParams(sort);

  // === Tải danh sách từ API (server đã lọc và sort)
  const { data: result = { Items: [], TotalItems: 0, Page: 1, PageSize: 50 } } = usePatientsList({
        keyword: filter.keyword || undefined,
        // mã TrangThaiHomNay theo API (cho_kham, cho_tiep_nhan, ...)
        status: filter.todayStatus === "all" ? undefined : filter.todayStatus,
        // trạng thái tài khoản: hoat_dong | khong_hoat_dong | da_xoa
        accountStatus:
          filter.accountStatus === "all" ? undefined : filter.accountStatus,
        // map sang OnlyToday trong PatientSearchFilter
        todayOnly: viewMode === "today",
        page,
        pageSize: 50, // ✅ Chuẩn hóa: 50 items mặc định
        sortBy: sortParams.sortBy,
        sortDirection: sortParams.sortDirection,
      });

  const items = result.Items || [];
  const totalItems = result.TotalItems || 0;
  const totalPages = Math.ceil(totalItems / 50);

  // ✅ Reset page khi filter, viewMode hoặc sort thay đổi
  useEffect(() => {
    if (page > 1) setPage(1);
  }, [filter.keyword, filter.todayStatus, filter.accountStatus, viewMode, sort]);

  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updatePatient } = useUpdatePatient();
  const { mutateAsync: updatePatientStatus } = useUpdatePatientStatus();
  const qc = useQueryClient();
  // Map to suppress duplicate success toasts for the same patient
  const suppressedStatusToast = React.useRef(new Map());

  const mutatePatientStatus = React.useCallback(
    async (id, next, options = {}) => {
      const pid = id || modal?.patient?.id || modal?.patient?.pid;
      if (!pid) return;

      let payload = null;
      if (typeof next === "string") {
        payload = { status: next };
      } else if (next && typeof next === "object") {
        const status =
          next.status ||
          next.statusCode ||
          next.trang_thai_tai_khoan ||
          next.TrangThai;

        payload = {
          ...next,
          ...(status ? { status } : {}),
        };
      }

      if (!payload?.status) return;

      try {
        await updatePatientStatus({
          id: pid,
          ...payload,
        });

        const shouldSuppress = options.suppressIfRecentlyUpdated ?? false;
        const ts = suppressedStatusToast.current.get(pid);
        const now = Date.now();

        if (shouldSuppress && ts && now - ts < 3000) {
          suppressedStatusToast.current.delete(pid);
          return;
        }

        if (!options.suppressSuccessToast) {
          toast.success(
            options.successMessage ||
              "Đã cập nhật trạng thái bệnh nhân thành công."
          );
        }
      } catch (err) {
        const msg =
          options.errorMessage ||
          err?.response?.data?.message ||
          err?.message ||
          "Không thể cập nhật trạng thái. Vui lòng thử lại.";
        toast.error(msg);
        throw err;
      }
    },
    [modal?.patient?.id, modal?.patient?.pid, updatePatientStatus]
  );

  // ✅ Subscribe realtime events for Patients
  useEffect(() => {
    const offPatientCreated = on('PatientCreated', (patient) => {
      console.log('[Patients] Bệnh nhân mới:', patient);
      qc.invalidateQueries({ queryKey: ['patients'] });
    });
    
    const offPatientUpdated = on('PatientUpdated', (patient) => {
      console.log('[Patients] Bệnh nhân cập nhật:', patient);
      qc.invalidateQueries({ queryKey: ['patients'] });
    });
    
    const offPatientStatusUpdated = on('PatientStatusUpdated', (patient) => {
      console.log('[Patients] Trạng thái bệnh nhân cập nhật:', patient);
      qc.invalidateQueries({ queryKey: ['patients'] });
    });
    
    return () => {
      offPatientCreated?.();
      offPatientUpdated?.();
      offPatientStatusUpdated?.();
    };
  }, [qc]);

  // ✅ Refs to prevent duplicate useEffect execution for check-in flow
  const hasProcessedHighlightRef = React.useRef(false);
  const hasProcessedFlashAddRef = React.useRef(false);
  
  // ✅ Clear stale prefill khi mount nếu flash đã quá cũ (> 5 phút)
  useEffect(() => {
    const now = Date.now();
    const flashAge = flashAddAt ? now - flashAddAt : Infinity;
    
    // Chỉ clear nếu flash đã cũ hơn 5 phút (300000ms)
    // Điều này cho phép user chuyển trang rồi quay lại vẫn còn highlight
    if (patientPrefill && flashAddAt && flashAge > 300000) {
      console.log("[Patients] Clearing stale prefill on mount (flashAge:", flashAge, "ms, > 5 min)");
      clearPatientPrefill();
      ackFlashAdd();
    }
  }, []); // Chỉ chạy 1 lần khi mount

  // === Auto clear highlight sau 5s
  useEffect(() => {
    if (!highlightPid) return;
    const t = setTimeout(() => clearHighlight(), 5000);
    return () => clearTimeout(t);
  }, [highlightPid, clearHighlight]);

  // === Khi highlight xuất hiện -> call API search appointments đã check-in
  useEffect(() => {
    // ✅ Guard: Prevent duplicate execution
    if (hasProcessedHighlightRef.current) {
      console.log("[Patients] Highlight already processed, skipping");
      return;
    }
    
    if (!highlightPid) {
      // ✅ Reset ref when highlightPid is cleared
      hasProcessedHighlightRef.current = false;
      return;
    }

    (async () => {
      try {
        const targetPatient =
          items.find(
            (entry) =>
              (entry?.id ||
                entry?.maBenhNhan ||
                entry?.ma_benh_nhan ||
                entry?.MaBenhNhan ||
                entry?.pid) === highlightPid
          ) || { id: highlightPid, MaBenhNhan: highlightPid };

        const latest = await findLatestCheckedInAppointmentForPatient(targetPatient);
        if (latest) {
          
          // Lưu vào store patientPrefill
          const currentPrefill = useUIStore.getState().patientPrefill;
          setPatientPrefill({
            ...(currentPrefill || {}),
            code: highlightPid,
            maBenhNhan: highlightPid,
            latestAppointment: latest || null,
          });
        }
        
        // ✅ Show toast only if not already notified
        if (!highlightNotified) {
          toast.success("Đã check-in. Vui lòng lập phiếu khám cho bệnh nhân.", {
            toastId: PATIENT_TOAST_IDS.checkInReady,
          });
          markHighlightNotified();
        }
        
        // Mark as processed
        hasProcessedHighlightRef.current = true;
      } catch (err) {
        console.error("Không lấy được lịch hẹn đã check-in khi highlight:", err);
        toast.error("Không thể tải thông tin lịch hẹn. Vui lòng thử lại.", {
          toastId: PATIENT_TOAST_IDS.checkInLoadError,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightPid, items]);

  // ❌ REMOVED: Separate useEffect to reset ref - causes duplicate execution
  // Reset is now handled inside the main useEffect when highlightPid is cleared

  // === Flash nút + Thêm khi có flashAddAt
  useEffect(() => {
    // ✅ Guard: Prevent duplicate execution
    if (hasProcessedFlashAddRef.current) {
      console.log("[Patients] FlashAdd already processed, skipping");
      return;
    }
    
    if (!flashAddAt) {
      // ✅ Reset ref when flashAddAt is cleared
      hasProcessedFlashAddRef.current = false;
      return;
    }

    // ✅ Show toast only if not already notified
    if (!flashAddNotified) {
      toast.success("Vui lòng thêm bệnh nhân mới từ lịch hẹn đã check-in.", {
        toastId: PATIENT_TOAST_IDS.flashAddReady,
      });
      markFlashAddNotified();
    }
    
    // ✅ Auto-clear flash after 5 seconds
    const t = setTimeout(() => {
      ackFlashAdd();
    }, 5000);
    
    // Mark as processed
    hasProcessedFlashAddRef.current = true;
    
    return () => {
      clearTimeout(t);
    };
  }, [flashAddAt, ackFlashAdd, flashAddNotified, markFlashAddNotified]);

  // === Khi có flashAddAt -> call API searchAppointmentsRaw với LoaiHen "kham_moi" + TrangThai "da_checkin"
  // ✅ Ref to prevent duplicate API calls
  const hasProcessedFlashAddApiRef = React.useRef(false);
  
  useEffect(() => {
    // ✅ Guard: Prevent duplicate API execution
    if (hasProcessedFlashAddApiRef.current) {
      console.log("[Patients] FlashAdd API already processed, skipping");
      return;
    }
    
    if (!flashAddAt) {
      // ✅ Reset ref when flashAddAt is cleared
      hasProcessedFlashAddApiRef.current = false;
      return;
    }

    (async () => {
      try {
        // Call API search appointments với LoaiHen "kham_moi" + TrangThai "da_checkin"
        apiLogger.log({
          endpoint: '/appointments/search',
          params: { LoaiHen: "kham_moi", TrangThai: APPT_STATUS.DA_CHECKIN },
          source: 'Patients.flashAddAt.useEffect',
          fromCache: false,
        });

        const appts = await searchAppointmentsRaw({
          LoaiHen: "kham_moi",
          TrangThai: APPT_STATUS.DA_CHECKIN,
        });

        if (Array.isArray(appts) && appts.length > 0) {
          // Lọc lấy kết quả với NgayHen và GioHen mới nhất
          const latest = pickLatestAppointment(appts);
          
          if (latest) {
            // Lưu vào store patientPrefill với tên và sdt
            setPatientPrefill({
              name: latest.TenBenhNhan || latest.HoTen || latest.patientName || "",
              phone: latest.SoDienThoai || latest.DienThoai || latest.phone || "",
              latestAppointment: latest,
            });
            // ❌ REMOVED: Duplicate toast - already shown in flash effect above
          }
        }
        
        // ✅ Mark as processed after successful API call
        hasProcessedFlashAddApiRef.current = true;
      } catch (err) {
        console.error("Không lấy được lịch hẹn đã check-in khi flash add:", err);
        toast.error("Không thể tải thông tin từ lịch hẹn. Vui lòng nhập thủ công.", {
          toastId: PATIENT_TOAST_IDS.flashAddLoadError,
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashAddAt]);

  // ❌ REMOVED: Separate useEffect to reset refs - causes duplicate execution
  // Reset is now handled inside the main useEffect when flashAddAt is cleared
  

  // ✅ KHÔNG clear prefill khi unmount - cho phép user chuyển trang rồi quay lại
  // Chỉ clear khi reload trang (beforeunload)
  useEffect(() => {
    const onBeforeUnload = () => {
      // Clear khi reload/đóng tab
      clearPatientPrefill();
      ackFlashAdd();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      // ❌ KHÔNG clear khi unmount (chuyển trang) - giữ prefill để quay lại
    };
  }, [clearPatientPrefill, ackFlashAdd]);

  // ✅ Với phân trang, filter và sort đã được làm ở BE
  // Không cần filter/sort ở FE nữa
  const filtered = items; // items đã được filter và sort ở backend

  // === Đếm số lượng theo trạng thái hôm nay
  const counts = useMemo(() => {
    const s = (p) => normStatusCode(p);

    const done = items.filter(
      (p) => s(p) === STATUSES.DONE || s(p) === STATUSES.DONE_EXAM
    ).length;

    const waitExam = items.filter(
      (p) => s(p) === STATUSES.WAIT_EXAM || s(p) === STATUSES.WAIT_EXAM_SVC
    ).length;

    const waitProc = items.filter(
      (p) =>
        s(p) === STATUSES.WAIT_PROC || s(p) === STATUSES.WAIT_PROC_SVC
    ).length;

    const waitIntake = items.filter(
      (p) =>
        s(p) === STATUSES.WAIT_INTAKE || s(p) === STATUSES.WAIT_INTAKE_SVC
    ).length;

    const cancelled = items.filter(
      (p) => s(p) === STATUSES.CANCELLED
    ).length;

    const inExam = items.filter(
      (p) => s(p) === STATUSES.IN_EXAM || s(p) === STATUSES.IN_EXAM_SVC
    ).length;

    return { done, waitExam, waitProc, waitIntake, cancelled, inExam };
  }, [items]);

  async function handleAction(type, p) {
    // Không clear prefill ở đây, chỉ clear khi đóng modal Add
    if (!p) return;
    setProcessPrefill(null);

    const pid =
      p.id ||
      p.maBenhNhan ||
      p.ma_benh_nhan ||
      p.MaBenhNhan ||
      p.pid;

    if (type === "view") {
      setModal({ open: true, mode: "view", patient: p });
      return;
    }

    if (!canEditPatientAction) {
      return;
    }

    if (type === "edit") {
      setModal({ open: true, mode: "edit", patient: p });
      return;
    }

    if (type === "intake") {
      // Mở tab phiếu khám (Exam)
      setModal({ open: true, mode: "exam", patient: p });
      setExamActive(p);

      const todayStatus =
        normStatusCode(p).toLowerCase() || normStatusCode(patientDetail || {}).toLowerCase();

      const isServiceWait =
        todayStatus === STATUSES.WAIT_INTAKE_SVC;

      if (pid && !isServiceWait) {
        // 1. Search lịch hẹn đã check-in mới nhất hôm nay
        try {
          const latest = await findLatestCheckedInAppointmentForPatient(p);
          setExamPrefillAppointment(latest || null);
        } catch (err) {
          console.warn("[Patients] searchAppointmentsRaw check-in error:", err);
          setExamPrefillAppointment(null);
        }

        // 2. Search phiếu khám LS đang thực hiện (dang_thuc_hien)
        try {
          const clinicalList = await searchClinicalRaw({
            MaBenhNhan: pid,
            TrangThai: "dang_thuc_hien",
          });

          if (Array.isArray(clinicalList) && clinicalList.length > 0) {
            setExamCurrentClinical(clinicalList);
          } else {
            setExamCurrentClinical(null);
          }
        } catch (err) {
          console.warn("[Patients] searchClinicalRaw in-progress error:", err);
        }
      } else {
        // Service intake: không cần prefetch appointments/clinical
        setExamPrefillAppointment(null);
        setExamCurrentClinical(null);
      }

      return;
    }
    // ===== XỬ LÝ & CHẨN ĐOÁN =====
    if (type === "process") {
      // Tìm phiếu khám đang hoạt động và lưu maPhieuKham vào patient object
      let patientWithExam = { ...p };

      if (pid) {
        try {
          // ✅ Tìm phiếu khám đang hoạt động theo mã bệnh nhân
          // Theo rule: 1 bệnh nhân chỉ có 1 phiếu LS đang hoạt động
          // Filter các trạng thái đang hoạt động: da_lap, dang_kham, da_lap_chan_doan
          // Loại trừ: da_hoan_tat, da_huy
          const clinicalList = await searchClinicalRaw({
            MaBenhNhan: pid,
            // Không truyền TrangThai - lấy tất cả để tìm phiếu đang hoạt động
          });

          if (Array.isArray(clinicalList) && clinicalList.length > 0) {
            // ✅ Lọc lấy phiếu đang hoạt động (không phải da_hoan_tat hoặc da_huy)
            // Các trạng thái đang hoạt động: da_lap, dang_kham, da_lap_chan_doan
            const activeClinical = clinicalList.find(
              (c) => {
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

            // Nếu không tìm thấy phiếu đang hoạt động, lấy phiếu mới nhất (fallback)
            const targetClinical = activeClinical || clinicalList[0];

            const maPhieuKham = 
              targetClinical?.MaPhieuKham ||
              targetClinical?.maPhieuKham ||
              targetClinical?.id ||
              null;

            if (maPhieuKham) {
              // ✅ LƯU maPhieuKham vào patient object
              patientWithExam = {
                ...patientWithExam,
                MaPhieuKham: maPhieuKham,
                maPhieuKham: maPhieuKham,
                MaPhieuKhamLs: maPhieuKham,
                maPhieuKhamLs: maPhieuKham,
              };
            }
          }
        } catch (err) {
          console.error("Lỗi khi tìm phiếu khám:", err);
          toast.error("Không thể tải thông tin phiếu khám. Modal vẫn sẽ mở, bạn có thể tải lại sau.", {
            toastId: PATIENT_TOAST_IDS.examInfoLoadError,
          });
        }
      }

      // ✅ Mở modal với patient đã có maPhieuKham
      setModal({ open: true, mode: "process", patient: patientWithExam });

      return;
    }
  }


  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        <PatientsToolbar
          counts={counts}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onAdd={canCreatePatientAction ? () => {
            // Nếu có patientPrefill (từ flashAddAt) -> fill sẵn tên + sdt
            // Nếu không có patientPrefill -> mở bình thường không fill
            const hasPrefill = !!patientPrefill;
            const latest = patientPrefill?.latestAppointment;
        
            setModal({
              open: true,
              mode: "add",
              patient: {
                // Mã bệnh nhân: để trống (backend tự sinh)
                id: "",
                // Tên: chỉ fill nếu có prefill
                name: hasPrefill
                  ? (patientPrefill?.name ||
                     latest?.TenBenhNhan ||
                     latest?.HoTen ||
                     latest?.patientName ||
                     "")
                  : "",
        
                // SĐT: chỉ fill nếu có prefill
                phone: hasPrefill
                  ? (patientPrefill?.phone ||
                     latest?.SoDienThoai ||
                     latest?.DienThoai ||
                     latest?.phone ||
                     "")
                  : "",
        
                // giữ luôn bản ghi lịch hẹn để tab tạo sau này muốn lấy thêm
                latestAppointment: latest || null,
              },
            });
            
            // Giữ patientPrefill qua bước tạo bệnh nhân để sau khi lưu
            // còn nối lại được lịch hẹn vừa check-in với Mã BN mới.
            if (hasPrefill) {
              ackFlashAdd();
            }
          } : undefined}
          onOpenFilter={() => {
            setFilterAnchor(filterBtnRef.current);
            setFilterOpen(true);
          }}
          onResetFilters={() => {
            setFilter({
              keyword: "",
              accountStatus: "all",
              todayStatus: "all",
              todayOnly: false,
            });
          }}
          sort={sort}
          onChangeSort={setSort}
          filterBtnRef={filterBtnRef}
          flashAddAt={flashAddAt}
        />

        <div className="card mt-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PatientsTable
              items={filtered}
              onAction={handleAction}
              onStatusChange={mutatePatientStatus}
              stretch
              highlightPid={highlightPid}
              canEditPatient={canEditPatientAction}
              canCreateExam={canEditPatientAction}
              canProcessPatient={canEditPatientAction}
              canCancelPatientFlow={canEditPatientAction}
            />
          </div>
          {totalItems > 0 && (
            <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={50}
                onPageChange={setPage}
                showWhenSinglePage
                className="px-4 py-3"
              />
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {filterOpen && (
          <PatientsFilterPopover
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            values={filter}
            setValues={(v) =>
              setFilter((s) => ({
                ...s,
                ...v,
              }))
            }
            anchorEl={filterAnchor}
            sort={sort}
            onChangeSort={setSort}
            onReset={() => {
              setFilter({
                keyword: "",
                accountStatus: "all",
                todayStatus: "all",
                todayOnly: false,
              });
              setSort("priority");
            }}
          />
        )}

        {modal.open && (
          <PatientModal
            mode={modal.mode}
            open={modal.open}
            patient={patientForModal}
            onClose={() => {
              // Do not clear `patientPrefill` here — keep prefill in store
              // so user can re-open Add modal without losing data.
              setModal({ open: false, mode: "view", patient: null });
            }}
            onSaved={(p) => {
              // đóng modal
              const wasAddMode = modal.mode === "add";
              const createdFromAppointment = modal.patient?.latestAppointment || null;
              setModal({ open: false, mode: "view", patient: null });

              // điều hướng + focus vào BN vừa thao tác
              const pid =
                p?.id || p?.pid || p?.MaBenhNhan || p?.maBenhNhan;
              if (pid) {
                // Highlight the newly created/updated patient row
                try {
                  setHighlightPid(pid);
                } catch {}

                nav(`/patients?pid=${encodeURIComponent(pid)}`);

                // Force refetch patients list to ensure 'All' tab includes new record
                try {
                  qc.refetchQueries({ queryKey: ["patients"], exact: false });
                } catch {}
              }

              // Nếu tạo bệnh nhân từ lịch hẹn check-in, giữ lại prefill và gắn Mã BN mới
              // để bước "Lập phiếu" ngay sau đó lấy được đúng lịch hẹn.
              if (wasAddMode) {
                if (createdFromAppointment && pid) {
                  setPatientPrefill({
                    name:
                      p?.name ||
                      p?.HoTen ||
                      p?.hoTen ||
                      modal.patient?.name ||
                      patientPrefill?.name ||
                      "",
                    phone:
                      p?.phone ||
                      p?.DienThoai ||
                      p?.dienThoai ||
                      modal.patient?.phone ||
                      patientPrefill?.phone ||
                      "",
                    code: pid,
                    maBenhNhan: pid,
                    latestAppointment: createdFromAppointment,
                    linkedAt: Date.now(),
                  });
                } else {
                  clearPatientPrefill();
                }
              }
            }}
                     onSave={async (data) => {
                       try {
                         if (modal.mode === "add") {
                           // createPatient (mutateAsync) trả về entity đã lưu
                           const result = await createPatient(data);
                          toast.success("Đã tạo bệnh nhân mới thành công.");
                           return result;
                         }
                         // update
                         const result = await updatePatient({
                           id: data?.id || data?.pid,
                           patch: data,
                         });
                        // Show update toast and mark pid to suppress an immediate status-toast
                        const pidForToast = result?.id || result?.pid || result?.MaBenhNhan || result?.maBenhNhan;
                        if (pidForToast) {
                          suppressedStatusToast.current.set(pidForToast, Date.now());
                        }
                        toast.success("Đã cập nhật thông tin bệnh nhân thành công.");
                         return result;
                       } catch (err) {
                         const msg =
                           err?.response?.data?.message ||
                           err?.message ||
                           (modal.mode === "add"
                             ? "Không thể tạo bệnh nhân. Vui lòng thử lại."
                             : "Không thể cập nhật bệnh nhân. Vui lòng thử lại.");
                         toast.error(msg);
                         throw err;
                       }
                     }}
                     onMutatePatient={(id, next) =>
                      mutatePatientStatus(id, next, {
                        suppressIfRecentlyUpdated: true,
                      })
                    }
                    
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
