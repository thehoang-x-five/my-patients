import React, { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

import ExamToolbar from "../components/exam/ExamToolbar.jsx";
import PatientTable from "../components/exam/PatientTable.jsx";
import ExamDetail from "../components/exam/ExamDetail.jsx";
import QueueFilterPopover from "../components/exam/QueueFilterPopover.jsx";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

import {
  useQueueToday,
  useStartExam,
  useFinishRemove,
  subscribeQueue,
  getQueueById,
} from "../api/queue.js";

import {
  useCreateExamOrder,
  useCreateDiagnosis,
  getServicesOverview,
} from "../api/examination.js";
import { useCreateHistoryVisit, createHistoryVisit } from "../api/history.js";
import { useQueryClient } from "@tanstack/react-query";

export default function Examination() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const qc = useQueryClient();
  const { data: queueData } = useQueueToday();
 
  const patients = Array.isArray(queueData?.items) ? queueData.items : [];
  
  const startMut = useStartExam();
  const finishMut = useFinishRemove();
  const orderMut = useCreateExamOrder();
  const dxMut = useCreateDiagnosis();
  const createVisitMut = useCreateHistoryVisit();

  const [active, setActive] = useState(null);
  const [inProgress, setInProgress] = useState(() => new Set());

  // Filter theo nguồn (walkin / appointment / service_return) + loại lượt (ls / cls) + search
  const [filter, setFilter] = useState({
    source: "all",
    kind: "all",
    search: "",
  });
  const [filterOpen, setFilterOpen] = useState(false);

  // Lấy số đang chờ và đang khám từ BE (TrangThai) cho chuẩn
  const waitingCount = useMemo(
    () => patients.filter((p) => (p.TrangThai || p.trangThai || p.status) === "cho_goi").length,
    [patients]
  );

  const inProgressCount = useMemo(
    () => patients.filter((p) => (p.TrangThai || p.trangThai || p.status) === "dang_thuc_hien" || (p.TrangThai || p.trangThai || p.status) === "dang_kham").length,
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
    const { source, kind, search } = filter;

    if (source !== "all") {
      arr = arr.filter(
        (p) => (p.Nguon || p.nguon || p.source || "walkin") === source
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

    return arr;
  }, [patients, filter]);

  const getKey = (p) => p?.MaHangDoi ?? p?.maHangDoi ?? p?.id ?? p?.queueId ?? p?.pid;

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

  async function handleStart(p) {
    const key = getKey(p);
    if (!key) return;

    // Lấy thông tin từ queue item
    const maHangDoi = p.MaHangDoi || p.maHangDoi || key;
    const maNhanSuThucHien = getCurrentUserMaNhanSu();
    const loaiHangDoi = p.LoaiHangDoi || p.loaiHangDoi || p.queueType || p.visitType;
    const maPhong = p.MaPhong || p.maPhong || null;

    // Map LoaiHangDoi sang LoaiLuot
    let loaiLuot = null;
    if (loaiHangDoi === "can_lam_sang" || loaiHangDoi === "cls") {
      loaiLuot = "kham_dich_vu";
    } else {
      loaiLuot = "kham_moi"; // hoặc có thể lấy từ p.LoaiLuot nếu có
    }

    const now = new Date();
    const thoiGianBatDau = now.toISOString();

    try {
      // 1. Gọi API /api/queue/{maHangDoi} để fill thông tin
      const queueData = await getQueueById(maHangDoi);
      console.log("Queue data:", queueData);

      // 2. Gọi API /api/history/visits để tạo lượt khám
      const visitResult = await createHistoryVisit({
        MaHangDoi: maHangDoi,
        MaNhanSuThucHien: maNhanSuThucHien,
        MaYTaHoTro: null, // Có thể thêm sau nếu cần
        ThoiGianBatDau: thoiGianBatDau,
        ThoiGianKetThuc: null, // Sẽ cập nhật khi kết thúc
        LoaiLuot: loaiLuot,
        TrangThai: "dang_thuc_hien",
      });
      console.log("Visit created:", visitResult);

      // 3. Gọi API /api/master-data/services/overview để lấy danh sách dịch vụ
      const servicesData = await getServicesOverview({ maPhong });
      console.log("Services overview:", servicesData);

      // Cập nhật patient data với thông tin từ queue API
      const updatedPatient = {
        ...p,
        ...queueData,
        servicesOverview: servicesData,
      };

      setInProgress((prev) => {
        const s = new Set(prev);
        s.add(key);
        return s;
      });
      setActive(updatedPatient);
    } catch (err) {
      console.error("Lỗi khi gọi các API:", err);
      // Vẫn tiếp tục với flow bình thường nếu lỗi
      setInProgress((prev) => {
        const s = new Set(prev);
        s.add(key);
        return s;
      });
      setActive(p);
    }
  }

  function handleBack() {
    setActive(null);
  }

  // Gọi khi LS xuất phiếu khám (chỉ định CLS)
  async function handleExportOrder(patient, payload) {
    const key = getKey(patient);
    if (!key) return;

    await finishMut.mutateAsync(key);
    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });

    const pid = patient?.pid || patient?.id;

    await orderMut.mutateAsync({
      pid,
      services: (payload?.orderRows || []).map((r) => ({
        id: r.id,
        note: r.note,
      })),
      note: (payload?.orderRows || [])
        .map((r) => r.note)
        .filter(Boolean)
        .join("; "),
      fromDoctor: patient?.doctor || "Bác sĩ phụ trách",
    });

   

    setActive(null);
  }

  // Gọi khi LS xuất phiếu chẩn đoán hoặc CLS "Hoàn tất CLS"
  async function handleExportDiagnosis(patient, payload) {
    const key = getKey(patient);
    if (!key) return;

    await finishMut.mutateAsync(key);
    setInProgress((prev) => {
      const s = new Set(prev);
      s.delete(key);
      return s;
    });

    const pid = patient?.pid || patient?.id;

    await dxMut.mutateAsync({
      pid,
      dx: payload?.dx || {},
      rx: payload?.rxRows || [],
      services:
        payload?.services || (payload?.orderRows || []).map((r) => r.id),
        files: payload?.files,
      result: payload?.result,
      note: payload?.note,
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
            onOpenFilter={() => setFilterOpen(true)}
            onReset={() => {
              // reset giống Patients: xóa search + đưa filter về mặc định
              setFilter({ source: "all", kind: "all", search: "" });
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
