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
import { useQueryClient } from "@tanstack/react-query";
import { APPT_STATUS, searchAppointmentsRaw } from "../api/appointments";
import { searchClinicalRaw, getFinalDiagnosis } from "../api/examination";

import { useUIStore, useExamStore } from "../components/stores/appStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";
import { toast } from "react-toastify";

// Lấy chuỗi yyyy-MM-dd của hôm nay
const todayStr = () => {
  try {
    const d = new Date();
    return d.toISOString().slice(0, 10);
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


export default function Patients() {
  useViewportVH();

  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");

  const topbar = isMobile ? 64 : isTablet ? 72 : 80;

  const nav = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

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
  const clearHighlight = useUIStore((s) => s.clearHighlight);
  const setHighlightPid = useUIStore((s) => s.setHighlightPid);

  const flashAddAt = useUIStore((s) => s.flashAddAt);
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

  const [processPrefill, setProcessPrefill] = useState(null);


  // ✅ Phân trang
  const [page, setPage] = useState(1);

  // === Tải danh sách từ API (server đã lọc theo keyword nếu backend hỗ trợ)
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
      });

  const items = result.Items || [];
  const totalItems = result.TotalItems || 0;
  const totalPages = Math.ceil(totalItems / 50);

  // ✅ Reset page khi filter hoặc viewMode thay đổi
  useEffect(() => {
    if (page > 1) setPage(1);
  }, [filter.keyword, filter.todayStatus, filter.accountStatus, viewMode]);

  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updatePatient } = useUpdatePatient();
  const { mutateAsync: updatePatientStatus } = useUpdatePatientStatus();
  const qc = useQueryClient();
  // Map to suppress duplicate success toasts for the same patient
  const suppressedStatusToast = React.useRef(new Map());


  // === Auto clear highlight sau 5s
  useEffect(() => {
    if (!highlightPid) return;
    const t = setTimeout(() => clearHighlight(), 5000);
    return () => clearTimeout(t);
  }, [highlightPid, clearHighlight]);

  // === Khi highlight xuất hiện -> call API search appointments đã check-in
  useEffect(() => {
    if (!highlightPid) return;

    (async () => {
      try {
        // Call API search appointments với MaBenhNhan + TrangThai "da_checkin"
        const appts = await searchAppointmentsRaw({
          MaBenhNhan: highlightPid,
          TrangThai: APPT_STATUS.DA_CHECKIN,
        });

        if (Array.isArray(appts) && appts.length > 0) {
          // Lấy lịch hẹn mới nhất
          const latest = pickLatestAppointment(appts);
          
          // Lưu vào store patientPrefill
          const currentPrefill = useUIStore.getState().patientPrefill;
          setPatientPrefill({
            ...(currentPrefill || {}),
            code: highlightPid,
            maBenhNhan: highlightPid,
            latestAppointment: latest || null,
          });
        }
      } catch (err) {
        console.error("Không lấy được lịch hẹn đã check-in khi highlight:", err);
        toast.error("Không thể tải thông tin lịch hẹn. Vui lòng thử lại.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightPid]);

  // === Flash nút + Thêm khi có flashAddAt
  useEffect(() => {
    if (!flashAddAt) return;

    // Hiệu ứng flash nút + Thêm
    const btn = document.getElementById("patients-add-btn");
    if (btn) {
      try {
        btn.focus();
      } catch {}
      btn.classList.add("flash-once");
      toast.info("Vui lòng thêm bệnh nhân mới từ lịch hẹn đã check-in.");
      const t = setTimeout(() => {
        btn.classList.remove("flash-once");
        ackFlashAdd();
      }, 5000);
      return () => {
        clearTimeout(t);
        try {
          btn.classList.remove("flash-once");
        } catch {}
      };
    } else {
      ackFlashAdd();
    }
  }, [flashAddAt, ackFlashAdd]);

  // === Khi có flashAddAt -> call API searchAppointmentsRaw với LoaiHen "kham_moi" + TrangThai "da_checkin"
  useEffect(() => {
    if (!flashAddAt) return;

    (async () => {
      try {
        // Call API search appointments với LoaiHen "kham_moi" + TrangThai "da_checkin"
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
            toast.info("Đã tải thông tin bệnh nhân từ lịch hẹn đã check-in.");
          }
        }
      } catch (err) {
        console.error("Không lấy được lịch hẹn đã check-in khi flash add:", err);
        toast.warn("Không thể tải thông tin từ lịch hẹn. Vui lòng nhập thủ công.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flashAddAt]);
  

  // Clear prefill khi rời trang
  useEffect(() => {
    const onBeforeUnload = () => clearPatientPrefill();
    window.addEventListener("pagehide", onBeforeUnload);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("pagehide", onBeforeUnload);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [clearPatientPrefill]);

  // ✅ Với phân trang, filter đã được làm ở BE (status, accountStatus, keyword, todayOnly)
  // Chỉ cần sort ở FE
  const filtered = useMemo(() => {
    let arr = Array.isArray(items) ? items.slice() : [];

    // ✅ Bỏ filter ở FE vì đã được filter ở BE:
    // - accountStatus: đã filter ở BE (line 189-190)
    // - todayStatus: đã filter ở BE (line 187)
    // - keyword: đã filter ở BE (line 185)
    // - todayOnly: đã filter ở BE (line 192)

    // Sort
    const normName = (p) =>
      (p.name || p.ho_ten || "").toString().toLowerCase().trim();

    const priorityScore = (p) => {
      const s = normStatusCode(p);
      if (s === STATUSES.WAIT_INTAKE || s === STATUSES.WAIT_INTAKE_SVC) {
        return 50;
      }
      if (s === STATUSES.WAIT_EXAM || s === STATUSES.WAIT_EXAM_SVC) {
        return 40;
      }
      if (s === STATUSES.WAIT_PROC || s === STATUSES.WAIT_PROC_SVC) {
        return 30;
      }
      if (s === STATUSES.IN_EXAM || s === STATUSES.IN_EXAM_SVC) {
        return 20;
      }
      if (s === STATUSES.DONE || s === STATUSES.DONE_EXAM) {
        return 10;
      }
      if (s === STATUSES.CANCELLED) {
        return 0;
      }
      return 5;
    };

    if (sort === "name") {
      arr.sort((a, b) => normName(a).localeCompare(normName(b), "vi"));
    } else if (sort === "date") {
      arr.sort((a, b) => {
        const da = normStatusDate(a) || "";
        const db = normStatusDate(b) || "";
        return String(db).localeCompare(String(da));
      });
    } else {
      arr.sort((a, b) => priorityScore(b) - priorityScore(a));
    }

    return arr;
  }, [items, sort]); // ✅ Chỉ phụ thuộc vào items và sort (filter đã làm ở BE)

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
        const today = todayStr();

        // 1. Search lịch hẹn đã check-in mới nhất hôm nay
        try {
          const appts = await searchAppointmentsRaw({
            MaBenhNhan: pid,
            TrangThai: APPT_STATUS.DA_CHECKIN,
            FromDate: today,
            ToDate: today,
          });

          if (Array.isArray(appts) && appts.length > 0) {
            const latest = pickLatestAppointment(appts);
            setExamPrefillAppointment(latest || null);
          } else {
            setExamPrefillAppointment(null);
          }
        } catch (err) {
          console.warn("[Patients] searchAppointmentsRaw check-in error:", err);
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
          toast.warn("Không thể tải thông tin phiếu khám. Modal vẫn sẽ mở, bạn có thể tải lại sau.");
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
          onAdd={() => {
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
          }}
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
            toast.info("Đã đặt lại bộ lọc về mặc định.");
          }}
          sort={sort}
          onChangeSort={setSort}
          filterBtnRef={filterBtnRef}
        />

        <div className="card mt-0 flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-hidden">
            <PatientsTable
              items={filtered}
              onAction={handleAction}
              stretch
              highlightPid={highlightPid}
            />
          </div>
          {totalPages > 1 && (
            <div className="flex-shrink-0 border-t border-slate-200 bg-white rounded-b-2xl">
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                pageSize={50}
                onPageChange={setPage}
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

              // Nếu modal là Add thì clear prefill sau khi tạo thành công
              if (wasAddMode) {
                clearPatientPrefill();
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
                     onMutatePatient={async (id, next) => {
                      const pid = id || modal?.patient?.id || modal?.patient?.pid;
                      if (!pid) return;
                    
                      // Cho phép:
                      // - onMutatePatient(pid, "wait_exam")
                      // - onMutatePatient(pid, { status: STATUSES.WAIT_EXAM, ... })
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
                    
                      if (!payload || !payload.status) return;
                     
                      try {
                        await updatePatientStatus({
                          id: pid,
                          ...payload,
                        });
                        // Avoid duplicate toast if an info-update just occurred for the same pid
                        const ts = suppressedStatusToast.current.get(pid);
                        const now = Date.now();
                        if (ts && now - ts < 3000) {
                          // suppress this status-toast and remove the marker
                          suppressedStatusToast.current.delete(pid);
                        } else {
                          toast.success("Đã cập nhật trạng thái bệnh nhân thành công.");
                        }
                      } catch (err) {
                        const msg =
                          err?.response?.data?.message ||
                          err?.message ||
                          "Không thể cập nhật trạng thái. Vui lòng thử lại.";
                        toast.error(msg);
                        throw err;
                      }
                    }}
                    
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
