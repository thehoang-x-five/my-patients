import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import QueueFilterPopover from "../components/exam/QueueFilterPopover.jsx";
import Pagination from "../components/ui/Pagination.jsx";
import { toast } from "react-toastify";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

import {
  useQueueSearch,
  useFinishRemove,
  subscribeQueue,
  getQueueById,
} from "../api/queue.js";
import { on } from "../api/realtime.js";

import {
  useCreateExamOrder,
  useCreateDiagnosis,
  useCancelVisit,
  useCancelWaitingClinicalQueue,
  useCancelClsOrder,
} from "../api/examination.js";
import { useCreateHistoryVisit } from "../api/history.js";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../components/stores/appStore.js";
import {
  canCallPatient,
  canCancelClinicalVisit,
  canCancelClsOrder,
  isAdmin,
  isReceptionNurse,
  isDoctor,
  isClinicalNurse,
  isClsNurse,
  isTechnician,
} from "../utils/permissions.js";

const CLS_CREATED_KEY = "cls-orders-created";

function loadClsCreatedSet() {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(CLS_CREATED_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return new Set(arr.map((x) => String(x)));
  } catch (err) {
    console.warn("KhA'ng th ¯Ÿ load danh sA­ch CLS dA3 tA1o:", err);
  }
  return new Set();
}

function persistClsCreatedSet(set) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CLS_CREATED_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.warn("KhA'ng th ¯Ÿ l­u danh sA­ch CLS dA3 tA1o:", err);
  }
}

export default function Examination() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();

  // ✅ Check permissions
  const user = useAuthStore((s) => s.user);
  const canCall = canCallPatient(user);
  const canCancelVisitAction = canCancelClinicalVisit(user);
  const canCancelClsAction = canCancelClsOrder(user);
  const userRole = user?.ChucVu || user?.chucVu || user?.role || null;
  const nurseType = user?.LoaiYTa || user?.loaiYTa || user?.nurseType || null;

  const defaultKind = useMemo(() => {
    if (isDoctor(user) || isClinicalNurse(user)) return "ls";
    if (isTechnician(user) || isClsNurse(user)) return "cls";
    if (isAdmin(user) || isReceptionNurse(user)) return "all";
    return "all";
  }, [user]);

  // ✅ Auto-detect queue type based on user role

  // Determine default queue kind based on user (values match TYPE_OPTIONS: 'ls' | 'cls' | 'all')
  const legacyDefaultKind = useMemo(() => {
    if (userRole === 'bac_si') return 'ls';                     // Bác sĩ → chỉ LS
    if (userRole === 'ky_thuat_vien') return 'cls';             // KTV → chỉ CLS
    if (userRole === 'y_ta') {
      if (nurseType === 'phong_kham') return 'ls';              // Y tá LS
      if (nurseType === 'can_lam_sang') return 'cls';           // Y tá CLS
      if (nurseType === 'hanhchinh') return 'all';              // Y tá HC
    }
    if (userRole === 'admin') return 'all';
    return 'all';
  }, [userRole, nurseType]);

  // Khóa loại lượt theo role (null = không khóa, tự do chọn)
  const lockedKind = defaultKind !== "all" ? defaultKind : null;

  // Filter theo nguồn (walkin / appointment / service_return) + loại lượt (ls / cls) + search
  const [filter, setFilter] = useState({
    source: "all",
    kind: defaultKind, // ✅ Auto-set based on user
    search: "",
    status: "all",
  });

  // ✅ Update filter.kind when user changes
  useEffect(() => {
    setFilter(prev => ({ ...prev, kind: defaultKind }));
  }, [defaultKind]);
  const [filterOpen, setFilterOpen] = useState(false);

  // ✅ Pagination
  const [page, setPage] = useState(1);

  // ✅ Map frontend filter → backend filter params
  const queueFilterParams = useMemo(() => {
    const params = {
      Page: page,
      PageSize: 50,
    };

    // Source (Nguon)
    if (filter.source !== "all") {
      params.Nguon = filter.source;
    }

    // Status (TrangThai)
    if (filter.status !== "all") {
      params.TrangThai = filter.status;
    }

    // Kind (LoaiHangDoi)
    if (filter.kind === "cls") {
      params.LoaiHangDoi = "can_lam_sang";
    } else if (filter.kind === "ls" || filter.kind === "clinical") {
      params.LoaiHangDoi = "kham_lam_sang";
    }
    // "all" → không set LoaiHangDoi

    // Keyword (search)
    if (filter.search && filter.search.trim()) {
      params.Keyword = filter.search.trim();
    }

    // Date range: hôm nay (local time, không convert UTC)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(startOfToday.getTime() + 86400000 - 1);
    
    // ✅ Format local time as ISO string without timezone conversion
    // Backend expects local time (DateTime.Now), not UTC
    const formatLocalDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    
    params.FromTime = formatLocalDateTime(startOfToday);
    params.ToTime = formatLocalDateTime(endOfToday);

    return params;
  }, [filter, page]);

  // ✅ Sử dụng useQueueSearch với filter params
  const queueSearchResult = useQueueSearch(queueFilterParams);
  const queueData = queueSearchResult.data || { Items: [], TotalItems: 0, Page: 1, PageSize: 50 };
  const patients = Array.isArray(queueData?.Items) ? queueData.Items : queueData?.items || [];
  const totalItems = queueData.TotalItems || queueData.totalItems || 0;
  const totalPages = Math.ceil(totalItems / 50);

  const keyOf = (p) =>
    p?.MaHangDoi ??
    p?.maHangDoi ??
    p?.queueId ??
    p?.id ??
    p?.pid ??
    null;

  const patchQueueStatusCache = (maHangDoi, nextStatus) => {
    if (!maHangDoi || !nextStatus) return;

    const patchItem = (item) => {
      if (!item || typeof item !== "object") return item;
      const itemKey = keyOf(item);
      if (String(itemKey || "") !== String(maHangDoi)) return item;
      return {
        ...item,
        TrangThai: nextStatus,
        trangThai: nextStatus,
        status: nextStatus,
      };
    };

    qc.setQueriesData({ queryKey: ["queue"], exact: false }, (old) => {
      if (!old) return old;
      if (Array.isArray(old)) return old.map(patchItem);
      if (Array.isArray(old?.Items)) {
        return {
          ...old,
          Items: old.Items.map(patchItem),
        };
      }
      if (Array.isArray(old?.items)) {
        return {
          ...old,
          items: old.items.map(patchItem),
        };
      }
      if (typeof old === "object") return patchItem(old);
      return old;
    });
  };

  const patchQueueDiagnosisCache = (maHangDoi, nextClinicalStatus) => {
    if (!maHangDoi || !nextClinicalStatus) return;

    const patchItem = (item) => {
      if (!item || typeof item !== "object") return item;
      const itemKey = keyOf(item);
      if (String(itemKey || "") !== String(maHangDoi)) return item;

      return {
        ...item,
        PhieuKhamLs: item?.PhieuKhamLs
          ? { ...item.PhieuKhamLs, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
          : item?.phieuKhamLs
            ? { ...item.phieuKhamLs, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
            : item?.MaPhieuKham || item?.maPhieuKham
              ? { MaPhieuKham: item?.MaPhieuKham || item?.maPhieuKham, TrangThai: nextClinicalStatus }
              : item?.PhieuKhamLs,
        phieuKhamLs: item?.phieuKhamLs
          ? { ...item.phieuKhamLs, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
          : item?.PhieuKhamLs
            ? { ...item.PhieuKhamLs, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
            : item?.phieuKhamLs,
        PhieuKhamLsFull: item?.PhieuKhamLsFull
          ? { ...item.PhieuKhamLsFull, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
          : item?.PhieuKhamLsFull,
        phieuKhamLsFull: item?.phieuKhamLsFull
          ? { ...item.phieuKhamLsFull, TrangThai: nextClinicalStatus, trangThai: nextClinicalStatus }
          : item?.phieuKhamLsFull,
      };
    };

    qc.setQueriesData({ queryKey: ["queue"], exact: false }, (old) => {
      if (!old) return old;
      if (Array.isArray(old)) return old.map(patchItem);
      if (Array.isArray(old?.Items)) {
        return {
          ...old,
          Items: old.Items.map(patchItem),
        };
      }
      if (Array.isArray(old?.items)) {
        return {
          ...old,
          items: old.items.map(patchItem),
        };
      }
      if (typeof old === "object") return patchItem(old);
      return old;
    });
  };
  
  // Chuẩn hóa chữ cái đầu cho nhãn hiển thị (ví dụ: "nam" -> "Nam")
  function titleCase(val) {
    if (typeof val !== "string") return val;
    if (!val.trim()) return val;
    const lower = val.trim().toLowerCase();
    if (lower === "nu" || lower === "nữ") return "Nữ";
    if (lower === "nam") return "Nam";
    if (lower === "khac" || lower === "khác") return "Khác";
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  
  const finishMut = useFinishRemove();
    const orderMut = useCreateExamOrder();
    const dxMut = useCreateDiagnosis({ skipInvalidate: true });
  const createVisitMut = useCreateHistoryVisit();

  // === Cancel visit mutation ===
  const cancelVisitMut = useCancelVisit({
    onSuccess: () => toast.success("Đã hủy lượt khám thành công"),
    onError: (err) => toast.error(err?.response?.data?.Message || err?.message || "Không thể hủy lượt khám"),
  });

  const cancelWaitingClinicalMut = useCancelWaitingClinicalQueue({
    onSuccess: () => toast.success("Đã hủy ca đang chờ thành công"),
    onError: (err) => toast.error(err?.response?.data?.Message || err?.response?.data?.message || err?.message || "Không thể hủy ca đang chờ"),
  });

  // === Cancel CLS mutation ===
  const cancelClsMut = useCancelClsOrder({
    onSuccess: () => toast.success("Đã hủy phiếu Cận lâm sàng thành công"),
    onError: (err) => toast.error(err?.response?.data?.Message || err?.message || "Không thể hủy phiếu CLS"),
  });

  const [active, setActive] = useState(null);
  const [inProgress, setInProgress] = useState(() => new Set());

  // Lấy số theo trạng thái queue
  const waitingCount = useMemo(
    () =>
      patients.filter((p) => (p.TrangThai || p.trangThai || p.status) === "cho_goi").length,
    [patients]
  );

  const inProgressCount = useMemo(
    () =>
      patients.filter((p) => {
        const status = p.TrangThai || p.trangThai || p.status;
        return status === "dang_thuc_hien" || status === "dang_kham";
      }).length,
    [patients]
  );

  const doneCount = useMemo(
    () =>
      patients.filter((p) => (p.TrangThai || p.trangThai || p.status) === "da_phuc_vu").length,
    [patients]
  );

  useEffect(() => {
    let off;
    (async () => {
      off = await subscribeQueue(qc);
    })();
    return () => {
      if (off) off();
    };
  }, [qc]);

  // ✅ Subscribe realtime events for Clinical Exams and Queue
  useEffect(() => {
    // Subscribe Clinical Exam events
    const offClinicalCreated = on('ClinicalExamCreated', (exam) => {
      console.log('[Examination] Phiếu khám mới:', exam);
      qc.invalidateQueries({ queryKey: ['queue'] });
      qc.invalidateQueries({ queryKey: ['examinations'] });
    });
    
    const offClinicalUpdated = on('ClinicalExamUpdated', (exam) => {
      console.log('[Examination] Phiếu khám cập nhật:', exam);
      qc.invalidateQueries({ queryKey: ['queue'] });
      qc.invalidateQueries({ queryKey: ['examinations'] });
    });
    
    // Subscribe Queue events
    const offQueueChanged = on('QueueItemChanged', (item) => {
      console.log('[Examination] Hàng đợi thay đổi:', item);
      qc.invalidateQueries({ queryKey: ['queue'] });
    });
    
    const offQueueByRoom = on('QueueByRoomUpdated', (items) => {
      console.log('[Examination] Hàng đợi phòng cập nhật:', items);
      qc.invalidateQueries({ queryKey: ['queue'] });
    });

    const offFinalDx = on('FinalDiagnosisChanged', () => {
      qc.invalidateQueries({ queryKey: ['queue'], exact: false });
      qc.invalidateQueries({ queryKey: ['examinations'], exact: false });
    });
    
    return () => {
      offClinicalCreated?.();
      offClinicalUpdated?.();
      offQueueChanged?.();
      offQueueByRoom?.();
      offFinalDx?.();
    };
  }, [qc]);

  // ✅ Reset page khi filter thay đổi
  useEffect(() => {
    if (page > 1) setPage(1);
  }, [filter.source, filter.status, filter.kind, filter.search]);

  // ✅ Filter và sort đã được làm ở backend
  // Queue có logic sorting đặc biệt (ưu tiên, appointment time) ở backend
  const filtered = patients;

 

  // Helper để lấy MaNhanSu từ user hiện tại
  function getCurrentUserMaNhanSu() {
    if (typeof window === "undefined") return null;
    
    try {
      const authData = localStorage.getItem("his-auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        const user = parsed?.user;
        if (user) {
          return user.MaNhanSu || user.maNhanSu || user.id || user.userId || null;
        }
      }
      if (window.APP_USER) {
        return window.APP_USER.MaNhanSu || window.APP_USER.maNhanSu || window.APP_USER.id || window.APP_USER.userId || null;
      }
    } catch (err) {
      console.warn("Không thể lấy MaNhanSu:", err);
    }
    return null;
  }

   // Lấy mã hàng đợi ưu tiên MaHangDoi
   const getKey = (p) =>
    p?.MaHangDoi ??
    p?.maHangDoi ??
    p?.queueId ??
    p?.id ??
    p?.pid ??
    null;

  // Khi bấm "Gọi vào":
  // 1) GET /api/queue/{maHangDoi}       (getQueueById – queue.js)
  // 2) POST /api/history/visits         (createHistoryVisit – history.js)
  // 3) ExamDetail sẽ tự gọi /api/master-data/services/overview
  async function handleStart(p) {
    const key = getKey(p);
    if (!key) return;

    const markInProgress = () => {
      setInProgress((prev) => {
        const s = new Set(prev);
        s.add(key);
        return s;
      });
    };

    let mappedPatient = null;
    let createdVisitMaLuot = null;

    // 1) Lay chi tiet hang doi
    let queueItem;
    try {
      queueItem = await getQueueById(key);
    } catch (err) {
      console.error("[Examination] getQueueById error:", err);
      
      // ✅ Xử lý riêng cho lỗi 403 Forbidden
      if (err?.response?.status === 403) {
        toast.error("Bạn không có quyền truy cập hàng đợi này. Vui lòng kiểm tra lịch trực hoặc phòng được phân công.");
        return;
      }
      
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        err?.message ||
        "Không thể lấy thông tin hàng đợi.";
      toast.error(msg);
      return;
    }

    const raw = queueItem?._raw ?? queueItem ?? {};

      // 2) Tạo lượt khám (HistoryVisit)
    const nowIso = new Date().toISOString();
    
    // ✅ Khai báo các biến bên ngoài try-catch để có thể sử dụng sau này
    let maNhanSuThucHien = null;
    let maYTaHoTro = null;
    
    try {
      const queueType = queueItem?.LoaiHangDoi ?? raw.LoaiHangDoi ?? null;
      const isClsQueue = /can_lam_sang|cls/i.test(queueType || "");
      const clsStaffCodeFromList = (() => {
        const list =
          raw?.PhieuKhamClsFull?.ListItemDV ||
          raw?.PhieuKhamCls?.ListItemDV ||
          [];
        if (Array.isArray(list) && list.length) {
          const it = list.find(
            (x) =>
              x.MaKyThuatVienThucHien ||
              x.maKyThuatVienThucHien ||
              x.MaNhanSuThucHien ||
              x.maNhanSuThucHien ||
              x.MaYTaThucHien ||
              x.maYTaThucHien ||
              x.MaNguoiLap ||
              x.NguoiLap
          );
          return (
            it?.MaKyThuatVienThucHien ||
            it?.maKyThuatVienThucHien ||
            it?.MaNhanSuThucHien ||
            it?.maNhanSuThucHien ||
            it?.MaYTaThucHien ||
            it?.maYTaThucHien ||
            it?.MaNguoiLap ||
            it?.NguoiLap ||
            null
          );
        }
        return null;
      })();

      const staffCodeCls =
        (isClsQueue &&
          (raw.MaKyThuatVienThucHien ||
            raw.MaNhanSuThucHien ||
            raw.MaYTaThucHien ||
            raw.MaYTaHoTro ||
            raw.maKyThuatVienThucHien ||
            raw.maNhanSuThucHien ||
            raw.maYTaThucHien ||
            raw.maYTaHoTro ||
            raw.PhieuKhamClsItem?.MaKyThuatVienThucHien ||
            raw.PhieuKhamClsItem?.MaNhanSuThucHien ||
            raw.PhieuKhamClsItem?.MaYTaThucHien ||
            raw.PhieuKhamCls?.MaKyThuatVienThucHien ||
            raw.PhieuKhamCls?.MaNhanSuThucHien ||
            raw.PhieuKhamClsFull?.MaKyThuatVienThucHien ||
            raw.PhieuKhamClsFull?.MaNhanSuThucHien ||
            raw.PhieuKhamClsFull?.MaYTaThucHien ||
            raw.PhieuKhamClsFull?.MaNguoiLap ||
            clsStaffCodeFromList)) ||
        null;

      const maBacSiLs =
        raw.MaBacSiKham ||
        queueItem?.MaBacSi ||
        raw.MaBacSi ||
        null;

      const fallbackStaff = getCurrentUserMaNhanSu();
      // ✅ Gán giá trị cho các biến đã khai báo bên ngoài
      maNhanSuThucHien = isClsQueue
        ? staffCodeCls || fallbackStaff
        : maBacSiLs || fallbackStaff;
      maYTaHoTro = isClsQueue ? staffCodeCls || fallbackStaff : null;
      const maHangDoiForVisit =
        queueItem?.MaHangDoi ?? raw.MaHangDoi ?? key ?? null;
      if (!maHangDoiForVisit) {
    throw new Error("Thiếu MaHangDoi khi tạo lượt khám");
      }

      const visitRes = await createVisitMut.mutateAsync({
        MaHangDoi: maHangDoiForVisit,
        MaNhanSuThucHien: maNhanSuThucHien,
        MaYTaHoTro: maYTaHoTro,
        ThoiGianBatDau: nowIso,
        ThoiGianKetThuc: null,
        LoaiLuot: queueItem?.LoaiHangDoi ?? raw.LoaiHangDoi ?? null,
        TrangThai: "dang_thuc_hien",
      });
      markInProgress();
      patchQueueStatusCache(maHangDoiForVisit, "dang_thuc_hien");
      qc.invalidateQueries({ queryKey: ["queue"], exact: false });
      createdVisitMaLuot =
        visitRes?.MaLuotKham ??
        visitRes?.maLuotKham ??
        visitRes?.MaLuot ??
        visitRes?.maLuot ??
        visitRes?.id ??
        null;
    } catch (err) {
      console.error("[Examination] createHistoryVisit error:", err);
      const msg =
        err?.response?.data?.Message ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.response?.data?.detail ||
        (err?.response?.status === 400
            ? "Dữ liệu tạo lượt không hợp lệ."
          : null) ||
        err?.message ||
          "Không thể tạo lượt khám CLS. Vui lòng thử lại.";
      toast.error(msg);
      return;
    }

    // 3) Map data hang doi -> model patient cho ExamDetail
    const phieuLsFull = raw.PhieuKhamLsFull || null;
    const phieuClsFull = raw.PhieuKhamClsFull || null;
    const phieuClsItem = raw.PhieuKhamClsItem || null;

    let age = null;
    const dob = phieuLsFull?.NgaySinh ?? phieuClsFull?.NgaySinh ?? null;
    if (dob) {
      const d = new Date(dob);
      if (!Number.isNaN(d.getTime())) {
        const today = new Date();
        age =
          today.getFullYear() -
          d.getFullYear() -
          (today.getMonth() < d.getMonth() ||
            (today.getMonth() === d.getMonth() &&
              today.getDate() < d.getDate())
            ? 1
            : 0);
      }
    }

    mappedPatient = {
      ...p,
      queueId: queueItem?.MaHangDoi ?? raw.MaHangDoi ?? key,
      id: queueItem?.MaHangDoi ?? raw.MaHangDoi ?? key,
      TrangThai: "dang_thuc_hien",
      trangThai: "dang_thuc_hien",
      status: "dang_thuc_hien",
      pid: queueItem?.MaBenhNhan ?? raw.MaBenhNhan ?? p?.pid ?? null,
      name:
        phieuLsFull?.HoTen ??
        phieuClsFull?.HoTen ??
        raw.TenBenhNhan ??
        p?.name ??
        "",
      gender: titleCase(
        phieuLsFull?.GioiTinh ??
          phieuClsFull?.GioiTinh ??
          p?.gender ??
          ""
      ),
      age,
      dept:
        raw.TenKhoa ??
        phieuLsFull?.TenKhoa ??
        phieuClsFull?.TenKhoa ??
        p?.dept ??
        "",
      department:
        raw.TenKhoa ??
        phieuLsFull?.TenKhoa ??
        phieuClsFull?.TenKhoa ??
        p?.department ??
        "",
      deptId:
        raw.MaKhoa ??
        phieuLsFull?.MaKhoa ??
        phieuClsFull?.MaKhoa ??
        null,
      room:
        raw.TenPhong ??
        phieuClsItem?.TenPhong ??
        phieuClsFull?.TenPhong ??
        p?.room ??
        "",
      roomId:
        raw.MaPhong ??
        phieuClsItem?.MaPhong ??
        phieuClsFull?.MaPhong ??
        null,
      doctor:
        raw.TenBacSiKham ??
        raw.TenKyThuatVienThucHien ??
        raw.TenNhanSuThucHien ??
        phieuClsItem?.TenKyThuatVienThucHien ??
        phieuClsItem?.TenNhanSuThucHien ??
        phieuClsFull?.TenKyThuatVienThucHien ??
        phieuClsFull?.TenNhanSuThucHien ??
        phieuClsFull?.TenNguoiLap ??
        p?.doctor ??
        "",
      TenKyThuatVienThucHien:
        raw.TenKyThuatVienThucHien ??
        phieuClsItem?.TenKyThuatVienThucHien ??
        phieuClsFull?.TenKyThuatVienThucHien ??
        p?.TenKyThuatVienThucHien ??
        p?.tenKyThuatVienThucHien ??
        null,
      TenNhanSuThucHien:
        raw.TenNhanSuThucHien ??
        phieuClsItem?.TenNhanSuThucHien ??
        phieuClsFull?.TenNhanSuThucHien ??
        p?.TenNhanSuThucHien ??
        p?.tenNhanSuThucHien ??
        null,
      TenNguoiLap:
        raw.TenNguoiLap ??
        phieuClsFull?.TenNguoiLap ??
        p?.TenNguoiLap ??
        p?.tenNguoiLap ??
        null,
      loai_hang_doi:
        raw.LoaiHangDoi ??
        p?.loai_hang_doi ??
        null,
      queueType: raw.LoaiHangDoi ?? p?.queueType ?? null,
      visitType: raw.LoaiHangDoi ?? p?.visitType ?? null,
      nguon: raw.Nguon ?? p?.nguon ?? null,
      source: raw.Nguon ?? p?.source ?? null,
      capCuu: raw.CapCuu ?? p?.capCuu ?? false,
      cap_cuu: raw.CapCuu ?? p?.cap_cuu ?? false,
      note:
        phieuLsFull?.TrieuChung ??
        phieuLsFull?.ThongTinChiTiet ??
        phieuClsFull?.GhiChu ??
        p?.note ??
        "",
      serviceName:
        phieuClsItem?.TenDichVu ??
        (Array.isArray(phieuClsFull?.ListItemDV) &&
          phieuClsFull.ListItemDV[0]?.TenDichVu) ??
        p?.serviceName ??
        "",
      maChiTietDv:
        raw.MaChiTietDv ??
        phieuClsItem?.MaChiTietDv ??
        (Array.isArray(phieuClsFull?.ListItemDV) &&
          phieuClsFull.ListItemDV[0]?.MaChiTietDv) ??
        null,
      maNhanSuThucHien:
        raw.MaKyThuatVienThucHien ??
        raw.MaNhanSuThucHien ??
        phieuClsFull?.MaKyThuatVienThucHien ??
        phieuClsFull?.MaNhanSuThucHien ??
        phieuClsItem?.MaKyThuatVienThucHien ??
        phieuClsItem?.MaNhanSuThucHien ??
        p?.maNhanSuThucHien ??
        null,
      maYTaHoTro:
        raw.MaYTaHoTro ??
        phieuClsFull?.MaYTaHoTro ??
        phieuClsItem?.MaYTaHoTro ??
        p?.maYTaHoTro ??
        null,
      ThoiGianBatDauLuot:
        raw.ThoiGianBatDauLuot ??
        phieuClsItem?.ThoiGianBatDau ??
        phieuClsFull?.ThoiGianBatDau ??
        p?.ThoiGianBatDauLuot ??
        p?.thoiGianBatDauLuot ??
        null,
      ThoiGianKetThucLuot:
        raw.ThoiGianKetThucLuot ??
        phieuClsItem?.ThoiGianKetThuc ??
        phieuClsFull?.ThoiGianKetThuc ??
        p?.ThoiGianKetThucLuot ??
        p?.thoiGianKetThucLuot ??
        null,
      serviceOrder:
        Array.isArray(phieuClsFull?.ListItemDV) &&
        phieuClsFull.ListItemDV.length
          ? {
              items: phieuClsFull.ListItemDV.map(
                (dv) => dv.MaDichVu || dv.MaChiTietDv
              ),
            }
          : p?.serviceOrder,
      MaPhieuKham:
        raw.MaPhieuKham ??
        phieuLsFull?.MaPhieuKham ??
        p?.MaPhieuKham ??
        p?.maPhieuKham ??
        null,
      maPhieuKham:
        raw.MaPhieuKham ??
        phieuLsFull?.MaPhieuKham ??
        p?.maPhieuKham ??
        p?.MaPhieuKham ??
        null,
      MaPhieuKhamLs:
        raw.MaPhieuKham ??
        phieuLsFull?.MaPhieuKham ??
        p?.MaPhieuKhamLs ??
        p?.maPhieuKhamLs ??
        null,
      MaLuotKham:
        raw.MaLuotKham ??
        raw.MaLuot ??
        phieuLsFull?.MaLuotKham ??
        phieuClsFull?.MaLuotKham ??
        p?.MaLuotKham ??
        p?.maLuotKham ??
        p?.MaLuot ??
        p?.maLuot ??
        p?.visitId ??
        createdVisitMaLuot ??
        null,
      visitIdCreated: createdVisitMaLuot ?? p?.visitIdCreated ?? null,
    };

    setActive(mappedPatient);
  }

  function handleBack() {
    setActive(null);
  }

  // Gọi khi LS xuất phiếu khám (chỉ định CLS)
  async function handleExportOrder(patient, orderPayload) {
    const key = getKey(patient);
    if (!key) return;

    const existingClsId =
      patient?.MaPhieuKhamCls ||
      patient?.maPhieuKhamCls ||
      patient?.PhieuKhamCls?.MaPhieuKhamCls ||
      patient?.phieuKhamCls?.MaPhieuKhamCls ||
      null;

      const maPhieuKhamLs =
        orderPayload?.MaPhieuKhamLs ||
        patient?.MaPhieuKhamLs ||
        patient?.maPhieuKhamLs ||
        patient?.MaPhieuKham ||
        patient?.maPhieuKham ||
        null;

    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });

    const payload = {
      MaBenhNhan:
        orderPayload?.MaBenhNhan ??
        patient?.MaBenhNhan ??
        patient?.pid ??
        patient?.id ??
        null,
      MaPhieuKhamLs: maPhieuKhamLs,
      ...orderPayload,
    };

    // Tránh lỗi duplicate khi CLS đã tồn tại cho cùng MaPhieuKhamLs
    if (!existingClsId) {
      try {
        await orderMut.mutateAsync(payload);
      } catch (err) {
        const msg = String(err?.message || err || "");
        const respData =
          err?.response?.data &&
          (typeof err.response.data === "string"
            ? err.response.data
            : JSON.stringify(err.response.data));

        const combined = `${msg} ${respData || ""}`;
        const isDuplicate =
          combined.includes("Duplicate entry") ||
          combined.includes("IX_phieu_kham_can_lam_sang_MaPhieuKhamLs") ||
          combined.includes("MaPhieuKhamLs");

        if (!isDuplicate) throw err;
      }
    }

    qc.invalidateQueries({ queryKey: ["queue"] });

    setActive(null);
  }

  // Gọi khi LS xuất phiếu chẩn đoán hoặc CLS "Hoàn tất CLS"
  async function handleExportDiagnosis(patient, payload) {
    const key = getKey(patient);
    if (!key) return;
    const nowIso = new Date().toISOString();
    const maPhieuKham =
      patient?.MaPhieuKham ||
      patient?.maPhieuKham ||
      patient?.MaPhieuKhamLs ||
      patient?.maPhieuKhamLs ||
      null;
    if (!maPhieuKham) return;

    const donThuoc =
      (payload?.rxRows || []).map((r) => {
        const qty = Number.parseInt(String(r.qty || 0), 10) || 0;
        const price = Number(r.price || 0) || 0;
        return {
          MaThuoc: r.code,
          SoLuong: qty,
          ChiDinhSuDung: r.dose || "",
          ThanhTien: price * qty,
        };
      }) || [];

    const flags = payload?.dx?.flags || {};
    const huongXuTriArr = [];
    if (flags.choVe) huongXuTriArr.push("Cho về");
    if (flags.choThuocVe) huongXuTriArr.push("Cho thuốc về");
    if (flags.taiKham) huongXuTriArr.push("Tái khám");
    const huongXuTri =
      huongXuTriArr.join("; ") || payload?.dx?.plan || payload?.dx?.advice || "";

    // ✅ Validation: Nếu tick "Cho thuốc về" thì phải có đơn thuốc
    if (flags.choThuocVe && donThuoc.length === 0) {
      toast.error("Vui lòng kê đơn thuốc trước khi chọn 'Cho thuốc về'");
      return;
    }

    if (!flags.choThuocVe && donThuoc.length > 0) {
      toast.error("Chỉ được kê thuốc khi hướng xử trí có 'Cho thuốc về'.");
      return;
    }

    // ✅ Flow chuẩn: lưu chẩn đoán, kết thúc ca ở màn khám,
    // sau đó chuyển bệnh nhân sang bước xử lý/phát thuốc/thanh toán nếu còn.
    const finalPayload = {
      MaPhieuKham: maPhieuKham,
      // Không truyền MaLuotKham/MaHangDoi ở FE.
      // Backend tự chốt trạng thái lượt khám + hàng đợi của ca hiện tại.
      MaDonThuoc: null,
      MaBacSiKeDon:
        patient?.MaNguoiLap ||
        patient?.maNguoiLap ||
        patient?.MaBacSiKham ||
        patient?.maBacSiKham ||
        null,
      ChanDoanSoBo: payload?.dx?.pre || "",
      ChanDoanCuoi: payload?.dx?.final || "",
      NoiDungKham: payload?.dx?.note || "",
      HuongXuTri: huongXuTri,
      LoiKhuyen: payload?.dx?.advice || "",
      PhatDoDieuTri: payload?.dx?.plan || "",
      DonThuoc: donThuoc.length > 0 ? donThuoc : undefined,  // ✅ Chỉ gửi nếu có thuốc
    };

    await dxMut.mutateAsync(finalPayload);
    patchQueueStatusCache(key, "da_phuc_vu");
    patchQueueDiagnosisCache(key, "da_lap_chan_doan");
    // dxMut dùng skipInvalidate — ClinicalExamUpdated trên SignalR chỉ tới BS được gán + nhóm phòng,
    // nên luôn refetch hàng đợi sau khi lưu chẩn đoán để PatientTable có PhieuKhamLs.TrangThai mới (vd. da_lap_chan_doan).
    await qc.invalidateQueries({ queryKey: ["queue"], exact: false });
    await qc.invalidateQueries({ queryKey: ["examinations"], exact: false });
    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });
    setActive(null);
  }

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="px-4 pb-3 pt-1 min-h-0 overflow-hidden"
      role="main"
      aria-label="Khám bệnh - Hàng chờ"
    >
      <div
        className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}
      >
        {!active && (
          <ExamToolbar
            todayCount={totalItems}
            waitingCount={waitingCount}
            inProgressCount={inProgressCount}
            doneCount={doneCount}
            onOpenFilter={() => setFilterOpen(true)}
            onReset={() => {
              setFilter({ source: "all", kind: defaultKind, status: "all", search: "" });
            }}
          />
        )}

        <div className="mt-2 flex-1 min-h-0">
          <AnimatePresence mode="wait">
            {active ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="h-full min-h-0"
              >
                <ExamDetail
                  patient={active}
                  onBack={handleBack}
                  onExportOrder={handleExportOrder}
                  onExportDiagnosis={handleExportDiagnosis}
                />
              </motion.div>
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="h-full min-h-0 flex flex-col"
              >
                <div className="card flex-1 min-h-0 flex flex-col overflow-hidden">
                  <div className="flex-1 min-h-0 overflow-auto scrollbar-none">
                    <PatientTable
                      items={filtered}
                      onStart={canCall ? handleStart : undefined}
                      onCancelVisit={
                        canCancelVisitAction
                          ? (maLuot) => cancelVisitMut.mutate(maLuot)
                          : undefined
                      }
                      onCancelWaitingClinical={
                        canCancelVisitAction
                          ? (maHangDoi) => cancelWaitingClinicalMut.mutate(maHangDoi)
                          : undefined
                      }
                      onCancelClsOrder={
                        canCancelClsAction
                          ? (maPhieuCls) => cancelClsMut.mutate(maPhieuCls)
                          : undefined
                      }
                      inProgress={inProgress}
                      stretch
                    />
                  </div>
                  
                  {/* Pagination */}
                  {totalItems > 0 && (
                    <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
                      <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        totalItems={totalItems}
                        pageSize={50}
                        onPageChange={setPage}
                        showWhenSinglePage
                        className="px-3 py-2"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Popover lọc (search + nguồn + loại lượt) */}
        <QueueFilterPopover
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          values={filter}
          setValues={setFilter}
          lockedKind={lockedKind}
          onReset={() =>
            setFilter({ source: "all", kind: defaultKind, status: "all", search: "" })
          }
        />
      </div>
    </motion.main>
  );
}
