import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PatientsToolbar from "../components/patients/PatientsToolbar.jsx";
import PatientsTable from "../components/patients/PatientsTable.jsx";
import PatientsFilterPopover from "../components/patients/PatientsFilterPopover.jsx";
import PatientModal from "../components/patients/PatientModal.jsx";

import {
  usePatientsList,
  useCreatePatient,
  useUpdatePatient,
  useUpdatePatientStatus,
  usePatientDetail,
  
  STATUSES,
} from "../api/patients";
import { APPT_STATUS, searchAppointmentsRaw } from "../api/appointments";
import { searchClinicalRaw, getFinalDiagnosis } from "../api/examination";

import { useUIStore, useExamStore } from "../components/stores/appStore.js";

import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

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


  // === Tải danh sách từ API (server đã lọc theo keyword nếu backend hỗ trợ)
  const { data: items = [] } = usePatientsList({
        keyword: filter.keyword || undefined,
        // mã TrangThaiHomNay theo API (cho_kham, cho_tiep_nhan, ...)
        status: filter.todayStatus === "all" ? undefined : filter.todayStatus,
        // trạng thái tài khoản: hoat_dong | khong_hoat_dong | da_xoa
        accountStatus:
          filter.accountStatus === "all" ? undefined : filter.accountStatus,
        // map sang OnlyToday trong PatientSearchFilter
        todayOnly: viewMode === "today",
      });

  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updatePatient } = useUpdatePatient();
  const { mutateAsync: updatePatientStatus } = useUpdatePatientStatus();

  // === Query → tự mở modal
  useEffect(() => {
    const pid = sp.get("pid");
    const action = sp.get("action");
    const defaultCode = sp.get("defaultCode") || "";
    const defaultName = sp.get("defaultName") || "";
    const focus = sp.get("focus") === "true";

    if (pid && focus) {
      const p = items.find((x) => x.id === pid || x.pid === pid);
      if (p) {
        setModal({
          open: true,
          mode: "view",
          patient: p,
        });
      }
    } else if (action === "add") {
      setModal({
        open: true,
        mode: "add",
        patient: {
          id: defaultCode || "",
          name: defaultName || "",
          status: STATUSES.WAIT_INTAKE,
        },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, items]);

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

  // === Lọc FE theo ERD
  const filtered = useMemo(() => {
    let arr = Array.isArray(items) ? items.slice() : [];

    // lọc theo trạng thái tài khoản
    if (filter.accountStatus && filter.accountStatus !== "all") {
      const tgt = String(filter.accountStatus).toLowerCase();
      arr = arr.filter((p) => {
        const code = String(
          p.trang_thai_tai_khoan || p.accountStatus || "hoat_dong"
        ).toLowerCase();
        return code === tgt;
      });
    }

    // lọc theo trạng thái hôm nay (TrangThaiHomNay)
    if (filter.todayStatus && filter.todayStatus !== "all") {
      arr = arr.filter(
        (p) =>
          normStatusCode(p).toLowerCase() ===
          filter.todayStatus.toLowerCase()
      );
    }

    // viewMode: chỉ lấy những BN có NgayTrangThai == hôm nay
    if (viewMode === "today") {
      const t = todayStr();
      arr = arr.filter((p) => {
        const d = normStatusDate(p);
        return d ? String(d).slice(0, 10) === t : false;
      });
    }

    // keyword (fallback ở FE nếu BE chưa lọc)
    const kw = (filter.keyword || "").trim().toLowerCase();
    if (kw) {
      arr = arr.filter((p) => {
        const bag = [
          p?.id,
          p?.pid,
          p?.name,
          p?.ho_ten,
          p?.phone,
          p?.dien_thoai,
          p?.email,
        ].map((x) => String(x || "").toLowerCase());
        return bag.some((s) => s.includes(kw));
      });
    }

    // sort
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
  }, [items, filter, viewMode, sort]);

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

      if (pid) {
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
          console.error("Không lấy được lịch hẹn đã check-in:", err);
        }

        // 2. Search phiếu khám LS đang thực hiện (dang_thuc_hien)
        try {
          const clinicalList = await searchClinicalRaw({
            MaBenhNhan: pid,
            TrangThai: "dang_thuc_hien",
          });

          if (Array.isArray(clinicalList) && clinicalList.length > 0) {
            // lưu nguyên list, tab Phiếu sau này sẽ tự xử lý
            setExamCurrentClinical(clinicalList);
          } else {
            setExamCurrentClinical(null);
          }
        } catch (err) {
          console.error("Không lấy được phiếu khám đang thực hiện:", err);
        }
      }

      return;
    }
    // ===== XỬ LÝ & CHẨN ĐOÁN =====
    if (type === "process") {
      // Mở modal xử lý & chẩn đoán
      setModal({ open: true, mode: "process", patient: p });

      if (pid) {
        // Tìm phiếu khám từ MaBenhNhan để lấy maPhieuKham và gọi getFinalDiagnosis
        // Modal sẽ tự fetch dữ liệu khi cần
        try {
          // Tìm phiếu khám đang thực hiện hoặc mới nhất
          const clinicalList = await searchClinicalRaw({
            MaBenhNhan: pid,
            TrangThai: "dang_thuc_hien",
          });

          if (Array.isArray(clinicalList) && clinicalList.length > 0) {
            // Lấy phiếu khám đầu tiên (đang thực hiện)
            const latestClinical = clinicalList[0];
            const maPhieuKham = 
              latestClinical?.MaPhieuKham ||
              latestClinical?.maPhieuKham ||
              latestClinical?.id ||
              null;

            if (maPhieuKham) {
              // Call GET /api/clinical/{maPhieuKham}/final-diagnosis
              // Modal sẽ tự xử lý khi cần
              try {
                await getFinalDiagnosis(maPhieuKham);
              } catch (err) {
                console.error("Không lấy được chẩn đoán cuối:", err);
              }
            }
          }
        } catch (err) {
          console.error("Lỗi khi tìm phiếu khám để lấy chẩn đoán:", err);
        }
      }

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
            const latest = patientPrefill?.latestAppointment;
        
            setModal({
              open: true,
              mode: "add",
              patient: {
                // ID/Mã bệnh nhân từ prefill hoặc lịch hẹn
                id: patientPrefill?.code ||
                    patientPrefill?.maBenhNhan ||
                    latest?.MaBenhNhan ||
                    latest?.patientCode ||
                    "",
                // Tên ưu tiên:
                // 1. từ prefill (check-in truyền qua)
                // 2. nếu không có thì lấy từ lịch hẹn: TenBenhNhan / HoTen / patientName
                name:
                  patientPrefill?.name ||
                  latest?.TenBenhNhan ||
                  latest?.HoTen ||
                  latest?.patientName ||
                  "",
        
                // SĐT nếu BE có trả:
                phone:
                  patientPrefill?.phone ||
                  latest?.SoDienThoai ||
                  latest?.DienThoai ||
                  latest?.phone ||
                  "",
        
                // giữ luôn bản ghi lịch hẹn để tab tạo sau này muốn lấy thêm
                latestAppointment: latest || null,
              },
            });
          }}
          onOpenFilter={() => {
            setFilterAnchor(filterBtnRef.current);
            setFilterOpen(true);
          }}
          onResetFilters={() =>
            setFilter({
              keyword: "",
              accountStatus: "all",
              todayStatus: "all",
              todayOnly: false,
            })
          }
          sort={sort}
          onChangeSort={setSort}
          filterBtnRef={filterBtnRef}
        />

        <div className="mt-0 flex-1 min-h-0">
          <PatientsTable
            items={filtered}
            onAction={handleAction}
            stretch
            highlightPid={highlightPid}
          />
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
              const wasAddMode = modal.mode === "add";
              setModal({ open: false, mode: "view", patient: null });
              
              // Nếu đang ở mode Add thì clear luôn prefill sau khi đóng modal
              if (wasAddMode) {
                clearPatientPrefill();
              }
            }}
            onSaved={(p) => {
                       // đóng modal
                       setModal({ open: false, mode: "view", patient: null });
                       // điều hướng + focus vào BN vừa thao tác
                       const pid = p?.id || p?.pid || p?.MaBenhNhan || p?.maBenhNhan;
                       if (pid) {
                         nav(`/patients?pid=${encodeURIComponent(pid)}`);
                       }
                     }}
                     onSave={async (data) => {
                       if (modal.mode === "add") {
                         // createPatient (mutateAsync) trả về entity đã lưu
                         return await createPatient(data);
                       }
                       // update
                       return await updatePatient({
                         id: data?.id || data?.pid,
                         patch: data,
                       });
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
                    
                      await updatePatientStatus({
                        id: pid,
                        ...payload,
                      });
                    }}
                    
          />
        )}
      </AnimatePresence>
    </motion.main>
  );
}
