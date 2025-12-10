import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import QueueFilterPopover from "../components/exam/QueueFilterPopover.jsx";
import { toast } from "react-toastify";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

import {
  useQueueToday,
  useFinishRemove,
  subscribeQueue,
  getQueueById,
  rememberQueueAwaitingReturn,
} from "../api/queue.js";

import {
  useCreateExamOrder,
  useCreateDiagnosis,
} from "../api/examination.js";
import { useCreateHistoryVisit } from "../api/history.js";
import { useQueryClient } from "@tanstack/react-query";

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
  const { data: queueData } = useQueueToday();

  const patients = Array.isArray(queueData?.items) ? queueData.items : [];

  const keyOf = (p) =>
    p?.MaHangDoi ??
    p?.maHangDoi ??
    p?.queueId ??
    p?.id ??
    p?.pid ??
    null;
  
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

  const [active, setActive] = useState(null);
  const [inProgress, setInProgress] = useState(() => new Set());

  // Filter theo nguồn (walkin / appointment / service_return) + loại lượt (ls / cls) + search
  const [filter, setFilter] = useState({
    source: "all",
    kind: "all",
    search: "",
    status: "all",
  });
  const [filterOpen, setFilterOpen] = useState(false);

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

  const filtered = useMemo(() => {
    let arr = [...patients];
    const { source, kind, search, status } = filter;

    if (source !== "all") {
      arr = arr.filter(
        (p) => (p.Nguon || p.nguon || p.source || "walkin") === source
      );
    }

    if (status !== "all") {
      arr = arr.filter(
        (p) => (p.TrangThai || p.trangThai || p.status) === status
      );
    }

    if (kind !== "all") {
      arr = arr.filter((p) => {
        const qt = p.LoaiHangDoi || p.loaiHangDoi || p.queueType || p.visitType;
        const isCLS = qt === "can_lam_sang" || qt === "cls";
        return kind === "cls" ? isCLS : !isCLS;
      });
    }

    const term = (search || "").trim().toLowerCase();
    if (term) {
      arr = arr.filter((p) => {
        const bag = [p.name, p.pid, p.id, p.doctor, p.dept, p.phone]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return bag.includes(term);
      });
    }

    // Sắp xếp theo trạng thái: chờ -> đang thực hiện -> đã phục vụ -> khác
    const order = { cho_goi: 0, dang_thuc_hien: 1, dang_kham: 1, da_phuc_vu: 2 };
    arr.sort((a, b) => {
      const sa = order[a.TrangThai || a.trangThai || a.status] ?? 99;
      const sb = order[b.TrangThai || b.trangThai || b.status] ?? 99;
      return sa - sb;
    });

    return arr;
  }, [patients, filter]);

 

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

    // đánh dấu đang khám
    setInProgress((prev) => {
      const s = new Set(prev);
      s.add(key);
      return s;
    });

    let mappedPatient = null;
    let createdVisitMaLuot = null;
    try {
      // 1) Lấy chi tiết hàng đợi
      const queueItem = await getQueueById(key);
      const raw = queueItem?._raw ?? queueItem ?? {};

      // 2) Tạo lượt khám (HistoryVisit)
      const nowIso = new Date().toISOString();
      try {
            // >>>>>>>>>>>>> BỔ SUNG CHỖ NÀY <<<<<<<<<<<<<<
    // Lấy mã phòng và mã bác sĩ từ hàng chờ
    const maPhong =
    queueItem?.MaPhong ??
    raw.MaPhong ??
    raw.PhieuKhamLsFull?.MaPhong ??
    raw.PhieuKhamClsFull?.MaPhong ??
    null;

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
          x.MaYTaThucHien ||
          x.maYTaThucHien ||
          x.MaNguoiLap ||
          x.NguoiLap
      );
      return (
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
      (raw.MaYTaThucHien ||
        raw.MaNhanSuThucHien ||
        raw.MaYTaHoTro ||
        raw.maYTaThucHien ||
        raw.maNhanSuThucHien ||
        raw.maYTaHoTro ||
        raw.PhieuKhamClsItem?.MaYTaThucHien ||
        raw.PhieuKhamClsFull?.MaYTaThucHien ||
        raw.PhieuKhamClsFull?.MaNguoiLap ||
        clsStaffCodeFromList)) ||
    null;

  const maBacSiLs =
    raw.MaBacSiKham ?? // từ queue DTO LS
    queueItem?.MaBacSi ?? // nếu BE có map sẵn
    raw.MaBacSi ?? // fallback
    null;

  const fallbackStaff = getCurrentUserMaNhanSu();
  const maNhanSuThucHien = isClsQueue
    ? staffCodeCls || fallbackStaff
    : maBacSiLs || fallbackStaff;
  const maYTaHoTro = isClsQueue ? staffCodeCls || fallbackStaff : null;
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
      }

      // 3) Map data hàng đợi -> model patient cho ExamDetail
      const phieuLsFull = raw.PhieuKhamLsFull || null;
      const phieuClsFull = raw.PhieuKhamClsFull || null;
      const phieuClsItem = raw.PhieuKhamClsItem || null;

      // tuổi (nếu có NgaySinh)
      let age = null;
      const dob =
        phieuLsFull?.NgaySinh ??
        phieuClsFull?.NgaySinh ??
        null;
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
        // id / queueId dùng chung MaHangDoi
        queueId: queueItem?.MaHangDoi ?? raw.MaHangDoi ?? key,
        id: queueItem?.MaHangDoi ?? raw.MaHangDoi ?? key,

        // mã + tên + giới tính
        pid:
          queueItem?.MaBenhNhan ??
          raw.MaBenhNhan ??
          p?.pid ??
          null,
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

        // khoa / phòng / bác sĩ
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
          phieuClsFull?.TenNguoiLap ??
          p?.doctor ??
          "",

        // loại hàng đợi / loại lượt / nguồn
        loai_hang_doi:
          raw.LoaiHangDoi ??
          p?.loai_hang_doi ??
          null,
        queueType:
          raw.LoaiHangDoi ??
          p?.queueType ??
          null,
        visitType:
          raw.LoaiHangDoi ??
          p?.visitType ??
          null,
        nguon:
          raw.Nguon ??
          p?.nguon ??
          null,
        source:
          raw.Nguon ??
          p?.source ??
          null,

        // cấp cứu
        capCuu:
          raw.CapCuu ??
          p?.capCuu ??
          false,
        cap_cuu:
          raw.CapCuu ??
          p?.cap_cuu ??
          false,

        // ghi chú / triệu chứng
        note:
          phieuLsFull?.TrieuChung ??
          phieuLsFull?.ThongTinChiTiet ??
          phieuClsFull?.GhiChu ??
          p?.note ??
          "",

        // tên dịch vụ CLS (nếu là hàng CLS)
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
        maNhanSuThucHien: maNhanSuThucHien,
        maYTaHoTro: maYTaHoTro,

        // danh sách DV CLS để ExamDetail dùng nếu cần
        serviceOrder:
          Array.isArray(phieuClsFull?.ListItemDV) &&
          phieuClsFull.ListItemDV.length
            ? {
                items: phieuClsFull.ListItemDV.map(
                  (dv) => dv.MaDichVu || dv.MaChiTietDv
                ),
              }
            : p?.serviceOrder,

        // Mã phiếu khám LS (bắt buộc cho tạo CLS)
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
          p?.visitId ??
          createdVisitMaLuot ??
          null,
        visitIdCreated: createdVisitMaLuot ?? p?.visitIdCreated ?? null,
      };

      // đẩy vào ExamDetail
      setActive(mappedPatient);
    } catch (err) {
      console.error("[Examination] handleStart error:", err);
      // giữ lại data đã map được; fallback tối thiểu là p
      setActive(mappedPatient || p);
    }
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

    const finalPayload = {
      MaPhieuKham: maPhieuKham,
      MaLuotKham:
        patient?.MaLuotKham ||
        patient?.maLuotKham ||
        patient?.MaLuot ||
        patient?.maLuot ||
        patient?.visitId ||
        patient?.visitIdCreated ||
        null,
      MaHangDoi:
        patient?.MaHangDoi ||
        patient?.maHangDoi ||
        patient?.queueId ||
        patient?.id ||
        null,
      TrangThaiLuot: "hoan_tat",
      ThoiGianKetThuc: nowIso,
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
      DonThuoc: donThuoc,
    };

    await dxMut.mutateAsync(finalPayload);
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
            todayCount={patients.length}
            waitingCount={waitingCount}
            inProgressCount={inProgressCount}
            doneCount={doneCount}
            onOpenFilter={() => setFilterOpen(true)}
            onReset={() => {
              setFilter({ source: "all", kind: "all", status: "all", search: "" });
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
                className="h-full min-h-0"
              >
                <PatientTable
                  items={filtered}
                  onStart={handleStart}
                  inProgress={inProgress}
                  stretch
                />
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
        />
      </div>
    </motion.main>
  );
}
