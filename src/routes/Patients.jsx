import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import PatientsToolbar from "../components/patients/PatientsToolbar.jsx";
import PatientsTable from "../components/patients/PatientsTable.jsx";
import PatientsFilterPopover from "../components/patients/PatientsFilterPopover.jsx";
import PatientModal from "../components/patients/PatientModal.jsx";

import { usePatientsList, useCreatePatient, useUpdatePatient } from "../api/patients";
import { useUIStore } from "../components/stores/uiStore.js";
import useViewportVH from "../hooks/useViewportVH";
import useMediaQuery from "../hooks/useMediaQuery";

// Nhãn trạng thái tham khảo (không bắt buộc)
export const STATUSES = {
  WAIT_INTAKE: "Chờ tiếp nhận",
  WAIT_EXAM: "Chờ khám",
  WAIT_PROC: "Chờ xử lý",
  SCHEDULED_APPT: "Hẹn khám",
  SCHEDULED_FUP: "Hẹn tái khám",
  DONE: "Hoàn thành",
};

const todayStr = () => {
  try {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

function normStatus(p) {
  // map linh hoạt theo ERD/field thực tế
  const todayStatus =
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
    p?.ngay_trang_thai ??
    p?.statusDate ??
    "";
  return String(v || "").trim();
}

export default function Patients() {
  useViewportVH();
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  
  const topbar = isMobile ? 64 : isTablet ? 72 : 80; // giữ không đổi nếu bạn đang dùng

  const nav = useNavigate();
  const { search } = useLocation();
  const sp = new URLSearchParams(search);

  // === Bộ lọc
  const [filter, setFilter] = useState({
    keyword: "",
    // hôm nay (theo ERD)
    todayStatus: "Tất cả",
    // tài khoản
    accountStatus: "all",
    // chỉ hôm nay (lọc ngày trạng thái == hôm nay)
    todayOnly: false,
  });
  const [viewMode, setViewMode] = useState("today");
  const [sort, setSort] = useState("priority");
  const [modal, setModal] = useState({ open: false, mode: "view", patient: null });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterBtnRef = useRef(null);
  const [filterAnchor, setFilterAnchor] = useState(null);

  // === UI store
  const highlightPid = useUIStore((s) => s.highlightPid);
  const clearHighlight = useUIStore((s) => s.clearHighlight);

  const flashAddAt = useUIStore((s) => s.flashAddAt);
  const ackFlashAdd = useUIStore((s) => s.ackFlashAdd);

  const patientPrefill = useUIStore((s) => s.patientPrefill);
  const clearPatientPrefill = useUIStore((s) => s.clearPatientPrefill);

  // === Tải danh sách từ API (server đã lọc theo keyword nếu backend hỗ trợ)
  const { data: items = [] } = usePatientsList({
    keyword: filter.keyword || undefined,
    // Giữ status server-side nếu bạn muốn, còn lại lọc ở FE
    status: filter.todayStatus === "Tất cả" ? undefined : filter.todayStatus,
  });
  const { mutateAsync: createPatient } = useCreatePatient();
  const { mutateAsync: updatePatient } = useUpdatePatient();

  // query-open modal (giữ logic cũ)
  useEffect(() => {
    const pid = sp.get("pid");
    const action = sp.get("action");
    const defaultCode = sp.get("defaultCode") || "";
    const defaultName = sp.get("defaultName") || "";
    const focus = sp.get("focus") === "true";

    if (pid && focus) {
      const p = items.find((x) => x.id === pid || x.pid === pid);
      if (p) setModal({ open: true, mode: "view", patient: p });
    } else if (action === "add") {
      setModal({
        open: true,
        mode: "add",
        patient: { id: defaultCode || "", name: defaultName || "", status: STATUSES.WAIT_INTAKE },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, items]);

  // auto clear highlight
  useEffect(() => {
    if (!highlightPid) return;
    const t = setTimeout(() => clearHighlight(), 5000);
    return () => clearTimeout(t);
  }, [highlightPid, clearHighlight]);

  // flash nút + Thêm khi có prefill
  useEffect(() => {
    if (!flashAddAt) return;
    const btn = document.getElementById("patients-add-btn");
    if (btn) {
      try { btn.focus(); } catch {}
      btn.classList.add("flash-once");
      const t = setTimeout(() => {
        btn.classList.remove("flash-once");
        ackFlashAdd();
      }, 5000);
      return () => {
        clearTimeout(t);
        try { btn.classList.remove("flash-once"); } catch {}
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
      clearPatientPrefill();
    };
  }, [clearPatientPrefill]);

  // Lọc FE theo ERD
  const filtered = useMemo(() => {
    let arr = Array.isArray(items) ? items.slice() : [];

    
    if (filter.accountStatus && filter.accountStatus !== "all") {
         const tgt = String(filter.accountStatus).toLowerCase(); // code
         arr = arr.filter((p) => {
           const code = String(p.trang_thai_tai_khoan || p.accountStatus || "hoat_dong").toLowerCase();
           return code === tgt;
         });
       }

    // today status
    if (filter.todayStatus && filter.todayStatus !== "Tất cả") {
      arr = arr.filter((p) => normStatus(p).toLowerCase() === filter.todayStatus.toLowerCase());
    }

    // chỉ hôm nay
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
          p?.id, p?.pid, p?.name, p?.ho_ten,
          p?.phone, p?.dien_thoai, p?.email,
        ].map((x) => String(x || "").toLowerCase());
        return bag.some((s) => s.includes(kw));
      });
    }
// sort
const normName = (p) =>
  (p.name || p.ho_ten || "").toString().toLowerCase().trim();

const priorityScore = (p) => {
  const s = normStatus(p).toLowerCase();
  if (/chờ tiếp nhận/.test(s)) return 50;
  if (/chờ khám/.test(s)) return 40;
  if (/chờ xử lý/.test(s)) return 30;
  if (/đang khám/.test(s)) return 20;
  if (/hoàn thành/.test(s)) return 10;
  if (/hủy|huỷ/.test(s)) return 0;
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

  const counts = useMemo(() => {
    const s = (p) => normStatus(p).toLowerCase();
    const is = (p, labels) => labels.some((l) => s(p) === l.toLowerCase());
  
    const done = items.filter((p) => s(p) === "hoàn thành").length;
    const waitExam = items.filter((p) => is(p, ["Chờ khám", "Chờ khám (dịch vụ)"])).length;
    const waitProc = items.filter((p) => is(p, ["Chờ xử lý", "Chờ xử lý (dịch vụ)"])).length;
    const waitIntake = items.filter((p) => is(p, ["Chờ tiếp nhận", "Chờ tiếp nhận (dịch vụ)"])).length;
    const cancelled = items.filter((p) => /hủy|huỷ/.test(s(p))).length;
    const inExam = items.filter((p) => is(p, ["Đang khám", "Đang khám (dịch vụ)"])).length;
  
    return { done, waitExam, waitProc, waitIntake, cancelled, inExam };
  }, [items]);
  

  function handleAction(type, p) {
    clearPatientPrefill();
    if (type === "view") {
      setModal({ open: true, mode: "view", patient: p });
    } else if (type === "edit") {
      setModal({ open: true, mode: "edit", patient: p });
    } else if (type === "intake") {
      setModal({ open: true, mode: "exam", patient: p });
    } else if (type === "process") {
      setModal({ open: true, mode: "process", patient: p });
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

      <div className="mt-2 flex flex-col min-h-0 h-[calc(var(--app-dvh)-var(--topbar-h)+1px)]"
        style={{ "--topbar-h": `${topbar}px` }}>
        <PatientsToolbar
          counts={counts}
          viewMode={viewMode}
          onChangeViewMode={setViewMode}
          onAdd={() => setModal({ open: true, mode: "add", patient: patientPrefill ? { name: patientPrefill?.name || "" } : {} })}
          onOpenFilter={() => {
            setFilterAnchor(filterBtnRef.current);
            setFilterOpen(true);
          }}
          onResetFilters={() =>
            setFilter({
              keyword: "",
              accountStatus: "all",
              todayStatus: "Tất cả",
            })
          }
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
  
      <PatientsFilterPopover
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={filter}
        setValues={(v) => setFilter((s) => ({ ...s, ...v }))}
        anchorEl={filterAnchor || filterBtnRef}
        sort={sort}
        onChangeSort={setSort}
      />
  
      {/* Modal BN */}
      <AnimatePresence>
          {modal.open && (
            <PatientModal
              open={modal.open}
              mode={modal.mode}
              patient={modal.patient}
              onClose={() => setModal({ open: false, mode: "view", patient: null })}
              onSave={async (data) => {
                if (modal.mode === "add") {
                  await createPatient(data);
                } else {
                  await updatePatient({ id: data?.id || data?.pid, patch: data });
                }
                setModal({ open: false, mode: "view", patient: null });
              }}
              onMutatePatient={async (patch) => {
                const id = modal?.patient?.id || modal?.patient?.pid;
                if (!id) return;
                await updatePatient({ id, patch });
              }}
            />
          )}
        </AnimatePresence>

    </motion.main>
  );
 
}
